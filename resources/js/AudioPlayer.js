// AudioPlayer.js

class AudioPlayer {
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
        
        // Set initial volume
        this.setVolume(0.1);
        
        // Preload audio files
        this.preloadAudio();
    }

    setVolume(volume) {
        const vol = Math.max(0, Math.min(1, volume));
        this.correctSound.volume = vol;
        this.wrongSound.volume = vol;
        this.clickSound.volume = vol;
        this.tickSound.volume = vol;
        this.endGameSound.volume = vol;
    }

    preloadAudio() {
        // Preload all audio files
        const audioFiles = [
            this.correctSound,
            this.wrongSound,
            this.clickSound,
            this.tickSound,
            this.endGameSound
        ];

        audioFiles.forEach(audio => {
            audio.load();
            audio.volume = 0.1; // Set default volume
        });
    }

    async playAudio(audioElement) {
        try {
            audioElement.currentTime = 0; // Reset to beginning
            await audioElement.play();
        } catch (error) {
            console.log('Audio playback failed:', error);
        }
    }

    playCorrectSound() {
        this.playAudio(this.correctSound);
    }

    playWrongSound() {
        this.playAudio(this.wrongSound);
    }

    playClickSound() {
        this.playAudio(this.clickSound);
    }

    playTickSound() {
        this.playAudio(this.tickSound);
    }
    
    playEndGameSound() {
        this.playAudio(this.endGameSound);
    }
}

// BackgroundMusicPlayer class
class BackgroundMusicPlayer {
    constructor(tracks) {
        this.tracks = tracks;
        this.currentTrack = null;
        this.audioElement = new Audio();
        this.isPlaying = false;
        this.currentVolume = 0.1;
        
        // Set up audio element
        this.audioElement.loop = true;
        this.audioElement.volume = this.currentVolume;
        
        // Handle audio events
        this.setupAudioEvents();
    }

    setVolume(volume) {
        this.currentVolume = Math.max(0, Math.min(1, volume));
        this.audioElement.volume = this.currentVolume;
    }

    setupAudioEvents() {
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
        });

        this.audioElement.addEventListener('error', (e) => {
            console.log('Audio error:', e);
            this.isPlaying = false;
        });
    }

    async playRandomTrack() {
        try {
            // Stop current track if playing
            if (this.isPlaying) {
                this.stop();
            }

            // Select random track
            const randomIndex = Math.floor(Math.random() * this.tracks.length);
            const randomTrack = this.tracks[randomIndex];

            // Avoid playing the same track twice in a row
            if (this.currentTrack === randomTrack && this.tracks.length > 1) {
                return this.playRandomTrack();
            }

            this.currentTrack = randomTrack;
            this.audioElement.src = this.currentTrack;
            this.audioElement.volume = this.currentVolume;

            // Play the track
            await this.audioElement.play();
            this.isPlaying = true;

        } catch (error) {
            console.log('Failed to play background music:', error);
            this.isPlaying = false;
        }
    }

    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
    }

    pause() {
        this.audioElement.pause();
        this.isPlaying = false;
    }

    resume() {
        if (this.currentTrack && !this.isPlaying) {
            this.audioElement.play().then(() => {
                this.isPlaying = true;
            }).catch(error => {
                console.log('Failed to resume audio:', error);
            });
        }
    }
}

// Create and export instances
export const audioPlayer = new AudioPlayer(
    './resources/audio/success-sound.mp3',
    './resources/audio/wrong.mp3',
    './resources/audio/click.mp3',
    './resources/audio/tick_time_sound.mp3',
    './resources/audio/tick_time_sound.mp3'
);

export const backgroundMusicPlayer = new BackgroundMusicPlayer([
    './resources/audio/lady-of-the-80.mp3',
    './resources/audio/digital-love.mp3',
    './resources/audio/a-hero-of-the-80.mp3',
    './resources/audio/stranger-things.mp3'
]);
