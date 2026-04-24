import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { useGameStore } from "@/store/gameStore";
import { useEngineStore } from "@/store/engineStore";
import { useAudio } from "@/hooks/useAudio";
import { usePerformanceScaling } from "@/hooks/usePerformanceScaling";
import { BOTS } from "@/lib/bots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { 
  Trophy, 
  Settings, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sword, 
  Activity,
  Cpu,
  Brain,
  Cloud,
  Monitor,
  Download,
  Upload,
  GripVertical,
  Edit3,
  X
} from "lucide-react";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { ErrorBoundary, ChessboardErrorBoundary, AnalysisErrorBoundary } from "@/components/ErrorBoundary";
import { BoardEditor } from "@/components/BoardEditor";
import { OAuthConnections } from "@/components/OAuthConnections";
import { OpeningExplorer } from "@/components/OpeningExplorer";
import { GameReview } from "@/components/GameReview";
import { SystemCockpit } from "@/components/SystemCockpit";

import { Chess, type Square } from 'chess.js';
import { summarizeGame } from "@/services/geminiService";
import { getOpeningFromFEN, getOpeningExplorerData, type OpeningExplorerData } from "@/services/openings";
import { NNUEFile, NNUE_FILES } from "@/services/nnueService";
import { BOT_PERSONALITIES, getBotPersonality, personalityToBot, type BotPersonality } from "@/services/botCharacters";

const socket = io();

const PIECE_TYPES = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

