export interface Opening {
  name: string;
  eco: string;
  moves: string;
  popularity: number;
}

export interface OpeningMove {
  san: string;
  uci: string;
  averageRating: number;
  white: number;
  draws: number;
  black: number;
  gameCount: number;
}

export interface OpeningExplorerData {
  opening?: Opening;
  moves: OpeningMove[];
  topGames: any[];
}

export async function getOpeningFromFEN(fen: string): Promise<Opening | null> {
  try {
    const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}`);
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data.opening && data.opening.name) {
      return {
        name: data.opening.name,
        eco: data.opening.eco || '',
        moves: data.opening.moves || '',
        popularity: data.white + data.draws + data.black || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch opening:', error);
    return null;
  }
}

export async function getOpeningExplorerData(fen: string): Promise<OpeningExplorerData | null> {
  try {
    const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&topGames=0&recentGames=0`);
    if (!response.ok) return null;
    const data = await response.json();
    
    return {
      opening: data.opening,
      moves: data.moves || [],
      topGames: data.topGames || []
    };
  } catch (error) {
    console.error('Failed to fetch opening explorer data:', error);
    return null;
  }
}

export async function getMastersExplorerData(fen: string): Promise<OpeningExplorerData | null> {
  try {
    const response = await fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`);
    if (!response.ok) return null;
    const data = await response.json();
    
    return {
      opening: data.opening,
      moves: data.moves || [],
      topGames: data.topGames || []
    };
  } catch (error) {
    console.error('Failed to fetch masters explorer data:', error);
    return null;
  }
}

// Legacy function for backward compatibility
export async function getOpeningMoves(fen: string): Promise<any[]> {
  const data = await getOpeningExplorerData(fen);
  return data?.moves || [];
}

export const POPULAR_OPENINGS: Opening[] = [
  { name: "Italian Game", eco: "C50", moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4", popularity: 100 },
  { name: "Sicilian Defense", eco: "B20", moves: "1.e4 c5", popularity: 95 },
  { name: "Ruy Lopez", eco: "C90", moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5", popularity: 90 },
  { name: "French Defense", eco: "C00", moves: "1.e4 e6", popularity: 85 },
  { name: "Caro-Kann Defense", eco: "B10", moves: "1.e4 c6", popularity: 80 },
  { name: "Queen's Gambit", eco: "D06", moves: "1.d4 d5 2.c4", popularity: 88 },
  { name: "King's Indian Defense", eco: "E60", moves: "1.d4 Nf6 2.c4 g6", popularity: 75 },
  { name: "Nimzo-Indian Defense", eco: "E20", moves: "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4", popularity: 70 },
  { name: "English Opening", eco: "A10", moves: "1.c4", popularity: 65 },
  { name: "Reti Opening", eco: "A04", moves: "1.Nf3", popularity: 60 },
];
