import React, { useState, useEffect } from 'react';
import { 
  Language, 
  CEFRLevel, 
  SinglePlayerSettings, 
  SinglePlayerDisplayMode 
} from '../types';
import { SUPPORTED_LANGUAGES, CEFR_LEVELS } from '../constants';
import { FlagIcon } from './FlagIcon';
import { LanguagePickerModal } from './LanguagePickerModal';
import { sound } from '../soundManager';
import { tUI, isRtlLang } from '../ui';
import { getSavedMistakes } from '../mistakeReviewService';
import { 
  X, 
  Play, 
  Headphones, 
  FileText, 
  Sparkles, 
  Clock, 
  Layers, 
  Volume2,
  Globe,
  Languages,
  ArrowRightLeft,
  RotateCcw,
  AlertCircle,
  Box,
  Target,
  Zap
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  language: Language;
  initialSettings: SinglePlayerSettings;
  onClose: () => void;
  onStart: (settings: SinglePlayerSettings) => void;
  onPracticeMistakes?: () => void;
  onOpenLeitner?: () => void;
}

const SinglePlayerSetupModal: React.FC<Props> = ({
  isOpen,
  language,
  initialSettings,
  onClose,
  onStart,
  onPracticeMistakes,
  onOpenLeitner
}) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);

  const [settings, setSettings] = useState<SinglePlayerSettings>(initialSettings);
  const [pickerMode, setPickerMode] = useState<'target' | 'native' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const currentTargetLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === settings.targetLanguage) || SUPPORTED_LANGUAGES[0];
  const currentNativeLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === settings.nativeLanguage) || SUPPORTED_LANGUAGES[0];

  const unmasteredCount = getSavedMistakes().filter(m => !m.mastered).length;

  const handleStart = () => {
    sound.playStartGame();
    onStart(settings);
  };

  return (
    <>
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm max-h-[92dvh] flex flex-col bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-2xl overflow-hidden text-[var(--ink)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--bg)] p-3.5 text-[var(--ink)] flex items-center justify-between border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[var(--lapis)] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight font-display">{t.singlePlayer}</h2>
              <p className="text-[10px] text-[var(--mute)] font-bold">{isRTL ? 'فلش‌کارت انفرادی و چالش گفتار' : 'Flashcard & Voice Challenge'}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-[var(--ink)]">

          {/* Quick Practice Mistakes Banner */}
          {unmasteredCount > 0 && onPracticeMistakes && (
            <div className="p-3 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                  <RotateCcw size={14} />
                  <span>{isRTL ? `بانک اشتباهات: ${unmasteredCount} کارت` : `Mistakes Bank: ${unmasteredCount} cards`}</span>
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                  {isRTL ? 'نیاز به دوره' : 'Review'}
                </span>
              </div>
              <p className="text-[10.5px] text-[var(--mute)] leading-relaxed">
                {isRTL 
                  ? 'کارت‌هایی که قبلاً اشتباه پاسخ داده‌اید، به همراه سؤالات مشابه از نظر گرامر و کاربرد آماده دوره هستند.' 
                  : 'Cards you missed are ready with parallel grammar variants.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  sound.playStartGame();
                  onPracticeMistakes();
                }}
                className="w-full py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
              >
                <Sparkles size={14} />
                <span>{isRTL ? 'دوره این اشتباهات + سؤالات مشابه 🚀' : 'Practice Mistakes & Variants 🚀'}</span>
              </button>
            </div>
          )}

          {/* Quick Leitner Box Spaced Repetition Card */}
          {onOpenLeitner && (
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Box size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400 block truncate">
                    {isRTL ? 'جعبه لایتنر ۵ خانه (مرور روزانه)' : '5-Box Leitner Daily Review'}
                  </span>
                  <span className="text-[10px] text-[var(--mute)] block truncate">
                    {isRTL ? 'جلوگیری از فراموشی با فواصل زمانی' : 'Spaced repetition practice'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playStartGame();
                  onClose();
                  onOpenLeitner();
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shrink-0 shadow-xs active:scale-95 transition-transform cursor-pointer"
              >
                <span>{isRTL ? 'ورود 📦' : 'Enter 📦'}</span>
              </button>
            </div>
          )}
          
          {/* 1. Streamlined Clean Language Selection Pair */}
          <div className="space-y-2 p-3 bg-[var(--bg)] border border-[var(--line)] rounded-2xl">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-[var(--lapis)]" />
                <span>{isRTL ? 'انتخاب زبان‌ها:' : 'Languages:'}</span>
              </span>
              <span className="text-[10px] text-[var(--mute)] font-medium">
                {isRTL ? '۳۸ زبان بین‌المللی' : '38 Languages'}
              </span>
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
              {/* Target Language Card */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setPickerMode('target');
                }}
                className="p-2.5 rounded-xl bg-[var(--panel)] hover:bg-[var(--line)]/40 border border-[var(--line)] text-start shadow-xs active:scale-98 transition-all cursor-pointer min-w-0"
              >
                <div className="text-[9.5px] text-[var(--mute)] font-bold mb-1 flex items-center justify-between">
                  <span>{isRTL ? 'زبان تمرین (هدف)' : 'Target'}</span>
                  <span className="text-[9px] text-[var(--lapis)]">▾</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center shrink-0">
                    <FlagIcon language={settings.targetLanguage} size={15} />
                  </div>
                  <span className="font-extrabold text-xs text-[var(--ink)] truncate">
                    {currentTargetLangInfo.nativeName.split(' ')[0]}
                  </span>
                </div>
              </button>

              {/* Quick Swap Languages */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({
                    ...s,
                    targetLanguage: s.nativeLanguage,
                    nativeLanguage: s.targetLanguage
                  }));
                }}
                className="w-7 h-7 rounded-full bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--lapis)] text-[var(--ink)] flex items-center justify-center shadow-2xs active:scale-90 transition-all cursor-pointer"
                title={isRTL ? 'جابجایی زبان‌ها' : 'Swap languages'}
              >
                <ArrowRightLeft size={12} className="text-[var(--mute)]" />
              </button>

              {/* Native / Reference Language Card */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setPickerMode('native');
                }}
                className="p-2.5 rounded-xl bg-[var(--panel)] hover:bg-[var(--line)]/40 border border-[var(--line)] text-start shadow-xs active:scale-98 transition-all cursor-pointer min-w-0"
              >
                <div className="text-[9.5px] text-[var(--mute)] font-bold mb-1 flex items-center justify-between">
                  <span>{isRTL ? 'زبان راهنما (مبدأ)' : 'Guide'}</span>
                  <span className="text-[9px] text-[var(--turq)]">▾</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center shrink-0">
                    <FlagIcon language={settings.nativeLanguage} size={15} />
                  </div>
                  <span className="font-extrabold text-xs text-[var(--ink)] truncate">
                    {currentNativeLangInfo.nativeName.split(' ')[0]}
                  </span>
                </div>
              </button>
            </div>

            {/* Quick-Pick Popular Target Language Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 no-scrollbar">
              {(['en-US', 'nl', 'de', 'fr', 'es', 'tr', 'ar', 'fa'] as Language[]).map(langCode => {
                const isSelected = settings.targetLanguage === langCode;
                const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                return (
                  <button
                    key={langCode}
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      setSettings(s => ({ ...s, targetLanguage: langCode }));
                    }}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs' 
                        : 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--bg)]'
                    }`}
                  >
                    <FlagIcon language={langCode} size={11} />
                    <span>{langInfo?.nativeName.split(' ')[0] || langCode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 & 4. Practice Style & CEFR Difficulty Level Compact Side-by-Side Menu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-2xl">
            {/* Practice Style Menu */}
            <div className="space-y-1">
              <label htmlFor="sp-style-select" className="text-[11px] font-bold text-[var(--ink)] flex items-center gap-1">
                <Languages size={12} className="text-[var(--lapis)]" />
                <span>{isRTL ? 'سبک تمرین:' : 'Practice Style:'}</span>
              </label>
              <select
                id="sp-style-select"
                value={settings.displayMode}
                onChange={(e) => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: e.target.value as any }));
                }}
                className="w-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[var(--lapis)] cursor-pointer"
              >
                <option value="text_and_audio">{isRTL ? '📖 روخوانی و تلفظ' : '📖 Reading & Speech'}</option>
                <option value="translate_to_target">{isRTL ? `🎯 ترجمه به ${currentTargetLangInfo.persianName}` : `🎯 To ${currentTargetLangInfo.name}`}</option>
                <option value="translate_to_native">{isRTL ? `🔄 ترجمه به ${currentNativeLangInfo.persianName}` : `🔄 To ${currentNativeLangInfo.name}`}</option>
                <option value="audio_only">{isRTL ? '🎧 چالش شنیداری' : '🎧 Listening Test'}</option>
              </select>
            </div>

            {/* CEFR Difficulty Level Menu */}
            <div className="space-y-1">
              <label htmlFor="sp-level-select" className="text-[11px] font-bold text-[var(--ink)] flex items-center gap-1">
                <Layers size={12} className="text-[var(--turq)]" />
                <span>{isRTL ? 'سطح دشواری (CEFR):' : 'Level (CEFR):'}</span>
              </label>
              <select
                id="sp-level-select"
                value={settings.cefrLevel || 'all'}
                onChange={(e) => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, cefrLevel: e.target.value as CEFRLevel }));
                }}
                className="w-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[var(--lapis)] cursor-pointer"
              >
                <option value="all">{isRTL ? '⭐ همه سطوح' : '⭐ All Levels'}</option>
                <option value="A1">A1 {isRTL ? '(مبتدی)' : '(Beginner)'}</option>
                <option value="A2">A2 {isRTL ? '(پایه)' : '(Elementary)'}</option>
                <option value="B1">B1 {isRTL ? '(متوسط)' : '(Intermediate)'}</option>
                <option value="B2">B2 {isRTL ? '(پیشرفته)' : '(Upper Intermediate)'}</option>
                <option value="C1">C1 {isRTL ? '(تسلط کامل)' : '(Advanced)'}</option>
              </select>
            </div>
          </div>

          {/* 5. Match Format: Total Match Time vs Card Count */}
          <div className="space-y-2 p-3 bg-[var(--bg)] border border-[var(--line)] rounded-2xl">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--saffron)]" />
                <span>{isRTL ? 'قالب تمرین و زمان:' : 'Match Format & Time:'}</span>
              </span>
              <span className="text-[10px] text-[var(--mute)] font-medium">
                {settings.matchMode === 'timed_match' ? (isRTL ? 'مسابقه لیدربرد 🏆' : 'Leaderboard Match 🏆') : (isRTL ? 'تمرین آزاد 🃏' : 'Free Practice 🃏')}
              </span>
            </div>

            {/* Match Mode Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--panel)] border border-[var(--line)] rounded-xl text-center">
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({
                    ...s,
                    matchMode: 'timed_match',
                    totalMatchSeconds: s.totalMatchSeconds || 60,
                    questionCount: 30 // Enough cards for speedrun in time
                  }));
                }}
                className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.matchMode === 'timed_match'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                <Zap size={13} />
                <span>{isRTL ? 'مسابقه زمان کل ⏱️' : 'Timed Match ⏱️'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({
                    ...s,
                    matchMode: 'card_count',
                    totalMatchSeconds: 0,
                    questionCount: s.questionCount > 20 ? 10 : s.questionCount
                  }));
                }}
                className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.matchMode !== 'timed_match'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                <Layers size={13} />
                <span>{isRTL ? 'تعداد کارت ثابت 🃏' : 'Fixed Cards 🃏'}</span>
              </button>
            </div>

            {/* Total Time Options for Timed Match */}
            {settings.matchMode === 'timed_match' ? (
              <div className="space-y-1 pt-1">
                <div className="text-[10px] text-[var(--mute)] font-bold">
                  {isRTL ? 'زمان کل مسابقه (حل بیشترین کارت و کسب امتیاز سطح):' : 'Total match duration (answer as many as possible):'}
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[30, 60, 90, 120].map(sec => {
                    const isSelected = (settings.totalMatchSeconds || 60) === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          sound.playToggle();
                          setSettings(s => ({
                            ...s,
                            totalMatchSeconds: sec,
                            timeLimitSeconds: sec
                          }));
                        }}
                        className={`py-1.5 rounded-xl border font-black text-[11px] transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs'
                            : 'bg-[var(--panel)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)]'
                        }`}
                      >
                        {sec} {isRTL ? 'ثانیه' : 's'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Fixed Card Count Options */
              <div className="space-y-1 pt-1">
                <div className="text-[10px] text-[var(--mute)] font-bold">
                  {isRTL ? 'تعداد کارت‌های این جلسه:' : 'Number of cards:'}
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[5, 10, 15, 20].map(cnt => {
                    const isSelected = settings.questionCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          sound.playToggle();
                          setSettings(s => ({ ...s, questionCount: cnt }));
                        }}
                        className={`py-1.5 rounded-xl border font-bold text-[11px] transition-all cursor-pointer active:scale-95 ${
                          isSelected 
                            ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs' 
                            : 'bg-[var(--panel)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)]'
                        }`}
                      >
                        {cnt} {isRTL ? 'کارت' : 'cards'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>



        </div>

        {/* Start Button */}
        <div className="p-3.5 bg-[var(--panel)] border-t border-[var(--line)]">
          <button
            onClick={handleStart}
            className="w-full py-3 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>{isRTL ? 'شروع تمرین هوشمند' : 'Start Practice'}</span>
          </button>
        </div>

      </div>
    </div>

    {/* Full Searchable Language Picker Modal */}
    {pickerMode && (
      <LanguagePickerModal
        isOpen={true}
        onClose={() => setPickerMode(null)}
        selectedLanguage={pickerMode === 'target' ? settings.targetLanguage : settings.nativeLanguage}
        onSelectLanguage={(lang) => {
          if (pickerMode === 'target') {
            setSettings(s => ({ ...s, targetLanguage: lang }));
          } else {
            setSettings(s => ({ ...s, nativeLanguage: lang }));
          }
          setPickerMode(null);
        }}
        mode="single"
        title={pickerMode === 'target' 
          ? (isRTL ? 'انتخاب زبان هدف تمرین' : 'Select Target Practice Language')
          : (isRTL ? 'انتخاب زبان مادری و راهنما' : 'Select Native Language')}
        subtitle={isRTL ? 'بیش از ۳۵ زبان زنده دنیا' : 'Over 35 supported languages'}
        isRTL={isRTL}
      />
    )}
    </>
  );
};

export default SinglePlayerSetupModal;
