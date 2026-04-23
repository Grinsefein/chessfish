import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  analyzeGame, 
  type GameReview as GameReviewType,
  type MoveAnalysis,
  getClassificationColor,
  getClassificationLabel 
} from '@/services/gameReview';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  BookOpen,
  RotateCcw
} from 'lucide-react';

interface GameReviewProps {
  pgn: string;
  onMoveClick: (moveIndex: number) => void;
  onClose: () => void;
  evaluateFen: (fen: string, depth?: number) => Promise<number>;
}

export function GameReview({ pgn, onMoveClick, onClose, evaluateFen }: GameReviewProps) {
  const [review, setReview] = useState<GameReviewType | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);

  const startReview = async () => {
    setLoading(true);
    const result = await analyzeGame(pgn, evaluateFen);
    setReview(result);
    setLoading(false);
  };

  const handleMoveClick = (index: number) => {
    setSelectedMove(index);
    onMoveClick(index);
  };

  if (loading) {
    return (
      <Card className="bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm font-bold">Analyzing game...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take a minute</p>
        </CardContent>
      </Card>
    );
  }

  if (!review) {
    return (
      <Card className="bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <CardHeader className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <span className="text-sm font-black uppercase tracking-widest">Game Review</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Sparkles size={32} className="mx-auto mb-4 text-primary opacity-50" />
          <p className="text-sm font-bold mb-2">Ready to review your game?</p>
          <p className="text-xs text-muted-foreground mb-4">
            We'll analyze every move, find blunders, and suggest improvements.
          </p>
          <Button onClick={startReview} className="font-bold">
            Start Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
      <CardHeader className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            <span className="text-sm font-black uppercase tracking-widest">Game Review</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={startReview} className="h-6 px-2">
              <RotateCcw size={12} className="mr-1" />
              Re-analyze
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 overflow-y-auto">
        {/* Accuracy Display */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">White Accuracy</p>
            <p className="text-2xl font-black text-primary">{review.accuracy.white}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-center">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Black Accuracy</p>
            <p className="text-2xl font-black text-primary">{review.accuracy.black}%</p>
          </div>
        </div>

        {/* CPL Stats */}
        <div className="flex gap-3 mb-4 text-[10px]">
          <div className="flex-1 p-2 bg-white/5 rounded text-center">
            <span className="text-muted-foreground">Avg CPL (White): </span>
            <span className="font-bold">{review.averageCPL.white}</span>
          </div>
          <div className="flex-1 p-2 bg-white/5 rounded text-center">
            <span className="text-muted-foreground">Avg CPL (Black): </span>
            <span className="font-bold">{review.averageCPL.black}</span>
          </div>
        </div>

        {/* Classifications Summary */}
        <div className="mb-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Move Quality</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(review.classifications.white).map(([type, count]) => {
              if (count === 0) return null;
              return (
                <span 
                  key={`w-${type}`}
                  className="px-2 py-1 text-[10px] font-bold rounded"
                  style={{ 
                    backgroundColor: `${getClassificationColor(type)}20`,
                    color: getClassificationColor(type)
                  }}
                >
                  {count} {getClassificationLabel(type)} (W)
                </span>
              );
            })}
            {Object.entries(review.classifications.black).map(([type, count]) => {
              if (count === 0) return null;
              return (
                <span 
                  key={`b-${type}`}
                  className="px-2 py-1 text-[10px] font-bold rounded"
                  style={{ 
                    backgroundColor: `${getClassificationColor(type)}20`,
                    color: getClassificationColor(type)
                  }}
                >
                  {count} {getClassificationLabel(type)} (B)
                </span>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 bg-white/5 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={12} className="text-primary" />
            <span className="text-xs font-bold">Summary</span>
          </div>
          <p className="text-xs text-muted-foreground">{review.summary}</p>
        </div>

        {/* Suggestions */}
        {review.suggestions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-xs font-bold">Suggestions</span>
            </div>
            <ul className="space-y-2">
              {review.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ChevronRight size={10} className="mt-0.5 text-primary flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Move List */}
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">
            Critical Moves
          </p>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {review.moveAnalyses
              .filter(m => ['blunder', 'mistake', 'brilliant'].includes(m.classification))
              .map((move, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMoveClick(review.moveAnalyses.indexOf(move))}
                  className={`w-full flex items-center gap-2 p-2 rounded text-left transition-all ${
                    selectedMove === review.moveAnalyses.indexOf(move) 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getClassificationColor(move.classification) }}
                  />
                  <span className="text-xs font-mono w-8 text-muted-foreground">
                    {move.moveNumber}.
                  </span>
                  <span className="text-sm font-bold">{move.san}</span>
                  <span 
                    className="text-[10px] ml-auto px-1.5 py-0.5 rounded font-bold"
                    style={{ 
                      backgroundColor: `${getClassificationColor(move.classification)}20`,
                      color: getClassificationColor(move.classification)
                    }}
                  >
                    {getClassificationLabel(move.classification)}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
