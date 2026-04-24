import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <div className="w-full flex flex-col bg-zinc-900 h-full">
      {/* Game Info Header */}
      <div className="p-4 border-b-2 border-2 border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 shadow-[0_2px_0_0_#09090b]">
            <span className="text-sm">🤖</span>
          </div>
          <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Vs Computer</span>
        </div>
      </div>

      {/* Move List */}
      <ScrollArea className="flex-1 px-1 py-2 bg-zinc-900">
        <div className="space-y-1">
          {movePairs.map((pair) => (
            <div key={pair.number} className="flex items-center text-[13px]">
              <div className="w-10 text-center font-black text-zinc-600 py-2">
                {pair.number}.
              </div>
              
              <button
                onClick={() => onPreviewMove(pair.white.index)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg transition-all text-left font-black uppercase tracking-tight",
                  previewIndex === pair.white.index 
                    ? "bg-zinc-800 text-white border-b-2 border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                {pair.white.move}
              </button>

              {pair.black ? (
                <button
                  onClick={() => onPreviewMove(pair.black!.index)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg transition-all text-left font-black uppercase tracking-tight",
                    previewIndex === pair.black.index 
                      ? "bg-zinc-800 text-white border-b-2 border-zinc-700"
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
            <div className="py-20 text-center opacity-20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Awaiting Moves</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Utility Row */}
      <div className="grid grid-cols-3 border-t-2 border-2 border-zinc-800 bg-zinc-950">
        <button onClick={onResign} className="flex flex-col items-center justify-center py-4 hover:bg-zinc-900 transition-colors border-r-2 border-2 border-zinc-800 group">
          <Flag size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>
        <button onClick={onUndo} className="flex flex-col items-center justify-center py-4 hover:bg-zinc-900 transition-colors border-r-2 border-2 border-zinc-800 group">
          <RotateCcw size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>
        <button className="flex flex-col items-center justify-center py-4 hover:bg-zinc-900 transition-colors group">
          <Lightbulb size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t-2 border-2 border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-6">
          <button onClick={onExportPgn} className="text-zinc-500 hover:text-white transition-colors">
            <Download size={18} />
          </button>
          <button onClick={onExportFen} className="text-zinc-500 hover:text-white transition-colors">
            <Share2 size={18} />
          </button>
        </div>
        <button onClick={onOpenSettings} className="text-zinc-500 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};
