console.log("smp.js loaded");
export class SimpleMusicPlayer {
    constructor(audioElementId, playPauseButtonId, volumeControlId) {
        this.audioPlayer = document.getElementById(audioElementId);
        this.playPauseBtn = document.getElementById(playPauseButtonId);
        this.volumeControl = document.getElementById(volumeControlId);

        // Pause the audio on initialization
        this.audioPlayer.pause();

        this.updatePlayPauseButtonText();

        this.playPauseBtn.addEventListener("click", () => {
            if (this.audioPlayer.paused) {
                this.audioPlayer.play();
            } else {
                this.audioPlayer.pause();
            }
            this.updatePlayPauseButtonText();
        });

        this.volumeControl.addEventListener("input", () => {
            this.audioPlayer.volume = this.volumeControl.value;
        });
    }

    updatePlayPauseButtonText() {
        this.playPauseBtn.textContent = this.audioPlayer.paused ? 'Play' : 'Pause';
    }
}