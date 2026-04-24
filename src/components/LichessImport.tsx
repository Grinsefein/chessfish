import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Download, 
  Search, 
  Loader2, 
  User, 
  Clock,
  ChevronRight,
  FileText,
  RefreshCw
} from 'lucide-react';

interface GameInfo {
  id: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  color: 'white' | 'black';
  date: string;
  opening?: string;
}

interface LichessImportProps {
  onImportPgn: (pgn: string) => void;
  onImportFen: (fen: string) => void;
}

export const LichessImport: React.FC<LichessImportProps> = ({ 
  onImportPgn, 
  onImportFen 
}) => {
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock fetch function (real API to be implemented later)
  const fetchGames = async () => {
    if (!username.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data for demonstration
    const mockGames: GameInfo[] = [
      { id: '1', opponent: 'MagnusCarlsen', result: 'loss', color: 'white', date: '2024-01-15', opening: 'Sicilian Defense' },
      { id: '2', opponent: 'HikaruNakamura', result: 'draw', color: 'black', date: '2024-01-14', opening: "Queen's Gambit" },
      { id: '3', opponent: 'FabianoCaruana', result: 'win', color: 'white', date: '2024-01-12', opening: 'Ruy Lopez' },
      { id: '4', opponent: 'DingLiren', result: 'loss', color: 'black', date: '2024-01-10', opening: 'English Opening' },
      { id: '5', opponent: 'IanNepomniachtchi', result: 'win', color: 'white', date: '2024-01-08', opening: 'French Defense' },
    ];
    
    setGames(mockGames);
    setIsLoading(false);
  };

  const handleFenImport = () => {
    if (fenInput.trim()) {
      onImportFen(fenInput.trim());
      setFenInput('');
    }
  };

  const handlePgnImport = () => {
    if (pgnInput.trim()) {
      onImportPgn(pgnInput.trim());
      setPgnInput('');
    }
  };

  const handleGameSelect = (game: GameInfo) => {
    // In real implementation, this would fetch the full PGN
    const mockPgn = `[Event "Lichess Game"]
[Site "https://lichess.org/${game.id}"]
[Date "${game.date}"]
[White "${game.color === 'white' ? 'You' : game.opponent}"]
[Black "${game.color === 'black' ? 'You' : game.opponent}"]
[Result "${game.result === 'win' ? (game.color === 'white' ? '1-0' : '0-1') : game.result === 'loss' ? (game.color === 'white' ? '0-1' : '1-0') : '1/2-1/2'}"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7`;
    
    onImportPgn(mockPgn);
  };

  const getResultColor = (result: string, color: string) => {
    if (result === 'win') return color === 'white' ? 'text-blue-400' : 'text-red-400';
    if (result === 'loss') return color === 'white' ? 'text-red-400' : 'text-blue-400';
    return 'text-zinc-400';
  };

  const getResultText = (result: string) => {
    if (result === 'win') return 'Victory';
    if (result === 'loss') return 'Defeat';
    return 'Draw';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Download size={16} className="text-green-400" />
          </div>
          <span className="font-bold text-white">Import Game</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* FEN Input */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={12} />
            FEN Position
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
              className={cn(
                "flex-1 h-10 px-3 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white",
                "placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              )}
            />
            <Button 
              onClick={handleFenImport}
              disabled={!fenInput.trim()}
              className="h-10 px-4 bg-primary hover:bg-primary/90"
            >
              Load
            </Button>
          </div>
        </div>

        {/* PGN Input */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={12} />
            PGN Game
          </label>
          <textarea
            placeholder='[Event "Game"] 1. e4 e5 2. Nf3 Nc6...'
            value={pgnInput}
            onChange={(e) => setPgnInput(e.target.value)}
            className={cn(
              "w-full h-24 px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white resize-none",
              "placeholder:text-zinc-600",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            )}
          />
          <Button 
            onClick={handlePgnImport}
            disabled={!pgnInput.trim()}
            className="w-full h-10 bg-primary hover:bg-primary/90"
          >
            Load PGN
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-zinc-500 font-medium">or fetch from Lichess</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Lichess Username */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <User size={12} />
            Lichess Username
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGames()}
              className={cn(
                "flex-1 h-10 px-3 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white",
                "placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              )}
            />
            <Button 
              onClick={fetchGames}
              disabled={!username.trim() || isLoading}
              className="h-10 px-4 bg-blue-500 hover:bg-blue-500/90"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Games List */}
        {games.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Recent Games
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchGames}
                disabled={isLoading}
                className="h-7 px-2 text-zinc-400 hover:text-white"
              >
                <RefreshCw size={12} className={cn(isLoading && "animate-spin")} />
              </Button>
            </div>

            <div className="space-y-2">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className="w-full p-3 rounded-xl bg-zinc-950/50 border border-white/5 hover:border-white/10 hover:bg-zinc-900/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Color indicator */}
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        game.color === 'white' ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-600'
                      )} />
                      <span className="font-bold text-white text-sm">
                        vs {game.opponent}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Clock size={10} />
                      <span>{game.date}</span>
                    </div>
                    <span className={cn(
                      "text-xs font-bold",
                      getResultColor(game.result, game.color)
                    )}>
                      {getResultText(game.result)}
                    </span>
                  </div>

                  {game.opening && (
                    <div className="mt-2 text-[10px] text-zinc-500 truncate">
                      {game.opening}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && games.length === 0 && !error && username && (
          <div className="text-center py-8 text-zinc-500">
            <User size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter a username to fetch games</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LichessImport;
