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
    localStorage.setItem('dor_practice_tour_seen', 'true');
    vi.clearAllMocks();
  });

  test('1. Three buttons (بررسی پاسخ، رد کردن، صحبت) are present side by side in SinglePlayerScreen and hide after correct answer, with unified توقف بازی modal', () => {
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

    const onOpenHelp = vi.fn();
    render(
      <SinglePlayerScreen
        initialCards={mockCards}
        initialSettings={settings}
        uiLanguage="fa"
        onFinish={vi.fn()}
        onExit={vi.fn()}
        onOpenHelp={onOpenHelp}
      />
    );

    // Verify unified Stop Game button in header
    const stopBtn = screen.getByRole('button', { name: /توقف بازی|Stop Game/i });
    expect(stopBtn).toBeInTheDocument();

    // Verify button 1: بررسی پاسخ (Check Answer)
    const checkBtn = screen.getByRole('button', { name: /بررسی پاسخ|Check/i });
    expect(checkBtn).toBeInTheDocument();

    // Verify button 2: رد کردن (Skip card)
    const skipBtn = screen.getByRole('button', { name: /رد کردن|Skip/i });
    expect(skipBtn).toBeInTheDocument();

    // Verify button 3: صحبت (Speak / Voice to Text)
    const speakBtn = screen.getByRole('button', { name: /تبدیل صوت به متن|پاسخ صوتی|صحبت|لمس برای صحبت|Speak|Voice to Text/i });
    expect(speakBtn).toBeInTheDocument();

    // Ensure duplicate submit buttons (ثبت ضبط / ثبت گفتار) do NOT exist
    expect(screen.queryByText(/ثبت ضبط/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ثبت گفتار/i)).not.toBeInTheDocument();

    // Verify they are within a 3-column grid container
    const parentGrid = checkBtn.parentElement;
    expect(parentGrid).toBeInTheDocument();
    expect(parentGrid?.className).toContain('grid-cols-3');
    expect(parentGrid?.contains(checkBtn)).toBe(true);
    expect(parentGrid?.contains(skipBtn)).toBe(true);
    expect(parentGrid?.contains(speakBtn)).toBe(true);

    // Submit correct answer and verify bottom input + 3 buttons disappear
    const textInput = screen.getByPlaceholderText(/جمله را اینجا تایپ کنید/i);
    fireEvent.change(textInput, { target: { value: 'de fiets' } });
    fireEvent.click(checkBtn);

    expect(screen.queryByPlaceholderText(/جمله را اینجا تایپ کنید/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /بررسی پاسخ|Check/i })).not.toBeInTheDocument();
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

  test('5. Team progress bars in TimerDisplay show localized Persian team names (آبی / قرمز) and trigger animate-team-score CSS animation when a team scores', async () => {
    const TimerDisplay = (await import('../components/TimerDisplay')).default;
    const { TeamColor } = await import('../types');

    const initialTeams = [
      { id: 0, color: TeamColor.Blue, timeRemaining: 60000, isEliminated: false, playerIds: [0, 2], score: 2 },
      { id: 1, color: TeamColor.Red, timeRemaining: 60000, isEliminated: false, playerIds: [1, 3], score: 1 }
    ];

    const { rerender } = render(
      <TimerDisplay
        roundTimer={45000}
        teams={initialTeams}
        activeTeamId={0}
        language="fa"
        isRTL={true}
      />
    );

    const blueBar = screen.getByTestId('team-progress-BLUE');
    const redBar = screen.getByTestId('team-progress-RED');

    // Verify Persian team names instead of raw BLUE / RED
    expect(blueBar).toHaveTextContent('آبی');
    expect(redBar).toHaveTextContent('قرمز');
    expect(blueBar.className).not.toContain('animate-team-score');

    // Simulate Blue team scoring (+1 point)
    const updatedTeams = [
      { id: 0, color: TeamColor.Blue, timeRemaining: 58000, isEliminated: false, playerIds: [0, 2], score: 3 },
      { id: 1, color: TeamColor.Red, timeRemaining: 60000, isEliminated: false, playerIds: [1, 3], score: 1 }
    ];

    rerender(
      <TimerDisplay
        roundTimer={43000}
        teams={updatedTeams}
        activeTeamId={0}
        language="fa"
        isRTL={true}
      />
    );

    expect(screen.getByTestId('team-progress-BLUE').className).toContain('animate-team-score');
  });

  test('6. SetupScreen does not mix Persian into English/German UI (shows EN for en-US and localized CEFR levels)', async () => {
    const SetupScreen = (await import('../screens/SetupScreen')).default;

    const enSettings: GameSettings = {
      playerCount: 4,
      roundsCount: 3,
      roundDuration: 60,
      difficulty: 'easy',
      cefrLevel: 'C1',
      nativeLanguage: 'en-US',
      targetLanguages: ['de'],
      cardGameMode: 'mixed',
      autoPronounceOnCorrect: true,
      selectedCategories: ['CAT_EVERYDAY'],
      playerNames: ['P1', 'P2', 'P3', 'P4'],
      language: 'en-US',
      passPhoneScreenEnabled: false,
      soundEnabled: true,
      powerCardsEnabled: true
    };

    const { unmount } = render(
      <SetupScreen
        settings={enSettings}
        onSave={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );

    // Must show Advanced (English), NOT پیشرفته (Persian)
    expect(screen.getAllByText('Advanced').length).toBeGreaterThan(0);
    expect(screen.queryByText('پیشرفته')).not.toBeInTheDocument();
    expect(screen.queryByText('مبتدی')).not.toBeInTheDocument();

    unmount();

    // Also verify German UI
    const deSettings: GameSettings = {
      ...enSettings,
      language: 'de',
      nativeLanguage: 'de',
      targetLanguages: ['en']
    };

    render(
      <SetupScreen
        settings={deSettings}
        onSave={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getAllByText('Fortgeschritten').length).toBeGreaterThan(0);
    expect(screen.queryByText('پیشرفته')).not.toBeInTheDocument();
  });
});

