// Web Audio API Synthesizer - No external audio files needed!
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.bgmPlaying) {
      this.stopBGM();
    } else if (this.enabled && !this.bgmPlaying) {
      this.startBGM();
    }
    return this.enabled;
  }

  // Play a simple frequency tone
  playTone(freq, duration, type = 'sine', gainVal = 0.1, pitchDecay = 0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (pitchDecay !== 0) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, freq + pitchDecay), 
          this.ctx.currentTime + duration
        );
      }

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio error ignored
    }
  }

  // Sound effects
  playHitTree() {
    this.ensureContext();
    // Wood chop 'thwack'
    this.playTone(180, 0.12, 'triangle', 0.18, -60);
    this.playTone(90, 0.15, 'sine', 0.2, -40);
  }

  playHitRock() {
    this.ensureContext();
    // Rock strike 'clink/clank'
    this.playTone(520, 0.08, 'square', 0.08, 120);
    this.playTone(280, 0.14, 'triangle', 0.15, -80);
  }

  playHitDig() {
    this.ensureContext();
    // Soft earth shovel dig
    this.playTone(130, 0.15, 'sine', 0.18, -40);
    this.playTone(220, 0.08, 'triangle', 0.1, -100);
  }

  playDestroy() {
    this.ensureContext();
    // Cracking crunch
    this.playTone(320, 0.2, 'sawtooth', 0.15, -200);
    setTimeout(() => {
      this.playTone(480, 0.25, 'triangle', 0.18, -250);
    }, 40);
  }

  playCoin() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.28);
  }

  playItemPickup(type = 'wood') {
    this.ensureContext();
    if (type === 'coin') {
      this.playCoin();
      return;
    }
    const freq = type === 'gem' ? 1400 : (type === 'stone' ? 440 : 660);
    this.playTone(freq, 0.12, 'sine', 0.1, 150);
  }

  playUpgrade() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'triangle', 0.14);
      }, idx * 70);
    });
  }

  playBuyCostume() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.18, 'sine', 0.15);
      }, idx * 80);
    });
  }

  playQuestComplete() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.28, 'triangle', 0.18);
      }, idx * 90);
    });
  }

  playFootstep() {
    // Subtle low thud
    if (!this.enabled || !this.ctx) return;
    this.playTone(95 + Math.random() * 20, 0.05, 'sine', 0.04, -20);
  }

  playNpcTalk() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    // Cute animal crossing / Banjo style chirpy mumble
    const syllables = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < syllables; i++) {
      setTimeout(() => {
        const pitch = 380 + Math.random() * 260;
        this.playTone(pitch, 0.08, 'triangle', 0.12, (Math.random() - 0.5) * 60);
      }, i * 65);
    }
  }

  playDoor() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    // Wooden door latch and swing
    this.playTone(190, 0.12, 'triangle', 0.12, 40);
    setTimeout(() => {
      this.playTone(280, 0.18, 'sine', 0.14, -80);
    }, 60);
  }

  playChest() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    // Wooden chest lid click
    this.playTone(340, 0.08, 'triangle', 0.14, 120);
    setTimeout(() => {
      this.playTone(520, 0.12, 'sine', 0.12, 80);
    }, 45);
  }

  playSleep() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    // Gentle lullaby chime (G4, B4, D5, G5)
    const notes = [392.00, 493.88, 587.33, 783.99];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.45, 'sine', 0.12);
      }, idx * 110);
    });
  }

  playFireplaceWarm() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    // Crackling embers
    this.playTone(140, 0.08, 'sawtooth', 0.06, -30);
    setTimeout(() => {
      this.playTone(260, 0.06, 'triangle', 0.07, 40);
    }, 50);
  }

  // Cozy cheerful background tune (procedural gentle melody)
  startBGM() {
    if (this.bgmPlaying || !this.enabled) return;
    this.ensureContext();
    this.bgmPlaying = true;

    // Pentatonic scale notes for relaxing pleasant game music
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const bass = [130.81, 146.83, 164.81, 196.00];
    let step = 0;

    const tick = () => {
      if (!this.bgmPlaying || !this.enabled) return;
      try {
        // Melodic note
        if (Math.random() > 0.3) {
          const note = scale[Math.floor(Math.random() * scale.length)];
          this.playTone(note, 0.35, 'sine', 0.025);
        }
        // Bass groove every 4 steps
        if (step % 4 === 0) {
          const bNote = bass[Math.floor((step / 4) % bass.length)];
          this.playTone(bNote, 0.6, 'triangle', 0.035);
        }
        step++;
      } catch (e) {}

      this.bgmTimer = setTimeout(tick, 320);
    };

    tick();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
