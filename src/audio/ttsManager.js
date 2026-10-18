// Browser-native local Text-To-Speech (SpeechSynthesis)
class TTSManager {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.isSpeaking = false;
    this.turkishVoice = null;
    this.onStatusChange = null;

    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    // Prioritize Turkish voice if available
    this.turkishVoice = this.voices.find(v => v.lang.startsWith('tr') || v.lang.includes('TR')) || null;
  }

  speak(text, dinoType = 'chief') {
    if (!this.synth) return false;

    // Cancel any previous speech
    this.stop();

    if (!text || text.trim() === '') return false;

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.turkishVoice) {
      utterance.voice = this.turkishVoice;
      utterance.lang = 'tr-TR';
    } else {
      utterance.lang = 'tr-TR';
    }

    // Custom voice personality for each dinosaur
    switch (dinoType) {
      case 'chief':
        // Wise, deep, deliberate voice
        utterance.pitch = 0.72;
        utterance.rate = 0.88;
        break;
      case 'carpenter':
        // Energetic, robust builder voice
        utterance.pitch = 1.0;
        utterance.rate = 1.02;
        break;
      case 'tailor':
        // High, cheerful, expressive stylist voice
        utterance.pitch = 1.35;
        utterance.rate = 1.12;
        break;
      case 'miner':
        // Deep, gravelly miner voice
        utterance.pitch = 0.82;
        utterance.rate = 0.92;
        break;
      case 'curator':
        // Scholarly, enthusiastic, articulate professor voice
        utterance.pitch = 1.16;
        utterance.rate = 0.96;
        break;
      default:
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStatusChange) this.onStatusChange(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onStatusChange) this.onStatusChange(false);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (this.onStatusChange) this.onStatusChange(false);
    };

    this.synth.speak(utterance);
    return true;
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      if (this.onStatusChange) this.onStatusChange(false);
    }
  }
}

export const ttsManager = new TTSManager();
