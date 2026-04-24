import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess } from 'chess.js';

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win'
  | 'book';

interface GameState {
  // Game data
  fen: string;
  pgn: string;
  history: string[];
  lastMove: { from: string; to: string } | null;
  
  // Analysis & Review
  classifications: Record<number, MoveClassification>;
  accuracy: number | null;
  counts: Record<string, number>;

  // Game status
  isGameOver: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
  
  // Timers
  playerTime: number;
  botTime: number;
  
  // Retry Mistake Mode
  retryMode: boolean;
  retryPosition: { fen: string; mistakeMove: string; bestMove: string } | null;
  retryResult: 'pending' | 'success' | 'failure' | null;
  
  // Actions
  setGameState: (state: Partial<GameState>) => void;
  resetGame: () => void;
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  undoMove: () => boolean;
  setClassification: (index: number, classification: MoveClassification) => void;
  setAccuracy: (accuracy: number) => void;
  loadPgn: (pgn: string) => boolean;
  loadFen: (fen: string) => boolean;
  exportPgn: () => string;
  decrementTimer: (turn: 'w' | 'b') => void;
  resetTimers: () => void;
  
  // Retry Mistake Actions
  enterRetryMode: (position: { fen: string; mistakeMove: string; bestMove: string }) => void;
  exitRetryMode: () => void;
  submitRetryMove: (move: string) => 'pending' | 'success' | 'failure';
}

