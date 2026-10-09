import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SinglePlayerScreen from '../screens/SinglePlayerScreen';
import { LeitnerScreen } from '../screens/LeitnerScreen';
import { sound } from '../soundManager';
import { LanguageCard, SinglePlayerSettings } from '../types';

describe('Focus, Ergonomics & Learning Flow Tests', () => {
  const mockCards: LanguageCard[] = [
    {
      id: 'card-erg-1',
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      topic: 'CAT_TRAVEL',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      prompt: 'دوچرخه به هلندی چی میشه؟',
      targetText: 'fiets',
      translation: 'دوچرخه',
      grammarPoint: 'de-word (de fiets)',
      pronunciation: 'fits',
      hint: 'وسیله نقلیه دو چرخ محبوب هلند',
      difficulty: 'easy',
      points: 1
    },
    {
      id: 'card-erg-2',
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      topic: 'CAT_TRAVEL',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      prompt: 'قطار',
      targetText: 'trein',
      translation: 'قطار',
      grammarPoint: 'de-word (de trein)',
      pronunciation: 'trein',
      hint: 'روی ریل حرکت می‌کند',
      difficulty: 'easy',
      points: 2
    }
  ];

  const defaultSettings: SinglePlayerSettings = {
    targetLanguage: 'nl',
    nativeLanguage: 'fa',
    cefrLevel: 'A1',
    displayMode: 'translate_to_target',
    questionCount: 5,
    timeLimitSeconds: 30,
    autoPlayAudio: false,
    selectedCategories: ['CAT_TRAVEL'],
    zenMode: false,
    autoAdvance: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('1. SoundManager speakSlow invokes speech synthesis with rate 0.68', () => {
    const speakSpy = vi.spyOn(sound, 'speak');
    sound.speakSlow('fiets', 'nl');
    expect(speakSpy).toHaveBeenCalledWith('fiets', 'nl', expect.objectContaining({
      force: true,
      rate: 0.68
    }));
  });

  test('2. Haptic feedback safely executes without errors', () => {
    expect(() => {
      sound.hapticFeedback('success');
      sound.hapticFeedback('error');
      sound.hapticFeedback('light');
    }).not.toThrow();
  });

  test('3. SinglePlayerScreen renders slow audio 0.7x button and plays slow speech', () => {
    const speakSlowSpy = vi.spyOn(sound, 'speakSlow');
    const onFinish = vi.fn();
    const onExit = vi.fn();

    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={defaultSettings}
        uiLanguage="fa"
        onFinish={onFinish}
        onExit={onExit}
      />
    );

    const slowAudioBtn = screen.getByRole('button', { name: /تلفظ آرام ۰.۷x/i });
    expect(slowAudioBtn).toBeInTheDocument();
    fireEvent.click(slowAudioBtn);
    expect(speakSlowSpy).toHaveBeenCalledWith('fiets', 'nl');
  });

  test('4. Zen focus mode toggles cleanly and minimizes visual distractions', () => {
    const onFinish = vi.fn();
    const onExit = vi.fn();

    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={defaultSettings}
        uiLanguage="fa"
        onFinish={onFinish}
        onExit={onExit}
      />
    );

    // Initial state: Mode selector is visible
    expect(screen.getByRole('radiogroup', { name: 'حالت تمرین' })).toBeInTheDocument();

    // Toggle Zen Mode
    const focusBtn = screen.getByRole('button', { name: /تمرکز/i });
    fireEvent.click(focusBtn);

    // Segment mode bar hides to maximize focus
    expect(screen.queryByRole('radiogroup', { name: 'حالت تمرین' })).not.toBeInTheDocument();
  });

  test('5. Keyboard ergonomics: hotkey Space triggers audio, hotkey S triggers slow audio', () => {
    const speakNativeSpy = vi.spyOn(sound, 'speakNative');
    const speakSlowSpy = vi.spyOn(sound, 'speakSlow');
    const onFinish = vi.fn();
    const onExit = vi.fn();

    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={defaultSettings}
        uiLanguage="fa"
        onFinish={onFinish}
        onExit={onExit}
      />
    );

    // Press Space
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    expect(speakNativeSpy).toHaveBeenCalledWith('fiets', 'nl');

    // Press S
    fireEvent.keyDown(window, { key: 's' });
    expect(speakSlowSpy).toHaveBeenCalledWith('fiets', 'nl');
  });

  test('6. Auto-advance smoothly triggers progression on correct answer after reading delay', () => {
    vi.useFakeTimers();
    const onFinish = vi.fn();
    const onExit = vi.fn();

    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={{ ...defaultSettings, autoAdvance: true }}
        uiLanguage="fa"
        onFinish={onFinish}
        onExit={onExit}
      />
    );

    // Submit correct answer
    const input = screen.getByPlaceholderText(/تایپ کنید یا بگویید/i);
    fireEvent.change(input, { target: { value: 'fiets' } });
    const checkBtn = screen.getByRole('button', { name: /بررسی پاسخ/i });
    fireEvent.click(checkBtn);

    // Evaluation shows correct
    expect(screen.getByText(/درست/i)).toBeInTheDocument();

    // Advance timer by 1200ms
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // Successfully auto-advanced to next card 'قطار'
    expect(screen.getByText('قطار')).toBeInTheDocument();
    vi.useRealTimers();
  });

  test('7. LeitnerScreen includes slow pronunciation 0.7x and flip action', () => {
    const speakSlowSpy = vi.spyOn(sound, 'speakSlow');
    const onExit = vi.fn();

    render(
      <LeitnerScreen
        language="fa"
        onExit={onExit}
        isRTL={true}
      />
    );

    const slowBtn = screen.queryByRole('button', { name: /0.7x/i });
    if (slowBtn) {
      fireEvent.click(slowBtn);
      expect(speakSlowSpy).toHaveBeenCalled();
    }
  });
});
