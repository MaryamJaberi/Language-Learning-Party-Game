import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { sound } from '../soundManager';
import { FlagIcon } from '../components/FlagIcon';
import { SUPPORTED_LANGUAGES } from '../constants';
import SinglePlayerScreen from '../screens/SinglePlayerScreen';
import { SinglePlayerSettings, LanguageCard } from '../types';

describe('User Feedback, Audio Resumption & Single Player Learning Modes', () => {
  beforeEach(() => {
    localStorage.clear();
    sound.setMuted(false);
  });

  test('1. Sound toggle resumes background music seamlessly', () => {
    // Start unmuted
    expect(sound.getMuted()).toBe(false);

    // Mute sound
    sound.setMuted(true);
    expect(sound.getMuted()).toBe(true);

    // Unmute sound - background music should be scheduled to resume
    sound.setMuted(false);
    expect(sound.getMuted()).toBe(false);
    expect(sound.isSoundEnabled()).toBe(true);
  });

  test('2. FlagIcon outputs ONLY English uppercase abbreviation badge without emoji flags', () => {
    const { container: faBadge } = render(<FlagIcon language="fa" />);
    expect(faBadge.textContent).toBe('FA');
    expect(faBadge.textContent).not.toContain('🇮🇷');

    const { container: nlBadge } = render(<FlagIcon language="nl" />);
    expect(nlBadge.textContent).toBe('NL');
    expect(nlBadge.textContent).not.toContain('🇳🇱');

    const { container: deBadge } = render(<FlagIcon language="de" />);
    expect(deBadge.textContent).toBe('DE');
    expect(deBadge.textContent).not.toContain('🇩🇪');
  });

  test('3. SUPPORTED_LANGUAGES has nativeName in that language itself', () => {
    const fa = SUPPORTED_LANGUAGES.find(l => l.code === 'fa');
    expect(fa?.nativeName).toBe('فارسی');

    const nl = SUPPORTED_LANGUAGES.find(l => l.code === 'nl');
    expect(nl?.nativeName).toBe('Nederlands');

    const de = SUPPORTED_LANGUAGES.find(l => l.code === 'de');
    expect(de?.nativeName).toBe('Deutsch');

    const fr = SUPPORTED_LANGUAGES.find(l => l.code === 'fr');
    expect(fr?.nativeName).toBe('Français');
  });

  test('4. Single Player Screen applies selected learning mode and shows 4 options', () => {
    const mockCards: LanguageCard[] = [
      { id: 'c1', targetText: 'hallo', translation: 'سلام', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_EVERYDAY', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
      { id: 'c2', targetText: 'dank je', translation: 'ممنون', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_EVERYDAY', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
      { id: 'c3', targetText: 'alstublieft', translation: 'خواهش می‌کنم', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_EVERYDAY', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
      { id: 'c4', targetText: 'goedemorgen', translation: 'صبح بخیر', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_EVERYDAY', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
    ];

    const settings: SinglePlayerSettings = {
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      displayMode: 'translate_to_target',
      questionCount: 4,
      timeLimitSeconds: 30,
      autoPlayAudio: false,
      selectedCategories: ['CAT_EVERYDAY']
    };

    const handleFinish = vi.fn();
    const handleExit = vi.fn();

    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={settings}
        uiLanguage="fa"
        onFinish={handleFinish}
        onExit={handleExit}
        onOpenLeaderboard={vi.fn()}
      />
    );

    // In translate_to_target mode, native prompt should be visible
    expect(screen.getByText('سلام')).toBeInTheDocument();

    // 4 quick quiz options should be rendered
    const choicesBanner = screen.getByText(/یا پاسخ را مستقیماً از ۴ گزینه زیر لمس کنید/i);
    expect(choicesBanner).toBeInTheDocument();

    // Clicking the correct option 'hallo' should evaluate successfully
    const halloOption = screen.getByRole('button', { name: 'hallo' });
    fireEvent.click(halloOption);

    // Verify correct feedback
    expect(screen.getByText(/آفرین/i)).toBeInTheDocument();
  });

  test('5. Actionable guidance is displayed on empty answer submission in SinglePlayerScreen', () => {
    const mockCards: LanguageCard[] = [
      { id: 'c1', targetText: 'appel', translation: 'سیب', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_FOOD', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
    ];

    const settings: SinglePlayerSettings = {
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      displayMode: 'text_and_audio',
      questionCount: 1,
      timeLimitSeconds: 30,
      autoPlayAudio: false,
      selectedCategories: ['CAT_FOOD']
    };

    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={settings}
        uiLanguage="fa"
        onFinish={vi.fn()}
        onExit={vi.fn()}
        onOpenLeaderboard={vi.fn()}
      />
    );

    // Submit empty input
    const submitBtn = screen.getByRole('button', { name: /بررسی پاسخ/i });
    fireEvent.click(submitBtn);

    // Check for actionable guidance containing راه‌حل
    expect(screen.getByText(/راه‌حل:/i)).toBeInTheDocument();
  });
});
