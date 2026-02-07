import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef} from 'react';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { pieceImages } from '../constants/pieces';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Haptics from 'expo-haptics';


import TopHeader from './top-header'
import BoardSquares from './board-squares'
import ChessSmoothPieces from './chess-pieces'
import { getPieceColor } from '@/utils/chess-utils'
import { getAnimatedValue } from '@/utils/animation-utils'
import { getPossibleMoves } from '@/utils/chessMoves';
import { buildPiecesFromBoard } from '@/utils/chessPieces';

import { INITIAL_BOARD } from '@/constants/chessBoard';


type AnimatedPiece = {
  x: Animated.Value;
  y: Animated.Value;
};

type SelectedSquare = {
  key: string;
  row: number;
  col: number;
};

// const SQUARE_SIZE: number = 50;
const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = screenWidth * 0.97; // 97% of screen width
const SQUARE_SIZE = Math.floor(BOARD_SIZE / 8);   // Each square size

type Piece = {
  row: number;
  col: number;
  type: keyof typeof pieceImages;
};

type Pieces = Record<string, Piece>;

type GameState = {
  pieces: Pieces;
  currentPlayer: 'w' | 'b';
};

export default function ChessBoardAIScreen() {
  const params = useLocalSearchParams();
  const animatedPieces = useRef<Record<string, AnimatedPiece>>({}).current;
  const playerName = (params.playerName as string) || 'Player';
  const difficulty = (params.difficulty as 'easy' | 'medium' | 'hard') || 'medium';

  const [board, setBoard] = useState<string[][]>(INITIAL_BOARD.map(row => [...row]));   // cloning the initial board
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Array<{row: number, col: number}>>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [isAIThinking, setIsAIThinking] = useState(false);

  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [redoStack, setRedoStack] = useState<GameState[]>([]);

  const [whiteTime, setWhiteTime] = useState(5 * 60); // 5 min
  const [blackTime, setBlackTime] = useState(5 * 60);

  const [pieces, setPieces] = useState<Pieces>(
    buildPiecesFromBoard(INITIAL_BOARD.map(row => [...row]))
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (currentPlayer === 'w') {
      interval = setInterval(() => {
        setWhiteTime(t => Math.max(t - 1, 0));
      }, 1000);
    }

    if (currentPlayer === 'b') {
      interval = setInterval(() => {
        setBlackTime(t => Math.max(t - 1, 0));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };  
  }, [currentPlayer, isAIThinking])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Move the piece on board with smooth animation 
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

    // Get all possible moves for a player
    const getAllMoves = (playerColor: 'w' | 'b', boardState: string[][]): Array<{from: {row: number, col: number}, to: {row: number, col: number}}> => {
      const allMoves: Array<{from: {row: number, col: number}, to: {row: number, col: number}}> = [];
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = boardState[row][col];
          if (getPieceColor(piece) === playerColor) {
            const moves = getPossibleMoves(row, col, piece, boardState);
            for (const move of moves) {
              allMoves.push({ from: { row, col }, to: move });
            }
          }
        }
      }
      
      return allMoves;
    };

    const getLegalMovesForPiece = (
      fromRow: number,
      fromCol: number,
      color: 'w' | 'b',
      boardState: string[][]
    ): Array<{ row: number; col: number }> => {
      const allLegalMoves = getLegalMoves(color, boardState);

      return allLegalMoves
        .filter(
          m =>
            m.from.row === fromRow &&
            m.from.col === fromCol
        )
        .map(m => m.to);
    };


    const getLegalMoves = (
      color: 'w' | 'b',
      boardState: string[][]
    ) => {
      const moves = getAllMoves(color, boardState);

      return moves.filter(move => {
        const newBoard = applyMove(boardState, move);
        const kingPos = findKingPosition(color, newBoard);
        if (!kingPos) return false;

        return !isKingInCheck(
          kingPos.row,
          kingPos.col,
          color,
          newBoard
        );
      });
    };

    // isCheckmate(currentBoard, opponent)
    const isCheckmate = (
      boardState: string[][],
      color: 'w' | 'b'
    ): boolean => {
      const kingPos = findKingPosition(color, boardState);
      if (!kingPos) return true; // king captured = lost

      if (!isKingInCheck(kingPos.row, kingPos.col, color, boardState)) {
        return false;
      }

      const legalMoves = getLegalMoves(color, boardState);
      return legalMoves.length === 0;
    };


    const evaluateBoard = (board: string[][]): number => {
      const values: Record<string, number> = {
        bp: 1, bn: 3, bb: 3, br: 5, bq: 9, bk: 100,
        wp: -1, wn: -3, wb: -3, wr: -5, wq: -9, wk: -100,
      };

      let score = 0;

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece) score += values[piece] || 0;
        }
      }

      return score;
    };

    const applyMove = (
      board: string[][],
      move: { from: { row: number; col: number }; to: { row: number; col: number } }
    ): string[][] => {
      const newBoard = board.map(r => [...r]);

      newBoard[move.to.row][move.to.col] =
        newBoard[move.from.row][move.from.col];

      newBoard[move.from.row][move.from.col] = '';

      return newBoard;
    };

    const minimax = (
      board: string[][],
      depth: number,
      isMaximizing: boolean
    ): number => {

      if (isCheckmate(board, 'w')) return Infinity;
      if (isCheckmate(board, 'b')) return -Infinity;

      if (depth === 0) {
        return evaluateBoard(board);
      }

      const color: 'w' | 'b' = isMaximizing ? 'b' : 'w';
      const moves = getLegalMoves(color, board);

      if (moves.length === 0) {
        return evaluateBoard(board);
      }

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          const newBoard = applyMove(board, move);
          const evalScore = minimax(newBoard, depth - 1, false);
          maxEval = Math.max(maxEval, evalScore);
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          const newBoard = applyMove(board, move);
          const evalScore = minimax(newBoard, depth - 1, true);
          minEval = Math.min(minEval, evalScore);
        }
        return minEval;
      }
    };

    const chooseBestMoveMinimax = (
      board: string[][],
      depth: number
    ) => {
      const moves = getLegalMoves('b', board);

      let bestScore = -Infinity;
      let bestMoves: typeof moves = [];

      for (const move of moves) {
        const newBoard = applyMove(board, move);
        const score = minimax(newBoard, depth - 1, false);

        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }

      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    };


    const makeAIMove = (currentBoard: string[][]) => {
      if (redoStack.length > 0) return;
      setIsAIThinking(true);

      const aiTimeToThink = 2000;   // AI thinks for 2 seconds

      setTimeout(() => {
        setPieces(prevPieces => {
          const boardToUse = currentBoard || board;
          const piecesSnapshot = JSON.parse(JSON.stringify(prevPieces));

          setUndoStack(prev => [
            ...prev,
            {
              pieces: piecesSnapshot,
              currentPlayer: 'b',
            },
          ]);

          const allMoves = getAllMoves('b', boardToUse);
          if (allMoves.length === 0) {
            setIsAIThinking(false);
            return prevPieces;
          }
          
          let depth = 1;

          if (difficulty === 'medium') depth = 2;
          if (difficulty === 'hard') depth = 3;

          const chosenMove = chooseBestMoveMinimax(boardToUse, depth);

          const pieceEntry = Object.entries(prevPieces).find(
            ([key, p]) => p.row === chosenMove.from.row && p.col === chosenMove.from.col
          );

          if (!pieceEntry){
            setIsAIThinking(false);
            return prevPieces
          }

          const [pieceKey, pieceData] = pieceEntry;

          // Animate the AI piece
          movePiece(pieceKey, chosenMove.to.row, chosenMove.to.col);

          // Update pieces state (remove captured piece if any)
          const updatedPieces = { ...prevPieces };
          const capturedEntry = Object.entries(updatedPieces).find(
            ([k, p]) => p.row === chosenMove.to.row && p.col === chosenMove.to.col && k !== pieceKey
          );
          if (capturedEntry) delete updatedPieces[capturedEntry[0]];

          updatedPieces[pieceKey] = {
            ...pieceData,
            row: chosenMove.to.row,
            col: chosenMove.to.col,
          };

          // Update board state
          const newBoard = boardToUse.map(r => [...r]);
          newBoard[chosenMove.to.row][chosenMove.to.col] = pieceData.type as string; // type-safe cast
          newBoard[chosenMove.from.row][chosenMove.from.col] = '';
          setBoard(newBoard);

          if (isCheckmate(newBoard, 'w')) {
            alert('Checkmate! AI wins 🤖');
            setIsAIThinking(false);
            return updatedPieces;
          }

          setCurrentPlayer('w');
          setIsAIThinking(false);

          return updatedPieces;
        });
      }, aiTimeToThink);
    };

    const isKingInCheck = (kingRow: number, kingCol: number, kingColor: 'w' | 'b', boardState: string[][]): boolean => {
      const opponentColor = kingColor === 'w' ? 'b' : 'w';
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = boardState[row][col];
          const pieceColor = getPieceColor(piece);
          
          if (pieceColor === opponentColor) {
            const moves = getPossibleMoves(row, col, piece, boardState);
            if (moves.some(move => move.row === kingRow && move.col === kingCol)) {
              return true;
            }
          }
        }
      }
      
      return false;
    };

    const findKingPosition = (color: 'w' | 'b', boardState: string[][]): {row: number, col: number} | null => {
      const kingPiece = color === 'w' ? 'wk' : 'bk';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (boardState[row][col] === kingPiece) {
            return { row, col };
          }
        }
      }
      return null;
    };

    // Check if current player's king is in check
    const kingPosition = findKingPosition(currentPlayer, board);
    const isInCheck = kingPosition ? isKingInCheck(kingPosition.row, kingPosition.col, currentPlayer, board) : false;

    const handleSquarePress = (row: number, col: number) => {
      if (redoStack.length > 0) return;

      if (currentPlayer !== 'w' || isAIThinking) return;
      
      const piece = board[row][col];
      const pieceColor = getPieceColor(piece);

      if (selectedSquare) {
        if (
          pieceColor === 'w' &&
          isInCheck
        ) {
          const legalMoves = getLegalMovesForPiece(
            row,
            col,
            'w',
            board
          );

          if (legalMoves.length === 0) {
            Haptics.impactAsync(
              Haptics.ImpactFeedbackStyle.Medium
            );
            return;
          }
        }
        const isPossibleMove = possibleMoves.some(move => move.row === row && move.col === col);
        
        if (isPossibleMove) {
          setUndoStack(prev => [
            ...prev,
            {
              pieces: JSON.parse(JSON.stringify(pieces)),
              currentPlayer,
            },
          ]);

          const pieceKey = selectedSquare.key;
          const pieceData = pieces[pieceKey];

          const updatedPieces: Pieces = { ...pieces };

          const capturedEntry = Object.entries(updatedPieces).find(
            ([k, p]) => p.row === row && p.col === col && k !== pieceKey
          );

          if (capturedEntry) {
            delete updatedPieces[capturedEntry[0]];
          }

          updatedPieces[pieceKey] = {
            ...pieceData,
            row,
            col,
          };
          
          // animate first
          movePiece(pieceKey, row, col);
          
          // update visual state
          setPieces(updatedPieces);

          // Creating a deep copy of the board
          // So React sees it as a new state, and detect changes
          const newBoard = board.map(r => [...r]);
          newBoard[row][col] = newBoard[selectedSquare.row][selectedSquare.col];
          newBoard[selectedSquare.row][selectedSquare.col] = '';
          setBoard(newBoard);

          if (isCheckmate(newBoard, 'b')) {
            alert('Checkmate! You win 🎉');
            return;
          }

          setSelectedSquare(null);
          setPossibleMoves([]);
          setCurrentPlayer('b');
          
          // Trigger AI move with the updated board
          setTimeout(() => makeAIMove(newBoard), 300);
          return;
        }
        
        if (pieceColor === 'w') {
          const pieceEntry = Object.entries(pieces).find(
            ([, p]) => p.row === row && p.col === col
          );
          if (!pieceEntry) return;

          const [key] = pieceEntry;

          if (isInCheck) {
            const legalMoves = getLegalMovesForPiece(
              row,
              col,
              'w',
              board
            );

            if (legalMoves.length === 0) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
              );
              return;
            }

            setSelectedSquare({ key, row, col });
            setPossibleMoves(legalMoves);
            return;
          }

          setSelectedSquare({ key, row, col });
          setPossibleMoves(getPossibleMoves(row, col, piece, board));
          return;
        } 

        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      } 

      if (pieceColor === 'w') {
        const pieceEntry = Object.entries(pieces).find(
          ([, p]) => p.row === row && p.col === col
        );
        if (!pieceEntry) return;

        const [key] = pieceEntry;
        setSelectedSquare({ key, row, col });
        setPossibleMoves(getPossibleMoves(row, col, piece, board));
      }

    };    

    const syncAnimatedPieces = (pieces: Pieces) => {
      Object.entries(pieces).forEach(([key, piece]) => {
        // const anim = getAnimatedValue(key, piece.row, piece.col);
        const anim = getAnimatedValue(
                        animatedPieces,
                        key,
                        piece.row,
                        piece.col,
                        SQUARE_SIZE
                      );
        Animated.parallel([
          Animated.timing(anim.x, {
            toValue: piece.col * SQUARE_SIZE,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: piece.row * SQUARE_SIZE,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    };

    const undoMove = () => {
      if (undoStack.length === 0) return;

      const previousState = undoStack[undoStack.length - 1];

      setRedoStack(prev => [
        ...prev,
        {
          pieces: JSON.parse(JSON.stringify(pieces)),
          currentPlayer,
        },
      ]);

      setUndoStack(prev => prev.slice(0, -1));

      setPieces(previousState.pieces);
      setCurrentPlayer(previousState.currentPlayer);
      
      syncAnimatedPieces(previousState.pieces);
    };

    const redoMove = () => {
      if (redoStack.length === 0) return;

      const nextState = redoStack[redoStack.length - 1];

      setUndoStack(prev => [
        ...prev,
        {
          pieces: JSON.parse(JSON.stringify(pieces)),
          currentPlayer,
        },
      ]);

      setRedoStack(prev => prev.slice(0, -1));

      setPieces(nextState.pieces);
      setCurrentPlayer(nextState.currentPlayer);

      syncAnimatedPieces(nextState.pieces);
    };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <TopHeader headerText={`Chess vs AI (${difficulty})`} />
        
        <View style={styles.boardContainer}>
          <View style={styles.blackPlayerInfoDiv}>

            {/* AI Name (Black)*/}
            <View style={styles.playerNameTopLeft}>
              <Text style={styles.playerNameText}>AI ({difficulty})</Text>
              {isAIThinking && (
                <Text style={styles.thinkingText}>Thinking...</Text>
              )}
            </View>

            {/* Black Player Timer*/}
            <View style={styles.timerDiv}>
              <AntDesign name="clock-circle" size={14} color="white" />
              <Text style={styles.timerText}>{formatTime(blackTime)}</Text>
            </View>

          </View>

          <View style={styles.board}>

            <BoardSquares 
              selectedSquare={selectedSquare} 
              currentPlayer={currentPlayer}
              isAIThinking={isAIThinking}
              handleSquarePress={handleSquarePress} 
              possibleMoves={possibleMoves}
              board={board}
            />

            {/* Animated Pieces */}
            <ChessSmoothPieces
              pieces={pieces}
              animatedPieces={animatedPieces}
              getAnimatedValue={getAnimatedValue}
              squareSize={SQUARE_SIZE}
            />

          </View>
          
          <View style={styles.bottomDivContainer}>

            <View style={styles.moveBtns}>
              <TouchableOpacity style={[styles.moveBtn, undoStack.length === 0 && styles.disabledBtn]}
                onPress={undoMove}
                disabled={undoStack.length === 0}
              >
                <Ionicons name="caret-back" size={24} color="black" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.moveBtn, redoStack.length === 0 && styles.disabledBtn]}
                onPress={redoMove}
                disabled={redoStack.length === 0}
              >
                <Ionicons name="caret-forward" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Player Name (White) */}
            <View style={styles.whitePlayerInfoDiv}>
              <View style={styles.playerNameBottomRight}>
                <Text style={styles.playerNameTextWhite}>{playerName}</Text>
              </View>
              {/* White Player Timer */}
              <View style={styles.timerDiv}>
                <AntDesign name="clock-circle" size={14} color="white" />
                <Text style={styles.timerText}>{formatTime(whiteTime)}</Text>
              </View>
            </View>

          </View>

        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
    marginBottom: 100,
  },
  boardContainer: {
    alignItems: 'center',
    padding: 10,
    marginTop: 'auto',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  playerNameTopLeft: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  playerNameBottomRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#000',
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
  thinkingText: {
    fontSize: 10,
    color: '#FFD700',
    fontStyle: 'italic',
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
  moveIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    opacity: 0.3,
  },
  bottomDivContainer:{
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    width: '100%',
  }, 
  moveBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 80,
    marginLeft: 30,
  },
  moveBtn:{
    backgroundColor: '#DEE1E3',
    width: 40,
    height: 40,
    borderRadius: 20,  
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }, 
});
