import { AudioPlayer } from './AudioPlayer.js';

export class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.player = null;
        this.currentRoom = null;
        this.audioPlayer = new AudioPlayer();
        this.gameState = 'lobby'; // lobby, in_room, playing, spectating
        this.rooms = [];
        this.players = [];
        this.leaderboard = [];
        
        this.initializeSocket();
        this.setupEventListeners();
    }

    initializeSocket() {
        // Connect to the multiplayer server
        this.socket = io('http://localhost:3000');
        
        this.socket.on('connect', () => {
            console.log('Connected to multiplayer server');
            this.showNotification('Connected to multiplayer server!', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from multiplayer server');
            this.showNotification('Disconnected from server', 'error');
            this.gameState = 'lobby';
            this.updateUI();
        });

        this.setupSocketEvents();
    }

    setupSocketEvents() {
        // Player events
        this.socket.on('player_joined', (playerData) => {
            this.player = playerData;
            this.showNotification(`Welcome, ${playerData.username}!`, 'success');
            this.updateUI();
        });

        this.socket.on('player_list_updated', (playersList) => {
            this.players = playersList;
            this.updatePlayerList();
        });

        // Room events
        this.socket.on('room_created', (room) => {
            this.currentRoom = room;
            this.gameState = 'in_room';
            this.showNotification(`Room ${room.id} created!`, 'success');
            this.updateUI();
            this.updateRoomInfo();
        });

        this.socket.on('room_joined', (room) => {
            this.currentRoom = room;
            this.gameState = 'in_room';
            this.showNotification(`Joined room ${room.id}!`, 'success');
            this.updateUI();
            this.updateRoomInfo();
        });

        this.socket.on('room_list_updated', (roomsList) => {
            this.rooms = roomsList;
            this.updateRoomList();
        });

        this.socket.on('player_joined_room', (data) => {
            this.updateRoomInfo();
            this.showNotification(`${data.player.username} joined the room!`, 'info');
        });

        this.socket.on('player_left_room', (data) => {
            this.updateRoomInfo();
            this.showNotification(`${data.player.username} left the room`, 'warning');
        });

        this.socket.on('host_changed', (newHostId) => {
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
            this.gameState = 'playing';
            this.currentRoom = data.room;
            this.showNotification('Game started! Good luck!', 'success');
            this.audioPlayer.playAudio('click');
            this.updateUI();
            this.startGameTimer(data.timeLimit);
        });

        this.socket.on('guess_result', (data) => {
            this.handleGuessResult(data);
        });

        this.socket.on('room_updated', (room) => {
            this.currentRoom = room;
            this.updateRoomInfo();
        });

        this.socket.on('round_ended', (data) => {
            this.handleRoundEnd(data);
        });

        this.socket.on('next_round_started', (data) => {
            this.currentRoom = data.room;
            this.showNotification(`Round ${data.room.round} starting in 5 seconds...`, 'info');
            this.startGameTimer(data.timeLimit);
        });

        this.socket.on('game_finished', (data) => {
            this.handleGameEnd(data);
        });

        // Power-up events
        this.socket.on('powerup_used', (data) => {
            this.showNotification(`Power-up used: ${data.message || data.type}`, 'success');
            this.audioPlayer.playAudio('success-sound');
        });

        // Chat events
        this.socket.on('chat_message', (message) => {
            this.addChatMessage(message);
        });

        // Spectator events
        this.socket.on('spectating_room', (room) => {
            this.currentRoom = room;
            this.gameState = 'spectating';
            this.showNotification('Now spectating the game', 'info');
            this.updateUI();
            this.updateRoomInfo();
        });

        this.socket.on('spectator_joined', (data) => {
            this.showNotification(`${data.player.username} is now spectating`, 'info');
        });

        // Error handling
        this.socket.on('error', (error) => {
            this.showNotification(error.message, 'error');
        });
    }

    setupEventListeners() {
        // Player join form
        const joinForm = document.getElementById('player-join-form');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.joinGame();
            });
        }

        // Create room form
        const createRoomForm = document.getElementById('create-room-form');
        if (createRoomForm) {
            createRoomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createRoom();
            });
        }

        // Join room buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('join-room-btn')) {
                const roomId = e.target.dataset.roomId;
                this.joinRoom(roomId);
            }
            
            if (e.target.classList.contains('spectate-room-btn')) {
                const roomId = e.target.dataset.roomId;
                this.spectateRoom(roomId);
            }
        });

        // Game controls
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }

        const leaveRoomBtn = document.getElementById('leave-room-btn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        }

        // Chat
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
        }

        // Power-ups
        const usePowerUpBtn = document.getElementById('use-powerup-btn');
        if (usePowerUpBtn) {
            usePowerUpBtn.addEventListener('click', () => this.usePowerUp());
        }
    }

    joinGame() {
        const username = document.getElementById('username-input').value.trim();
        const avatar = document.getElementById('avatar-select').value;
        
        if (!username) {
            this.showNotification('Please enter a username', 'error');
            return;
        }

        this.socket.emit('player_join', { username, avatar });
        document.getElementById('player-join-screen').style.display = 'none';
        document.getElementById('multiplayer-lobby').style.display = 'block';
    }

    createRoom() {
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

        this.socket.emit('create_room', { mode, settings });
    }

    joinRoom(roomId) {
        this.socket.emit('join_room', { roomId });
    }

    spectateRoom(roomId) {
        this.socket.emit('spectate_room', { roomId });
    }

    startGame() {
        if (this.currentRoom && this.currentRoom.host === this.socket.id) {
            this.socket.emit('start_game', { roomId: this.currentRoom.id });
        }
    }

    leaveRoom() {
        if (this.currentRoom) {
            this.socket.emit('leave_room', { roomId: this.currentRoom.id });
            this.currentRoom = null;
            this.gameState = 'lobby';
            this.updateUI();
            this.showNotification('Left the room', 'info');
        }
    }

    submitGuess(guess) {
        if (this.currentRoom && this.gameState === 'playing') {
            this.socket.emit('submit_guess', { roomId: this.currentRoom.id, guess });
        }
    }

    usePowerUp() {
        if (this.currentRoom && this.gameState === 'playing') {
            const powerUpType = this.currentRoom.powerUps.get(this.socket.id);
            if (powerUpType) {
                this.socket.emit('use_powerup', { roomId: this.currentRoom.id, powerUpType });
            }
        }
    }

    sendChatMessage() {
        const messageInput = document.getElementById('chat-input');
        const message = messageInput.value.trim();
        
        if (message && this.currentRoom) {
            this.socket.emit('chat_message', { roomId: this.currentRoom.id, message });
            messageInput.value = '';
        }
    }

    handleGuessResult(data) {
        if (data.result === 'correct') {
            this.audioPlayer.playAudio('success-sound');
            this.showNotification(`${data.playerName} guessed correctly in ${data.attempts} attempts!`, 'success');
            
            if (data.achievements && data.achievements.length > 0) {
                this.showNotification(`🏆 Achievement unlocked: ${data.achievements.join(', ')}!`, 'success');
            }
        } else {
            this.audioPlayer.playAudio('wrong');
            this.showNotification(`${data.playerName} guessed ${data.guess} - ${data.hint}`, 'info');
        }
        
        this.updateGameDisplay();
    }

    handleRoundEnd(data) {
        this.gameState = 'in_room';
        this.showNotification(`Round ${data.room.round} ended!`, 'info');
        this.updateUI();
        this.displayRoundResults(data.rankings);
    }

    handleGameEnd(data) {
        this.gameState = 'in_room';
        this.showNotification('Game finished!', 'info');
        this.updateUI();
        this.displayGameResults(data.finalRankings);
    }

    startGameTimer(duration) {
        let timeLeft = duration;
        const timerElement = document.getElementById('game-timer');
        
        const timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                timerElement.textContent = 'Time\'s up!';
                timerElement.classList.add('text-red-500');
            } else {
                timerElement.textContent = `${timeLeft}s`;
                if (timeLeft <= 10) {
                    timerElement.classList.add('text-red-500', 'animate-pulse');
                    this.audioPlayer.playAudio('tick_time_sound');
                }
                timeLeft--;
            }
        }, 1000);
    }

    updateUI() {
        const lobby = document.getElementById('multiplayer-lobby');
        const room = document.getElementById('game-room');
        const gameArea = document.getElementById('game-area');
        
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
    }

    updatePlayerList() {
        const playerList = document.getElementById('player-list');
        if (!playerList) return;
        
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
    }

    updateRoomList() {
        const roomList = document.getElementById('room-list');
        if (!roomList) return;
        
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
    }

    updateRoomInfo() {
        if (!this.currentRoom) return;
        
        const roomInfo = document.getElementById('room-info');
        if (!roomInfo) return;
        
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
    }

    updateGameDisplay() {
        if (!this.currentRoom) return;
        
        const gameDisplay = document.getElementById('game-display');
        if (!gameDisplay) return;
        
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
    }

    displayRoundResults(rankings) {
        const resultsModal = document.getElementById('results-modal');
        if (!resultsModal) return;
        
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
    }

    displayGameResults(rankings) {
        const resultsModal = document.getElementById('results-modal');
        if (!resultsModal) return;
        
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
    }

    addChatMessage(message) {
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'flex items-start space-x-2 p-2 bg-gray-700 rounded-lg';
        messageElement.innerHTML = `
            <span class="text-sm text-gray-400">${new Date(message.timestamp).toLocaleTimeString()}</span>
            <span class="font-semibold">${message.playerName}:</span>
            <span>${message.message}</span>
        `;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    showNotification(message, type = 'info') {
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
}
