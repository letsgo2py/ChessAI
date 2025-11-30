import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getSocket, disconnectSocket } from '../config/socket';
import { pieceImages } from '../constants/pieces';

export default function ChessBoardOnlineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const gameId = params.gameId as string;
  const playerColor = (params.playerColor as 'w' | 'b') || 'w';
  const opponentName = (params.opponentName as string) || 'Opponent';
  const yourName = (params.yourName as string) || 'Player';
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
  const [isConnected, setIsConnected] = useState(false);

  // Helper function to get piece color
  const getPieceColor = (piece: string): 'w' | 'b' | null => {
    if (!piece) return null;
    return piece[0] === 'w' ? 'w' : 'b';
  };

  // Calculate possible moves (same as regular chess board)
  const getPossibleMoves = (row: number, col: number, piece: string): Array<{row: number, col: number}> => {
    if (!piece) return [];
    const moves: Array<{row: number, col: number}> = [];
    const pieceType = piece[1];
    const pieceColor = piece[0];

    switch (pieceType) {
      case 'p': // Pawn
        if (pieceColor === 'w') {
          if (row > 0 && !board[row - 1][col]) {
            moves.push({ row: row - 1, col });
            if (row === 6 && !board[row - 2][col]) {
              moves.push({ row: row - 2, col });
            }
          }
          if (row > 0 && col > 0 && board[row - 1][col - 1] && getPieceColor(board[row - 1][col - 1]) === 'b') {
            moves.push({ row: row - 1, col: col - 1 });
          }
          if (row > 0 && col < 7 && board[row - 1][col + 1] && getPieceColor(board[row - 1][col + 1]) === 'b') {
            moves.push({ row: row - 1, col: col + 1 });
          }
        } else {
          if (row < 7 && !board[row + 1][col]) {
            moves.push({ row: row + 1, col });
            if (row === 1 && !board[row + 2][col]) {
              moves.push({ row: row + 2, col });
            }
          }
          if (row < 7 && col > 0 && board[row + 1][col - 1] && getPieceColor(board[row + 1][col - 1]) === 'w') {
            moves.push({ row: row + 1, col: col - 1 });
          }
          if (row < 7 && col < 7 && board[row + 1][col + 1] && getPieceColor(board[row + 1][col + 1]) === 'w') {
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

      case 'q': // Queen
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

  // Socket connection and game sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      router.back();
      return;
    }

    socket.on('connect', () => {
      setIsConnected(true);
      // Request current game state
      socket.emit('getGameState', gameId);
    });

    socket.on('gameState', (data) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
    });

    socket.on('moveMade', (data) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setSelectedSquare(null);
      setPossibleMoves([]);
    });

    socket.on('opponentDisconnected', () => {
      // Handle opponent disconnect
      alert('Opponent disconnected');
    });

    socket.on('error', (error) => {
      console.error('Game error:', error);
      alert(error.message || 'An error occurred');
    });

    return () => {
      socket.off('connect');
      socket.off('gameState');
      socket.off('moveMade');
      socket.off('opponentDisconnected');
      socket.off('error');
    };
  }, [gameId]);

  // Handle square click
  const handleSquarePress = (row: number, col: number) => {
    if (currentPlayer !== playerColor || !isConnected) return;

    const socket = getSocket();
    if (!socket) return;

    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);

    if (selectedSquare) {
      const isPossibleMove = possibleMoves.some(move => move.row === row && move.col === col);

      if (isPossibleMove) {
        // Send move to server
        socket.emit('makeMove', {
          gameId,
          from: selectedSquare,
          to: { row, col },
        });

        // Optimistically update local board
        const newBoard = board.map(r => [...r]);
        const selectedPiece = newBoard[selectedSquare.row][selectedSquare.col];
        newBoard[row][col] = selectedPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = '';

        setBoard(newBoard);
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (pieceColor === playerColor) {
        setSelectedSquare({ row, col });
        setPossibleMoves(getPossibleMoves(row, col, piece));
      } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else {
      if (pieceColor === playerColor) {
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

  const player1Name = playerColor === 'w' ? yourName : opponentName;
  const player2Name = playerColor === 'b' ? yourName : opponentName;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            disconnectSocket();
            router.back();
          }}
        >
          <Text style={styles.backButtonText}>Leave Game</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Online Match</Text>
        {!isConnected && (
          <Text style={styles.connectionStatus}>Connecting...</Text>
        )}
      </View>

      <View style={styles.boardContainer}>
        {/* Player 2 Name (Black) - Top Left */}
        <View style={styles.playerNameTopLeft}>
          <Text style={styles.playerNameText}>
            {playerColor === 'b' ? yourName : opponentName}
          </Text>
          {currentPlayer === 'b' && currentPlayer === playerColor && (
            <Text style={styles.yourTurnText}>Your Turn</Text>
          )}
        </View>

        <View style={styles.board}>
          {squares.map((square) => {
            const piece = board[square.row][square.col];
            const isSelected = selectedSquare?.row === square.row && selectedSquare?.col === square.col;
            const isPossibleMove = possibleMoves.some(move => move.row === square.row && move.col === square.col);

            return (
              <TouchableOpacity
                key={square.key}
                style={[
                  styles.square,
                  square.isLight ? styles.lightSquare : styles.darkSquare,
                  isSelected && styles.selectedSquare,
                  isPossibleMove && styles.possibleMoveSquare,
                ]}
                onPress={() => handleSquarePress(square.row, square.col)}
                disabled={currentPlayer !== playerColor || !isConnected}
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
          <Text style={styles.playerNameTextWhite}>
            {playerColor === 'w' ? yourName : opponentName}
          </Text>
          {currentPlayer === 'w' && currentPlayer === playerColor && (
            <Text style={styles.yourTurnText}>Your Turn</Text>
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
  connectionStatus: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
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
  yourTurnText: {
    fontSize: 10,
    color: '#FFD700',
    fontStyle: 'italic',
    marginTop: 2,
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

