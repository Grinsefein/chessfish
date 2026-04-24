import { Chess } from 'chess.js';
import { supabase } from '@/lib/supabase';
import { getCachedPosition, cachePosition } from './positionCache';
import { detectAllTactics, formatTacticsForPrompt } from './tacticsDetector';

export interface MoveAnalysis {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  evaluation: number;
  previousEval: number;
  bestMove: string;
  pv?: string;
  classification: 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'missed_win' | 'book';
  centipawnLoss: number;
  isBookMove: boolean;
  tactics: ReturnType<typeof detectAllTactics>;
}

export interface BatchAnalysisResult {
  gameId: string;
  moves: MoveAnalysis[];
  accuracyWhite: number;
  accuracyBlack: number;
  averageCPLWhite: number;
  averageCPLBlack: number;
  openingEco?: string;
  openingName?: string;
}

// Classification thresholds
const THRESHOLDS = {
  brilliant: -Infinity,
  great: 10,
  best: 10,
  excellent: 25,
  good: 50,
  inaccuracy: 100,
  mistake: 300,
  blunder: Infinity
};

function classifyMove(cpl: number, isBestMove: boolean, evalSwing: number): MoveAnalysis['classification'] {
  if (isBestMove || cpl <= THRESHOLDS.great) return 'best';
  if (cpl <= THRESHOLDS.excellent) return 'excellent';
  if (cpl <= THRESHOLDS.good) return 'good';
  if (cpl <= THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (cpl <= THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}

function calculateAccuracy(cpls: number[]): number {
  if (cpls.length === 0) return 0;
  const maxCPL = 300;
  const total = cpls.reduce((sum, cpl) => {
    const capped = Math.min(cpl, maxCPL);
    return sum + Math.max(0, 100 - (capped / maxCPL) * 100);
  }, 0);
  return Math.round(total / cpls.length);
}

// Simple ECO detection (first 4-6 moves)
function detectOpening(moves: string[]): { eco?: string; name?: string } {
  // This is a simplified version - you could expand with full ECO database
  const opening = moves.slice(0, 10).join(' ');
  
  if (opening.includes('e4 e5 Nf3 Nc6 Bb5')) {
    return { eco: 'C60', name: 'Ruy Lopez' };
  } else if (opening.includes('e4 c5')) {
    return { eco: 'B20', name: 'Sicilian Defense' };
  } else if (opening.includes('d4 d5 c4')) {
    return { eco: 'D06', name: "Queen's Gambit" };
  } else if (opening.includes('e4 e5 f4')) {
    return { eco: 'C30', name: "King's Gambit" };
  } else if (opening.includes('d4 Nf6 c4 e6')) {
    return { eco: 'E00', name: "Catalan/Queen's Indian" };
  } else if (opening.includes('Nf3 d5 g3')) {
    return { eco: 'A07', name: "King's Indian Attack" };
  }
  
  return {};
}

// Main batch analysis function - to be called from backend
export async function analyzeGameBatch(
  pgn: string,
  evaluateFen: (fen: string, depth: number) => Promise<{ evaluation: number; bestMove: string; pv?: string }>,
  depth: number = 18,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchAnalysisResult | null> {
  try {
    const game = new Chess();
    if (!game.loadPgn(pgn)) {
      throw new Error('Invalid PGN');
    }
    
    const history = game.history({ verbose: true });
    const moveAnalyses: MoveAnalysis[] = [];
    const analysisGame = new Chess();
    
    // First pass: analyze all positions
    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      const fenBefore = analysisGame.fen();
      
      // Check cache first
      let cached = await getCachedPosition(fenBefore);
      let evalBefore: number;
      let bestMove: string;
      let pv: string | undefined;
      
      if (cached) {
        evalBefore = cached.evaluation;
        bestMove = cached.best_move;
        pv = cached.pv;
      } else {
        // Analyze with engine
        const result = await evaluateFen(fenBefore, depth);
        evalBefore = result.evaluation;
        bestMove = result.bestMove;
        pv = result.pv;
        
        // Cache the result
        await cachePosition(fenBefore, evalBefore, depth, bestMove, pv);
      }
      
      // Make the move
      analysisGame.move(move);
      const fenAfter = analysisGame.fen();
      
      // Get evaluation after move
      let evalAfter: number;
      cached = await getCachedPosition(fenAfter);
      
      if (cached) {
        evalAfter = cached.evaluation;
      } else {
        const result = await evaluateFen(fenAfter, depth);
        evalAfter = result.evaluation;
        await cachePosition(fenAfter, evalAfter, depth, result.bestMove, result.pv);
      }
      
      // Calculate centipawn loss
      let cpl: number;
      if (move.color === 'w') {
        cpl = Math.max(0, evalBefore - evalAfter);
      } else {
        cpl = Math.max(0, evalAfter - evalBefore);
      }
      
      // Detect if best move was played
      const isBestMove = move.lan === bestMove || move.san === bestMove;
      
      // Detect tactics
      const tactics = detectAllTactics(fenBefore);
      
      // Classify the move
      const classification = classifyMove(cpl, isBestMove, Math.abs(evalBefore - evalAfter));
      
      moveAnalyses.push({
        moveNumber: Math.floor(i / 2) + 1,
        color: move.color as 'w' | 'b',
        san: move.san,
        uci: move.lan,
        fenBefore,
        fenAfter,
        evaluation: evalAfter,
        previousEval: evalBefore,
        bestMove,
        pv,
        classification,
        centipawnLoss: Math.round(cpl * 100),
        isBookMove: i < 10, // First 10 moves considered book
        tactics
      });
      
      if (onProgress) {
        onProgress(i + 1, history.length);
      }
    }
    
    // Calculate stats
    const whiteCPLs = moveAnalyses.filter(m => m.color === 'w').map(m => m.centipawnLoss);
    const blackCPLs = moveAnalyses.filter(m => m.color === 'b').map(m => m.centipawnLoss);
    
    const opening = detectOpening(history.map(m => m.san));
    
    return {
      gameId: '', // Will be set by caller
      moves: moveAnalyses,
      accuracyWhite: calculateAccuracy(whiteCPLs),
      accuracyBlack: calculateAccuracy(blackCPLs),
      averageCPLWhite: Math.round(whiteCPLs.reduce((a, b) => a + b, 0) / (whiteCPLs.length || 1)),
      averageCPLBlack: Math.round(blackCPLs.reduce((a, b) => a + b, 0) / (blackCPLs.length || 1)),
      openingEco: opening.eco,
      openingName: opening.name
    };
    
  } catch (error) {
    console.error('Batch analysis failed:', error);
    return null;
  }
}

// Save analysis results to Supabase
export async function saveAnalysisResult(
  gameId: string,
  result: BatchAnalysisResult
): Promise<boolean> {
  try {
    // Update game with stats
    const { error: gameError } = await supabase
      .from('games')
      .update({
        accuracy_white: result.accuracyWhite,
        accuracy_black: result.accuracyBlack,
        average_cpl_white: result.averageCPLWhite,
        average_cpl_black: result.averageCPLBlack,
        opening_eco: result.openingEco,
        opening_name: result.openingName,
        total_moves: result.moves.length,
        analysis_status: 'completed',
        analysis_data: { moves: result.moves }
      })
      .eq('id', gameId);
    
    if (gameError) throw gameError;
    
    // Save individual moves
    const movesToInsert = result.moves.map(m => ({
      game_id: gameId,
      move_number: m.moveNumber,
      color: m.color,
      san: m.san,
      uci: m.uci,
      fen_before: m.fenBefore,
      fen_after: m.fenAfter,
      evaluation: m.evaluation,
      best_move: m.bestMove,
      classification: m.classification,
      centipawn_loss: m.centipawnLoss,
      is_book_move: m.isBookMove
    }));
    
    const { error: movesError } = await supabase
      .from('moves')
      .insert(movesToInsert);
    
    if (movesError) throw movesError;
    
    return true;
  } catch (error) {
    console.error('Failed to save analysis:', error);
    return false;
  }
}
