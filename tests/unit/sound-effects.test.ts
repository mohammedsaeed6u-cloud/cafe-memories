import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';

// Mock Web Audio API factory
function createMockAudioContext() {
  let currentTime = 0;

  const mockDestination = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const createGain = vi.fn(() => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));

  const createOscillator = vi.fn(() => ({
    type: 'sine' as OscillatorType,
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    detune: {
      value: 0,
      setValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));

  const createBiquadFilter = vi.fn(() => ({
    type: 'bandpass' as BiquadFilterType,
    frequency: {
      value: 350,
      setValueAtTime: vi.fn(),
    },
    Q: {
      value: 1,
      setValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));

  const createBufferSource = vi.fn(() => ({
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));

  const createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => {
    const channelData = new Float32Array(length);
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: vi.fn(() => channelData),
    } as unknown as AudioBuffer;
  });

  const resume = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);

  let state: AudioContextState = 'running';

  return {
    get currentTime() {
      return currentTime;
    },
    set currentTime(t: number) {
      currentTime = t;
    },
    get state() {
      return state;
    },
    set state(s: AudioContextState) {
      state = s;
    },
    sampleRate: 44100,
    destination: mockDestination,
    createGain,
    createOscillator,
    createBiquadFilter,
    createBufferSource,
    createBuffer,
    resume,
    close,
  } as unknown as AudioContext & {
    createGain: typeof createGain;
    createOscillator: typeof createOscillator;
    createBiquadFilter: typeof createBiquadFilter;
    createBufferSource: typeof createBufferSource;
    createBuffer: typeof createBuffer;
    state: AudioContextState;
  };
}

describe('SoundEffectsService - Node / Headless / SSR Fallback', () => {
  beforeEach(() => {
    SoundEffectsService.resetState();
  });

  afterEach(() => {
    SoundEffectsService.resetState();
    vi.restoreAllMocks();
  });

  it('safely handles missing window and AudioContext without throwing', () => {
    expect(SoundEffectsService.getAudioContext()).toBeNull();
    expect(SoundEffectsService.playShutterSound()).toBe(false);
    expect(SoundEffectsService.playStampChime()).toBe(false);
    expect(SoundEffectsService.playRewardCelebration()).toBe(false);
    expect(SoundEffectsService.playBaristaDing()).toBe(false);
    expect(SoundEffectsService.playCountdownBeep()).toBe(false);
  });

  it('handles window defined but AudioContext undefined gracefully', () => {
    const originalWindow = (globalThis as any).window;
    try {
      (globalThis as any).window = {};
      expect(SoundEffectsService.getAudioContext()).toBeNull();
      expect(SoundEffectsService.playShutterSound()).toBe(false);
      expect(SoundEffectsService.playStampChime()).toBe(false);
      expect(SoundEffectsService.playRewardCelebration()).toBe(false);
      expect(SoundEffectsService.playBaristaDing()).toBe(false);
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });

  it('handles AudioContext constructor errors gracefully', () => {
    const originalWindow = (globalThis as any).window;
    try {
      (globalThis as any).window = {
        AudioContext: class {
          constructor() {
            throw new Error('NotAllowedError: AudioContext was not allowed to start');
          }
        },
      };
      expect(SoundEffectsService.getAudioContext()).toBeNull();
      expect(SoundEffectsService.playBaristaDing()).toBe(false);
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });
});

describe('SoundEffectsService - Volume and Mute Preferences', () => {
  beforeEach(() => {
    SoundEffectsService.resetState();
  });

  afterEach(() => {
    SoundEffectsService.resetState();
  });

  it('initializes with default unmuted state and 0.8 volume', () => {
    expect(SoundEffectsService.isMuted()).toBe(false);
    expect(SoundEffectsService.getVolume()).toBe(0.8);
  });

  it('updates and toggles muted status correctly', () => {
    SoundEffectsService.setMuted(true);
    expect(SoundEffectsService.isMuted()).toBe(true);

    const toggled = SoundEffectsService.toggleMute();
    expect(toggled).toBe(false);
    expect(SoundEffectsService.isMuted()).toBe(false);

    const toggledAgain = SoundEffectsService.toggleMute();
    expect(toggledAgain).toBe(true);
    expect(SoundEffectsService.isMuted()).toBe(true);
  });

  it('clamps volume within [0.0, 1.0] range', () => {
    SoundEffectsService.setVolume(0.5);
    expect(SoundEffectsService.getVolume()).toBe(0.5);

    SoundEffectsService.setVolume(-0.3);
    expect(SoundEffectsService.getVolume()).toBe(0);

    SoundEffectsService.setVolume(1.8);
    expect(SoundEffectsService.getVolume()).toBe(1);
  });

  it('short-circuits sound generation when muted', () => {
    const mockCtx = createMockAudioContext();
    SoundEffectsService.setAudioContextForTesting(mockCtx);
    SoundEffectsService.setMuted(true);

    expect(SoundEffectsService.playShutterSound()).toBe(false);
    expect(SoundEffectsService.playStampChime()).toBe(false);
    expect(SoundEffectsService.playRewardCelebration()).toBe(false);
    expect(SoundEffectsService.playBaristaDing()).toBe(false);
    expect(SoundEffectsService.playCountdownBeep()).toBe(false);

    // No audio nodes should be created when muted
    expect(mockCtx.createGain).not.toHaveBeenCalled();
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('short-circuits sound generation when volume is 0', () => {
    const mockCtx = createMockAudioContext();
    SoundEffectsService.setAudioContextForTesting(mockCtx);
    SoundEffectsService.setVolume(0);

    expect(SoundEffectsService.playShutterSound()).toBe(false);
    expect(SoundEffectsService.playStampChime()).toBe(false);
    expect(mockCtx.createGain).not.toHaveBeenCalled();
  });
});

describe('SoundEffectsService - Synthesis Engines', () => {
  let mockCtx: ReturnType<typeof createMockAudioContext>;

  beforeEach(() => {
    SoundEffectsService.resetState();
    mockCtx = createMockAudioContext();
    SoundEffectsService.setAudioContextForTesting(mockCtx);
  });

  afterEach(() => {
    SoundEffectsService.resetState();
  });

  it('playShutterSound synthesizes mechanical vintage camera shutter', () => {
    const result = SoundEffectsService.playShutterSound();
    expect(result).toBe(true);

    // Should create master gain and connect to destination
    expect(mockCtx.createGain).toHaveBeenCalled();
    // Should create dual-phase mechanical oscillators (click and snap)
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);

    const oscCalls = (mockCtx.createOscillator as any).mock.results;
    expect(oscCalls.length).toBe(2);

    // Phase 1: Triangle oscillator
    expect(oscCalls[0].value.type).toBe('triangle');
    // Phase 2: Sine oscillator
    expect(oscCalls[1].value.type).toBe('sine');

    // Should create noise buffers for tactile shutter snap
    expect(mockCtx.createBuffer).toHaveBeenCalled();
  });

  it('playStampChime synthesizes warm acoustic bronze chime', () => {
    const result = SoundEffectsService.playStampChime();
    expect(result).toBe(true);

    // 2 musical tones (D5 and A5) each with fundamental + warm overtone = 4 oscillators
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);

    const oscs = (mockCtx.createOscillator as any).mock.results.map((r: any) => r.value);
    // All tones should be pure sine waves for warm tone
    oscs.forEach((osc: any) => {
      expect(osc.type).toBe('sine');
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
    });
  });

  it('playRewardCelebration synthesizes crystal arpeggio chords', () => {
    const result = SoundEffectsService.playRewardCelebration();
    expect(result).toBe(true);

    // 6 arpeggio notes (C5, G5, C6, E6, G6, C7), each with sine + triangle shimmer = 12 oscillators
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(12);

    const oscs = (mockCtx.createOscillator as any).mock.results.map((r: any) => r.value);
    const triangleShimmers = oscs.filter((o: any) => o.type === 'triangle');
    expect(triangleShimmers.length).toBe(6);

    // Every note starts and schedules a stop
    oscs.forEach((osc: any) => {
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
    });
  });

  it('playBaristaDing synthesizes authentic brass counter bell with ~1500Hz resonance and long decay', () => {
    const result = SoundEffectsService.playBaristaDing();
    expect(result).toBe(true);

    // Fundamental (1500Hz), flutter beat (1503.2Hz), octave (3000Hz), clapper ping (4500Hz) = 4 oscillators
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);

    const oscs = (mockCtx.createOscillator as any).mock.results.map((r: any) => r.value);
    const primaryOsc = oscs[0];

    // Verify fundamental frequency ~1500Hz
    expect(primaryOsc.frequency.setValueAtTime).toHaveBeenCalledWith(1500, expect.any(Number));

    const gainNodes = (mockCtx.createGain as any).mock.results.map((r: any) => r.value);
    const primaryGain = gainNodes[1];
    const rampCall = primaryGain.gain.exponentialRampToValueAtTime.mock.calls[0];
    expect(rampCall[0]).toBe(0.0001);
    expect(rampCall[1]).toBeGreaterThan(2.0);
  });

  it('playCountdownBeep plays single tone countdown beep', () => {
    const result = SoundEffectsService.playCountdownBeep(980);
    expect(result).toBe(true);

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    const osc = (mockCtx.createOscillator as any).mock.results[0].value;
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(980, expect.any(Number));
  });

  it('resumes suspended AudioContext when triggering sound', () => {
    mockCtx.state = 'suspended';
    SoundEffectsService.playBaristaDing();
    expect(mockCtx.resume).toHaveBeenCalled();
  });
});
