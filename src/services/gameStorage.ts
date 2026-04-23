import { supabase, Game, Move } from '@/lib/supabase';

export async function saveGame(gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('games')
    .insert([gameData])
    .select()
    .single();

  if (error) {
    console.error('Error saving game:', error);
    throw error;
  }

  return data;
}

export async function getGames() {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('date_played', { ascending: false });

  if (error) {
    console.error('Error fetching games:', error);
    throw error;
  }

  return data;
}

export async function getGameById(id: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching game:', error);
    throw error;
  }

  return data;
}

export async function searchByFEN(fen: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .ilike('fen', `%${fen}%`)
    .order('date_played', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching by FEN:', error);
    throw error;
  }

  return data;
}

export async function updateGame(id: string, updates: Partial<Game>) {
  const { data, error } = await supabase
    .from('games')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating game:', error);
    throw error;
  }

  return data;
}

export async function deleteGame(id: string) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting game:', error);
    throw error;
  }

  return true;
}

export async function saveMoves(moves: Omit<Move, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('moves')
    .insert(moves)
    .select();

  if (error) {
    console.error('Error saving moves:', error);
    throw error;
  }

  return data;
}

export async function getMovesByGameId(gameId: string) {
  const { data, error } = await supabase
    .from('moves')
    .select('*')
    .eq('game_id', gameId)
    .order('move_number', { ascending: true });

  if (error) {
    console.error('Error fetching moves:', error);
    throw error;
  }

  return data;
}
