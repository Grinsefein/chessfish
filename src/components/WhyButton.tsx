import React, { useState } from 'react';
import { HelpCircle, Loader2, Sparkles } from 'lucide-react';
import { generateCommentary } from '@/services/aiCommentary';
import { detectAllTactics } from '@/services/tacticsDetector';

interface WhyButtonProps {
  fen: string;
  userMove: string;
  userMoveSan: string;
  evaluation: number;
  previousEval: number;
  bestMove: string;
  classification: string;
  centipawnLoss: number;
  size?: 'sm' | 'md';
}

export const WhyButton: React.FC<WhyButtonProps> = ({
  fen,
  userMove,
  userMoveSan,
  evaluation,
  previousEval,
  bestMove,
  classification,
  centipawnLoss,
  size = 'md'
}) => {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (commentary) {
      setShowTooltip(!showTooltip);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const tactics = detectAllTactics(fen);
      
      const result = await generateCommentary({
        fen,
        userMove,
        userMoveSan,
        evaluation,
        previousEval,
        bestMove,
        bestMoveSan: bestMove, // Simplified
        classification,
        centipawnLoss,
        tactics
      });
      
      setCommentary(result);
      setShowTooltip(true);
    } catch (error) {
      console.error('Failed to generate commentary:', error);
      setCommentary('Unable to generate commentary. Try again later.');
      setShowTooltip(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'w-5 h-5 text-[10px]' 
    : 'w-7 h-7 text-xs';

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          ${sizeClasses}
          rounded-full flex items-center justify-center
          transition-all duration-200
          ${commentary 
            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' 
            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
          }
          ${isLoading ? 'opacity-70' : ''}
        `}
        title="Why was this move played?"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : commentary ? (
          <Sparkles className="w-3 h-3" />
        ) : (
          <HelpCircle className="w-3 h-3" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && commentary && (
        <>
          {/* Backdrop click handler */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowTooltip(false)}
          />
          
          {/* Tooltip content */}
          <div className="absolute z-50 left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl">
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2">
              <div className="w-2 h-2 bg-zinc-900 border-l border-b border-zinc-700 rotate-45" />
            </div>
            
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                {commentary}
              </p>
            </div>
            
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-white"
            >
              ×
            </button>
          </div>
        </>
      )}
    </div>
  );
};
