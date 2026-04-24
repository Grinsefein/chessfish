import React, { useState, useEffect } from 'react';
import { useGameStore, type MoveClassification } from '@/store/gameStore';
import { useEngineStore } from '@/store/engineStore';
import { AccuracyGauge } from './AccuracyGauge';
import { cn } from '@/lib/utils';
import { WhyButton } from './WhyButton';
import { Brain, RotateCcw } from 'lucide-react';
import { 
  Sparkles,
  Zap,
  Star,
  ThumbsUp,
  Info,
  AlertCircle,
  XCircle,
  Trophy,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface AnalyzedMove {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  evaluation: number;
  bestMove: string;
  classification: MoveClassification;
  centipawnLoss: number;
  fenBefore: string;
}

interface GameReviewProps {
  analysisData?: {
    moves: AnalyzedMove[];
    accuracyWhite: number;
    accuracyBlack: number;
    openingEco?: string;
    openingName?: string;
  };
  onPracticeMistakes?: () => void;
}

const CLASSIFICATION_LABELS: Record<MoveClassification, {
  label: string;
  color: string;
  icon: React.ElementType;
}> = {
  brilliant: { label: 'Brilliant', color: 'text-teal-400', icon: Sparkles },
  great: { label: 'Great Move', color: 'text-blue-400', icon: Zap },
  best: { label: 'Best Move', color: 'text-green-500', icon: Star },
  excellent: { label: 'Excellent', color: 'text-green-400', icon: ThumbsUp },
  good: { label: 'Good', color: 'text-zinc-400', icon: ThumbsUp },
  inaccuracy: { label: 'Inaccuracy', color: 'text-yellow-500', icon: Info },
  mistake: { label: 'Mistake', color: 'text-orange-500', icon: AlertCircle },
  blunder: { label: 'Blunder', color: 'text-red-500', icon: XCircle },
  missed_win: { label: 'Missed Win', color: 'text-purple-500', icon: Trophy },
  book: { label: 'Book Move', color: 'text-amber-600', icon: BookOpen },
};

export const GameReview: React.FC<GameReviewProps> = ({ 
  analysisData,
  onPracticeMistakes 
}) => {
  const { accuracy, counts, pgn, history, setAccuracy, setClassification } = useGameStore();
  const { analyze } = useEngineStore();
  const [selectedMove, setSelectedMove] = useState<number | null>(null);

  const handleReview = async () => {
    // Trigger batch analysis through the engine
    // This will be handled by the parent component with batchAnalysis service
    console.log('Requesting game analysis...');
  };

  const hasMistakes = counts.blunder > 0 || counts.mistake > 0;

  if (!analysisData && accuracy === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 h-full bg-zinc-900 rounded-2xl border-2 border-zinc-800 border-dashed m-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
          <Trophy className="text-zinc-600" size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Game Review</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
            Finish the game to see your accuracy and move classifications
          </p>
        </div>
        <button
          onClick={handleReview}
          className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-[0_4px_0_0_#4a6728] active:translate-y-[2px] active:shadow-none transition-all"
        >
          Review Game
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
      {/* Accuracy Header */}
      <div className="p-8 flex flex-col items-center bg-zinc-950 border-b-2 border-zinc-800 shrink-0">
        <AccuracyGauge accuracy={accuracy} />

        <div className="mt-8 grid grid-cols-2 gap-3 w-full">
          <div className="p-4 rounded-2xl bg-zinc-900 border-2 border-zinc-800 flex flex-col items-center shadow-[0_4px_0_0_#09090b]">
            <span className="text-2xl font-black text-white tracking-tighter">{counts.best + counts.brilliant + counts.great}</span>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Great Moves</span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900 border-2 border-zinc-800 flex flex-col items-center shadow-[0_4px_0_0_#09090b]">
            <span className="text-2xl font-black text-red-500 tracking-tighter">{counts.blunder}</span>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Blunders</span>
          </div>
        </div>
      </div>

      {/* Move Breakdown */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-2">
          {(Object.keys(CLASSIFICATION_LABELS) as MoveClassification[]).map((key) => {
            const count = counts[key] || 0;
            if (count === 0 && !['blunder', 'mistake', 'brilliant', 'best'].includes(key)) return null;

            const config = CLASSIFICATION_LABELS[key];
            const Icon = config.icon;

            return (
              <div
                key={key}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border-2 border-zinc-800 group hover:border-zinc-700 transition-colors shadow-[0_2px_0_0_#09090b]"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border-2 border-white/5", config.color.replace('text-', 'bg-') + '/10')}>
                    <Icon className={config.color} size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-tight">{config.label}</div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{count} moves</div>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-600 hover:text-white">
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Action */}
      {/* Move List with Analysis */}
      {analysisData && (
        <div className="flex-1 overflow-y-auto border-t-2 border-zinc-800">
          <div className="p-2 space-y-1">
            {analysisData.moves.map((move, index) => {
              const config = CLASSIFICATION_LABELS[move.classification];
              const Icon = config.icon;
              const isSelected = selectedMove === index;
              
              return (
                <div
                  key={index}
                  onClick={() => setSelectedMove(index)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                    isSelected ? "bg-zinc-800" : "hover:bg-zinc-900"
                  )}
                >
                  <span className="text-xs text-zinc-500 w-12">
                    {move.moveNumber}.{move.color === 'b' ? '..' : ''}
                  </span>
                  
                  <span className="text-sm text-white font-mono flex-1">
                    {move.san}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs", config.color)}>
                      {move.evaluation > 0 ? '+' : ''}{move.evaluation.toFixed(1)}
                    </span>
                    
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center", config.color.replace('text-', 'bg-') + '/20')}>
                      <Icon className={cn("w-3 h-3", config.color)} />
                    </div>
                    
                    <WhyButton
                      fen={move.fenBefore}
                      userMove={move.san}
                      userMoveSan={move.san}
                      evaluation={move.evaluation}
                      previousEval={index > 0 ? analysisData.moves[index - 1].evaluation : 0}
                      bestMove={move.bestMove}
                      classification={move.classification}
                      centipawnLoss={move.centipawnLoss}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 bg-zinc-950 border-t-2 border-zinc-800 shrink-0 space-y-2">
        {hasMistakes && onPracticeMistakes && (
          <button 
            onClick={onPracticeMistakes}
            className="w-full py-3 bg-primary/20 text-primary border border-primary/50 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/30 transition-colors"
          >
            <Brain className="w-4 h-4" />
            Practice Mistakes ({counts.blunder + counts.mistake} puzzles)
          </button>
        )}
        
        <button className="w-full py-3 bg-zinc-800 text-white rounded-xl font-black text-xs uppercase tracking-wider border-2 border-zinc-700 shadow-[0_4px_0_0_#09090b] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3">
          <RotateCcw size={16} />
          Analyze Another Game
        </button>
      </div>
    </div>
  );
};
