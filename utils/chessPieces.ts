import { pieceImages } from '@/constants/pieces';

export type Piece = {
  row: number;
  col: number;
  type: keyof typeof pieceImages;
};

export const buildPiecesFromBoard = (board: string[][]): Record<string, Piece> => {
  const result: Record<string, Piece> = {};
  let id = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (cell) {
        result[`${cell}_${id++}`] = {
          row,
          col,
          type: cell as keyof typeof pieceImages,
        };
      }
    }
  }

  return result;
};
