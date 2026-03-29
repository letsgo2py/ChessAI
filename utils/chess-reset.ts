import { INITIAL_BOARD } from '@/constants/chessBoard';
import { buildPiecesFromBoard } from '@/utils/chessPieces';

import {
  BoardState,
  Pieces,
  Player,
  SelectedSquare,
  Move,
  GameResult,
  AnimatedPieces,
} from '@/types/chess-types';

export type ResetGameParams = {
  // Setters
  setBoard: (board: BoardState) => void;
  setPieces: (pieces: Pieces) => void;
  setCurrentPlayer: (player: Player) => void;
  setSelectedSquare: (square: SelectedSquare | null) => void;
  setPossibleMoves: (moves: Move[]) => void;
  setWhiteTime: (time: number) => void;
  setBlackTime: (time: number) => void;
  setGameResult: (result: GameResult) => void;

  // Values
  initialTime: number;
  animatedPieces: AnimatedPieces;
};

export const resetGame = ({
  setBoard,
  setPieces,
  setCurrentPlayer,
  setSelectedSquare,
  setPossibleMoves,
  setWhiteTime,
  setBlackTime,
  setGameResult,
  initialTime,
  animatedPieces,
}: ResetGameParams): void => {
  const freshBoard = INITIAL_BOARD.map(row => [...row]);

  setBoard(freshBoard);
  setPieces(buildPiecesFromBoard(freshBoard));
  setCurrentPlayer('w');
  setSelectedSquare(null);
  setPossibleMoves([]);

  if (initialTime > 0) {
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
  }

  Object.keys(animatedPieces).forEach(key => {
    delete animatedPieces[key];
  });

  setGameResult(null);
};