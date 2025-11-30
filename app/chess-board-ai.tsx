import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { pieceImages } from '../constants/pieces';

export default function ChessBoardAIScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
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
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Array<{row: number, col: number}>>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [isAIThinking, setIsAIThinking] = useState(false);

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

  // Evaluate a move (simple piece value evaluation)
  const evaluateMove = (move: {from: {row: number, col: number}, to: {row: number, col: number}}, boardState: string[][]): number => {
    const capturedPiece = boardState[move.to.row][move.to.col];
    let score = 0;
    
    // Piece values
    const pieceValues: {[key: string]: number} = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };
    
    // Capture value
    if (capturedPiece) {
      const pieceType = capturedPiece[1];
      score += pieceValues[pieceType] || 0;
    }
    
    // Center control (for medium/hard)
    if (difficulty !== 'easy') {
      const centerRows = [3, 4];
      const centerCols = [3, 4];
      if (centerRows.includes(move.to.row) && centerCols.includes(move.to.col)) {
        score += 0.5;
      }
    }
    
    return score;
  };

  // AI makes a move
  const makeAIMove = (currentBoard: string[][]) => {
    setIsAIThinking(true);
    
    setTimeout(() => {
      setBoard((prevBoard) => {
        const boardToUse = currentBoard || prevBoard;
        const allMoves = getAllMoves('b', boardToUse);
        
        if (allMoves.length === 0) {
          setIsAIThinking(false);
          return boardToUse;
        }
        
        let chosenMove;
        
        if (difficulty === 'easy') {
          // Random move
          chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        } else if (difficulty === 'medium') {
          // Prefer captures, then random
          const captures = allMoves.filter(move => {
            const targetPiece = boardToUse[move.to.row][move.to.col];
            return targetPiece && getPieceColor(targetPiece) === 'w';
          });
          
          if (captures.length > 0) {
            chosenMove = captures[Math.floor(Math.random() * captures.length)];
          } else {
            chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
          }
        } else {
          // Hard: Best evaluated move
          const evaluatedMoves = allMoves.map(move => ({
            move,
            score: evaluateMove(move, boardToUse),
          }));
          
          evaluatedMoves.sort((a, b) => b.score - a.score);
          const bestScore = evaluatedMoves[0].score;
          const bestMoves = evaluatedMoves.filter(m => m.score === bestScore);
          chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)].move;
        }
        
        // Execute AI move
        const newBoard = boardToUse.map(r => [...r]);
        const piece = newBoard[chosenMove.from.row][chosenMove.from.col];
        newBoard[chosenMove.to.row][chosenMove.to.col] = piece;
        newBoard[chosenMove.from.row][chosenMove.from.col] = '';
        
        setCurrentPlayer('w');
        setIsAIThinking(false);
        return newBoard;
      });
    }, 2000); // AI thinks for 3 seconds
  };

  // Check if a king is in check
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

  // Find king position
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

  // Handle square click (only for player's turn)
  const handleSquarePress = (row: number, col: number) => {
    if (currentPlayer !== 'w' || isAIThinking) return;
    
    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);

    if (selectedSquare) {
      const isPossibleMove = possibleMoves.some(move => move.row === row && move.col === col);
      
      if (isPossibleMove) {
        const newBoard = board.map(r => [...r]);
        const selectedPiece = newBoard[selectedSquare.row][selectedSquare.col];
        newBoard[row][col] = selectedPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = '';
        
        setBoard(newBoard);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setCurrentPlayer('b');
        
        // Trigger AI move with the updated board
        setTimeout(() => makeAIMove(newBoard), 300);
      } else if (pieceColor === 'w') {
        setSelectedSquare({ row, col });
        setPossibleMoves(getPossibleMoves(row, col, piece));
      } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      if (pieceColor === 'w') {
        setSelectedSquare({ row, col });
        setPossibleMoves(getPossibleMoves(row, col, piece));
      }
    }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chess vs AI ({difficulty})</Text>
      </View>

      <View style={styles.boardContainer}>
        {/* AI Name (Black) - Top Left */}
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
        {squares.map((square) => {
            const piece = board[square.row][square.col];
            const isSelected = selectedSquare?.row === square.row && selectedSquare?.col === square.col;
            const isPossibleMove = possibleMoves.some(move => move.row === square.row && move.col === square.col);
            const isKingInCheckSquare = kingPosition && 
              kingPosition.row === square.row && 
              kingPosition.col === square.col && 
              isInCheck;
            
            return (
                <TouchableOpacity
                key={square.key}
                style={[
                    styles.square,
                    square.isLight ? styles.lightSquare : styles.darkSquare,
                    isSelected && styles.selectedSquare,
                    isPossibleMove && styles.possibleMoveSquare,
                    isKingInCheckSquare && styles.checkSquare,
                ]}
                onPress={() => handleSquarePress(square.row, square.col)}
                disabled={currentPlayer !== 'w' || isAIThinking}
                >
                {piece ? (
                    <Image
                    source={pieceImages[piece]}
                    style={styles.piece}
                    resizeMode="contain"
                    />
                ) : null}
                {isPossibleMove && !piece && (
                  <View style={styles.moveIndicator} />
                )}
                </TouchableOpacity>
            );
            })}
        </View>
        
        {/* Player Name (White) - Bottom Right */}
        <View style={styles.playerNameBottomRight}>
          <Text style={styles.playerNameTextWhite}>{playerName}</Text>
          {currentPlayer === 'w' && isInCheck && (
            <Text style={styles.checkText}> - CHECK!</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
  },
  playerNameTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  playerNameBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
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
  board: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#000',
  },
  square: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
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

