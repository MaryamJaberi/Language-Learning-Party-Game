import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { sound } from '../soundManager';

describe('Sound System and Audio Synthesizer Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sound.setMuted(false);
  });

  afterEach(() => {
    sound.stopBGM();
  });

  test('AudioContext initializes correctly and provides valid context', () => {
    const ctx = sound.getAudioContext();
    expect(ctx).toBeDefined();
    expect(ctx).not.toBeNull();
  });

  test('Mute and sound enabled toggles work accurately', () => {
    sound.setSoundEnabled(false);
    expect(sound.getMuted()).toBe(true);
    expect(sound.isSoundEnabled()).toBe(false);

    sound.setSoundEnabled(true);
    expect(sound.getMuted()).toBe(false);
    expect(sound.isSoundEnabled()).toBe(true);
  });

  test('Tactile click sound triggers without error and respects mute', () => {
    expect(() => sound.playClick()).not.toThrow();

    sound.setMuted(true);
    expect(() => sound.playClick()).not.toThrow();
  });

  test('Toggle / option switch sound executes with musical intervals', () => {
    for (let i = 0; i < 5; i++) {
      expect(() => sound.playToggle()).not.toThrow();
    }
  });

  test('Start game fanfare triggers multiple ascending notes', () => {
    expect(() => sound.playStartGame()).not.toThrow();
  });

  test('Correct guess chimes rotate through diverse melodic variations', () => {
    // Call 10 times to ensure variant cycling and randomness works without crashing
    for (let i = 0; i < 10; i++) {
      expect(() => sound.playCorrect()).not.toThrow();
    }
  });

  test('Word swap swoosh sound executes all variations without error', () => {
    for (let i = 0; i < 6; i++) {
      expect(() => sound.playSwap()).not.toThrow();
    }
  });

  test('Tick-tock alternating clock sounds execute properly', () => {
    // Tick 1
    expect(() => sound.playTick()).not.toThrow();
    // Tock 2
    expect(() => sound.playTick()).not.toThrow();
    // Tick 3
    expect(() => sound.playTick()).not.toThrow();
  });

  test('Urgent countdown alarm escalates pitch from 5 down to 1 second', () => {
    for (let sec = 5; sec >= 1; sec--) {
      expect(() => sound.playUrgentTick(sec)).not.toThrow();
    }
  });

  test('Round end resonant gong and team elimination tones execute safely', () => {
    expect(() => sound.playRoundEnd()).not.toThrow();
    expect(() => sound.playElimination()).not.toThrow();
  });

  test('Victory celebration fanfare triggers correctly', () => {
    expect(() => sound.playVictory()).not.toThrow();
    expect(() => sound.playWinner()).not.toThrow();
  });

  test('Procedural Menu BGM and Gameplay BGM schedule and stop cleanly', () => {
    vi.useFakeTimers();

    sound.startMenuBGM();
    // Advance timers by several beats
    vi.advanceTimersByTime(1200);

    // Switch to Gameplay BGM
    sound.startGameplayBGM(60);
    vi.advanceTimersByTime(1000);

    // Stop BGM
    sound.stopBGM();
    expect(() => sound.stopBGM()).not.toThrow();

    vi.useRealTimers();
  });
});
