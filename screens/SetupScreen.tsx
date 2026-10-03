import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameSettings, Language, CEFRLevel } from '../types';
import { sound } from '../soundManager';
import { getRandomCharacters } from '../characters';
import { tUI, isRtlLang } from '../ui';
import { CEFR_LEVELS } from '../constants';
import { ArrowLeft, ArrowRight, Check, Search, X, ChevronDown, ChevronUp, Settings, Award } from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
}

// Persian Language Names Dictionary
const PERSIAN_LANG_NAMES: Record<string, string> = {
  fa: 'فارسی',
  en: 'انگلیسی',
  'en-US': 'انگلیسی',
  nl: 'هلندی',
  de: 'آلمانی',
  fr: 'فرانسوی',
  es: 'اسپانیایی',
  it: 'ایتالیایی',
  tr: 'ترکی',
  ar: 'عربی',
  ru: 'روسی',
  sv: 'سوئدی',
  pl: 'لهستانی',
  uk: 'اوکراینی',
  pt: 'پرتغالی',
  zh: 'چینی',
  ja: 'ژاپنی',
  ko: 'کره‌ای',
  hi: 'هندی'
};

// Convert numbers to Persian digits if in RTL/Persian
const toPersian = (n: number | string, isRTL: boolean) => {
  const str = String(n);
  if (!isRTL) return str;
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => persianDigits[Number(d)] ?? d);
};

// Reusable Luggage Lock Wheel Component
interface WheelProps {
  items: number[];
  selected: number;
  onSelect: (val: number) => void;
  format: (val: number) => string;
  ariaLabel: string;
  ariaValueText?: string;
  showWrapper?: boolean;
}

const TumblerWheel: React.FC<WheelProps> = ({ 
  items, 
  selected, 
  onSelect, 
  format, 
  ariaLabel, 
  ariaValueText,
  showWrapper = true 
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<any>(null);

  const scrollWheelTo = (top: number, smooth = true) => {
    if (!wheelRef.current) return;
    if (typeof wheelRef.current.scrollTo === 'function') {
      wheelRef.current.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    } else {
      wheelRef.current.scrollTop = top;
    }
  };

  // Scroll to selected on initial render and when selected updates
  useEffect(() => {
    if (wheelRef.current) {
      const idx = items.indexOf(selected);
      if (idx !== -1) {
        const targetTop = idx * 44;
        if (Math.abs(wheelRef.current.scrollTop - targetTop) > 4) {
          scrollWheelTo(targetTop, false);
        }
      }
    }
  }, [selected, items]);

  const handleScroll = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!wheelRef.current) return;
      const scrollTop = wheelRef.current.scrollTop;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(scrollTop / 44)));
      const chosen = items[idx];
      if (chosen !== undefined && chosen !== selected) {
        sound.playClick();
        onSelect(chosen);
      }
    }, 80);
  };

  const handleItemClick = (val: number, idx: number) => {
    scrollWheelTo(idx * 44, true);
    sound.playClick();
    onSelect(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIdx = items.indexOf(selected);
    let nextIdx = currentIdx;
    if (e.key === 'ArrowDown') {
      nextIdx = Math.min(items.length - 1, currentIdx + 1);
    } else if (e.key === 'ArrowUp') {
      nextIdx = Math.max(0, currentIdx - 1);
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = items.length - 1;
    } else if (e.key === 'PageDown') {
      nextIdx = Math.min(items.length - 1, currentIdx + 3);
    } else if (e.key === 'PageUp') {
      nextIdx = Math.max(0, currentIdx - 3);
    } else {
      return;
    }
    e.preventDefault();
    const nextVal = items[nextIdx];
    if (nextVal !== undefined && nextVal !== selected) {
      scrollWheelTo(nextIdx * 44, true);
      sound.playClick();
      onSelect(nextVal);
    }
  };

  const wheelInner = (
    <div 
      ref={wheelRef}
      className="wheel"
      tabIndex={0}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={selected}
      aria-valuetext={ariaValueText ?? format(selected)}
      aria-valuemin={items[0]}
      aria-valuemax={items[items.length - 1]}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
    >
      {items.map((val, idx) => {
        const isSelected = val === selected;
        return (
          <div
            key={val}
            role="option"
            aria-selected={isSelected}
            data-selected={isSelected}
            onClick={() => handleItemClick(val, idx)}
            className={`transition-colors cursor-pointer select-none ${
              isSelected ? 'font-black text-[#121A3A] scale-105' : 'opacity-60 text-[var(--ink)]'
            }`}
          >
            {format(val)}
          </div>
        );
      })}
    </div>
  );

  if (!showWrapper) {
    return wheelInner;
  }

  return (
    <div className="wheelbox w-full">
      {wheelInner}
    </div>
  );
};

