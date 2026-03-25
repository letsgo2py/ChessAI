/* Board for offline chess game */

import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { pieceImages } from '../constants/pieces';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useTheme } from '@/contexts/ThemeContext';

import TopHeader from './top-header';
import { getPieceColor } from '@/utils/chess-utils';
import { getAnimatedValue } from '@/utils/animation-utils';
import { getPossibleMoves } from '@/utils/chessMoves';
import { buildPiecesFromBoard } from '@/utils/chessPieces';

import { INITIAL_BOARD } from '@/constants/chessBoard';
import { green } from 'react-native-reanimated/lib/typescript/Colors';

const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = screenWidth * 0.97; // 97% of screen width
const SQUARE_SIZE = Math.floor(BOARD_SIZE / 8);   // Each square size

type AnimatedPiece = {
  x: Animated.Value;
  y: Animated.Value;
};

type Piece = {
  row: number;
  col: number;
  type: keyof typeof pieceImages;
};

type Pieces = Record<string, Piece>;

export default function ChessBoardScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const animatedPieces = useRef<Record<string, AnimatedPiece>>({}).current;
  const player1Name = (params.player1 as string) || 'Player 1';
  const player2Name = (params.player2 as string) || 'Player 2';
  const initialTime = Array.isArray(params.timer)
                        ? Number(params.timer[0])
                        : Number(params.timer) || 0;
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);

  const boardSize = 8;

  const [board, setBoard] = useState<string[][]>(INITIAL_BOARD.map(row => [...row]));
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Array<{row: number, col: number}>>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');

  const [pieces, setPieces] = useState<Pieces>(
    buildPiecesFromBoard(INITIAL_BOARD.map(row => [...row]))
  );

  useEffect(() => {
    if (initialTime === 0) return; // No timer mode

    const interval = setInterval(() => {
      if (currentPlayer === 'w') {
        setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayer]);

  const movePiece = (key: string, row: number, col: number) => {
    const anim = getAnimatedValue(
      animatedPieces, 
      key, 
      row, 
      col, 
      SQUARE_SIZE
    );

    Animated.parallel([
      Animated.timing(anim.x, {
        toValue: col * SQUARE_SIZE,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(anim.y, {
        toValue: row * SQUARE_SIZE,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

  };
  
  // Check if a king at given position is in check
  const isKingInCheck = (kingRow: number, kingCol: number, kingColor: 'w' | 'b'): boolean => {
    const opponentColor = kingColor === 'w' ? 'b' : 'w';
    
    // Check all opponent pieces and see if any can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        const pieceColor = getPieceColor(piece);
        
        if (pieceColor === opponentColor) {
          const moves = getPossibleMoves(row, col, piece, board);
          // Check if any move can capture the king
          if (moves.some(move => move.row === kingRow && move.col === kingCol)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  // Find the king's position for a given color
  const findKingPosition = (color: 'w' | 'b'): {row: number, col: number} | null => {
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

  const kingPosition = findKingPosition(currentPlayer);
  const isInCheck = kingPosition ? isKingInCheck(kingPosition.row, kingPosition.col, currentPlayer) : false;

  const handleSquarePress = (row: number, col: number) => {
    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);

    if (selectedSquare) {
      const isPossibleMove = possibleMoves.some(
        move => move.row === row && move.col === col
      );

      if (isPossibleMove) {
        const newBoard = board.map(r => [...r]);
        const selectedPiece =
          newBoard[selectedSquare.row][selectedSquare.col];

        const pieceEntry = Object.entries(pieces).find(
          ([, p]) =>
            p.row === selectedSquare.row &&
            p.col === selectedSquare.col
        );

        if (!pieceEntry) return;

        const [pieceKey] = pieceEntry;

        const updatedPieces = { ...pieces };
        const capturedEntry = Object.entries(updatedPieces).find(
          ([k, p]) => p.row === row && p.col === col && k !== pieceKey
        );

        if (capturedEntry) {
          delete updatedPieces[capturedEntry[0]];
        }

        updatedPieces[pieceKey] = {
          ...updatedPieces[pieceKey],
          row,
          col,
        };

        movePiece(pieceKey, row, col);
        setPieces(updatedPieces);

        newBoard[row][col] = selectedPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = '';
        setBoard(newBoard);

        setSelectedSquare(null);
        setPossibleMoves([]);
        setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w');
        return;
      }

      if (pieceColor === currentPlayer) {
        setSelectedSquare({ row, col });
        setPossibleMoves(getPossibleMoves(row, col, piece, board));
        return;
      }

      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    if (pieceColor === currentPlayer) {
      setSelectedSquare({ row, col });
      setPossibleMoves(getPossibleMoves(row, col, piece, board));
    }
  };

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

    if (pieceOnSquare && getPieceColor(pieceOnSquare) === 'b') {
      return styles.checkSquare; 
    }

    return styles.possibleMoveSquare;
  };

  // Create chess board squares
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <TopHeader headerText="Offline Chess" />

        <View style={styles.boardContainer}>
          <View style={styles.blackPlayerInfoDiv}>
            {/* Player 2 Name (Black) - Top Left */}
            <View style={styles.playerNameTopLeft}>
              <Text style={styles.playerNameText}>{player2Name}</Text>
              {currentPlayer === 'b' && isInCheck && (
                <Text style={styles.checkText}> - CHECK!</Text>
              )}
            </View>

            {/* Black Player Timer*/}
            {initialTime > 0 && (
              <View style={styles.timerDiv}>
                <AntDesign name="clock-circle" size={14} color="white" />
                <Text style={styles.timerText}>{formatTime(blackTime)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.board}>
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
                // disabled={currentPlayer !== 'w'}
              />
            ))}

            {/* Animated Pieces */}
            {Object.entries(pieces).map(([key, piece]) => {
              const anim = getAnimatedValue(
                                animatedPieces,
                                key, 
                                piece.row, 
                                piece.col,
                                SQUARE_SIZE
                              );

              return (
                <Animated.View
                  key={key}
                  pointerEvents="none"
                  style={[
                    styles.animatedPiece,
                    { 
                      transform: [ 
                        { translateX: anim.x }, { translateY: anim.y },
                      ], 
                    },
                  ]}
                >
                  <Image source={pieceImages[piece.type]} style={styles.piece} resizeMode="contain" />
                </Animated.View>
              );
            })}
          </View>
          
          <View style={styles.whitePlayerInfoDiv}>
            {/* Player 1 Name (White) - Bottom Right */}
            <View style={styles.playerNameBottomRight}>
              <Text style={styles.playerNameTextWhite}>{player1Name}</Text>
              {currentPlayer === 'w' && isInCheck && (
                <Text style={styles.checkText}> - CHECK!</Text>
              )}
            </View>
            {/* White Player Timer */}
            {initialTime > 0 && (
              <View style={styles.timerDiv}>
                <AntDesign name="clock-circle" size={14} color="white" />
                <Text style={styles.timerText}>{formatTime(whiteTime)}</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  boardContainer: {
    alignItems: 'center',
    padding: 10,
    marginTop: 'auto',
    marginBottom: 60,
  },
  blackPlayerInfoDiv: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },
  whitePlayerInfoDiv: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  playerNameTopLeft: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playerNameBottomRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playerNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerNameTextWhite: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  timerDiv: {
    padding: 8,
    backgroundColor: 'black',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    position: 'relative', 
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#000',
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,  
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedPiece: {
    position: 'absolute',
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
  possibleMoveSquare: {
    backgroundColor: '#90EE90',
    borderWidth: 3,
    borderColor: '#05d844',
  },
  checkSquare: {
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FF0000',
  },
  checkText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  piece: {
    width: '90%',
    height: '90%',
  },
  moveIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    opacity: 0.3,
  },
});

