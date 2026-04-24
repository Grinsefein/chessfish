import { Chess, PieceSymbol, Color } from 'chess.js';

export interface MaterialScore {
  w: number; // White's material
  b: number; // Black's material
  difference: number; // Positive if White is ahead, negative if Black is ahead
}

export interface CapturedPieces {
  w: PieceSymbol[]; // Pieces white has captured from black
  b: PieceSymbol[]; // Pieces black has captured from white
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

// Start with the standard 16 pieces per side
const INITIAL_PIECE_COUNTS: Record<PieceSymbol, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1
};

export function getCapturedPiecesAndMaterial(fen: string): { captured: CapturedPieces, score: MaterialScore } {
  const game = new Chess(fen);
  const board = game.board();

  let wScore = 0;
  let bScore = 0;

  const currentCounts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
  };

  // Count current pieces on the board
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        currentCounts[piece.color][piece.type]++;
        if (piece.color === 'w') {
          wScore += PIECE_VALUES[piece.type];
        } else {
          bScore += PIECE_VALUES[piece.type];
        }
      }
    }
  }

  // Calculate captured pieces (what's missing from the board)
  const captured: CapturedPieces = { w: [], b: [] };

  const pieceTypes: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']; // Sort order for display

  for (const type of pieceTypes) {
    // White captures are missing Black pieces
    const missingBlack = Math.max(0, INITIAL_PIECE_COUNTS[type] - currentCounts.b[type]);
    for (let i = 0; i < missingBlack; i++) {
      captured.w.push(type);
    }

    // Black captures are missing White pieces
    const missingWhite = Math.max(0, INITIAL_PIECE_COUNTS[type] - currentCounts.w[type]);
    for (let i = 0; i < missingWhite; i++) {
      captured.b.push(type);
    }
  }

  return {
    captured,
    score: {
      w: wScore,
      b: bScore,
      difference: wScore - bScore
    }
  };
}
