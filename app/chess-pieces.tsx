import React from 'react'
import { StyleSheet, Animated, Image } from 'react-native';
import { pieceImages } from '@/constants/pieces';


type Piece = {
  row: number;
  col: number;
  type: keyof typeof pieceImages;
};

type AnimatedPiece = {
  x: Animated.Value;
  y: Animated.Value;
};

type Props = {
  pieces: Record<string, Piece>;
  animatedPieces: Record<string, AnimatedPiece>;
  getAnimatedValue: (
    animatedPieces: Record<string, AnimatedPiece>,
    key: string,
    row: number,
    col: number,
    squareSize: number
  ) => AnimatedPiece;
  squareSize: number;
};

export default function ChessSmoothPieces({
  pieces,
  animatedPieces,
  getAnimatedValue,
  squareSize,
 } : Props) {
    
  return (
    <>
      {Object.entries(pieces).map(([key, piece]) => {
        const anim = getAnimatedValue(
          animatedPieces,
          key,
          piece.row,
          piece.col,
          squareSize
        );
        return (
        <Animated.View
          key={key}
          pointerEvents="none"
          style={[
            styles.animatedPiece,
            { 
              width: squareSize,
              height: squareSize,
              transform: [ 
                { translateX: anim.x }, 
                { translateY: anim.y },
              ], 
            },
          ]}
        >
          <Image 
            source={pieceImages[piece.type]} 
            style={styles.piece} 
            resizeMode="contain" 
          />
        </Animated.View>
        );
      })}
    </>
  );
}

export const styles = StyleSheet.create({
  piece: {
    width: '90%',
    height: '90%',
  },
  animatedPiece: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
})


