

	// Generate a randiom number between 1 and 10
const targetNumber = Math.floor(Math.random() * 10) + 1;
const guessInput =  document.getElementById('guessInput')
const submitButton = document.querySelector('button');
const messageBox = document.getElementById('message');
const hintBox = document.getElementById('hint-message');
const scoreBox = document.getElementById('score');
const backgroundMusicContainer = document.getElementById('backgroundMusic')
// const timeBox = document.getElementById('time');

// Audio elements
const correctSound = new Audio('audioTracks/success-sound.mp3'); // Replace 'correct.mp3' with your sound file
const wrongSound = new Audio('audioTracks/wrong.mp3'); // Replace 'wrong.mp3' with your sound file
const clickSound = new Audio('audioTracks/click.mp3'); // Replace 'wrong.mp3' with your sound file

function playCorrectSound() {
  correctSound.play();
}
function playClickSound() {
	clickSound.play();
  }
  
function playWrongSound() {
  wrongSound.play();
}




let attempts = 0;
// scoreBox.innerText = score;

let scoreState = createState(100);

// Display the initial score
scoreBox.innerText = scoreState.getValue();



function checkGuess() {
	playClickSound()
// plyer's guess
const playerGuess = guessInput.value;

	//increment the attemots 
	attempts ++;

	//check if the guess is correct
	if (playerGuess == targetNumber) {
		messageBox.id = 'message-success'
		displayMessage(`Congratulations! You guessed the number ${targetNumber} in ${attempts} attempts.`);
        displayHint('YAAAY!!');
		disableInput();
		awardPoints()
		playCorrectSound()

	} else 	if (playerGuess  < targetNumber){
		messageBox.id = 'message-error'
		displayMessage(`Wrong guess. Try again.`);
		displayHint('Hint~> Try a higher number.');
		wrongSound.play()

		  // Update the score with a callback to immediately reflect the change
  scoreState.setValue(scoreState.getValue() - 10, updatedScore => {
    // Display the updated score
    scoreBox.innerText = updatedScore;
  });
  
    } else if (playerGuess > targetNumber){
		messageBox.id = 'message-error'
		displayMessage(`Wrong guess. Try again.`);
        displayHint('hint~> Try a lower number.');
		wrongSound.play()

		  // Update the score with a callback to immediately reflect the change
  scoreState.setValue(scoreState.getValue() - 10, updatedScore => {
    // Display the updated score
    scoreBox.innerText = updatedScore;
  });
  
	}else{
		guessInput.value = ''
	};

};

function resetGame() {
	// Reset the game by setting all values back to their defaults
	attempts = 0;
	score = 100;
	// targetNumber = Math.floor(Math.random() * 10) + 1;
	guessInput.value = '';
	guessInput.disabled = false;
	submitButton.disabled = false;
	// messageBox.innerText = '';
	hintBox.innerText = '';
	scoreBox.innerText = score;
	// alert('Game reset. Try again!');
}

function endGame() {
	// Display a message indicating the end of the game

	displayMessage(`Game over! You didn't guess the number in time. Your final score is ${score}.`);
	disableInput();
  }

function displayMessage	(message) {
	messageBox.innerText = message;
};

function disableInput() {
    guessInput.disabled = true;
    submitButton.disabled = true;
};

function displayHint(hintMessage){
		hintBox.id = 'message-warn'
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


  //background music

// Audio elements for background music
const backgroundTracks = ['audioTracks/lady-of-the-80.mp3', 'audioTracks/digital-love.mp3', 'audioTracks/a-hero-of-the-80.mp3', 'audioTracks/stranger-things.mp3']; // Add paths to your audio files
let currentBackgroundTrack;

function playRandomBackgroundTrack() {
  // Select a random track from the array
  const randomIndex = Math.floor(Math.random() * backgroundTracks.length);
  const randomTrack = backgroundTracks[randomIndex];

  // Ensure that the selected track is different from the current one
  if (currentBackgroundTrack !== randomTrack) {
    // Update the current background track
    currentBackgroundTrack = randomTrack;

    // Set the new track and play it
    backgroundMusicContainer.src = currentBackgroundTrack;
    backgroundMusicContainer.play();
  } else {
    // If the selected track is the same as the current one, recursively call the function again
    playRandomBackgroundTrack();
  }
}

// Call the function to play a random background track when the page loads
playRandomBackgroundTrack();
