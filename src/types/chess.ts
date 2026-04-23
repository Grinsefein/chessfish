export type GameMode = 'play' | 'analysis';

export interface GameState {
  fen: string;
  gameStatus: string;
  turn: 'w' | 'b';
  history: string[];
  isCheck: boolean;
  score: number; // centipawns or mate info
  bestMove?: string;
  lastMove?: { from: string; to: string };
}

export interface BotProfile {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  description: string;
  skillLevel: number; // stockfish skill level
  thinkTime: number; // artificial delay in ms
}
