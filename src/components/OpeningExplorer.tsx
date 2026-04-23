import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getOpeningExplorerData, 
  getMastersExplorerData, 
  getMockOpeningMoves,
  type OpeningExplorerData,
  type OpeningMove 
} from '@/services/openings';
import { BookOpen, Trophy, Users, ChevronRight, BarChart3 } from 'lucide-react';

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
    <Card className="bg-card border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <CardHeader className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <span className="text-sm font-black uppercase tracking-widest">Opening Explorer</span>
          </div>
          <div className="flex bg-white/5 rounded p-0.5">
            <button
              onClick={() => setDatabase('lichess')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                database === 'lichess' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
              }`}
            >
              <Users size={10} className="inline mr-1" />
              Lichess
            </button>
            <button
              onClick={() => setDatabase('masters')}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                database === 'masters' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
              }`}
            >
              <Trophy size={10} className="inline mr-1" />
              Masters
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : data?.opening ? (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <p className="text-xs font-bold text-primary">{data.opening.name}</p>
            <p className="text-[10px] text-muted-foreground">ECO: {data.opening.eco}</p>
          </div>
        ) : null}

        {data && data.moves.length > 0 ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">
              Top Moves ({data.moves.length})
            </p>
            {data.moves.slice(0, 10).map((move, index) => {
              const percentages = getWinPercentage(move);
              return (
                <button
                  key={move.uci}
                  onClick={() => handleMoveClick(move)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-4">{index + 1}.</span>
                      <span className="text-sm font-bold text-primary group-hover:scale-110 transition-transform">
                        {move.san}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {move.gameCount.toLocaleString()} games
                    </div>
                  </div>
                  
                  {/* Win Rate Bar */}
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/5">
                    <div 
                      className="h-full bg-white/80" 
                      style={{ width: `${percentages.white}%` }} 
                    />
                    <div 
                      className="h-full bg-muted-foreground/40" 
                      style={{ width: `${percentages.draws}%` }} 
                    />
                    <div 
                      className="h-full bg-red-500/80" 
                      style={{ width: `${percentages.black}%` }} 
                    />
                  </div>
                  
                  <div className="flex justify-between mt-1 text-[9px] font-bold">
                    <span className="text-white/80">{percentages.white}% W</span>
                    <span className="text-muted-foreground">{percentages.draws}% D</span>
                    <span className="text-red-400">{percentages.black}% B</span>
                  </div>

                  {database === 'masters' && move.averageRating > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-yellow-400">
                      <BarChart3 size={8} />
                      <span>Avg Rating: {move.averageRating}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">
              {loading ? 'Loading...' : 'No opening data available for this position'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
