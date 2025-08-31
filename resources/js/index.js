import { audioPlayer, backgroundMusicPlayer } from './AudioPlayer.js';
import { HistoryManager } from './history.js';

// Game state variables
let targetNumber = Math.floor(Math.random() * 10) + 1;
let attempts = 0;
let score = 100;
let timerSeconds = 60;
let gameOver = false;
let gameStarted = false;

// DOM elements
const guessInput = document.getElementById('guessInput');
const checkGuessButton = document.getElementById('checkGuess');
const timerElement = document.getElementById('timer');
const resetButton = document.getElementById('reset');
const hintBox = document.getElementById('hint-message');
const messageBox = document.getElementById('message');
const scoreBox = document.getElementById('score');
const gameInstruction = document.getElementById('game-instruction');
const range1 = document.getElementById('range_');
const range2 = document.getElementById('range');
const applySettingsButton = document.getElementById('savesettings');
const toggleBgMusic = document.getElementById('toggleBgMusic');
const stopBgMusicButton = document.getElementById('stopBgMusic');
const volumeControl = document.getElementById('volume');

// Initialize history manager
const historyManager = new HistoryManager();

// Volume control
volumeControl.addEventListener('input', () => {
    const volume = parseFloat(volumeControl.value);
    audioPlayer.setVolume(volume);
    backgroundMusicPlayer.setVolume(volume);
});

// Initialize the game
function initGame() {
    regenerateVar();
    updateDisplay();
    updateHistory();
}

// Generate random number based on user range
function regenerateVar() {
    const min = parseInt(range1.value);
    const max = parseInt(range2.value);

    // Validate range values
    if (min === max) {
        alert('The range values cannot be the same.');
        return;
    }
    
    if (isNaN(min) || isNaN(max)) {
        alert('Please enter valid values for the range.');
        return;
    }
    
    // Swap values if min > max
    if (max < min) {
        range1.value = max;
        range2.value = min;
    }

    // Update game instruction and input constraints
    const actualMin = Math.min(parseInt(range1.value), parseInt(range2.value));
    const actualMax = Math.max(parseInt(range1.value), parseInt(range2.value));
    
    gameInstruction.innerText = `Guess a number between ${actualMin} and ${actualMax}`;
    guessInput.min = actualMin;
    guessInput.max = actualMax;

    // Generate new target number
    targetNumber = Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin;
}

// Update timer display with visual feedback
function updateTimer() {
    timerElement.innerText = `${timerSeconds}s`;
    
    // Add visual feedback based on time remaining
    timerElement.className = 'text-2xl sm:text-3xl font-bold text-[#78b95f]';
    
    if (timerSeconds <= 10) {
        timerElement.classList.add('animate-pulse', 'text-red-500');
    } else if (timerSeconds <= 20) {
        timerElement.classList.add('animate-pulse', 'text-yellow-500');
    }
}

// Timer countdown
function decrementTimer() {
    if (gameOver || !gameStarted) {
        return;
    }

    timerSeconds--;
    updateTimer();

    if (timerSeconds <= 0) {
        endGame();
    } else {
        setTimeout(decrementTimer, 1000);
    }

    // Play tick sound
    audioPlayer.playTickSound();
}

// Start timer
function startTimer() {
    if (!gameStarted) {
        gameStarted = true;
        decrementTimer();
    }
}

// Check player's guess
function checkGuess() {
    if (gameOver) return;

    const playerGuess = parseInt(guessInput.value);
    
    if (isNaN(playerGuess)) {
        displayMessage('Please enter a valid number!', 'error');
        return;
    }

    attempts++;
    
    // Start timer on first guess
    if (attempts === 1) {
        startTimer();
    }

    if (playerGuess === targetNumber) {
        // Correct guess
        gameOver = true;
        checkGuessButton.disabled = true;
        guessInput.disabled = true;
        
        // Add victory animation
        messageBox.classList.add('animate-bounce');
        
        displayMessage(`🎉 Congratulations! You guessed ${targetNumber} in ${attempts} attempts! 🎉`, 'success');
        displayHint('🎉 You win! 🎉');
        
        // Award points based on attempts and time
        const timeBonus = Math.max(0, 60 - timerSeconds);
        const attemptBonus = Math.max(0, 10 - attempts);
        const pointsAwarded = 50 + timeBonus + (attemptBonus * 5);
        
        score += pointsAwarded;
        updateDisplay();
        
        // Play success sound
        audioPlayer.playCorrectSound();
        
        // Save to history
        historyManager.append({
            attempts,
            timer: 60 - timerSeconds,
            score: score
        });
        
        updateHistory();
        
    } else {
        // Wrong guess
        score = Math.max(0, score - 10);
        updateDisplay();
        
        if (playerGuess < targetNumber) {
            displayHint('Try a higher number! 🔺');
        } else {
            displayHint('Try a lower number! 🔻');
        }
        
        displayMessage(`Wrong guess! Score: ${score}`, 'error');
        
        // Play wrong sound
        audioPlayer.playWrongSound();
        
        // Clear input for next guess
        guessInput.value = '';
        guessInput.focus();
    }
}

