/**
 * SoundEffectsService
 * Pure synthesized WebAudio API sound effects engine for Cafe Memories.
 * Zero external MP3/WAV network requests, 100% offline, zero latency, SSR/headless safe.
 */

const MUTED_STORAGE_KEY = 'cafe_memories_sound_muted';
const VOLUME_STORAGE_KEY = 'cafe_memories_sound_volume';

export class SoundEffectsService {
  private static audioCtx: AudioContext | null = null;
  private static muted: boolean = false;
  private static volume: number = 0.8;
  private static initializedFromStorage: boolean = false;

  /**
   * Initializes preferences from localStorage if running in browser environment.
   */
  private static initPreferences(): void {
    if (this.initializedFromStorage || typeof window === 'undefined') return;
    try {
      if (window.localStorage) {
        const storedMuted = window.localStorage.getItem(MUTED_STORAGE_KEY);
        if (storedMuted !== null) {
          this.muted = storedMuted === 'true';
        }
        const storedVolume = window.localStorage.getItem(VOLUME_STORAGE_KEY);
        if (storedVolume !== null) {
          const parsed = parseFloat(storedVolume);
          if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed;
          }
        }
      }
    } catch {
      // LocalStorage access restricted or unavailable
    }
    this.initializedFromStorage = true;
  }

  /**
   * Returns or lazily instantiates the shared AudioContext.
   * Gracefully returns null in Node/SSR/headless environments or when Web Audio is unsupported.
   */
  public static getAudioContext(): AudioContext | null {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    if (typeof window === 'undefined') return null;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * For testing purposes: allows overriding or resetting the active AudioContext.
   */
  public static setAudioContextForTesting(ctx: AudioContext | null): void {
    this.audioCtx = ctx;
  }

  /**
   * Resets internal mute, volume, and context state (useful for test isolation).
   */
  public static resetState(): void {
    this.audioCtx = null;
    this.muted = false;
    this.volume = 0.8;
    this.initializedFromStorage = false;
  }

  /**
   * Check if sound effects are currently muted.
   */
  public static isMuted(): boolean {
    this.initPreferences();
    return this.muted;
  }

  /**
   * Set mute preference and persist to localStorage if available.
   */
  public static setMuted(muted: boolean): void {
    this.muted = muted;
    this.initializedFromStorage = true;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MUTED_STORAGE_KEY, String(muted));
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Toggle mute preference and return new muted state.
   */
  public static toggleMute(): boolean {
    this.setMuted(!this.isMuted());
    return this.muted;
  }

  /**
   * Get current master volume level (0.0 to 1.0).
   */
  public static getVolume(): number {
    this.initPreferences();
    return this.volume;
  }

  /**
   * Set current master volume level (clamped between 0.0 and 1.0).
   */
  public static setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.volume = clamped;
    this.initializedFromStorage = true;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Synthesizes a mono white-noise buffer for mechanical/metallic transients.
   */
  private static createNoiseBuffer(ctx: AudioContext, durationSec = 0.05): AudioBuffer | null {
    try {
      if (typeof ctx.createBuffer !== 'function') return null;
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      return buffer;
    } catch {
      return null;
    }
  }

  /**
   * 1. Mechanical vintage camera shutter (crisp attack click + mechanical snap).
   * Emulates a mechanical Leica/rangefinder shutter: fast dual-phase mechanical curtains.
   * Returns true if sound was successfully scheduled, false otherwise.
   */
  public static playShutterSound(volumeScale = 1): boolean {
    if (this.isMuted() || this.volume <= 0) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(this.volume * volumeScale, now);
      master.connect(ctx.destination);

      // Phase 1: Initial Shutter Blade Release & Sweep (t = now)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1600, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.035);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(master);
      osc1.start(now);
      osc1.stop(now + 0.045);

      // Phase 1 Texture: High crisp noise click
      const noiseBuffer1 = this.createNoiseBuffer(ctx, 0.025);
      if (noiseBuffer1) {
        const noiseSource1 = ctx.createBufferSource();
        const noiseFilter1 = ctx.createBiquadFilter();
        const noiseGain1 = ctx.createGain();

        noiseSource1.buffer = noiseBuffer1;
        noiseFilter1.type = 'bandpass';
        noiseFilter1.frequency.setValueAtTime(3200, now);
        noiseFilter1.Q.setValueAtTime(2.5, now);

        noiseGain1.gain.setValueAtTime(0.25, now);
        noiseGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        noiseSource1.connect(noiseFilter1);
        noiseFilter1.connect(noiseGain1);
        noiseGain1.connect(master);
        noiseSource1.start(now);
        noiseSource1.stop(now + 0.025);
      }

      // Phase 2: Shutter Curtain Snap & Body Thud (t = now + 45ms)
      const snapTime = now + 0.045;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(560, snapTime);
      osc2.frequency.exponentialRampToValueAtTime(75, snapTime + 0.09);
      gain2.gain.setValueAtTime(0.3, snapTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.095);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(snapTime);
      osc2.stop(snapTime + 0.1);

      // Phase 2 Texture: Mechanical catch click
      const noiseBuffer2 = this.createNoiseBuffer(ctx, 0.04);
      if (noiseBuffer2) {
        const noiseSource2 = ctx.createBufferSource();
        const noiseFilter2 = ctx.createBiquadFilter();
        const noiseGain2 = ctx.createGain();

        noiseSource2.buffer = noiseBuffer2;
        noiseFilter2.type = 'bandpass';
        noiseFilter2.frequency.setValueAtTime(1800, snapTime);
        noiseFilter2.Q.setValueAtTime(3, snapTime);

        noiseGain2.gain.setValueAtTime(0.2, snapTime);
        noiseGain2.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.04);

        noiseSource2.connect(noiseFilter2);
        noiseFilter2.connect(noiseGain2);
        noiseGain2.connect(master);
        noiseSource2.start(snapTime);
        noiseSource2.stop(snapTime + 0.04);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 2. Warm tonal chime for stamp validation.
   * Emulates a warm acoustic bronze chime (D5 -> A5 harmony with warm overtones).
   * Returns true if sound was successfully scheduled, false otherwise.
   */
  public static playStampChime(volumeScale = 1): boolean {
    if (this.isMuted() || this.volume <= 0) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(this.volume * volumeScale, now);
      master.connect(ctx.destination);

      // Chime Tone 1: Warm D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.32, now + 0.005);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(master);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Chime Tone 1 Warmth Overtone (1174.66 Hz)
      const osc1Overtone = ctx.createOscillator();
      const gain1Overtone = ctx.createGain();
      osc1Overtone.type = 'sine';
      osc1Overtone.frequency.setValueAtTime(1174.66, now);
      gain1Overtone.gain.setValueAtTime(0.001, now);
      gain1Overtone.gain.linearRampToValueAtTime(0.08, now + 0.005);
      gain1Overtone.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1Overtone.connect(gain1Overtone);
      gain1Overtone.connect(master);
      osc1Overtone.start(now);
      osc1Overtone.stop(now + 0.4);

      // Chime Tone 2: Bright A5 (880.00 Hz) at +80ms
      const t2 = now + 0.08;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, t2);
      gain2.gain.setValueAtTime(0.001, t2);
      gain2.gain.linearRampToValueAtTime(0.36, t2 + 0.005);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.7);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(t2);
      osc2.stop(t2 + 0.75);

      // Chime Tone 2 Warmth Overtone (1760.00 Hz)
      const osc2Overtone = ctx.createOscillator();
      const gain2Overtone = ctx.createGain();
      osc2Overtone.type = 'sine';
      osc2Overtone.frequency.setValueAtTime(1760.0, t2);
      gain2Overtone.gain.setValueAtTime(0.001, t2);
      gain2Overtone.gain.linearRampToValueAtTime(0.09, t2 + 0.005);
      gain2Overtone.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.45);
      osc2Overtone.connect(gain2Overtone);
      gain2Overtone.connect(master);
      osc2Overtone.start(t2);
      osc2Overtone.stop(t2 + 0.5);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 3. Crystal arpeggio chords celebrating unlocked free gift / milestone reward.
   * Emulates a sparkling crystal music box arpeggio:
   * C5 (523Hz) -> G5 (784Hz) -> C6 (1046Hz) -> E6 (1318Hz) -> G6 (1568Hz) -> C7 (2093Hz).
   * Returns true if sound was successfully scheduled, false otherwise.
   */
  public static playRewardCelebration(volumeScale = 1): boolean {
    if (this.isMuted() || this.volume <= 0) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(this.volume * volumeScale, now);
      master.connect(ctx.destination);

      const notes = [
        { freq: 523.25, timeOffset: 0.0, duration: 0.45, gain: 0.26 }, // C5
        { freq: 783.99, timeOffset: 0.07, duration: 0.45, gain: 0.28 }, // G5
        { freq: 1046.5, timeOffset: 0.14, duration: 0.55, gain: 0.3 }, // C6
        { freq: 1318.51, timeOffset: 0.21, duration: 0.65, gain: 0.32 }, // E6
        { freq: 1567.98, timeOffset: 0.28, duration: 0.75, gain: 0.34 }, // G6
        { freq: 2093.0, timeOffset: 0.36, duration: 1.1, gain: 0.38 }, // C7 (Grand Finale Crystal)
      ];

      notes.forEach((note) => {
        const noteStart = now + note.timeOffset;

        // Primary bell fundamental (pure sine)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(note.gain, noteStart + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration);

        osc.connect(gain);
        gain.connect(master);
        osc.start(noteStart);
        osc.stop(noteStart + note.duration + 0.05);

        // Crystal shimmer overtone (detuned triangle)
        const shimmerOsc = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmerOsc.type = 'triangle';
        shimmerOsc.frequency.setValueAtTime(note.freq * 2, noteStart);
        if (shimmerOsc.detune) {
          shimmerOsc.detune.setValueAtTime(5, noteStart);
        }

        shimmerGain.gain.setValueAtTime(0.001, noteStart);
        shimmerGain.gain.linearRampToValueAtTime(note.gain * 0.22, noteStart + 0.004);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration * 0.65);

        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(master);
        shimmerOsc.start(noteStart);
        shimmerOsc.stop(noteStart + note.duration * 0.7);
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 4. Authentic brass service bell ding for counter order/print alert.
   * Acoustic brass desk bell: ~1500Hz fundamental with rich brass harmonics,
   * subtle acoustic beating, and long exponential decay (>2 seconds).
   * Returns true if sound was successfully scheduled, false otherwise.
   */
  public static playBaristaDing(volumeScale = 1): boolean {
    if (this.isMuted() || this.volume <= 0) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(this.volume * volumeScale, now);
      master.connect(ctx.destination);

      const fundamentalFreq = 1500; // ~1500Hz authentic brass bell frequency

      // 1. Primary brass bell fundamental
      const bellOsc1 = ctx.createOscillator();
      const bellGain1 = ctx.createGain();
      bellOsc1.type = 'sine';
      bellOsc1.frequency.setValueAtTime(fundamentalFreq, now);

      bellGain1.gain.setValueAtTime(0.001, now);
      bellGain1.gain.linearRampToValueAtTime(0.48, now + 0.002);
      bellGain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

      bellOsc1.connect(bellGain1);
      bellGain1.connect(master);
      bellOsc1.start(now);
      bellOsc1.stop(now + 2.35);

      // 2. Brass cup acoustic flutter / sympathetic beat (~3.2Hz detune)
      const bellOsc2 = ctx.createOscillator();
      const bellGain2 = ctx.createGain();
      bellOsc2.type = 'sine';
      bellOsc2.frequency.setValueAtTime(fundamentalFreq + 3.2, now);

      bellGain2.gain.setValueAtTime(0.001, now);
      bellGain2.gain.linearRampToValueAtTime(0.22, now + 0.002);
      bellGain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      bellOsc2.connect(bellGain2);
      bellGain2.connect(master);
      bellOsc2.start(now);
      bellOsc2.stop(now + 1.85);

      // 3. Metallic octave overtone (3000Hz)
      const octaveOsc = ctx.createOscillator();
      const octaveGain = ctx.createGain();
      octaveOsc.type = 'sine';
      octaveOsc.frequency.setValueAtTime(fundamentalFreq * 2, now);

      octaveGain.gain.setValueAtTime(0.001, now);
      octaveGain.gain.linearRampToValueAtTime(0.16, now + 0.002);
      octaveGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      octaveOsc.connect(octaveGain);
      octaveGain.connect(master);
      octaveOsc.start(now);
      octaveOsc.stop(now + 0.8);

      // 4. Strike transient partial (4500Hz metal strike)
      const strikeOsc = ctx.createOscillator();
      const strikeGain = ctx.createGain();
      strikeOsc.type = 'sine';
      strikeOsc.frequency.setValueAtTime(fundamentalFreq * 3, now);

      strikeGain.gain.setValueAtTime(0.001, now);
      strikeGain.gain.linearRampToValueAtTime(0.12, now + 0.001);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      strikeOsc.connect(strikeGain);
      strikeGain.connect(master);
      strikeOsc.start(now);
      strikeOsc.stop(now + 0.25);

      // 5. Mechanical clapper strike transient (subtle tactile tap)
      const tapBuffer = this.createNoiseBuffer(ctx, 0.015);
      if (tapBuffer) {
        const tapSource = ctx.createBufferSource();
        const tapFilter = ctx.createBiquadFilter();
        const tapGain = ctx.createGain();

        tapSource.buffer = tapBuffer;
        tapFilter.type = 'bandpass';
        tapFilter.frequency.setValueAtTime(3600, now);
        tapFilter.Q.setValueAtTime(4, now);

        tapGain.gain.setValueAtTime(0.18, now);
        tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

        tapSource.connect(tapFilter);
        tapFilter.connect(tapGain);
        tapGain.connect(master);
        tapSource.start(now);
        tapSource.stop(now + 0.015);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Terminal / POS desk bell alert alias for playBaristaDing.
   */
  public static playTerminalDing(volumeScale = 1): boolean {
    return this.playBaristaDing(volumeScale);
  }

  /**
   * Helper for camera countdown beeps.
   */
  public static playCountdownBeep(freq = 880, volumeScale = 1): boolean {
    if (this.isMuted() || this.volume <= 0) return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.volume * 0.15 * volumeScale, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
      return true;
    } catch {
      return false;
    }
  }
}

export const soundEffects = SoundEffectsService;
