import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef} from 'react';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { pieceImages } from '../constants/pieces';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';


type AnimatedPiece = {
  x: Animated.Value;
  y: Animated.Value;
};

type SelectedSquare = {
  key: string;
  row: number;
  col: number;
};

type BoardPosition = {
  row: number;
  col: number;
};

// const SQUARE_SIZE: number = 50;
const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = screenWidth * 0.97; // 90% of screen width
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
  const router = useRouter();
  const params = useLocalSearchParams();
  const animatedPieces = useRef<Record<string, AnimatedPiece>>({}).current;
  const playerName = (params.playerName as string) || 'Player';
  const difficulty = (params.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
  const boardSize = 8;

  const initialBoard = [
    ["br","bn","bb","bq","bk","bb","bn","br"],
    ["bp","bp","bp","bp","bp","bp","bp","bp"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["wp","wp","wp","wp","wp","wp","wp","wp"],
    ["wr","wn","wb","wq","wk","wb","wn","wr"],
  ];

  const [board, setBoard] = useState<string[][]>(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Array<{row: number, col: number}>>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [isAIThinking, setIsAIThinking] = useState(false);

  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [redoStack, setRedoStack] = useState<GameState[]>([]);


  const buildPiecesFromBoard = (board: string[][]) => {
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

  const [pieces, setPieces] = useState<Pieces>(
    buildPiecesFromBoard(initialBoard)
  );

  const getAnimatedValue = (key: string, row: number, col: number): AnimatedPiece => {
    if (!animatedPieces[key]) {
      animatedPieces[key] = {
        x: new Animated.Value(col * SQUARE_SIZE),
        y: new Animated.Value(row * SQUARE_SIZE),
      };
    }
    return animatedPieces[key];
  };

  // Move the piece on board with smooth animation 
  const movePiece = (key: string, row: number, col: number) => {
    const anim = getAnimatedValue(key, row, col);

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

  // Helper function to get piece color
  const getPieceColor = (piece: string): 'w' | 'b' | null => {
    if (!piece) return null;
    return piece[0] === 'w' ? 'w' : 'b';
  };

    // Calculate possible moves for a piece (same as regular chess board)
    const getPossibleMoves = (row: number, col: number, piece: string, boardState: string[][] = board): Array<{row: number, col: number}> => {
      if (!piece) return [];
      const moves: Array<{row: number, col: number}> = [];
      const pieceType = piece[1];
      const pieceColor = piece[0];

      switch (pieceType) {
        case 'p': // Pawn
          if (pieceColor === 'w') {
            if (row > 0 && !boardState[row - 1][col]) {
              moves.push({ row: row - 1, col });
              if (row === 6 && !boardState[row - 2][col]) {
                moves.push({ row: row - 2, col });
              }
            }
            if (row > 0 && col > 0 && boardState[row - 1][col - 1] && getPieceColor(boardState[row - 1][col - 1]) === 'b') {
              moves.push({ row: row - 1, col: col - 1 });
            }
            if (row > 0 && col < 7 && boardState[row - 1][col + 1] && getPieceColor(boardState[row - 1][col + 1]) === 'b') {
              moves.push({ row: row - 1, col: col + 1 });
            }
          } else {
            if (row < 7 && !boardState[row + 1][col]) {
              moves.push({ row: row + 1, col });
              if (row === 1 && !boardState[row + 2][col]) {
                moves.push({ row: row + 2, col });
              }
            }
            if (row < 7 && col > 0 && boardState[row + 1][col - 1] && getPieceColor(boardState[row + 1][col - 1]) === 'w') {
              moves.push({ row: row + 1, col: col - 1 });
            }
            if (row < 7 && col < 7 && boardState[row + 1][col + 1] && getPieceColor(boardState[row + 1][col + 1]) === 'w') {
              moves.push({ row: row + 1, col: col + 1 });
            }
          }
          break;

        case 'r': // Rook
          const rookDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          for (const [dr, dc] of rookDirections) {
            for (let i = 1; i < 8; i++) {
              const newRow = row + dr * i;
              const newCol = col + dc * i;
              if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
              const targetPiece = boardState[newRow][newCol];
              if (!targetPiece) {
                moves.push({ row: newRow, col: newCol });
              } else {
                if (getPieceColor(targetPiece) !== pieceColor) {
                  moves.push({ row: newRow, col: newCol });
                }
                break;
              }
            }
          }
          break;

        case 'n': // Knight
          const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
          for (const [dr, dc] of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const targetPiece = boardState[newRow][newCol];
              if (!targetPiece || getPieceColor(targetPiece) !== pieceColor) {
                moves.push({ row: newRow, col: newCol });
              }
            }
          }
          break;

        case 'b': // Bishop
          const bishopDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
          for (const [dr, dc] of bishopDirections) {
            for (let i = 1; i < 8; i++) {
              const newRow = row + dr * i;
              const newCol = col + dc * i;
              if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
              const targetPiece = boardState[newRow][newCol];
              if (!targetPiece) {
                moves.push({ row: newRow, col: newCol });
              } else {
                if (getPieceColor(targetPiece) !== pieceColor) {
                  moves.push({ row: newRow, col: newCol });
                }
                break;
              }
            }
          }
          break;

        case 'q': // Queen
          const queenDirections = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
          for (const [dr, dc] of queenDirections) {
            for (let i = 1; i < 8; i++) {
              const newRow = row + dr * i;
              const newCol = col + dc * i;
              if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
              const targetPiece = boardState[newRow][newCol];
              if (!targetPiece) {
                moves.push({ row: newRow, col: newCol });
              } else {
                if (getPieceColor(targetPiece) !== pieceColor) {
                  moves.push({ row: newRow, col: newCol });
                }
                break;
              }
            }
          }
          break;

        case 'k': // King
          const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
          for (const [dr, dc] of kingMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const targetPiece = boardState[newRow][newCol];
              if (!targetPiece || getPieceColor(targetPiece) !== pieceColor) {
                moves.push({ row: newRow, col: newCol });
              }
            }
          }
          break;
      }

      return moves;
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
          setPossibleMoves(getPossibleMoves(row, col, piece));
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
        setPossibleMoves(getPossibleMoves(row, col, piece));
      }

    };    

    const syncAnimatedPieces = (pieces: Pieces) => {
      Object.entries(pieces).forEach(([key, piece]) => {
        const anim = getAnimatedValue(key, piece.row, piece.col);

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
    <SafeAreaProvider>
      <SafeAreaView  style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Chess vs AI ({difficulty})</Text>
        </View>
        
        <View style={styles.boardContainer}>
          {/* AI Name (Black)*/}
          <View style={styles.playerNameTopLeft}>
            <Text style={styles.playerNameText}>AI ({difficulty})</Text>
            {currentPlayer === 'b' && isInCheck && (
              <Text style={styles.checkText}> - CHECK!</Text>
            )}
            {isAIThinking && (
              <Text style={styles.thinkingText}>Thinking...</Text>
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
                disabled={currentPlayer !== 'w' || isAIThinking}
              />
            ))}

            {/* Animated Pieces */}
            {Object.entries(pieces).map(([key, piece]) => {
              const anim = getAnimatedValue(key, piece.row, piece.col);

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
            <View style={styles.playerNameBottomRight}>
              <Text style={styles.playerNameTextWhite}>{playerName}</Text>
              {currentPlayer === 'w' && isInCheck && (
                <Text style={styles.checkText}> - CHECK!</Text>
              )}
            </View>
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
  infoDiv: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#B0DDF7',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  boardContainer: {
    alignItems: 'center',
    padding: 10,
    marginTop: 'auto',
  },
  playerNameTopLeft: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  playerNameBottomRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#000',
    // marginTop: 10,
    // alignSelf: 'flex-end',
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
    // width: '12.5%',
    // aspectRatio: 1,
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,  
    justifyContent: 'center',
    alignItems: 'center',
    // minHeight: 50,
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
  animatedPiece: {
    position: 'absolute',
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 100,
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
  }
});
