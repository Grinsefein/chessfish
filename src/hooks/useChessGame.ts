import { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess, Move } from 'chess.js';

export function useChessGame() {
  const [game, setGame] = useState(new Chess());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | undefined>();

  // Use a counter or timestamp to force re-renders if needed, 
  // but since we replace the game instance, game.fen() should be enough.
  const fen = useMemo(() => game.fen(), [game]);

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        setLastMove({ from: result.from, to: result.to });
        return result;
      }
    } catch (e) {
      console.error("Invalid move attempted", e);
      return null;
    }
    return null;
  }, [game]);

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setLastMove(undefined);
  }, []);

  const undoMove = useCallback((force = false) => {
    const gameCopy = new Chess(game.fen());
    gameCopy.undo();
    if (force) gameCopy.undo(); // undo twice for bot game
    setGame(gameCopy);
    setLastMove(undefined);
  }, [game]);

  const history = useMemo(() => game.history(), [game]);

  const loadPgn = useCallback((pgn: string) => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      setGame(newGame);
      setLastMove(undefined);
      return true;
    } catch (e) {
      console.error("Failed to load PGN", e);
      return false;
    }
  }, []);

  const exportPgn = useCallback(() => {
    return game.pgn();
  }, [game]);

  return {
    game,
    fen,
    turn: game.turn(),
    isGameOver: game.isGameOver(),
    isCheck: game.inCheck(),
    isCheckmate: game.isCheckmate(),
    isDraw: game.isDraw(),
    isStalemate: game.isStalemate(),
    isInsufficientMaterial: game.isInsufficientMaterial(),
    isThreefoldRepetition: game.isThreefoldRepetition(),
    history,
    makeMove,
    resetGame,
    undoMove,
    lastMove,
    loadPgn,
    exportPgn
  };
}
