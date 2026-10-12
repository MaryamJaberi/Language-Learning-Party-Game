import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SinglePlayerScreen from '../screens/SinglePlayerScreen';
import SinglePlayerReportScreen from '../screens/SinglePlayerReportScreen';
import OnlineLobbyScreen from '../screens/OnlineLobbyScreen';
import { DuelSetupModal } from '../components/DuelSetupModal';
import { getUniqueCardsForSession } from '../contentEngine';
import { LanguageCard, SinglePlayerSettings, SinglePlayerSessionReport, GameSettings } from '../types';

describe('User Feedback: 3 Buttons Side-by-Side, Localized Results, and Online Matchmaking in Duel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('1. Three buttons (نوشتن، رد کردن، لمس برای صحبت) are present side by side in SinglePlayerScreen', () => {
    const mockCards: LanguageCard[] = [
      {
        id: 'card-1',
        targetText: 'de fiets',
        translation: 'دوچرخه',
        targetLanguage: 'nl',
        nativeLanguage: 'fa',
        cefrLevel: 'A1',
        topic: 'CAT_TRAVEL',
        contentType: 'Vocabulary',
        learningMode: 'Translate',
        prompt: 'ترجمه کنید',
        difficulty: 'easy',
        points: 10
      }
    ];

    const settings: SinglePlayerSettings = {
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      displayMode: 'text_and_audio',
      questionCount: 1,
      timeLimitSeconds: 60,
      autoPlayAudio: false,
      selectedCategories: ['CAT_TRAVEL']
    };

    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={settings}
        uiLanguage="fa"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    // Verify button 1: نوشتن (Type mode)
    const writeBtn = screen.getByRole('button', { name: /نوشتن/i });
    expect(writeBtn).toBeInTheDocument();

    // Verify button 2: رد کردن (Skip card)
    const skipBtn = screen.getByRole('button', { name: /رد کردن/i });
    expect(skipBtn).toBeInTheDocument();

    // Verify button 3: لمس برای صحبت (Touch to Speak)
    const speakBtn = screen.getByRole('button', { name: /لمس برای صحبت/i });
    expect(speakBtn).toBeInTheDocument();

    // Verify they are within a 3-column grid container
    const parentGrid = writeBtn.parentElement;
    expect(parentGrid).toBeInTheDocument();
    expect(parentGrid?.className).toContain('grid-cols-3');
    expect(parentGrid?.contains(writeBtn)).toBe(true);
    expect(parentGrid?.contains(skipBtn)).toBe(true);
    expect(parentGrid?.contains(speakBtn)).toBe(true);
  });

  test('2. SinglePlayerReportScreen renders completely in Persian when UI language is fa', () => {
    const mockReport: SinglePlayerSessionReport = {
      id: 'rep_123',
      timestamp: new Date().toISOString(),
      settings: {
        targetLanguage: 'nl',
        nativeLanguage: 'fa',
        cefrLevel: 'A1',
        displayMode: 'text_and_audio',
        questionCount: 5,
        timeLimitSeconds: 60,
        autoPlayAudio: false,
        selectedCategories: ['CAT_TRAVEL']
      },
      results: [],
      totalScore: 120,
      totalCards: 5,
      correctFirstTry: 4,
      correctedCount: 1,
      failedCount: 0,
      accuracy: 85,
      bestStreak: 4,
      weakCards: [],
      totalDurationSeconds: 45
    };

    render(
      <SinglePlayerReportScreen
        report={mockReport}
        uiLanguage="fa"
        language="fa"
        onPlayAgain={vi.fn()}
        onPracticeWeakCards={vi.fn()}
        onExit={vi.fn()}
      />
    );

    // Should display Persian grade/praise
    expect(screen.getByText(/بسیار عالی|فوق‌العاده/i)).toBeInTheDocument();

    // Persian labels for metrics
    expect(screen.getByText(/مجموع امتیاز مسابقه/i)).toBeInTheDocument();
    expect(screen.getByText(/درست بار اول/i)).toBeInTheDocument();
    expect(screen.getByText(/تصحیح‌شده/i)).toBeInTheDocument();
    expect(screen.getByText(/زمان کل/i)).toBeInTheDocument();

    // Action buttons in Persian
    expect(screen.getByText(/تمرین مجدد/i)).toBeInTheDocument();
    expect(screen.getByText(/بازگشت به منوی اصلی/i)).toBeInTheDocument();

    // Leaderboard post button in Persian
    expect(screen.getByText(/ثبت رکورد در رده‌بندی جهانی/i)).toBeInTheDocument();
  });

  test('3. Online 1v1 duel matchmaking is located in Duel section and removed from Online Lobby select view', () => {
    const baseSettings: GameSettings = {
      playerCount: 4,
      roundsCount: 3,
      roundDuration: 60,
      difficulty: 'easy',
      cefrLevel: 'A1',
      nativeLanguage: 'fa',
      targetLanguages: ['nl'],
      cardGameMode: 'mixed',
      autoPronounceOnCorrect: true,
      selectedCategories: ['CAT_EVERYDAY'],
      playerNames: ['P1', 'P2', 'P3', 'P4'],
      language: 'fa',
      passPhoneScreenEnabled: false,
      soundEnabled: true,
      powerCardsEnabled: true
    };

    // Render Online Lobby in select mode
    const { unmount } = render(
      <OnlineLobbyScreen
        language="fa"
        initialSettings={baseSettings}
        onStartGame={vi.fn()}
        onBack={vi.fn()}
      />
    );

    // "مچ‌یابی آنلاین دونفره (دوئل سرعتی)" should NOT be in the Online Lobby select mode
    expect(screen.queryByText(/مچ‌یابی آنلاین دونفره \(دوئل سرعتی\)/i)).not.toBeInTheDocument();

    // Player name input on select screen should NOT be there
    expect(screen.queryByText(/نام شما در بازی آنلاین:/i)).not.toBeInTheDocument();

    unmount();

    // Now render DuelSetupModal
    render(
      <DuelSetupModal
        isOpen={true}
        onClose={vi.fn()}
        onStartDuel={vi.fn()}
        onStartOnlineDuel={vi.fn()}
        currentLanguage="nl"
        uiLanguage="fa"
        isRTL={true}
      />
    );

    // Switch to online mode in DuelSetupModal
    const onlineTabBtn = screen.getByRole('button', { name: /۲ گوشی|2 Phones/i });
    fireEvent.click(onlineTabBtn);

    // DuelSetupModal MUST contain the 1v1 online matchmaking banner
    expect(screen.getByRole('button', { name: /مچ‌یابی آنلاین/i })).toBeInTheDocument();
  });

  test('4. Correct target language card generation for German, Dutch, and French', () => {
    // Session for German (de)
    const deCards = getUniqueCardsForSession('de', 'fa', 'all', [], 5, false);
    expect(deCards.length).toBeGreaterThan(0);
    deCards.forEach(c => {
      expect(c.targetLanguage).toBe('de');
      expect(c.targetText).toBeTruthy();
      expect(c.translation).toBeTruthy();
    });

    // Session for Dutch (nl)
    const nlCards = getUniqueCardsForSession('nl', 'fa', 'all', [], 5, false);
    expect(nlCards.length).toBeGreaterThan(0);
    nlCards.forEach(c => {
      expect(c.targetLanguage).toBe('nl');
      expect(c.targetText).toBeTruthy();
      expect(c.translation).toBeTruthy();
    });

    // Session for French (fr)
    const frCards = getUniqueCardsForSession('fr', 'fa', 'all', [], 5, false);
    expect(frCards.length).toBeGreaterThan(0);
    frCards.forEach(c => {
      expect(c.targetLanguage).toBe('fr');
      expect(c.targetText).toBeTruthy();
      expect(c.translation).toBeTruthy();
    });
  });
});
