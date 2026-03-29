import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef, useMemo } from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Haptics from 'expo-haptics';
import { Audio } from "expo-av";
import { useTheme } from '@/contexts/ThemeContext';

import TopHeader from './top-header';
import BoardSquares from './board-squares';
import ChessSmoothPieces from './chess-pieces';
import { getPieceColor, formatTime, findKingPosition, isKingInCheck, simulateMove, getSafeMoves, getAllSafeMoves } from '@/utils/chess-utils';
import { getAnimatedValue } from '@/utils/animation-utils';
import { getPossibleMoves } from '@/utils/chessMoves';
import { buildPiecesFromBoard } from '@/utils/chessPieces';

import { INITIAL_BOARD } from '@/constants/chessBoard';
import {
  Player,
  Pieces,
  BoardState,
  SelectedSquare,
  AnimatedPieces,
  GameState,
  GameResult,
  Move,
  FullMove,
  Difficulty,
} from '@/types/chess-types';

import { resetGame } from '@/utils/chess-reset';

const kingCheckSound = require("../assets/sounds/king-check.mp3");

import GameModal from "./chess-result";


// const SQUARE_SIZE: number = 50;
const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = screenWidth * 0.97; // 97% of screen width
const SQUARE_SIZE = Math.floor(BOARD_SIZE / 8);   // Each square size

export default function ChessBoardAIScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const animatedPieces = useRef<AnimatedPieces>({}).current;
  const playerName = (params.playerName as string) || 'Player';
  const difficulty = (params.difficulty as Difficulty) || 'medium';
  const initialTime = Array.isArray(params.timer)
                        ? Number(params.timer[0])
                        : Number(params.timer) || 0;

  const [whiteTime, setWhiteTime] = useState(initialTime); 
  const [blackTime, setBlackTime] = useState(initialTime);

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD.map(row => [...row]));   // cloning the initial board
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Array<Move>>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('w');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);

  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [redoStack, setRedoStack] = useState<GameState[]>([]);


  const kingCheckSoundRef = useRef<Audio.Sound | null>(null);

  const [pieces, setPieces] = useState<Pieces>(
    buildPiecesFromBoard(INITIAL_BOARD.map(row => [...row]))
  );

  const kingPosition = findKingPosition(currentPlayer, board);
  const isInCheck = kingPosition ? isKingInCheck(board, kingPosition.row, kingPosition.col, currentPlayer) : false;
  const safeMoves = getSafeMoves({
    selectedSquare,
    possibleMoves,
    board,
    currentPlayer,
  });

  const allSafeMoves = useMemo(
    () =>
      getAllSafeMoves({
        board,
        currentPlayer,
      }),
    [board, currentPlayer]
  );

  useEffect(() => {
    const loadSounds = async () => {
      // const { sound: moveSound } = await Audio.Sound.createAsync(pieceSound);
      // pieceSoundRef.current = moveSound;

      const { sound: kingInHelpSound} = await Audio.Sound.createAsync(kingCheckSound);
      kingCheckSoundRef.current = kingInHelpSound;

      // const { sound } = await Audio.Sound.createAsync(checkmateSound);
      // checkmateSoundRef.current = sound;
    };

    loadSounds();

    return () => {
      // pieceSoundRef.current?.unloadAsync();
      kingCheckSoundRef.current?.unloadAsync();
      // checkmateSoundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (allSafeMoves.length === 0) {
      if (isInCheck) {
        setGameResult({
          type: "checkmate",
          winner: currentPlayer === "w" ? "b" : "w"
        });
        console.log("CHECMATE MY FRIEND")
      } else {
        setGameResult({
          type: "stalemate"
        });
        console.log("STALEMATE MY FRIEND")

      }
    }
  }, [allSafeMoves, isInCheck]);

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
    const getAllMoves = (playerColor: Player, boardState: BoardState): Array<FullMove> => {
      const allMoves: Array<FullMove> = [];
      
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
      color: Player,
      boardState: BoardState
    ): Array<Move> => {
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
      currentPlayer: Player,
      boardState: BoardState
    ) => {
      const moves = getAllMoves(currentPlayer, boardState);

      return moves.filter(move => {
        const newBoard = simulateMove(boardState, move.from, move.to);
        const kingPos = findKingPosition(currentPlayer, newBoard);
        if (!kingPos) return false;

        return !isKingInCheck(
          newBoard,
          kingPos.row,
          kingPos.col,
          currentPlayer
        );
      });
    };

    const evaluateBoard = (board: BoardState): number => {
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

    const minimax = (
      board: BoardState,
      depth: number,
      isMaximizing: boolean
    ): number => {
      
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
          const newBoard = simulateMove(board, move.from, move.to);
          const evalScore = minimax(newBoard, depth - 1, false);
          maxEval = Math.max(maxEval, evalScore);
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          const newBoard = simulateMove(board, move.from, move.to);
          const evalScore = minimax(newBoard, depth - 1, true);
          minEval = Math.min(minEval, evalScore);
        }
        return minEval;
      }
    };

    const chooseBestMoveMinimax = (
      board: BoardState,
      depth: number
    ) => {
      const moves = getLegalMoves('b', board);

      let bestScore = -Infinity;
      let bestMoves: typeof moves = [];

      for (const move of moves) {
        const newBoard = simulateMove(board, move.from, move.to);
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


    const makeAIMove = (currentBoard: BoardState) => {
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

          setCurrentPlayer('w');
          setIsAIThinking(false);

          return updatedPieces;
        });
      }, aiTimeToThink);
    };

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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
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
            {initialTime > 0 && (
              <View style={styles.timerDiv}>
                <AntDesign name="clock-circle" size={14} color="white" />
                <Text style={styles.timerText}>{formatTime(blackTime)}</Text>
              </View>
            )}

          </View>

          <View style={styles.board}>

            <BoardSquares 
              selectedSquare={selectedSquare} 
              currentPlayer={currentPlayer}
              isAIThinking={isAIThinking}
              handleSquarePress={handleSquarePress} 
              board={board}
              isInCheck={isInCheck}
              kingPosition={kingPosition}
              safeMoves={safeMoves}
              playSound={() => kingCheckSoundRef.current?.replayAsync()}
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
              {initialTime > 0 && (
                <View style={styles.timerDiv}>
                  <AntDesign name="clock-circle" size={14} color="white" />
                  <Text style={styles.timerText}>{formatTime(whiteTime)}</Text>
                </View>
              )}
            </View>

          </View>

        </View>
        <GameModal
          visible={!!gameResult}
          gameResult={gameResult}
          onRestart={() => {
            resetGame({
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
            });
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
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
