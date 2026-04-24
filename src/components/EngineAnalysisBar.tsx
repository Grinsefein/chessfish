import React from 'react';
import { useEngineStore } from '@/store/engineStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useThrottledValue } from '@/hooks/useThrottledValue';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight,
  BatteryMedium,
  Sparkles,
  Zap,
  Activity,
  Timer,
  Layers
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
    nps,
    nodes,
    time,
    startAnalysis, 
    stopAnalysis,
    shutdownEngine,
    energySavingMode,
    selectedEngine,
    selectedEngineVersion,
    cloudRuntime
  } = engineStore;

  // Throttle values to reduce UI jitter (10fps max)
  const throttledNps = useThrottledValue(nps, 100);
  const throttledNodes = useThrottledValue(nodes, 100);
  const throttledTime = useThrottledValue(time, 100);
  const throttledDepth = useThrottledValue(depth, 100);

  const engineBadge = selectedEngine === 'cloud'
    ? `${cloudRuntime.engineVersion.toUpperCase()} CLOUD`
    : `${selectedEngineVersion.toUpperCase()} LOCAL`;

  // Format big numbers with rounding to reduce visual changes
  const formatNumber = (num: number) => {
    // Round to reduce jitter
    if (num >= 10000000) return (Math.round(num / 1000000)).toString() + 'M';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (Math.round(num / 1000)).toString() + 'k';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

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
    if (isMate) return eval_ > 0 ? 'text-blue-400' : 'text-red-400';
    if (eval_ > 0.5) return 'text-primary';
    if (eval_ < -0.5) return 'text-red-400';
    return 'text-zinc-500';
  };

  // Format best line PV
  const formatPv = (pv: string) => {
    if (!pv) return '';
    const moves = pv.split(' ').slice(0, 8); // Show first 8 moves
    return moves.join(' ');
  };

  return (
    <div className="w-full mt-3 space-y-2 font-sans">
      {/* Main Control Bar & Stats - Compact Horizontal Row */}
      <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 p-2 lg:p-3 rounded-2xl bg-zinc-900 border border-white/5 shadow-xl shadow-black/50 relative overflow-hidden transition-all duration-300">
        
        {/* Play/Pause Button - Tactile */}
        <Button
          variant={isAnalyzing ? "outline" : "default"}
          size="icon"
          onClick={isAnalyzing ? () => { stopAnalysis(); shutdownEngine(); } : startAnalysis}
          className={cn(
            "h-10 w-10 lg:h-12 lg:w-12 rounded-xl relative z-10 shrink-0 tactile-btn",
            isAnalyzing 
              ? "bg-zinc-800 border-red-500/50 text-red-400 hover:bg-zinc-700"
              : "bg-primary border-primary text-white hover:bg-primary/95"
          )}
        >
          {isAnalyzing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </Button>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 relative z-10 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevMove}
            className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-zinc-800 border-white/5 hover:bg-zinc-700 text-zinc-400 hover:text-white tactile-btn"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMove}
            className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-zinc-800 border-white/5 hover:bg-zinc-700 text-zinc-400 hover:text-white tactile-btn"
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        {/* Evaluation & Depth Compact Display */}
        <div className="flex items-center gap-3 px-3 py-1 bg-zinc-950 rounded-xl border border-white/5 shrink-0 h-10 lg:h-12">
          <div className={cn("text-xl lg:text-2xl font-black tracking-tighter w-16 text-center", getEvalColor(currentEvaluation, lines[0]?.isMate))}>
            {formatEval(currentEvaluation, lines[0]?.isMate)}
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div className="flex flex-col justify-center">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600 leading-none mb-0.5">Depth</span>
            <span className="text-sm font-black text-primary leading-none tabular-nums">{throttledDepth}</span>
          </div>
        </div>

        {/* Engine Stats (NPS, Nodes, Time) */}
        <div className="flex-1 flex items-center justify-end gap-3 lg:gap-5 px-2">
           {/* Cloud / Local Badge */}
           <div className={cn(
            "hidden sm:flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
            selectedEngine === 'cloud' 
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
          )}>
            {engineBadge}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5 group">
              <Activity size={12} className="text-zinc-600" />
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{formatNumber(throttledNps)}</span>
            </div>
            <div className="flex items-center gap-1.5 group">
              <Layers size={12} className="text-zinc-600" />
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{formatNumber(throttledNodes)}</span>
            </div>
            <div className="flex items-center gap-1.5 group">
              <Timer size={12} className="text-zinc-600" />
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{(throttledTime / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-PV Lines - Condensed */}
      {lines.length > 0 && (
        <div className="space-y-1.5">
          {lines.slice(0, 3).map((line, index) => (
            <button
              key={index}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-300 relative overflow-hidden group border",
                index === 0
                  ? "bg-zinc-800/80 border-primary/40 tactile-btn"
                  : "bg-zinc-900 border-white/5 hover:bg-zinc-800 tactile-btn"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                index === 0 ? "bg-primary text-white" : "bg-zinc-950 text-zinc-500"
              )}>
                {index + 1}
              </span>
              <span className={cn(
                "text-sm font-black w-12 tracking-tighter shrink-0 tabular-nums",
                getEvalColor(line.evaluation, line.isMate)
              )}>
                {formatEval(line.evaluation, line.isMate)}
              </span>
              <span className="text-xs font-black text-white uppercase tracking-tight shrink-0 w-12">{line.bestMove || '...'}</span>
              <span className="flex-1 text-[10px] text-zinc-500 truncate font-mono tracking-tight min-w-0">
                {formatPv(line.pv)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Idle State */}
      {!isAnalyzing && lines.length === 0 && (
        <div className="flex items-center justify-center py-4 lg:py-5 text-zinc-500 bg-zinc-900 rounded-2xl border border-white/5 tactile-btn cursor-default shadow-xl shadow-black/50">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Engine Ready</span>
        </div>
      )}
    </div>
  );
};

export default EngineAnalysisBar;
