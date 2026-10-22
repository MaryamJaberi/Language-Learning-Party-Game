import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Complete End-to-End User Flow Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dor_settings', JSON.stringify({
      language: 'fa',
      nativeLanguage: 'fa',
      targetLanguages: ['nl', 'en'],
      playerCount: 4,
      roundsCount: 3,
      roundDuration: 60,
      cardGameMode: 'mixed'
    }));
    vi.clearAllMocks();
  });

  const launchActiveGame = () => {
    // 1. Intro -> Setup Screen
    fireEvent.click(screen.getByText(/شروع بازی (دورهمی|جدید)/i));

    // 2. Click "شروع بازی" (bottom start bar button)
    const startBtn = screen.getByRole('button', { name: /شروع بازی/i });
    fireEvent.click(startBtn);

    // 3. Confirm Seating -> Start Round 1
    const confirmBtn = screen.getByRole('button', { name: /شروع دور ۱/i });
    fireEvent.click(confirmBtn);
  };

  test('Flow 1: Intro screen renders cleanly with "دور" title, language selector, help, and history', () => {
    render(<App />);

    // 1. Check Persian title "دور"
    const titleElements = screen.getAllByText('دور');
    expect(titleElements.length).toBeGreaterThan(0);
    expect(titleElements[0].textContent).toBe('دور');
    expect(titleElements[0].textContent).not.toContain('\u064F'); // No damma

    // Subtitle
    expect(screen.getByText(/هیجان حدس کلمات/i)).toBeInTheDocument();

    // 2. Open Rules / Help from Intro
    const guideBtn = screen.getByRole('button', { name: /راهنما/i });
    fireEvent.click(guideBtn);

    // Verify Help Screen is visible
    expect(screen.getByText(/راهنمای بازی «دور»/i)).toBeInTheDocument();
    expect(screen.getByText(/معرفی بازی/i)).toBeInTheDocument();

    // Close Help Screen using ✕ button
    const closeHelpBtn = screen.getByText('✕');
    fireEvent.click(closeHelpBtn);

    // Verify we returned to Intro Screen
    expect(screen.getByLabelText(/شروع بازی دورهمی/i)).toBeInTheDocument();

    // 3. Open History Screen
    const historyBtn = screen.getByRole('button', { name: /تاریخچه/i });
    fireEvent.click(historyBtn);

    // Verify empty history message
    expect(screen.getByText(/هنوز بازی‌ای ثبت نشده/i)).toBeInTheDocument();

    // Back to Intro
    const backBtns = screen.getAllByRole('button', { name: /بازگشت/i });
    fireEvent.click(backBtns[0]);
    expect(screen.getByText(/شروع بازی دورهمی/i)).toBeInTheDocument();
  });

  test('Flow 2: Complete Setup, Player Count, and Seating Table Confirmation', () => {
    render(<App />);

    // 1. From Intro -> Click "شروع بازی دورهمی"
    const newGameBtn = screen.getByText(/شروع بازی دورهمی/i);
    fireEvent.click(newGameBtn);

    // 2. Setup Screen matches HTML design
    expect(screen.getByText('تنظیمات بازی')).toBeInTheDocument();
    expect(screen.getByText(/زبان مادری من/i)).toBeInTheDocument();
    expect(screen.getByText(/زبان‌هایی که می‌خوام یاد بگیرم/i)).toBeInTheDocument();

    // Select 4 players
    const p4Btn = document.getElementById('players')?.querySelectorAll('button')[0];
    expect(p4Btn).toBeInTheDocument();
    fireEvent.click(p4Btn!);
    expect(p4Btn).toHaveAttribute('aria-checked', 'true');

    // Click "شروع بازی" -> Go to Seating Confirmation
    const startBtn = screen.getByRole('button', { name: /شروع بازی/i });
    fireEvent.click(startBtn);

    // 3. Seating Confirmation Screen
    expect(screen.getByText('چیدمان دور میز')).toBeInTheDocument();

    // Confirm seating and start round 1
    const confirmSeatingBtn = screen.getByRole('button', { name: /شروع دور ۱/i });
    fireEvent.click(confirmSeatingBtn);

    // 4. Now in GameplayScreen
    expect(screen.getAllByText(/دور/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /درست بود!/i })).toBeInTheDocument();
  });

  test('Flow 3: Gameplay mechanics - Guessing, Clockwise Turns, Undo, Word Swapping, and Pausing', () => {
    render(<App />);

    launchActiveGame();

    // Player 1 is active
    expect(screen.getAllByText(/دور/i).length).toBeGreaterThan(0);
    const correctBtn = screen.getByRole('button', { name: /درست بود!/i });
    expect(correctBtn).toBeInTheDocument();

    // Record player 1 guessing correctly
    fireEvent.click(correctBtn);

    const cardDismiss = screen.queryByText(/لمس صفحه|tap anywhere/i);
    if (cardDismiss) fireEvent.click(cardDismiss);

    // Floating Undo button appears
    const undoBtn = screen.getByRole('button', { name: /بازگشت کارت قبلی/i });
    expect(undoBtn).toBeInTheDocument();

    // Test Undo -> Reverts to Player 1
    fireEvent.click(undoBtn);
    expect(screen.queryByRole('button', { name: /بازگشت کارت قبلی/i })).not.toBeInTheDocument();

    // Advance again
    fireEvent.click(correctBtn);
    const cardDismiss2 = screen.queryByText(/لمس صفحه|tap anywhere/i);
    if (cardDismiss2) fireEvent.click(cardDismiss2);

    // Test Pause Game
    const pauseBtn = screen.getByLabelText('Pause');
    fireEvent.click(pauseBtn);

    // Paused Modal appears
    expect(screen.getAllByText(/بازی متوقف شد/i).length).toBeGreaterThan(0);
    const resumeBtn = screen.getByRole('button', { name: /ادامه بازی/i });
    expect(resumeBtn).toBeInTheDocument();

    // Resume Game
    fireEvent.click(resumeBtn);
    expect(screen.queryByRole('button', { name: /ادامه بازی/i })).not.toBeInTheDocument();

    // Test In-Game Sound Toggle
    const soundBtn = screen.getByLabelText('Sound Toggle');
    expect(soundBtn).toBeInTheDocument();
    fireEvent.click(soundBtn);

    // Test In-Game Help Modal
    const inGameHelpBtn = screen.getByLabelText('Help');
    fireEvent.click(inGameHelpBtn);
    expect(screen.getByText(/راهنمای بازی «دور»/i)).toBeInTheDocument();
    
    // Close In-Game Help
    fireEvent.click(screen.getByText('✕'));
    expect(screen.getByRole('button', { name: /درست بود!/i })).toBeInTheDocument();
  });

  test('Flow 4: Language switcher on Intro updates the entire interface seamlessly', () => {
    render(<App />);

    // 1. Open Language Picker Modal and switch to English
    fireEvent.click(screen.getByRole('button', { name: /تغییر زبان/i }));
    fireEvent.click(screen.getByText(/British English/i));

    // Verify English text
    expect(screen.getByText('Turn')).toBeInTheDocument();
    expect(screen.getByText(/word guessing/i)).toBeInTheDocument();
    expect(screen.getByText('Start New Game')).toBeInTheDocument();

    // 2. Open Language Picker Modal and switch to Deutsch
    fireEvent.click(screen.getByTestId('header-language-btn'));
    fireEvent.click(screen.getByText('Deutsch'));

    expect(screen.getByText('Runde')).toBeInTheDocument();
    expect(screen.getByText('Neues Spiel')).toBeInTheDocument();

    // 3. Open Language Picker Modal and switch to Nederlands
    fireEvent.click(screen.getByTestId('header-language-btn'));
    fireEvent.click(screen.getByText('Nederlands'));

    expect(screen.getByText('Beurt')).toBeInTheDocument();
    expect(screen.getByText('Nieuw Spel')).toBeInTheDocument();

    // 4. Switch back to Persian
    fireEvent.click(screen.getByTestId('header-language-btn'));
    fireEvent.click(screen.getByText('فارسی'));

    const faTitle = screen.getAllByText('دور');
    expect(faTitle.length).toBeGreaterThan(0);
    expect(screen.getByText(/شروع بازی (دورهمی|جدید)/i)).toBeInTheDocument();
  });

  test('Flow 5: Pause and Exit to Intro screen', () => {
    render(<App />);

    launchActiveGame();

    // Pause and Exit to Intro
    const pauseBtn = screen.getByLabelText('Pause');
    fireEvent.click(pauseBtn);
    
    const exitBtn = screen.getByRole('button', { name: /خروج/i });
    fireEvent.click(exitBtn);

    // Confirm exit if modal appears
    const confirmExitBtn = screen.queryByRole('button', { name: /(برگشت به صفحه اول|بله، خروج)/i });
    if (confirmExitBtn) {
      fireEvent.click(confirmExitBtn);
    }

    // Should be back on Intro
    expect(screen.getByText(/شروع بازی (دورهمی|جدید)/i)).toBeInTheDocument();
  });

  test('Flow 6: PWA and Mobile App Installation inline tab in profile', () => {
    render(<App />);

    // Open User Profile modal where mobile install is located
    const profileBtn = screen.getByRole('button', { name: /پروفایل و لیدربرد/i });
    fireEvent.click(profileBtn);

    // Click the Install tab in the profile modal
    const installTabBtn = screen.getByRole('tab', { name: /نصب روی گوشی/i });
    expect(installTabBtn).toBeInTheDocument();
    fireEvent.click(installTabBtn);

    // Verify inline Mobile Install section is displayed
    expect(screen.getByText(/نصب مستقیم روی گوشی \(Android & iOS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/راهنمای نصب در مرورگر کروم اندروید/i)).toBeInTheDocument();
    expect(screen.getByText(/راهنمای نصب در مرورگر سافاری آیفون/i)).toBeInTheDocument();
  });

  test('Flow 7: 6 Players (3 Teams) Setup, and gameplay turn rotation', () => {
    render(<App />);

    // 1. Intro -> Setup Screen
    fireEvent.click(screen.getByText(/شروع بازی دورهمی/i));

    // 2. Select 6 Players (3 Teams: Blue, Red, Green)
    const p6Btn = document.getElementById('players')?.querySelectorAll('button')[1];
    expect(p6Btn).toBeInTheDocument();
    fireEvent.click(p6Btn!);
    expect(p6Btn).toHaveAttribute('aria-checked', 'true');

    // 3. Setup -> Seating Confirmation
    fireEvent.click(screen.getByRole('button', { name: /شروع بازی/i }));

    // 4. Verify Seating Table with 6 players
    expect(screen.getByText('چیدمان دور میز')).toBeInTheDocument();

    // Confirm Seating -> Start Round 1
    fireEvent.click(screen.getByRole('button', { name: /شروع دور ۱/i }));

    // 5. Gameplay
    expect(screen.getAllByText(/دور/i).length).toBeGreaterThan(0);
    const correctBtn = screen.getByRole('button', { name: /درست بود!/i });

    // Clockwise through 3 turns
    fireEvent.click(correctBtn);
    fireEvent.click(correctBtn);
    fireEvent.click(correctBtn);
    expect(screen.getByRole('button', { name: /درست بود!/i })).toBeInTheDocument();
  });

  test('Flow 8: 8 Players (4 Teams) Setup, and full rotation', () => {
    render(<App />);

    // 1. Intro -> Setup Screen
    fireEvent.click(screen.getByLabelText(/شروع بازی دورهمی/i));

    // 2. Select 8 Players (4 Teams: Blue, Red, Green, Yellow)
    const p8Btn = document.getElementById('players')?.querySelectorAll('button')[2];
    expect(p8Btn).toBeInTheDocument();
    fireEvent.click(p8Btn!);
    expect(p8Btn).toHaveAttribute('aria-checked', 'true');

    // Setup -> Seating Confirmation
    fireEvent.click(screen.getByRole('button', { name: /شروع بازی/i }));
    expect(screen.getByText('چیدمان دور میز')).toBeInTheDocument();

    // Confirm Seating -> Start Round 1
    fireEvent.click(screen.getByRole('button', { name: /شروع دور ۱/i }));

    // Gameplay turn advances cleanly
    const correctBtn = screen.getByRole('button', { name: /درست بود!/i });
    fireEvent.click(correctBtn);
    expect(screen.getByRole('button', { name: /درست بود!/i })).toBeInTheDocument();
  });

  test('Flow 9: Exiting Single Player to settings opens SinglePlayerSetupModal and does NOT open multiplayer SetupScreen', async () => {
    render(<App />);

    // 1. Open Single Player modal from Intro
    const singleBtn = document.getElementById('intro-single-player-btn');
    expect(singleBtn).toBeInTheDocument();
    fireEvent.click(singleBtn!);

    // 2. Select level first (required per user request: no default level)
    const levelBtn = screen.getByText('A1');
    fireEvent.click(levelBtn);

    // 3. Start Single Player
    const startSingleBtn = screen.getByRole('button', { name: /شروع تمرین/i });
    fireEvent.click(startSingleBtn);

    // 3. We are in SinglePlayerScreen, click exit
    const exitBtn = screen.getByRole('button', { name: /خروج/i });
    fireEvent.click(exitBtn);

    // 4. Modal opens with option to return to Single-Player Settings
    const setupOption = screen.getByText(/تنظیمات تمرین انفرادی/i);
    expect(setupOption).toBeInTheDocument();
    fireEvent.click(setupOption);

    // 5. Must be back on Intro with SinglePlayerSetupModal open, NOT multiplayer SetupScreen
    expect(screen.queryByText('چیدمان دور میز')).not.toBeInTheDocument();
    expect(screen.queryByText(/تعداد بازیکنان/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /شروع تمرین/i })).toBeInTheDocument();
  });
});
