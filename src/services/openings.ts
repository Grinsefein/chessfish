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

// Mock opening moves for common positions when API fails
export function getMockOpeningMoves(fen: string): OpeningMove[] {
  // Starting position - common first moves
  if (fen.includes('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w')) {
    return [
      { san: 'e4', uci: 'e2e4', averageRating: 1500, white: 45, draws: 8, black: 47, gameCount: 12500000 },
      { san: 'd4', uci: 'd2d4', averageRating: 1600, white: 48, draws: 9, black: 43, gameCount: 8700000 },
      { san: 'Nf3', uci: 'g1f3', averageRating: 1550, white: 46, draws: 10, black: 44, gameCount: 3200000 },
      { san: 'c4', uci: 'c2c4', averageRating: 1650, white: 47, draws: 10, black: 43, gameCount: 2100000 },
      { san: 'g3', uci: 'g2g3', averageRating: 1500, white: 45, draws: 11, black: 44, gameCount: 980000 },
    ];
  }
  
  // After 1.e4 e5
  if (fen.includes('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w')) {
    return [
      { san: 'Nf3', uci: 'g1f3', averageRating: 1600, white: 47, draws: 8, black: 45, gameCount: 5800000 },
      { san: 'Bc4', uci: 'f1c4', averageRating: 1550, white: 46, draws: 8, black: 46, gameCount: 1200000 },
      { san: 'Nc3', uci: 'b1c3', averageRating: 1580, white: 45, draws: 9, black: 46, gameCount: 890000 },
    ];
  }
  
  // After 1.e4 c5 (Sicilian)
  if (fen.includes('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w')) {
    return [
      { san: 'Nf3', uci: 'g1f3', averageRating: 1650, white: 48, draws: 8, black: 44, gameCount: 4200000 },
      { san: 'Nc3', uci: 'b1c3', averageRating: 1600, white: 47, draws: 9, black: 44, gameCount: 2100000 },
    ];
  }
  
  // After 1.d4 d5
  if (fen.includes('rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w')) {
    return [
      { san: 'c4', uci: 'c2c4', averageRating: 1700, white: 49, draws: 10, black: 41, gameCount: 3400000 },
      { san: 'Nf3', uci: 'g1f3', averageRating: 1620, white: 47, draws: 12, black: 41, gameCount: 1800000 },
      { san: 'e3', uci: 'e2e3', averageRating: 1550, white: 46, draws: 12, black: 42, gameCount: 950000 },
    ];
  }
  
  return [];
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
