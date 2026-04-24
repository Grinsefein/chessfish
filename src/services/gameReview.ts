import { Chess } from 'chess.js';

export interface MoveAnalysis {
  moveNumber: number;
  san: string;
  fen: string;
  evaluation: number;
  previousEval: number;
  centipawnLoss: number;
  classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  topMoves: string[];
  isBookMove: boolean;
}

export interface GameReview {
  accuracy: { white: number; black: number };
  totalMoves: number;
  classifications: {
    white: Record<string, number>;
    black: Record<string, number>;
  };
  moveAnalyses: MoveAnalysis[];
  averageCPL: { white: number; black: number };
  openingName?: string;
  openingEco?: string;
  summary: string;
  suggestions: string[];
}

// Classification thresholds (centipawn loss)
const THRESHOLDS = {
  brilliant: -Infinity, // Special: only for sacrifices or difficult finds
  great: 10,
  best: 10,
  excellent: 25,
  good: 50,
  inaccuracy: 100,
  mistake: 300,
  blunder: Infinity // Everything above 300
};

function classifyMove(centipawnLoss: number, isBestMove: boolean, isSacrifice: boolean): MoveAnalysis['classification'] {
  if (isSacrifice && centipawnLoss < 50) return 'brilliant';
  if (isBestMove || centipawnLoss <= THRESHOLDS.great) return 'best';
  if (centipawnLoss <= THRESHOLDS.excellent) return 'excellent';
  if (centipawnLoss <= THRESHOLDS.good) return 'good';
  if (centipawnLoss <= THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (centipawnLoss <= THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}

export async function analyzeGame(
  pgn: string,
  evaluateFen: (fen: string, depth?: number) => Promise<number>
): Promise<GameReview | null> {
  try {
    const game = new Chess();
    game.loadPgn(pgn);

    const history = game.history({ verbose: true });
    const moveAnalyses: MoveAnalysis[] = [];
    
    // Reset game to start
    const analysisGame = new Chess();
    
    // Analyze each move
    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      const fenBefore = analysisGame.fen();
      
      // Get evaluation before move
      const evalBefore = await evaluateFen(fenBefore, 15);
      
      // Get top moves (Multi-PV analysis)
      const topMoves = await getTopMoves(fenBefore, 3, evaluateFen);
      
      // Make the move
      analysisGame.move(move);
      const fenAfter = analysisGame.fen();
      
      // Get evaluation after move
      const evalAfter = await evaluateFen(fenAfter, 15);
      
      // Calculate centipawn loss
      // For white, positive is good; for black, we need to invert
      let centipawnLoss: number;
      if (move.color === 'w') {
        centipawnLoss = Math.max(0, evalBefore - evalAfter);
      } else {
        centipawnLoss = Math.max(0, evalAfter - evalBefore);
      }
      
      const isBestMove = topMoves.length > 0 && topMoves[0] === move.san;
      const isSacrifice = isSacrificeMove(move, fenBefore, fenAfter);
      
      const classification = classifyMove(centipawnLoss, isBestMove, isSacrifice);
      
      moveAnalyses.push({
        moveNumber: Math.floor(i / 2) + 1,
        san: move.san,
        fen: fenBefore,
        evaluation: evalAfter,
        previousEval: evalBefore,
        centipawnLoss,
        classification,
        topMoves,
        isBookMove: false // Could be determined by checking against opening database
      });
    }

    // Calculate accuracy
    const whiteMoves = moveAnalyses.filter(m => m.san && moveAnalyses.indexOf(m) % 2 === 0);
    const blackMoves = moveAnalyses.filter(m => m.san && moveAnalyses.indexOf(m) % 2 === 1);
    
    const accuracy = {
      white: calculateAccuracy(whiteMoves),
      black: calculateAccuracy(blackMoves)
    };

    // Count classifications
    const classifications = {
      white: countClassifications(whiteMoves),
      black: countClassifications(blackMoves)
    };

    // Calculate average CPL
    const averageCPL = {
      white: Math.round(whiteMoves.reduce((sum, m) => sum + m.centipawnLoss, 0) / (whiteMoves.length || 1)),
      black: Math.round(blackMoves.reduce((sum, m) => sum + m.centipawnLoss, 0) / (blackMoves.length || 1))
    };

    // Generate suggestions
    const suggestions = generateSuggestions(moveAnalyses, accuracy);

    // Generate summary
    const summary = generateSummary(moveAnalyses, accuracy, averageCPL);

    return {
      accuracy,
      totalMoves: history.length,
      classifications,
      moveAnalyses,
      averageCPL,
      summary,
      suggestions
    };
  } catch (error) {
    console.error('Failed to analyze game:', error);
    return null;
  }
}

async function getTopMoves(
  fen: string, 
  count: number,
  evaluateFen: (fen: string, depth?: number) => Promise<number>
): Promise<string[]> {
  // This is a simplified version - in production, use Stockfish Multi-PV
  // For now, return empty array as we'll use the engine's top move
  return [];
}

function isSacrificeMove(move: any, fenBefore: string, fenAfter: string): boolean {
  // Simple heuristic: if material was lost and it wasn't a capture
  const gameBefore = new Chess(fenBefore);
  const gameAfter = new Chess(fenAfter);
  
  // Count material
  const countMaterial = (game: Chess) => {
    const board = game.board();
    let value = 0;
    for (const row of board) {
      for (const piece of row) {
        if (piece) {
          const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
          const val = pieceValues[piece.type] || 0;
          value += piece.color === 'w' ? val : -val;
        }
      }
    }
    return value;
  };
  
  const materialBefore = countMaterial(gameBefore);
  const materialAfter = countMaterial(gameAfter);
  
  // If material decreased for the side that moved, it might be a sacrifice
  if (move.color === 'w' && materialAfter < materialBefore) {
    return true;
  }
  if (move.color === 'b' && materialAfter > materialBefore) {
    return true;
  }
  
  return false;
}

function calculateAccuracy(moves: MoveAnalysis[]): number {
  if (moves.length === 0) return 0;
  
  // Accuracy formula based on centipawn loss
  // Lower CPL = higher accuracy
  const maxCPL = 300;
  let totalAccuracy = 0;
  
  for (const move of moves) {
    const cappedCPL = Math.min(move.centipawnLoss, maxCPL);
    const moveAccuracy = Math.max(0, 100 - (cappedCPL / maxCPL) * 100);
    totalAccuracy += moveAccuracy;
  }
  
  return Math.round(totalAccuracy / moves.length);
}

function countClassifications(moves: MoveAnalysis[]): Record<string, number> {
  const counts: Record<string, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0
  };
  
  for (const move of moves) {
    counts[move.classification]++;
  }
  
  return counts;
}

