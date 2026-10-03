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
  ArrowRightLeft
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  language: Language;
  initialSettings: SinglePlayerSettings;
  onClose: () => void;
  onStart: (settings: SinglePlayerSettings) => void;
}

const SinglePlayerSetupModal: React.FC<Props> = ({
  isOpen,
  language,
  initialSettings,
  onClose,
  onStart
}) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);

  const [settings, setSettings] = useState<SinglePlayerSettings>(initialSettings);
  const [pickerMode, setPickerMode] = useState<'target' | 'native' | null>(null);

  if (!isOpen) return null;

  const currentTargetLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === settings.targetLanguage) || SUPPORTED_LANGUAGES[0];
  const currentNativeLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === settings.nativeLanguage) || SUPPORTED_LANGUAGES[0];

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
