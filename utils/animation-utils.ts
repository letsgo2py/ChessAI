import { Animated } from 'react-native';

export type AnimatedPiece = {
  x: Animated.Value;
  y: Animated.Value;
};

export const getAnimatedValue = (
  animatedPieces: Record<string, AnimatedPiece>,
  key: string,
  row: number,
  col: number,
  squareSize: number
): AnimatedPiece => {
  if (!animatedPieces[key]) {
    animatedPieces[key] = {
      x: new Animated.Value(col * squareSize),
      y: new Animated.Value(row * squareSize),
    };
  }
  return animatedPieces[key];
};