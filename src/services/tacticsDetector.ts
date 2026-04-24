import { Chess, Square } from 'chess.js';

export interface Tactic {
  type: 'fork' | 'pin' | 'skewer' | 'discovered' | 'loose_piece' | 'mate_threat';
  attacker?: string;
  target?: string;
  targets?: string[];
  direction?: string;
  description: string;
}

// Get all squares a piece attacks
function getAttackedSquares(game: Chess, square: Square, color: 'w' | 'b'): string[] {
  const moves = game.moves({ square, verbose: true });
  return moves.map(m => m.to);
}

// Check if a piece is defended
function isDefended(game: Chess, square: Square, color: 'w' | 'b'): boolean {
  const board = game.board();
  const opponentColor = color === 'w' ? 'b' : 'w';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        const pieceSquare = String.fromCharCode(97 + col) + (8 - row) as Square;
        const attacked = getAttackedSquares(game, pieceSquare, opponentColor);
        if (attacked.includes(square)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Detect forks (one piece attacks two+ valuable pieces)
export function detectForks(fen: string): Tactic[] {
  const game = new Chess(fen);
  const tactics: Tactic[] = [];
  const board = game.board();
  const turn = game.turn();
  
  // Knights are the main forking pieces
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === turn && piece.type === 'n') {
        const square = String.fromCharCode(97 + col) + (8 - row) as Square;
        const attackedSquares = getAttackedSquares(game, square, turn);
        
        // Count attacked valuable pieces (not pawns)
        const valuableTargets: string[] = [];
        for (const targetSq of attackedSquares) {
          const targetPiece = game.get(targetSq as Square);
          if (targetPiece && targetPiece.color !== turn && 
              ['n', 'b', 'r', 'q', 'k'].includes(targetPiece.type)) {
            valuableTargets.push(targetSq);
          }
        }
        
        if (valuableTargets.length >= 2) {
          tactics.push({
            type: 'fork',
            attacker: square,
            targets: valuableTargets,
            description: `Knight on ${square} forks ${valuableTargets.join(' and ')}`
          });
        }
      }
    }
  }
  
  return tactics;
}

// Detect pins (piece can't move because it shields a more valuable piece)
export function detectPins(fen: string): Tactic[] {
  const game = new Chess(fen);
  const tactics: Tactic[] = [];
  const board = game.board();
  const turn = game.turn();
  const opponentColor = turn === 'w' ? 'b' : 'w';
  
  // Get all sliding pieces (queen, rook, bishop)
  const slidingPieces: Array<{square: Square, type: string}> = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor && 
          ['q', 'r', 'b'].includes(piece.type)) {
        slidingPieces.push({
          square: String.fromCharCode(97 + col) + (8 - row) as Square,
          type: piece.type
        });
      }
    }
  }
  
  // For each sliding piece, check lines
  for (const attacker of slidingPieces) {
    const directions = attacker.type === 'r' 
      ? [[0,1], [0,-1], [1,0], [-1,0]] // Rook: orthogonal
      : attacker.type === 'b'
      ? [[1,1], [1,-1], [-1,1], [-1,-1]] // Bishop: diagonal
      : [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]; // Queen: both
    
    for (const [dx, dy] of directions) {
      let col = attacker.square.charCodeAt(0) - 97 + dx;
      let row = 8 - parseInt(attacker.square[1]) + dy;
      let piecesInLine: Array<{square: string, piece: any}> = [];
      
      while (col >= 0 && col < 8 && row >= 0 && row < 8) {
        const square = String.fromCharCode(97 + col) + (8 - row) as Square;
        const piece = game.get(square);
        
        if (piece) {
          piecesInLine.push({ square, piece });
          if (piecesInLine.length === 2) break;
        }
        
        col += dx;
        row += dy;
      }
      
      // Pin exists if: first piece is opponent's, second is king
      if (piecesInLine.length === 2 && 
          piecesInLine[0].piece.color === turn &&
          piecesInLine[1].piece.type === 'k') {
        tactics.push({
          type: 'pin',
          attacker: attacker.square,
          target: piecesInLine[0].square,
          description: `${piecesInLine[0].piece.type} on ${piecesInLine[0].square} is pinned to king`
        });
      }
    }
  }
  
  return tactics;
}

// Detect loose pieces (undefended and underattack or can be attacked)
export function detectLoosePieces(fen: string): Tactic[] {
  const game = new Chess(fen);
  const tactics: Tactic[] = [];
  const board = game.board();
  const turn = game.turn();
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === turn && piece.type !== 'k' && piece.type !== 'p') {
        const square = String.fromCharCode(97 + col) + (8 - row) as Square;
        
        if (!isDefended(game, square, turn)) {
          const pieceName = piece.type === 'n' ? 'Knight' : 
                          piece.type === 'b' ? 'Bishop' :
                          piece.type === 'r' ? 'Rook' :
                          piece.type === 'q' ? 'Queen' : 'Piece';
          
          tactics.push({
            type: 'loose_piece',
            target: square,
            description: `${pieceName} on ${square} is undefended`
          });
        }
      }
    }
  }
  
  return tactics;
}

// Detect simple mate threats (checks that could lead to mate)
export function detectMateThreats(fen: string): Tactic[] {
  const game = new Chess(fen);
  const tactics: Tactic[] = [];
  const turn = game.turn();
  
  // Get all opponent moves and see which give check
  const moves = game.moves({ verbose: true });
  
  for (const move of moves) {
    game.move(move);
    if (game.inCheck()) {
      // Check if this leads to mate
      const responses = game.moves();
      if (responses.length < 3) {
        // Likely dangerous check
        tactics.push({
          type: 'mate_threat',
          attacker: move.from,
          target: move.to,
          description: `${move.piece} to ${move.to} gives dangerous check`
        });
      }
    }
    game.undo();
  }
  
  return tactics;
}

// Main function: detect all tactics in a position
export function detectAllTactics(fen: string): Tactic[] {
  const tactics: Tactic[] = [];
  
  try {
    tactics.push(...detectForks(fen));
    tactics.push(...detectPins(fen));
    tactics.push(...detectLoosePieces(fen));
    tactics.push(...detectMateThreats(fen));
  } catch (e) {
    console.error('Tactics detection error:', e);
  }
  
  return tactics;
}

// Format tactics for AI commentary
export function formatTacticsForPrompt(tactics: Tactic[]): string {
  if (tactics.length === 0) return 'No immediate tactics detected.';
  
  const lines = tactics.map(t => {
    switch (t.type) {
      case 'fork': return `- Fork: ${t.description}`;
      case 'pin': return `- Pin: ${t.description}`;
      case 'loose_piece': return `- Loose piece: ${t.description}`;
      case 'mate_threat': return `- Check: ${t.description}`;
      default: return `- ${t.type}: ${t.description}`;
    }
  });
  
  return lines.join('\n');
}
