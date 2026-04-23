import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ogovehasgxvcfsvkella.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Game {
  id?: string;
  user_id?: string;
  pgn: string;
  fen: string;
  result?: string;
  white_player?: string;
  black_player?: string;
  date_played?: string;
  analysis_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface Move {
  id?: string;
  game_id: string;
  move_number: number;
  from_square: string;
  to_square: string;
  piece: string;
  captured_piece?: string;
  san: string;
  evaluation?: number;
  depth?: number;
  created_at?: string;
}
