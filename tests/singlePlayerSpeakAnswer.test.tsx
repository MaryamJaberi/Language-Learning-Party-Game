import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SinglePlayerScreen from '../screens/SinglePlayerScreen';
import { LanguageCard, SinglePlayerSettings } from '../types';
import { sound } from '../soundManager';

describe('SinglePlayerScreen Speak to Answer Feature', () => {
  let activeRecognitionInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    class MockSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onstart: any = null;
      onresult: any = null;
      onerror: any = null;
      onend: any = null;
      start = vi.fn(() => {
        activeRecognitionInstance = this;
        if (this.onstart) this.onstart();
      });
      stop = vi.fn(() => {
        if (this.onend) this.onend();
      });
      abort = vi.fn();
    }

    (window as any).webkitSpeechRecognition = MockSpeechRecognition;
    (window as any).SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockCard: LanguageCard = {
    id: 'test-speak-card',
    targetText: 'How do you say this in English?',
    translation: 'به انگلیسی این چی میشه؟',
    targetLanguage: 'en',
    nativeLanguage: 'fa',
    cefrLevel: 'A1',
    topic: 'Language Learning',
    contentType: 'Question',
    learningMode: 'Translate',
    prompt: 'Translate to target language',
    difficulty: 'easy',
    points: 10
  };

  const settings: SinglePlayerSettings = {
    targetLanguage: 'en',
    nativeLanguage: 'fa',
    cefrLevel: 'A1',
    displayMode: 'translate_to_target',
    questionCount: 1,
    timeLimitSeconds: 0,
    autoPlayAudio: false,
    selectedCategories: ['Language Learning']
  };

  test('Tapping Speak starts speech recognition with target language, shows ~1.5s countdown, and auto-submits', () => {
    const playCorrectSpy = vi.spyOn(sound, 'playCorrect');

    render(
      <SinglePlayerScreen
        initialCards={[mockCard]}
        initialSettings={settings}
        uiLanguage="en"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    const speakBtn = screen.getByRole('button', { name: /speak/i });
    expect(speakBtn).toBeInTheDocument();

    // 1. User taps Speak
    act(() => {
      fireEvent.click(speakBtn);
    });

    expect(activeRecognitionInstance).toBeDefined();
    expect(activeRecognitionInstance.start).toHaveBeenCalled();
    expect(activeRecognitionInstance.lang).toBe('en-GB');

    // 2. User speaks "How do you say this in English" (interim results stream)
    act(() => {
      if (activeRecognitionInstance.onresult) {
        activeRecognitionInstance.onresult({
          results: [
            [{ transcript: 'How do you say this in English' }]
          ]
        });
      }
    });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('How do you say this in English');

    // 3. User finishes speaking, onend triggers
    act(() => {
      if (activeRecognitionInstance.onend) {
        activeRecognitionInstance.onend();
      }
    });

    // 4. Recognized transcript banner with "Try again" button appears for ~1.5s
    expect(screen.getByText(/«How do you say this in English»/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // 5. Advance timer by 1.5s -> triggers auto-submit
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(playCorrectSpy).toHaveBeenCalled();
  });

  test('Clicking "Try again" during the ~1.5s countdown buffer cancels auto-submit', () => {
    const playCorrectSpy = vi.spyOn(sound, 'playCorrect');

    render(
      <SinglePlayerScreen
        initialCards={[mockCard]}
        initialSettings={settings}
        uiLanguage="en"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    const speakBtn = screen.getByRole('button', { name: /speak/i });
    act(() => {
      fireEvent.click(speakBtn);
    });

    act(() => {
      if (activeRecognitionInstance.onresult) {
        activeRecognitionInstance.onresult({
          results: [
            [{ transcript: 'Wrong spoken phrase' }]
          ]
        });
      }
      if (activeRecognitionInstance.onend) {
        activeRecognitionInstance.onend();
      }
    });

    // "Try again" button is visible
    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainBtn).toBeInTheDocument();

    // User clicks "Try again"
    act(() => {
      fireEvent.click(tryAgainBtn);
    });

    // Advance 1.5s -> should NOT auto-submit because it was cancelled!
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(playCorrectSpy).not.toHaveBeenCalled();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  test('First failed spoken attempt on a card does NOT cost points or reset streak', () => {
    render(
      <SinglePlayerScreen
        initialCards={[mockCard]}
        initialSettings={settings}
        uiLanguage="en"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    const speakBtn = screen.getByRole('button', { name: /speak/i });
    act(() => {
      fireEvent.click(speakBtn);
    });

    // Speak wrong answer
    act(() => {
      if (activeRecognitionInstance.onresult) {
        activeRecognitionInstance.onresult({
          results: [
            [{ transcript: 'Completely different words' }]
          ]
        });
      }
      if (activeRecognitionInstance.onend) {
        activeRecognitionInstance.onend();
      }
    });

    // Let the auto-submit fire
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Friendly notice is displayed explaining first attempt is free
    expect(screen.getByText(/no point penalty|امتیازی کسر نشد/i)).toBeInTheDocument();

    // Now type or speak the correct answer
    const playCorrectSpy = vi.spyOn(sound, 'playCorrect');
    const input = screen.getByRole('textbox');
    act(() => {
      fireEvent.change(input, { target: { value: 'How do you say this in English?' } });
    });

    const checkBtn = screen.getByRole('button', { name: /check/i });
    act(() => {
      fireEvent.click(checkBtn);
    });

    expect(playCorrectSpy).toHaveBeenCalled();
  });

  test('Disables Speak button and displays localized tooltip when SpeechRecognition is unsupported', () => {
    // Delete SpeechRecognition from window
    delete (window as any).webkitSpeechRecognition;
    delete (window as any).SpeechRecognition;

    render(
      <SinglePlayerScreen
        initialCards={[mockCard]}
        initialSettings={settings}
        uiLanguage="en"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    const speakBtn = screen.getByRole('button', { name: /speak/i });
    expect(speakBtn).toBeDisabled();
    expect(speakBtn).toHaveAttribute('title', expect.stringMatching(/not supported|پشتیبانی نمی‌شود/i));
  });
});
