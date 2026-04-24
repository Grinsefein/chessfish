import React, { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const clearBoard = () => {
    const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
    setGame(new Chess(emptyFen));
    onFenChange(emptyFen);
  };

  const copyFen = () => {
    navigator.clipboard.writeText(fen);
  };

  const resetBoard = () => {
    const newGame = new Chess();
    setGame(newGame);
    setTurn('w');
    onFenChange(newGame.fen());
  };

  return (
    <div className="space-y-4 font-sans">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Board Editor</span>
            <div className="flex gap-2">
              <Button variant="outline" size="xs" onClick={resetBoard}>
                <RotateCcw size={14} className="mr-1.5" />
                Reset
              </Button>
              <Button variant="outline" size="xs" onClick={clearBoard}>
                <Trash2 size={14} className="mr-1.5" />
                Clear
              </Button>
              <Button variant="outline" size="xs" onClick={copyFen}>
                <Download size={14} className="mr-1.5" />
                Copy
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Piece Selection */}
            <div className="flex flex-wrap gap-2.5">
              {PIECES.map((piece) => (
                <button
                  key={piece}
                  onClick={() => setSelectedPiece(selectedPiece === piece ? null : piece)}
                  className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                    selectedPiece === piece
                      ? 'border-primary bg-primary/10 shadow-[0_4px_0_0_#4a6728] translate-y-[-2px]'
                      : 'border-2 border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  {getPieceSymbol(piece)}
                </button>
              ))}
            </div>

            {/* Turn Selection */}
            <div className="flex gap-3">
              <Button
                variant={turn === 'w' ? 'default' : 'outline'}
                onClick={() => setTurn('w')}
                className="flex-1"
                size="sm"
              >
                White to move
              </Button>
              <Button
                variant={turn === 'b' ? 'default' : 'outline'}
                onClick={() => setTurn('b')}
                className="flex-1"
                size="sm"
              >
                Black to move
              </Button>
            </div>

            {/* Board */}
            <div className="aspect-square max-w-[400px] mx-auto rounded-xl overflow-hidden border-2 border-zinc-800 shadow-[0_8px_0_0_#09090b]">
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
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.3)]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Current FEN</div>
              <div className="font-mono text-xs break-all text-zinc-300 leading-relaxed">{fen}</div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-zinc-800/50 rounded-xl border-2 border-zinc-800/50">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 space-y-1.5">
                <div>• Select a piece above, then click a square to place it</div>
                <div>• Right-click a square to remove the piece</div>
                <div>• Use "Reset" to start from initial position</div>
                <div>• Use "Clear" to remove all pieces</div>
              </div>
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
