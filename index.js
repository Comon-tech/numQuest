// Generate a randiom number between 1 and 10

const targetNumber = Math.floor(Math.random() * 10) + 1;

const guessInput =  document.getElementById('guessInput')
const submitButton = document.querySelector('button');
const messageBox = document.getElementById('message');

let attempts = 0;

function checkGuess() {
// plyer's guess
const playerGuess = guessInput.value;

	//increment the attemots 
	attempts ++;

	//check if the guess is correct
	if (playerGuess == targetNumber) {
		displayMessage(`Congratulations! You guessed the number ${targetNumber} in ${attempts} attempts.`);
		disableInput();
	} else {
		displayMessage(`Wrong guess. Try again.`);
		guessInput.value = ''
	};
};

function displayMessage	(message) {
	messageBox.innerText = message;
};

function disableInput() {
    document.getElementById('guessInput').disabled = true;
    submitButton.disabled = true;
}

