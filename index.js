// Generate a randiom number between 1 and 10

const targetNumber = Math.floor(Math.random() * 10) + 1;

const guessInput =  document.getElementById('guessInput')
const submitButton = document.querySelector('button');
const messageBox = document.getElementById('message');
const hintBox = document.getElementById('hint-message');
const scoreBox = document.getElementById('score');

let attempts = 0;
// scoreBox.innerText = score;

let scoreState = createState(100);

// Display the initial score
scoreBox.innerText = scoreState.getValue();

function checkGuess() {
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
	} else 	if (playerGuess  < targetNumber){
		messageBox.id = 'message-error'
		displayMessage(`Wrong guess. Try again.`);
		displayHint('Hint~> Try a higher number.');

		  // Update the score with a callback to immediately reflect the change
  scoreState.setValue(scoreState.getValue() - 10, updatedScore => {
    // Display the updated score
    scoreBox.innerText = updatedScore;
  });
  
    } else if (playerGuess > targetNumber){
		messageBox.id = 'message-error'
		displayMessage(`Wrong guess. Try again.`);
        displayHint('hint~> Try a lower number.');

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
	messageBox.innerText = '';
	hintBox.innerText = '';
	scoreBox.innerText = '';
	// alert('Game reset. Try again!');
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