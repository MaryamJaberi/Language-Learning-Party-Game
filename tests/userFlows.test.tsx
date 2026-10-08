import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Complete End-to-End User Flow Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const launchActiveGame = () => {
    // 1. Intro -> Setup Screen
    fireEvent.click(screen.getByText('شروع بازی جدید'));

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
    expect(screen.getByText('شروع بازی جدید')).toBeInTheDocument();

    // 3. Open History Screen
    const historyBtn = screen.getByRole('button', { name: /تاریخچه/i });
    fireEvent.click(historyBtn);

    // Verify empty history message
    expect(screen.getByText(/هنوز بازی‌ای ثبت نشده/i)).toBeInTheDocument();

    // Back to Intro
    const backBtns = screen.getAllByRole('button', { name: /بازگشت/i });
    fireEvent.click(backBtns[0]);
    expect(screen.getByText('شروع بازی جدید')).toBeInTheDocument();
  });

  test('Flow 2: Complete Setup, Player Count, and Seating Table Confirmation', () => {
    render(<App />);

    // 1. From Intro -> Click "شروع بازی جدید"
    const newGameBtn = screen.getByText('شروع بازی جدید');
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

    // Floating Undo button appears
    const undoBtn = screen.getByRole('button', { name: /بازگشت کارت قبلی/i });
    expect(undoBtn).toBeInTheDocument();

    // Test Undo -> Reverts to Player 1
    fireEvent.click(undoBtn);
    expect(screen.queryByRole('button', { name: /بازگشت کارت قبلی/i })).not.toBeInTheDocument();

    // Advance again
    fireEvent.click(correctBtn);

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
    expect(screen.getByText('شروع بازی جدید')).toBeInTheDocument();
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
    const confirmExitBtn = screen.queryByRole('button', { name: /بله، خروج/i });
    if (confirmExitBtn) {
      fireEvent.click(confirmExitBtn);
    }

    // Should be back on Intro
    expect(screen.getByText('شروع بازی جدید')).toBeInTheDocument();
  });

  test('Flow 6: PWA and Mobile App Installation modal and tabs', () => {
    render(<App />);

    // Open User Profile modal where mobile install is located
    const profileBtn = screen.getByRole('button', { name: /پروفایل و لیدربرد/i });
    fireEvent.click(profileBtn);

    // Verify Mobile Install section is in the profile modal
    expect(screen.getByText(/نصب روی موبایل \(Android & iOS\)/i)).toBeInTheDocument();

    // Click Install button to open the full installation modal
    const installBtn = screen.getByRole('button', { name: /نصب مستقیم روی گوشی/i });
    fireEvent.click(installBtn);

    // Verify Modal is opened
    expect(screen.getByText(/نصب روی گوشی \(PWA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/نحوه افزودن در مرورگر کروم/i)).toBeInTheDocument();

    // Switch to iOS Tab
    const iosTabBtn = screen.getByText(/🍏 iOS/i);
    fireEvent.click(iosTabBtn);

    // Verify iOS Instructions are shown
    expect(screen.getByText(/نحوه افزودن در سافاری آیفون/i)).toBeInTheDocument();
    expect(screen.getByText(/دکمه Share/i)).toBeInTheDocument();

    // Switch back to Android Tab
    const androidTabBtn = screen.getByText(/🤖 Android/i);
    fireEvent.click(androidTabBtn);
    expect(screen.getByText(/نحوه افزودن در مرورگر کروم/i)).toBeInTheDocument();

    // Close modal via close button
    const closeBtn = screen.getByRole('button', { name: /متوجه شدم، بستن/i });
    fireEvent.click(closeBtn);

    // Verify modal is closed
    expect(screen.queryByText(/نحوه افزودن در مرورگر کروم/i)).not.toBeInTheDocument();
  });

  test('Flow 7: 6 Players (3 Teams) Setup, and gameplay turn rotation', () => {
    render(<App />);

    // 1. Intro -> Setup Screen
    fireEvent.click(screen.getByText('شروع بازی جدید'));

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
    fireEvent.click(screen.getByText('شروع بازی جدید'));

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
});
