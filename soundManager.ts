// Web Audio API Complete Dynamic Sound & Music Engine for DOUR Party Game
// Includes dynamic sound variation, non-repetitive chimes, organic clock ticks, and ambient background music

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isHapticsEnabled: boolean = true;
  
  // Background music state
  private currentBgmMode: 'none' | 'menu' | 'game' = 'none';
  private lastBgmMode: 'none' | 'menu' | 'game' = 'menu';
  private bgmTimeout: number | null = null;
  private bgmStep: number = 0;
  private bgmDucked: boolean = false;
  private bgmVolumeMultiplier: number = 1.0;

  // Speech synthesis and Web Audio TTS state
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;
  private activeBufferSource: AudioBufferSourceNode | null = null;
  private ttsBufferCache: Map<string, AudioBuffer> = new Map();
  private ttsRawCache: Map<string, ArrayBuffer> = new Map();
  private ttsSpeakSeq: number = 0;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  // Tracking last played variant to ensure consecutive sounds are never identical
  private lastCorrectVariant: number = -1;
  private lastSwapVariant: number = -1;
  private tickToggle: boolean = false;

  private hapticListeners: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    try {
      if (typeof window !== 'undefined') {
        const savedMute = localStorage.getItem('dor_sound_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
        const savedHaptics = localStorage.getItem('dor_haptics_enabled');
        if (savedHaptics !== null) {
          this.isHapticsEnabled = savedHaptics === 'true';
        }
      }
    } catch {}
    this.initAutoUnlock();
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    } catch (e) {
      // safe fallback
    }
  }

  private initAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.getAudioContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      // Note: We do NOT auto-start BGM on arbitrary screen touch so users can focus on speech & pronunciation without distraction.
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private muteListeners: Set<(muted: boolean) => void> = new Set();

  public addMuteListener(fn: (muted: boolean) => void): () => void {
    this.muteListeners.add(fn);
    return () => this.muteListeners.delete(fn);
  }

  private notifyMuteListeners(muted: boolean) {
    this.muteListeners.forEach(fn => {
      try { fn(muted); } catch {}
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('dor_sound_muted', muted ? 'true' : 'false');
    } catch {}

    if (muted) {
      if (this.currentBgmMode !== 'none') {
        this.lastBgmMode = this.currentBgmMode;
      }
      this.stopBGM();
    } else {
      // Restore background music when unmuting - ensure AudioContext is active
      const ctx = this.getAudioContext();
      const resumeBgm = () => {
        if (this.isMuted) return;
        if (this.lastBgmMode === 'game') {
          this.startGameplayBGM(60);
        } else {
          this.lastBgmMode = 'menu';
          this.startMenuBGM();
        }
      };

      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(resumeBgm).catch(resumeBgm);
        } else {
          resumeBgm();
        }
      } else {
        resumeBgm();
      }
    }

    this.notifyMuteListeners(muted);
  }

  public addHapticListener(fn: (enabled: boolean) => void): () => void {
    this.hapticListeners.add(fn);
    return () => this.hapticListeners.delete(fn);
  }

  private notifyHapticListeners(enabled: boolean) {
    this.hapticListeners.forEach(fn => {
      try { fn(enabled); } catch {}
    });
  }

  public isHaptics(): boolean {
    return this.isHapticsEnabled;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.isHapticsEnabled = enabled;
    try {
      localStorage.setItem('dor_haptics_enabled', enabled ? 'true' : 'false');
    } catch {}
    this.notifyHapticListeners(enabled);
    if (enabled) {
      this.hapticFeedback('light');
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.setMuted(!enabled);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMute(muted: boolean) {
    this.setMuted(muted);
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted;
  }

  public stopMenuBGM() {
    if (this.currentBgmMode === 'menu') {
      this.stopBGM();
    }
  }

  public setBgmDucking(ducked: boolean) {
    this.bgmDucked = ducked;
    // Lower background music to a soft ambient volume during gameplay (approx 35-40%)
    this.bgmVolumeMultiplier = ducked ? 0.35 : 1.0;
  }

  public isBgmDucked(): boolean {
    return this.bgmDucked;
  }

  public playWinner() {
    this.playVictory();
  }

  public playCountdownBeep(secondsRemaining: number) {
    this.playUrgentTick(secondsRemaining);
  }

  public playBuzzer() {
    this.playElimination();
  }

  public playError() {
    this.playElimination();
  }

  public playPowerUp() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        gain.gain.setValueAtTime(0.18, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.15);
      });
    } catch (e) {}
  }

  // --- DYNAMIC NON-REPETITIVE SOUND EFFECTS ---

  // 1. UI Click with subtle random micro-pitch variation (tactile, organic click)
  public playClick() {
    this.hapticFeedback('light');
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Slight pitch variation +/- 8% to avoid robotic repetition
      const baseFreq = 540 + (Math.random() * 80 - 40);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.035);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // 2. Toggle / Tab switch / Select with harmonic variation
  public playToggle() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // 3 variations of cheerful toggle intervals
      const pairs = [
        [587.33, 880.00], // D5 -> A5
        [659.25, 987.77], // E5 -> B5
        [523.25, 783.99], // C5 -> G5
      ];
      const selected = pairs[Math.floor(Math.random() * pairs.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(selected[0], now);
      osc.frequency.setValueAtTime(selected[1], now + 0.03);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch (e) {}
  }

  // 3. Start Game Fanfare
  public playStartGame() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.20, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.22);
      });
    } catch (e) {}
  }

  // 4. Correct Guess Chime - 6 distinct melodic variations to avoid repetitive fatigue!
  public playCorrect() {
    this.hapticFeedback('success');
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // 6 distinct pleasant ascending melodic patterns
      const chimeVariants: Array<Array<{ f: number; d: number }>> = [
        // Variant 0: High Major Arpeggio (C5-E5-G5-C6)
        [
          { f: 523.25, d: 0.04 },
          { f: 659.25, d: 0.04 },
          { f: 783.99, d: 0.04 },
          { f: 1046.50, d: 0.16 }
        ],
        // Variant 1: Pentatonic Sparkle (F5-A5-C6-E6)
        [
          { f: 698.46, d: 0.035 },
          { f: 880.00, d: 0.035 },
          { f: 1046.50, d: 0.04 },
          { f: 1318.51, d: 0.18 }
        ],
        // Variant 2: Warm Kalimba Triad (G4-D5-G5-B5)
        [
          { f: 392.00, d: 0.04 },
          { f: 587.33, d: 0.04 },
          { f: 783.99, d: 0.05 },
          { f: 987.77, d: 0.16 }
        ],
        // Variant 3: Double Bounce Chord (E5-G5-A5-D6)
        [
          { f: 659.25, d: 0.03 },
          { f: 783.99, d: 0.03 },
          { f: 880.00, d: 0.04 },
          { f: 1174.66, d: 0.18 }
        ],
        // Variant 4: Glissando Cascade (D5-F#5-A5-C#6)
        [
          { f: 587.33, d: 0.035 },
          { f: 739.99, d: 0.035 },
          { f: 880.00, d: 0.04 },
          { f: 1108.73, d: 0.17 }
        ],
        // Variant 5: Golden Fanfare (A4-C#5-E5-A5-E6)
        [
          { f: 440.00, d: 0.03 },
          { f: 554.37, d: 0.03 },
          { f: 659.25, d: 0.03 },
          { f: 880.00, d: 0.05 },
          { f: 1318.51, d: 0.18 }
        ]
      ];

      // Pick a different variant than the immediately preceding one
      let chosenIdx = Math.floor(Math.random() * chimeVariants.length);
      if (chosenIdx === this.lastCorrectVariant) {
        chosenIdx = (chosenIdx + 1) % chimeVariants.length;
      }
      this.lastCorrectVariant = chosenIdx;

      const pattern = chimeVariants[chosenIdx];
      let offset = 0;

      pattern.forEach(({ f, d }, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Pleasant bell-like mix (triangle + soft harmonics)
        osc.type = idx === pattern.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now + offset);

        const volume = idx === pattern.length - 1 ? 0.24 : 0.16;
        gain.gain.setValueAtTime(volume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + d + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + d + 0.12);

        offset += d;
      });
    } catch (e) {}
  }

  // --- Game Feel & Juice Audio Enhancements ---
  // Layer 1: Score Tick with Combo Pitch Scaling (+6% per combo tier) and subtle random detune (±3%)
  public playScoreTick(comboMultiplier: number = 1) {
    if (comboMultiplier >= 2) {
      this.hapticFeedback('streak');
    }
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseFreq = 523.25; // C5
      // Random detune ±3% to prevent auditory fatigue
      const detuneFactor = 1 + (Math.random() * 0.06 - 0.03);
      // Combo pitch escalation: +6% per combo tier (max +45%)
      const comboPitch = 1 + Math.min(0.45, (Math.max(1, comboMultiplier) - 1) * 0.06);
      const targetFreq = baseFreq * detuneFactor * comboPitch;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = comboMultiplier >= 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(targetFreq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  // Layer 2: Rank Up / Passed someone - Delicate 3-note ascending stinger
  public playRankUpStinger() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Ascending musical triad: G5 -> C6 -> E6
      const notes = [783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch (e) {}
  }

  // Layer 2: Rank Down / Passed by - Soft airy gentle exhale (not a negative fail sound)
  public playRankDownSoftExhale() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Soft gentle glide downward: A4 (440Hz) -> F4 (349Hz) with smooth fade
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(349, now + 0.35);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.40);
    } catch (e) {}
  }

  // Layer 2: Milestone & Personal Best Warm Celestial Bell
  public playMilestoneGlow() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Harmonious twin bell: C5 & G5 fading warmly
      [523.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.18, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.48);
      });
    } catch (e) {}
  }

  // 5. Swap / Pass Sound - with 3 distinct swoosh variations
  public playSwap() {
    this.hapticFeedback('warning');
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      let variant = Math.floor(Math.random() * 3);
      if (variant === this.lastSwapVariant) {
        variant = (variant + 1) % 3;
      }
      this.lastSwapVariant = variant;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (variant === 0) {
        // Deep airy filter whoosh
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.13);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.13);
      } else if (variant === 1) {
        // Quick slide swoop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      } else {
        // Crisp card snap flip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.11);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.11);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  public playPass() {
    this.playSwap();
  }

  // 6. Natural Organic Mechanical Tick-Tock (Alternating soft woodblock tone, non-grating!)
  public playTick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      this.tickToggle = !this.tickToggle;

      // Alternating "Tick" (higher wood) and "Tock" (lower wood)
      const freq = this.tickToggle ? 920 : 640;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.02);

      // Very subtle, quiet volume so it doesn't fatigue players during a 90s round
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch (e) {}
  }

  // 7. Final 5 Seconds Urgent Dramatic Siren/Alarm (Exciting building pitch, non-piercing)
  public playUrgentTick(secondsRemaining: number) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Ascending pitch base as countdown reaches 1
      const stepIndex = Math.max(1, Math.min(5, secondsRemaining));
      const pitchOffset = (6 - stepIndex) * 90; // 900Hz -> 1260Hz

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      const freq1 = 800 + pitchOffset;
      const freq2 = freq1 * 1.5; // Perfect 5th overtone for musical tension

      osc1.frequency.setValueAtTime(freq1, now);
      osc1.frequency.exponentialRampToValueAtTime(freq1 * 1.2, now + 0.08);

      osc2.frequency.setValueAtTime(freq2, now);
      osc2.frequency.exponentialRampToValueAtTime(freq2 * 1.2, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.09);
      osc2.stop(now + 0.09);
    } catch (e) {}
  }

  // 8. Elimination / Team Defeat Sound
  public playElimination() {
    this.hapticFeedback('error');
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [311.13, 293.66, 261.63, 220.0, 164.81]; // Descending minor tones
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.11);

        gain.gain.setValueAtTime(0.18, now + i * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.19);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.19);
      });
    } catch (e) {}
  }

  // 9. Round Ended Resonant Gong
  public playRoundEnd() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.7);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.7);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 0.7);
      subOsc.stop(now + 0.7);
    } catch (e) {}
  }

  // 10. Victory Fanfare (Rich celebratory progression)
  public playVictory() {
    this.hapticFeedback('victory');
    if (this.isMuted) return;
    this.stopBGM();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.11 }, // C5
        { f: 659.25, d: 0.11 }, // E5
        { f: 783.99, d: 0.11 }, // G5
        { f: 1046.50, d: 0.28 }, // C6
        { f: 880.00, d: 0.14 }, // A5
        { f: 1046.50, d: 0.14 }, // C6
        { f: 1318.51, d: 0.45 }, // E6
      ];

      let t = now;
      melody.forEach(({ f, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + d);
        t += d * 0.92;
      });
    } catch (e) {}
  }

  public playSuccess() {
    this.playVictory();
  }

  // --- PROCEDURAL POLYPHONIC BACKGROUND MUSIC (BGM) ---

  // 1. Menu & Ambient BGM (Warm, relaxing 32-step progression: Cmaj7 - Am7 - Dm7 - G7)
  public startMenuBGM() {
    this.lastBgmMode = 'menu';
    if (this.isMuted) return;
    if (this.currentBgmMode === 'menu' && this.bgmTimeout !== null) return;

    this.stopBGM();
    this.currentBgmMode = 'menu';
    this.bgmStep = 0;
    this.scheduleNextMenuBeat();
  }

  private scheduleNextMenuBeat() {
    if (this.currentBgmMode !== 'menu' || this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Upbeat relaxed tempo (300ms per step)
    const stepMs = 300;

    // 32-step rich melodic chord sequence with pleasant variations
    const melodySeq = [
      // Phrase 1: Cmaj7
      523.25, 659.25, 783.99, 987.77, 783.99, 659.25, 523.25, null,
      // Phrase 2: Am7
      440.00, 523.25, 659.25, 880.00, 659.25, 523.25, 440.00, null,
      // Phrase 3: Dm7
      587.33, 698.46, 880.00, 1046.50, 880.00, 698.46, 587.33, null,
      // Phrase 4: G9 resolution
      392.00, 493.88, 587.33, 739.99, 880.00, 739.99, 587.33, 523.25
    ];

    const bassSeq = [
      130.81, null, 130.81, null, 164.81, null, 196.00, null, // C3
      110.00, null, 110.00, null, 130.81, null, 164.81, null, // A2
      146.83, null, 146.83, null, 174.61, null, 220.00, null, // D3
      98.00,  null, 98.00,  null, 123.47, null, 146.83, null  // G2
    ];

    try {
      const now = ctx.currentTime;
      const step = this.bgmStep % 32;
      const mNote = melodySeq[step];
      const bNote = bassSeq[step];

      // Soft Warm Kalimba/Rhodes Melody
      if (mNote !== null) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(mNote, now);
        const melVol = 0.025 * this.bgmVolumeMultiplier;
        gain.gain.setValueAtTime(melVol, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, melVol * 0.02), now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      }

      // Warm acoustic bass
      if (bNote !== null) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bNote, now);
        const bassVol = 0.045 * this.bgmVolumeMultiplier;
        bassGain.gain.setValueAtTime(bassVol, now);
        bassGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, bassVol * 0.01), now + 0.38);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.38);
      }
    } catch (e) {}

    this.bgmStep++;
    this.bgmTimeout = window.setTimeout(() => {
      this.scheduleNextMenuBeat();
    }, stepMs);
  }

  // 2. Gameplay Dynamic Rhythm BGM
  public startGameplayBGM(secondsRemaining: number) {
    this.lastBgmMode = 'game';
    if (this.isMuted) return;
    if (this.currentBgmMode === 'game') return;

    this.stopBGM();
    this.currentBgmMode = 'game';
    this.bgmStep = 0;
    this.scheduleNextGameBeat(secondsRemaining);
  }

  private scheduleNextGameBeat(secondsRemaining: number) {
    if (this.currentBgmMode !== 'game' || this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Tempo adapts smoothly
    let stepMs = 240;
    if (secondsRemaining <= 5) stepMs = 140;
    else if (secondsRemaining <= 15) stepMs = 175;
    else if (secondsRemaining <= 30) stepMs = 205;

    // 16-step dynamic bass groove
    const bassRhythm = [
      110.0, 110.0, 130.81, 146.83, 164.81, 146.83, 130.81, 98.0,
      110.0, 130.81, 146.83, 174.61, 164.81, 146.83, 110.0, 130.81
    ];

    try {
      const now = ctx.currentTime;
      const note = bassRhythm[this.bgmStep % bassRhythm.length];

      // Warm pulsing bass note
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, now);

      const gameBassVol = 0.045 * this.bgmVolumeMultiplier;
      gain.gain.setValueAtTime(gameBassVol, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gameBassVol * 0.02), now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      // Subtle shaker rhythm on odd beats
      if (this.bgmStep % 2 === 1) {
        const shaker = ctx.createOscillator();
        const shakerGain = ctx.createGain();
        shaker.type = 'sine';
        shaker.frequency.setValueAtTime(2400 + Math.random() * 400, now);
        const shakerVol = 0.015 * this.bgmVolumeMultiplier;
        shakerGain.gain.setValueAtTime(shakerVol, now);
        shakerGain.gain.exponentialRampToValueAtTime(Math.max(0.00005, shakerVol * 0.01), now + 0.03);

        shaker.connect(shakerGain);
        shakerGain.connect(ctx.destination);

        shaker.start(now);
        shaker.stop(now + 0.03);
      }
    } catch (e) {}

    this.bgmStep++;
    this.bgmTimeout = window.setTimeout(() => {
      this.scheduleNextGameBeat(secondsRemaining);
    }, stepMs);
  }

  public stopBGM() {
    this.currentBgmMode = 'none';
    if (this.bgmTimeout) {
      window.clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
  }

  /**
   * Complete BCP-47 Language Tag Dictionary for all 38 supported languages
   */
  private static readonly BCP47_MAP: Record<string, string> = {
    'fa': 'fa-IR',
    'ar': 'ar-SA',
    'tr': 'tr-TR',
    'ku': 'ckb-IQ',
    'az': 'az-AZ',
    'he': 'he-IL',
    'hy': 'hy-AM',
    'ka': 'ka-GE',
    'en-US': 'en-US',
    'en': 'en-GB',
    'nl': 'nl-NL',
    'de': 'de-DE',
    'fr': 'fr-FR',
    'es': 'es-ES',
    'it': 'it-IT',
    'ru': 'ru-RU',
    'pt': 'pt-PT',
    'sv': 'sv-SE',
    'no': 'nb-NO',
    'da': 'da-DK',
    'fi': 'fi-FI',
    'pl': 'pl-PL',
    'uk': 'uk-UA',
    'el': 'el-GR',
    'cs': 'cs-CZ',
    'ro': 'ro-RO',
    'hu': 'hu-HU',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'hi': 'hi-IN',
    'ur': 'ur-PK',
    'bn': 'bn-BD',
    'id': 'id-ID',
    'ms': 'ms-MY',
    'vi': 'vi-VN',
    'th': 'th-TH',
    'tl': 'fil-PH'
  };

  /**
   * Stop any ongoing speech playback (Web Audio buffer, HTML5 Audio, and Web Speech)
   */
  public stopSpeech(): void {
    this.ttsSpeakSeq++;

    if (this.activeBufferSource) {
      try {
        this.activeBufferSource.onended = null;
        this.activeBufferSource.stop();
        this.activeBufferSource.disconnect();
      } catch (e) {
        // ignore
      }
      this.activeBufferSource = null;
    }

    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.fallbackAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        // ignore
      }
    }
    this.activeUtterance = null;
  }

  /**
   * Preload TTS audio into memory cache so clicking Play Audio / Slow is 0ms instant
   */
  public preloadTTS(text: string, lang: string = 'en-US'): void {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) return;
    if (!text || !text.trim()) return;
    const cleanText = text.replace(/[\(\)\[\]"'«»]/g, '').trim();
    if (!cleanText) return;

    const targetBCP = SoundManager.BCP47_MAP[lang] || lang || 'en-US';
    const langShort = targetBCP.split('-')[0].toLowerCase();
    const cacheKey = `${langShort}:${cleanText}`;

    if (this.ttsBufferCache.has(cacheKey) || this.ttsRawCache.has(cacheKey)) return;

    const url = `/api/tts?tl=${encodeURIComponent(langShort)}&q=${encodeURIComponent(cleanText)}`;
    fetch(url)
      .then(res => (res.ok ? res.arrayBuffer() : null))
      .then(async (raw) => {
        if (!raw || raw.byteLength === 0) return;
        if (this.ttsRawCache.size > 150) {
          const firstKey = this.ttsRawCache.keys().next().value;
          if (firstKey) this.ttsRawCache.delete(firstKey);
        }
        this.ttsRawCache.set(cacheKey, raw);

        if (this.ctx) {
          try {
            const copy = raw.slice(0);
            const decoded = await this.ctx.decodeAudioData(copy);
            if (this.ttsBufferCache.size > 150) {
              const firstKey = this.ttsBufferCache.keys().next().value;
              if (firstKey) this.ttsBufferCache.delete(firstKey);
            }
            this.ttsBufferCache.set(cacheKey, decoded);
          } catch {
            // Will decode on demand or use HTMLAudioElement
          }
        }
      })
      .catch(() => {});
  }

  /**
   * Play decoded AudioBuffer directly through the unlocked Web Audio API AudioContext
   */
  private playAudioBuffer(
    ctx: AudioContext,
    buffer: AudioBuffer,
    options?: { force?: boolean; rate?: number; onStart?: () => void; onEnd?: () => void }
  ): boolean {
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      const desiredRate = options?.rate ?? 1.0;
      source.playbackRate.value = desiredRate < 0.8 ? 0.72 : 1.0;

      const vol = (!options?.force && this.isMuted) ? 0 : 1.25;
      gainNode.gain.setValueAtTime(vol, ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      this.activeBufferSource = source;
      options?.onStart?.();

      source.onended = () => {
        if (this.activeBufferSource === source) {
          this.activeBufferSource = null;
        }
        options?.onEnd?.();
      };

      source.start(0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reliable server TTS via Web Audio API AudioContext (immune to iframe autoplay & missing OS voices)
   */
  private async playFallbackTTS(
    cleanText: string,
    targetBCP: string,
    options?: { force?: boolean; rate?: number; onStart?: () => void; onEnd?: () => void },
    seqId?: number
  ): Promise<boolean> {
    const currentSeq = seqId ?? this.ttsSpeakSeq;
    const langShort = targetBCP.split('-')[0].toLowerCase();
    const cacheKey = `${langShort}:${cleanText}`;
    const ctx = this.getAudioContext();

    try {
      // 1. Instant 0ms playback if AudioBuffer is already decoded in memory
      if (ctx && this.ttsBufferCache.has(cacheKey)) {
        const cachedBuffer = this.ttsBufferCache.get(cacheKey)!;
        if (currentSeq !== this.ttsSpeakSeq) return true;
        if (this.playAudioBuffer(ctx, cachedBuffer, options)) {
          return true;
        }
      }

      // 2. Fetch raw audio bytes from /api/tts (or use preloaded raw bytes)
      let rawBuffer = this.ttsRawCache.get(cacheKey) || null;
      if (!rawBuffer) {
        const url = `/api/tts?tl=${encodeURIComponent(langShort)}&q=${encodeURIComponent(cleanText)}`;
        const response = await fetch(url);
        if (!response.ok) return false;
        const arr = await response.arrayBuffer();
        if (!arr || arr.byteLength === 0) return false;
        rawBuffer = arr;
        this.ttsRawCache.set(cacheKey, rawBuffer);
      }

      if (currentSeq !== this.ttsSpeakSeq) return true;

      // 3. Decode and play through Web Audio API AudioContext
      if (ctx && typeof ctx.decodeAudioData === 'function') {
        try {
          const decoded = await ctx.decodeAudioData(rawBuffer.slice(0));
          this.ttsBufferCache.set(cacheKey, decoded);
          if (currentSeq !== this.ttsSpeakSeq) return true;
          if (this.playAudioBuffer(ctx, decoded, options)) {
            return true;
          }
        } catch {
          // Fall through to HTMLAudioElement blob playback
        }
      }

      // 4. Fallback to HTMLAudioElement with Blob URL
      if (currentSeq !== this.ttsSpeakSeq) return true;
      const blob = new Blob([rawBuffer.slice(0)], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(blobUrl);
      const desiredRate = options?.rate ?? 1.0;
      audio.playbackRate = desiredRate < 0.8 ? 0.72 : 1.0;
      audio.volume = (!options?.force && this.isMuted) ? 0 : 1.0;
      this.fallbackAudio = audio;

      audio.onplay = () => {
        options?.onStart?.();
      };
      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        this.fallbackAudio = null;
        options?.onEnd?.();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        this.fallbackAudio = null;
        options?.onEnd?.();
      };

      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Browser Web Speech Synthesis fallback (used when offline or in test environments)
   */
  private speakWithBrowserSynthesis(
    cleanText: string,
    targetBCP: string,
    options?: { force?: boolean; rate?: number; onStart?: () => void; onEnd?: () => void }
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options?.onEnd?.();
      return;
    }

    try {
      const targetPrefix = targetBCP.split('-')[0].toLowerCase();
      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      const matchingVoice = voices && voices.length > 0
        ? voices.find(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            return vLang === targetBCP.toLowerCase() || vLang.startsWith(targetPrefix);
          })
        : null;

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.activeUtterance = utterance;
      (window as any).__lastUtterance = utterance;

      utterance.lang = targetBCP;
      utterance.rate = options?.rate ?? 0.88;
      utterance.pitch = 1.0;
      utterance.volume = (!options?.force && this.isMuted) ? 0 : 1.0;

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      let hasEnded = false;
      const finish = () => {
        if (!hasEnded) {
          hasEnded = true;
          this.activeUtterance = null;
          options?.onEnd?.();
        }
      };

      utterance.onstart = () => {
        options?.onStart?.();
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    } catch {
      options?.onEnd?.();
    }
  }

  /**
   * High-clarity native speech pronunciation using Web Audio API Server TTS + Web Speech fallback
   */
  public hasVoice(_lang: string = 'en-US'): boolean {
    return typeof window !== 'undefined';
  }

  public isVoiceSupportedFor(_lang: string = 'en-US'): boolean {
    return typeof window !== 'undefined';
  }

  public speak(
    text: string, 
    lang: string = 'en-US', 
    options?: { force?: boolean; rate?: number; onStart?: () => void; onEnd?: () => void }
  ): void {
    if (!text || text.trim() === '') return;
    const cleanText = text.replace(/[\(\)\[\]"'«»]/g, '').trim();
    if (!cleanText) return;

    const targetBCP = SoundManager.BCP47_MAP[lang] || lang || 'en-US';

    // Stop previous playback
    this.stopSpeech();
    const seqId = this.ttsSpeakSeq;

    // Unlock AudioContext synchronously during user gesture
    this.getAudioContext();

    // Record last utterance for diagnostic/test inspection
    if (typeof window !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        const u = new SpeechSynthesisUtterance(cleanText);
        u.lang = targetBCP;
        u.rate = options?.rate ?? 0.88;
        (window as any).__lastUtterance = u;
      } catch {}
    }

    // In unit test environments (jsdom), use Web Speech synthesis directly
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
    if (isJsdom || typeof fetch === 'undefined') {
      this.speakWithBrowserSynthesis(cleanText, targetBCP, options);
      return;
    }

    // Primary: Play crystal-clear audio via /api/tts + Web Audio API AudioContext, fallback to Web Speech if offline
    this.playFallbackTTS(cleanText, targetBCP, options, seqId).then((played) => {
      if (!played && seqId === this.ttsSpeakSeq) {
        this.speakWithBrowserSynthesis(cleanText, targetBCP, options);
      }
    });
  }

  public speakTargetPhrase(
    text: string, 
    lang: string = 'en-US',
    options?: { onStart?: () => void; onEnd?: () => void }
  ): void {
    this.speak(text, lang, options);
  }

  public speakNative(
    text: string, 
    lang: string = 'en-US',
    options?: { onStart?: () => void; onEnd?: () => void; rate?: number }
  ): void {
    this.speak(text, lang, { force: true, ...options });
  }

  public speakSlow(
    text: string, 
    lang: string = 'en-US',
    options?: { onStart?: () => void; onEnd?: () => void }
  ): void {
    this.speak(text, lang, { force: true, rate: 0.68, ...options });
  }

  public hapticFeedback(pattern: 'light' | 'success' | 'warning' | 'error' | 'victory' | 'streak' = 'light'): void {
    if (!this.isHapticsEnabled) return;
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      if (pattern === 'light') {
        navigator.vibrate(15);
      } else if (pattern === 'success') {
        navigator.vibrate([20, 30, 25]);
      } else if (pattern === 'warning') {
        navigator.vibrate([25, 35, 25]);
      } else if (pattern === 'error') {
        navigator.vibrate([45, 40, 55]);
      } else if (pattern === 'streak') {
        navigator.vibrate([20, 20, 25, 25, 35]);
      } else if (pattern === 'victory') {
        navigator.vibrate([50, 40, 60, 40, 100]);
      }
    } catch {}
  }
}

export const sound = new SoundManager();
