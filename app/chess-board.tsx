import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { pieceImages } from '../constants/pieces';

export default function ChessBoardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const player1Name = (params.player1 as string) || 'Player 1';
  const player2Name = (params.player2 as string) || 'Player 2';
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

  // Helper function to get piece color
  const getPieceColor = (piece: string): 'w' | 'b' | null => {
    if (!piece) return null;
    return piece[0] === 'w' ? 'w' : 'b';
  };

  // Calculate possible moves for a piece
  const getPossibleMoves = (row: number, col: number, piece: string): Array<{row: number, col: number}> => {
    if (!piece) return [];
    const moves: Array<{row: number, col: number}> = [];
    const pieceType = piece[1];
    const pieceColor = piece[0];

    switch (pieceType) {
      case 'p': // Pawn
        if (pieceColor === 'w') {
          // White pawn moves forward
          if (row > 0 && !board[row - 1][col]) {
            moves.push({ row: row - 1, col });
            // First move can go 2 squares
            if (row === 6 && !board[row - 2][col]) {
              moves.push({ row: row - 2, col });
            }
          }
          // Capture diagonally
          if (row > 0 && col > 0 && board[row - 1][col - 1] && getPieceColor(board[row - 1][col - 1]) === 'b') {
            moves.push({ row: row - 1, col: col - 1 });
          }
          if (row > 0 && col < 7 && board[row - 1][col + 1] && getPieceColor(board[row - 1][col + 1]) === 'b') {
            moves.push({ row: row - 1, col: col + 1 });
          }
        } else {
          // Black pawn moves forward
          if (row < 7 && !board[row + 1][col]) {
            moves.push({ row: row + 1, col });
            // First move can go 2 squares
            if (row === 1 && !board[row + 2][col]) {
              moves.push({ row: row + 2, col });
            }
          }
          // Capture diagonally
          if (row < 7 && col > 0 && board[row + 1][col - 1] && getPieceColor(board[row + 1][col - 1]) === 'w') {
            moves.push({ row: row + 1, col: col - 1 });
          }
          if (row < 7 && col < 7 && board[row + 1][col + 1] && getPieceColor(board[row + 1][col + 1]) === 'w') {
            moves.push({ row: row + 1, col: col + 1 });
          }
        }
        break;

      case 'r': // Rook
        // Horizontal and vertical moves
        const rookDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of rookDirections) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
            const targetPiece = board[newRow][newCol];
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
            const targetPiece = board[newRow][newCol];
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
            const targetPiece = board[newRow][newCol];
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

      case 'q': // Queen (combines rook and bishop)
        const queenDirections = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of queenDirections) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
            const targetPiece = board[newRow][newCol];
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
            const targetPiece = board[newRow][newCol];
            if (!targetPiece || getPieceColor(targetPiece) !== pieceColor) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
        break;
    }

    return moves;
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
          const moves = getPossibleMoves(row, col, piece);
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

  // Check if current player's king is in check
  const kingPosition = findKingPosition(currentPlayer);
  const isInCheck = kingPosition ? isKingInCheck(kingPosition.row, kingPosition.col, currentPlayer) : false;

  // Handle square click
  const handleSquarePress = (row: number, col: number) => {
    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);

    // If a square is already selected
    if (selectedSquare) {
      // Check if clicking on a possible move
      const isPossibleMove = possibleMoves.some(move => move.row === row && move.col === col);
      
      if (isPossibleMove) {
        // Move the piece
        const newBoard = board.map(r => [...r]);
        const selectedPiece = newBoard[selectedSquare.row][selectedSquare.col];
        newBoard[row][col] = selectedPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = '';
        
        setBoard(newBoard);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w');
      } else if (pieceColor === currentPlayer) {
        // Select a new piece of current player
        setSelectedSquare({ row, col });
        setPossibleMoves(getPossibleMoves(row, col, piece));
      } else {
        // Deselect if clicking on opponent's piece or empty square
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      // Select a piece if it belongs to current player
      if (pieceColor === currentPlayer) {
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
        <Text style={styles.title}>Chess Board</Text>
      </View>

      <View style={styles.boardContainer}>
        {/* Player 2 Name (Black) - Top Left */}
        <View style={styles.playerNameTopLeft}>
          <Text style={styles.playerNameText}>{player2Name}</Text>
          {currentPlayer === 'b' && isInCheck && (
            <Text style={styles.checkText}> - CHECK!</Text>
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
        
        {/* Player 1 Name (White) - Bottom Right */}
        <View style={styles.playerNameBottomRight}>
          <Text style={styles.playerNameTextWhite}>{player1Name}</Text>
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

