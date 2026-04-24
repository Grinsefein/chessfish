import { supabase } from '@/lib/supabase';
import { hashFEN } from './positionCache';
import { detectAllTactics, formatTacticsForPrompt, Tactic } from './tacticsDetector';

export interface CommentaryContext {
  fen: string;
  userMove: string;
  userMoveSan: string;
  evaluation: number;
  previousEval: number;
  bestMove: string;
  bestMoveSan: string;
  classification: string;
  centipawnLoss: number;
  tactics: Tactic[];
}

// Generate AI commentary using Gemini with templated prompts
export async function generateCommentary(context: CommentaryContext): Promise<string> {
  const positionHash = hashFEN(context.fen);
  
  // Check cache first
  const { data: cached } = await supabase
    .from('commentary_cache')
    .select('commentary_text')
    .eq('position_hash', positionHash)
    .eq('user_move', context.userMove)
    .maybeSingle();
  
  if (cached) {
    return cached.commentary_text;
  }
  
  // Build templated prompt
  const prompt = buildPrompt(context);
  
  try {
    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 150
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    const commentary = data.candidates?.[0]?.content?.parts?.[0]?.text || generateFallbackCommentary(context);
    
    // Cache the result
    await supabase
      .from('commentary_cache')
      .insert({
        position_hash: positionHash,
        user_move: context.userMove,
        commentary_text: commentary,
        tactics_detected: { tactics: context.tactics },
        ai_model: 'gemini-3-flash'
      });
    
    return commentary;
    
  } catch (error) {
    console.error('AI commentary generation failed:', error);
    return generateFallbackCommentary(context);
  }
}

// Build structured prompt that prevents hallucinations
function buildPrompt(ctx: CommentaryContext): string {
  const evalText = formatEvaluation(ctx.evaluation);
  const evalChange = ctx.evaluation - ctx.previousEval;
  const tacticsText = formatTacticsForPrompt(ctx.tactics);
  
  return `You are a chess coach analyzing a student's move. Provide 2-3 sentences of feedback.

POSITION EVALUATION: ${evalText}
STUDENT'S MOVE: ${ctx.userMoveSan} (${ctx.userMove})
BEST MOVE: ${ctx.bestMoveSan} (${ctx.bestMove})
CLASSIFICATION: ${ctx.classification}
CENTIPAWN LOSS: ${ctx.centipawnLoss}
TACTICS IN POSITION:
${tacticsText}

RULES:
- Mention specific squares and pieces (e.g., "knight on f3")
- Reference detected tactics if relevant
- Explain WHY the best move is strong
- If student made a mistake, explain what they missed
- Keep it encouraging but honest
- Maximum 3 sentences

Provide your analysis:`;
}

// Format evaluation for human reading
function formatEvaluation(eval_: number): string {
  if (eval_ > 5) return `White is winning (+${eval_.toFixed(1)})`;
  if (eval_ > 2) return `White has a strong advantage (+${eval_.toFixed(1)})`;
  if (eval_ > 0.5) return `White is slightly better (+${eval_.toFixed(1)})`;
  if (eval_ > -0.5) return `Position is roughly equal (${eval_.toFixed(1)})`;
  if (eval_ > -2) return `Black is slightly better (${eval_.toFixed(1)})`;
  if (eval_ > -5) return `Black has a strong advantage (${eval_.toFixed(1)})`;
  return `Black is winning (${eval_.toFixed(1)})`;
}

// Generate fallback commentary if AI fails
function generateFallbackCommentary(ctx: CommentaryContext): string {
  const pieces: Record<string, string> = {
    'N': 'Knight', 'B': 'Bishop', 'R': 'Rook', 'Q': 'Queen', 'K': 'King'
  };
  
  const from = ctx.userMove.slice(0, 2);
  const to = ctx.userMove.slice(2, 4);
  const piece = ctx.userMoveSan[0];
  const pieceName = pieces[piece] || (piece === piece.toLowerCase() ? 'Pawn' : piece);
  
  // Check for tactics
  const fork = ctx.tactics.find(t => t.type === 'fork');
  const pin = ctx.tactics.find(t => t.type === 'pin');
  const loose = ctx.tactics.find(t => t.type === 'loose_piece');
  
  let commentary = '';
  
  if (ctx.classification === 'blunder' || ctx.classification === 'mistake') {
    if (fork) {
      commentary = `You missed a fork! The knight on ${fork.attacker} attacks ${fork.targets?.join(' and ')}. `;
    } else if (pin) {
      commentary = `Be careful - your piece on ${pin.target} is pinned to your king. `;
    } else if (loose) {
      commentary = `Your ${pieceName.toLowerCase()} on ${from} was loose and undefended. `;
    } else {
      commentary = `This move loses material. Consider ${ctx.bestMoveSan} instead. `;
    }
    commentary += `The best move ${ctx.bestMoveSan} keeps the position balanced.`;
  } else if (ctx.classification === 'best' || ctx.classification === 'excellent') {
    commentary = `Excellent move! ${ctx.userMoveSan} is the strongest continuation in this position.`;
    if (fork || pin) {
      commentary += ` You exploited the tactical opportunities well.`;
    }
  } else {
    commentary = `${ctx.userMoveSan} is playable but ${ctx.bestMoveSan} was slightly more accurate.`;
  }
  
  return commentary;
}

// Batch generate commentary for all moves in a game
export async function generateGameCommentary(
  moves: Array<{
    fen: string;
    san: string;
    uci: string;
    evaluation: number;
    bestMove: string;
    classification: string;
    centipawnLoss: number;
  }>
): Promise<Array<{ moveIndex: number; commentary: string }>> {
  const results: Array<{ moveIndex: number; commentary: string }> = [];
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const previousEval = i > 0 ? moves[i - 1].evaluation : 0;
    
    const tactics = detectAllTactics(move.fen);
    
    const context: CommentaryContext = {
      fen: move.fen,
      userMove: move.uci,
      userMoveSan: move.san,
      evaluation: move.evaluation,
      previousEval,
      bestMove: move.bestMove,
      bestMoveSan: move.bestMove, // Simplified - you'd convert UCI to SAN
      classification: move.classification,
      centipawnLoss: move.centipawnLoss,
      tactics
    };
    
    const commentary = await generateCommentary(context);
    results.push({ moveIndex: i, commentary });
  }
  
  return results;
}
