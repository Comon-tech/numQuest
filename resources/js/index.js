//main js file
import { audioPlayer, backgroundMusicPlayer } from './AudioPlayer.js'

// Generate a randiom number between 1 and 10
//let targetNumber = Math.floor(Math.random() * 10) + 1;
const guessInput = document.getElementById('guessInput');
const checkGuessButton = document.getElementById('checkGuess');
const submitButton = document.querySelectorAll('button')[1];
const messageBox = document.getElementById('message');
const timerElement = document.getElementById('time');
const resetButton = document.getElementById('reset');
const hintBox = document.getElementById('hint-message');
const scoreBox = document.getElementById('score');
const backgroundMusicContainer = document.getElementById('backgroundMusic');
const settingsToggle = document.getElementById('settings-toggle');
const settingsContainer = document.getElementById('settings');
const range1 = document.getElementById('range_');
const range2 = document.getElementById('range');
const applySettingsButton = document.getElementById('savesettings');
const toggleBgMusic = document.getElementById('toggleBgMusic');
const stopBgMusicButton = document.getElementById('stopBgMusic');
// const timeBox = document.getElementById('time');

function regenerateVar() {
    // Generate the random number based on the range selected by the user
    const min = parseInt(range1.value);
    const max = parseInt(range2.value);

    // If range1 is equal to range2, alert the user and exit the function
    if (min === max) {
      alert('The range values cannot be same.');
      return;
    }
    // If any of the values are empty or invalid, alert the user and exit the function
    if (isNaN(min) || isNaN(max)) {
      alert('Please enter valid values for the range.');
      return;
    }
    // If range2 is less than range1, swap the values
    if (max < min) {
      alert('Range1 is less than Range2. Swapping the values.');
      range1.value = max;
      range2.value = min;
    }

    //update the message box
    messageBox.innerText = `Guess a number between ${min} and ${max}`;
    guessInput.style.width = guessInput.offsetWidth + 'px';
    // guessInput minimum and maximum values
    guessInput.min = min;
    guessInput.max = max;
    
    // Generate a random number between the two values
    targetNumber = Math.floor(Math.random() * (max - min + 1)) + min;
}

// Add these variables at the beginning of your JavaScript code

let timerSeconds = 60; // Set the initial time in seconds
let game_over = false;

// Add this function to update the timer
function updateTimer() {
  timerElement.innerText = timerSeconds + 's';
}

// Add this function to decrement the timer
async function decrementTimer() {
  // If the game is over, don't decrement the timer
  if (game_over) {
    return;
  }
  
  if (attempts > 0) { // Check if the game has started
    timerSeconds--;
    
    // Check if time is up
    if (timerSeconds <= 0) {
      endGame(); // Call the endGame function when the time is up
    } else {
      // Update the timer and set it to decrement every second
      updateTimer();
      setTimeout(decrementTimer, 1000);
    }
    
    // Play the tick sound when the timer is decremented
     audioPlayer.playTickSound();
  }
}

// Add this line at the end of the 'resetGame' function to reset the timer
timerSeconds = 60;

function generateRandomNumber() {
  return Math.floor(Math.random() * 10) + 1;
}
let targetNumber;

let attempts = 0;
// scoreBox.innerText = score;

let scoreState = createState(100);

// Display the initial score
scoreBox.innerText = scoreState.getValue();

