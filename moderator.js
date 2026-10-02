/**
 * MODERATOR.JS - Vampir Köylü (Sapanca Edition)
 * Sesler tamamen devre dışı bırakılmıştır (Kullanıcı talebi: Tamamen sessiz & sade deneyim).
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
  }

  init() {}
  toggleMute() { return true; }
  playHeartbeat() {}
  startHeartbeat() {}
  stopHeartbeat() {}
  playGong() {}
  playDawn() {}
  playCardSting() {}
  playTick() {}
}

class VoiceNarrator {
  constructor() {
    this.speechAvailable = false;
    this.turkishVoice = null;
    this.subtitleTimer = null;
    this.isMuted = true;
  }

  initVoices() {}
  detectTurkishVoice() { return null; }
  showSubtitle(text) {}
  speak(text, priority = false) {}
  stop() {}
}

class HapticMotor {
  static vibrate(pattern = [200]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  static wakeUpRole() {
    this.vibrate([200, 100, 200]);
  }

  static confirmAction() {
    this.vibrate([60]);
  }

  static deathAlert() {
    this.vibrate([300, 100, 300]);
  }
}

window.soundEngine = new SoundEngine();
window.voiceNarrator = new VoiceNarrator();
window.HapticMotor = HapticMotor;
