import React, { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Trash2, Download } from 'lucide-react';

const PIECES = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'];

interface BoardEditorProps {
  onFenChange: (fen: string) => void;
  initialFen?: string;
}

export function BoardEditor({ onFenChange, initialFen }: BoardEditorProps) {
  const [game, setGame] = useState(new Chess(initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [turn, setTurn] = useState<'w' | 'b'>('w');

  const fen = useMemo(() => game.fen(), [game]);

  const handleSquareClick = ({ square }: { square: string }) => {
    if (!selectedPiece) return;

    const gameCopy = new Chess(game.fen());
    const file = square[0];
    const rank = square[1];
    
    // Place the piece
    const board = gameCopy.board();
    const row = 8 - parseInt(rank);
    const col = file.charCodeAt(0) - 97;
    
    if (board[row] && board[row][col]) {
      const squareName = square as any;
      board[row][col] = {
        square: squareName,
        type: selectedPiece.toLowerCase() as any,
        color: selectedPiece === selectedPiece.toUpperCase() ? 'w' : 'b',
      };
      
      // Reconstruct the game from the board
      const newFen = boardToFen(board, turn);
      setGame(new Chess(newFen));
      onFenChange(newFen);
    }
  };

  const boardToFen = (board: any[][], currentTurn: 'w' | 'b'): string => {
    let fen = '';
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          const piece = board[row][col];
          const symbol = piece.type === 'p' ? 'P' : 
                         piece.type === 'r' ? 'R' : 
                         piece.type === 'n' ? 'N' : 
                         piece.type === 'b' ? 'B' : 
                         piece.type === 'q' ? 'Q' : 'K';
          fen += piece.color === 'w' ? symbol : symbol.toLowerCase();
        } else {
          empty++;
        }
      }
      if (empty > 0) {
        fen += empty;
      }
      if (row < 7) fen += '/';
    }
    fen += ` ${currentTurn} KQkq - 0 1`;
    return fen;
  };

  const clearSquare = (square: string) => {
    const gameCopy = new Chess(game.fen());
    const file = square[0];
    const rank = square[1];
    
    const board = gameCopy.board();
    const row = 8 - parseInt(rank);
    const col = file.charCodeAt(0) - 97;
    
    if (board[row]) {
      board[row][col] = null;
      const newFen = boardToFen(board, turn);
      setGame(new Chess(newFen));
      onFenChange(newFen);
    }
  };

  const resetBoard = () => {
    const newGame = new Chess();
    setGame(newGame);
    setTurn('w');
    onFenChange(newGame.fen());
  };

  const clearBoard = () => {
    const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
    setGame(new Chess(emptyFen));
    onFenChange(emptyFen);
  };

  const copyFen = () => {
    navigator.clipboard.writeText(fen);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Board Editor</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetBoard}>
                <RotateCcw size={16} className="mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={clearBoard}>
                <Trash2 size={16} className="mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={copyFen}>
                <Download size={16} className="mr-2" />
                Copy FEN
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Piece Selection */}
            <div className="flex flex-wrap gap-2">
              {PIECES.map((piece) => (
                <button
                  key={piece}
                  onClick={() => setSelectedPiece(selectedPiece === piece ? null : piece)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                    selectedPiece === piece
                      ? 'border-primary bg-primary/20 scale-110'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {getPieceSymbol(piece)}
                </button>
              ))}
            </div>

            {/* Turn Selection */}
            <div className="flex gap-2">
              <Button
                variant={turn === 'w' ? 'default' : 'outline'}
                onClick={() => setTurn('w')}
                className="flex-1"
              >
                White to move
              </Button>
              <Button
                variant={turn === 'b' ? 'default' : 'outline'}
                onClick={() => setTurn('b')}
                className="flex-1"
              >
                Black to move
              </Button>
            </div>

            {/* Board */}
            <div className="aspect-square max-w-[400px] mx-auto">
              {/* @ts-ignore */}
              <Chessboard
                options={{
                  position: fen,
                  onSquareClick: handleSquareClick,
                  boardOrientation: "white" as const,
                  squareStyles: selectedPiece ? {
                    'a1': { backgroundColor: 'rgba(255,255,0,0.3)' },
                    'a8': { backgroundColor: 'rgba(255,255,0,0.3)' },
                    'h1': { backgroundColor: 'rgba(255,255,0,0.3)' },
                    'h8': { backgroundColor: 'rgba(255,255,0,0.3)' },
                  } : {}
                }}
              />
            </div>

            {/* FEN Display */}
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Current FEN:</div>
              <div className="font-mono text-sm break-all">{fen}</div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Select a piece above, then click a square to place it</div>
              <div>• Right-click a square to remove the piece</div>
              <div>• Use "Reset" to start from initial position</div>
              <div>• Use "Clear" to remove all pieces</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPieceSymbol(piece: string): string {
  const symbols: { [key: string]: string } = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };
  return symbols[piece] || piece;
}