// Reset game
function resetGame() {
    gameOver = false;
    gameStarted = false;
    attempts = 0;
    score = 100;
    timerSeconds = 60;
    
    regenerateVar();
    
    // Reset UI
    checkGuessButton.disabled = false;
    guessInput.disabled = false;
    guessInput.value = '';
    guessInput.focus();
    
    // Remove victory animation
    messageBox.classList.remove('animate-bounce');
    
    messageBox.innerText = 'Ready to play!';
    messageBox.className = 'text-base sm:text-lg';
    hintBox.innerText = '';
    
    updateDisplay();
}

// End game (time's up)
function endGame() {
    gameOver = true;
    checkGuessButton.disabled = true;
    guessInput.disabled = true;
    
    displayMessage(`⏰ Game Over! The number was ${targetNumber}. ⏰`, 'error');
    displayHint('⏰ Time\'s up! ⏰');
    
    // Play end game sound
    audioPlayer.playEndGameSound();
}

// Update display
function updateDisplay() {
    scoreBox.innerText = score;
    updateTimer();
}

// Display message with type
function displayMessage(message, type = 'info') {
    messageBox.innerText = message;
    messageBox.className = 'text-base sm:text-lg';
    
    if (type === 'success') {
        messageBox.classList.add('text-green-400', 'font-semibold');
    } else if (type === 'error') {
        messageBox.classList.add('text-red-400', 'font-semibold');
    } else if (type === 'warn') {
        messageBox.classList.add('text-yellow-400', 'font-semibold');
    }
}

// Display hint
function displayHint(hintMessage) {
    hintBox.innerText = hintMessage;
}

// Update history display
function updateHistory() {
    const history = document.getElementById('history-scores');
    history.innerHTML = '';
    
    if (historyManager.history.length === 0) {
        const noHistory = document.createElement('p');
        noHistory.className = 'text-gray-400 text-sm text-center';
        noHistory.innerText = 'No games played yet';
        history.appendChild(noHistory);
        return;
    }
    
    historyManager.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-gray-700 border border-gray-600 rounded-lg p-3 mb-2 transition-all duration-200 hover:bg-gray-600 hover:transform hover:translate-x-1';
        
        const scoreSpan = document.createElement('div');
        scoreSpan.className = 'text-[#78b95f] font-bold';
        scoreSpan.innerText = `Score: ${item.score}`;
        
        const attemptsSpan = document.createElement('div');
        attemptsSpan.className = 'text-gray-300';
        attemptsSpan.innerText = `Attempts: ${item.attempts}`;
        
        const timerSpan = document.createElement('div');
        timerSpan.className = 'text-gray-400';
        timerSpan.innerText = `Time: ${item.timer}s`;
        
        div.appendChild(scoreSpan);
        div.appendChild(attemptsSpan);
        div.appendChild(timerSpan);
        history.appendChild(div);
    });
}

// Event listeners
checkGuessButton.addEventListener('click', checkGuess);

// Enter key support
guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkGuess();
    }
});

resetButton.addEventListener('click', resetGame);

applySettingsButton.addEventListener('click', () => {
    applySettingsButton.style.backgroundColor = '#6aa84f';
    setTimeout(() => {
        applySettingsButton.style.backgroundColor = '#78b95f';
    }, 200);
    resetGame();
});

// Background music controls
stopBgMusicButton.addEventListener('click', () => {
    backgroundMusicPlayer.stop();
});

toggleBgMusic.addEventListener('click', () => {
    backgroundMusicPlayer.playRandomTrack();
});

// Initialize background music
document.addEventListener('DOMContentLoaded', () => {
    // Try to start background music
    const playPromise = backgroundMusicPlayer.playRandomTrack();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log('Background music autoplay failed:', error);
        });
    }
    
    // Initialize game
    initGame();
    
    // Focus on input
    guessInput.focus();
});
