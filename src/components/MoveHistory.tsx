import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Download, 
  Share2, 
  Settings, 
  Flag, 
  RotateCcw, 
  Lightbulb
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

  return (
    <div className="w-full lg:w-80 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl h-[580px]">
      {/* Game Info Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center">
            <span className="text-xs">🤖</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Play vs Computer</span>
        </div>
      </div>

      {/* Move List */}
      <ScrollArea className="flex-1 px-1 py-2">
        <div className="space-y-0.5">
          {movePairs.map((pair) => (
            <div key={pair.number} className="flex items-center text-xs">
              <div className="w-10 text-center font-bold text-zinc-600 py-1.5 bg-zinc-950/30">
                {pair.number}.
              </div>
              
              <button
                onClick={() => onPreviewMove(pair.white.index)}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md transition-all text-left font-bold",
                  previewIndex === pair.white.index 
                    ? "bg-zinc-800 text-white" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                {pair.white.move}
              </button>

              {pair.black ? (
                <button
                  onClick={() => onPreviewMove(pair.black!.index)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md transition-all text-left font-bold",
                    previewIndex === pair.black.index 
                      ? "bg-zinc-800 text-white" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  {pair.black.move}
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          ))}

          {history.length === 0 && (
            <div className="py-20 text-center opacity-10">
              <p className="text-[9px] font-bold uppercase tracking-widest">Awaiting Moves</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Utility Row */}
      <div className="grid grid-cols-3 border-t border-zinc-800 bg-zinc-950/30">
        <button onClick={onResign} className="flex flex-col items-center justify-center py-3 hover:bg-zinc-800 transition-colors">
          <Flag size={18} className="text-zinc-600" />
        </button>
        <button onClick={onUndo} className="flex flex-col items-center justify-center py-3 border-l border-r border-zinc-800 hover:bg-zinc-800 transition-colors">
          <RotateCcw size={18} className="text-zinc-600" />
        </button>
        <button className="flex flex-col items-center justify-center py-3 hover:bg-zinc-800 transition-colors">
          <Lightbulb size={18} className="text-zinc-600" />
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-5">
          <button onClick={onExportPgn} className="text-zinc-600 hover:text-zinc-300">
            <Download size={16} />
          </button>
          <button onClick={onExportFen} className="text-zinc-600 hover:text-zinc-300">
            <Share2 size={16} />
          </button>
        </div>
        <button onClick={onOpenSettings} className="text-zinc-600 hover:text-zinc-300">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};
