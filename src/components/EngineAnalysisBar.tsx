import React from 'react';
import { useEngineStore } from '@/store/engineStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight,
  BatteryMedium,
  Sparkles,
  Zap
} from 'lucide-react';

interface EngineAnalysisBarProps {
  onPrevMove?: () => void;
  onNextMove?: () => void;
}

export const EngineAnalysisBar: React.FC<EngineAnalysisBarProps> = ({ 
  onPrevMove, 
  onNextMove 
}) => {
  const engineStore = useEngineStore();
  const { 
    isAnalyzing, 
    currentEvaluation, 
    depth, 
    lines,
    startAnalysis, 
    stopAnalysis,
    energySavingMode
  } = engineStore;

  // Format evaluation display
  const formatEval = (eval_: number, isMate?: boolean) => {
    if (isMate) {
      return eval_ > 0 ? `M${Math.abs(eval_)}` : `-M${Math.abs(eval_)}`;
    }
    if (eval_ > 0) return `+${eval_.toFixed(2)}`;
    return eval_.toFixed(2);
  };

  // Determine color based on evaluation
  const getEvalColor = (eval_: number, isMate?: boolean) => {
    if (isMate) return eval_ > 0 ? 'text-blue-500' : 'text-red-500';
    if (eval_ > 0.5) return 'text-primary';
    if (eval_ < -0.5) return 'text-red-500';
    return 'text-zinc-500';
  };

  // Format best line PV
  const formatPv = (pv: string) => {
    if (!pv) return '';
    const moves = pv.split(' ').slice(0, 8); // Show first 8 moves
    return moves.join(' ');
  };

  return (
    <div className="w-full mt-6 space-y-4 font-sans">
      {/* Main Control Bar */}
      <div className="flex items-center gap-2 lg:gap-4 p-3 lg:p-4 rounded-2xl bg-zinc-900 border-2 border-zinc-800 shadow-[0_6px_0_0_#09090b] relative overflow-hidden">
        
        {/* Play/Pause Button */}
        <Button
          variant={isAnalyzing ? "outline" : "default"}
          size="icon"
          onClick={isAnalyzing ? stopAnalysis : startAnalysis}
          className={cn(
            "h-10 w-10 lg:h-14 lg:w-14 rounded-2xl relative z-10 shrink-0",
            isAnalyzing 
              ? "bg-zinc-800 border-amber-600 text-amber-500 hover:bg-zinc-700 shadow-[0_4px_0_0_#b45309]"
              : "bg-primary border-primary text-white shadow-[0_4px_0_0_#4a6728]"
          )}
        >
          {isAnalyzing ? <Pause size={16} lg:size={24} /> : <Play size={16} lg:size={24} className="ml-0.5 lg:ml-1" />}
        </Button>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 lg:gap-2 relative z-10 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevMove}
            className="h-9 w-9 lg:h-12 lg:w-12 rounded-xl bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <ChevronLeft size={16} lg:size={24} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMove}
            className="h-9 w-9 lg:h-12 lg:w-12 rounded-xl bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <ChevronRight size={16} lg:size={24} />
          </Button>
        </div>

        {/* Evaluation Display */}
        <div className="flex-1 flex items-center justify-center gap-2 lg:gap-4 relative z-10 min-w-0">
          <div className={cn("text-2xl lg:text-4xl font-black tracking-tighter truncate", getEvalColor(currentEvaluation, lines[0]?.isMate))}>
            {formatEval(currentEvaluation, lines[0]?.isMate)}
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-zinc-600">Depth</span>
            <span className="text-xs lg:text-sm font-black text-primary leading-tight">{depth}</span>
          </div>
        </div>

        {/* Battery / Energy Status */}
        <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 lg:py-2.5 rounded-xl bg-zinc-950 border-2 border-zinc-800 relative z-10 shrink-0">
          {energySavingMode ? (
            <BatteryMedium size={14} lg:size={18} className="text-green-500" />
          ) : (
            <Zap size={14} lg:size={18} className="text-amber-400" />
          )}
          <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden sm:inline">
            {energySavingMode ? 'ECO' : 'MAX'}
          </span>
        </div>
      </div>

      {/* Multi-PV Lines */}
      {lines.length > 0 && (
        <div className="space-y-2 lg:space-y-3">
          {lines.slice(0, 3).map((line, index) => (
            <button
              key={index}
              className={cn(
                "w-full flex items-center gap-2 lg:gap-4 px-3 lg:px-5 py-3 lg:py-4 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group border-2",
                index === 0
                  ? "bg-zinc-800 border-primary/50 shadow-[0_4px_0_0_#4a6728] translate-y-[-2px]"
                  : "bg-zinc-900 border-2 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 shadow-[0_4px_0_0_#09090b]"
              )}
            >
              {/* Line Number */}
              <span className={cn(
                "w-6 h-6 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center text-[10px] lg:text-[11px] font-black border-2 shrink-0",
                index === 0 ? "bg-primary border-primary text-white" : "bg-zinc-950 border-2 border-zinc-800 text-zinc-500"
              )}>
                {index + 1}
              </span>

              {/* Evaluation */}
              <span className={cn(
                "text-sm lg:text-lg font-black w-12 lg:w-16 tracking-tighter shrink-0",
                getEvalColor(line.evaluation, line.isMate)
              )}>
                {formatEval(line.evaluation, line.isMate)}
              </span>

              {/* Best Move */}
              <div className="flex flex-col w-14 lg:w-20 shrink-0">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Move</span>
                <span className="text-xs lg:text-sm font-black text-white uppercase tracking-tight truncate">{line.bestMove || '...'}</span>
              </div>

              {/* PV Line */}
              <span className="flex-1 text-[10px] lg:text-xs text-zinc-500 truncate font-mono tracking-tight group-hover:text-zinc-300 transition-colors min-w-0">
                {formatPv(line.pv)}
              </span>

              {/* Best indicator */}
              {index === 0 && (
                <div className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-primary/10 border-2 border-primary/20 shrink-0 hidden sm:flex">
                  <Sparkles size={10} lg:size={12} className="text-primary" />
                  <span className="text-[9px] lg:text-[10px] font-black text-primary uppercase tracking-tighter">Best</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Idle State */}
      {!isAnalyzing && lines.length === 0 && (
        <div className="flex items-center justify-center py-10 text-zinc-500 bg-zinc-950 rounded-2xl border-2 border-zinc-900 border-dashed">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border-2 border-zinc-800">
              <Play size={16} className="ml-0.5 text-zinc-600" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600">Engine Idle</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineAnalysisBar;
