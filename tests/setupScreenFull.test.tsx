import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SetupScreen from '../screens/SetupScreen';
import { GameSettings } from '../types';
import { sound } from '../soundManager';

const mockDefaultSettings: GameSettings = {
  playerCount: 4,
  roundsCount: 5,
  roundDuration: 6, // 6 seconds to test "۰:۰۶" format
  selectedCategories: ['CAT_EVERYDAY', 'CAT_FOOD'],
  playerNames: ['آرش', 'باران', 'سینا', 'دریا'],
  language: 'fa',
  nativeLanguage: 'fa',
  targetLanguages: ['nl', 'en'],
  soundEnabled: true,
  autoPronounceOnCorrect: true,
  passPhoneScreenEnabled: false,
  cardGameMode: 'mixed'
};

describe('Setup Screen Comprehensive Requirements Suite', () => {
  let settingsState: GameSettings;
  let onSaveMock = vi.fn((newSettings: GameSettings) => {
    settingsState = { ...newSettings };
  });
  let onNextMock = vi.fn();
  let onBackMock = vi.fn();

  beforeEach(() => {
    settingsState = { ...mockDefaultSettings };
    onSaveMock = vi.fn((newSettings: GameSettings) => {
      settingsState = { ...newSettings };
    });
    onNextMock = vi.fn();
    onBackMock = vi.fn();
  });

  it('1. Removes native language from learning chips and maintains at least one learning language', () => {
    const { rerender } = render(
      <SetupScreen
        settings={settingsState}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    // Learning chips section should not contain Farsi (native)
    const targetGroup = screen.getByRole('group', { name: /زبان‌هایی که می‌خوام یاد بگیرم/ });
    expect(targetGroup).toBeInTheDocument();

    // Check that 'فارسی' is not in targetGroup
    const persianInTargets = Array.from(targetGroup.querySelectorAll('button')).find(btn => btn.textContent?.includes('فارسی'));
    expect(persianInTargets).toBeUndefined();

    // Clicking an active target chip ('nl') to toggle it off when 2 are selected
    const dutchChip = Array.from(targetGroup.querySelectorAll('button')).find(btn => btn.textContent?.includes('Nederlands'));
    expect(dutchChip).toBeDefined();
    fireEvent.click(dutchChip!);

    expect(onSaveMock).toHaveBeenCalled();
    const updatedSettings = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(updatedSettings.targetLanguages).not.toContain('nl');
    expect(updatedSettings.targetLanguages).toContain('en');

    // Update settingsState to reflect having only 1 language left ('en')
    settingsState = { ...settingsState, targetLanguages: ['en'] };
    rerender(
      <SetupScreen
        settings={settingsState}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    // Trying to turn off the last language ('en') should NOT remove it and should display an actionable error
    const englishChip = Array.from(screen.getByRole('group', { name: /زبان‌هایی که می‌خوام یاد بگیرم/ }).querySelectorAll('button')).find(btn => btn.textContent?.includes('English'));
    expect(englishChip).toBeDefined();
    fireEvent.click(englishChip!);

    // Should display actionable message with solution
    expect(screen.getByText(/حداقل یک زبان برای یادگیری باید انتخاب شود/)).toBeInTheDocument();
    expect(screen.getByText(/راه‌حل:/)).toBeInTheDocument();
  });

  it('2. Player count (4 / 6 / 8) is single-select and switches active state cleanly', () => {
    render(
      <SetupScreen
        settings={settingsState}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const btn6 = screen.getByRole('button', { name: /6 بازیکن|۶ بازیکن/ });
    const btn4 = screen.getByRole('button', { name: /4 بازیکن|۴ بازیکن/ });

    expect(btn4).toHaveAttribute('aria-checked', 'true');
    expect(btn6).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(btn6);
    expect(onSaveMock).toHaveBeenCalled();
    const lastSaved = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(lastSaved.playerCount).toBe(6);
  });

  it('3. Formats Persian time with leading zeros correctly (e.g. ۰:۰۶ and ۱:۰۰)', () => {
    // 6 seconds should format as ۰:۰۶
    render(
      <SetupScreen
        settings={{ ...mockDefaultSettings, roundDuration: 6 }}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const timeWheel = screen.getByRole('spinbutton', { name: 'زمان هر نوبت' });
    expect(timeWheel).toBeInTheDocument();
    expect(timeWheel).toHaveAttribute('aria-valuetext', '۰:۰۶');
  });

  it('4. TumblerWheel supports keyboard navigation (ArrowDown, ArrowUp, Home, End)', () => {
    const StatefulWrapper = () => {
      const [currentSettings, setCurrentSettings] = React.useState({ ...mockDefaultSettings, roundsCount: 5 });
      return (
        <SetupScreen
          settings={currentSettings}
          onSave={(s) => {
            setCurrentSettings(s);
            onSaveMock(s);
          }}
          onNext={onNextMock}
          onBack={onBackMock}
        />
      );
    };

    render(<StatefulWrapper />);

    const roundsWheel = screen.getByRole('spinbutton', { name: 'تعداد راند' });
    expect(roundsWheel).toHaveAttribute('aria-valuenow', '5');

    // Press ArrowDown to increase rounds to 6
    fireEvent.keyDown(roundsWheel, { key: 'ArrowDown' });
    expect(onSaveMock).toHaveBeenCalled();
    let latest = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(latest.roundsCount).toBe(6);

    // Press ArrowUp to decrease rounds back to 5
    fireEvent.keyDown(roundsWheel, { key: 'ArrowUp' });
    latest = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(latest.roundsCount).toBe(5);

    // Press Home to jump to minimum round (3)
    fireEvent.keyDown(roundsWheel, { key: 'Home' });
    latest = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(latest.roundsCount).toBe(3);

    // Press End to jump to maximum round (10)
    fireEvent.keyDown(roundsWheel, { key: 'End' });
    latest = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(latest.roundsCount).toBe(10);
  });

  it('5. Both switches (auto-pronunciation and hot-seat) toggle correctly', () => {
    const { rerender } = render(
      <SetupScreen
        settings={{ ...mockDefaultSettings, autoPronounceOnCorrect: true, passPhoneScreenEnabled: false }}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const autoSwitch = screen.getByRole('switch', { name: 'تلفظ خودکار' });
    const hotSeatSwitch = screen.getByRole('switch', { name: 'صندلی داغ' });

    expect(autoSwitch).toHaveAttribute('aria-checked', 'true');
    expect(hotSeatSwitch).toHaveAttribute('aria-checked', 'false');

    // Toggle auto-pronounce OFF
    fireEvent.click(autoSwitch);
    expect(onSaveMock).toHaveBeenCalled();
    let saved = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(saved.autoPronounceOnCorrect).toBe(false);

    // Toggle hot-seat ON
    fireEvent.click(hotSeatSwitch);
    saved = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(saved.passPhoneScreenEnabled).toBe(true);
  });

  it('6. Translation direction has 3 states and only one active', () => {
    render(
      <SetupScreen
        settings={{ ...mockDefaultSettings, cardGameMode: 'mixed' }}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const dirGroup = screen.getByRole('radiogroup', { name: 'جهت ترجمه کارت‌ها' });
    const buttons = dirGroup.querySelectorAll('button');
    expect(buttons).toHaveLength(3);

    // Initial is 'mixed' ('هر دو')
    const mixedBtn = Array.from(buttons).find(b => b.textContent?.includes('هر دو'));
    expect(mixedBtn).toHaveAttribute('aria-checked', 'true');

    // Click standard mode
    const standardBtn = Array.from(buttons).find(b => b.textContent?.includes('زبان یادگیری ← زبان من'));
    fireEvent.click(standardBtn!);
    const saved = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(saved.cardGameMode).toBe('standard');
  });

  it('7. Sound mute/unmute button works and syncs with sound system', () => {
    const setMutedSpy = vi.spyOn(sound, 'setMuted');
    render(
      <SetupScreen
        settings={mockDefaultSettings}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const soundBtn = document.getElementById('soundBtn') || screen.getByTitle(/صدا/);
    expect(soundBtn).toBeInTheDocument();

    fireEvent.click(soundBtn!);
    expect(setMutedSpy).toHaveBeenCalled();
    const saved = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(saved.soundEnabled).toBeDefined();
  });

  it('8. Guide bottom sheet opens and closes with outside click and with "فهمیدم" button', () => {
    render(
      <SetupScreen
        settings={mockDefaultSettings}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const hintBtn = screen.getByRole('button', { name: /راهنما/ });
    fireEvent.click(hintBtn);

    const sheet = document.getElementById('sheet');
    expect(sheet).not.toHaveAttribute('hidden');

    const understandBtn = screen.getByRole('button', { name: 'فهمیدم' });
    fireEvent.click(understandBtn);
    expect(sheet).toHaveAttribute('hidden');

    // Reopen and close via backdrop click
    fireEvent.click(hintBtn);
    expect(sheet).not.toHaveAttribute('hidden');
    fireEvent.click(sheet!);
    expect(sheet).toHaveAttribute('hidden');
  });

  it('9. UI language menu opens and saves selection', () => {
    render(
      <SetupScreen
        settings={mockDefaultSettings}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const langBtn = screen.getByRole('button', { name: 'زبان برنامه' });
    fireEvent.click(langBtn);

    const pop = document.getElementById('uiPop');
    expect(pop).not.toHaveAttribute('hidden');

    // Select English UI
    const englishOption = screen.getByRole('menuitemradio', { name: /English/ });
    fireEvent.click(englishOption);

    expect(pop).toHaveAttribute('hidden');
    const saved = onSaveMock.mock.calls[onSaveMock.mock.calls.length - 1][0];
    expect(saved.language).toBe('en');
  });

  it('10. Next button calls onNext properly', () => {
    render(
      <SetupScreen
        settings={mockDefaultSettings}
        onSave={onSaveMock}
        onNext={onNextMock}
        onBack={onBackMock}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /مرحله بعد: شروع بازی/ });
    fireEvent.click(nextBtn);
    expect(onNextMock).toHaveBeenCalled();
  });
});