const SetupScreen: React.FC<Props> = ({ settings, onSave, onNext, onBack, onOpenHelp }) => {
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);

  // Local UI states
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLangPopOpen, setIsLangPopOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(() => (typeof sound?.getMuted === 'function' ? sound.getMuted() : false));
  const [langError, setLangError] = useState<string | null>(null);

  // Dropdown open states for matching searchable menus
  const [isNativeOpen, setIsNativeOpen] = useState(false);
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [searchNative, setSearchNative] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [searchUi, setSearchUi] = useState('');

  // Active CEFR Level
  const currentCefr = settings.cefrLevel || 'all';
  const activeCefrInfo = useMemo(() => {
    return CEFR_LEVELS.find(l => l.id === currentCefr) || CEFR_LEVELS[CEFR_LEVELS.length - 1];
  }, [currentCefr]);

  // Sync with global sound manager
  useEffect(() => {
    if (typeof sound?.addMuteListener === 'function') {
      const unsub = sound.addMuteListener(muted => setIsSoundMuted(muted));
      return unsub;
    }
  }, []);

  // Ensure default player names are initialized silently without exposing inputs in UI
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    const isEnglishNative = settings.nativeLanguage === 'en-US' || settings.nativeLanguage === 'en' || settings.language === 'en-US' || settings.language === 'en';
    const effectiveLang = isEnglishNative ? 'en-US' : (settings.nativeLanguage || settings.language || 'en-US');
    const defaults = getRandomCharacters(effectiveLang, 8);
    const currentNames = settings.playerNames || [];
    const hasAnyEmpty = Array.from({ length: settings.playerCount }).some(
      (_, i) => !currentNames[i] || currentNames[i].trim().length === 0
    );

    if (hasAnyEmpty || currentNames.length < settings.playerCount) {
      initializedRef.current = true;
      const updatedNames = Array.from({ length: 8 }).map(
        (_, i) => (currentNames[i] && currentNames[i].trim().length > 0) ? currentNames[i] : (defaults[i] || `Player ${i + 1}`)
      );
      onSave({
        ...settings,
        playerNames: updatedNames
      });
    }
  }, [settings.playerCount, settings.language, settings.nativeLanguage]);

  const updateSettings = (key: keyof GameSettings, value: any) => {
    onSave({ ...settings, [key]: value });
  };

  // Sound toggle
  const toggleSound = () => {
    const nextMuted = !isSoundMuted;
    if (typeof sound?.setMuted === 'function') sound.setMuted(nextMuted);
    setIsSoundMuted(nextMuted);
    updateSettings('soundEnabled', !nextMuted);
    if (!nextMuted && typeof sound?.playClick === 'function') sound.playClick();
  };

  // Close guide or language popovers on Escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSheetOpen(false);
        setIsLangPopOpen(false);
        setIsNativeOpen(false);
        setIsTargetOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close language popup on click outside
  useEffect(() => {
    if (!isLangPopOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#uiPop') && !target.closest('#uiLangBtn')) {
        setIsLangPopOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isLangPopOpen]);

  // Comprehensive language options with abbreviation badge and native name
  const languageOptions = useMemo(() => [
    { code: 'fa', name: 'فارسی', short: 'FA', enName: 'Persian' },
    { code: 'nl', name: 'Nederlands', short: 'NL', enName: 'Dutch' },
    { code: 'en', name: 'English', short: 'EN', enName: 'English' },
    { code: 'de', name: 'Deutsch', short: 'DE', enName: 'German' },
    { code: 'fr', name: 'Français', short: 'FR', enName: 'French' },
    { code: 'es', name: 'Español', short: 'ES', enName: 'Spanish' },
    { code: 'it', name: 'Italiano', short: 'IT', enName: 'Italian' },
    { code: 'tr', name: 'Türkçe', short: 'TR', enName: 'Turkish' },
    { code: 'ar', name: 'العربية', short: 'AR', enName: 'Arabic' },
    { code: 'ru', name: 'Русский', short: 'RU', enName: 'Russian' },
    { code: 'pt', name: 'Português', short: 'PT', enName: 'Portuguese' },
    { code: 'zh', name: '中文', short: 'ZH', enName: 'Chinese' },
    { code: 'ja', name: '日本語', short: 'JA', enName: 'Japanese' },
    { code: 'ko', name: '한국어', short: 'KO', enName: 'Korean' },
    { code: 'hi', name: 'हिन्दी', short: 'HI', enName: 'Hindi' },
    { code: 'sv', name: 'Svenska', short: 'SV', enName: 'Swedish' },
    { code: 'pl', name: 'Polski', short: 'PL', enName: 'Polish' },
    { code: 'uk', name: 'Українська', short: 'UK', enName: 'Ukrainian' }
  ], []);

  const currentNativeCode = (settings.nativeLanguage || settings.language || 'fa') as Language;

  // Filter languages for Native Dropdown
  const filteredNativeLanguages = useMemo(() => {
    const q = searchNative.trim().toLowerCase();
    if (!q) return languageOptions;
    return languageOptions.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.short.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q) || 
      l.enName.toLowerCase().includes(q)
    );
  }, [searchNative, languageOptions]);

  // Filter languages for Target Dropdown (excluding native language)
  const filteredTargetLanguages = useMemo(() => {
    const list = languageOptions.filter(l => l.code !== currentNativeCode);
    const q = searchTarget.trim().toLowerCase();
    if (!q) return list;
    return list.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.short.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q) || 
      l.enName.toLowerCase().includes(q)
    );
  }, [searchTarget, currentNativeCode, languageOptions]);

  // Filter languages for UI Language Dropdown
  const filteredUiLanguages = useMemo(() => {
    const q = searchUi.trim().toLowerCase();
    if (!q) return languageOptions;
    return languageOptions.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.short.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q) || 
      l.enName.toLowerCase().includes(q)
    );
  }, [searchUi, languageOptions]);

  // Toggle learning language in targetLanguages with actionable error
  const toggleLearningLang = (code: string) => {
    sound.playClick();
    const current = new Set(settings.targetLanguages || ['nl', 'en']);
    if (current.has(code as Language)) {
      if (current.size > 1) {
        current.delete(code as Language);
        setLangError(null);
      } else {
        setLangError(
          t.atLeastOneLanguage || (isRTL
            ? 'حداقل یک زبان برای یادگیری باید انتخاب شود. راه‌حل: روی یکی از زبان‌های دیگر کلیک کنید تا فعال شود.'
            : 'At least one learning language must be selected. Fix: Tap another language chip to select it.')
        );
        return;
      }
    } else {
      current.add(code as Language);
      setLangError(null);
    }
    updateSettings('targetLanguages', Array.from(current));
  };

  // Change native language
  const handleNativeChange = (newNative: string) => {
    sound.playClick();
    setLangError(null);
    const currentTargets = new Set(settings.targetLanguages || ['nl', 'en']);
    currentTargets.delete(newNative as Language);
    if (currentTargets.size === 0) {
      const fallback = languageOptions.find(l => l.code !== newNative);
      if (fallback) currentTargets.add(fallback.code as Language);
    }
    onSave({
      ...settings,
      nativeLanguage: newNative as Language,
      targetLanguages: Array.from(currentTargets)
    });
    setIsNativeOpen(false);
  };

  // Rounds tumbler items: 3 to 10
  const roundOptions = [3, 4, 5, 6, 7, 8, 9, 10];

  // Minutes tumbler items: 0 to 10 (one by one)
  const minuteOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Seconds tumbler items: 00 to 55 (5 by 5), with fallback if custom seconds like 6 exist
  const baseSeconds = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const currentDuration = settings.roundDuration ?? 60;
  const currentMin = Math.floor(currentDuration / 60);
  const currentSec = currentDuration % 60;

  const secondOptions = useMemo(() => {
    if (!baseSeconds.includes(currentSec)) {
      return [...baseSeconds, currentSec].sort((a, b) => a - b);
    }
    return baseSeconds;
  }, [currentSec]);

  const handleMinuteChange = (newMin: number) => {
    const newTotal = Math.max(5, newMin * 60 + currentSec);
    updateSettings('roundDuration', newTotal);
  };

  const handleSecondChange = (newSec: number) => {
    const newTotal = Math.max(5, currentMin * 60 + newSec);
    updateSettings('roundDuration', newTotal);
  };

  const incrementMinute = () => {
    sound.playClick();
    const nextMin = Math.min(10, currentMin + 1);
    handleMinuteChange(nextMin);
  };

  const decrementMinute = () => {
    sound.playClick();
    const nextMin = Math.max(0, currentMin - 1);
    handleMinuteChange(nextMin);
  };

  const incrementSecond = () => {
    sound.playClick();
    let nextSec = (Math.floor(currentSec / 5) + 1) * 5;
    if (nextSec > 55) {
      if (currentMin < 10) {
        updateSettings('roundDuration', (currentMin + 1) * 60);
        return;
      }
      nextSec = 55;
    }
    handleSecondChange(nextSec);
  };

  const decrementSecond = () => {
    sound.playClick();
    let nextSec = (Math.ceil(currentSec / 5) - 1) * 5;
    if (nextSec < 0) {
      if (currentMin > 0) {
        updateSettings('roundDuration', (currentMin - 1) * 60 + 55);
        return;
      }
      nextSec = 0;
    }
    handleSecondChange(nextSec);
  };

  const incrementRound = () => {
    sound.playClick();
    updateSettings('roundsCount', Math.min(10, settings.roundsCount + 1));
  };

  const decrementRound = () => {
    sound.playClick();
    updateSettings('roundsCount', Math.max(3, settings.roundsCount - 1));
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const secStr = String(secs).padStart(2, '0');
    return `${toPersian(mins, isRTL)}:${toPersian(secStr, isRTL)}`;
  };

  // Compute clean, dynamic Translation Direction options using actual language names
  const nativeName = isRTL 
    ? (PERSIAN_LANG_NAMES[currentNativeCode] || languageOptions.find(l => l.code === currentNativeCode)?.name || 'فارسی')
    : (languageOptions.find(l => l.code === currentNativeCode)?.enName || 'Persian');

  const firstTargetCode = (settings.targetLanguages && settings.targetLanguages[0]) || 'en';
  const targetName = isRTL
    ? (PERSIAN_LANG_NAMES[firstTargetCode] || languageOptions.find(l => l.code === firstTargetCode)?.name || 'انگلیسی')
    : (languageOptions.find(l => l.code === firstTargetCode)?.enName || 'English');

  const dirOptions = [
    { 
      id: 'reverse', 
      text: isRTL ? `${nativeName} به ${targetName}` : `${nativeName} → ${targetName}`,
      title: isRTL ? `${nativeName} به ${targetName}` : `${nativeName} to ${targetName}`
    },
    { 
      id: 'standard', 
      text: isRTL ? `${targetName} به ${nativeName}` : `${targetName} → ${nativeName}`,
      title: isRTL ? `${targetName} به ${nativeName}` : `${targetName} to ${nativeName}`
    },
    { 
      id: 'mixed', 
      text: isRTL ? 'هر دو' : 'Both',
      title: isRTL ? 'هر دو' : 'Both'
    }
  ];

  return (
    <div className="app w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto min-h-full px-3 sm:px-4 pb-28 font-ui relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* HEADER: Back Button, Title & Circular Action Buttons */}
      <header className="sticky top-0 z-20 bg-[var(--bg)] flex items-center justify-between py-2.5 px-0.5">
        <div className="flex items-center gap-2">
          {/* Back button to return to home/Intro screen */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="ib !w-9 !h-9"
            aria-label={t.back || (isRTL ? 'بازگشت' : 'Back')}
            title={t.back || (isRTL ? 'بازگشت' : 'Back')}
          >
            <ArrowRight size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <h1 className="text-[28px] sm:text-[34px] font-black leading-none tracking-tight text-[var(--ink)] whitespace-nowrap">
            {t.title || 'دور'}
          </h1>
          {/* Replaced text pill with sleek gear icon to prevent two-line wrapping */}
          <div 
            className="w-8 h-8 rounded-full bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[var(--mute)] shrink-0 shadow-xs" 
            title={isRTL ? 'تنظیمات بازی' : 'Game Settings'}
            aria-label={isRTL ? 'تنظیمات بازی' : 'Game Settings'}
          >
            <Settings size={16} />
            <span className="sr-only">{t.gameSettings || (isRTL ? 'تنظیمات بازی' : 'Game Settings')}</span>
          </div>
        </div>

        <div className="icons relative flex items-center gap-1.5">
          {/* Hint / Guide Button */}
          <button 
            type="button"
            id="hintBtn" 
            className="ib" 
            aria-label={t.guide || 'راهنما'}
            title={t.guide || 'راهنما'}
            onClick={() => {
              sound.playClick();
              setIsSheetOpen(true);
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
            </svg>
          </button>

          {/* Sound Toggle Button */}
          <button 
            type="button"
            id="soundBtn" 
            className="ib" 
            aria-pressed={!isSoundMuted} 
            aria-label={isSoundMuted ? (t.soundMuted || 'صدای بازی غیرفعال') : (t.soundActive || 'صدای بازی فعال')}
            title={isSoundMuted ? (t.soundMuted || 'فعال‌سازی صدا') : (t.soundActive || 'قطع صدا')}
            onClick={toggleSound}
          >
            <svg viewBox="0 0 24 24">
              {!isSoundMuted ? (
                <>
                  <path d="M4 9v6h4l5 4V5L8 9H4z" />
                  <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
                </>
              ) : (
                <>
                  <path d="M4 9v6h4l5 4V5L8 9H4z" />
                  <path d="M17 9l5 6M22 9l-5 6" />
                </>
              )}
            </svg>
          </button>

          {/* UI Language Dropdown Button */}
          <button 
            type="button"
            id="uiLangBtn" 
            className="ib" 
            aria-label={t.uiLanguageLabel || 'App language'}
            title={t.uiLanguageLabel || 'App language'}
            onClick={() => {
              sound.playClick();
              setIsLangPopOpen(prev => !prev);
              setIsNativeOpen(false);
              setIsTargetOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
            </svg>
          </button>

          {/* UI Language Dropdown with Search at the top */}
          <div 
            className="pop" 
            id="uiPop" 
            role="menu" 
            hidden={!isLangPopOpen}
            style={{ width: '260px', maxHeight: '340px' }}
          >
            <div className="p-2 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchUi}
                  onChange={(e) => setSearchUi(e.target.value)}
                  placeholder={t.searchLanguages || (isRTL ? 'جستجوی زبان...' : 'Search languages...')}
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-[var(--lapis)] transition-colors pr-7 rtl:pr-7 rtl:pl-2.5 ltr:pl-7 ltr:pr-2.5"
                />
                <Search size={13} className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none rtl:right-2 ltr:left-2" />
                {searchUi && (
                  <button 
                    type="button" 
                    onClick={() => setSearchUi('')}
                    className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] p-0.5 rtl:left-1.5 ltr:right-1.5"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar overscroll-contain">
                {filteredUiLanguages.map(l => {
                  const isChecked = settings.language === l.code;
                  return (
                    <button
                      key={l.code}
                      role="menuitemradio"
                      aria-checked={isChecked}
                      onClick={() => {
                        sound.playClick();
                        setIsLangPopOpen(false);
                        onSave({ ...settings, language: l.code as Language });
                      }}
                      className={`flex items-center justify-between w-full p-1.5 rounded-lg text-xs font-bold transition-all ${
                        isChecked ? 'bg-[var(--lapis)] text-white' : 'hover:bg-[var(--bg)] text-[var(--ink)]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded font-mono font-black text-[9px] flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10 text-[var(--ink)]'
                        }`}>
                          {l.short}
                        </span>
                        <span className="whitespace-nowrap truncate">{l.name}</span>
                        <span className={`text-[10px] whitespace-nowrap truncate ${isChecked ? 'text-white/80' : 'text-[var(--mute)]'}`}>
                          ({l.enName})
                        </span>
                      </span>
                      {isChecked && <Check size={14} className="shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PANEL 1: MATCHING SEARCHABLE DROPDOWNS FOR NATIVE AND LEARNING LANGUAGES */}
      <section className="panel space-y-3">
        
        {/* Actionable Error if user deselects all learning languages */}
        {langError && (
          <div className="p-2.5 rounded-[12px] bg-[#E0533C]/15 border border-[#E0533C] text-xs font-bold text-[#E0533C] flex items-center justify-between animate-fade-in">
            <span>{langError}</span>
            <button type="button" onClick={() => setLangError(null)} className="text-[#E0533C] p-0.5 hover:opacity-80">
              <X size={14} />
            </button>
          </div>
        )}

        {/* 1. NATIVE LANGUAGE DROPDOWN */}
        <div className="space-y-1.5" role="radiogroup" aria-label={t.myNativeLanguage || (isRTL ? 'زبان من' : 'My Language')}>
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold text-[var(--mute)] whitespace-nowrap">
              {t.myNativeLanguage || (isRTL ? 'زبان من:' : 'My Language:')}
              <span className="sr-only">زبان مادری من</span>
            </span>
            <span className="text-xs font-black text-[var(--lapis)] whitespace-nowrap truncate max-w-[140px]">
              {languageOptions.find(l => l.code === currentNativeCode)?.name || 'فارسی'}
            </span>
          </div>

          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsNativeOpen(prev => !prev);
              setIsTargetOpen(false);
              setIsLangPopOpen(false);
            }}
            className="w-full h-11 px-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--lapis)] flex items-center justify-between transition-colors shadow-xs"
            aria-expanded={isNativeOpen}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-md bg-[var(--ink)] text-[var(--bg)] font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                {languageOptions.find(l => l.code === currentNativeCode)?.short || 'FA'}
              </span>
              <span className="text-xs font-bold text-[var(--ink)] whitespace-nowrap truncate">
                {languageOptions.find(l => l.code === currentNativeCode)?.name || 'فارسی'}
              </span>
              <span className="text-[11px] text-[var(--mute)] whitespace-nowrap truncate hidden sm:inline">
                ({languageOptions.find(l => l.code === currentNativeCode)?.enName})
              </span>
            </div>
            <ChevronDown size={16} className={`text-[var(--mute)] transition-transform duration-200 shrink-0 ${isNativeOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu with Search at the top */}
          <div className={`p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm space-y-2 ${isNativeOpen ? 'block animate-fade-in' : 'hidden'}`}>
            <div className="relative">
              <input
                type="text"
                value={searchNative}
                onChange={(e) => setSearchNative(e.target.value)}
                placeholder={t.searchLanguages || (isRTL ? 'جستجوی زبان...' : 'Search languages...')}
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-[var(--lapis)] transition-colors pr-8 rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3"
              />
              <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none rtl:right-2.5 ltr:left-2.5" />
              {searchNative && (
                <button 
                  type="button" 
                  onClick={() => setSearchNative('')}
                  className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] p-0.5 rtl:left-2 ltr:right-2"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar overscroll-contain">
              {filteredNativeLanguages.length === 0 ? (
                <div className="text-xs text-[var(--mute)] py-2 text-center">{t.noLanguagesFound || 'No languages found'}</div>
              ) : (
                filteredNativeLanguages.map(l => {
                  const isCurrent = currentNativeCode === l.code;
                  return (
                    <button
                      key={`native-opt-${l.code}`}
                      type="button"
                      role="radio"
                      aria-checked={isCurrent}
                      onClick={() => handleNativeChange(l.code)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all ${
                        isCurrent 
                          ? 'bg-[var(--ink)] text-[var(--bg)]' 
                          : 'hover:bg-[var(--bg)] text-[var(--ink)]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded font-mono font-black text-[9px] flex items-center justify-center shrink-0 ${
                          isCurrent ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10 text-[var(--ink)]'
                        }`}>
                          {l.short}
                        </span>
                        <span className="whitespace-nowrap truncate">{l.name}</span>
                        <span className={`text-[10.5px] whitespace-nowrap truncate ${isCurrent ? 'opacity-80' : 'text-[var(--mute)]'}`}>
                          ({l.enName})
                        </span>
                      </span>
                      {isCurrent && <Check size={14} className="shrink-0 text-white" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex items-center justify-center text-[var(--mute)] opacity-70 py-0.5">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>

        {/* 2. LEARNING LANGUAGES DROPDOWN (Identical Look & Feel with Search at the Top) */}
        <div 
          className="space-y-1.5" 
          role="group" 
          aria-label={t.languagesIWantToLearn || (isRTL ? 'زبان‌هایی که می‌خوام یاد بگیرم' : 'Languages I Want to Learn')}
        >
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold text-[var(--mute)] whitespace-nowrap">
              {t.languagesIWantToLearn || (isRTL ? 'زبان‌هایی که می‌خوام یاد بگیرم:' : 'Languages I Want to Learn:')}
            </span>
            <span className="text-xs font-bold text-[var(--lapis)] whitespace-nowrap">
              {toPersian(settings.targetLanguages?.length || 0, isRTL)} {t.active || (isRTL ? 'زبان فعال' : 'active')}
            </span>
          </div>

          {/* Trigger Button - Clean summary matching native trigger design */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsTargetOpen(prev => !prev);
              setIsNativeOpen(false);
              setIsLangPopOpen(false);
            }}
            className="w-full h-11 px-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--lapis)] flex items-center justify-between transition-colors shadow-xs"
            aria-expanded={isTargetOpen}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-md bg-[var(--lapis)] text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                {toPersian(settings.targetLanguages?.length || 0, isRTL)}
              </span>
              <span className="text-xs font-bold text-[var(--ink)] whitespace-nowrap truncate">
                {toPersian(settings.targetLanguages?.length || 0, isRTL)} {isRTL ? 'زبان یادگیری انتخاب شده' : 'learning languages selected'}
              </span>
              <span className="text-[11px] text-[var(--mute)] whitespace-nowrap truncate hidden sm:inline">
                ({isRTL ? 'مشاهده و انتخاب' : 'Tap to customize'})
              </span>
            </div>
            <ChevronDown size={16} className={`text-[var(--mute)] transition-transform duration-200 shrink-0 ${isTargetOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu with Search at the top */}
          <div className={`p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm space-y-2 ${isTargetOpen ? 'block animate-fade-in' : 'hidden'}`} id="chips">
            <div className="relative">
              <input
                type="text"
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                placeholder={t.searchLanguages || (isRTL ? 'جستجوی زبان...' : 'Search languages...')}
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-[var(--lapis)] transition-colors pr-8 rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3"
              />
              <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none rtl:right-2.5 ltr:left-2.5" />
              {searchTarget && (
                <button 
                  type="button" 
                  onClick={() => setSearchTarget('')}
                  className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] p-0.5 rtl:left-2 ltr:right-2"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar overscroll-contain">
              {filteredTargetLanguages.length === 0 ? (
                <div className="text-xs text-[var(--mute)] py-2 text-center">{t.noLanguagesFound || 'No languages found'}</div>
              ) : (
                filteredTargetLanguages.map(l => {
                  const isSelected = settings.targetLanguages?.includes(l.code as Language);
                  return (
                    <button
                      key={`target-opt-${l.code}`}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleLearningLang(l.code)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all ${
                        isSelected 
                          ? 'bg-[var(--lapis)] text-[var(--on-lapis)]' 
                          : 'hover:bg-[var(--bg)] text-[var(--ink)]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded font-mono font-black text-[9px] flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10 text-[var(--ink)]'
                        }`}>
                          {l.short}
                        </span>
                        <span className="whitespace-nowrap truncate">{l.name}</span>
                        <span className={`text-[10.5px] whitespace-nowrap truncate ${isSelected ? 'opacity-80' : 'text-[var(--mute)]'}`}>
                          ({l.enName})
                        </span>
                      </span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white text-[var(--lapis)] border-white' : 'border-[var(--line)] bg-[var(--bg)]'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsTargetOpen(false);
              }}
              className="w-full py-1.5 text-center text-xs font-bold text-[var(--lapis)] hover:bg-[var(--bg)] rounded-lg transition-colors border border-dashed border-[var(--lapis)]/40 mt-1"
            >
              {isRTL ? 'تایید و بستن منو' : 'Done & Close'}
            </button>
          </div>
        </div>

      </section>

      {/* PANEL 2: CEFR LEVEL SELECTION (A1, A2, B1, B2, C1, ALL) */}
      <section className="panel" aria-label={t.cefrLevel || (isRTL ? 'سطح تسلط و دشواری (CEFR)' : 'Proficiency Level (CEFR)')}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="lab mb-0 whitespace-nowrap flex items-center gap-1.5">
            <Award size={14} className="text-[var(--lapis)]" />
            <span>{t.cefrLevel || (isRTL ? 'سطح تسلط و دشواری (CEFR)' : 'Proficiency Level (CEFR)')}</span>
          </div>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-[var(--lapis-soft)] text-[var(--lapis)] border border-[var(--lapis)]/20 shadow-xs whitespace-nowrap">
            {activeCefrInfo?.badge}
          </span>
        </div>

        {/* Level Pills Responsive Grid (3 cols on small phones, 6 cols on sm+ screens) */}
        <div 
          className="grid grid-cols-3 sm:grid-cols-6 gap-1.5"
          role="radiogroup" 
          aria-label={t.cefrLevel || (isRTL ? 'سطح دشواری' : 'Proficiency Level')}
        >
          {CEFR_LEVELS.map(level => {
            const isSelected = currentCefr === level.id;
            const levelName = level.name[settings.language] || level.name.fa || level.name.en || level.id;
            return (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${level.code} - ${levelName}`}
                onClick={() => {
                  sound.playToggle();
                  updateSettings('cefrLevel', level.id as CEFRLevel);
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all touch-manipulation active:scale-95 cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs -translate-y-0.5 font-bold'
                    : 'bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] font-medium'
                }`}
              >
                <span className="font-black text-xs leading-none mb-0.5">{level.code}</span>
                <span className="text-[9.5px] leading-tight truncate max-w-[95%] opacity-90">{levelName}</span>
              </button>
            );
          })}
        </div>

        {/* Informative Level Description & Example Phrase */}
        {activeCefrInfo && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-start space-y-1">
            <div className="text-[11.5px] font-bold text-[var(--ink)] flex items-center gap-1.5 leading-tight">
              <span>{activeCefrInfo.name[settings.language] || activeCefrInfo.name.fa || activeCefrInfo.name.en}</span>
            </div>
            <p className="text-[10.5px] text-[var(--mute)] leading-relaxed">
              {activeCefrInfo.desc[settings.language] || activeCefrInfo.desc.fa || activeCefrInfo.desc.en}
            </p>
            {activeCefrInfo.example && (
              <div className="text-[10px] text-[var(--turq)] font-medium pt-0.5 border-t border-[var(--line)]">
                {activeCefrInfo.example[settings.language] || activeCefrInfo.example.fa || activeCefrInfo.example.en}
              </div>
            )}
          </div>
        )}
      </section>

      {/* PANEL 3: PLAYER COUNT (4, 6, 8) */}
      <section className="panel">
        <div className="lab whitespace-nowrap">{t.howManyPlayers || (isRTL ? 'تعداد بازیکنان' : 'How many players?')}</div>
        <div className="seg" id="players">
          {[4, 6, 8].map(count => {
            const isChecked = settings.playerCount === count;
            const countLabel = `${toPersian(count, isRTL)} ${t.players || (isRTL ? 'نفر' : 'players')}`;
            return (
              <button
                key={count}
                type="button"
                aria-checked={isChecked}
                aria-label={countLabel}
                className="whitespace-nowrap"
                onClick={() => {
                  sound.playToggle();
                  updateSettings('playerCount', count);
                }}
              >
                {countLabel}
              </button>
            );
          })}
        </div>
      </section>

      {/* PANEL 3: LUGGAGE LOCK WHEELS (Rounds & Separate Minutes / Seconds Turn Time) */}
      <section className="panel">
        <div className="lock">
          {/* Rounds Column */}
          <div className="flex flex-col items-center">
            <div className="lab whitespace-nowrap truncate w-full text-center">{t.roundsCountLabel || (isRTL ? 'تعداد راند' : 'Number of Rounds')}</div>
            <div className="w-full flex flex-col">
              {/* Increase Round Stepper */}
              <button
                type="button"
                onClick={incrementRound}
                disabled={settings.roundsCount >= 10}
                className="w-full py-1 mb-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                aria-label={isRTL ? 'افزایش راند' : 'Increase round'}
                title={isRTL ? 'افزایش ۱ راند' : '+1 round'}
              >
                <ChevronUp size={14} />
              </button>

              <TumblerWheel
                items={roundOptions}
                selected={settings.roundsCount}
                onSelect={(val) => updateSettings('roundsCount', val)}
                format={(val) => toPersian(val, isRTL)}
                ariaLabel={t.roundsCountLabel || 'Number of Rounds'}
              />

              {/* Decrease Round Stepper */}
              <button
                type="button"
                onClick={decrementRound}
                disabled={settings.roundsCount <= 3}
                className="w-full py-1 mt-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                aria-label={isRTL ? 'کاهش راند' : 'Decrease round'}
                title={isRTL ? 'کاهش ۱ راند' : '-1 round'}
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <span className="text-[10px] font-bold text-[var(--mute)] pt-1 whitespace-nowrap">
              {isRTL ? 'راند (۳ تا ۱۰)' : '3 to 10'}
            </span>
          </div>

          {/* Time Column: Separated Minutes (1 by 1) & Seconds (5 by 5) with Steppers */}
          <div className="flex flex-col items-center">
            <div className="lab whitespace-nowrap truncate w-full text-center">{t.turnTimeLabel || (isRTL ? 'زمان هر دور' : 'Turn Duration')}</div>
            
            <div className="w-full" dir="ltr">
              {/* Top Increment Steppers */}
              <div className="grid grid-cols-2 gap-1.5 mb-1">
                <button 
                  type="button" 
                  onClick={incrementMinute}
                  disabled={currentMin >= 10}
                  className="py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-0.5 text-[10.5px] font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isRTL ? 'افزایش دقیقه' : 'Increase minute'}
                  title={isRTL ? 'افزایش ۱ دقیقه' : '+1 min'}
                >
                  <ChevronUp size={13} />
                  <span className="whitespace-nowrap">{isRTL ? '+۱د' : '+1m'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={incrementSecond}
                  disabled={currentSec >= 55 && currentMin >= 10}
                  className="py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-0.5 text-[10.5px] font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isRTL ? 'افزایش ۵ ثانیه' : 'Increase 5 seconds'}
                  title={isRTL ? 'افزایش ۵ ثانیه' : '+5 sec'}
                >
                  <ChevronUp size={13} />
                  <span className="whitespace-nowrap">{isRTL ? '+۵ث' : '+5s'}</span>
                </button>
              </div>

              {/* Wheel Box Duo */}
              <div className="wheelbox-duo w-full" dir="ltr">
                {/* Minutes Wheel (0 to 10, scrolls 1 by 1) */}
                <div className="wheel-sub">
                  <TumblerWheel
                    items={minuteOptions}
                    selected={currentMin}
                    onSelect={handleMinuteChange}
                    format={(val) => toPersian(val, isRTL)}
                    ariaLabel={isRTL ? 'دقیقه' : 'Minutes'}
                    showWrapper={false}
                  />
                </div>

                {/* Colon Separator */}
                <div className="wheel-sep">:</div>

                {/* Seconds Wheel (00 to 55, scrolls 5 by 5) */}
                <div className="wheel-sub">
                  <TumblerWheel
                    items={secondOptions}
                    selected={currentSec}
                    onSelect={handleSecondChange}
                    format={(val) => toPersian(String(val).padStart(2, '0'), isRTL)}
                    ariaLabel={isRTL ? 'زمان هر نوبت' : 'Turn Duration'}
                    ariaValueText={formatTime(settings.roundDuration)}
                    showWrapper={false}
                  />
                </div>
              </div>

              {/* Bottom Decrement Steppers */}
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button 
                  type="button" 
                  onClick={decrementMinute}
                  disabled={currentMin <= 0 && currentSec <= 5}
                  className="py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-0.5 text-[10.5px] font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isRTL ? 'کاهش دقیقه' : 'Decrease minute'}
                  title={isRTL ? 'کاهش ۱ دقیقه' : '-1 min'}
                >
                  <ChevronDown size={13} />
                  <span className="whitespace-nowrap">{isRTL ? '-۱د' : '-1m'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={decrementSecond}
                  disabled={currentSec <= 5 && currentMin <= 0}
                  className="py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-0.5 text-[10.5px] font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isRTL ? 'کاهش ۵ ثانیه' : 'Decrease 5 seconds'}
                  title={isRTL ? 'کاهش ۵ ثانیه' : '-5 sec'}
                >
                  <ChevronDown size={13} />
                  <span className="whitespace-nowrap">{isRTL ? '-۵ث' : '-5s'}</span>
                </button>
              </div>

            </div>

            {/* Sub-label indicators */}
            <div className="flex items-center justify-around w-full text-[10px] font-bold text-[var(--mute)] pt-1 px-1 whitespace-nowrap" dir="ltr">
              <span>{isRTL ? 'دقیقه (یکی یکی)' : 'Min (1-by-1)'}</span>
              <span>{isRTL ? 'ثانیه (۵ تا ۵ تا)' : 'Sec (5-by-5)'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* PANEL 4: SWITCHES & TRANSLATION DIRECTION */}
      <section className="panel">
        {/* Row 1: Auto Pronunciation */}
        <div className="row-ux">
          <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
            <b className="whitespace-nowrap">{t.autoPronounce || (isRTL ? 'تلفظ خودکار' : 'Auto Pronunciation')}</b>
            <small className="block text-xs text-[var(--mute)] leading-tight mt-0.5">{t.autoPronounceDesc || (isRTL ? 'کارت که اومد، کلمه خوانده می‌شه' : 'When card appears, the word is spoken')}</small>
          </div>
          <button 
            type="button"
            className="sw shrink-0" 
            role="switch" 
            aria-checked={settings.autoPronounceOnCorrect !== false}
            aria-label={t.autoPronounce || 'Auto Pronunciation'}
            onClick={() => {
              sound.playToggle();
              updateSettings('autoPronounceOnCorrect', settings.autoPronounceOnCorrect === false);
            }}
          />
        </div>

        <hr className="border-0 border-t border-[var(--line)] my-2" />

        {/* Row 2: Hot Seat (Pass Phone) */}
        <div className="row-ux">
          <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
            <b className="whitespace-nowrap">{t.hotSeat || (isRTL ? 'صندلی داغ' : 'Hot Seat')}</b>
            <small className="block text-xs text-[var(--mute)] leading-tight mt-0.5">{t.hotSeatDesc || (isRTL ? 'گوشی سریع دست‌به‌دست می‌شه' : 'Fast handoff between players')}</small>
          </div>
          <button 
            type="button"
            className="sw shrink-0" 
            role="switch" 
            aria-checked={Boolean(settings.passPhoneScreenEnabled)}
            aria-label={t.hotSeat || 'Hot Seat'}
            onClick={() => {
              sound.playToggle();
              updateSettings('passPhoneScreenEnabled', !settings.passPhoneScreenEnabled);
            }}
          />
        </div>

        <hr className="border-0 border-t border-[var(--line)] my-2" />

        {/* Direction Segment: Dynamic Human Language Names without "Native" / "Target" */}
        <div className="lab whitespace-nowrap truncate">{t.cardDirection || (isRTL ? 'جهت ترجمه کارت‌ها' : 'Card Translation Direction')}</div>
        <div className="seg sm" id="dir" role="radiogroup" aria-label={t.cardDirection || 'Card Translation Direction'}>
          {dirOptions.map(d => {
            const isChecked = (settings.cardGameMode || 'mixed') === d.id;
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={isChecked}
                className="whitespace-nowrap truncate px-0.5 sm:px-1 text-[10px] sm:text-[11.5px] font-bold leading-none min-w-0"
                title={d.title}
                onClick={() => {
                  sound.playToggle();
                  updateSettings('cardGameMode', d.id);
                }}
              >
                <span className="whitespace-nowrap truncate">{d.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="start-bar">
        <button 
          type="button"
          className="start-btn"
          aria-label={t.nextStartGame || (isRTL ? 'مرحله بعد: شروع بازی' : 'Next: Start Game')}
          onClick={() => {
            sound.playStartGame();
            onNext();
          }}
        >
          <span className="whitespace-nowrap">{t.nextStartGame || (isRTL ? 'مرحله بعد: شروع بازی' : 'Next: Start Game')}</span>
          {isRTL ? <ArrowLeft size={20} className="shrink-0" /> : <ArrowRight size={20} className="shrink-0" />}
        </button>
      </div>

      {/* GUIDE BOTTOM SHEET */}
      <div 
        className="sheet" 
        id="sheet" 
        hidden={!isSheetOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsSheetOpen(false);
        }}
      >
        <div className="sheet-card" role="dialog" aria-labelledby="sheetTitle">
          <div className="sheet-bar" />
          <h2 id="sheetTitle" className="text-xl font-black mb-2 text-[var(--ink)]">
            {t.gameRules || (isRTL ? 'راهنمای بازی دور: زبان' : 'Game Rules')}
          </h2>
          <div className="text-xs sm:text-sm text-[var(--ink)]/80 space-y-2.5 leading-relaxed overflow-y-auto max-h-[60vh] pr-1">
            <p>
              {isRTL 
                ? '«دور» یک بازی گروهی هیجان‌انگیز است که دور یک میز نشسته و یک گوشی بین بازیکنان دست‌به‌دست می‌شود.'
                : 'Turn is a fast-paced party game where players pass a single phone around the table.'}
            </p>
            <p>
              {isRTL
                ? 'هم‌تیمی‌های شما روبه‌روی شما می‌نشینند. شما باید کلمه یا عبارت روی کارت را برای هم‌تیمی خود توضیح دهید یا ترجمه کنید تا حدس بزند.'
                : 'Teammates sit across from each other. The active player explains, describes, or acts out the card content for their partner.'}
            </p>
            <p>
              {isRTL
                ? 'با هر پاسخ درست، ۱ امتیاز می‌گیرید. اگر نتوانستید، می‌توانید کارت را رد کنید یا زمان را مدیریت نمایید.'
                : 'Each correct guess awards points. If stuck, skip to save team timer before running out!'}
            </p>
          </div>
          <button 
            type="button" 
            className="start-btn w-full mt-4" 
            onClick={() => setIsSheetOpen(false)}
            aria-label="فهمیدم"
          >
            <span>فهمیدم</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default SetupScreen;
