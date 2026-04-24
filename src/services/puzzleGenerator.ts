import { supabase } from '@/lib/supabase';
import { MoveAnalysis } from './batchAnalysis';

export interface Puzzle {
  id?: string;
  gameId: string;
  userId?: string;
  moveNumber: number;
  fen: string;
  solutionMove: string;
  classification: 'mistake' | 'blunder' | 'missed_win';
  centipawnLoss: number;
  wrongMoves?: string[];
}

// Generate puzzles from analyzed game
export async function generatePuzzlesFromGame(
  gameId: string,
  moves: MoveAnalysis[],
  userId?: string
): Promise<Puzzle[]> {
  const puzzles: Puzzle[] = [];
  
  for (const move of moves) {
    // Only create puzzles for mistakes, blunders, and missed wins
    if (['mistake', 'blunder', 'missed_win'].includes(move.classification)) {
      // Skip if already exists
      const { data: existing } = await supabase
        .from('puzzles')
        .select('id')
        .eq('game_id', gameId)
        .eq('move_number', move.moveNumber)
        .eq('color', move.color)
        .maybeSingle();
      
      if (!existing) {
        puzzles.push({
          gameId,
          userId,
          moveNumber: move.moveNumber,
          fen: move.fenBefore,
          solutionMove: move.bestMove,
          classification: move.classification as 'mistake' | 'blunder' | 'missed_win',
          centipawnLoss: move.centipawnLoss,
          wrongMoves: generateWrongMoves(move)
        });
      }
    }
  }
  
  // Save puzzles to database
  if (puzzles.length > 0) {
    const { error } = await supabase
      .from('puzzles')
      .insert(puzzles.map(p => ({
        game_id: p.gameId,
        user_id: p.userId,
        move_number: p.moveNumber,
        fen: p.fen,
        solution_move: p.solutionMove,
        classification: p.classification,
        centipawn_loss: p.centipawnLoss,
        wrong_moves: p.wrongMoves
      })));
    
    if (error) {
      console.error('Failed to save puzzles:', error);
    }
  }
  
  return puzzles;
}

// Generate plausible wrong moves for multiple choice
function generateWrongMoves(move: MoveAnalysis): string[] {
  const wrongMoves: string[] = [];
  
  // Add the move that was actually played (if different from best)
  if (move.uci !== move.bestMove) {
    wrongMoves.push(move.uci);
  }
  
  // Add some generic wrong moves based on piece type
  // This is simplified - in production, you'd want to generate actual legal but bad moves
  const commonBlunders = [
    move.san.includes('x') ? move.san.replace('x', '-') : move.san + '+',
    move.bestMove.slice(0, 2) + move.san.slice(-2)
  ];
  
  return [...wrongMoves, ...commonBlunders].slice(0, 3);
}

// Get puzzles due for review
export async function getDuePuzzles(userId: string, limit: number = 10): Promise<Puzzle[]> {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('user_id', userId)
    .lte('next_due', new Date().toISOString())
    .order('times_practiced', { ascending: true })
    .limit(limit);
  
  if (error || !data) return [];
  
  return data.map(row => ({
    id: row.id,
    gameId: row.game_id,
    userId: row.user_id,
    moveNumber: row.move_number,
    fen: row.fen,
    solutionMove: row.solution_move,
    classification: row.classification,
    centipawnLoss: row.centipawn_loss,
    wrongMoves: row.wrong_moves
  }));
}

// Record puzzle practice result
export async function recordPuzzleResult(
  puzzleId: string,
  solved: boolean
): Promise<void> {
  const { data: puzzle } = await supabase
    .from('puzzles')
    .select('times_practiced, times_solved')
    .eq('id', puzzleId)
    .single();
  
  if (!puzzle) return;
  
  const timesPracticed = (puzzle.times_practiced || 0) + 1;
  const timesSolved = (puzzle.times_solved || 0) + (solved ? 1 : 0);
  
  // Spaced repetition: 1 day, 3 days, 7 days, 14 days
  const intervals = [1, 3, 7, 14];
  const interval = intervals[Math.min(timesPracticed - 1, intervals.length - 1)];
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + interval);
  
  await supabase
    .from('puzzles')
    .update({
      times_practiced: timesPracticed,
      times_solved: timesSolved,
      last_practiced: new Date().toISOString(),
      next_due: nextDue.toISOString(),
      success_rate: Math.round((timesSolved / timesPracticed) * 100)
    })
    .eq('id', puzzleId);
}

// Get puzzle stats for user
export async function getPuzzleStats(userId: string): Promise<{
  total: number;
  solved: number;
  successRate: number;
  byClassification: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('puzzles')
    .select('classification, times_solved, times_practiced')
    .eq('user_id', userId);
  
  if (error || !data) {
    return { total: 0, solved: 0, successRate: 0, byClassification: {} };
  }
  
  const byClassification: Record<string, number> = {};
  let totalSolved = 0;
  let totalPracticed = 0;
  
  for (const row of data) {
    byClassification[row.classification] = (byClassification[row.classification] || 0) + 1;
    totalSolved += row.times_solved || 0;
    totalPracticed += row.times_practiced || 0;
  }
  
  return {
    total: data.length,
    solved: totalSolved,
    successRate: totalPracticed > 0 ? Math.round((totalSolved / totalPracticed) * 100) : 0,
    byClassification
  };
}
