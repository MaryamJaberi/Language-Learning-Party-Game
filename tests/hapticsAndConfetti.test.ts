import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sound } from '../soundManager';

describe('Mobile Haptics & Feedback Engine Audit', () => {
  let vibrateMock: any;

  beforeEach(() => {
    vibrateMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers light haptic pulse on playClick when haptics are enabled', () => {
    sound.setHapticsEnabled(true);
    vibrateMock.mockClear();
    sound.playClick();
    expect(vibrateMock).toHaveBeenCalledWith(15);
  });

  it('triggers success haptic pattern on playCorrect', () => {
    sound.setHapticsEnabled(true);
    vibrateMock.mockClear();
    sound.playCorrect();
    expect(vibrateMock).toHaveBeenCalledWith([20, 30, 25]);
  });

  it('triggers warning haptic on playSwap', () => {
    sound.setHapticsEnabled(true);
    vibrateMock.mockClear();
    sound.playSwap();
    expect(vibrateMock).toHaveBeenCalledWith([25, 35, 25]);
  });

  it('triggers victory haptic on playVictory', () => {
    sound.setHapticsEnabled(true);
    vibrateMock.mockClear();
    sound.playVictory();
    expect(vibrateMock).toHaveBeenCalledWith([50, 40, 60, 40, 100]);
  });

  it('triggers streak haptic on high combo score tick', () => {
    sound.setHapticsEnabled(true);
    vibrateMock.mockClear();
    sound.playScoreTick(3);
    expect(vibrateMock).toHaveBeenCalledWith([20, 20, 25, 25, 35]);
  });

  it('respects user haptic toggle when disabled', () => {
    sound.setHapticsEnabled(false);
    expect(sound.isHaptics()).toBe(false);
    vibrateMock.mockClear();
    sound.playClick();
    sound.playCorrect();
    sound.playVictory();
    expect(vibrateMock).not.toHaveBeenCalled();

    // Re-enable for subsequent tests
    sound.setHapticsEnabled(true);
    expect(sound.isHaptics()).toBe(true);
  });
});
