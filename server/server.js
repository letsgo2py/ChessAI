const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store matchmaking queue and active games
const matchmakingQueue = [];
const activeGames = new Map(); // gameId -> { player1, player2, board, currentPlayer, moves }

// Generate unique game ID
const generateGameId = () => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Initialize chess board
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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join matchmaking queue
  socket.on('joinMatchmaking', (playerData) => {
    console.log('Player joined matchmaking:', socket.id, playerData);
    
    // Remove from queue if already there
    const existingIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (existingIndex !== -1) {
      matchmakingQueue.splice(existingIndex, 1);
    }

    // Add to queue
    matchmakingQueue.push({
      socketId: socket.id,
      playerName: playerData.playerName || 'Player',
      joinedAt: Date.now()
    });

    socket.emit('matchmakingStatus', { status: 'searching', queuePosition: matchmakingQueue.length });

    // Try to match players
    if (matchmakingQueue.length >= 2) {
      const player1 = matchmakingQueue.shift();
      const player2 = matchmakingQueue.shift();

      const gameId = generateGameId();
      
      // Create game
      activeGames.set(gameId, {
        player1: player1.socketId,
        player2: player2.socketId,
        player1Name: player1.playerName,
        player2Name: player2.playerName,
        board: JSON.parse(JSON.stringify(initialBoard)),
        currentPlayer: 'w', // White starts
        moves: [],
        createdAt: Date.now()
      });

      // Join game room
      io.sockets.sockets.get(player1.socketId)?.join(gameId);
      io.sockets.sockets.get(player2.socketId)?.join(gameId);

      // Notify both players
      io.to(player1.socketId).emit('matchFound', {
        gameId,
        playerColor: 'w',
        opponentName: player2.playerName,
        yourName: player1.playerName
      });

      io.to(player2.socketId).emit('matchFound', {
        gameId,
        playerColor: 'b',
        opponentName: player1.playerName,
        yourName: player2.playerName
      });

      // Send initial game state
      const game = activeGames.get(gameId);
      io.to(gameId).emit('gameState', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        player1Name: game.player1Name,
        player2Name: game.player2Name
      });
    }
  });

  // Leave matchmaking
  socket.on('leaveMatchmaking', () => {
    const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
    }
    socket.emit('matchmakingStatus', { status: 'cancelled' });
  });

  // Make a move
  socket.on('makeMove', (data) => {
    const { gameId, from, to } = data;
    const game = activeGames.get(gameId);

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Verify it's player's turn
    const isPlayer1 = game.player1 === socket.id;
    const isPlayer2 = game.player2 === socket.id;
    const playerColor = isPlayer1 ? 'w' : (isPlayer2 ? 'b' : null);

    if (!playerColor || game.currentPlayer !== playerColor) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Validate move (basic validation)
    if (from.row < 0 || from.row >= 8 || from.col < 0 || from.col >= 8 ||
        to.row < 0 || to.row >= 8 || to.col < 0 || to.col >= 8) {
      socket.emit('error', { message: 'Invalid move' });
      return;
    }

    // Execute move
    const newBoard = JSON.parse(JSON.stringify(game.board));
    const piece = newBoard[from.row][from.col];
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = '';

    // Update game state
    game.board = newBoard;
    game.currentPlayer = game.currentPlayer === 'w' ? 'b' : 'w';
    game.moves.push({ from, to, player: playerColor, timestamp: Date.now() });

    // Broadcast move to both players
    io.to(gameId).emit('moveMade', {
      from,
      to,
      board: newBoard,
      currentPlayer: game.currentPlayer
    });
  });

  // Get game state
  socket.on('getGameState', (gameId) => {
    const game = activeGames.get(gameId);
    if (game) {
      socket.emit('gameState', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        player1Name: game.player1Name,
        player2Name: game.player2Name
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from matchmaking queue
    const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }

    // Handle game disconnection
    for (const [gameId, game] of activeGames.entries()) {
      if (game.player1 === socket.id || game.player2 === socket.id) {
        // Notify opponent
        const opponentId = game.player1 === socket.id ? game.player2 : game.player1;
        io.to(opponentId).emit('opponentDisconnected');
        
        // Remove game after delay (or keep for reconnection)
        setTimeout(() => {
          activeGames.delete(gameId);
        }, 60000); // Remove after 1 minute
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chess server running on port ${PORT}`);
});

