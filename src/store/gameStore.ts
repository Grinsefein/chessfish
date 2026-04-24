import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess } from 'chess.js';

interface GameState {
  // Game data
  fen: string;
  pgn: string;
  history: string[];
  lastMove: { from: string; to: string } | null;
  
  // Game status
  isGameOver: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
  
  // Timers
  playerTime: number;
  botTime: number;
  
  // Actions
  setGameState: (state: Partial<GameState>) => void;
  resetGame: () => void;
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  undoMove: () => boolean;
  loadPgn: (pgn: string) => boolean;
  loadFen: (fen: string) => boolean;
  exportPgn: () => string;
  decrementTimer: (turn: 'w' | 'b') => void;
  resetTimers: () => void;
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
        
        isGameOver: false,
        isCheckmate: false,
        isDraw: false,
        turn: 'w',
        
        playerTime: INITIAL_TIME,
        botTime: INITIAL_TIME,
        
        // Set partial state
        setGameState: (state) => set((prev) => ({ ...prev, ...state })),
        
        // Reset game
        resetGame: () => set({
          fen: STARTING_FEN,
          pgn: '',
          history: [],
          lastMove: null,
          isGameOver: false,
          isCheckmate: false,
          isDraw: false,
          turn: 'w',
          playerTime: INITIAL_TIME,
          botTime: INITIAL_TIME,
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
            set({
              fen: chess.fen(),
              pgn: chess.pgn(),
              history: chess.history(),
              lastMove: { from: move.from, to: move.to },
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
      };
    },
    {
      name: 'chessfish-game-storage',
      partialize: (state) => ({
        fen: state.fen,
        pgn: state.pgn,
        history: state.history,
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
