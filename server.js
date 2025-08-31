const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true
}));

const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://127.0.0.1:8000'],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(express.static('.'));

// Game state management
const gameRooms = new Map();
const players = new Map();
const leaderboard = new Map();

// Game configuration
const GAME_MODES = {
    COMPETITIVE: 'competitive',
    TEAM: 'team',
    COOPERATIVE: 'cooperative',
    TOURNAMENT: 'tournament'
};

const POWER_UPS = {
    HINT: 'hint',
    EXTRA_TIME: 'extra_time',
    DOUBLE_POINTS: 'double_points',
    SHIELD: 'shield'
};

// Utility functions
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateScore(attempts, timeLeft, difficulty) {
    const baseScore = 100;
    const attemptPenalty = attempts * 10;
    const timeBonus = timeLeft * 2;
    const difficultyMultiplier = difficulty / 10;
    return Math.max(10, Math.floor((baseScore - attemptPenalty + timeBonus) * difficultyMultiplier));
}

function createGameRoom(mode, hostId, settings = {}) {
    const roomId = uuidv4().substring(0, 8);
    const room = {
        id: roomId,
        mode: mode,
        host: hostId,
        players: new Set([hostId]),
        spectators: new Set(),
        status: 'waiting', // waiting, playing, finished
        targetNumber: null,
        gameStartTime: null,
        round: 1,
        maxRounds: settings.maxRounds || 3,
        timeLimit: settings.timeLimit || 60,
        numberRange: settings.numberRange || { min: 1, max: 100 },
        powerUps: new Map(),
        chat: [],
        scores: new Map(),
        achievements: new Map(),
        createdAt: Date.now()
    };
    
    gameRooms.set(roomId, room);
    return room;
}

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Player joins
    socket.on('player_join', (data) => {
        const { username, avatar } = data;
        players.set(socket.id, {
            id: socket.id,
            username: username || `Player_${socket.id.substring(0, 4)}`,
            avatar: avatar || '👤',
            status: 'online',
            currentRoom: null,
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                bestScore: 0,
                averageAttempts: 0
            },
            achievements: new Set(),
            joinedAt: Date.now()
        });
        
        socket.emit('player_joined', players.get(socket.id));
        io.emit('player_list_updated', Array.from(players.values()));
    });

    // Create game room
    socket.on('create_room', (data) => {
        const { mode, settings } = data;
        const player = players.get(socket.id);
        
        if (!player) {
            socket.emit('error', { message: 'Player not found' });
            return;
        }
        
        const room = createGameRoom(mode, socket.id, settings);
        player.currentRoom = room.id;
        
        socket.join(room.id);
        socket.emit('room_created', room);
        io.emit('room_list_updated', Array.from(gameRooms.values()));
        
        console.log(`Room created: ${room.id} by ${player.username}`);
    });

    // Join game room
    socket.on('join_room', (data) => {
        const { roomId } = data;
        const player = players.get(socket.id);
        const room = gameRooms.get(roomId);
        
        if (!player || !room) {
            socket.emit('error', { message: 'Invalid room or player' });
            return;
        }
        
        if (room.status !== 'waiting') {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }
        
        if (room.players.size >= 8) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }
        
        room.players.add(socket.id);
        player.currentRoom = roomId;
        
        socket.join(roomId);
        socket.emit('room_joined', room);
        io.to(roomId).emit('player_joined_room', { player, room });
        
        console.log(`${player.username} joined room ${roomId}`);
    });

    // Start game
    socket.on('start_game', (data) => {
        const { roomId } = data;
        const room = gameRooms.get(roomId);
        const player = players.get(socket.id);
        
        if (!room || !player || room.host !== socket.id) {
            socket.emit('error', { message: 'Not authorized to start game' });
            return;
        }
        
        if (room.players.size < 2) {
            socket.emit('error', { message: 'Need at least 2 players to start' });
            return;
        }
        
        // Initialize game
        room.status = 'playing';
        room.targetNumber = generateRandomNumber(room.numberRange.min, room.numberRange.max);
        room.gameStartTime = Date.now();
        room.round = 1;
        
        // Reset scores for new game
        room.players.forEach(playerId => {
            room.scores.set(playerId, {
                score: 0,
                attempts: 0,
                hints: 0,
                powerUps: [],
                lastGuess: null
            });
        });
        
        // Distribute power-ups
        const powerUpTypes = Object.values(POWER_UPS);
        room.players.forEach(playerId => {
            const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            room.powerUps.set(playerId, randomPowerUp);
        });
        
        io.to(roomId).emit('game_started', {
            room,
            targetNumber: room.targetNumber,
            timeLimit: room.timeLimit
        });
        
        console.log(`Game started in room ${roomId}`);
    });

    // Submit guess
    socket.on('submit_guess', (data) => {
        const { roomId, guess } = data;
        const room = gameRooms.get(roomId);
        const player = players.get(socket.id);
        
        if (!room || !player || room.status !== 'playing') {
            socket.emit('error', { message: 'Invalid game state' });
            return;
        }
        
        const playerScore = room.scores.get(socket.id);
        if (!playerScore) return;
        
        playerScore.attempts++;
        playerScore.lastGuess = guess;
        
        const timeLeft = Math.max(0, room.timeLimit - Math.floor((Date.now() - room.gameStartTime) / 1000));
        
        if (guess === room.targetNumber) {
            // Correct guess!
            const score = calculateScore(playerScore.attempts, timeLeft, room.numberRange.max - room.numberRange.min);
            playerScore.score += score;
            
            // Update player stats
            const playerData = players.get(socket.id);
            playerData.stats.gamesPlayed++;
            playerData.stats.gamesWon++;
            playerData.stats.totalScore += score;
            playerData.stats.bestScore = Math.max(playerData.stats.bestScore, score);
            
            // Check for achievements
            if (playerScore.attempts === 1) {
                playerData.achievements.add('first_try');
                room.achievements.set(socket.id, 'first_try');
            }
            if (timeLeft > room.timeLimit * 0.8) {
                playerData.achievements.add('speed_demon');
                room.achievements.set(socket.id, 'speed_demon');
            }
            
            io.to(roomId).emit('guess_result', {
                playerId: socket.id,
                playerName: player.username,
                guess,
                result: 'correct',
                score,
                attempts: playerScore.attempts,
                timeLeft,
                achievements: Array.from(playerData.achievements)
            });
            
            // Check if all players have guessed correctly
            const allCorrect = Array.from(room.players).every(playerId => 
                room.scores.get(playerId).score > 0
            );
            
            if (allCorrect) {
                endRound(roomId);
            }
            
        } else {
            // Incorrect guess
            const hint = guess < room.targetNumber ? 'higher' : 'lower';
            
            io.to(roomId).emit('guess_result', {
                playerId: socket.id,
                playerName: player.username,
                guess,
                result: 'incorrect',
                hint,
                attempts: playerScore.attempts,
                timeLeft
            });
        }
        
        // Update room state
        io.to(roomId).emit('room_updated', room);
    });

    // Use power-up
    socket.on('use_powerup', (data) => {
        const { roomId, powerUpType } = data;
        const room = gameRooms.get(roomId);
        const player = players.get(socket.id);
        
        if (!room || !player || room.status !== 'playing') {
            socket.emit('error', { message: 'Invalid game state' });
            return;
        }
        
        const playerPowerUp = room.powerUps.get(socket.id);
        if (playerPowerUp !== powerUpType) {
            socket.emit('error', { message: 'Power-up not available' });
            return;
        }
        
        // Apply power-up effect
        const playerScore = room.scores.get(socket.id);
        switch (powerUpType) {
            case POWER_UPS.HINT:
                const target = room.targetNumber;
                const range = room.numberRange.max - room.numberRange.min;
                const hint = `The number is between ${Math.max(room.numberRange.min, target - Math.floor(range * 0.2))} and ${Math.min(room.numberRange.max, target + Math.floor(range * 0.2))}`;
                playerScore.hints++;
                socket.emit('powerup_used', { type: powerUpType, hint });
                break;
                
            case POWER_UPS.EXTRA_TIME:
                room.timeLimit += 30;
                socket.emit('powerup_used', { type: powerUpType, message: 'Extra 30 seconds added!' });
                break;
                
            case POWER_UPS.DOUBLE_POINTS:
                playerScore.score *= 2;
                socket.emit('powerup_used', { type: powerUpType, message: 'Points doubled!' });
                break;
                
            case POWER_UPS.SHIELD:
                playerScore.score = Math.max(playerScore.score, 50);
                socket.emit('powerup_used', { type: powerUpType, message: 'Score protected!' });
                break;
        }
        
        // Remove power-up after use
        room.powerUps.delete(socket.id);
        
        io.to(roomId).emit('room_updated', room);
    });

    // Chat message
    socket.on('chat_message', (data) => {
        const { roomId, message } = data;
        const room = gameRooms.get(roomId);
        const player = players.get(socket.id);
        
        if (!room || !player) return;
        
        const chatEntry = {
            id: uuidv4(),
            playerId: socket.id,
            playerName: player.username,
            message,
            timestamp: Date.now()
        };
        
        room.chat.push(chatEntry);
        
        io.to(roomId).emit('chat_message', chatEntry);
    });

    // Spectate room
    socket.on('spectate_room', (data) => {
        const { roomId } = data;
        const room = gameRooms.get(roomId);
        const player = players.get(socket.id);
        
        if (!room || !player) return;
        
        room.spectators.add(socket.id);
        socket.join(roomId);
        
        socket.emit('spectating_room', room);
        io.to(roomId).emit('spectator_joined', { player, room });
    });

    // Leave room
    socket.on('leave_room', (data) => {
        const { roomId } = data;
        const room = gameRooms.get(roomId);
        const player = players.get(socket.id);
        
        if (!room || !player) return;
        
        room.players.delete(socket.id);
        room.spectators.delete(socket.id);
        player.currentRoom = null;
        
        socket.leave(roomId);
        
        if (room.players.size === 0) {
            // Delete empty room
            gameRooms.delete(roomId);
            io.emit('room_list_updated', Array.from(gameRooms.values()));
        } else if (room.host === socket.id) {
            // Transfer host to next player
            const newHost = Array.from(room.players)[0];
            room.host = newHost;
            io.to(roomId).emit('host_changed', newHost);
        }
        
        io.to(roomId).emit('player_left_room', { player, room });
        socket.emit('room_left', { roomId });
    });

    // Disconnect
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player && player.currentRoom) {
            const room = gameRooms.get(player.currentRoom);
            if (room) {
                room.players.delete(socket.id);
                room.spectators.delete(socket.id);
                
                if (room.players.size === 0) {
                    gameRooms.delete(player.currentRoom);
                } else if (room.host === socket.id) {
                    const newHost = Array.from(room.players)[0];
                    room.host = newHost;
                    io.to(player.currentRoom).emit('host_changed', newHost);
                }
                
                io.to(player.currentRoom).emit('player_disconnected', { player, room });
            }
        }
        
        players.delete(socket.id);
        io.emit('player_list_updated', Array.from(players.values()));
        io.emit('room_list_updated', Array.from(gameRooms.values()));
        
        console.log(`Player disconnected: ${socket.id}`);
    });
});

