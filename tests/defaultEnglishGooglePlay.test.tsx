import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { DEFAULT_SETTINGS } from '../constants';

describe('Default Persian (fa) UI Unification & Specifications', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('1. Default settings are unified to Persian (fa) without localStorage', () => {
    expect(DEFAULT_SETTINGS.language).toBe('fa');
    expect(DEFAULT_SETTINGS.nativeLanguage).toBe('fa');
    expect(DEFAULT_SETTINGS.targetLanguages).toContain('nl');
    expect(DEFAULT_SETTINGS.playerNames).toEqual(['آرش', 'سارا', 'کیان', 'مریم', 'سامان', 'پریا', 'بردیا', 'نیکا']);
  });

  test('2. Fresh launch renders unified Persian UI by default', () => {
    render(<App />);

    // Persian title or app name
    const titleElements = screen.getAllByText(/دور/i);
    expect(titleElements.length).toBeGreaterThan(0);

    // Persian Action button for Party Game
    expect(screen.getByRole('button', { name: /شروع بازی دورهمی/i })).toBeInTheDocument();

    // Persian Guide / Rules button
    expect(screen.getByRole('button', { name: /راهنما/i })).toBeInTheDocument();

    // Verify RTL direction
    expect(document.documentElement.dir).toBe('rtl');
  });

  test('3. Open Setup from Persian Intro presents Persian labels and settings', () => {
    render(<App />);

    const startBtn = screen.getByRole('button', { name: /شروع بازی دورهمی/i });
    fireEvent.click(startBtn);

    // Verify Setup Screen is in Persian
    expect(screen.getByText(/تنظیمات بازی/i)).toBeInTheDocument();
  });
});
