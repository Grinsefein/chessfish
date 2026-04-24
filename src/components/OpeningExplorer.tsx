import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  getOpeningExplorerData, 
  getMastersExplorerData, 
  getMockOpeningMoves,
  type OpeningExplorerData,
  type OpeningMove 
} from '@/services/openings';
import { BookOpen, Trophy, Users, BarChart3, Search } from 'lucide-react';

interface OpeningExplorerProps {
  fen: string;
  onMoveSelect: (move: string) => void;
}

type DatabaseType = 'lichess' | 'masters';

export function OpeningExplorer({ fen, onMoveSelect }: OpeningExplorerProps) {
  const [data, setData] = useState<OpeningExplorerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [database, setDatabase] = useState<DatabaseType>('lichess');
  const [movePath, setMovePath] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!fen) return;
      setLoading(true);
      
      let explorerData = database === 'lichess' 
        ? await getOpeningExplorerData(fen)
        : await getMastersExplorerData(fen);
      
      // If API fails, use mock data for common positions
      if (!explorerData || explorerData.moves.length === 0) {
        const mockMoves = getMockOpeningMoves(fen);
        if (mockMoves.length > 0) {
          explorerData = {
            opening: undefined,
            moves: mockMoves,
            topGames: []
          };
        }
      }
      
      setData(explorerData);
      setLoading(false);
    };

    fetchData();
  }, [fen, database]);

  const getWinPercentage = (move: OpeningMove) => {
    const total = move.white + move.draws + move.black;
    if (total === 0) return { white: 0, draws: 0, black: 0 };
    return {
      white: Math.round((move.white / total) * 100),
      draws: Math.round((move.draws / total) * 100),
      black: Math.round((move.black / total) * 100)
    };
  };

  const handleMoveClick = (move: OpeningMove) => {
    setMovePath([...movePath, move.san]);
    onMoveSelect(move.san);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-2 border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BookOpen size={16} className="text-blue-400" />
            </div>
            <span className="font-bold text-white">Theory / Explorer</span>
          </div>
        </div>

        {/* Database Toggle */}
        <div className="flex p-1 rounded-xl bg-zinc-950/50 border-2 border-zinc-800">
          <button
            onClick={() => setDatabase('lichess')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              database === 'lichess' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Users size={12} />
            Lichess
          </button>
          <button
            onClick={() => setDatabase('masters')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              database === 'masters' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Trophy size={12} />
            Masters
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : data?.opening ? (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20">
            <p className="text-sm font-bold text-white">{data.opening.name}</p>
            <p className="text-xs text-zinc-400">ECO: {data.opening.eco}</p>
          </div>
        ) : null}

        {data && data.moves.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Popular Moves ({data.moves.length})
            </p>
            
            {data.moves.slice(0, 8).map((move, index) => {
              const percentages = getWinPercentage(move);
              return (
                <button
                  key={move.uci}
                  onClick={() => handleMoveClick(move)}
                  className="w-full text-left group"
                >
                  {/* Move Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-5">{index + 1}.</span>
                      <span className="font-bold text-white group-hover:text-primary transition-colors">
                        {move.san}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {(move.gameCount / 1000).toFixed(1)}k games
                    </span>
                  </div>
                  
                  {/* Stacked Progress Bar */}
                  <div className="flex h-2.5 w-full rounded-full overflow-hidden">
                    {/* White wins - light/blue tint */}
                    <div 
                      className="h-full bg-blue-400" 
                      style={{ width: `${percentages.white}%` }} 
                    />
                    {/* Draws - gray */}
                    <div 
                      className="h-full bg-zinc-500" 
                      style={{ width: `${percentages.draws}%` }} 
                    />
                    {/* Black wins - dark/red tint */}
                    <div 
                      className="h-full bg-red-400" 
                      style={{ width: `${percentages.black}%` }} 
                    />
                  </div>
                  
                  {/* Percentage Labels */}
                  <div className="flex justify-between mt-1.5 text-[10px]">
                    <span className="text-blue-400 font-medium">{percentages.white}%</span>
                    <span className="text-zinc-500">{percentages.draws}%</span>
                    <span className="text-red-400 font-medium">{percentages.black}%</span>
                  </div>

                  {/* Masters rating info */}
                  {database === 'masters' && move.averageRating > 0 && (
                    <div className="flex items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-yellow-500/10 w-fit">
                      <BarChart3 size={10} className="text-yellow-500" />
                      <span className="text-[10px] text-yellow-500 font-medium">
                        Avg: {move.averageRating}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Search size={32} className="mb-3 opacity-30" />
            <p className="text-sm">
              {loading ? 'Loading opening data...' : 'No opening data for this position'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
