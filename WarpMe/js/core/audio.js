/**
 * Audio System using Web Audio API
 * Generates procedural sci-fi sounds
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.muted = localStorage.getItem('warpme_muted') === 'true';
        this.initialized = false;
    }

    // Must be called after user interaction
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.muted ? 0 : 0.5;
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    // Ensure audio context is running (browsers suspend it)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Play a tone with envelope
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.initialized || this.muted) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Play a frequency sweep
    playSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.3) {
        if (!this.initialized || this.muted) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = startFreq;

        const now = this.audioContext.currentTime;
        osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Create noise for explosions
    createNoise(duration, volume = 0.3) {
        if (!this.initialized || this.muted) return;
        this.resume();

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + duration);
    }

    // === Sound Effects ===

    // UI button click
    playClick() {
        this.playTone(1200, 0.05, 'sine', 0.2);
    }

    // Scan ping
    playScan() {
        this.playSweep(800, 2000, 0.3, 'sine', 0.2);
        setTimeout(() => this.playSweep(2000, 800, 0.3, 'sine', 0.15), 300);
    }

    // Phaser fire
    playPhaser() {
        this.playSweep(400, 800, 0.15, 'sawtooth', 0.3);
        this.playSweep(600, 1000, 0.15, 'sawtooth', 0.2);
    }

    // Torpedo launch
    playTorpedo() {
        this.playSweep(150, 80, 0.2, 'square', 0.3);
        this.playTone(200, 0.1, 'sine', 0.2);
    }

    // Explosion
    playExplosion() {
        this.createNoise(0.5, 0.4);
        this.playSweep(200, 50, 0.3, 'square', 0.3);
    }

    // Shield hit
    playShieldHit() {
        this.playSweep(300, 600, 0.1, 'sine', 0.3);
        this.playSweep(600, 300, 0.1, 'sine', 0.2);
    }

    // Hull hit
    playHullHit() {
        this.createNoise(0.15, 0.3);
        this.playTone(100, 0.2, 'square', 0.3);
    }

    // Incoming hail
    playHail() {
        const notes = [523, 659, 784]; // C, E, G
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.2), i * 150);
        });
    }

    // Alert sounds
    playYellowAlert() {
        this.playTone(440, 0.3, 'square', 0.2);
        setTimeout(() => this.playTone(440, 0.3, 'square', 0.2), 500);
    }

    playRedAlert() {
        const playAlertTone = () => {
            this.playSweep(400, 600, 0.5, 'sawtooth', 0.3);
            this.playSweep(600, 400, 0.5, 'sawtooth', 0.3);
        };
        playAlertTone();
    }

    // Warp engine
    playWarp() {
        this.playSweep(100, 2000, 1.5, 'sine', 0.3);
        setTimeout(() => this.createNoise(0.3, 0.2), 200);
    }

    // System beep
    playBeep() {
        this.playTone(880, 0.1, 'sine', 0.15);
    }

    // Error beep
    playError() {
        this.playTone(200, 0.15, 'square', 0.2);
        setTimeout(() => this.playTone(150, 0.15, 'square', 0.2), 150);
    }

    // Repair complete
    playRepairComplete() {
        const notes = [392, 494, 588, 784]; // G, B, D, G
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 100);
        });
    }

    // Target lock
    playTargetLock() {
        this.playTone(600, 0.05, 'square', 0.2);
        setTimeout(() => this.playTone(800, 0.05, 'square', 0.2), 80);
        setTimeout(() => this.playTone(1000, 0.1, 'square', 0.25), 160);
    }

    // Toggle mute
    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('warpme_muted', this.muted.toString());
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 0.5;
        }
        
        return this.muted;
    }

    // Set volume (0-1)
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : Math.max(0, Math.min(1, value));
        }
    }

    isMuted() {
        return this.muted;
    }
}

// Singleton instance
export const audio = new AudioManager();
