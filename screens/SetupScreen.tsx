import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameSettings, Language, CEFRLevel } from '../types';
import { sound } from '../soundManager';
import { getRandomCharacters } from '../characters';
import { tUI, isRtlLang, isPersianLang } from '../ui';
import { CEFR_LEVELS, getCefrText } from '../constants';
import { getAvailablePoolCount, getRealSituationCount } from '../cardsData';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import { ArrowLeft, ArrowRight, ArrowRightLeft, Check, Search, X, ChevronDown, ChevronUp, Settings, Award, AlertTriangle, Smartphone, Globe, Wifi, BookOpen } from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
  onOpenOnline?: () => void;
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

const SetupScreen: React.FC<Props> = ({ settings, onSave, onNext, onBack, onOpenHelp, onOpenOnline }) => {
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);
  const isFa = isPersianLang(settings.language);

  // Party Mode Tab: 'local' (Pass & Play 1 Phone) vs 'online' (Online Multi-Phone Room)
  const [partyTab, setPartyTab] = useState<'local' | 'online'>('local');

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

  // Active CEFR Level (strictly A1-C1)
  const currentCefr = (settings.cefrLevel && settings.cefrLevel !== 'all') ? settings.cefrLevel : 'A1';
  const activeCefrInfo = useMemo(() => {
    return CEFR_LEVELS.find(l => l.id === currentCefr) || CEFR_LEVELS[0];
  }, [currentCefr]);

  // Pool Size Guard: Pre-calculate available cards and safety threshold
  const availablePoolCount = useMemo(() => {
    return getAvailablePoolCount(
      settings.targetLanguages,
      settings.selectedCategories,
      settings.cefrLevel,
      settings.nativeLanguage,
      settings.cardGameMode
    );
  }, [settings.targetLanguages, settings.selectedCategories, settings.cefrLevel, settings.nativeLanguage, settings.cardGameMode]);

  const requiredCardCount = useMemo(() => {
    return Math.ceil(settings.playerCount * settings.roundsCount * 1.5);
  }, [settings.playerCount, settings.roundsCount]);

  const realSituationCount = useMemo(() => {
    const targetCode = (settings.targetLanguages && settings.targetLanguages[0]) || 'en';
    return getRealSituationCount(targetCode);
  }, [settings.targetLanguages]);

  const isSituationDisabled = realSituationCount < requiredCardCount;

  const isPoolEmpty = availablePoolCount === 0;
  const isPoolInsufficient = availablePoolCount < requiredCardCount;

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

  // Close language popups on click outside
  useEffect(() => {
    if (!isLangPopOpen && !isTargetOpen && !isNativeOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (isLangPopOpen && !target.closest('#uiPop') && !target.closest('#uiLangBtn')) {
        setIsLangPopOpen(false);
      }
      if (isTargetOpen && !target.closest('#targetLangContainer')) {
        setIsTargetOpen(false);
      }
      if (isNativeOpen && !target.closest('#nativeLangContainer')) {
        setIsNativeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isLangPopOpen, isTargetOpen, isNativeOpen]);

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

  const normLang = (code?: string) => (code === 'en-US' ? 'en' : (code || ''));
  const currentNativeCode = (settings.nativeLanguage || settings.language || 'fa') as Language;
  const normalizedNativeCode = normLang(currentNativeCode);
  const currentNativeLangInfo = useMemo(() => {
    return languageOptions.find(l => l.code === normalizedNativeCode) || null;
  }, [normalizedNativeCode, languageOptions]);

  const currentTargetCode = (settings.targetLanguages?.[0] || settings.targetLanguage) as Language | undefined;
  const normalizedTargetCode = normLang(currentTargetCode);
  const currentTargetLangInfo = useMemo(() => {
    if (!normalizedTargetCode) return null;
    return languageOptions.find(l => l.code === normalizedTargetCode) || null;
  }, [normalizedTargetCode, languageOptions]);

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
    const list = languageOptions.filter(l => l.code !== normalizedNativeCode);
    const q = searchTarget.trim().toLowerCase();
    if (!q) return list;
    return list.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.short.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q) || 
      l.enName.toLowerCase().includes(q)
    );
  }, [searchTarget, normalizedNativeCode, languageOptions]);

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

  // Strictly 1 learning language across the app
  const selectLearningLang = (code: string) => {
    sound.playClick();
    setLangError(null);
    onSave({
      ...settings,
      targetLanguages: [code as Language],
      targetLanguage: code as Language
    });
  };

  // Remove the active learning language chip and immediately open picker
  const handleRemoveTargetLang = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    sound.playClick();
    onSave({
      ...settings,
      targetLanguages: [],
      targetLanguage: '' as any
    });
    setIsTargetOpen(true);
    setIsNativeOpen(false);
    setIsLangPopOpen(false);
  };

  const toggleLearningLang = (code: string) => {
    selectLearningLang(code);
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
    const newTotal = Math.max(3, newMin * 60 + currentSec);
    updateSettings('roundDuration', newTotal);
  };

  const handleSecondChange = (newSec: number) => {
    const newTotal = Math.max(3, currentMin * 60 + newSec);
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
    return `${toPersian(mins, isFa)}:${toPersian(secStr, isFa)}`;
  };

  // Compute clean, abbreviated Translation Direction options so labels never truncate
  const nativeShort = (currentNativeLangInfo?.short || String(normalizedNativeCode).slice(0, 2)).toUpperCase();
  const firstTargetCode = (settings.targetLanguages && settings.targetLanguages[0]) || 'en';
  const normalizedFirstTarget = normLang(firstTargetCode);
  const targetShort = (languageOptions.find(l => l.code === normalizedFirstTarget)?.short || String(normalizedFirstTarget).slice(0, 2)).toUpperCase();

  const nativeName = isFa 
    ? (PERSIAN_LANG_NAMES[normalizedNativeCode] || currentNativeLangInfo?.name || 'فارسی')
    : (currentNativeLangInfo?.name || currentNativeLangInfo?.enName || 'English');

  const targetName = isFa
    ? (PERSIAN_LANG_NAMES[normalizedFirstTarget] || languageOptions.find(l => l.code === normalizedFirstTarget)?.name || 'انگلیسی')
    : (languageOptions.find(l => l.code === normalizedFirstTarget)?.name || languageOptions.find(l => l.code === normalizedFirstTarget)?.enName || 'English');

  const dirOptions = [
    { 
      id: 'reverse', 
      text: `${nativeShort} → ${targetShort}`,
      title: isFa ? `${nativeName} به ${targetName}` : `${nativeName} → ${targetName}`
    },
    { 
      id: 'standard', 
      text: `${targetShort} → ${nativeShort}`,
      title: isFa ? `${targetName} به ${nativeName}` : `${targetName} → ${nativeName}`
    },
    { 
      id: 'mixed', 
      text: t.dirBoth || (isFa ? 'هر دو' : 'Both'),
      title: t.dirBoth || (isFa ? 'هر دو جهت' : 'Both Directions')
    }
  ];

  return (
    <div className="app w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto min-h-full px-3 sm:px-4 pb-28 font-ui relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* HEADER: Back Button, Title & Circular Action Buttons (M3 Top App Bar) */}
      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur-md flex items-center justify-between py-2.5 px-1 border-b border-[var(--line)]/50 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Back button to return to home/Intro screen */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="w-11 h-11 shrink-0 rounded-full bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[var(--line)] flex items-center justify-center text-[var(--ink)] shadow-xs active:scale-95 transition-all cursor-pointer"
            aria-label={t.back || (isRTL ? 'بازگشت' : 'Back')}
            title={t.back || (isRTL ? 'بازگشت' : 'Back')}
          >
            <ArrowRight size={18} className={isRTL ? '' : 'rotate-180'} />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black leading-none tracking-tight text-[var(--ink)] whitespace-nowrap font-display shrink-0">
              {t.title || 'دور'}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] text-[11px] font-bold font-ui truncate">
              {t.gameSettings || (isRTL ? 'تنظیمات بازی' : 'Game Settings')}
            </span>
          </div>
        </div>

        <div className="icons relative flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Hint / Guide Button (Unified BookOpen notebook icon across the entire app) */}
          <button 
            type="button"
            id="hintBtn" 
            className="w-11 h-11 rounded-full bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[var(--line)] flex items-center justify-center text-[var(--ink)] shadow-xs active:scale-95 transition-all cursor-pointer" 
            aria-label={t.guide || (isFa ? 'راهنما' : 'Guide')}
            title={t.guide || (isFa ? 'راهنما' : 'Guide')}
            onClick={() => {
              sound.playClick();
              setIsSheetOpen(true);
            }}
          >
            <BookOpen size={20} />
          </button>

          {/* Sound Toggle Button */}
          <SoundHeaderButton 
            id="soundBtn"
            variant="icon-only" 
            language={settings.language} 
            className="w-11 h-11 p-0 justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs active:scale-95 transition-all"
            onToggle={(muted) => {
              setIsSoundMuted(muted);
              updateSettings('soundEnabled', !muted);
            }} 
          />

          {/* UI Language Dropdown Button */}
          <button 
            type="button"
            id="uiLangBtn" 
            className="w-11 h-11 rounded-full bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[var(--line)] flex items-center justify-center text-[var(--ink)] shadow-xs active:scale-95 transition-all cursor-pointer" 
            aria-label={t.uiLanguageLabel || (isFa ? 'زبان برنامه' : 'App Language')}
            title={t.uiLanguageLabel || (isFa ? 'زبان برنامه' : 'App Language')}
            onClick={() => {
              sound.playClick();
              setIsLangPopOpen(prev => !prev);
              setIsNativeOpen(false);
              setIsTargetOpen(false);
            }}
          >
            <Globe size={20} />
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
                  className="w-full h-9 px-2.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-[var(--lapis)] transition-colors pr-7 rtl:pr-7 rtl:pl-2.5 ltr:pl-7 ltr:pr-2.5"
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
                  const isChecked = normLang(settings.language) === l.code;
                  const localizedSub = isFa ? PERSIAN_LANG_NAMES[l.code] : l.enName;
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
                      className={`flex items-center justify-between w-full p-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
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
                        {localizedSub && localizedSub !== l.name && (
                          <span className={`text-[10px] whitespace-nowrap truncate ${isChecked ? 'text-white/80' : 'text-[var(--mute)]'}`}>
                            ({localizedSub})
                          </span>
                        )}
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

      {/* PARTY MODE TABS: Local (1 Phone) vs Online (Multi-Phone Room) */}
      <div className="mt-2.5 bg-[var(--panel)] p-1.5 rounded-2xl border border-[var(--line)] grid grid-cols-2 gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setPartyTab('local');
          }}
          className={`min-h-[42px] py-2 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            partyTab === 'local'
              ? 'bg-[var(--lapis)] text-white shadow-xs'
              : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
          }`}
        >
          <Smartphone size={16} />
          <span>{t.localOnePhone || (isFa ? 'حضوری (۱ گوشی)' : 'Local (1 Phone)')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setPartyTab('online');
          }}
          className={`min-h-[42px] py-2 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            partyTab === 'online'
              ? 'bg-[var(--turq)] text-white shadow-xs'
              : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
          }`}
        >
          <Globe size={16} />
          <span>{t.onlineMultiPhone || (isFa ? 'آنلاین (چند گوشی)' : 'Online (Multi-Phone)')}</span>
        </button>
      </div>

      {/* ONLINE PARTY CALLOUT WHEN ONLINE TAB IS ACTIVE */}
      {partyTab === 'online' && (
        <section className="panel space-y-3 border-2 !border-[var(--turq)]/40 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--turq)]/15 text-[var(--turq)] flex items-center justify-center shrink-0">
              <Wifi size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[var(--ink)]">
                {t.onlinePartyRoomTitle || (isFa ? 'اتاق دورهمی آنلاین (چند گوشی)' : 'Online Party Room (Multi-Phone)')}
              </h2>
              <p className="text-xs text-[var(--mute)] font-bold">
                {t.onlinePartyRoomDesc || (isFa
                  ? 'ساخت اتاق جدید، ورود با کد اتاق یا مچ‌یابی آنلاین با دوستان'
                  : 'Create a room, join with a code, or matchmake online with friends')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playStartGame();
              onOpenOnline?.();
            }}
            className="btn-turq w-full !min-h-[48px] text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Globe size={18} />
            <span>{t.enterOnlineLobby || (isFa ? 'ورود به لابی آنلاین دورهمی' : 'Enter Online Party Lobby')}</span>
            {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </section>
      )}

      {/* PANEL 1: SIDE-BY-SIDE NATIVE & LEARNING LANGUAGES */}
      <section className="panel space-y-3" id="nativeLangContainer">
        {/* Actionable Error if user deselects all learning languages */}
        {langError && (
          <div className="p-2.5 rounded-[12px] bg-[#E0533C]/15 border border-[#E0533C] text-xs font-bold text-[#E0533C] flex items-center justify-between animate-fade-in">
            <span>{langError}</span>
            <button type="button" onClick={() => setLangError(null)} className="text-[#E0533C] p-0.5 hover:opacity-80">
              <X size={14} />
            </button>
          </div>
        )}

        {/* 2-Column Side-by-Side Row for Native Language & Learning Language */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2" id="targetLangContainer">
          {/* Column 1: My Native Language */}
          <div className="space-y-1.5 min-w-0" role="radiogroup" aria-label={t.myNativeLanguage || (isRTL ? 'زبان من' : 'My Language')}>
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-[var(--mute)] truncate">
                {t.myNativeLanguage || (isRTL ? 'زبان من:' : 'My Language:')}
                <span className="sr-only">زبان مادری من</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsNativeOpen(prev => !prev);
                setIsTargetOpen(false);
                setIsLangPopOpen(false);
              }}
              className={`w-full h-11 px-2.5 rounded-xl bg-[var(--bg)] border flex items-center justify-between transition-colors shadow-xs gap-1.5 cursor-pointer ${
                isNativeOpen ? 'border-[var(--lapis)] ring-2 ring-[var(--lapis)]/15' : 'border-[var(--line)] hover:border-[var(--lapis)]'
              }`}
              aria-expanded={isNativeOpen}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-6 h-6 rounded-md bg-[var(--ink)] text-[var(--bg)] font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                  {currentNativeLangInfo?.short || normalizedNativeCode.slice(0, 2).toUpperCase() || 'EN'}
                </span>
                <span className="text-xs font-extrabold text-[var(--ink)] truncate">
                  {isFa
                    ? (PERSIAN_LANG_NAMES[normalizedNativeCode] || currentNativeLangInfo?.name || 'فارسی')
                    : (currentNativeLangInfo?.name || 'English')}
                </span>
              </div>
              <ChevronDown size={15} className={`text-[var(--mute)] transition-transform duration-200 shrink-0 ${isNativeOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Center Swap Button */}
          <button
            type="button"
            onClick={() => {
              if (!currentTargetCode) return;
              sound.playToggle();
              const prevNative = currentNativeCode;
              const prevTarget = currentTargetCode;
              onSave({
                ...settings,
                nativeLanguage: prevTarget,
                targetLanguages: [prevNative],
                targetLanguage: prevNative
              });
            }}
            title={isFa ? 'جابجایی زبان مبدأ و هدف' : 'Swap languages'}
            className="w-9 h-11 rounded-xl bg-[var(--bg)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowRightLeft size={15} />
          </button>

          {/* Column 2: Learning Language */}
          <div className="space-y-1.5 min-w-0" role="group" aria-label={t.languagesIWantToLearn || (isFa ? 'زبان هدف' : 'Learning Language')}>
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-[var(--mute)] truncate">
                {t.learningLabel || (isFa ? 'زبان یادگیری:' : 'Learning:')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsTargetOpen(prev => !prev);
                setIsNativeOpen(false);
                setIsLangPopOpen(false);
              }}
              className={`w-full h-11 px-2.5 rounded-xl bg-[var(--bg)] border flex items-center justify-between transition-colors shadow-xs gap-1.5 cursor-pointer ${
                isTargetOpen ? 'border-[var(--lapis)] ring-2 ring-[var(--lapis)]/15' : 'border-[var(--line)] hover:border-[var(--lapis)]'
              }`}
              aria-expanded={isTargetOpen}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {currentTargetLangInfo ? (
                  <span 
                    data-testid="target-lang-tag"
                    className="inline-flex items-center gap-1.5 min-w-0 max-w-full"
                  >
                    <span className="w-6 h-6 rounded-md bg-[var(--lapis)] text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                      {currentTargetLangInfo.short}
                    </span>
                    <span className="text-xs font-extrabold text-[var(--ink)] truncate">
                      {isFa ? (PERSIAN_LANG_NAMES[currentTargetLangInfo.code] || currentTargetLangInfo.name) : currentTargetLangInfo.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[var(--mute)] truncate">
                    {t.selectLangPlaceholder || (isFa ? 'انتخاب زبان...' : 'Select...')}
                  </span>
                )}
              </div>
              <ChevronDown size={15} className={`text-[var(--mute)] transition-transform duration-200 shrink-0 ${isTargetOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Full-Width Dropdown Menu for Native Language */}
        <div className={`p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm space-y-2 ${isNativeOpen ? 'block animate-fade-in' : 'hidden'}`}>
          <div className="relative">
            <input
              type="text"
              value={searchNative}
              onChange={(e) => setSearchNative(e.target.value)}
              placeholder={t.searchLanguages || (isFa ? 'جستجوی زبان من...' : 'Search native language...')}
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
                const isCurrent = normalizedNativeCode === l.code;
                const subName = isFa ? PERSIAN_LANG_NAMES[l.code] : l.enName;
                return (
                  <button
                    key={`native-opt-${l.code}`}
                    type="button"
                    role="radio"
                    aria-checked={isCurrent}
                    onClick={() => handleNativeChange(l.code)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
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
                      {subName && subName !== l.name && (
                        <span className={`text-[10.5px] whitespace-nowrap truncate ${isCurrent ? 'opacity-80' : 'text-[var(--mute)]'}`}>
                          ({subName})
                        </span>
                      )}
                    </span>
                    {isCurrent && <Check size={14} className="shrink-0 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Full-Width Dropdown Menu for Learning Language */}
        <div className={`p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-sm space-y-2 ${isTargetOpen ? 'block animate-fade-in' : 'hidden'}`} id="chips">
          <div className="relative">
            <input
              type="text"
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              placeholder={t.searchLanguages || (isFa ? 'جستجوی زبان یادگیری...' : 'Search learning language...')}
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

          <div className="max-h-52 overflow-y-auto space-y-1 no-scrollbar overscroll-contain">
            {filteredTargetLanguages.length === 0 ? (
              <div className="text-xs text-[var(--mute)] py-2 text-center">{t.noLanguagesFound || 'No languages found'}</div>
            ) : (
              filteredTargetLanguages.map(l => {
                const isSelected = (normalizedTargetCode === l.code);
                const subName = isFa ? PERSIAN_LANG_NAMES[l.code] : l.enName;
                return (
                  <button
                    key={`target-opt-${l.code}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      selectLearningLang(l.code);
                      setIsTargetOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                      isSelected 
                        ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs' 
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
                      {subName && subName !== l.name && (
                        <span className={`text-[10.5px] whitespace-nowrap truncate ${isSelected ? 'opacity-80' : 'text-[var(--mute)]'}`}>
                          ({subName})
                        </span>
                      )}
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

        {/* Level Pills Responsive Grid (5 real CEFR levels: A1 to C1) */}
        <div 
          className="grid grid-cols-5 gap-1.5"
          role="radiogroup" 
          aria-label={t.cefrLevel || (isRTL ? 'سطح دشواری' : 'Proficiency Level')}
        >
          {CEFR_LEVELS.map(level => {
            const isSelected = currentCefr === level.id;
            const levelName = getCefrText(level.name, settings.language) || level.id;
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
              <span>{getCefrText(activeCefrInfo.name, settings.language)}</span>
            </div>
            <p className="text-[10.5px] text-[var(--mute)] leading-relaxed">
              {getCefrText(activeCefrInfo.desc, settings.language)}
            </p>
            {activeCefrInfo.example && (
              <div className="text-[10px] text-[var(--turq)] font-medium pt-0.5 border-t border-[var(--line)]">
                {getCefrText(activeCefrInfo.example, settings.language)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* PANEL 3: PLAYER COUNT (4, 6, 8) */}
      <section className="panel">
        <div className="lab whitespace-nowrap">{t.howManyPlayers || (isFa ? 'تعداد بازیکنان' : 'How many players?')}</div>
        <div className="seg" id="players">
          {[4, 6, 8].map(count => {
            const isChecked = settings.playerCount === count;
            const countLabel = `${toPersian(count, isFa)} ${t.players || (isFa ? 'نفر' : 'players')}`;
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
                className="w-full min-h-[38px] py-1.5 mb-1 rounded-xl bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                aria-label={isRTL ? 'افزایش راند' : 'Increase round'}
                title={isRTL ? 'افزایش ۱ راند' : '+1 round'}
              >
                <ChevronUp size={16} />
              </button>

              <TumblerWheel
                items={roundOptions}
                selected={settings.roundsCount}
                onSelect={(val) => updateSettings('roundsCount', val)}
                format={(val) => toPersian(val, isFa)}
                ariaLabel={t.roundsCountLabel || 'Number of Rounds'}
              />

              {/* Decrease Round Stepper */}
              <button
                type="button"
                onClick={decrementRound}
                disabled={settings.roundsCount <= 3}
                className="w-full min-h-[38px] py-1.5 mt-1 rounded-xl bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                aria-label={isFa ? 'کاهش راند' : 'Decrease round'}
                title={isFa ? 'کاهش ۱ راند' : '-1 round'}
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <span className="text-[10px] font-bold text-[var(--mute)] pt-1 whitespace-nowrap">
              {t.roundsRangeLabel || (isFa ? 'راند (۳ تا ۱۰)' : '3 to 10')}
            </span>
          </div>

          {/* Time Column: Separated Minutes (1 by 1) & Seconds (5 by 5) with Steppers */}
          <div className="flex flex-col items-center">
            <div className="lab whitespace-nowrap truncate w-full text-center">{t.turnTimeLabel || (isFa ? 'زمان هر دور' : 'Turn Duration')}</div>
            
            <div className="w-full" dir="ltr">
              {/* Top Increment Steppers */}
              <div className="grid grid-cols-2 gap-1.5 mb-1">
                <button 
                  type="button" 
                  onClick={incrementMinute}
                  disabled={currentMin >= 10}
                  className="min-h-[38px] py-1.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-1 text-xs font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isFa ? 'افزایش دقیقه' : 'Increase minute'}
                  title={isFa ? 'افزایش ۱ دقیقه' : '+1 min'}
                >
                  <ChevronUp size={14} />
                  <span className="whitespace-nowrap">{isFa ? '+۱د' : '+1m'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={incrementSecond}
                  disabled={currentSec >= 55 && currentMin >= 10}
                  className="min-h-[38px] py-1.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-1 text-xs font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isFa ? 'افزایش ۵ ثانیه' : 'Increase 5 seconds'}
                  title={isFa ? 'افزایش ۵ ثانیه' : '+5 sec'}
                >
                  <ChevronUp size={14} />
                  <span className="whitespace-nowrap">{isFa ? '+۵ث' : '+5s'}</span>
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
                    format={(val) => toPersian(val, isFa)}
                    ariaLabel={isFa ? 'دقیقه' : 'Minutes'}
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
                    format={(val) => toPersian(String(val).padStart(2, '0'), isFa)}
                    ariaLabel={isFa ? 'زمان هر نوبت' : 'Turn Duration'}
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
                  className="min-h-[38px] py-1.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-1 text-xs font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isFa ? 'کاهش دقیقه' : 'Decrease minute'}
                  title={isFa ? 'کاهش ۱ دقیقه' : '-1 min'}
                >
                  <ChevronDown size={14} />
                  <span className="whitespace-nowrap">{isFa ? '-۱د' : '-1m'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={decrementSecond}
                  disabled={currentSec <= 5 && currentMin <= 0}
                  className="min-h-[38px] py-1.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center gap-1 text-xs font-bold text-[var(--ink)] disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
                  aria-label={isFa ? 'کاهش ۵ ثانیه' : 'Decrease 5 seconds'}
                  title={isFa ? 'کاهش ۵ ثانیه' : '-5 sec'}
                >
                  <ChevronDown size={14} />
                  <span className="whitespace-nowrap">{isFa ? '-۵ث' : '-5s'}</span>
                </button>
              </div>

            </div>

            {/* Sub-label indicators */}
            <div className="flex items-center justify-around w-full text-[10px] font-bold text-[var(--mute)] pt-1 px-1 whitespace-nowrap" dir="ltr">
              <span>{t.minStepLabel || (isFa ? 'دقیقه (یکی یکی)' : 'Min (1-by-1)')}</span>
              <span>{t.secStepLabel || (isFa ? 'ثانیه (۵ تا ۵ تا)' : 'Sec (5-by-5)')}</span>
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

        {/* Row 3: Card Reveal on Correct/Skip */}
        <div className="row-ux">
          <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
            <b className="whitespace-nowrap">{t.cardRevealOnGuess || (isRTL ? 'نمایش کارت بعد از حدس' : 'Card Reveal on Guess')}</b>
            <small className="block text-xs text-[var(--mute)] leading-tight mt-0.5">
              {t.cardRevealDesc || (isRTL ? 'نمایش معنی و مثال آموزشی پس از هر پاسخ' : 'Show translation & example after each guess')}
            </small>
          </div>
          <button 
            type="button"
            className="sw shrink-0" 
            role="switch" 
            aria-checked={settings.cardRevealEnabled !== false}
            aria-label={t.cardRevealOnGuess || (isRTL ? 'نمایش کارت بعد از حدس' : 'Card Reveal on Guess')}
            onClick={() => {
              sound.playToggle();
              updateSettings('cardRevealEnabled', settings.cardRevealEnabled === false);
            }}
          />
        </div>

        <hr className="border-0 border-t border-[var(--line)] my-2" />

        {/* Direction Segment: Abbreviated Language Codes so labels never truncate */}
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
                className="whitespace-nowrap px-2 text-xs font-extrabold leading-none min-w-0 min-h-[44px]"
                title={d.title}
                onClick={() => {
                  sound.playToggle();
                  updateSettings('cardGameMode', d.id);
                }}
              >
                <span className="whitespace-nowrap" dir="ltr">{d.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* POOL SIZE GUARD WARNING BANNER */}
      {isPoolEmpty ? (
        <div className="mx-4 sm:mx-6 mb-3 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in text-start">
          <AlertTriangle size={18} className="shrink-0 text-rose-600" />
          <span>
            {isRTL
              ? `ترکیب سطح (${activeCefrInfo?.title || settings.cefrLevel}) و موضوعات انتخابی هیچ کارتی ندارد (۰ کارت). لطفاً دسته‌های موضوعی دیگری را اضافه کنید یا سطح را به «همه سطوح» تغییر دهید.`
              : `No cards available for this CEFR level and topic selection (0 cards). Please choose more categories or select All levels.`}
          </span>
        </div>
      ) : isPoolInsufficient ? (
        <div className="mx-4 sm:mx-6 mb-3 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-2 animate-fade-in text-start">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span>
            {isRTL
              ? `کارت‌های موجود (${toPersian(availablePoolCount, isRTL)}) از حد نصاب استاندارد (${toPersian(requiredCardCount, isRTL)}) کمتر است و ممکن است در راندهای پایانی تکرار شوند.`
              : `Available cards (${availablePoolCount}) is below the recommended threshold (${requiredCardCount}). Some cards may repeat.`}
          </span>
        </div>
      ) : null}

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="start-bar">
        <button 
          type="button"
          className="start-btn disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t.nextStartGame || (isRTL ? 'مرحله بعد: شروع بازی گروهی' : 'Next: Start Party Game')}
          onClick={() => {
            if (isPoolEmpty) {
              sound.playBuzzer();
              return;
            }
            const hasValidTargets = Array.isArray(settings.targetLanguages) && settings.targetLanguages.length > 0 && settings.targetLanguages[0];
            if (!hasValidTargets) {
              setLangError(isRTL ? 'لطفاً حداقل یک زبان برای یادگیری انتخاب کنید' : 'Please select at least one learning language');
              setIsTargetOpen(true);
              sound.playBuzzer();
              return;
            }
            sound.playStartGame();
            onNext();
          }}
          disabled={!settings.targetLanguages || settings.targetLanguages.length === 0 || isPoolEmpty}
        >
          <span className="whitespace-nowrap">{t.nextStartGame || (isRTL ? 'مرحله بعد: شروع بازی گروهی' : 'Next: Start Party Game')}</span>
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
        <div className="sheet-card" role="dialog" aria-labelledby="sheetTitle" onClick={e => e.stopPropagation()}>
          <div className="sheet-bar" />
          <div className="flex items-center justify-between mb-2">
            <h2 id="sheetTitle" className="text-lg font-black text-[var(--ink)] m-0 flex items-center gap-2">
              <BookOpen size={18} className="text-[var(--lapis)] shrink-0" />
              <span>{t.gameRules || (isFa ? 'راهنمای بازی دور: زبان' : 'Game Rules')}</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsSheetOpen(false)}
              aria-label={t.close || (isFa ? 'بستن' : 'Close')}
              className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="text-xs sm:text-sm text-[var(--ink)]/80 space-y-2.5 leading-relaxed overflow-y-auto max-h-[60vh] pr-1">
            <p>
              {t.guideText1 || (isFa 
                ? '«دور» یک بازی گروهی هیجان‌انگیز است که دور یک میز یا به‌صورت آنلاین بین اعضای تیم‌ها بازی می‌شود.'
                : 'Turn is an exciting party game played around the table or online between team members.')}
            </p>
            <p>
              {t.guideText2 || (isFa
                ? 'هم‌تیمی‌های شما روبه‌روی شما می‌نشینند. شما باید کلمه یا عبارت روی کارت را برای هم‌تیمی خود توضیح دهید یا ترجمه کنید تا حدس بزند.'
                : 'Teammates sit across from each other. The active player explains, describes, or acts out the card content for their partner.')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {onOpenHelp && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsSheetOpen(false);
                  onOpenHelp();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--line)]/60 border border-[var(--line)] text-[var(--ink)] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen size={15} className="text-[var(--lapis)]" />
                <span>{t.gameRules || (isFa ? 'راهنمای کامل برنامه' : 'Full App Guide')}</span>
              </button>
            )}
            <button 
              type="button" 
              className="start-btn w-full" 
              onClick={() => setIsSheetOpen(false)}
              aria-label={t.gotIt || (isFa ? 'فهمیدم' : 'Got it')}
            >
              <span>{t.gotIt || (isFa ? 'فهمیدم' : 'Got it')}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SetupScreen;