function generateSuggestions(moveAnalyses: MoveAnalysis[], accuracy: { white: number; black: number }): string[] {
  const suggestions: string[] = [];
  
  // Find most frequent mistake type
  const whiteBlunders = moveAnalyses.filter(m => m.classification === 'blunder' && moveAnalyses.indexOf(m) % 2 === 0).length;
  const blackBlunders = moveAnalyses.filter(m => m.classification === 'blunder' && moveAnalyses.indexOf(m) % 2 === 1).length;
  
  const whiteMistakes = moveAnalyses.filter(m => m.classification === 'mistake' && moveAnalyses.indexOf(m) % 2 === 0).length;
  const blackMistakes = moveAnalyses.filter(m => m.classification === 'mistake' && moveAnalyses.indexOf(m) % 2 === 1).length;
  
  if (accuracy.white < 60) {
    suggestions.push('White: Focus on basic tactics and piece safety. Consider taking more time on each move.');
  }
  if (accuracy.black < 60) {
    suggestions.push('Black: Focus on basic tactics and piece safety. Consider taking more time on each move.');
  }
  
  if (whiteBlunders > 2) {
    suggestions.push('White made several blunders. Practice calculating variations more carefully.');
  }
  if (blackBlunders > 2) {
    suggestions.push('Black made several blunders. Practice calculating variations more carefully.');
  }
  
  if (whiteMistakes > 3) {
    suggestions.push('White made multiple mistakes in piece placement. Review opening principles.');
  }
  if (blackMistakes > 3) {
    suggestions.push('Black made multiple mistakes in piece placement. Review opening principles.');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Great game! Both players showed strong understanding of chess principles.');
  }
  
  return suggestions;
}

function generateSummary(moveAnalyses: MoveAnalysis[], accuracy: { white: number; black: number }, averageCPL: { white: number; black: number }): string {
  const totalMoves = moveAnalyses.length;
  const whiteWins = accuracy.white > accuracy.black + 10;
  const blackWins = accuracy.black > accuracy.white + 10;
  
  let summary = `A ${totalMoves}-move game with `;
  
  if (whiteWins) {
    summary += 'White showing superior accuracy. ';
  } else if (blackWins) {
    summary += 'Black showing superior accuracy. ';
  } else {
    summary += 'both sides showing similar accuracy. ';
  }
  
  summary += `White averaged ${averageCPL.white} centipawn loss, Black averaged ${averageCPL.black}. `;
  
  const totalBlunders = moveAnalyses.filter(m => m.classification === 'blunder').length;
  if (totalBlunders === 0) {
    summary += 'No blunders were made - a well-played game!';
  } else if (totalBlunders <= 2) {
    summary += `Only ${totalBlunders} blunder(s) in the entire game.`;
  } else {
    summary += `${totalBlunders} blunders impacted the result.`;
  }
  
  return summary;
}

export function getClassificationColor(classification: string): string {
  const colors: Record<string, string> = {
    brilliant: '#7c3aed', // purple
    great: '#22c55e', // green
    best: '#16a34a', // dark green
    excellent: '#4ade80', // light green
    good: '#86efac', // lighter green
    inaccuracy: '#facc15', // yellow
    mistake: '#fb923c', // orange
    blunder: '#ef4444' // red
  };
  return colors[classification] || '#9ca3af';
}

export function getClassificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    brilliant: '!! Brilliant',
    great: '! Great',
    best: 'Best',
    excellent: 'Excellent',
    good: 'Good',
    inaccuracy: '?! Inaccuracy',
    mistake: '? Mistake',
    blunder: '?? Blunder'
  };
  return labels[classification] || classification;
}
