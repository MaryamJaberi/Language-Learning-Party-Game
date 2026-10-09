import React, { useState } from 'react';
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
          
          {/* 1. Target Language Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Globe size={13} className="text-[var(--lapis)]" />
                <span>{isRTL ? 'زبان تمرین (Target Language):' : 'Target Language:'}</span>
              </label>
              <span className="text-[10px] text-[var(--mute)] font-bold">۳۸ زبان</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setPickerMode('target');
              }}
              className="w-full p-2.5 rounded-2xl bg-[var(--bg)] hover:bg-[var(--line)]/50 border border-[var(--line)] text-[var(--ink)] flex items-center justify-between shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-lg shadow-xs">
                  <FlagIcon language={settings.targetLanguage} size={20} />
                </div>
                <div className="text-start">
                  <div className="font-extrabold text-xs text-[var(--ink)]">
                    {currentTargetLangInfo.nativeName}
                  </div>
                  <div className="text-[9.5px] text-[var(--mute)] font-medium">
                    {isRTL ? 'زبان یادگیری و تمرین' : 'Target Practice Language'}
                  </div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[var(--lapis-soft)] text-[var(--lapis)] font-bold text-[11px] flex items-center gap-1">
                <span>{isRTL ? 'تغییر ▾' : 'Change ▾'}</span>
              </div>
            </button>

            {/* Quick-Pick Popular Language Chips */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
              {(['en-US', 'nl', 'de', 'fr', 'es', 'it', 'fa', 'tr', 'ar', 'ru', 'zh', 'ja'] as Language[]).map(langCode => {
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
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs' 
                        : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--panel)]'
                    }`}
                  >
                    <FlagIcon language={langCode} size={12} />
                    <span>{langInfo?.nativeName.split(' ')[0] || langCode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Native Reference Language (Hints & Prompts) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Languages size={13} className="text-[var(--turq)]" />
                <span>{isRTL ? 'زبان مبدأ (راهنما):' : 'Guide / Reference Language:'}</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setPickerMode('native');
              }}
              className="w-full p-2.5 rounded-2xl bg-[var(--bg)] hover:bg-[var(--line)]/50 border border-[var(--line)] text-[var(--ink)] flex items-center justify-between shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-lg shadow-xs">
                  <FlagIcon language={settings.nativeLanguage} size={20} />
                </div>
                <div className="text-start">
                  <div className="font-extrabold text-xs text-[var(--ink)]">
                    {currentNativeLangInfo.nativeName}
                  </div>
                  <div className="text-[9.5px] text-[var(--mute)] font-medium">
                    {isRTL ? 'راهنمای کارت‌ها' : 'Card Guide'}
                  </div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[var(--lapis-soft)] text-[var(--lapis)] font-bold text-[11px] flex items-center gap-1">
                <span>{isRTL ? 'تغییر ▾' : 'Change ▾'}</span>
              </div>
            </button>
          </div>

          {/* 3. Challenge Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Languages size={13} className="text-[var(--saffron)]" />
                <span>{isRTL ? 'سبک تمرین:' : 'Training Mode:'}</span>
              </div>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {/* Mode 1: Pronunciation & Reading */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: 'text_and_audio' }));
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer active:scale-98 ${
                  settings.displayMode === 'text_and_audio'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] font-bold shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--panel)]'
                }`}
              >
                <FileText size={15} />
                <span className="text-[11px] font-bold whitespace-nowrap">{isRTL ? 'روخوانی و تلفظ' : 'Reading & Speech'}</span>
                <span className="text-[9px] opacity-80 leading-tight whitespace-nowrap">
                  {isRTL ? 'دیدن متن + تلفظ' : 'See text + speech'}
                </span>
              </button>

              {/* Mode 2: Translate to Target Language */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: 'translate_to_target' }));
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer active:scale-98 ${
                  settings.displayMode === 'translate_to_target'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] font-bold shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--panel)]'
                }`}
              >
                <Languages size={15} />
                <span className="text-[11px] font-bold whitespace-nowrap">
                  {isRTL ? `${currentNativeLangInfo.persianName} به ${currentTargetLangInfo.persianName}` : `${currentNativeLangInfo.name} → ${currentTargetLangInfo.name}`}
                </span>
                <span className="text-[9px] opacity-80 leading-tight whitespace-nowrap">
                  {isRTL ? 'دیدن مبدأ ➔ حدس هدف' : 'Prompt ➔ target'}
                </span>
              </button>

              {/* Mode 3: Translate to Native */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: 'translate_to_native' }));
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer active:scale-98 ${
                  settings.displayMode === 'translate_to_native'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] font-bold shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--panel)]'
                }`}
              >
                <ArrowRightLeft size={15} />
                <span className="text-[11px] font-bold whitespace-nowrap">
                  {isRTL ? `${currentTargetLangInfo.persianName} به ${currentNativeLangInfo.persianName}` : `${currentTargetLangInfo.name} → ${currentNativeLangInfo.name}`}
                </span>
                <span className="text-[9px] opacity-80 leading-tight whitespace-nowrap">
                  {isRTL ? 'دیدن هدف ➔ حدس ترجمه' : 'Target ➔ meaning'}
                </span>
              </button>

              {/* Mode 4: Audio-Only */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: 'audio_only' }));
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer active:scale-98 ${
                  settings.displayMode === 'audio_only'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] font-bold shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--panel)]'
                }`}
              >
                <Headphones size={15} />
                <span className="text-[11px] font-bold">{isRTL ? '🎧 چالش شنیداری' : '🎧 Listening Test'}</span>
                <span className="text-[9px] opacity-80 leading-tight">
                  {isRTL ? 'فقط شنیدن بدون متن' : 'Audio without text'}
                </span>
              </button>
            </div>
          </div>

          {/* 4. CEFR Level Selection (A1, A2, B1, B2, C1, all) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Layers size={13} className="text-[var(--lapis)]" />
              <span>{isRTL ? 'سطح دشواری (CEFR):' : 'Level (CEFR):'}</span>
            </label>
            <div className="grid grid-cols-6 gap-1 text-center">
              {(['A1', 'A2', 'B1', 'B2', 'C1', 'all'] as CEFRLevel[]).map(lvl => {
                const isSelected = (settings.cefrLevel || 'all') === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      sound.playToggle();
                      setSettings(s => ({ ...s, cefrLevel: lvl }));
                    }}
                    className={`py-1.5 rounded-xl border font-bold text-[11px] transition-all cursor-pointer active:scale-95 ${
                      isSelected 
                        ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs' 
                        : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)]'
                    }`}
                  >
                    {lvl === 'all' ? (isRTL ? 'همه' : 'All') : lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Number of Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Clock size={13} className="text-[var(--saffron)]" />
              <span>{isRTL ? 'تعداد کارت‌ها:' : 'Number of Cards:'}</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[5, 10, 15, 20].map(cnt => {
                const isSelected = settings.questionCount === cnt;
                return (
                  <button
                    key={cnt}
                    onClick={() => {
                      sound.playToggle();
                      setSettings(s => ({ ...s, questionCount: cnt }));
                    }}
                    className={`py-1.5 rounded-xl border font-bold text-[11px] transition-all cursor-pointer active:scale-95 ${
                      isSelected 
                        ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs' 
                        : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)]'
                    }`}
                  >
                    {cnt} {isRTL ? 'کارت' : 'cards'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Ergonomic & Focus Enhancements */}
          <div className="space-y-2 pt-1 border-t border-[var(--line)]/60">
            <div className="text-[11px] font-bold text-[var(--mute)]">
              {isRTL ? 'تنظیمات تمرکز و روان‌سازی یادگیری:' : 'Focus & Ergonomics:'}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Auto Advance Toggle */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, autoAdvance: !s.autoAdvance }));
                }}
                className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  settings.autoAdvance
                    ? 'bg-amber-500/10 border-amber-500/40 text-[var(--ink)] shadow-2xs'
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--mute)] hover:bg-[var(--panel)]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-black flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Zap size={13} />
                    <span>{isRTL ? 'پیش‌روی خودکار' : 'Auto-Advance'}</span>
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                    settings.autoAdvance ? 'bg-amber-500 text-white' : 'bg-[var(--line)] text-transparent'
                  }`}>
                    ✓
                  </span>
                </div>
                <span className="text-[9.5px] text-[var(--mute)] leading-tight">
                  {isRTL ? 'انتقال نرم به کارت بعد پس از پاسخ درست' : 'Advance smoothly on correct answer'}
                </span>
              </button>

              {/* Zen Focus Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, zenMode: !s.zenMode }));
                }}
                className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  settings.zenMode
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-[var(--ink)] shadow-2xs'
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--mute)] hover:bg-[var(--panel)]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Target size={13} />
                    <span>{isRTL ? 'حالت تمرکز عمیق' : 'Zen Focus'}</span>
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                    settings.zenMode ? 'bg-indigo-500 text-white' : 'bg-[var(--line)] text-transparent'
                  }`}>
                    ✓
                  </span>
                </div>
                <span className="text-[9.5px] text-[var(--mute)] leading-tight">
                  {isRTL ? 'حذف شلوغی‌های بصری و فوکوس کامل بر واژه' : 'Distraction-free deep study'}
                </span>
              </button>
            </div>
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
