import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Brain, RotateCcw, CheckCircle2, XCircle, ArrowRight, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDuePuzzles, recordPuzzleResult, getPuzzleStats } from '@/services/puzzleGenerator';

interface PuzzleModeProps {
  userId?: string;
}

export const PuzzleMode: React.FC<PuzzleModeProps> = ({ userId }) => {
  const [puzzles, setPuzzles] = useState<Array<{
    id: string;
    fen: string;
    solutionMove: string;
    classification: string;
  }> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState<'playing' | 'correct' | 'incorrect' | 'loading'>('loading');
  const [stats, setStats] = useState({ total: 0, solved: 0, successRate: 0 });
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPuzzles(userId);
    }
  }, [userId]);

  const loadPuzzles = async (uid: string) => {
    const duePuzzles = await getDuePuzzles(uid, 20);
    const puzzleStats = await getPuzzleStats(uid);
    
    setPuzzles(duePuzzles.map(p => ({
      id: p.id!,
      fen: p.fen,
      solutionMove: p.solutionMove,
      classification: p.classification
    })));
    setStats(puzzleStats);
    
    if (duePuzzles.length > 0) {
      setGame(new Chess(duePuzzles[0].fen));
      setStatus('playing');
    } else {
      setStatus('playing');
    }
  };

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (status !== 'playing' || !puzzles) return false;

    const currentPuzzle = puzzles[currentIndex];
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });

    if (!move) return false;

    // Check if move matches solution
    const playedMove = `${sourceSquare}${targetSquare}`;
    const isCorrect = playedMove === currentPuzzle.solutionMove || 
                      move.san === currentPuzzle.solutionMove;

    if (isCorrect) {
      setStatus('correct');
      if (userId) {
        recordPuzzleResult(currentPuzzle.id, true);
      }
    } else {
      setStatus('incorrect');
      if (userId) {
        recordPuzzleResult(currentPuzzle.id, false);
      }
      // Undo the wrong move
      game.undo();
      setGame(new Chess(game.fen()));
    }

    return true;
  };

  const handleNext = () => {
    if (!puzzles) return;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < puzzles.length) {
      setCurrentIndex(nextIndex);
      setGame(new Chess(puzzles[nextIndex].fen));
      setStatus('playing');
      setShowHint(false);
    }
  };

  const handleRetry = () => {
    if (!puzzles) return;
    setGame(new Chess(puzzles[currentIndex].fen));
    setStatus('playing');
    setShowHint(false);
  };

  const getClassificationColor = (c: string) => {
    switch (c) {
      case 'blunder': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'mistake': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'missed_win': return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    }
  };

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Brain className="w-16 h-16 text-zinc-600 mb-4" />
        <p className="text-zinc-400">Sign in to practice your mistakes</p>
      </div>
    );
  }

  if (!puzzles || puzzles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Trophy className="w-16 h-16 text-teal-500 mb-4" />
        <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
        <p className="text-zinc-400 max-w-md">
          No puzzles due for review. Analyze more games to generate puzzles from your mistakes.
        </p>
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Total</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="text-2xl font-bold text-green-500">{stats.solved}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Solved</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="text-2xl font-bold text-primary">{stats.successRate}%</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Rate</div>
          </div>
        </div>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-white">Practice Mistakes</h3>
            <p className="text-xs text-zinc-500">
              Puzzle {currentIndex + 1} of {puzzles.length}
            </p>
          </div>
        </div>
        
        <div className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-bold uppercase border",
          getClassificationColor(currentPuzzle.classification)
        )}>
          {currentPuzzle.classification.replace('_', ' ')}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 p-4 flex items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md aspect-square rounded-xl overflow-hidden border-4 border-zinc-800 shadow-2xl">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onPieceDrop}
            boardWidth={400}
            customBoardStyle={{
              borderRadius: '0'
            }}
          />
        </div>
      </div>

      {/* Status / Controls */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-4">
        {status === 'playing' && (
          <>
            <p className="text-sm text-zinc-400 text-center">
              Find the best move for {game.turn() === 'w' ? 'White' : 'Black'}
            </p>
            
            {showHint && (
              <p className="text-sm text-primary text-center bg-primary/10 rounded-lg p-2">
                Look for {currentPuzzle.solutionMove.slice(0, 2)} → {currentPuzzle.solutionMove.slice(2, 4)}
              </p>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold text-sm hover:bg-zinc-700 hover:text-white transition-colors"
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
          </>
        )}

        {status === 'correct' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold">Correct! Well done.</span>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
            >
              Next Puzzle
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'incorrect' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              <span className="font-bold">Not quite right</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2">
          {puzzles.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < currentIndex ? "bg-green-500" :
                i === currentIndex ? "bg-primary" : "bg-zinc-800"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
