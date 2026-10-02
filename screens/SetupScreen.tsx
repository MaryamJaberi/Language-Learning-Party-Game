import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameSettings, Language } from '../types';
import { sound } from '../soundManager';
import { getRandomCharacters } from '../characters';
import { tUI, isRtlLang } from '../ui';
import { ArrowLeft, ArrowRight, Check, Search, X } from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
}

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
}

const TumblerWheel: React.FC<WheelProps> = ({ items, selected, onSelect, format, ariaLabel }) => {
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

  return (
    <div className="wheelbox">
      <div 
        ref={wheelRef}
        className="wheel"
        tabIndex={0}
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuenow={selected}
        aria-valuetext={format(selected)}
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Close guide or language popover on Escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSheetOpen(false);
        setIsLangPopOpen(false);
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
  const languageOptions = [
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
  ];

  // Filter languages in real-time by search query
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return languageOptions;
    return languageOptions.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.short.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q) || 
      l.enName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentNativeCode = (settings.nativeLanguage || settings.language || 'fa') as Language;

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
  };

  // Tumbler items
  const roundOptions = [3, 4, 5, 6, 7, 8, 9, 10];
  const timeOptions = [6, 8, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300];

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const secStr = String(secs).padStart(2, '0');
    return `${toPersian(mins, isRTL)}:${toPersian(secStr, isRTL)}`;
  };

  return (
    <div className="app w-full max-w-[440px] mx-auto min-h-screen px-3.5 pb-24 font-ui relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* HEADER: Title & Circular Action Buttons */}
      <header className="sticky top-0 z-20 bg-[var(--bg)] flex items-center justify-between py-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-[34px] sm:text-[38px] font-black leading-none tracking-tight text-[var(--ink)]">
            {t.title || 'دور'}
          </h1>
          <span className="text-xs font-bold text-[var(--mute)] bg-[var(--panel)] px-2.5 py-1 rounded-full border border-[var(--line)]">
            {t.gameSettings || t.setup || (isRTL ? 'تنظیمات بازی' : 'Settings')}
          </span>
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
            }}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
            </svg>
          </button>

          {/* UI Language Popover */}
          <div className="pop" id="uiPop" role="menu" hidden={!isLangPopOpen}>
            {[
              { code: 'fa', name: 'فارسی' },
              { code: 'nl', name: 'Nederlands' },
              { code: 'en', name: 'English' },
              { code: 'de', name: 'Deutsch' },
              { code: 'fr', name: 'Français' },
              { code: 'es', name: 'Español' },
              { code: 'tr', name: 'Türkçe' }
            ].map(l => {
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
                  className="flex items-center justify-between w-full gap-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[var(--bg)] font-mono font-black text-[10px] flex items-center justify-center border border-[var(--line)] shrink-0">
                      {l.code.slice(0, 2).toUpperCase()}
                    </span>
                    <span>{l.name}</span>
                  </span>
                  {isChecked && <Check size={14} className="text-[var(--lapis)]" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* PANEL 1: LANGUAGES PAIR - Exact layout from user drawing and image */}
      <section className="panel">
        {/* Real-time Language Search Bar */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchLanguages || (isRTL ? 'جستجوی زبان...' : 'Search languages...')}
            className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-[var(--lapis)] transition-colors pr-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3"
          />
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none rtl:right-3 ltr:left-3" />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] p-1 rtl:left-2 ltr:right-2"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Actionable Error if user deselects all learning languages */}
        {langError && (
          <div className="mb-2.5 p-2.5 rounded-[12px] bg-[#E0533C]/15 border border-[#E0533C] text-xs font-bold text-[#E0533C] flex items-center justify-between animate-fade-in">
            <span>{langError}</span>
            <button type="button" onClick={() => setLangError(null)} className="text-[#E0533C] p-0.5 hover:opacity-80">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {/* Section A: Native Language */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-xs font-bold text-[var(--mute)]">
                {t.myNativeLanguage || (isRTL ? 'زبان مادری من (Native):' : 'My Native Language:')}
              </span>
              <span className="text-xs font-black text-[var(--lapis)]">
                {languageOptions.find(l => l.code === currentNativeCode)?.name || 'فارسی'}
              </span>
            </div>

            {/* Horizontal Scrolling Chips Container */}
            <div 
              className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth" 
              role="radiogroup" 
              aria-label={t.myNativeLanguage || 'Native Language'}
            >
              {filteredLanguages.length === 0 ? (
                <div className="text-xs text-[var(--mute)] py-1 px-2">{t.noLanguagesFound || 'No languages found'}</div>
              ) : (
                filteredLanguages.map(l => {
                  const isCurrent = currentNativeCode === l.code;
                  return (
                    <button
                      key={`native-${l.code}`}
                      type="button"
                      role="radio"
                      aria-checked={isCurrent}
                      aria-pressed={isCurrent}
                      className={`shrink-0 chip inline-flex items-center gap-1.5 transition-all text-xs font-bold py-2 px-3.5 rounded-full border ${
                        isCurrent 
                          ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] shadow-sm' 
                          : 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--mute)]'
                      }`}
                      onClick={() => handleNativeChange(l.code)}
                    >
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/20">
                        {l.short}
                      </span>
                      <span>{l.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Arrow Divider matching image.png */}
          <div className="flex items-center justify-center text-[var(--mute)] opacity-70 py-0.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>

          {/* Section B: Learning Languages */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-xs font-bold text-[var(--mute)]">
                {t.languagesIWantToLearn || (isRTL ? 'زبان‌هایی که می‌خوام یاد بگیرم (Target):' : 'Languages I Want to Learn:')}
              </span>
              <span className="text-xs font-bold text-[var(--mute)]">
                {toPersian(settings.targetLanguages?.length || 0, isRTL)} {t.active || (isRTL ? 'زبان فعال' : 'active')}
              </span>
            </div>

            {/* Horizontal Scrolling Chips Container */}
            <div 
              className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth" 
              id="chips" 
              role="group" 
              aria-label={t.languagesIWantToLearn || 'Languages I Want to Learn'}
            >
              {filteredLanguages.filter(l => l.code !== currentNativeCode).length === 0 ? (
                <div className="text-xs text-[var(--mute)] py-1 px-2">{t.noLanguagesFound || 'No languages found'}</div>
              ) : (
                filteredLanguages
                  .filter(l => l.code !== currentNativeCode)
                  .map(l => {
                    const isSelected = settings.targetLanguages?.includes(l.code as Language);
                    return (
                      <button
                        key={`target-${l.code}`}
                        type="button"
                        aria-pressed={isSelected}
                        className={`shrink-0 chip inline-flex items-center gap-1.5 transition-all text-xs font-bold py-2 px-3.5 rounded-full border ${
                          isSelected 
                            ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-sm' 
                            : 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--mute)]'
                        }`}
                        onClick={() => toggleLearningLang(l.code)}
                      >
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/20">
                          {l.short}
                        </span>
                        <span>{l.name}</span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PANEL 2: PLAYER COUNT (Clean 4 / 6 / 8 selector from HTML) */}
      <section className="panel">
        <div className="lab mb-2">{t.howManyPlayers || (isRTL ? 'چند نفره؟' : 'How many players?')}</div>
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

      {/* PANEL 3: LUGGAGE LOCK WHEELS (Rounds & Turn Time) */}
      <section className="panel">
        <div className="lock">
          {/* Rounds Wheel */}
          <div>
            <div className="lab">{t.roundsCountLabel || (isRTL ? 'تعداد راند' : 'Number of Rounds')}</div>
            <TumblerWheel
              items={roundOptions}
              selected={settings.roundsCount}
              onSelect={(val) => updateSettings('roundsCount', val)}
              format={(val) => toPersian(val, isRTL)}
              ariaLabel={t.roundsCountLabel || 'Number of Rounds'}
            />
          </div>

          {/* Time Wheel */}
          <div>
            <div className="lab">{t.turnTimeLabel || (isRTL ? 'زمان هر نوبت' : 'Turn Duration')}</div>
            <TumblerWheel
              items={timeOptions}
              selected={settings.roundDuration}
              onSelect={(val) => updateSettings('roundDuration', val)}
              format={formatTime}
              ariaLabel={t.turnTimeLabel || 'Turn Duration'}
            />
          </div>
        </div>
      </section>

      {/* PANEL 4: SWITCHES & TRANSLATION DIRECTION */}
      <section className="panel">
        {/* Row 1: Auto Pronunciation */}
        <div className="row-ux">
          <div>
            <b>{t.autoPronounce || (isRTL ? 'تلفظ خودکار' : 'Auto Pronunciation')}</b>
            <small>{t.autoPronounceDesc || (isRTL ? 'کارت که اومد، کلمه خوانده می‌شه' : 'When card appears, the word is spoken')}</small>
          </div>
          <button 
            type="button"
            className="sw" 
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
          <div>
            <b>{t.hotSeat || (isRTL ? 'صندلی داغ' : 'Hot Seat')}</b>
            <small>{t.hotSeatDesc || (isRTL ? 'گوشی سریع دست‌به‌دست می‌شه' : 'Fast handoff between players')}</small>
          </div>
          <button 
            type="button"
            className="sw" 
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

        {/* Direction Segment */}
        <div className="lab">{t.cardDirection || (isRTL ? 'جهت ترجمه کارت‌ها' : 'Card Translation Direction')}</div>
        <div className="seg sm" id="dir" role="radiogroup" aria-label={t.cardDirection || 'Card Translation Direction'}>
          {[
            { id: 'reverse', text: t.dirNativeToTarget || (isRTL ? 'زبان من ← زبان یادگیری' : 'Native → Target') },
            { id: 'standard', text: t.dirTargetToNative || (isRTL ? 'زبان یادگیری ← زبان من' : 'Target → Native') },
            { id: 'mixed', text: t.dirBoth || (isRTL ? 'هر دو' : 'Both') }
          ].map(d => {
            const isChecked = (settings.cardGameMode || 'mixed') === d.id;
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={isChecked}
                onClick={() => {
                  sound.playToggle();
                  updateSettings('cardGameMode', d.id);
                }}
              >
                {d.text}
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
          <span>{t.nextStartGame || (isRTL ? 'مرحله بعد: شروع بازی' : 'Next: Start Game')}</span>
          {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
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
        <div className="sheet-box" role="dialog" aria-label={t.guideTitle || t.guide || 'Guide'}>
          <h2>{t.guideTitle || t.guide || (isRTL ? 'راهنما' : 'Guide')}</h2>
          <p>{t.guideText1 || (isRTL ? 'زبان مادری و زبان‌هایی که می‌خوای یاد بگیری رو انتخاب کن؛ می‌تونی چند زبان با هم بزنی.' : 'Choose your native language and the languages you want to learn.')}</p>
          <p>{t.guideText2 || (isRTL ? 'راند و زمان رو مثل قفل چمدون بالا و پایین کن.' : 'Scroll the luggage lock wheels up and down to adjust rounds and turn duration.')}</p>
          <button 
            type="button"
            className="sheet-close-btn" 
            id="sheetClose"
            onClick={() => setIsSheetOpen(false)}
          >
            {t.gotIt || (isRTL ? 'فهمیدم' : 'Got it')}
          </button>
        </div>
      </div>

    </div>
  );
};

export default SetupScreen;
