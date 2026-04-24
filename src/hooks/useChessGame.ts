import { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess, Move } from 'chess.js';

export function useChessGame() {
  const [game, setGame] = useState(() => {
    const savedPgn = typeof window !== 'undefined' ? localStorage.getItem('chessfish_pgn') : null;
    const newGame = new Chess();
    if (savedPgn) {
      try {
        newGame.loadPgn(savedPgn);
      } catch (e) {
        console.error("Failed to load saved PGN", e);
      }
    }
    return newGame;
  });
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | undefined>(() => {
    const savedLastMove = typeof window !== 'undefined' ? localStorage.getItem('chessfish_lastMove') : null;
    return savedLastMove ? JSON.parse(savedLastMove) : undefined;
  });

  // Save game to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chessfish_pgn', game.pgn());
    if (lastMove) {
      localStorage.setItem('chessfish_lastMove', JSON.stringify(lastMove));
    } else {
      localStorage.removeItem('chessfish_lastMove');
    }
  }, [game, lastMove]);

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

  const exportAnnotatedPgn = useCallback((evaluations: { [move: string]: number }, annotations: { [move: string]: string } = {}) => {
    const pgn = game.pgn();
    const moves = game.history({ verbose: true });
    
    let annotatedPgn = '';
    let moveIndex = 0;
    
    moves.forEach((move, i) => {
      const moveNumber = Math.floor(i / 2) + 1;
      const isWhiteMove = i % 2 === 0;
      
      if (isWhiteMove) {
        annotatedPgn += `${moveNumber}. `;
      }
      
      annotatedPgn += move.san;
      
      // Add evaluation comment
      if (evaluations[move.san] !== undefined) {
        const eval_ = evaluations[move.san];
        const evalStr = eval_ > 0 ? `+${eval_.toFixed(2)}` : eval_.toFixed(2);
        annotatedPgn += ` {eval: ${evalStr}}`;
      }
      
      // Add custom annotation
      if (annotations[move.san]) {
        annotatedPgn += ` {${annotations[move.san]}}`;
      }
      
      if (!isWhiteMove) {
        annotatedPgn += ' ';
      } else if (i < moves.length - 1) {
        annotatedPgn += ' ';
      }
    });
    
    // Add result
    if (game.isCheckmate()) {
      annotatedPgn += game.turn() === 'w' ? ' 0-1' : ' 1-0';
    } else if (game.isDraw()) {
      annotatedPgn += ' 1/2-1/2';
    }
    
    return annotatedPgn;
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
    exportPgn,
    exportAnnotatedPgn
  };
}