export default function ChessApp() {
  // Game state from Zustand store with persistence
  const gameStore = useGameStore();
  const {
    fen,
    turn,
    isGameOver,
    isCheckmate,
    isDraw,
    history,
    lastMove,
    playerTime,
    botTime,
    makeMove: makeGameMove,
    undoMove,
    resetGame,
    loadPgn,
    exportPgn,
    decrementTimer,
    resetTimers
  } = gameStore;

  // Engine state from Zustand store
  const engineStore = useEngineStore();
  const {
    status: engineStatus,
    currentEvaluation,
    bestMove: engineBestMove,
    depth: engineDepth,
    lines: engineLines,
    worker: engineWorker,
    isAnalyzing,
  } = engineStore;

  const { stats, recordGameResult, getDifficultyAdjustment } = usePerformanceScaling();
  
  const [mode, setMode] = useState<'play' | 'analysis' | 'editor'>('play');
  const [engineMode, setEngineMode] = useState<'local' | 'cloud'>('local');
  const [cloudResult, setCloudResult] = useState<any>(null);
  const [selectedBotPersonality, setSelectedBotPersonality] = useState<BotPersonality>(BOT_PERSONALITIES[0]);
  const [selectedBot, setSelectedBot] = useState(BOTS[0]);
  const [botList, setBotList] = useState(BOTS);
  const [evalHistory, setEvalHistory] = useState<{ move: number; eval: number; notation: string }[]>([]);
  const [depthLimit, setDepthLimit] = useState(15);
  const [multiPVCount, setMultiPVCount] = useState(3);
  const [cloudDepth, setCloudDepth] = useState(24);
  const [cloudTime, setCloudTime] = useState(5000);
  const [showBotSelector, setShowBotSelector] = useState(false);
  const [openingInfo, setOpeningInfo] = useState<any>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showGameReview, setShowGameReview] = useState(false);
  const [showOpeningExplorer, setShowOpeningExplorer] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [showThreats, setShowThreats] = useState(false);
  const [showMoveStrength, setShowMoveStrength] = useState(false);
  const [moveEvaluations, setMoveEvaluations] = useState<{ [key: string]: number }>({});
  const [engineHash, setEngineHash] = useState(128);
  const [engineThreads, setEngineThreads] = useState(4);
  
  // System Cockpit modal state
  const [showSystemCockpit, setShowSystemCockpit] = useState(false);
  
  // Board interaction state
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportPGN = () => {
    const pgn = exportPgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game_${new Date().getTime()}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportPGN = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = loadPgn(content);
        if (!success) {
          console.error("Invalid PGN file");
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { playSound } = useAudio();

  // Fetch opening info from Lichess Explorer or similar
  useEffect(() => {
    if (mode === 'analysis' && fen) {
      const fetchOpening = async () => {
        try {
          const res = await fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`);
          if (res.ok) {
            const data = await res.json();
            setOpeningInfo(data);
          }
        } catch (e) {
          console.error("Failed to fetch opening info", e);
        }
      };
      fetchOpening();
    }
  }, [fen, mode]);

  // Play sound when move occurs
  useEffect(() => {
    if (history.length > 0) {
      playSound('move');
    }
  }, [fen, history.length, playSound]);
  useEffect(() => {
    socket.on("engine:result", (data) => {
      setCloudResult(data);
    });
    socket.on("connect_error", (err) => {
      setCloudResult({ error: `Cloud engine connection failed: ${err.message}` });
    });
    socket.on("error", (err) => {
      setCloudResult({ error: `Cloud engine error: ${err}` });
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect" || reason === "transport close") {
        setCloudResult({ error: "Cloud engine disconnected unexpectedly." });
      }
    });
    return () => {
      socket.off("engine:result");
      socket.off("connect_error");
      socket.off("error");
      socket.off("disconnect");
    };
  }, []);

  // Engine results from store
  const engineResult = useMemo(() => {
    return {
      evaluation: engineStore.currentEvaluation,
      bestMove: engineStore.bestMove ?? '',
      depth: engineStore.depth,
      lines: engineStore.lines,
      error: engineStore.status === 'error' ? engineStore.statusMessage : undefined
    };
  }, [engineStore]);

  // Record evaluation history
  useEffect(() => {
    if (engineResult) {
      setEvalHistory(prev => {
        const moveNumber = history.length;
        const lastMoveNotation = history[history.length - 1] || 'Start';
        if (prev.length > 0 && prev[prev.length - 1].move === moveNumber) return prev;
        return [...prev, { move: moveNumber, eval: engineResult.evaluation || 0, notation: lastMoveNotation }];
      });
    }
  }, [engineResult, history.length, history]);

  // Engine settings are now managed via the System Cockpit
  // The engineStore handles all engine configuration

  // Engine analysis is now triggered via the Engine Manager in System Cockpit

  // Evaluate all possible moves for move strength indicator
  // TODO: Implement using engine store
  useEffect(() => {
    if (!showMoveStrength || mode !== 'play' || isGameOver) return;
    // Move evaluation disabled until engine integration is complete
  }, [fen, showMoveStrength, mode, isGameOver]);

  // Fetch opening information
  useEffect(() => {
    const fetchOpening = async () => {
      if (history.length < 2) {
        setOpeningInfo(null);
        return;
      }
      
      const opening = await getOpeningFromFEN(fen);
      setOpeningInfo(opening);
    };
    
    fetchOpening();
  }, [fen, history]);

  // Bot logic with dynamic thinking time
  useEffect(() => {
    if (mode === 'play' && turn === 'b' && !isGameOver && engineResult?.bestMove) {
      const adjustment = getDifficultyAdjustment(selectedBot.elo);
      const dynamicThinkTime = Math.max(100, selectedBot.thinkTime + adjustment.thinkTimeBonus);
      
      const timer = setTimeout(() => {
        makeGameMove({
          from: engineResult.bestMove.substring(0, 2),
          to: engineResult.bestMove.substring(2, 4),
          promotion: engineResult.bestMove.length > 4 ? engineResult.bestMove[4] : 'q'
        });
      }, dynamicThinkTime);
      return () => clearTimeout(timer);
    }
  }, [turn, mode, isGameOver, engineResult, makeGameMove, selectedBot, getDifficultyAdjustment]);

  // Derived states for UI
  const evaluation = engineResult?.evaluation ?? 0;
  const evalPercentage = useMemo(() => {
    // Convert -10 to 10 range to 0-100%
    const capped = Math.max(-10, Math.min(10, evaluation));
    return ((capped + 10) / 20) * 100;
  }, [evaluation]);

  const runGameReview = useCallback(async () => {
    if (history.length === 0) return;
    setIsReviewing(true);

    try {
      // Build move history from stored history strings
      const tempGame = new Chess();
      const analysis: number[] = [];

      // Replay moves to analyze
      for (const moveSan of history) {
        try {
          tempGame.move(moveSan);
          // TODO: Get actual evaluation from engine store
          analysis.push(0);
        } catch (e) {
          break;
        }
      }

      // Identify blunders (diff > 2.0) - simplified without engine
      let blunders = 0;
      let mistakes = 0;
      let brilliant = 0;

      // Simplified analysis without engine for now
      const accuracy = 75; // Default accuracy
      const avgCPL = 50;   // Default CPL

      const review = {
        accuracy,
        blunders,
        mistakes,
        brilliant,
        avgCPL,
        summary: "Game analysis requires engine connection. Please use the System Cockpit to boot an engine."
      };
      
      setReviewData(review);
      const summaryText = await summarizeGame(history, review);
      setReviewData(prev => ({ ...prev, summary: summaryText }));
      
    } catch (e) {
      console.error("Game review failed", e);
    } finally {
      setIsReviewing(false);
    }
  }, [history]);

  // Chess timer countdown
  useEffect(() => {
    if (isGameOver || mode !== 'play') return;
    
    const interval = setInterval(() => {
      decrementTimer(turn);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [turn, isGameOver, mode]);

  // Record game results for scaling
  useEffect(() => {
    if (isGameOver && mode === 'play') {
       let result: 'win' | 'loss' | 'draw' = 'draw';
       if (isCheckmate) {
          // If it's your turn when checkmate happens, you lost
          result = turn === 'w' ? 'loss' : 'win';
       } else if (isDraw) {
          result = 'draw';
       }

       const accuracy = reviewData?.accuracy || 75; // Fallback to neutral Accuracy
       recordGameResult(result, selectedBot.elo, accuracy);
    }
  }, [isGameOver, mode, isCheckmate, isDraw, turn, selectedBot.elo, recordGameResult, reviewData?.accuracy]);

  const customPieces = useMemo(() => {
    const pieces: any = {};
    PIECE_TYPES.forEach((p) => {
      pieces[p] = ({ squareWidth, isDragging }: { squareWidth: number; isDragging: boolean }) => (
        <motion.div
          animate={{ 
            scale: isDragging ? 1.15 : 1,
            y: isDragging ? -10 : 0,
            filter: isDragging ? "drop-shadow(0 12px 24px rgba(0,0,0,0.4))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={{ 
            width: squareWidth, 
            height: squareWidth, 
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={`https://chessboardjs.com/img/chesspieces/wikipedia/${p}.png`}
            style={{ width: '90%', height: '90%' }}
            alt={p}
          />
        </motion.div>
      );
    });
    return pieces;
  }, []);

  // Calculate possible moves for highlighting
  const possibleMoves = useMemo(() => {
    if (!selectedSquare) return [];
    const gameCopy = new Chess(fen);
    const moves = gameCopy.moves({ square: selectedSquare as Square, verbose: true });
    return moves.map((move: any) => move.to as Square);
  }, [selectedSquare, fen]);

  // Calculate threats (squares under attack)
  const threats = useMemo(() => {
    if (!showThreats) return [];
    const gameCopy = new Chess(fen);
    const threatenedSquares: string[] = [];
    
    // Get all squares for the opponent
    const opponentColor = turn === 'w' ? 'b' : 'w';
    const allSquares: string[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const file = String.fromCharCode(97 + col);
        const rank = 8 - row;
        const square = file + rank;
        const piece = gameCopy.get(square as Square);
        if (piece && piece.color === opponentColor) {
          allSquares.push(square);
        }
      }
    }
    
    // Calculate all possible moves for opponent pieces
    allSquares.forEach(square => {
      const moves = gameCopy.moves({ square: square as Square, verbose: true });
      moves.forEach((move: any) => {
        if (!threatenedSquares.includes(move.to)) {
          threatenedSquares.push(move.to);
        }
      });
    });
    
    return threatenedSquares;
  }, [showThreats, fen, turn]);

  // Custom square styles for move highlighting
  const customSquareStyles = useMemo(() => {
    const styles: { [square: string]: React.CSSProperties } = {};
    
    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(255, 255, 0, 0.5)',
      };
    }
    
    // Highlight possible move squares with move strength
    possibleMoves.forEach(square => {
      const gameCopy = new Chess(fen);
      const move = gameCopy.moves({ square: selectedSquare as Square, verbose: true }).find((m: any) => m.to === square);
      if (move && showMoveStrength && moveEvaluations[move.san] !== undefined) {
        const eval_ = moveEvaluations[move.san];
        const isGood = eval_ > 0;
        const isBad = eval_ < -0.5;
        
        styles[square] = {
          backgroundColor: isGood ? 'rgba(0, 255, 0, 0.3)' : isBad ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 25%, transparent 25%)',
          backgroundSize: '10px 10px',
        };
      } else {
        styles[square] = {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 25%, transparent 25%)',
          backgroundSize: '10px 10px',
        };
      }
    });
    
    // Highlight threats
    threats.forEach(square => {
      styles[square] = {
        ...styles[square],
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        border: '2px solid rgba(255, 0, 0, 0.5)',
      };
    });
    
    return styles;
  }, [selectedSquare, possibleMoves, threats, showMoveStrength, moveEvaluations, fen]);

  const boardOptions = useMemo(() => ({
    position: fen,
    onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
      // STRICT VALIDATION: Check game state first
      if (isGameOver) return false;
      if (mode === 'play' && turn === 'b') return false;
      if (sourceSquare === targetSquare) return false;

      // STRICT VALIDATION: Try move via store (uses chess.js validation)
      // If makeGameMove returns false, the move is illegal and piece snaps back
      const success = makeGameMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Auto-queen for now
      });

      if (!success) return false; // Piece snaps back on illegal move

      setSelectedSquare(null);
      setPendingMove(null);
      return true;
    },
    onSquareClick: ({ square }: { square: string }) => {
      // STRICT VALIDATION: Check game state first
      if (isGameOver) return;
      if (mode === 'play' && turn === 'b') return;

      const squareId = square as Square;

      // If clicking the same square, deselect
      if (selectedSquare === squareId) {
        setSelectedSquare(null);
        setPendingMove(null);
        return;
      }

      // If we have a selected square and click a different square, try to make the move
      if (selectedSquare) {
        // Check if the clicked square is in the possible moves
        if (possibleMoves.includes(squareId)) {
          // Try to make the move via store (strict chess.js validation)
          const success = makeGameMove({
            from: selectedSquare,
            to: squareId,
            promotion: 'q', // Auto-queen for now
          });

          if (success) {
            setSelectedSquare(null);
            setPendingMove(null);
          } else {
            // Move was invalid - clear selection
            setSelectedSquare(null);
            setPendingMove(null);
          }
        } else {
          // Clicked on an invalid square - check if it has a piece of current turn
          const gameCopy = new Chess(fen);
          const piece = gameCopy.get(squareId);
          if (piece && piece.color === turn) {
            // Select new square
            setSelectedSquare(squareId);
            setPendingMove({ from: squareId, to: '' });
          } else {
            // Clear selection on invalid click
            setSelectedSquare(null);
            setPendingMove(null);
          }
        }
        return;
      }

      // No square selected - select if piece of current turn
      const gameCopy = new Chess(fen);
      const piece = gameCopy.get(squareId);
      if (piece && piece.color === turn) {
        setSelectedSquare(squareId);
        setPendingMove({ from: squareId, to: '' });
      }
    },
    boardOrientation: "white" as const,
    allowDragging: !isGameOver && (mode === 'analysis' || turn === 'w'),
    darkSquareStyle: { backgroundColor: '#769656' },
    lightSquareStyle: { backgroundColor: '#eeeed2' },
    animationDurationInMs: 200,
    pieces: customPieces,
    squareStyles: customSquareStyles,
    preDrag: ({ piece, square }: { piece: string; square: string }) => {
      // Auto-select piece on drag start
      if (!isGameOver && (mode === 'analysis' || turn === 'w')) {
        const gameCopy = new Chess(fen);
        const p = gameCopy.get(square as Square);
        if (p && p.color === turn) {
          setSelectedSquare(square as Square);
          setPendingMove({ from: square, to: '' });
        }
      }
      return true;
    }
  }), [fen, isGameOver, mode, turn, makeGameMove, customPieces, customSquareStyles, selectedSquare, possibleMoves]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="h-[60px] border-b border-white/5 bg-card px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-extrabold text-xl tracking-tighter">
            <span className="text-primary">STOCKFISH</span>
            <span className="text-white/40">PRO</span>
          </div>
          <div className="hidden md:flex ml-8 gap-5 text-[11px] uppercase tracking-[0.1em] font-bold text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-primary opacity-80">Cloud Engine ☁️</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-40">Local WASM 💻</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setEngineMode('local')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${engineMode === 'local' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
            >
              <Monitor size={12} />
              Local
            </button>
            <button
              onClick={() => setEngineMode('cloud')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${engineMode === 'cloud' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground hover:text-white'}`}
            >
              <Cloud size={12} />
              Cloud
            </button>
          </div>
          <div className="w-9 h-9 rounded bg-primary flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
            {Math.round(stats.rating)}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Rail */}
        <nav className="w-16 hidden md:flex flex-col items-center py-6 gap-6 border-r border-white/5 bg-background">
          <button 
            onClick={() => setMode('play')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mode === 'play' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Sword size={20} />
          </button>
          <button 
            onClick={() => setMode('analysis')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mode === 'analysis' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Activity size={20} />
          </button>
          <button 
            onClick={() => setMode('editor')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mode === 'editor' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Edit3 size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl hover:bg-white/5 text-muted-foreground flex items-center justify-center transition-colors">
            <Trophy size={20} />
          </div>
          <button
            onClick={() => setShowSystemCockpit(true)}
            className="mt-auto w-10 h-10 rounded-xl hover:bg-white/5 text-muted-foreground flex items-center justify-center transition-colors"
            title="System Cockpit"
          >
            <Settings size={20} />
          </button>
        </nav>

          {/* System Cockpit Modal */}
          <SystemCockpit open={showSystemCockpit} onOpenChange={setShowSystemCockpit} />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-y-auto">

            {/* Engine Error Overlay */}
            <AnimatePresence>
              {engineStore.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-6 right-6 z-[100] bg-[#1a1a1a] border border-white/10 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm"
                >
                  <div className="w-10 h-10 bg-red-400/20 rounded-full flex items-center justify-center shrink-0">
                    <Activity size={20} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#666] mb-1">System Alert</div>
                    <div className="text-xs font-bold leading-tight opacity-90">{engineStore.statusMessage}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 rounded-full" onClick={() => engineStore.setStatus('offline', 'Reset')}>
                    <RotateCcw size={16} className="opacity-40" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          
          {/* Eval Bar Wrapper (Matches design) */}
          <div className="hidden lg:flex flex-col items-center gap-2">
            <div className="w-6 h-full min-h-[512px] bg-[#111] rounded-lg border border-white/10 overflow-hidden flex flex-col-reverse relative">
              <motion.div 
                className="bg-white w-full transition-all duration-500 ease-out z-0"
                animate={{ height: `${evalPercentage}%` }}
              />
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20 z-10" />
              <div className={`absolute left-0 w-full text-center font-bold text-[9px] z-20 mix-blend-difference ${evaluation >= 0 ? 'top-2' : 'bottom-2'}`}>
                {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Board Container */}
          {mode === 'editor' ? (
            <div className="flex-1 flex flex-col items-center max-w-[600px] mx-auto">
              <BoardEditor onFenChange={(newFen) => loadPgn(newFen)} />
            </div>
          ) : (
          <div className="flex-1 flex flex-col items-center max-w-[600px] mx-auto">
            {/* Player Top */}
            <div className="w-full flex items-center justify-between py-3">
                <div className="flex items-center gap-3 relative">
                  <button 
                    onClick={() => setShowBotSelector(!showBotSelector)}
                    className="group"
                  >
                    <Avatar className="w-12 h-12 rounded-xl border-2 border-orange-500/30 hover:border-orange-500/60 transition-all shadow-lg hover:scale-105 active:scale-95">
                      <AvatarImage src={selectedBot.avatar} />
                      <AvatarFallback>BT</AvatarFallback>
                    </Avatar>
                  </button>
                  <AnimatePresence>
                    {showBotSelector && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-12 left-0 z-[100] w-[260px] bg-card border border-white/10 rounded-2xl shadow-2xl p-2"
                      >
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-2 mb-1 border-b border-white/5 flex justify-between items-center">
                          <span>Select Opponent</span>
                          <span className="text-[8px] opacity-30 normal-case font-medium">Drag to reorder</span>
                        </div>
                        <Reorder.Group axis="y" values={botList} onReorder={setBotList} className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                          {botList.map(bot => (
                            <Reorder.Item
                              key={bot.id}
                              value={bot}
                              className={`relative w-full flex items-center gap-2 p-2 rounded-xl transition-colors cursor-default border border-transparent ${selectedBot.id === bot.id ? 'bg-primary/20 border-primary/30' : 'hover:bg-white/5'}`}
                            >
                              <div className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                                <GripVertical size={14} />
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedBot(bot);
                                  setShowBotSelector(false);
                                  setDepthLimit(bot.skillLevel + 2);
                                  resetGame();
                                  resetTimers();
                                }}
                                className="flex-1 flex items-center gap-3 text-left min-w-0"
                              >
                                <Avatar className="w-10 h-10 rounded-lg border border-white/5 shadow-inner shrink-0">
                                  <AvatarImage src={bot.avatar} />
                                  <AvatarFallback className="bg-white/5 text-[10px]">{bot.name.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold flex items-center gap-1">
                                    <span className="truncate">{bot.name}</span>
                                    <span className="text-[9px] opacity-40 shrink-0">({bot.elo})</span>
                                  </div>
                                  <div className="text-[9px] opacity-50 truncate">{bot.description}</div>
                                </div>
                              </button>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      {selectedBot.name}
                      <span className="text-[10px] text-muted-foreground font-medium opacity-60">({selectedBot.elo})</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-40">
                      {selectedBot.skillLevel === 0 ? '☆ Beginner' : '★'.repeat(Math.ceil(selectedBot.skillLevel / 4))}
                    </div>
                  </div>
                </div>
              <div className="font-mono text-xl font-medium px-4 py-1.5 rounded-lg bg-card border border-white/5 shadow-inner">
                {formatTime(botTime)}
              </div>
            </div>

            {/* The Board */}
            <div className="w-full aspect-square relative rounded-xl overflow-hidden border-[6px] border-[#222] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
                <ChessboardErrorBoundary>
                  {/* @ts-ignore - This custom Chessboard build expects options prop */}
                  <Chessboard 
                    options={boardOptions}
                  />
                </ChessboardErrorBoundary>
              <AnimatePresence>
                {isGameOver && (
                  <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                    className="absolute inset-0 z-10 bg-background/60 flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-card border border-white/10 rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
                    >
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-primary" />
                      </div>
                      <h2 className="text-4xl font-black mb-2 tracking-tighter">GAME OVER</h2>
                      <p className="text-muted-foreground mb-8 text-sm uppercase tracking-widest font-bold">
                        {isCheckmate ? 'Checkmate' : 'Stalemate / Draw'}
                      </p>
                      <Button
                        onClick={() => { resetGame(); resetTimers(); }}
                        className="w-full h-14 text-lg font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 active:scale-95 transition-all"
                      >
                        NEW GAME
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Player Bottom */}
            <div className="w-full flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center font-bold border border-primary/30 text-primary">You</div>
                <div>
                  <div className="text-sm font-bold">Player</div>
                  <div className="text-[10px] text-muted-foreground tracking-widest font-bold opacity-40">WHITE</div>
                </div>
              </div>
              <div className="font-mono text-xl font-medium px-4 py-1.5 rounded-lg bg-white text-black shadow-lg">
                {formatTime(playerTime)}
              </div>
            </div>
          </div>
          )}

          {/* Right Sidebar */}
          <aside className="lg:w-[320px] flex flex-col gap-4">
            
            <Card className="bg-card border-white/5 rounded-2xl overflow-hidden flex flex-col">
              <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analysis</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Depth {depthLimit}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50">Threats</span>
                    <button
                      onClick={() => setShowThreats(!showThreats)}
                      className={`w-10 h-5 rounded-full transition-all ${showThreats ? 'bg-red-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-all ${showThreats ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50">Move Strength</span>
                    <button
                      onClick={() => setShowMoveStrength(!showMoveStrength)}
                      className={`w-10 h-5 rounded-full transition-all ${showMoveStrength ? 'bg-blue-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-all ${showMoveStrength ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex flex-col items-end mr-4">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50 mb-1">Multi-PV</span>
                    <div className="flex gap-1">
                      {[1, 3, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setMultiPVCount(n)}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${multiPVCount === n ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50 mb-1">Depth</span>
                    <input 
                      type="number" 
                      min="5" 
                      max="30" 
                      value={depthLimit} 
                      onChange={(e) => setDepthLimit(Math.max(5, Math.min(30, Number(e.target.value))))}
                      className="bg-white/5 border border-white/10 rounded w-10 h-6 text-[10px] font-bold text-primary text-center focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </CardHeader>
              {engineMode === 'local' && (
                <>
                  <div className="p-4 border-b border-white/5 flex gap-4">
                    <div className="flex-1">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50 mb-1 block">Hash (MB)</span>
                      <input
                        type="number"
                        min="32"
                        max="2048"
                        step="32"
                        value={engineHash}
                        onChange={(e) => setEngineHash(Math.max(32, Math.min(2048, Number(e.target.value))))}
                        className="bg-white/5 border border-white/10 rounded w-full h-6 text-[10px] font-bold text-primary text-center focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50 mb-1 block">Threads</span>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={engineThreads}
                        onChange={(e) => setEngineThreads(Math.max(1, Math.min(16, Number(e.target.value))))}
                        className="bg-white/5 border border-white/10 rounded w-full h-6 text-[10px] font-bold text-primary text-center focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50">NNUE Network</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground">Use NNUE</span>
                        <button
                          onClick={() => engineStore.setEngineSettings({ useNNUE: !engineStore.useNNUE })}
                          className={`relative w-10 h-5 rounded-full transition-all ${engineStore.useNNUE ? 'bg-green-500/50' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${engineStore.useNNUE ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    <select
                      value={engineStore.useNNUE ? 'nnue' : 'none'}
                      onChange={(e) => {
                        engineStore.setEngineSettings({ useNNUE: e.target.value === 'nnue' });
                      }}
                      disabled={!engineStore.useNNUE}
                      className="w-full bg-white/5 border border-white/10 rounded h-7 text-[10px] font-bold text-primary text-center focus:outline-none focus:border-primary/50 disabled:opacity-50"
                    >
                      {NNUE_FILES.map(file => (
                        <option key={file.name} value={file.name}>
                          {file.name} ({file.size}MB)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {engineMode === 'cloud' && (
                <div className="px-5 py-2 bg-blue-500/5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-black text-blue-400">Cloud Depth</span>
                      <input 
                        type="number"
                        value={cloudDepth}
                        onChange={(e) => setCloudDepth(Number(e.target.value))}
                        className="bg-transparent text-[10px] font-bold outline-none w-10"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-black text-blue-400">Cloud MS</span>
                      <input 
                        type="number"
                        value={cloudTime}
                        onChange={(e) => setCloudTime(Number(e.target.value))}
                        className="bg-transparent text-[10px] font-bold outline-none w-12"
                      />
                    </div>
                  </div>
                  <Cloud size={14} className="text-blue-500 animate-pulse" />
                </div>
              )}
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black tracking-tighter">
                    {evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2)}
                  </div>
                  {engineMode === 'cloud' && (
                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px]">CLOUD ACTIVE</Badge>
                  )}
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {engineResult?.lines && engineResult.lines.length > 0 ? (
                    engineResult.lines.map((line, idx) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-default group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-primary">Line {idx + 1}</span>
                            <Badge variant="outline" className="text-[9px] h-4 py-0 border-white/10 text-white/40">Depth {line.depth}</Badge>
                          </div>
                          <span className={`text-[11px] font-mono font-bold ${line.evaluation >= 0 ? 'text-primary' : 'text-red-400'}`}>
                            {line.evaluation > 0 ? `+${line.evaluation.toFixed(1)}` : line.evaluation.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-sm font-medium truncate opacity-80 group-hover:opacity-100 transition-opacity">
                          {line.pv.split(' ').slice(0, 8).join(' ')}...
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 space-y-3 opacity-40">
                      <Brain size={32} className="animate-pulse" />
                      <div className="text-sm italic text-center font-medium leading-tight">
                        {engineStore.status === 'ready' ? 'Calculating top lines...' : 'Initializing local engine...'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Eval Graph with Tooltips */}
                <div className="h-24 min-h-[96px] w-full bg-black/20 rounded-lg border border-white/5 relative p-2 overflow-hidden">
                  {evalHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={60}>
                      <LineChart data={evalHistory}>
                        <Tooltip 
                          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const moveNum = Math.floor(data.move / 2) + 1;
                              const side = data.move % 2 === 0 ? 'W' : 'B';
                              const evaluation = data.eval;
                              return (
                                <div className="bg-[#1a1917] border border-white/10 p-2 rounded-lg shadow-2xl backdrop-blur-md">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                    Move {moveNum} ({side})
                                  </div>
                                  <div className={`text-xs font-mono font-black ${evaluation >= 0 ? 'text-primary' : 'text-red-400'}`}>
                                    {evaluation > 0 ? '+' : ''}{evaluation.toFixed(2)}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="eval" 
                          stroke="#769656" 
                          strokeWidth={2} 
                          dot={{ r: 2, fill: '#769656' }}
                          activeDot={{ r: 4, stroke: '#fff', strokeWidth: 1 }}
                        />
                      </LineChart>
                  </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      No analysis data yet
                    </div>
                  )}
                </div>
                {isGameOver && (
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <Button 
                      onClick={runGameReview}
                      disabled={isReviewing}
                      className="w-full bg-primary hover:bg-primary/90 font-black"
                    >
                      {isReviewing ? 'ANALYZING...' : 'REVIEW GAME'}
                    </Button>
                    
                    {reviewData && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/10 border border-primary/20 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Performance</span>
                          <span className="text-lg font-black text-primary">{reviewData.accuracy}%</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="text-center">
                            <div className="text-xs font-bold text-red-400">{reviewData.blunders}</div>
                            <div className="text-[8px] uppercase font-black opacity-40">Blunders</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-orange-400">{reviewData.mistakes}</div>
                            <div className="text-[8px] uppercase font-black opacity-40">Mistakes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-blue-400">{reviewData.brilliant}</div>
                            <div className="text-[8px] uppercase font-black opacity-40">Brilliant</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-green-400">{reviewData.avgCPL}</div>
                            <div className="text-[8px] uppercase font-black opacity-40">Avg CPL</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const pgn = exportPgn();
                            navigator.clipboard.writeText(pgn);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full mb-3"
                        >
                          <Download size={14} className="mr-2" />
                          Export Annotated PGN
                        </Button>
                        <p className="text-[10px] italic opacity-60 leading-tight">{reviewData.summary}</p>
                      </motion.div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {openingInfo && (
              <Card className="bg-card border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                <CardHeader className="p-4 border-b border-white/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Opening</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Name</span>
                      <span className="text-xs font-bold text-primary">{openingInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">ECO</span>
                      <span className="text-xs font-bold text-primary">{openingInfo.eco}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Moves</span>
                      <span className="text-xs font-bold text-primary">{openingInfo.moves}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Opening Explorer - only show in analysis mode */}
            {mode === 'analysis' && (
              <ErrorBoundary componentName="Opening Explorer">
                <OpeningExplorer 
                  fen={fen}
                  onMoveSelect={(move) => {
                    // Navigate to that move in the game
                    console.log('Selected opening move:', move);
                  }}
                />
              </ErrorBoundary>
            )}

            {/* Game Review - show when game is complete or in analysis mode */}
            {(mode === 'analysis' || isGameOver) && (
              <ErrorBoundary componentName="Game Review">
                <GameReview
                  pgn={exportPgn()}
                  onMoveClick={(moveIndex) => {
                    // Navigate to specific move
                    console.log('Navigate to move:', moveIndex);
                  }}
                  onClose={() => setShowGameReview(false)}
                  evaluateFen={async (fen, depth) => 0}
                />
              </ErrorBoundary>
            )}

            <OAuthConnections />

            <Card className="bg-card border-white/5 rounded-2xl flex-1 overflow-hidden flex flex-col min-h-[300px]">
              <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">History</span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pgn"
                    onChange={handleImportPGN}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Import PGN"
                  >
                    <Upload size={14} />
                  </button>
                  <button 
                    onClick={handleExportPGN}
                    className="p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Export PGN"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-[32px_1fr_1fr] gap-x-2 gap-y-1 text-sm font-mono">
                  {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                    <React.Fragment key={i}>
                      <div className="text-muted-foreground/40 font-bold">{i + 1}.</div>
                      <div className={`px-2 py-1 rounded truncate transition-colors ${history[i*2] === history[history.length-1] && i*2 === history.length-1 ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5'}`}>
                        {history[i*2]}
                      </div>
                      <div className={`px-2 py-1 rounded truncate transition-colors ${history[i*2 + 1] === history[history.length-1] && i*2 + 1 === history.length-1 ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-white/5'}`}>
                        {history[i*2 + 1] || ''}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/5 grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => undoMove()} className="bg-white/5 border-none hover:bg-white/10 font-bold text-xs flex items-center gap-2">
                  <RotateCcw size={14} />
                  UNDO
                </Button>
                <Button variant="destructive" onClick={() => { resetGame(); resetTimers(); }} className="bg-red-500/80 hover:bg-red-500 font-bold text-xs uppercase transition-all shadow-lg shadow-red-500/20">RESIGN</Button>
              </div>
            </Card>

          </aside>
        </main>
      </div>
    </div>
  );
}
