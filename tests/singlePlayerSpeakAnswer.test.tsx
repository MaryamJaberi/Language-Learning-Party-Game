import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SinglePlayerScreen from '../screens/SinglePlayerScreen';
import { LanguageCard, SinglePlayerSettings } from '../types';
import { sound } from '../soundManager';

describe('SinglePlayerScreen Speak to Answer Feature', () => {
  let activeRecognitionInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

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

  const mockCard: LanguageCard = {
    id: 'test-speak-card',
    targetText: 'How do you say ... in English?',
    translation: 'به انگلیسی ... چی میشه؟',
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

  test('Tapping Speak starts speech recognition with target language and auto-submits on completion', () => {
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

    // Recognition should have started with target language code
    expect(activeRecognitionInstance).toBeDefined();
    expect(activeRecognitionInstance.start).toHaveBeenCalled();
    expect(activeRecognitionInstance.lang).toBe('en-GB');

    // 2. User speaks "How do you say in English"
    act(() => {
      if (activeRecognitionInstance.onresult) {
        activeRecognitionInstance.onresult({
          results: [
            [{ transcript: 'How do you say in English' }]
          ]
        });
      }
    });

    // Spoken text appears in the input field
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('How do you say in English');

    // 3. User finishes speaking, onend triggers
    act(() => {
      if (activeRecognitionInstance.onend) {
        activeRecognitionInstance.onend();
      }
    });

    // Correct answer is automatically evaluated and submitted!
    expect(playCorrectSpy).toHaveBeenCalled();
  });
});
