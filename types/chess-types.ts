import { pieceImages } from '@/constants/pieces';

export type Player = 'w' | 'b';

export type Piece = {
  row: number;
  col: number;
  type: keyof typeof pieceImages;
};

export type Pieces = Record<string, Piece>;

export type BoardState = string[][];

export type SelectedSquare = {
  key: string;
  row: number;
  col: number;
};

import { Animated } from 'react-native';

export type AnimatedPiece = {
  x: Animated.Value;
  y: Animated.Value;
};

export type AnimatedPieces = Record<string, AnimatedPiece>;

export type GameState = {
  pieces: Pieces;
  currentPlayer: Player;   // was hardcoded 'w' | 'b' before
};

export type GameResult = {
  type: 'checkmate' | 'stalemate';
  winner?: Player;
} | null;

export type Move = {
  row: number;
  col: number;
};

export type FullMove = {
  from: { row: number; col: number };
  to: { row: number; col: number };
};

export type Difficulty = 'easy' | 'medium' | 'hard';
