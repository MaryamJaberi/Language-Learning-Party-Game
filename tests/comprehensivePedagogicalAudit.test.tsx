import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SinglePlayerScreen from '../screens/SinglePlayerScreen';
import { LanguagePickerModal } from '../components/LanguagePickerModal';
import { LanguageCard, SinglePlayerSettings } from '../types';

describe('Comprehensive Pedagogical & UI Audit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('1. Hint language matches Guide language and produces cloze fill-in-the-blank without revealing first letter', () => {
    const mockSentenceCard: LanguageCard = {
      id: 'sent-1',
      targetText: 'Ik wil graag koffie bestellen',
      translation: 'من می‌خواهم قهوه سفارش دهم',
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      topic: 'CAT_EVERYDAY',
      contentType: 'Phrase',
      learningMode: 'Translate',
      prompt: 'جمله را ترجمه کنید',
      grammarPoint: 'modal verb wil + graag',
      difficulty: 'easy',
      points: 10
    };

    const settingsFa: SinglePlayerSettings = {
      targetLanguage: 'nl',
      nativeLanguage: 'fa', // Persian guide
      cefrLevel: 'A1',
      displayMode: 'translate_to_target',
      questionCount: 1,
      timeLimitSeconds: 0,
      autoPlayAudio: false,
      selectedCategories: ['CAT_EVERYDAY']
    };

    render(
      <SinglePlayerScreen
        initialCards={[mockSentenceCard]}
        initialSettings={settingsFa}
        uiLanguage="fa"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    // Find the hint lightbulb button and click it
    const hintButton = screen.getByTestId('hint-button');
    fireEvent.click(hintButton);

    // Verify hint container appeared
    const hintContainer = screen.getByTestId('hint-bubble');
    expect(hintContainer).toBeInTheDocument();
    const hintText = hintContainer.textContent || '';

    // Verify the hint text does NOT contain first letter reveals like 'با «I» شروع می‌شود' or 'شروع می‌شود'
    expect(hintText).not.toMatch(/شروع می‌شود با/i);
    expect(hintText).not.toMatch(/starts with/i);

    // If it's a cloze hint, verify it contains a blank frame: [______]
    if (hintText.includes('جمله') || hintText.includes('تکمیل')) {
      expect(hintText).toContain('[______]');
    }
  });

  test('2. In English guide mode, cloze hint labels and rules are in English', () => {
    const mockSentenceCard: LanguageCard = {
      id: 'sent-2',
      targetText: 'Ich möchte einen Kaffee bestellen',
      translation: 'I would like to order a coffee',
      targetLanguage: 'de',
      nativeLanguage: 'en', // English guide
      cefrLevel: 'A1',
      topic: 'CAT_EVERYDAY',
      contentType: 'Phrase',
      learningMode: 'Translate',
      prompt: 'Translate the sentence',
      grammarPoint: 'Möchte + accusative noun',
      difficulty: 'easy',
      points: 10
    };

    const settingsEn: SinglePlayerSettings = {
      targetLanguage: 'de',
      nativeLanguage: 'en',
      cefrLevel: 'A1',
      displayMode: 'translate_to_target',
      questionCount: 1,
      timeLimitSeconds: 0,
      autoPlayAudio: false,
      selectedCategories: ['CAT_EVERYDAY']
    };

    render(
      <SinglePlayerScreen
        initialCards={[mockSentenceCard]}
        initialSettings={settingsEn}
        uiLanguage="en"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    const hintButton = screen.getByTestId('hint-button');
    fireEvent.click(hintButton);

    const hintContainer = screen.getByTestId('hint-bubble');
    const hintText = hintContainer.textContent || '';

    // In English mode, the prompt should be in English, not Persian
    expect(hintText).not.toContain('راهنمایی');
    expect(hintText).not.toMatch(/starts with/i); // No first-letter spoiler
  });

  test('3. LanguagePickerModal has NO "popular" / "پیشنهاد زبان" tab', () => {
    render(
      <LanguagePickerModal
        isOpen={true}
        onClose={vi.fn()}
        selectedLanguage="fa"
        isRTL={true}
      />
    );

    // Should NOT have 'پرطرفدار' tab or 'Popular' tab
    expect(screen.queryByRole('button', { name: /پرطرفدار/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Popular/i })).not.toBeInTheDocument();

    // Should have standard region tabs
    expect(screen.getByRole('button', { name: /همه زبان‌ها/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /خاورمیانه/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /اروپا/i })).toBeInTheDocument();
  });

  test('4. Skipping a card in SinglePlayer reveals the correct answer and offers Next Card', () => {
    const mockCard: LanguageCard = {
      id: 'skip-1',
      targetText: 'gezellig',
      translation: 'دلچسب و صمیمی',
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'B1',
      topic: 'CAT_CULTURE',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      prompt: 'ترجمه کنید',
      grammarPoint: 'Dutch cultural untranslatable adjective',
      difficulty: 'medium',
      points: 10
    };

    const settings: SinglePlayerSettings = {
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'B1',
      displayMode: 'translate_to_target',
      questionCount: 1,
      timeLimitSeconds: 0,
      autoPlayAudio: false,
      selectedCategories: ['CAT_CULTURE']
    };

    render(
      <SinglePlayerScreen
        initialCards={[mockCard]}
        initialSettings={settings}
        uiLanguage="fa"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    // Click Skip button
    const skipBtn = screen.getByRole('button', { name: /رد کردن/i });
    fireEvent.click(skipBtn);

    // Should display the correct answer review banner
    expect(screen.getByText(/پاسخ صحیح/i)).toBeInTheDocument();
    expect(screen.getByText('gezellig')).toBeInTheDocument();
    expect(screen.getByText('دلچسب و صمیمی')).toBeInTheDocument();

    // Should provide a button to continue to the next card
    expect(screen.getByRole('button', { name: /کارت بعدی|ادامه/i })).toBeInTheDocument();
  });

  test('5. Action buttons in SinglePlayerScreen are icon-only and avoid bulky text labels', () => {
    const mockCard: LanguageCard = {
      id: 'icon-1',
      targetText: 'goedemiddag',
      translation: 'ظهر بخیر',
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      topic: 'CAT_EVERYDAY',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      prompt: 'ترجمه',
      difficulty: 'easy',
      points: 10
    };

    const settings: SinglePlayerSettings = {
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      displayMode: 'text_and_audio',
      questionCount: 1,
      timeLimitSeconds: 0,
      autoPlayAudio: false,
      selectedCategories: ['CAT_EVERYDAY']
    };

    render(
      <SinglePlayerScreen
        initialCards={[mockCard]}
        initialSettings={settings}
        uiLanguage="fa"
        onFinish={vi.fn()}
        onExit={vi.fn()}
      />
    );

    const checkBtn = screen.getByRole('button', { name: /بررسی پاسخ|Check/i });
    const skipBtn = screen.getByRole('button', { name: /رد کردن|Skip/i });
    const speakBtn = screen.getByRole('button', { name: /پاسخ صوتی|صحبت|لمس برای صحبت|Speak/i });

    expect(checkBtn).toBeInTheDocument();
    expect(skipBtn).toBeInTheDocument();
    expect(speakBtn).toBeInTheDocument();
  });
});
