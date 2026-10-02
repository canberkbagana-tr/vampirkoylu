/**
 * MODERATOR.JS - Vampir Köylü (Sapanca Edition)
 * Sesli Anlatıcı (Web Speech API), Ses Efektleri (Web Audio API) ve Haptik Motoru (Vibration API)
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.ambientOsc = null;
    this.heartbeatInterval = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopHeartbeat();
    }
    return this.isMuted;
  }

  // Kalp atışı efekti (Tansiyon anları)
  playHeartbeat() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    // İkinci küçük vuruş (lub-dub)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(48, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(25, now + 0.28);

    gain2.gain.setValueAtTime(0.4, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(now + 0.18);
    osc2.stop(now + 0.32);
  }

  startHeartbeat(speedMs = 1200) {
    this.stopHeartbeat();
    this.playHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.playHeartbeat();
    }, speedMs);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Kilise Çanı / Mezar Gongu (Ölüm ve Gece Başlangıcı)
  playGong() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;

    const freqs = [180, 276, 390, 540];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  // Güneş Doğuşu / Sabah Uyanış Melodisi
  playDawn() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [330, 392, 440, 523, 659]; // E4, G4, A4, C5, E5

    notes.forEach((freq, i) => {
      const noteTime = now + (i * 0.18);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.85);
    });
  }

  // Gerilim Sesi / Kart Açılışı
  playCardSting() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Oylama Son 5 Saniye Tık Sesi
  playTick() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

class VoiceNarrator {
  constructor() {
    this.speechAvailable = 'speechSynthesis' in window;
    this.turkishVoice = null;
    this.subtitleTimer = null;
    this.isMuted = false;
    this.initVoices();
  }

  initVoices() {
    if (!this.speechAvailable) return;

    const findAndSet = () => {
      this.turkishVoice = this.detectTurkishVoice();
    };

    findAndSet();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findAndSet;
    }
  }

  detectTurkishVoice() {
    if (!this.speechAvailable) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    // 1. Dil kodu 'tr' veya 'tr-TR' olan sesler
    let voice = voices.find(v => {
      const l = (v.lang || '').toLowerCase().replace('_', '-');
      return l === 'tr-tr' || l === 'tr' || l.startsWith('tr-');
    });

    // 2. İsim bazlı arama (Google Türkçe, Microsoft Tolga/Yelda, Apple Cem/Yelda vb.)
    if (!voice) {
      voice = voices.find(v => {
        const n = (v.name || '').toLowerCase();
        return n.includes('turkish') || n.includes('türkçe') || n.includes('turkey') ||
               n.includes('tolga') || n.includes('yelda') || n.includes('filiz') || n.includes('cem');
      });
    }

    return voice || null;
  }

  showSubtitle(text) {
    const banner = document.getElementById('narrator-banner');
    const textEl = document.getElementById('narrator-text');
    if (!banner || !textEl) return;

    textEl.textContent = text;
    banner.classList.remove('hidden');

    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    const duration = Math.max(5000, text.length * 85);
    this.subtitleTimer = setTimeout(() => {
      banner.classList.add('hidden');
    }, duration);
  }

  speak(text, priority = false) {
    if (!text) return;

    // Her durumda ekranda görsel gotik moderatör altyazısı göster
    this.showSubtitle(text);

    if (!this.speechAvailable || this.isMuted) return;

    // Mobil gecikmeli yüklemeler için sesi tekrar tara
    if (!this.turkishVoice) {
      this.turkishVoice = this.detectTurkishVoice();
    }

    // KRİTİK ÇÖZÜM:
    // Eğer cihazda kesinlikle Türkçe ses motoru yoksa (örneğin İngilizce sistemler):
    // Asla varsayılan İngilizce motorla Türkçe okutma! Çünkü İngilizce motor Türkçeyi Latince gibi bozuk okur.
    // Bunun yerine altyazı gösterilir ve atmosferik çan/müzik sesleri çalınır.
    if (!this.turkishVoice) {
      console.warn("Türkçe TTS motoru bulunamadı. Latince benzeri bozuk telaffuzu önlemek için sesli okuma atlandı, gotik altyazı sunuldu.");
      return;
    }

    try {
      if (priority) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.turkishVoice;
      utterance.lang = this.turkishVoice.lang || 'tr-TR';
      utterance.rate = 0.95;
      utterance.pitch = 0.95;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Ses sentezleme hatası:", e);
    }
  }

  stop() {
    if (this.speechAvailable) {
      window.speechSynthesis.cancel();
    }
  }
}

class HapticMotor {
  static vibrate(pattern = [200]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Tarayıcı izin vermeyebilir, sessizce geç
      }
    }
  }

  // Rol uyandırma titreşimi: İki kısa güçlü vuruş (Kullanıcı kafasını kaldırmadan uyanır)
  static wakeUpRole() {
    this.vibrate([250, 100, 250]);
  }

  // Oy verildi / Aksiyon alındı titreşimi
  static confirmAction() {
    this.vibrate([70]);
  }

  // Tehlike / Ölüm titreşimi
  static deathAlert() {
    this.vibrate([400, 150, 400]);
  }
}

window.soundEngine = new SoundEngine();
window.voiceNarrator = new VoiceNarrator();
window.HapticMotor = HapticMotor;
