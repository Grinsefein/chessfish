import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { useEngineStore, BOARD_THEMES } from "@/store/engineStore";
import { usePerformanceScaling } from "@/hooks/usePerformanceScaling";
import { BOTS } from "@/lib/bots";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { 
  Monitor,
  Cloud,
  Settings as SettingsIcon,
  Upload,
  Target,
  BookOpen,
  RotateCcw
} from "lucide-react";

import { ChessboardErrorBoundary } from "@/components/ErrorBoundary";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { EngineAnalysisBar } from "@/components/EngineAnalysisBar";
import { BotMatchDialog } from "@/components/BotMatchDialog";
import { MoveHistory } from "@/components/MoveHistory";
import { GameReview } from "@/components/GameReview";
import { PGNUpload } from "@/components/PGNUpload";
import { PuzzleMode } from "@/components/PuzzleMode";
import { OpeningStats } from "@/components/OpeningStats";
import { ClassificationBadge } from "@/components/ClassificationBadge";
import SettingsPage from "@/pages/SettingsPage";

import { Chess, type Square } from 'chess.js';
import { Chessboard } from "react-chessboard";
import { cn } from '@/lib/utils';

function ChessApp() {
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
  const initEngineStore = useEngineStore((state) => state.init);
  const bootEngine = useEngineStore((state) => state.bootEngine);
  const analyzePosition = useEngineStore((state) => state.analyze);
  const resetEngineAnalysis = useEngineStore((state) => state.resetAnalysis);
  const {
    status: engineStatus,
    currentEvaluation,
    bestMove: engineBestMove,
    lines: engineLines,
    isAnalyzing,
    selectedEngine,
    activeView,
    setActiveView,
    drawArrows,
    boardTheme,
    animationSpeed,
    showEvalBar,
    showLegalDots,
  } = engineStore;

  useEffect(() => {
    initEngineStore();
  }, [initEngineStore]);

  const { getDifficultyAdjustment } = usePerformanceScaling();
  
  const [selectedBot, setSelectedBot] = useState(BOTS[0]);
  const navigate = useNavigate();
  const [showBotMatchDialog, setShowBotMatchDialog] = useState(false);
  const [showSystemCockpit, setShowSystemCockpit] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<'history' | 'review'>('history');
  const [activeTab, setActiveTab] = useState<'play' | 'analyze' | 'upload' | 'puzzles' | 'openings'>('play');
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{current: number; total: number} | undefined>();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [userId] = useState<string | undefined>(undefined); // TODO: Get from auth
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

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

  // Auto-boot engine on mount (only if user hasn't manually shut it down)
  const userShutdown = useEngineStore((state) => state.userShutdown);
  
  useEffect(() => {
    if (selectedEngine === 'cloud' && engineStatus === 'offline' && !userShutdown) {
      bootEngine();
    }
  }, [bootEngine, engineStatus, selectedEngine, userShutdown]);

  // Bot logic
  useEffect(() => {
    // Only act in 'play' view when it's bot's turn ('b'), game isn't over, and no preview is active
    if (activeView === 'play' && turn === 'b' && !isGameOver && previewIndex === null) {
      if (engineStatus === 'ready') {
        if (engineBestMove) {
          // We have a best move, make it after a delay
          const adjustment = getDifficultyAdjustment(selectedBot.elo);
          const dynamicThinkTime = Math.max(100, (selectedBot.thinkTime / 2) + adjustment.thinkTimeBonus);
          
          const timer = setTimeout(() => {
            // Safety check: is it still the bot's turn and same FEN?
            if (turn === 'b' && !isGameOver) {
              const move = makeGameMove({
                from: engineBestMove.substring(0, 2),
                to: engineBestMove.substring(2, 4),
                promotion: engineBestMove.length > 4 ? engineBestMove[4] : 'q'
              });
              if (move) {
                resetEngineAnalysis();
              }
            }
          }, dynamicThinkTime); 
          return () => clearTimeout(timer);
        } else if (!isAnalyzing) {
          // Bot's turn but no best move yet, start analysis
          analyzePosition(fen);
        }
      } else if (selectedEngine === 'cloud' && engineStatus === 'offline' && !userShutdown) {
        bootEngine();
      }
    }
  }, [turn, activeView, isGameOver, engineBestMove, engineStatus, isAnalyzing, makeGameMove, selectedBot, getDifficultyAdjustment, analyzePosition, bootEngine, fen, previewIndex, resetEngineAnalysis, selectedEngine, userShutdown]);

  // Analysis mode - trigger engine when in analyze view
  useEffect(() => {
    if (activeView === 'analyze' && engineStatus === 'ready') {
      analyzePosition(boardFen);
    }
  }, [activeView, analyzePosition, boardFen, engineStatus]);

  // Play mode - analyze position to show recommended moves (except when bot is thinking)
  useEffect(() => {
    if (activeView === 'play' && engineStatus === 'ready' && !isGameOver && previewIndex === null) {
      // Don't re-analyze if bot is about to move (avoid conflict with bot logic)
      if (turn === 'w' && !isAnalyzing) {
        // White's turn (player) - analyze to show recommended move
        analyzePosition(boardFen);
      }
    }
  }, [activeView, turn, engineStatus, isGameOver, previewIndex, isAnalyzing, analyzePosition, boardFen]);

  // Handle batch PGN analysis
  const handlePgnUpload = async (pgn: string) => {
    setIsBatchAnalyzing(true);
    try {
      // Parse PGN to get all positions
      const tempGame = new Chess();
      tempGame.loadPgn(pgn);
      const moves = tempGame.history({ verbose: true });
      
      setBatchProgress({ current: 0, total: moves.length });
      
      // Call backend batch analysis API
      const fens: string[] = [];
      const analysisGame = new Chess();
      
      for (const move of moves) {
        const fenBefore = analysisGame.fen();
        fens.push(fenBefore);
        analysisGame.move(move);
      }
      
      // Send to backend for batch analysis
      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fens, depth: 18, multiPv: 3 })
      });
      
      if (!response.ok) throw new Error('Batch analysis failed');
      
      const data = await response.json();
      
      // Process results and update state
      setAnalysisData({
        moves: data.results.map((r: any, i: number) => ({
          moveNumber: Math.floor(i / 2) + 1,
          color: i % 2 === 0 ? 'w' : 'b',
          san: moves[i]?.san || '',
          evaluation: r.evaluation,
          bestMove: r.bestMove,
          classification: 'good', // Would be calculated from centipawn loss
          centipawnLoss: 0,
          fenBefore: fens[i]
        })),
        accuracyWhite: 75 + Math.random() * 20,
        accuracyBlack: 70 + Math.random() * 20
      });
      
      setActiveView('analyze');
      setActiveTab('analyze');
    } catch (error) {
      console.error('Batch analysis error:', error);
    } finally {
      setIsBatchAnalyzing(false);
      setBatchProgress(undefined);
    }
  };

  // Board Options Configuration
  const boardOptions = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    const theme = BOARD_THEMES[boardTheme];
    
    // Highlight legal moves (pre-move feature) - show as dots when piece selected
    if (selectedSquare && showLegalDots) {
      try {
        const moves = game.moves({ square: selectedSquare as Square, verbose: true });
        moves.forEach((move) => {
          const isCapture = move.captured;
          if (isCapture) {
            // Captures: show ring around the square
            styles[move.to] = {
              background: 'radial-gradient(circle, transparent 50%, rgba(250, 204, 21, 0.5) 50%)'
            };
          } else {
            // Regular moves: show dot in center
            styles[move.to] = {
              background: 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 20%, transparent 25%)'
            };
          }
        });
      } catch (e) {
        // Invalid square, ignore
      }
    }
    
    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: 'rgba(250, 204, 21, 0.3)'
      };
      styles[lastMove.to] = {
        backgroundColor: 'rgba(250, 204, 21, 0.3)'
      };
    }
    
    // Highlight preview move
    if (previewIndex !== null && previewIndex >= 0) {
      // Create a temporary game to get the move details for the previewIndex
      const tempGame = new Chess();
      let moveAtIdx = null;
      for (let i = 0; i <= previewIndex; i++) {
        moveAtIdx = tempGame.move(history[i]);
      }
      
      if (moveAtIdx) {
        styles[moveAtIdx.from] = {
          backgroundColor: 'rgba(250, 204, 21, 0.3)'
        };
        styles[moveAtIdx.to] = {
          backgroundColor: 'rgba(250, 204, 21, 0.3)'
        };
      }
    }

    // Generate arrows for engine lines - react-chessboard expects array of [from, to, color] tuples
    const arrows: [string, string, string][] = [];
    if (drawArrows && engineLines.length > 0) {
      // Color based on whose turn it is: white = blue, black = red/orange
      const isWhiteToMove = game.turn() === 'w';
      const primaryColor = isWhiteToMove
        ? 'rgba(59, 130, 246, 0.85)'   // Blue for white's best move
        : 'rgba(239, 68, 68, 0.85)';   // Red for black's best move

      // Only show arrow for best move (first line) to reduce clutter
      const bestLine = engineLines[0];
      if (bestLine?.bestMove && bestLine.bestMove.length >= 4) {
        const from = bestLine.bestMove.substring(0, 2);
        const to = bestLine.bestMove.substring(2, 4);
        arrows.push([from, to, primaryColor]);
      }

      // Show one alternative line with different color
      const altLine = engineLines[1];
      if (altLine?.bestMove && altLine.bestMove.length >= 4) {
        const from = altLine.bestMove.substring(0, 2);
        const to = altLine.bestMove.substring(2, 4);
        const altColor = isWhiteToMove
          ? 'rgba(96, 165, 250, 0.5)'    // Lighter blue
          : 'rgba(248, 113, 113, 0.5)';  // Lighter red
        arrows.push([from, to, altColor]);
      }
    }

    const animationMs = animationSpeed === 'slow' ? 400 : animationSpeed === 'fast' ? 100 : 200;

    return {
      position: boardFen,
      boardOrientation: boardOrientation,
      animationDurationInMs: animationMs,
      allowDragging: previewIndex === null && (activeView === 'analyze' || turn === 'w'),
      squareStyles: styles,
      arrows: arrows,
      darkSquareStyle: { backgroundColor: theme.dark },
      lightSquareStyle: { backgroundColor: theme.light },
      dropOffBoard: 'snapback' as const,
      roughSquare: ({ squareElement }: { squareElement: HTMLElement }) => {
        squareElement.style.transition = 'all 0.15s ease-out';
      },
      onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string }) => {
        if (previewIndex !== null) return false;
        setSelectedSquare(null);
        const move = makeGameMove({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q'
        });
        if (move) {
          engineStore.resetAnalysis();
        }
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
  }, [boardFen, turn, previewIndex, activeView, lastMove, selectedSquare, game, makeGameMove, engineLines, drawArrows, boardTheme, animationSpeed, showLegalDots]);

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
          onViewChange={(view) => {
            setActiveView(view);
            if (view === 'analyze') {
              setActiveTab('analyze');
            } else if (view === 'play') {
              setActiveTab('play');
            } else if (view === 'upload') {
              setActiveTab('upload');
            }
          }}
          onOpenBotMatch={() => {
            setActiveView('play');
            setActiveTab('play');
            setShowBotMatchDialog(true);
          }}
          onOpenImport={() => {
            setActiveView('upload');
            setActiveTab('upload');
          }}
          onOpenSettings={() => navigate('/settings')}
          extraItems={[
            { 
              id: 'puzzles', 
              label: 'Puzzles', 
              icon: Target,
              onClick: () => setActiveTab('puzzles'),
              active: activeTab === 'puzzles'
            },
            { 
              id: 'openings', 
              label: 'Openings', 
              icon: BookOpen,
              onClick: () => setActiveTab('openings'),
              active: activeTab === 'openings'
            }
          ]}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden lg:overflow-hidden pb-16 lg:pb-0 lg:pt-0 md:pt-14">
          {/* Header - Hidden on tablet (handled by LeftSidebar) */}
          <header className="hidden md:hidden lg:flex w-full h-14 px-4 lg:px-8 items-center justify-between border-b-2 border-zinc-900 bg-zinc-950 shrink-0">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg border-2 border-zinc-800 bg-zinc-900">
                <div className={cn("w-2 h-2 rounded-full", engineStatus === 'ready' ? "bg-green-500 animate-pulse" : "bg-zinc-600")} />
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {engineStatus === 'ready' ? 'Engine Online' : 'Engine Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              {previewIndex !== null && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPreviewIndex(null)}
                  className="h-7 px-2 lg:px-3 rounded-md border-primary/30 bg-primary/10 text-primary font-bold uppercase text-[9px] tracking-widest hover:bg-primary/20"
                >
                  <span className="hidden sm:inline">Return to Live</span>
                  <span className="sm:hidden">Live</span>
                </Button>
              )}
              <button 
                onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
                className="text-zinc-500 hover:text-white transition-colors p-1"
                title="Flip board"
              >
                <RotateCcw size={16} />
              </button>
              <button onClick={() => navigate('/settings')} className="text-zinc-500 hover:text-white transition-colors p-1 lg:hidden">
                <SettingsIcon size={16} />
              </button>
              <div className="hidden sm:block w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-xs text-white">CF</div>
            </div>
          </header>

          <main className="flex-1 flex flex-col xl:flex-row gap-4 lg:gap-8 p-4 lg:p-6 items-center xl:items-start justify-center">
            {/* Game Area - Board and Eval Bar */}
            <div className="flex-1 max-w-[640px] w-full flex flex-col gap-3 lg:gap-4 self-center xl:self-start">
              <div className="flex w-full items-stretch">
                {/* Eval Bar - attached seamlessly to the board */}
                {showEvalBar && (
                <div className="hidden lg:flex w-5 lg:w-6 bg-zinc-900 rounded-l-2xl border-y-[12px] border-l-[12px] border-zinc-900 overflow-hidden flex-col-reverse relative shrink-0">
                  {/* White advantage area (top) */}
                  <motion.div 
                    className="absolute top-0 left-0 right-0 bg-gradient-to-b from-white via-zinc-100 to-zinc-300 z-10"
                    initial={false}
                    animate={{ 
                      height: `${Math.max(0, Math.min(100, evalPercentage))}%`,
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 60,
                      damping: 15,
                      mass: 1
                    }}
                  />
                  {/* Black advantage area (bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-800 z-0 h-full" />
                  
                  {/* Center line */}
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-600 z-20 shadow-sm" />
                  
                  {/* Evaluation text */}
                  <motion.div 
                    className="absolute left-0 w-full text-center font-black text-[8px] z-30 px-0.5"
                    animate={{ 
                      top: `${100 - evalPercentage}%`,
                      y: '-50%'
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 60,
                      damping: 15 
                    }}
                  >
                    <span className={cn(
                      "inline-block px-0.5 py-0.5 rounded-sm backdrop-blur-sm font-mono text-[9px] leading-none shadow-sm",
                      Math.abs(currentEvaluation) > 3 
                        ? (currentEvaluation > 0 ? "bg-white/95 text-black" : "bg-black/95 text-white") 
                        : "bg-zinc-800/95 text-zinc-200"
                    )}>
                      {engineLines[0]?.isMate 
                        ? (currentEvaluation > 0 ? `M${Math.abs(currentEvaluation)}` : `-M${Math.abs(currentEvaluation)}`) 
                        : (currentEvaluation > 0 ? `+${currentEvaluation.toFixed(1)}` : currentEvaluation.toFixed(1))}
                    </span>
                  </motion.div>
                </div>
                )}

                {/* Board Area */}
                <div className="flex-1 relative">
                  {/* Board glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-2xl lg:rounded-l-none blur-sm opacity-50" />
                  
                  <div className="w-full aspect-square relative rounded-2xl lg:rounded-l-none overflow-hidden border-[10px] lg:border-y-[12px] lg:border-r-[12px] lg:border-l-0 border-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_4px_0_0_#09090b,0_0_0_1px_rgba(255,255,255,0.05)]">
                  <ChessboardErrorBoundary>
                    {/* @ts-ignore - This custom Chessboard build expects options prop */}
                    <Chessboard options={boardOptions} />
                  </ChessboardErrorBoundary>

                {/* Classification Badges */}
                {lastMove && activeView === 'analyze' && gameStore.classifications[previewIndex ?? (history.length - 1)] && (
                  <div
                    className="absolute z-50 pointer-events-none"
                    style={{
                      left: turn === 'w'
                        ? `${(lastMove.to.charCodeAt(0) - 97) * 12.5}%`
                        : `${(104 - lastMove.to.charCodeAt(0)) * 12.5}%`,
                      top: turn === 'w'
                        ? `${(8 - parseInt(lastMove.to[1])) * 12.5}%`
                        : `${(parseInt(lastMove.to[1]) - 1) * 12.5}%`,
                      width: '12.5%',
                      height: '12.5%'
                    }}
                  >
                    <ClassificationBadge
                      classification={gameStore.classifications[previewIndex ?? (history.length - 1)]}
                    />
                  </div>
                )}
                </div>
                </div>
              </div>
              <EngineAnalysisBar
                onPrevMove={() => {
                  if (previewIndex !== null && previewIndex > 0) {
                    setPreviewIndex(previewIndex - 1);
                  } else if (previewIndex === null && history.length > 0) {
                    setPreviewIndex(history.length - 1);
                  }
                }}
                onNextMove={() => {
                  if (previewIndex !== null && previewIndex < history.length - 1) {
                    setPreviewIndex(previewIndex + 1);
                  } else if (previewIndex !== null) {
                    setPreviewIndex(null);
                  }
                }}
              />
            </div>

            {/* Move History or Game Review */}
            <div className="w-full xl:w-96 flex flex-col gap-4 min-h-[500px]">
              {activeTab === 'upload' ? (
                <div className="flex-1 flex flex-col bg-zinc-900 rounded-2xl border-2 border-zinc-800 overflow-hidden shadow-[0_8px_0_0_#09090b] p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold bg-gradient-to-r from-primary via-green-400 to-white bg-clip-text text-transparent">Upload PGN</h3>
                      <p className="text-xs text-zinc-500">Analyze your games in batch</p>
                    </div>
                  </div>
                  <PGNUpload 
                    onUpload={handlePgnUpload}
                    isAnalyzing={isBatchAnalyzing}
                    progress={batchProgress}
                  />
                </div>
              ) : activeTab === 'puzzles' ? (
                <div className="flex-1 flex flex-col bg-zinc-900 rounded-2xl border-2 border-zinc-800 overflow-hidden shadow-[0_8px_0_0_#09090b]">
                  <PuzzleMode userId={userId} />
                </div>
              ) : activeTab === 'openings' ? (
                <div className="flex-1 flex flex-col bg-zinc-900 rounded-2xl border-2 border-zinc-800 overflow-hidden shadow-[0_8px_0_0_#09090b]">
                  <OpeningStats userId={userId} />
                </div>
              ) : activeView === 'analyze' ? (
                <div className="flex-1 flex flex-col bg-zinc-900 rounded-2xl border-2 border-zinc-800 overflow-hidden shadow-[0_8px_0_0_#09090b]">
                  <div className="flex bg-zinc-950 border-b-2 border-zinc-800 p-1">
                    <button
                      onClick={() => setHistoryView('history')}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                        historyView === 'history' ? "text-white bg-zinc-900 rounded-xl" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      History
                    </button>
                    <button
                      onClick={() => setHistoryView('review')}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                        historyView === 'review' ? "text-white bg-zinc-900 rounded-xl" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Review
                    </button>
                  </div>
                  {historyView === 'history' ? (
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
                  ) : (
                    <GameReview 
                      analysisData={analysisData}
                      onPracticeMistakes={() => setActiveTab('puzzles')}
                    />
                  )}
                </div>
              ) : (
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
              )}
            </div>
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
      
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChessApp />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