// Game logic functions
function endRound(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    room.status = 'finished';
    
    // Calculate final scores and rankings
    const rankings = Array.from(room.players).map(playerId => {
        const player = players.get(playerId);
        const score = room.scores.get(playerId);
        return {
            playerId,
            username: player.username,
            score: score.score,
            attempts: score.attempts,
            achievements: Array.from(room.achievements.get(playerId) || [])
        };
    }).sort((a, b) => b.score - a.score);
    
    // Update leaderboard
    rankings.forEach((ranking, index) => {
        const playerId = ranking.playerId;
        const player = players.get(playerId);
        if (player) {
            player.stats.totalScore += ranking.score;
            player.stats.averageAttempts = (player.stats.averageAttempts + ranking.attempts) / 2;
        }
    });
    
    // Emit game results
    io.to(roomId).emit('round_ended', {
        room,
        rankings,
        targetNumber: room.targetNumber
    });
    
    // Auto-start next round if not last round
    if (room.round < room.maxRounds) {
        setTimeout(() => {
            startNextRound(roomId);
        }, 5000);
    } else {
        // Game completely finished
        io.to(roomId).emit('game_finished', {
            room,
            finalRankings: rankings
        });
    }
}

function startNextRound(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    room.round++;
    room.status = 'playing';
    room.targetNumber = generateRandomNumber(room.numberRange.min, room.numberRange.max);
    room.gameStartTime = Date.now();
    
    // Reset scores for new round
    room.players.forEach(playerId => {
        room.scores.set(playerId, {
            score: 0,
            attempts: 0,
            hints: 0,
            powerUps: [],
            lastGuess: null
        });
    });
    
    // Distribute new power-ups
    const powerUpTypes = Object.values(POWER_UPS);
    room.players.forEach(playerId => {
        const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        room.powerUps.set(playerId, randomPowerUp);
    });
    
    io.to(roomId).emit('next_round_started', {
        room,
        targetNumber: room.targetNumber,
        timeLimit: room.timeLimit
    });
}

// API endpoints
app.get('/api/rooms', (req, res) => {
    res.json(Array.from(gameRooms.values()));
});

app.get('/api/players', (req, res) => {
    res.json(Array.from(players.values()));
});

app.get('/api/leaderboard', (req, res) => {
    const sortedPlayers = Array.from(players.values())
        .sort((a, b) => b.stats.totalScore - a.stats.totalScore)
        .slice(0, 10);
    res.json(sortedPlayers);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 NumQuest Multiplayer Server running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to play!`);
});
