import { supabase } from '@/lib/supabase';

export interface CachedPosition {
  fen_hash: string;
  fen: string;
  evaluation: number;
  depth: number;
  best_move: string;
  pv?: string;
  multi_pv: number;
}

// Simple FEN hash function (can be improved with Zobrist later)
function hashFEN(fen: string): string {
  // Use a simple hash - for production, consider Zobrist hashing
  let hash = 0;
  for (let i = 0; i < fen.length; i++) {
    const char = fen.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

export async function getCachedPosition(fen: string): Promise<CachedPosition | null> {
  const fenHash = hashFEN(fen);
  
  const { data, error } = await supabase
    .from('position_cache')
    .select('*')
    .eq('fen_hash', fenHash)
    .single();
  
  if (error || !data) return null;
  
  // Update hit count and last accessed
  await supabase
    .from('position_cache')
    .update({ 
      hit_count: (data.hit_count || 0) + 1,
      last_accessed: new Date().toISOString()
    })
    .eq('id', data.id);
  
  return {
    fen_hash: data.fen_hash,
    fen: data.fen,
    evaluation: parseFloat(data.evaluation),
    depth: data.depth,
    best_move: data.best_move,
    pv: data.pv,
    multi_pv: data.multi_pv
  };
}

export async function cachePosition(
  fen: string, 
  evaluation: number, 
  depth: number, 
  bestMove: string,
  pv?: string,
  multiPv: number = 1
): Promise<void> {
  const fenHash = hashFEN(fen);
  
  const { error } = await supabase
    .from('position_cache')
    .upsert({
      fen_hash: fenHash,
      fen,
      evaluation,
      depth,
      best_move: bestMove,
      pv,
      multi_pv: multiPv,
      last_accessed: new Date().toISOString()
    }, {
      onConflict: 'fen_hash'
    });
  
  if (error) {
    console.error('Failed to cache position:', error);
  }
}

export async function getCacheStats(): Promise<{ total: number; hits: number }> {
  const { data, error } = await supabase
    .from('position_cache')
    .select('hit_count');
  
  if (error || !data) return { total: 0, hits: 0 };
  
  return {
    total: data.length,
    hits: data.reduce((sum, row) => sum + (row.hit_count || 0), 0)
  };
}

export { hashFEN };
