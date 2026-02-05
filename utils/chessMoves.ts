import { getPieceColor } from './chess-utils';

export type Move = { row: number; col: number };

export function getPossibleMoves(
  row: number,
  col: number,
  piece: string,
  boardState: string[][]
): Move[] {
  if (!piece) return [];

  const moves: Move[] = [];
  const pieceType = piece[1];
  const pieceColor = piece[0];

  switch (pieceType) {
    case 'p': { // Pawn
      const dir = pieceColor === 'w' ? -1 : 1;
      const startRow = pieceColor === 'w' ? 6 : 1;

      if (
        row + dir >= 0 &&
        row + dir < 8 &&
        !boardState[row + dir][col]
      ) {
        moves.push({ row: row + dir, col });

        if (
          row === startRow &&
          !boardState[row + dir * 2][col]
        ) {
          moves.push({ row: row + dir * 2, col });
        }
      }

      for (const dc of [-1, 1]) {
        const r = row + dir;
        const c = col + dc;
        if (
          r >= 0 && r < 8 &&
          c >= 0 && c < 8 &&
          boardState[r][c] &&
          getPieceColor(boardState[r][c]) !== pieceColor
        ) {
          moves.push({ row: r, col: c });
        }
      }
      break;
    }

    case 'r':
      addSlidingMoves(moves, row, col, pieceColor, boardState, [
        [0, 1], [0, -1], [1, 0], [-1, 0],
      ]);
      break;

    case 'b':
      addSlidingMoves(moves, row, col, pieceColor, boardState, [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ]);
      break;

    case 'q':
      addSlidingMoves(moves, row, col, pieceColor, boardState, [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ]);
      break;

    case 'n': {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightMoves) {
        const r = row + dr;
        const c = col + dc;
        if (
          r >= 0 && r < 8 &&
          c >= 0 && c < 8 &&
          (!boardState[r][c] ||
            getPieceColor(boardState[r][c]) !== pieceColor)
        ) {
          moves.push({ row: r, col: c });
        }
      }
      break;
    }

    case 'k': {
      const kingMoves = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      for (const [dr, dc] of kingMoves) {
        const r = row + dr;
        const c = col + dc;
        if (
          r >= 0 && r < 8 &&
          c >= 0 && c < 8 &&
          (!boardState[r][c] ||
            getPieceColor(boardState[r][c]) !== pieceColor)
        ) {
          moves.push({ row: r, col: c });
        }
      }
      break;
    }
  }

  return moves;
}


function addSlidingMoves(
  moves: { row: number; col: number }[],
  row: number,
  col: number,
  pieceColor: string,
  boardState: string[][],
  directions: number[][]
) {
  for (const [dr, dc] of directions) {
    for (let i = 1; i < 8; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break;

      const target = boardState[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (getPieceColor(target) !== pieceColor) {
          moves.push({ row: r, col: c });
        }
        break;
      }
    }
  }
}
