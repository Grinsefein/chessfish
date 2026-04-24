import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, AlertTriangle, Target, ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOpeningStats, getProblemOpenings, getBestOpenings } from '@/services/openingTracker';

interface OpeningStatsProps {
  userId?: string;
}

interface OpeningStat {
  ecoCode: string;
  name: string;
  color: 'white' | 'black';
  timesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  averageAccuracy: number;
}

export const OpeningStats: React.FC<OpeningStatsProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'white' | 'black' | 'problems'>('white');
  const [stats, setStats] = useState<OpeningStat[]>([]);
  const [problems, setProblems] = useState<OpeningStat[]>([]);
  const [best, setBest] = useState<OpeningStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    const [whiteStats, blackStats, problemStats, bestStats] = await Promise.all([
      getOpeningStats(userId, 'white'),
      getOpeningStats(userId, 'black'),
      getProblemOpenings(userId),
      getBestOpenings(userId)
    ]);
    
    setStats(activeTab === 'white' ? whiteStats : blackStats);
    setProblems(problemStats);
    setBest(bestStats);
    setIsLoading(false);
  };

  useEffect(() => {
    if (userId) {
      const loadTabStats = async () => {
        const tabStats = await getOpeningStats(userId, activeTab === 'problems' ? undefined : activeTab);
        setStats(tabStats);
      };
      loadTabStats();
    }
  }, [activeTab, userId]);

  const getWinRateColor = (rate: number) => {
    if (rate >= 60) return 'text-green-500';
    if (rate >= 45) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center p-4 lg:p-8 text-center">
        <BookOpen className="w-12 h-12 lg:w-16 lg:h-16 text-zinc-600 mb-4" />
        <p className="text-zinc-400 text-sm lg:text-base">Sign in to track your opening repertoire</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 lg:p-8">
        <div className="animate-spin w-6 h-6 lg:w-8 lg:h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 lg:p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm lg:text-base">Opening Repertoire</h3>
            <p className="text-[10px] lg:text-xs text-zinc-500">Track your performance by opening</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-zinc-950 rounded-xl">
          {(['white', 'black', 'problems'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 lg:py-2 text-[10px] lg:text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                activeTab === tab 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab === 'white' && 'As White'}
              {tab === 'black' && 'As Black'}
              {tab === 'problems' && 'Problems'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3">
        {activeTab === 'problems' ? (
          <>
            {problems.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-zinc-500">
                <Target className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-xs lg:text-sm">No problem openings found!</p>
                <p className="text-[10px] lg:text-xs mt-1">Keep playing to build your repertoire</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-500 mb-2 lg:mb-3">
                  <AlertTriangle className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="text-[10px] lg:text-xs font-bold uppercase">Openings to improve</span>
                </div>
                {problems.map((opening) => (
                  <OpeningCard key={`${opening.ecoCode}-${opening.color}`} opening={opening} isProblem />
                ))}
              </>
            )}

            {best.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-green-500 mt-4 lg:mt-6 mb-2 lg:mb-3">
                  <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="text-[10px] lg:text-xs font-bold uppercase">Your best openings</span>
                </div>
                {best.map((opening) => (
                  <OpeningCard key={`best-${opening.ecoCode}-${opening.color}`} opening={opening} />
                ))}
              </>
            )}
          </>
        ) : (
          stats.length === 0 ? (
            <div className="text-center py-6 lg:py-8 text-zinc-500">
              <BarChart3 className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-xs lg:text-sm">No games analyzed yet</p>
              <p className="text-[10px] lg:text-xs mt-1">Upload a PGN to start tracking</p>
            </div>
          ) : (
            stats.map((opening) => (
              <OpeningCard key={`${opening.ecoCode}-${opening.color}`} opening={opening} />
            ))
          )
        )}
      </div>
    </div>
  );
};

const OpeningCard: React.FC<{ opening: OpeningStat; isProblem?: boolean }> = ({ 
  opening, 
  isProblem 
}) => {
  const getWinRateColor = (rate: number) => {
    if (rate >= 60) return 'text-green-500';
    if (rate >= 45) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={cn(
      "p-3 lg:p-4 rounded-xl border transition-all cursor-pointer group",
      isProblem 
        ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" 
        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
            <span className="text-[10px] lg:text-xs font-mono text-zinc-500">{opening.ecoCode}</span>
            <span className={cn(
              "text-[9px] lg:text-[10px] px-1 lg:px-1.5 py-0.5 rounded font-bold uppercase shrink-0",
              opening.color === 'white' 
                ? "bg-white/10 text-white" 
                : "bg-zinc-800 text-zinc-400"
            )}>
              {opening.color}
            </span>
          </div>
          <h4 className="font-bold text-white text-xs lg:text-sm truncate pr-2">{opening.name}</h4>
          
          <div className="flex items-center gap-2 lg:gap-4 mt-2 text-[10px] lg:text-xs">
            <span className="text-zinc-500">
              {opening.timesPlayed} games
            </span>
            <span className={cn("font-bold", getWinRateColor(opening.winRate))}>
              {opening.winRate}% win
            </span>
            <span className="text-zinc-600 hidden sm:inline">
              {opening.wins}W {opening.draws}D {opening.losses}L
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 lg:gap-1 shrink-0">
          <div className={cn(
            "text-base lg:text-lg font-bold",
            getWinRateColor(opening.winRate)
          )}>
            {opening.winRate}%
          </div>
          <div className="text-[10px] lg:text-xs text-zinc-500">
            {opening.averageAccuracy}% acc
          </div>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="flex h-1 lg:h-1.5 rounded-full overflow-hidden mt-2 lg:mt-3 bg-zinc-800">
        <div 
          className="bg-green-500" 
          style={{ width: `${(opening.wins / opening.timesPlayed) * 100}%` }} 
        />
        <div 
          className="bg-yellow-500" 
          style={{ width: `${(opening.draws / opening.timesPlayed) * 100}%` }} 
        />
        <div 
          className="bg-red-500" 
          style={{ width: `${(opening.losses / opening.timesPlayed) * 100}%` }} 
        />
      </div>
    </div>
  );
};
