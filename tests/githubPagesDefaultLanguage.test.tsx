import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../App';
import { 
  DEFAULT_SETTINGS, 
  isGitHubPagesHost, 
  createDefaultSettingsForLanguage, 
  resolveInitialGameSettings 
} from '../constants';

describe('GitHub Pages Default Language Specification (Dutch or English)', () => {
  const originalLocation = window.location;
  const originalNavigator = window.navigator;

  beforeEach(() => {
    localStorage.clear();
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    // Reset location and navigator
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
  });

  test('1. Host detection accurately identifies maryamjaberi.github.io and other github.io domains', () => {
    // localhost
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', search: '', href: 'http://localhost:3000' },
      writable: true,
      configurable: true
    });
    expect(isGitHubPagesHost()).toBe(false);

    // maryamjaberi.github.io
    Object.defineProperty(window, 'location', {
      value: { hostname: 'maryamjaberi.github.io', search: '', href: 'https://maryamjaberi.github.io/Language-Learning-Party-Game/' },
      writable: true,
      configurable: true
    });
    expect(isGitHubPagesHost()).toBe(true);

    // custom user github.io
    Object.defineProperty(window, 'location', {
      value: { hostname: 'user.github.io', search: '', href: 'https://user.github.io/' },
      writable: true,
      configurable: true
    });
    expect(isGitHubPagesHost()).toBe(true);
  });

  test('2. Default settings on GitHub Pages resolve to Dutch (nl) when browser locale is Dutch', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'maryamjaberi.github.io', search: '', href: 'https://maryamjaberi.github.io/Language-Learning-Party-Game/' },
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'nl-NL', languages: ['nl-NL', 'nl'], userAgent: 'Mozilla/5.0' },
      writable: true,
      configurable: true
    });

    const settings = resolveInitialGameSettings();
    expect(settings.language).toBe('nl');
    expect(settings.nativeLanguage).toBe('nl');
    expect(settings.targetLanguages).toContain('en');
    expect(settings.playerNames.length).toBe(8);
    // Should have Dutch cartoon names (e.g., Nijntje, Kuifje, Buurman)
    const hasDutchOrLatinNames = settings.playerNames.every(name => /^[a-zA-Z\s]+$/.test(name));
    expect(hasDutchOrLatinNames).toBe(true);
  });

  test('3. Default settings on GitHub Pages resolve to English (en) with Dutch target language when browser is English or other', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'maryamjaberi.github.io', search: '', href: 'https://maryamjaberi.github.io/Language-Learning-Party-Game/' },
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'en-US', languages: ['en-US', 'en'], userAgent: 'Mozilla/5.0' },
      writable: true,
      configurable: true
    });

    const settings = resolveInitialGameSettings();
    expect(settings.language).toBe('en');
    expect(settings.nativeLanguage).toBe('en');
    // Learner is learning Dutch!
    expect(settings.targetLanguages).toContain('nl');
    expect(settings.playerNames.length).toBe(8);
    // Should have English cartoon names (e.g. Alex, Sam, Emma)
    const hasEnglishNames = settings.playerNames.every(name => /^[a-zA-Z\s]+$/.test(name));
    expect(hasEnglishNames).toBe(true);
  });

  test('4. Explicit URL query parameter ?lang=nl or ?lang=en is strictly respected', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'maryamjaberi.github.io', search: '?lang=nl', href: 'https://maryamjaberi.github.io/Language-Learning-Party-Game/?lang=nl' },
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'en-US', userAgent: 'Mozilla/5.0' },
      writable: true,
      configurable: true
    });

    const settings = resolveInitialGameSettings();
    expect(settings.language).toBe('nl');
    expect(settings.nativeLanguage).toBe('nl');
  });

  test('5. Non-GitHub host (localhost) preserves DEFAULT_SETTINGS (fa) for local and existing tests', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'localhost', search: '', href: 'http://localhost:3000' },
      writable: true,
      configurable: true
    });

    const settings = resolveInitialGameSettings();
    expect(settings.language).toBe('fa');
    expect(settings.nativeLanguage).toBe('fa');
    expect(DEFAULT_SETTINGS.language).toBe('fa');
  });

  test('6. Fresh launch on GitHub Pages with English locale renders English UI and LTR direction', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'maryamjaberi.github.io', search: '', href: 'https://maryamjaberi.github.io/Language-Learning-Party-Game/' },
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'en-US', languages: ['en-US'], userAgent: 'Mozilla/5.0' },
      writable: true,
      configurable: true
    });

    render(<App />);

    // English action button
    expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
    // English guide button
    expect(screen.getByRole('button', { name: /guide/i })).toBeInTheDocument();
    // LTR direction
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  test('7. Fresh launch on GitHub Pages with Dutch locale renders Dutch UI and LTR direction', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'maryamjaberi.github.io', search: '', href: 'https://maryamjaberi.github.io/Language-Learning-Party-Game/' },
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'nl', languages: ['nl', 'nl-BE'], userAgent: 'Mozilla/5.0' },
      writable: true,
      configurable: true
    });

    render(<App />);

    // Dutch action button: "Nieuw Spel"
    expect(screen.getByRole('button', { name: /nieuw spel/i })).toBeInTheDocument();
    // Dutch guide button: "Gids"
    expect(screen.getByRole('button', { name: /gids/i })).toBeInTheDocument();
    // LTR direction
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('nl');
  });
});
