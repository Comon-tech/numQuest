import { AudioPlayer } from './AudioPlayer.js';

export class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.player = null;
        this.currentRoom = null;
        this.audioPlayer = new AudioPlayer(
            './resources/audio/success-sound.mp3',
            './resources/audio/wrong.mp3',
            './resources/audio/click.mp3',
            './resources/audio/tick_time_sound.mp3',
            './resources/audio/tick_time_sound.mp3'
        );
        this.gameState = 'lobby'; // lobby, in_room, playing, spectating
        this.rooms = [];
        this.players = [];
        this.leaderboard = [];
        this.connected = false;
        
        this.initializeSocket();
        this.setupEventListeners();
    }

    initializeSocket() {
        try {
            console.log('🔌 Initializing Socket.IO connection...');
            
            // Get the server URL from environment or use localhost for development
            const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3000' 
                : `https://${window.location.hostname}`;
            
            console.log('🌐 Connecting to server:', serverUrl);
            
            // Connect to the multiplayer server
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            
            this.socket.on('connect', () => {
                console.log('✅ Connected to multiplayer server');
                this.connected = true;
                this.showNotification('Connected to multiplayer server!', 'success');
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Connection error:', error);
                this.connected = false;
                this.showNotification(`Connection failed: ${error.message}`, 'error');
            });

            this.socket.on('disconnect', (reason) => {
                console.log('❌ Disconnected from multiplayer server:', reason);
                this.connected = false;
                this.showNotification('Disconnected from server', 'error');
                this.gameState = 'lobby';
                this.updateUI();
            });

            this.setupSocketEvents();
            
        } catch (error) {
            console.error('❌ Failed to initialize Socket.IO:', error);
            this.showNotification('Failed to initialize multiplayer connection', 'error');
        }
    }

    setupSocketEvents() {
        if (!this.socket) {
            console.error('❌ Socket not initialized');
            return;
        }

        // Player events
        this.socket.on('player_joined', (playerData) => {
            console.log('👤 Player joined:', playerData);
            this.player = playerData;
            this.showNotification(`Welcome, ${playerData.username}!`, 'success');
            this.updateUI();
        });

        this.socket.on('player_list_updated', (playersList) => {
            console.log('👥 Player list updated:', playersList);
            this.players = playersList;
            this.updatePlayerList();
        });

        // Room events
        this.socket.on('room_created', (room) => {
            console.log('🏠 Room created:', room);
            this.currentRoom = room;
            this.gameState = 'in_room';
            this.showNotification(`Room ${room.id} created!`, 'success');
            this.updateUI();
            this.updateRoomInfo();
        });

        this.socket.on('room_joined', (room) => {
            console.log('🚪 Room joined:', room);
            this.currentRoom = room;
            this.gameState = 'in_room';
            this.showNotification(`Joined room ${room.id}!`, 'success');
            this.updateUI();
            this.updateRoomInfo();
        });

        this.socket.on('room_list_updated', (roomsList) => {
            console.log('🏠 Room list updated:', roomsList);
            this.rooms = roomsList;
            this.updateRoomList();
        });

        this.socket.on('player_joined_room', (data) => {
            console.log('👤 Player joined room:', data);
            this.updateRoomInfo();
            this.showNotification(`${data.player.username} joined the room!`, 'info');
        });

        this.socket.on('player_left_room', (data) => {
            console.log('👤 Player left room:', data);
            this.updateRoomInfo();
            this.showNotification(`${data.player.username} left the room`, 'warning');
        });

        this.socket.on('host_changed', (newHostId) => {
            console.log('👑 Host changed to:', newHostId);
            if (this.currentRoom) {
                this.currentRoom.host = newHostId;
                this.updateRoomInfo();
                if (newHostId === this.socket.id) {
                    this.showNotification('You are now the host!', 'success');
                }
            }
        });

        // Game events
        this.socket.on('game_started', (data) => {
            console.log('🎮 Game started:', data);
            this.gameState = 'playing';
            this.currentRoom = data.room;
            this.showNotification('Game started! Good luck!', 'success');
            this.audioPlayer.playClickSound();
            this.updateUI();
            this.startGameTimer(data.timeLimit);
        });

        this.socket.on('guess_result', (data) => {
            console.log('🎯 Guess result:', data);
            this.handleGuessResult(data);
        });

        this.socket.on('room_updated', (room) => {
            console.log('🔄 Room updated:', room);
            this.currentRoom = room;
            this.updateRoomInfo();
        });

        this.socket.on('round_ended', (data) => {
            console.log('🏁 Round ended:', data);
            this.handleRoundEnd(data);
        });

        this.socket.on('next_round_started', (data) => {
            console.log('🔄 Next round started:', data);
            this.currentRoom = data.room;
            this.showNotification(`Round ${data.room.round} starting in 5 seconds...`, 'info');
            this.startGameTimer(data.timeLimit);
        });

        this.socket.on('game_finished', (data) => {
            console.log('🏆 Game finished:', data);
            this.handleGameEnd(data);
        });

        // Power-up events
        this.socket.on('powerup_used', (data) => {
            console.log('⚡ Power-up used:', data);
            this.showNotification(`Power-up used: ${data.message || data.type}`, 'success');
            this.audioPlayer.playCorrectSound();
        });

        // Chat events
        this.socket.on('chat_message', (message) => {
            console.log('💬 Chat message:', message);
            this.addChatMessage(message);
        });

        // Spectator events
        this.socket.on('spectating_room', (room) => {
            console.log('👁️ Spectating room:', room);
            this.currentRoom = room;
            this.gameState = 'spectating';
            this.showNotification('Now spectating the game', 'info');
            this.updateUI();
            this.updateRoomInfo();
        });

        this.socket.on('spectator_joined', (data) => {
            console.log('👁️ Spectator joined:', data);
            this.showNotification(`${data.player.username} is now spectating`, 'info');
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('❌ Server error:', error);
            this.showNotification(error.message, 'error');
        });
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Player join form
        const joinForm = document.getElementById('player-join-form');
        if (joinForm) {
            console.log('✅ Found player join form');
            joinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Form submitted, joining game...');
                this.joinGame();
            });
        } else {
            console.error('❌ Player join form not found');
        }

        // Create room form
        const createRoomForm = document.getElementById('create-room-form');
        if (createRoomForm) {
            console.log('✅ Found create room form');
            createRoomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('🏠 Creating room...');
                this.createRoom();
            });
        } else {
            console.error('❌ Create room form not found');
        }

        // Join room buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('join-room-btn')) {
                const roomId = e.target.dataset.roomId;
                console.log('🚪 Joining room:', roomId);
                this.joinRoom(roomId);
            }
            
            if (e.target.classList.contains('spectate-room-btn')) {
                const roomId = e.target.dataset.roomId;
                console.log('👁️ Spectating room:', roomId);
                this.spectateRoom(roomId);
            }
        });

        // Game controls
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            console.log('✅ Found start game button');
            startGameBtn.addEventListener('click', () => this.startGame());
        } else {
            console.log('ℹ️ Start game button not found (not in game room yet)');
        }

        const leaveRoomBtn = document.getElementById('leave-room-btn');
        if (leaveRoomBtn) {
            console.log('✅ Found leave room button');
            leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        } else {
            console.log('ℹ️ Leave room button not found (not in game room yet)');
        }

        // Chat
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            console.log('✅ Found chat form');
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
        } else {
            console.log('ℹ️ Chat form not found (not in game room yet)');
        }

        // Power-ups
        const usePowerUpBtn = document.getElementById('use-powerup-btn');
        if (usePowerUpBtn) {
            console.log('✅ Found use power-up button');
            usePowerUpBtn.addEventListener('click', () => this.usePowerUp());
        } else {
            console.log('ℹ️ Use power-up button not found (not in game room yet)');
        }
    }

    joinGame() {
        console.log('🎮 Joining game...');
        
        if (!this.connected) {
            console.error('❌ Not connected to server');
            this.showNotification('Not connected to server. Please wait...', 'error');
            return;
        }

        const username = document.getElementById('username-input').value.trim();
        const avatar = document.getElementById('avatar-select').value;
        
        console.log('👤 Username:', username, 'Avatar:', avatar);
        
        if (!username) {
            this.showNotification('Please enter a username', 'error');
            return;
        }

        console.log('📡 Emitting player_join event...');
        this.socket.emit('player_join', { username, avatar });
        
        // Hide the join screen and show the lobby
        const joinScreen = document.getElementById('player-join-screen');
        const lobby = document.getElementById('multiplayer-lobby');
        
        if (joinScreen && lobby) {
            joinScreen.style.display = 'none';
            lobby.style.display = 'block';
            console.log('✅ Switched to lobby view');
        } else {
            console.error('❌ Could not find join screen or lobby elements');
        }
    }

    createRoom() {
        console.log('🏠 Creating room...');
        
        if (!this.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }

        const mode = document.getElementById('game-mode-select').value;
        const maxRounds = parseInt(document.getElementById('max-rounds-input').value);
        const timeLimit = parseInt(document.getElementById('time-limit-input').value);
        const minRange = parseInt(document.getElementById('min-range-input').value);
        const maxRange = parseInt(document.getElementById('max-range-input').value);

        const settings = {
            maxRounds,
            timeLimit,
            numberRange: { min: minRange, max: maxRange }
        };

        console.log('⚙️ Room settings:', { mode, settings });
        this.socket.emit('create_room', { mode, settings });
    }

    joinRoom(roomId) {
        console.log('🚪 Joining room:', roomId);
        
        if (!this.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }

        this.socket.emit('join_room', { roomId });
    }

    spectateRoom(roomId) {
        console.log('👁️ Spectating room:', roomId);
        
        if (!this.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }

        this.socket.emit('spectate_room', { roomId });
    }

    startGame() {
        console.log('🎮 Starting game...');
        
        if (this.currentRoom && this.currentRoom.host === this.socket.id) {
            this.socket.emit('start_game', { roomId: this.currentRoom.id });
        } else {
            console.log('ℹ️ Not the host or no current room');
        }
    }

    leaveRoom() {
        console.log('🚪 Leaving room...');
        
        if (this.currentRoom) {
            this.socket.emit('leave_room', { roomId: this.currentRoom.id });
            this.currentRoom = null;
            this.gameState = 'lobby';
            this.updateUI();
            this.showNotification('Left the room', 'info');
        }
    }

    submitGuess(guess) {
        console.log('🎯 Submitting guess:', guess);
        
        if (this.currentRoom && this.gameState === 'playing') {
            this.socket.emit('submit_guess', { roomId: this.currentRoom.id, guess });
        } else {
            console.log('ℹ️ Cannot submit guess - not in playing state');
        }
    }

    usePowerUp() {
        console.log('⚡ Using power-up...');
        
        if (this.currentRoom && this.gameState === 'playing') {
            const powerUpType = this.currentRoom.powerUps.get(this.socket.id);
            if (powerUpType) {
                this.socket.emit('use_powerup', { roomId: this.currentRoom.id, powerUpType });
            } else {
                console.log('ℹ️ No power-up available');
            }
        }
    }

    sendChatMessage() {
        console.log('💬 Sending chat message...');
        
        const messageInput = document.getElementById('chat-input');
        const message = messageInput.value.trim();
        
        if (message && this.currentRoom) {
            this.socket.emit('chat_message', { roomId: this.currentRoom.id, message });
            messageInput.value = '';
        }
    }

    handleGuessResult(data) {
        console.log('🎯 Handling guess result:', data);
        
        if (data.result === 'correct') {
            this.audioPlayer.playCorrectSound();
            this.showNotification(`${data.playerName} guessed correctly in ${data.attempts} attempts!`, 'success');
            
            if (data.achievements && data.achievements.length > 0) {
                this.showNotification(`🏆 Achievement unlocked: ${data.achievements.join(', ')}!`, 'success');
            }
        } else {
            this.audioPlayer.playWrongSound();
            this.showNotification(`${data.playerName} guessed ${data.guess} - ${data.hint}`, 'info');
        }
        
        this.updateGameDisplay();
    }

    handleRoundEnd(data) {
        console.log('🏁 Handling round end:', data);
        
        this.gameState = 'in_room';
        this.showNotification(`Round ${data.room.round} ended!`, 'info');
        this.updateUI();
        this.displayRoundResults(data.rankings);
    }

    handleGameEnd(data) {
        console.log('🏆 Handling game end:', data);
        
        this.gameState = 'in_room';
        this.showNotification('Game finished!', 'info');
        this.updateUI();
        this.displayGameResults(data.finalRankings);
    }

    startGameTimer(duration) {
        console.log('⏰ Starting game timer:', duration);
        
        let timeLeft = duration;
        const timerElement = document.getElementById('game-timer');
        
        if (!timerElement) {
            console.error('❌ Game timer element not found');
            return;
        }
        
        const timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                timerElement.textContent = 'Time\'s up!';
                timerElement.classList.add('text-red-500');
            } else {
                timerElement.textContent = `${timeLeft}s`;
                if (timeLeft <= 10) {
                    timerElement.classList.add('text-red-500', 'animate-pulse');
                    this.audioPlayer.playTickSound();
                }
                timeLeft--;
            }
        }, 1000);
    }

    updateUI() {
        console.log('🎨 Updating UI, game state:', this.gameState);
        
        const lobby = document.getElementById('multiplayer-lobby');
        const room = document.getElementById('game-room');
        const gameArea = document.getElementById('game-area');
        
        if (!lobby || !room || !gameArea) {
            console.error('❌ UI elements not found:', { lobby, room, gameArea });
            return;
        }
        
        switch (this.gameState) {
            case 'lobby':
                lobby.style.display = 'block';
                room.style.display = 'none';
                gameArea.style.display = 'none';
                break;
            case 'in_room':
                lobby.style.display = 'none';
                room.style.display = 'block';
                gameArea.style.display = 'none';
                break;
            case 'playing':
                lobby.style.display = 'none';
                room.style.display = 'none';
                gameArea.style.display = 'block';
                break;
            case 'spectating':
                lobby.style.display = 'none';
                room.style.display = 'none';
                gameArea.style.display = 'block';
                break;
        }
        
        console.log('✅ UI updated successfully');
    }

    updatePlayerList() {
        console.log('👥 Updating player list:', this.players.length, 'players');
        
        const playerList = document.getElementById('player-list');
        if (!playerList) {
            console.log('ℹ️ Player list element not found (not in lobby yet)');
            return;
        }
        
        playerList.innerHTML = this.players.map(player => `
            <div class="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                <span class="text-2xl">${player.avatar}</span>
                <div class="flex-1">
                    <h4 class="font-semibold">${player.username}</h4>
                    <p class="text-sm text-gray-400">Score: ${player.stats.totalScore}</p>
                </div>
                <div class="w-3 h-3 rounded-full ${player.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}"></div>
            </div>
        `).join('');
        
        console.log('✅ Player list updated');
    }

    updateRoomList() {
        console.log('🏠 Updating room list:', this.rooms.length, 'rooms');
        
        const roomList = document.getElementById('room-list');
        if (!roomList) {
            console.log('ℹ️ Room list element not found (not in lobby yet)');
            return;
        }
        
        roomList.innerHTML = this.rooms.map(room => `
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="font-bold text-lg">Room ${room.id}</h3>
                        <p class="text-sm text-gray-400">${room.mode} • ${room.players.size}/8 players</p>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full ${
                        room.status === 'waiting' ? 'bg-green-600' : 
                        room.status === 'playing' ? 'bg-yellow-600' : 'bg-gray-600'
                    }">${room.status}</span>
                </div>
                <div class="flex space-x-2">
                    <button class="join-room-btn bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors" 
                            data-room-id="${room.id}">Join</button>
                    <button class="spectate-room-btn bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors" 
                            data-room-id="${room.id}">Spectate</button>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Room list updated');
    }

    updateRoomInfo() {
        console.log('🏠 Updating room info');
        
        if (!this.currentRoom) {
            console.log('ℹ️ No current room to update');
            return;
        }
        
        const roomInfo = document.getElementById('room-info');
        if (!roomInfo) {
            console.log('ℹ️ Room info element not found (not in game room yet)');
            return;
        }
        
        const players = Array.from(this.currentRoom.players).map(playerId => {
            const player = this.players.find(p => p.id === playerId);
            return player || { username: 'Unknown', avatar: '👤' };
        });
        
        roomInfo.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="font-bold text-lg mb-3">Room ${this.currentRoom.id}</h3>
                <div class="space-y-2">
                    <p><strong>Mode:</strong> ${this.currentRoom.mode}</p>
                    <p><strong>Status:</strong> ${this.currentRoom.status}</p>
                    <p><strong>Round:</strong> ${this.currentRoom.round}/${this.currentRoom.maxRounds}</p>
                    <p><strong>Time Limit:</strong> ${this.currentRoom.timeLimit}s</p>
                    <p><strong>Range:</strong> ${this.currentRoom.numberRange.min}-${this.currentRoom.numberRange.max}</p>
                </div>
                <div class="mt-4">
                    <h4 class="font-semibold mb-2">Players:</h4>
                    <div class="space-y-2">
                        ${players.map(player => `
                            <div class="flex items-center space-x-2">
                                <span class="text-xl">${player.avatar}</span>
                                <span>${player.username}</span>
                                ${this.currentRoom.host === player.id ? '<span class="text-yellow-400">👑</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Room info updated');
    }

    updateGameDisplay() {
        console.log('🎮 Updating game display');
        
        if (!this.currentRoom) {
            console.log('ℹ️ No current room to update game display');
            return;
        }
        
        const gameDisplay = document.getElementById('game-display');
        if (!gameDisplay) {
            console.log('ℹ️ Game display element not found (not in game area yet)');
            return;
        }
        
        const scores = Array.from(this.currentRoom.scores.entries()).map(([playerId, score]) => {
            const player = this.players.find(p => p.id === playerId);
            return { player, score };
        });
        
        gameDisplay.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${scores.map(({ player, score }) => `
                    <div class="bg-gray-800 rounded-lg p-4 border border-gray-600">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="text-2xl">${player?.avatar || '👤'}</span>
                            <h4 class="font-semibold">${player?.username || 'Unknown'}</h4>
                        </div>
                        <div class="space-y-1 text-sm">
                            <p>Score: <span class="text-[#78b95f] font-bold">${score.score}</span></p>
                            <p>Attempts: ${score.attempts}</p>
                            <p>Hints: ${score.hints}</p>
                            ${score.lastGuess ? `<p>Last guess: ${score.lastGuess}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        console.log('✅ Game display updated');
    }

    displayRoundResults(rankings) {
        console.log('🏁 Displaying round results:', rankings);
        
        const resultsModal = document.getElementById('results-modal');
        if (!resultsModal) {
            console.error('❌ Results modal element not found');
            return;
        }
        
        resultsModal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-xl font-bold mb-4 text-center">Round Results</h3>
                    <div class="space-y-3">
                        ${rankings.map((ranking, index) => `
                            <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <div class="flex items-center space-x-3">
                                    <span class="text-2xl">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)}</span>
                                    <span class="font-semibold">${ranking.username}</span>
                                </div>
                                <div class="text-right">
                                    <div class="text-[#78b95f] font-bold">${ranking.score}</div>
                                    <div class="text-sm text-gray-400">${ranking.attempts} attempts</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="w-full mt-4 bg-[#78b95f] hover:bg-[#6aa84f] text-white font-semibold rounded-lg py-2 transition-colors" 
                            onclick="this.parentElement.parentElement.remove()">Continue</button>
                </div>
            </div>
        `;
        
        console.log('✅ Round results displayed');
    }

    displayGameResults(rankings) {
        console.log('🏆 Displaying game results:', rankings);
        
        const resultsModal = document.getElementById('results-modal');
        if (!resultsModal) {
            console.error('❌ Results modal element not found');
            return;
        }
        
        resultsModal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-xl font-bold mb-4 text-center">🏆 Game Complete!</h3>
                    <div class="space-y-3 mb-4">
                        ${rankings.map((ranking, index) => `
                            <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <div class="flex items-center space-x-3">
                                    <span class="text-2xl">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)}</span>
                                    <span class="font-semibold">${ranking.username}</span>
                                </div>
                                <div class="text-right">
                                    <div class="text-[#78b95f] font-bold">${ranking.score}</div>
                                    <div class="text-sm text-gray-400">${ranking.attempts} attempts</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="w-full bg-[#78b95f] hover:bg-[#6aa84f] text-white font-semibold rounded-lg py-2 transition-colors" 
                            onclick="this.parentElement.parentElement.remove()">Back to Lobby</button>
                </div>
            </div>
        `;
        
        console.log('✅ Game results displayed');
    }

    addChatMessage(message) {
        console.log('💬 Adding chat message:', message);
        
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) {
            console.log('ℹ️ Chat container not found (not in game room yet)');
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'flex items-start space-x-2 p-2 bg-gray-700 rounded-lg';
        messageElement.innerHTML = `
            <span class="text-sm text-gray-400">${new Date(message.timestamp).toLocaleTimeString()}</span>
            <span class="font-semibold">${message.playerName}:</span>
            <span>${message.message}</span>
        `;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        console.log('✅ Chat message added');
    }

    showNotification(message, type = 'info') {
        console.log(`🔔 Showing notification [${type}]:`, message);
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        console.log('✅ Notification displayed');
    }

    // Public methods for external use
    getCurrentRoom() {
        return this.currentRoom;
    }

    getGameState() {
        return this.gameState;
    }

    isHost() {
        return this.currentRoom && this.currentRoom.host === this.socket.id;
    }

    isConnected() {
        return this.connected;
    }
}
