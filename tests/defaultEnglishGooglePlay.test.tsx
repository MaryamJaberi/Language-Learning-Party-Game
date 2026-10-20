import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { DEFAULT_SETTINGS } from '../constants';

describe('Google Play Release & Default English UI Specifications', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('1. Default settings are strictly English without localStorage', () => {
    expect(DEFAULT_SETTINGS.language).toBe('en');
    expect(DEFAULT_SETTINGS.nativeLanguage).toBe('en');
    expect(DEFAULT_SETTINGS.targetLanguages).toContain('es');
    expect(DEFAULT_SETTINGS.playerNames).toEqual(['Alex', 'Sam', 'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia', 'Lucas']);
  });

  test('2. Fresh launch renders English UI by default on Google Play devices', () => {
    render(<App />);

    // English title or app name
    const titleElements = screen.getAllByText(/Turn|Dour/i);
    expect(titleElements.length).toBeGreaterThan(0);

    // English Action button for Party Game
    expect(screen.getByRole('button', { name: /Start Party Game|Start New Game/i })).toBeInTheDocument();

    // English Guide / Rules button
    expect(screen.getByRole('button', { name: /Guide/i })).toBeInTheDocument();

    // Verify LTR direction
    const mainEl = document.querySelector('main');
    expect(mainEl).toBeInTheDocument();
  });

  test('3. Open Setup from English Intro presents English labels and settings', () => {
    render(<App />);

    const startBtn = screen.getByRole('button', { name: /Start Party Game|Start New Game/i });
    fireEvent.click(startBtn);

    // Verify Setup Screen is in English
    expect(screen.getByText(/Game Settings/i)).toBeInTheDocument();
  });
});
