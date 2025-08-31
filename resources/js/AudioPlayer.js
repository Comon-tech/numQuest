// AudioPlayer.js

export class AudioPlayer {
    constructor(
        correctSoundSrc,
        wrongSoundSrc,
        clickSoundSrc,
        tickSoundSrc,
        endGameSoundSrc
    ) {
        this.correctSound = new Audio(correctSoundSrc);
        this.wrongSound = new Audio(wrongSoundSrc);
        this.clickSound = new Audio(clickSoundSrc);
        this.tickSound = new Audio(tickSoundSrc);
        this.endGameSound = new Audio(endGameSoundSrc);
    }

    playCorrectSound() {
        this.correctSound.play();
    }

    playWrongSound() {
        this.wrongSound.play();
    }

    playClickSound() {
        this.clickSound.play();
    }

    playTickSound() {
        this.tickSound.play();
    }

    playEndGameSound() {
        this.endGameSound.play();
    }
}

export class BackgroundMusicPlayer {
    constructor() {
        this.audioElement = document.getElementById('backgroundMusic');
        this.isPlaying = false;
        this.currentVolume = 0.1;
        this.audioElement.volume = this.currentVolume;
        this.setupAudioEvents();
    }

    setupAudioEvents() {
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
        });

        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.isPlaying = false;
        });
    }

    playRandomTrack() {
        const tracks = [
            'resources/audio/a-hero-of-the-80.mp3',
            'resources/audio/lady-of-the-80.mp3',
            'resources/audio/stranger-things.mp3',
            'resources/audio/digital-love.mp3'
        ];

        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        
        // Stop current track if playing
        if (this.isPlaying) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }

        this.audioElement.src = randomTrack;
        this.audioElement.play().then(() => {
            this.isPlaying = true;
        }).catch(error => {
            console.error('Failed to play audio:', error);
            this.isPlaying = false;
        });
    }

    pause() {
        this.audioElement.pause();
        this.isPlaying = false;
    }

    resume() {
        this.audioElement.play().then(() => {
            this.isPlaying = true;
        }).catch(error => {
            console.error('Failed to resume audio:', error);
        });
    }

    setVolume(volume) {
        this.currentVolume = volume;
        this.audioElement.volume = volume;
    }

    getVolume() {
        return this.currentVolume;
    }
}
