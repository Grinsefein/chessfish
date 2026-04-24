import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { 
  Download, 
  Share2, 
  Settings, 
  Flag, 
  RotateCcw, 
  Lightbulb,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MoveHistoryProps {
  history: string[];
  onPreviewMove: (index: number | null) => void;
  previewIndex: number | null;
  onExportPgn: () => void;
  onExportFen: () => void;
  onOpenSettings: () => void;
  onUndo: () => void;
  onResign: () => void;
}

// Chess piece symbols for notation
const pieceSymbols: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞'
};

// Format move with chess symbols
const formatMove = (move: string): string => {
  if (!move) return '';
  
  // Replace piece letters with symbols
  let formatted = move;
  Object.entries(pieceSymbols).forEach(([letter, symbol]) => {
    formatted = formatted.replace(letter, symbol);
  });
  
  return formatted;
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  onPreviewMove,
  previewIndex,
  onExportPgn,
  onExportFen,
  onOpenSettings,
  onUndo,
  onResign
}) => {
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: { move: history[i], index: i },
      black: history[i + 1] ? { move: history[i + 1], index: i + 1 } : null
    });
  }

  const handleFirstMove = () => onPreviewMove(0);
  const handlePrevMove = () => {
    if (previewIndex !== null && previewIndex > 0) {
      onPreviewMove(previewIndex - 1);
    } else if (previewIndex === null && history.length > 0) {
      onPreviewMove(history.length - 1);
    }
  };
  const handleNextMove = () => {
    if (previewIndex !== null && previewIndex < history.length - 1) {
      onPreviewMove(previewIndex + 1);
    } else if (previewIndex !== null) {
      onPreviewMove(null);
    }
  };
  const handleLastMove = () => onPreviewMove(null);

  return (
    <div className="w-full flex flex-col bg-zinc-900 h-full">
      {/* Game Info Header - Professional Style */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-700 shadow-sm">
              <span className="text-lg">♟</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Game in Progress</h3>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {history.length} moves • Standard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-medium uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* Column Headers - Table Style */}
      <div className="grid grid-cols-[48px_1fr_1fr] px-2 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-wider">#</div>
        <div className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-wider">White</div>
        <div className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Black</div>
      </div>

      {/* Move List - Professional Table */}
      <ScrollArea className="flex-1 bg-zinc-900">
        <div className="divide-y divide-zinc-800/50">
          {movePairs.map((pair, pairIndex) => (
            <motion.div 
              key={pair.number} 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pairIndex * 0.02 }}
              className="grid grid-cols-[48px_1fr_1fr] items-center hover:bg-zinc-800/30 transition-colors"
            >
              {/* Move Number */}
              <div className="text-center py-2.5">
                <span className="text-[11px] font-semibold text-zinc-600 tabular-nums">
                  {pair.number}.
                </span>
              </div>
              
              {/* White Move */}
              <button
                onClick={() => onPreviewMove(pair.white.index)}
                className={cn(
                  "py-2.5 px-3 mx-1 rounded-lg transition-all text-center font-mono text-sm",
                  previewIndex === pair.white.index 
                    ? "bg-primary/20 text-primary font-bold border border-primary/30"
                    : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                )}
              >
                {formatMove(pair.white.move)}
              </button>

              {/* Black Move */}
              {pair.black ? (
                <button
                  onClick={() => onPreviewMove(pair.black!.index)}
                  className={cn(
                    "py-2.5 px-3 mx-1 rounded-lg transition-all text-center font-mono text-sm",
                    previewIndex === pair.black.index 
                      ? "bg-primary/20 text-primary font-bold border border-primary/30"
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  {formatMove(pair.black.move)}
                </button>
              ) : (
                <div className="py-2.5 px-3 mx-1" />
              )}
            </motion.div>
          ))}

          {history.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3 text-zinc-600">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center">
                <span className="text-2xl opacity-50">♟</span>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-widest">No moves yet</p>
              <p className="text-[10px] text-zinc-700">Make your first move to start</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-zinc-800 bg-zinc-950">
        <button 
          onClick={handleFirstMove}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          title="First move"
        >
          <ChevronFirst size={18} />
        </button>
        <button 
          onClick={handlePrevMove}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          title="Previous move"
        >
          <ChevronLeft size={18} />
        </button>
        <button 
          onClick={handleNextMove}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          title="Next move"
        >
          <ChevronRight size={18} />
        </button>
        <button 
          onClick={handleLastMove}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          title="Last move"
        >
          <ChevronLast size={18} />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 border-t border-zinc-800 bg-zinc-950">
        <button 
          onClick={onResign} 
          className="flex flex-col items-center justify-center py-4 hover:bg-zinc-900 transition-colors border-r border-zinc-800 group"
        >
          <Flag size={18} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
          <span className="text-[9px] font-medium text-zinc-600 group-hover:text-zinc-400 mt-1 uppercase">Resign</span>
        </button>
        <button 
          onClick={onUndo} 
          className="flex flex-col items-center justify-center py-4 hover:bg-zinc-900 transition-colors border-r border-zinc-800 group"
        >
          <RotateCcw size={18} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
          <span className="text-[9px] font-medium text-zinc-600 group-hover:text-zinc-400 mt-1 uppercase">Undo</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center py-4 hover:bg-zinc-900 transition-colors border-r border-zinc-800 group"
        >
          <Lightbulb size={18} className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
          <span className="text-[9px] font-medium text-zinc-600 group-hover:text-zinc-400 mt-1 uppercase">Hint</span>
        </button>
        <button 
          onClick={onExportPgn}
          className="flex flex-col items-center justify-center py-4 hover:bg-zinc-900 transition-colors group"
        >
          <Download size={18} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
          <span className="text-[9px] font-medium text-zinc-600 group-hover:text-zinc-400 mt-1 uppercase">Save</span>
        </button>
      </div>

      {/* Bottom Settings Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950">
        <button 
          onClick={onExportFen} 
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <Share2 size={16} />
          <span className="text-[11px] font-medium">Share Position</span>
        </button>
        <button 
          onClick={onOpenSettings} 
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <Settings size={16} />
          <span className="text-[11px] font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};
