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
import { motion } from 'framer-motion';

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
    <div className="w-full mt-6 space-y-4">
      {/* Main Control Bar */}
      <div className="flex items-center gap-4 p-4 rounded-[1.5rem] glass-card shadow-2xl relative overflow-hidden">
        {/* Subtle internal glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={isAnalyzing ? stopAnalysis : startAnalysis}
          className={cn(
            "h-14 w-14 rounded-2xl transition-all duration-300 relative z-10",
            isAnalyzing 
              ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-lg shadow-amber-500/10" 
              : "bg-primary/20 text-primary hover:bg-primary/30 shadow-lg shadow-primary/20 premium-gradient text-white border border-white/20"
          )}
        >
          {isAnalyzing ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </Button>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevMove}
            className="h-12 w-12 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMove}
            className="h-12 w-12 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronRight size={24} />
          </Button>
        </div>

        {/* Evaluation Display */}
        <div className="flex-1 flex items-center justify-center gap-4 relative z-10">
          <div className={cn("text-4xl font-black tracking-tighter mix-blend-plus-lighter", getEvalColor(currentEvaluation, lines[0]?.isMate))}>
            {formatEval(currentEvaluation, lines[0]?.isMate)}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Depth</span>
            <span className="text-sm font-black text-primary">{depth}</span>
          </div>
        </div>

        {/* Battery / Energy Status */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 relative z-10">
          {energySavingMode ? (
            <BatteryMedium size={20} className="text-green-500" />
          ) : (
            <Zap size={20} className="text-amber-400" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {energySavingMode ? 'ECO' : 'MAX'}
          </span>
        </div>
      </div>

      {/* Multi-PV Lines */}
      {lines.length > 0 && (
        <div className="space-y-2">
          {lines.slice(0, 3).map((line, index) => (
            <button
              key={index}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group",
                "bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05]",
                index === 0 && "bg-white/[0.05] border-primary/30 shadow-lg shadow-primary/5"
              )}
            >
              {/* Line Glow */}
              <div className={cn(
                "absolute inset-y-0 left-0 w-1 transition-all duration-500",
                index === 0 ? "bg-primary" : "bg-transparent group-hover:bg-white/20"
              )} />

              {/* Line Number */}
              <span className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black",
                index === 0 ? "bg-primary text-white" : "bg-white/5 text-zinc-500"
              )}>
                {index + 1}
              </span>

              {/* Evaluation */}
              <span className={cn(
                "text-base font-black w-16 tracking-tight",
                getEvalColor(line.evaluation, line.isMate)
              )}>
                {formatEval(line.evaluation, line.isMate)}
              </span>

              {/* Best Move */}
              <div className="flex flex-col w-20">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Move</span>
                <span className="text-sm font-black text-white">{line.bestMove || '...'}</span>
              </div>

              {/* PV Line */}
              <span className="flex-1 text-xs text-zinc-500 truncate font-mono tracking-tight group-hover:text-zinc-300 transition-colors">
                {formatPv(line.pv)}
              </span>

              {/* Best indicator */}
              {index === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Best</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Idle State */}
      {!isAnalyzing && lines.length === 0 && (
        <div className="flex items-center justify-center py-8 text-zinc-500 glass-card rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Play size={14} className="ml-0.5 opacity-50" />
            </div>
            <span className="text-sm font-bold tracking-tight opacity-50 uppercase tracking-[0.1em]">Engine Idle</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineAnalysisBar;
