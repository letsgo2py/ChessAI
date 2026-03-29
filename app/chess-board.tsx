/* Board for offline chess game */

import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef, useMemo } from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useTheme } from '@/contexts/ThemeContext';

import TopHeader from './top-header';
import BoardSquares from './board-squares';
import ChessSmoothPieces from './chess-pieces';
import { getPieceColor, formatTime, findKingPosition, isKingInCheck, getSafeMoves, getAllSafeMoves } from '@/utils/chess-utils';
import { getAnimatedValue } from '@/utils/animation-utils';
import { getPossibleMoves } from '@/utils/chessMoves';
import { buildPiecesFromBoard } from '@/utils/chessPieces';

import { INITIAL_BOARD } from '@/constants/chessBoard';
import { green } from 'react-native-reanimated/lib/typescript/Colors';

const checkmateSound = require("../assets/sounds/checkmate_sound_effect.mp3");
const pieceSound = require("../assets/sounds/chess-movement-sound.mp3");
const kingCheckSound = require("../assets/sounds/king-check.mp3");

import {
  Player,
  Pieces,
  BoardState,
  AnimatedPieces,
  GameResult,
  Move,
} from '@/types/chess-types';

import { resetGame } from '@/utils/chess-reset';

import GameModal from "./chess-result";

const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = screenWidth * 0.97; // 97% of screen width
const SQUARE_SIZE = Math.floor(BOARD_SIZE / 8);   // Each square size

export default function ChessBoardScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const animatedPieces = useRef<AnimatedPieces>({}).current;
  const player1Name = (params.player1 as string) || 'Player 1';
  const player2Name = (params.player2 as string) || 'Player 2';
  const initialTime = Array.isArray(params.timer)
                        ? Number(params.timer[0])
                        : Number(params.timer) || 0;
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD.map(row => [...row]));
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Array<Move>>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('w');
  const [gameResult, setGameResult] = useState<GameResult>(null);

  const checkmateSoundRef = useRef<Audio.Sound | null>(null);
  const pieceSoundRef = useRef<Audio.Sound | null>(null);
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
      const { sound: moveSound } = await Audio.Sound.createAsync(pieceSound);
      pieceSoundRef.current = moveSound;

      const { sound: kingInHelpSound} = await Audio.Sound.createAsync(kingCheckSound);
      kingCheckSoundRef.current = kingInHelpSound;

      const { sound } = await Audio.Sound.createAsync(checkmateSound);
      checkmateSoundRef.current = sound;
    };

    loadSounds();

    return () => {
      pieceSoundRef.current?.unloadAsync();
      kingCheckSoundRef.current?.unloadAsync();
      checkmateSoundRef.current?.unloadAsync();
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      checkmateSoundRef.current?.replayAsync();
    }
  }, [allSafeMoves, isInCheck]);

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
  
  const handleSquarePress = (row: number, col: number) => {
    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);

    if (selectedSquare) {
      const isPossibleMove = possibleMoves.some(
        move => move.row === row && move.col === col
      );

      if (isPossibleMove) {
        const newBoard = board.map(r => [...r]);
        const selectedPiece = newBoard[selectedSquare.row][selectedSquare.col];

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

        pieceSoundRef.current?.replayAsync();

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <TopHeader headerText="Offline Chess" />

        <View style={styles.boardContainer}>
          <View style={styles.blackPlayerInfoDiv}>
            {/* Player 2 Name (Black) - Top Left */}
            <View style={styles.playerNameTopLeft}>
              <Text style={styles.playerNameText}>{player2Name}</Text>
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
              isAIThinking={false}
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
          
          <View style={styles.whitePlayerInfoDiv}>
            {/* Player 1 Name (White) - Bottom Right */}
            <View style={styles.playerNameBottomRight}>
              <Text style={styles.playerNameTextWhite}>{player1Name}</Text>
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

