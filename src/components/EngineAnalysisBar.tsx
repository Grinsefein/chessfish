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
    <div className="w-full mt-6 space-y-3 font-sans">
      {/* Engine Stats Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/40 rounded-xl border border-zinc-800/50 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 group">
            <Activity size={12} className="text-zinc-600 group-hover:text-primary transition-colors" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600">NPS</span>
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums transition-all duration-300">{formatNumber(throttledNps)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 group">
            <Layers size={12} className="text-zinc-600 group-hover:text-primary transition-colors" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600">Nodes</span>
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums transition-all duration-300">{formatNumber(throttledNodes)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 group">
            <Timer size={12} className="text-zinc-600 group-hover:text-primary transition-colors" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600">Time</span>
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums transition-all duration-300">{(throttledTime / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
            selectedEngine === 'cloud' 
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
          )}>
            {engineBadge}
          </div>
          
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            {energySavingMode ? (
              <BatteryMedium size={12} className="text-green-500" />
            ) : (
              <Zap size={12} className="text-amber-400 animate-pulse" />
            )}
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
              {energySavingMode ? 'ECO' : 'MAX'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Control Bar */}
      <div className="flex items-center gap-2 lg:gap-4 p-3 lg:p-4 rounded-2xl bg-zinc-900 border-2 border-zinc-800 shadow-[0_6px_0_0_#09090b] relative overflow-hidden group/bar transition-all duration-300 hover:border-zinc-700">
        
        {/* Play/Pause Button */}
        <Button
          variant={isAnalyzing ? "outline" : "default"}
          size="icon"
          onClick={isAnalyzing ? stopAnalysis : startAnalysis}
          className={cn(
            "h-10 w-10 lg:h-14 lg:w-14 rounded-2xl relative z-10 shrink-0 transition-all duration-300 active:translate-y-1 active:shadow-none",
            isAnalyzing 
              ? "bg-zinc-800 border-amber-600 text-amber-500 hover:bg-zinc-700 shadow-[0_4px_0_0_#b45309]"
              : "bg-primary border-primary text-white shadow-[0_4px_0_0_#4a6728] hover:bg-primary/90"
          )}
        >
          {isAnalyzing ? <Pause size={18} className="lg:w-6 lg:h-6" /> : <Play size={18} className="ml-0.5 lg:ml-1 lg:w-6 lg:h-6" />}
        </Button>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 lg:gap-2 relative z-10 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevMove}
            className="h-9 w-9 lg:h-12 lg:w-12 rounded-xl bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:translate-y-0.5 shadow-[0_2px_0_0_#09090b]"
          >
            <ChevronLeft size={18} className="lg:w-6 lg:h-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMove}
            className="h-9 w-9 lg:h-12 lg:w-12 rounded-xl bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:translate-y-0.5 shadow-[0_2px_0_0_#09090b]"
          >
            <ChevronRight size={18} className="lg:w-6 lg:h-6" />
          </Button>
        </div>

        {/* Evaluation Display */}
        <div className="flex-1 flex items-center justify-center gap-3 lg:gap-5 relative z-10 min-w-0">
          <div className={cn("text-2xl lg:text-5xl font-black tracking-tighter truncate transition-colors duration-500", getEvalColor(currentEvaluation, lines[0]?.isMate))}>
            {formatEval(currentEvaluation, lines[0]?.isMate)}
          </div>
          <div className="flex flex-col shrink-0 border-l-2 border-zinc-800 pl-3 lg:pl-5">
            <span className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-0.5">Depth</span>
            <span className="text-xs lg:text-lg font-black text-primary leading-none tabular-nums transition-all duration-300">{throttledDepth}</span>
          </div>
        </div>
      </div>

      {/* Multi-PV Lines */}
      {lines.length > 0 && (
        <div className="space-y-2 lg:space-y-2.5 pt-1">
          {lines.slice(0, 3).map((line, index) => (
            <button
              key={index}
              className={cn(
                "w-full flex items-center gap-3 lg:gap-5 px-3 lg:px-5 py-3 lg:py-4 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group border-2",
                index === 0
                  ? "bg-zinc-800/80 border-primary/40 shadow-[0_4px_0_0_#4a6728] translate-y-[-2px] backdrop-blur-sm"
                  : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 shadow-[0_4px_0_0_#09090b]"
              )}
            >
              {/* Line Number */}
              <span className={cn(
                "w-6 h-6 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center text-[10px] lg:text-xs font-black border-2 shrink-0 transition-colors",
                index === 0 ? "bg-primary border-primary text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500"
              )}>
                {index + 1}
              </span>

              {/* Evaluation */}
              <span className={cn(
                "text-sm lg:text-xl font-black w-14 lg:w-20 tracking-tighter shrink-0 tabular-nums",
                getEvalColor(line.evaluation, line.isMate)
              )}>
                {formatEval(line.evaluation, line.isMate)}
              </span>

              {/* Best Move */}
              <div className="flex flex-col w-14 lg:w-24 shrink-0">
                <span className="text-[8px] lg:text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Move</span>
                <span className="text-xs lg:text-base font-black text-white uppercase tracking-tight truncate">{line.bestMove || '...'}</span>
              </div>

              {/* PV Line */}
              <span className="flex-1 text-[10px] lg:text-sm text-zinc-500 truncate font-mono tracking-tight group-hover:text-zinc-300 transition-colors min-w-0">
                {formatPv(line.pv)}
              </span>

              {/* Best indicator */}
              {index === 0 && (
                <div className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl bg-primary/10 border border-primary/20 shrink-0 hidden sm:flex">
                  <Sparkles size={14} className="text-primary animate-pulse" />
                  <span className="text-[9px] lg:text-[11px] font-black text-primary uppercase tracking-wider">Best</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Idle State */}
      {!isAnalyzing && lines.length === 0 && (
        <div className="flex items-center justify-center py-12 text-zinc-500 bg-zinc-950/30 rounded-2xl border-2 border-zinc-900/50 border-dashed backdrop-blur-sm group/idle hover:bg-zinc-900/40 transition-all duration-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border-2 border-zinc-800 group-hover/idle:border-primary/30 transition-colors shadow-lg">
              <Play size={20} className="ml-1 text-zinc-600 group-hover/idle:text-primary transition-colors" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 group-hover/idle:text-zinc-400 transition-colors">Engine Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineAnalysisBar;