const INITIAL_TIME = 300; // 5 minutes in seconds
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      // Create a chess instance for validation
      const getChess = () => {
        const chess = new Chess();
        const { fen, pgn } = get();
        
        // Try to load PGN first, then FEN
        if (pgn && pgn.trim()) {
          try {
            chess.loadPgn(pgn);
            return chess;
          } catch (e) {
            // Fall through to FEN
          }
        }
        
        if (fen && fen !== STARTING_FEN) {
          try {
            chess.load(fen);
            return chess;
          } catch (e) {
            // Return default chess
          }
        }
        
        return chess;
      };

      return {
        // Initial state
        fen: STARTING_FEN,
        pgn: '',
        history: [],
        lastMove: null,
        
        classifications: {},
        accuracy: null,
        counts: {
          brilliant: 0,
          great: 0,
          best: 0,
          excellent: 0,
          good: 0,
          inaccuracy: 0,
          mistake: 0,
          blunder: 0,
          missed_win: 0,
          book: 0,
        },
        isGameOver: false,
        isCheckmate: false,
        isDraw: false,
        turn: 'w',
        
        playerTime: INITIAL_TIME,
        botTime: INITIAL_TIME,
        
        retryMode: false,
        retryPosition: null,
        retryResult: null,
        
        // Set partial state
        setGameState: (state) => set((prev) => ({ ...prev, ...state })),
        
        // Reset game
        resetGame: () => set({
          fen: STARTING_FEN,
          pgn: '',
          history: [],
          lastMove: null,
          classifications: {},
          accuracy: null,
          counts: {
            brilliant: 0,
            great: 0,
            best: 0,
            excellent: 0,
            good: 0,
            inaccuracy: 0,
            mistake: 0,
            blunder: 0,
            missed_win: 0,
            book: 0,
          },
          isGameOver: false,
          isCheckmate: false,
          isDraw: false,
          turn: 'w',
          playerTime: INITIAL_TIME,
          botTime: INITIAL_TIME,
          retryMode: false,
          retryPosition: null,
          retryResult: null,
        }),
        
        // Make a move with chess.js validation
        makeMove: (move) => {
          const chess = getChess();
          
          try {
            const result = chess.move({
              from: move.from as any,
              to: move.to as any,
              promotion: move.promotion || 'q',
            });
            
            if (result === null) {
              return false; // Illegal move
            }
            
            // Update state with new position
            set((state) => ({
              fen: chess.fen(),
              pgn: chess.pgn(),
              history: chess.history(),
              lastMove: { from: move.from, to: move.to },
              isGameOver: chess.isGameOver(),
              isCheckmate: chess.isCheckmate(),
              isDraw: chess.isDraw(),
              turn: chess.turn(),
            }));
            
            return true;
          } catch (e) {
            return false;
          }
        },

        setClassification: (index, classification) => set((state) => {
          const current = state.classifications[index];
          const newCounts = { ...state.counts };

          if (current) {
            newCounts[current] = Math.max(0, newCounts[current] - 1);
          }
          newCounts[classification] = (newCounts[classification] || 0) + 1;

          return {
            classifications: { ...state.classifications, [index]: classification },
            counts: newCounts
          };
        }),

        setAccuracy: (accuracy) => set({ accuracy }),
        
        // Undo last move
        undoMove: () => {
          const chess = getChess();
          
          try {
            const result = chess.undo();
            if (result === null) {
              return false;
            }
            
            set({
              fen: chess.fen(),
              pgn: chess.pgn(),
              history: chess.history(),
              lastMove: null, // Clear last move on undo
              isGameOver: chess.isGameOver(),
              isCheckmate: chess.isCheckmate(),
              isDraw: chess.isDraw(),
              turn: chess.turn(),
            });
            
            return true;
          } catch (e) {
            return false;
          }
        },
        
        // Load PGN
        loadPgn: (pgn) => {
          const chess = new Chess();
          
          try {
            chess.loadPgn(pgn);
            
            set({
              fen: chess.fen(),
              pgn: chess.pgn(),
              history: chess.history(),
              lastMove: null,
              isGameOver: chess.isGameOver(),
              isCheckmate: chess.isCheckmate(),
              isDraw: chess.isDraw(),
              turn: chess.turn(),
            });
            
            return true;
          } catch (e) {
            return false;
          }
        },
        
        // Load FEN
        loadFen: (fen) => {
          const chess = new Chess();
          
          try {
            chess.load(fen);
            
            set({
              fen: chess.fen(),
              pgn: chess.pgn(),
              history: chess.history(),
              lastMove: null,
              isGameOver: chess.isGameOver(),
              isCheckmate: chess.isCheckmate(),
              isDraw: chess.isDraw(),
              turn: chess.turn(),
            });
            
            return true;
          } catch (e) {
            return false;
          }
        },

        // Export PGN
        exportPgn: () => {
          const { pgn } = get();
          return pgn || '';
        },

        // Decrement timer
        decrementTimer: (turn) => {
          set((state) => ({
            playerTime: turn === 'w' 
              ? Math.max(0, state.playerTime - 1) 
              : state.playerTime,
            botTime: turn === 'b' 
              ? Math.max(0, state.botTime - 1) 
              : state.botTime,
          }));
        },
        
        // Reset timers
        resetTimers: () => set({
          playerTime: INITIAL_TIME,
          botTime: INITIAL_TIME,
        }),
        
        // Enter retry mode for a specific mistake position
        enterRetryMode: (position) => set({
          retryMode: true,
          retryPosition: position,
          retryResult: 'pending',
          fen: position.fen,
        }),
        
        // Exit retry mode and return to normal game
        exitRetryMode: () => set((state) => ({
          retryMode: false,
          retryPosition: null,
          retryResult: null,
          fen: state.pgn 
            ? (() => {
                const chess = new Chess();
                try {
                  chess.loadPgn(state.pgn);
                  return chess.fen();
                } catch {
                  return STARTING_FEN;
                }
              })()
            : STARTING_FEN,
        })),
        
        // Submit a retry move and check if it matches the engine best move
        submitRetryMove: (move) => {
          const state = get();
          if (!state.retryPosition || !state.retryMode) return 'pending';
          
          // Normalize move format for comparison
          const normalizeMove = (m: string) => m.replace(/[+#!=]/g, '').trim();
          const normalizedAttempt = normalizeMove(move);
          const normalizedBest = normalizeMove(state.retryPosition.bestMove);
          
          const isCorrect = normalizedAttempt === normalizedBest;
          const result = isCorrect ? 'success' : 'failure';
          
          set({ retryResult: result });
          return result;
        },
      };
    },
    {
      name: 'chessfish-game-storage',
      partialize: (state) => ({
        fen: state.fen,
        pgn: state.pgn,
        history: state.history,
        classifications: state.classifications,
        accuracy: state.accuracy,
        counts: state.counts,
        isGameOver: state.isGameOver,
        isCheckmate: state.isCheckmate,
        isDraw: state.isDraw,
        turn: state.turn,
        playerTime: state.playerTime,
        botTime: state.botTime,
      }),
    }
  )
);
