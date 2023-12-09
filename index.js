// Generate a randiom number between 1 and 10

const targetNumber = Math.floor(Math.random() * 10) + 1;

const guessInput =  document.getElementById('guessInput')
const submitButton = document.querySelector('button');
const messageBox = document.getElementById('message');
const hintBox = document.getElementById('hint-message');


let attempts = 0;

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
    } else if (playerGuess > targetNumber){
		messageBox.id = 'message-error'
		displayMessage(`Wrong guess. Try again.`);
        displayHint('hint~> Try a lower number.');
	}else{
		guessInput.value = ''
	};
};

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

