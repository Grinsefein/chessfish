import { supabase } from '@/lib/supabase';
import { Chess } from 'chess.js';

// ECO database (simplified - top 50 openings)
const ECO_DB: Array<{
  eco: string;
  name: string;
  moves: string[];
  variation?: string;
}> = [
  // Open Games
  { eco: 'C20', name: "King's Pawn Game", moves: ['e4', 'e5'] },
  { eco: 'C40', name: "King's Knight Opening", moves: ['e4', 'e5', 'Nf3'] },
  { eco: 'C44', name: "King's Knight Game", moves: ['e4', 'e5', 'Nf3', 'Nc6'] },
  { eco: 'C60', name: "Ruy Lopez", moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
  { eco: 'C65', name: "Ruy Lopez, Berlin Defense", moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
  { eco: 'C50', name: "Giuoco Piano", moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] },
  { eco: 'C55', name: "Two Knights Defense", moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
  { eco: 'C30', name: "King's Gambit", moves: ['e4', 'e5', 'f4'] },
  { eco: 'C45', name: "Scotch Game", moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  
  // Sicilian
  { eco: 'B20', name: "Sicilian Defense", moves: ['e4', 'c5'] },
  { eco: 'B32', name: "Sicilian, Lowenthal", moves: ['e4', 'c5', 'Nf3', 'Nc6'] },
  { eco: 'B40', name: "Sicilian, French Variation", moves: ['e4', 'c5', 'Nf3', 'e6'] },
  { eco: 'B44', name: "Sicilian, Taimanov", moves: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'Nc6'] },
  { eco: 'B90', name: "Sicilian, Najdorf", moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
  { eco: 'B53', name: "Sicilian, Chekhover", moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Qxd4'] },
  
  // French
  { eco: 'C00', name: "French Defense", moves: ['e4', 'e6'] },
  { eco: 'C05', name: "French, Tarrasch", moves: ['e4', 'e6', 'd4', 'd5', 'Nd2'] },
  { eco: 'C11', name: "French, Steinitz", moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'] },
  
  // Caro-Kann
  { eco: 'B10', name: "Caro-Kann Defense", moves: ['e4', 'c6'] },
  { eco: 'B12', name: "Caro-Kann, Advance", moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
  { eco: 'B18', name: "Caro-Kann, Classical", moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] },
  
  // Pirc/Modern
  { eco: 'B07', name: "Pirc Defense", moves: ['e4', 'd6', 'd4', 'Nf6'] },
  { eco: 'B06', name: "Modern Defense", moves: ['e4', 'g6'] },
  
  // Queen's Pawn
  { eco: 'D00', name: "Queen's Pawn Game", moves: ['d4', 'd5'] },
  { eco: 'D06', name: "Queen's Gambit", moves: ['d4', 'd5', 'c4'] },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: ['d4', 'd5', 'c4', 'e6'] },
  { eco: 'D10', name: "Slav Defense", moves: ['d4', 'd5', 'c4', 'c6'] },
  { eco: 'D85', name: "Grünfeld Defense", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },
  { eco: 'E00', name: "Catalan/Queen's Indian", moves: ['d4', 'Nf6', 'c4', 'e6'] },
  { eco: 'E20', name: "Nimzo-Indian", moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { eco: 'E60', name: "King's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'g6'] },
  { eco: 'E90', name: "King's Indian, Classical", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3'] },
  
  // English
  { eco: 'A10', name: "English Opening", moves: ['c4'] },
  { eco: 'A20', name: "English, Sicilian Reversed", moves: ['c4', 'e5'] },
  { eco: 'A30', name: "English, Symmetrical", moves: ['c4', 'c5'] },
  
  // Réti
  { eco: 'A04', name: "Réti Opening", moves: ['Nf3'] },
  { eco: 'A07', name: "King's Indian Attack", moves: ['Nf3', 'd5', 'g3'] },
  { eco: 'A09', name: "Réti Accepted", moves: ['Nf3', 'd5', 'c4', 'dxc4'] },
  
  // Other
  { eco: 'A40', name: "Queen's Pawn, Englund", moves: ['d4', 'e5'] },
  { eco: 'B01', name: "Scandinavian Defense", moves: ['e4', 'd5'] },
  { eco: 'B02', name: "Alekhine's Defense", moves: ['e4', 'Nf6'] },
  { eco: 'A51', name: "Budapest Gambit", moves: ['d4', 'Nf6', 'c4', 'e5'] },
  { eco: 'D00', name: "Blackmar-Diemer Gambit", moves: ['d4', 'd5', 'e4'] },
];

// Detect opening from move list
export function detectOpening(moves: string[]): { eco?: string; name?: string } {
  for (const opening of ECO_DB) {
    if (moves.length >= opening.moves.length) {
      const match = opening.moves.every((move, i) => 
        moves[i].toLowerCase().startsWith(move.toLowerCase()) ||
        moves[i].includes(move)
      );
      if (match) {
        return { eco: opening.eco, name: opening.name };
      }
    }
  }
  return {};
}

// Update opening stats after game analysis
export async function updateOpeningStats(
  userId: string,
  pgn: string,
  color: 'white' | 'black',
  result: 'win' | 'draw' | 'loss',
  accuracy: number,
  averageCPL: number
): Promise<void> {
  const game = new Chess();
  if (!game.loadPgn(pgn)) return undefined;
  
  const moves = game.history();
  const opening = detectOpening(moves);
  
  if (!opening.eco) return;
  
  // Check if entry exists
  const { data: existing } = await supabase
    .from('opening_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('eco_code', opening.eco)
    .eq('color', color)
    .maybeSingle();
  
  if (existing) {
    // Update existing
    const wins = existing.wins + (result === 'win' ? 1 : 0);
    const draws = existing.draws + (result === 'draw' ? 1 : 0);
    const losses = existing.losses + (result === 'loss' ? 1 : 0);
    const totalGames = wins + draws + losses;
    
    await supabase
      .from('opening_stats')
      .update({
        times_played: existing.times_played + 1,
        wins,
        draws,
        losses,
        total_accuracy: ((existing.total_accuracy * existing.times_played) + accuracy) / (existing.times_played + 1),
        average_cpl: ((existing.average_cpl * existing.times_played) + averageCPL) / (existing.times_played + 1),
        last_played: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new
    await supabase
      .from('opening_stats')
      .insert({
        user_id: userId,
        eco_code: opening.eco,
        opening_name: opening.name,
        color,
        times_played: 1,
        wins: result === 'win' ? 1 : 0,
        draws: result === 'draw' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0,
        total_accuracy: accuracy,
        average_cpl: averageCPL
      });
  }
}

// Get opening stats for user
export async function getOpeningStats(userId: string, color?: 'white' | 'black'): Promise<Array<{
  ecoCode: string;
  name: string;
  color: 'white' | 'black';
  timesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  averageAccuracy: number;
  averageCPL: number;
}>> {
  let query = supabase
    .from('opening_stats')
    .select('*')
    .eq('user_id', userId);
  
  if (color) {
    query = query.eq('color', color);
  }
  
  const { data, error } = await query.order('times_played', { ascending: false });
  
  if (error || !data) return [];
  
  return data.map(row => ({
    ecoCode: row.eco_code,
    name: row.opening_name,
    color: row.color,
    timesPlayed: row.times_played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    winRate: row.times_played > 0 
      ? Math.round(((row.wins + row.draws * 0.5) / row.times_played) * 100) 
      : 0,
    averageAccuracy: Math.round(row.total_accuracy || 0),
    averageCPL: row.average_cpl || 0
  }));
}

// Get "problem openings" - played often but low win rate
export async function getProblemOpenings(userId: string): Promise<Array<{
  ecoCode: string;
  name: string;
  color: 'white' | 'black';
  timesPlayed: number;
  winRate: number;
  averageAccuracy: number;
}>> {
  const stats = await getOpeningStats(userId);
  
  return stats
    .filter(s => s.timesPlayed >= 3 && s.winRate < 45)
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 5);
}

// Get best openings - played often with good results
export async function getBestOpenings(userId: string): Promise<Array<{
  ecoCode: string;
  name: string;
  color: 'white' | 'black';
  timesPlayed: number;
  winRate: number;
}>> {
  const stats = await getOpeningStats(userId);
  
  return stats
    .filter(s => s.timesPlayed >= 3 && s.winRate > 55)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5);
}