function checkGuess() {
  
  guessInput.style.width = guessInput.offsetWidth + 'px';

  audioPlayer.playClickSound();
  // plyer's guess
  const playerGuess = guessInput.value;

  //increment the attemots 
  attempts++;

  if (attempts === 1) {
    decrementTimer(); // Start the timer on the first guess
    targetNumber = generateRandomNumber(); // Generate a random number at the start of the game
    console.log(targetNumber);
  }

  //check if the guess is correct
  if (playerGuess == targetNumber) {
    messageBox.id = 'message-success';
	game_over = true;
    displayHint('YAAAY!!');
    disableInput();
    awardPoints();
    audioPlayer.playCorrectSound();
	displayMessage(`Congratulations! You guessed the number ${targetNumber} in ${attempts} attempts.\nYou scored ${scoreState.getValue()} points and you spent ${60 - timerSeconds} seconds.`);

  } else if (playerGuess < targetNumber) {
    messageBox.id = 'message-error';
    displayMessage(`Wrong guess. Try again.`);
    displayHint('Hint~> Try a higher number.');
    audioPlayer.playWrongSound();

    // Update the score with a callback to immediately reflect the change
    scoreState.setValue(scoreState.getValue() - 10, updatedScore => {
      // Display the updated score
      audioPlayer.playWrongSound();
    });

  } else if (playerGuess > targetNumber) {
    messageBox.id = 'message-error';
    displayMessage(`Wrong guess. Try again.`);
    displayHint('hint~> Try a lower number.');
    audioPlayer.playWrongSound();

    // Update the score with a callback to immediately reflect the change
    scoreState.setValue(scoreState.getValue() - 10, updatedScore => {
      // Display the updated score
      scoreBox.innerText = updatedScore;
    });

  } else {
    guessInput.value = '';
  }

};

checkGuessButton.addEventListener('click', ()=>{checkGuess()});

function resetGame() {
  // Reset the game by setting all values back to their defaults
  regenerateVar();
  attempts = 0;
  timerSeconds = 60;
  let score = 100;
  // targetNumber = Math.floor(Math.random() * 10) + 1;
  guessInput.value = '';
  guessInput.disabled = false;
  submitButton.disabled = false;
  game_over = false;
  messageBox.innerText = 'Guess a number between 1 and 10';
  messageBox.id = 'message';
  timerElement.innerText = timerSeconds + 's';
  hintBox.innerText = '';
  scoreBox.innerText = score;
  // alert('Game reset. Try again!');
}
resetButton.addEventListener('click', resetGame);

function endGame() {
  // Display a message indicating the end of the game
  displayMessage(`Game over! You didn't guess the number in time. The number was ${targetNumber}.`);
  disableInput();
  game_over = true;

  // Play the tick sound when the game ends
  audioPlayer.playEndGameSound();
}

function displayMessage(message) {
  messageBox.innerText = message;
};

function disableInput() {
  guessInput.disabled = true;
  submitButton.disabled = true;
};

function displayHint(hintMessage) {
  hintBox.id = 'message-warn';
  hintBox.innerText = hintMessage;
};

// Function to create a state object
function createState(initialValue) {
  let value = initialValue;


  function getValue() {
    return value;
  }

  function setValue(newValue, callback) {
    value = newValue;
    if (typeof callback === 'function') {
      callback(value);
    }
    return value;
  }

  return { getValue, setValue };
}

function awardPoints() {
  // You can increase the points for faster correct guesses or other criteria
  const pointsAwarded = 20; // Adjust this value as needed
  scoreState.setValue(scoreState.getValue() + pointsAwarded, updatedScore => {
    // Display the updated score
    scoreBox.innerText = updatedScore;

  });
}

function toggleSettings() {
  // Toggle the visibility of the settings container
  settingsContainer.classList.toggle('hidden');
}
// Call the toggleSettings function when the settings toggle is clicked
settingsToggle.addEventListener('click', toggleSettings);

applySettingsButton.addEventListener('click', () => {
  applySettingsButton.style.backgroundColor = '#7bd87e';
  // wait 1 second and then set the background color back to the default
  setTimeout(() => {
    applySettingsButton.style.backgroundColor = '#4caf50';
  }, 1000);
  resetGame();
  regenerateVar();
});


  // Pause the background music
  stopBgMusicButton.addEventListener('click', () => {
    backgroundMusicPlayer.stop();
  });


  
window.addEventListener('load', () => {
  // Play a random background track when the page loads
  // backgroundMusicPlayer.playRandomTrack();

  toggleBgMusic.addEventListener('click', () => {
    backgroundMusicPlayer.playRandomTrack();
  });
  
});
