import { getPossibleMoves } from '@/utils/chessMoves'

export const getPieceColor = (piece: string): 'w' | 'b' | null => {
  if (!piece) return null;
  return piece[0] === 'w' ? 'w' : 'b';
};

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}; 

// Find the king's position for a given color
export const findKingPosition = (
    color: 'w' | 'b',
    board: string[][]
  ) => {
  const kingPiece = color === 'w' ? 'wk' : 'bk';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === kingPiece) {
        return { row, col };
      }
    }
  }

  return null;

};

export const isKingInCheck = (
    board: string[][],
    kingRow: number,
    kingCol: number,
    kingColor: 'w' | 'b'
  ): boolean => {
  const opponentColor = kingColor === 'w' ? 'b' : 'w';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      const pieceColor = getPieceColor(piece);

      if (pieceColor === opponentColor) {
        const moves = getPossibleMoves(row, col, piece, board);

        if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
          return true;
        }
      }
    }
  }

  return false;
};

export const simulateMove = (
  board: string[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
) => {
  const newBoard = board.map(r => [...r]);

  newBoard[to.row][to.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = "";

  return newBoard;
};

type Square = { row: number; col: number };

export const getSafeMoves = ({
  selectedSquare,
  possibleMoves,
  board,
  currentPlayer,
}: {
  selectedSquare: Square | null;
  possibleMoves: Square[];
  board: string[][];
  currentPlayer: 'w' | 'b';
}): Square[] => {
  if (!selectedSquare) return [];

  return possibleMoves.filter(move => {
    const newBoard = simulateMove(board, selectedSquare, move);

    const kingPos = findKingPosition(currentPlayer, newBoard);
    if (!kingPos) return false;

    const stillInCheck = isKingInCheck(
      newBoard,
      kingPos.row,
      kingPos.col,
      currentPlayer
    );

    return !stillInCheck;
  });
};

export const getAllSafeMoves = ({
  board,
  currentPlayer,
}: {
  board: string[][];
  currentPlayer: 'w' | 'b';
}): { from: Square; to: Square }[] => {
  let allMoves: { from: Square; to: Square }[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (!piece || getPieceColor(piece) !== currentPlayer) continue;

      const moves = getPossibleMoves(row, col, piece, board);

      const safeMoves = moves.filter(move => {
        const newBoard = simulateMove(board, { row, col }, move);

        const kingPos = findKingPosition(currentPlayer, newBoard);
        if (!kingPos) return false;

        return !isKingInCheck(
          newBoard,
          kingPos.row,
          kingPos.col,
          currentPlayer
        );
      });

      safeMoves.forEach(move => {
        allMoves.push({
          from: { row, col },
          to: move,
        });
      });
    }
  }

  return allMoves;
};