import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';
import { SeatingConfirmScreen } from '../screens/SeatingConfirmScreen';
import { ExitConfirmModal } from '../components/ExitConfirmModal';
import { DuelScreen } from '../screens/DuelScreen';
import { DEFAULT_SETTINGS, COLORS_MAP } from '../constants';
import { TeamColor, Player, Team } from '../types';

describe('Comprehensive Usability, Quality, and End-to-End Audit', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /* -------------------------------------------------------------------------
   * 1. SINGLE LEARNING LANGUAGE CHIP & REMOVAL CROSS TEST
   * ------------------------------------------------------------------------- */
  test('1. SetupScreen enforces strictly single learning language tag with instant select and removal cross', () => {
    render(<App />);

    // Click start to go from Intro to Setup
    const startBtn = screen.getByText(/شروع بازی (دورهمی|جدید)/i);
    fireEvent.click(startBtn);

    // Locate the active learning language tag chip
    const tagChip = screen.getByTestId('target-lang-tag');
    expect(tagChip).toBeInTheDocument();

    // Verify there is a removal cross role="button" on the chip
    const removeBtn = tagChip.querySelector('[role="button"]');
    expect(removeBtn).toBeInTheDocument();

    // Tap the removal cross (×)
    fireEvent.click(removeBtn!);

    // Dropdown is open; select English
    const targetGroup = screen.getByRole('group', { name: /زبان‌هایی که می‌خوام یاد بگیرم/ });
    const englishOption = Array.from(targetGroup.querySelectorAll('button')).find(btn => btn.textContent?.includes('English'));
    expect(englishOption).toBeDefined();
    fireEvent.click(englishOption!);

    // Verify English is now the active tag
    expect(screen.getByTestId('target-lang-tag')).toHaveTextContent(/English/i);

    // Verify "تایید و بستن" button does NOT exist
    expect(screen.queryByText(/تایید و بستن/i)).not.toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------
   * 2. TABLE SEATING CIRCLE, AVATARS, AND EDITABLE NAMES
   * ------------------------------------------------------------------------- */
  test('2. SeatingConfirmScreen renders player avatars, full names, tap-to-edit modal, and randomize button', () => {
    const mockPlayers: Player[] = [
      { id: 0, name: 'سارا', avatar: '🦊', teamId: 0, teamColor: TeamColor.Blue },
      { id: 1, name: 'علی', avatar: '🦁', teamId: 1, teamColor: TeamColor.Red },
      { id: 2, name: 'مریم', avatar: '🐼', teamId: 0, teamColor: TeamColor.Blue },
      { id: 3, name: 'رضا', avatar: '🐨', teamId: 1, teamColor: TeamColor.Red }
    ];

    const mockTeams: Team[] = [
      { id: 0, color: TeamColor.Blue, timeRemaining: 60000, isEliminated: false, playerIds: [0, 2] },
      { id: 1, color: TeamColor.Red, timeRemaining: 60000, isEliminated: false, playerIds: [1, 3] }
    ];

    const onUpdatePlayer = vi.fn();
    const onRandomizePlayers = vi.fn();
    const onConfirm = vi.fn();
    const onExitSetup = vi.fn();
    const onExitHome = vi.fn();

    const mockSettings = {
      playerCount: 4 as const,
      roundsCount: 5,
      roundDuration: 60,
      selectedCategories: ['CAT_EVERYDAY'],
      playerNames: ['سارا', 'علی', 'مریم', 'رضا'],
      language: 'fa' as const,
      targetLanguages: ['nl' as const]
    };

    render(
      <SeatingConfirmScreen
        settings={mockSettings}
        teams={mockTeams}
        players={mockPlayers}
        onConfirm={onConfirm}
        onBack={onExitSetup}
        onExitSetup={onExitSetup}
        onExitHome={onExitHome}
        onUpdatePlayer={onUpdatePlayer}
        onRandomizePlayers={onRandomizePlayers}
      />
    );

    // Check that player names and avatars are rendered
    expect(screen.getAllByText('سارا').length).toBeGreaterThan(0);
    expect(screen.getAllByText('علی').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🦊').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🦁').length).toBeGreaterThan(0);

    // Randomize button exists and triggers callback
    const randomizeBtn = screen.getByTitle(/تغییر تصادفی نام‌ها و آواتارها/i);
    expect(randomizeBtn).toBeInTheDocument();
    fireEvent.click(randomizeBtn);
    expect(onRandomizePlayers).toHaveBeenCalledTimes(1);

    // Tap on a player's seat to open edit modal
    const saraSeat = screen.getByTestId('player-seat-0');
    fireEvent.click(saraSeat);

    // Edit modal should open
    expect(screen.getByText(/ویرایش بازیکن ۱/i)).toBeInTheDocument();

    // Change player name in modal
    const nameInput = screen.getByPlaceholderText(/نام بازیکن/i);
    fireEvent.change(nameInput, { target: { value: 'نگار' } });

    // Pick avatar
    const owlAvatar = screen.getByText('🦉');
    fireEvent.click(owlAvatar);

    // Click save
    const saveBtn = screen.getByText(/ثبت تغییرات/i);
    fireEvent.click(saveBtn);

    expect(onUpdatePlayer).toHaveBeenCalledWith(0, 'نگار', '🦉');
  });

  /* -------------------------------------------------------------------------
   * 3. THREE-WAY EXIT CONFIRMATION MODAL TESTS
   * ------------------------------------------------------------------------- */
  test('3. ExitConfirmModal provides Return to Home, Return to Settings, and Cancel options', () => {
    const onCancel = vi.fn();
    const onExitHome = vi.fn();
    const onExitSetup = vi.fn();

    const { rerender } = render(
      <ExitConfirmModal
        isOpen={true}
        isRTL={true}
        onCancel={onCancel}
        onExitHome={onExitHome}
        onExitSetup={onExitSetup}
      />
    );

    // Option 1: Return to Home Screen
    const homeBtn = screen.getByText(/برگشت به صفحه اول/i);
    expect(homeBtn).toBeInTheDocument();
    fireEvent.click(homeBtn);
    expect(onExitHome).toHaveBeenCalledTimes(1);

    // Option 2: Return to Game Settings
    const setupBtn = screen.getByText(/برگشت به صفحه تنظیمات/i);
    expect(setupBtn).toBeInTheDocument();
    fireEvent.click(setupBtn);
    expect(onExitSetup).toHaveBeenCalledTimes(1);

    // Option 3: Cancel / Keep Playing button
    const keepPlayingBtn = screen.getByText(/پشیمان شدم \(ادامه بازی 🎮\)/i);
    expect(keepPlayingBtn).toBeInTheDocument();
    fireEvent.click(keepPlayingBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Option 4: Top-corner Cross (×) to cancel
    const crossBtn = screen.getByLabelText(/بستن پنجره خروج/i);
    expect(crossBtn).toBeInTheDocument();
    fireEvent.click(crossBtn);
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  /* -------------------------------------------------------------------------
   * 4. DUEL 1v1 MODE REFLEX, SHOCK, AND EXIT VERIFICATION
   * ------------------------------------------------------------------------- */
  test('4. DuelScreen renders avatars, shock power-up, and connects to ExitConfirmModal', () => {
    const onExit = vi.fn();
    const onExitHome = vi.fn();
    const onExitSetup = vi.fn();

    const duelCards = [
      {
        id: 'card-1',
        targetLanguage: 'nl' as const,
        cefrLevel: 'A1' as const,
        topic: 'Basics',
        contentType: 'word' as const,
        learningMode: 'Explain' as const,
        prompt: 'Say hello in Dutch',
        targetText: 'Hallo',
        translation: 'سلام',
        difficulty: 'easy' as const,
        points: 1
      },
      {
        id: 'card-2',
        targetLanguage: 'nl' as const,
        cefrLevel: 'A1' as const,
        topic: 'Basics',
        contentType: 'word' as const,
        learningMode: 'Explain' as const,
        prompt: 'Say thank you in Dutch',
        targetText: 'Dank je',
        translation: 'ممنون',
        difficulty: 'easy' as const,
        points: 1
      }
    ];

    const duelSettings = {
      player1Name: 'سارا',
      player1Avatar: '🕹️',
      player2Name: 'علی',
      player2Avatar: '👾',
      targetLanguage: 'nl' as const,
      nativeLanguage: 'fa' as const,
      cefrLevel: 'A1' as const,
      winningScore: 5,
      faceToFaceRotation: true,
      sabotageEnabled: true
    };

    render(
      <DuelScreen
        settings={duelSettings}
        cards={duelCards}
        uiLanguage="fa"
        onExit={onExit}
        onExitHome={onExitHome}
        onExitSetup={onExitSetup}
        isRTL={true}
      />
    );

    // Verify player names and avatars
    expect(screen.getByText('سارا')).toBeInTheDocument();
    expect(screen.getByText('علی')).toBeInTheDocument();
    expect(screen.getByText('🕹️')).toBeInTheDocument();
    expect(screen.getByText('👾')).toBeInTheDocument();

    // Verify Sabotage Shock triggers
    const shockButtons = screen.getAllByTitle(/شوک سرعت حریف/i);
    expect(shockButtons.length).toBeGreaterThan(0);
    fireEvent.click(shockButtons[0]);

    // Open Exit Modal in Duel
    const duelExitBtn = screen.getByTitle(/خروج از بازی/i);
    fireEvent.click(duelExitBtn);

    // Verify ExitConfirmModal renders inside Duel
    expect(screen.getByText(/برگشت به صفحه اول/i)).toBeInTheDocument();
    expect(screen.getByText(/برگشت به صفحه تنظیمات/i)).toBeInTheDocument();

    // Clicking Return to Settings fires onExitSetup
    const setupExitBtn = screen.getByText(/برگشت به صفحه تنظیمات/i);
    fireEvent.click(setupExitBtn);
    expect(onExitSetup).toHaveBeenCalledTimes(1);
  });

  /* -------------------------------------------------------------------------
   * 5. E2E PARTY MATCH FLOW WITH PASS PHONE AND IN-GAME EXIT
   * ------------------------------------------------------------------------- */
  test('5. Complete party game flow: Setup -> Seating -> Game -> Exit to Setup', () => {
    render(<App />);

    // Step 1: Start party game from Intro
    const startPartyBtn = screen.getByText(/شروع بازی (دورهمی|جدید)/i);
    fireEvent.click(startPartyBtn);

    // Step 2: Next from Setup to Seating Confirmation
    const nextToSeatingBtn = screen.getByRole('button', { name: /مرحله بعد: شروع بازی|ادامه به چیدمان دور میز/i });
    fireEvent.click(nextToSeatingBtn);

    // Step 3: Verify on Seating Screen
    expect(screen.getByText(/چیدمان دور میز/i)).toBeInTheDocument();

    // Step 4: Start Round 1
    const startRound1Btn = screen.getByRole('button', { name: /شروع دور ۱|آماده‌ایم، شروع بازی!/i });
    fireEvent.click(startRound1Btn);

    // Step 5: Verify in Active Game
    const exitGameBtn = screen.getByLabelText('Exit Game');
    expect(exitGameBtn).toBeInTheDocument();
    fireEvent.click(exitGameBtn);

    // Exit modal appears
    expect(screen.getByText(/برگشت به صفحه تنظیمات/i)).toBeInTheDocument();

    // Click Return to Settings
    const returnToSetupBtn = screen.getByText(/برگشت به صفحه تنظیمات/i);
    fireEvent.click(returnToSetupBtn);

    // Verify we are back on Setup Screen
    expect(screen.getByRole('group', { name: /زبان‌هایی که می‌خوام یاد بگیرم/ })).toBeInTheDocument();
  });
});
