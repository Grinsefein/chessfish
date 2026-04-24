import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { useGameStore } from "@/store/gameStore";
import { useEngineStore } from "@/store/engineStore";
import { useAudio } from "@/hooks/useAudio";
import { usePerformanceScaling } from "@/hooks/usePerformanceScaling";
import { BOTS } from "@/lib/bots";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { 
  Monitor,
  Cloud,
  Settings as SettingsIcon
} from "lucide-react";

import { ChessboardErrorBoundary } from "@/components/ErrorBoundary";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { SystemCockpit } from "@/components/SystemCockpit";
import { EngineAnalysisBar } from "@/components/EngineAnalysisBar";
import { BotMatchDialog } from "@/components/BotMatchDialog";
import { MoveHistory } from "@/components/MoveHistory";

import { Chess, type Square } from 'chess.js';
import { cn } from '@/lib/utils';

export default function ChessApp() {
  const gameStore = useGameStore();
  const {
    fen,
    turn,
    isGameOver,
    history,
    lastMove,
    makeMove: makeGameMove,
    undoMove,
    resetGame,
    exportPgn,
  } = gameStore;

  const engineStore = useEngineStore();
  const {
    status: engineStatus,
    currentEvaluation,
    bestMove: engineBestMove,
    lines: engineLines,
    isAnalyzing,
    activeView,
    setActiveView
  } = engineStore;

  const { stats, getDifficultyAdjustment } = usePerformanceScaling();
  
  const [selectedBot, setSelectedBot] = useState(BOTS[0]);
  const [showSystemCockpit, setShowSystemCockpit] = useState(false);
  const [showBotMatchDialog, setShowBotMatchDialog] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewFen = useMemo(() => {
    if (previewIndex === null) return null;
    const tempGame = new Chess();
    for (let i = 0; i <= previewIndex; i++) {
      tempGame.move(history[i]);
    }
    return tempGame.fen();
  }, [history, previewIndex]);

  const boardFen = previewFen || fen;
  const game = useMemo(() => new Chess(boardFen), [boardFen]);

  // Bot logic
  useEffect(() => {
    if (activeView === 'play' && turn === 'b' && !isGameOver && previewIndex === null) {
      if (engineBestMove && engineStatus === 'ready') {
        const adjustment = getDifficultyAdjustment(selectedBot.elo);
        const dynamicThinkTime = Math.max(100, (selectedBot.thinkTime / 2) + adjustment.thinkTimeBonus);
        
        const timer = setTimeout(() => {
          makeGameMove({
            from: engineBestMove.substring(0, 2),
            to: engineBestMove.substring(2, 4),
            promotion: engineBestMove.length > 4 ? engineBestMove[4] : 'q'
          });
        }, dynamicThinkTime); 
        return () => clearTimeout(timer);
      } else if (engineStatus === 'ready' && !isAnalyzing) {
        engineStore.analyze(fen);
      }
    }
  }, [turn, activeView, isGameOver, engineBestMove, engineStatus, isAnalyzing, makeGameMove, selectedBot, getDifficultyAdjustment, engineStore, fen, previewIndex]);

  // Board Options Configuration
  const boardOptions = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove && previewIndex === null) {
      styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }

    if (game.inCheck()) {
      const kingPos = game.board().flat().find(p => p?.type === 'k' && p.color === game.turn());
      if (kingPos) {
        styles[kingPos.square] = {
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          borderRadius: '50%'
        };
      }
    }

    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(255, 255, 255, 0.2)' };
      try {
        const moves = game.moves({ square: selectedSquare as Square, verbose: true });
        moves.forEach((m) => {
          styles[m.to] = {
            background: m.captured 
              ? 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.4) 65%)'
              : 'radial-gradient(circle, rgba(0,0,0,0.4) 20%, transparent 25%)',
            borderRadius: '50%'
          };
        });
      } catch (e) {
        // Ignore invalid squares
      }
    }

    return {
      position: boardFen,
      boardOrientation: (turn === 'w' ? 'white' : 'black') as 'white' | 'black',
      animationDurationInMs: 200,
      allowDragging: previewIndex === null && (activeView === 'analyze' || turn === 'w'),
      squareStyles: styles,
      darkSquareStyle: { backgroundColor: 'hsla(94, 29%, 40%, 1)' },
      lightSquareStyle: { backgroundColor: 'hsla(60, 30%, 90%, 1)' },
      onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string }) => {
        if (previewIndex !== null) return false;
        setSelectedSquare(null);
        const move = makeGameMove({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q'
        });
        return !!move;
      },
      onSquareClick: ({ square }: { square: string }) => {
        if (previewIndex !== null) return;
        
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }

        if (selectedSquare) {
          const move = makeGameMove({
            from: selectedSquare,
            to: square,
            promotion: 'q'
          });
          
          if (move) {
            setSelectedSquare(null);
            return;
          }
        }

        try {
          const piece = game.get(square as Square);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        } catch (e) {
          setSelectedSquare(null);
        }
      },
      onPieceDrag: ({ square }: { square: string }) => {
        setSelectedSquare(square);
      }
    };
  }, [boardFen, turn, previewIndex, activeView, lastMove, selectedSquare, game, makeGameMove]);

  const evalPercentage = useMemo(() => {
    if (engineLines[0]?.isMate) {
      return currentEvaluation > 0 ? 100 : 0;
    }
    const capped = Math.max(-10, Math.min(10, currentEvaluation));
    return ((capped + 10) / 20) * 100;
  }, [currentEvaluation, engineLines]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-foreground font-sans selection:bg-primary/20 relative overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenBotMatch={() => setShowBotMatchDialog(true)}
          onOpenImport={() => {}} 
        />
        
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Header */}
          <header className="w-full h-14 px-8 flex items-center justify-between border-b border-zinc-900 bg-zinc-950 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button className="flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-white transition-all">
                  <Monitor size={14} /> Local
                </button>
                <button className="flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-all">
                  <Cloud size={14} /> Cloud
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", engineStatus === 'ready' ? "bg-green-500" : "bg-zinc-500")} />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  {engineStatus === 'ready' ? 'Ready' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {previewIndex !== null && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPreviewIndex(null)}
                  className="h-7 px-3 rounded-md border-primary/30 bg-primary/10 text-primary font-bold uppercase text-[9px] tracking-widest hover:bg-primary/20"
                >
                  Return to Live
                </Button>
              )}
              <button onClick={() => setShowSystemCockpit(true)} className="text-zinc-500 hover:text-white transition-colors">
                <SettingsIcon size={16} />
              </button>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-xs text-white">CF</div>
            </div>
          </header>

          <main className="flex-1 flex flex-col xl:flex-row gap-8 p-6 items-center xl:items-start justify-center">
            {/* Eval Bar */}
            <div className="hidden lg:flex flex-col items-center gap-2 py-2 h-[480px] self-center">
              <div className="w-6 h-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col-reverse relative">
                <motion.div 
                  className="bg-white w-full transition-all duration-700 ease-out z-0 relative"
                  animate={{ height: `${evalPercentage}%` }}
                />
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-700 z-10" />
                <div className={cn("absolute left-0 w-full text-center font-bold text-[9px] z-20 mix-blend-difference", currentEvaluation >= 0 ? 'top-2' : 'bottom-2')}>
                  {engineLines[0]?.isMate ? (currentEvaluation > 0 ? `M${Math.abs(currentEvaluation)}` : `-M${Math.abs(currentEvaluation)}`) : (currentEvaluation > 0 ? `+${currentEvaluation.toFixed(1)}` : currentEvaluation.toFixed(1))}
                </div>
              </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 max-w-[600px] w-full flex flex-col gap-4">
              <div className="w-full aspect-square relative rounded-xl overflow-hidden border-[10px] border-zinc-900 shadow-xl">
                <ChessboardErrorBoundary>
                  {/* @ts-ignore - This custom Chessboard build expects options prop */}
                  <Chessboard options={boardOptions} />
                </ChessboardErrorBoundary>
              </div>
              <EngineAnalysisBar />
            </div>

            {/* Move History */}
            <MoveHistory 
              history={history}
              onPreviewMove={setPreviewIndex}
              previewIndex={previewIndex}
              onExportPgn={exportPgn}
              onExportFen={() => navigator.clipboard.writeText(boardFen)}
              onOpenSettings={() => setShowSystemCockpit(true)}
              onUndo={undoMove}
              onResign={() => resetGame()}
            />
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <BotMatchDialog 
        open={showBotMatchDialog} 
        onOpenChange={setShowBotMatchDialog} 
        onStartMatch={(bot) => {
          setSelectedBot(bot);
          setShowBotMatchDialog(false);
          setActiveView('play');
          resetGame();
          setPreviewIndex(null);
        }}
      />
      
      <SystemCockpit 
        open={showSystemCockpit}
        onOpenChange={setShowSystemCockpit}
      />
    </div>
  );
}
