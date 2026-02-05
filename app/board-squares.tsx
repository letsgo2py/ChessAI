
import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';


import { getPieceColor } from '../utils/chess-utils'

type Square = {
  row: number;
  col: number;
};


type BoardSquaresProps = {
  selectedSquare: Square | null;
  currentPlayer: 'w' | 'b';
  isAIThinking: boolean;
  handleSquarePress: (row: number, col: number) => void;
  possibleMoves: Square[];
  board: string[][];
};

const boardSize = 8;
const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = screenWidth * 0.97; // 97% of screen width
const SQUARE_SIZE = Math.floor(BOARD_SIZE / 8);   // Each square size

function BoardSquares({
  selectedSquare,
  currentPlayer,
  isAIThinking,
  handleSquarePress,
  possibleMoves,
  board,
} : BoardSquaresProps) {

  const getSquareHighlightStyle = (row: number, col: number) => {
    if (
      selectedSquare &&
      selectedSquare.row === row &&
      selectedSquare.col === col
    ) {
      return styles.selectedSquare;
    }

    const isPossibleMove = possibleMoves.some(
      move => move.row === row && move.col === col
    );

    if (!isPossibleMove) return null;

    const pieceOnSquare = board[row][col];

    if (pieceOnSquare && getPieceColor(pieceOnSquare) !== currentPlayer) {
      return styles.checkSquare; 
    }

    return styles.possibleMoveSquare;
  };

  const squares = [];
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const isLight = (row + col) % 2 === 0;
      squares.push({
          row,
          col,
          isLight,
          key: `${row}-${col}`,
      });
    }
  }

  return (
    <>
      {squares.map(square => (
        <TouchableOpacity
          key={square.key}
          style={[
            styles.square,
            square.isLight ? styles.lightSquare : styles.darkSquare,
            getSquareHighlightStyle(square.row, square.col),
            {
              position: 'absolute',
              top: square.row * SQUARE_SIZE,
              left: square.col * SQUARE_SIZE,
            },
          ]}
          onPress={() => handleSquarePress(square.row, square.col)}
          // disabled={currentPlayer !== 'w' || isAIThinking}
        />
      ))}
    </>
  )
}

export default BoardSquares

const styles = StyleSheet.create({
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,  
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightSquare: {
    backgroundColor: '#ffffff',
  },
  darkSquare: {
    backgroundColor: '#007AFF',
  },
  selectedSquare: {
    backgroundColor: '#FFD700',
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  checkSquare: {
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FF0000',
  },
  possibleMoveSquare: {
    backgroundColor: '#90EE90',
    borderWidth: 3,
    borderColor: '#05d844',
  },
});