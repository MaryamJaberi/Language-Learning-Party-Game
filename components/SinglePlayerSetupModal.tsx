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
        className="w-full max-w-sm max-h-[92dvh] flex flex-col bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B2E] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F4EDE1] p-3.5 text-[#1E1B2E] flex items-center justify-between border-b-2 border-[#1E1B2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[#E0603F] text-white flex items-center justify-center border-2 border-[#1E1B2E] shadow-[1.5px_1.5px_0px_0px_#1E1B2E]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight font-display">{t.singlePlayer}</h2>
              <p className="text-[10px] text-[#1E1B2E]/70 font-bold">{isRTL ? 'فلش‌کارت انفرادی و چالش گفتار' : 'Flashcard & Voice Challenge'}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-[8px] bg-[#FFFBF4] hover:bg-[#eae0d0] text-[#1E1B2E] border border-[#1E1B2E] flex items-center justify-center transition-transform active:scale-95"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-[#1E1B2E]">
          
          {/* 1. Target Language Selection */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1B2E] flex items-center gap-1.5">
                <Globe size={13} className="text-[#1E9E93]" />
                <span>{isRTL ? 'زبان تمرین (Target Language):' : 'Target Language:'}</span>
              </label>
              <span className="text-[9.5px] text-[#1E1B2E]/60 font-bold">۳۸ زبان</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setPickerMode('target');
              }}
              className="w-full p-2.5 rounded-[16px] bg-[#F4EDE1] hover:bg-[#ece2d3] border-2 border-[#1E1B2E] text-[#1E1B2E] flex items-center justify-between shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-[#FFFBF4] border border-[#1E1B2E] flex items-center justify-center text-lg">
                  <FlagIcon language={settings.targetLanguage} size={20} />
                </div>
                <div className="text-start">
                  <div className="font-extrabold text-xs text-[#1E1B2E]">
                    {currentTargetLangInfo.nativeName}
                  </div>
                  <div className="text-[9.5px] text-[#1E1B2E]/70 font-medium">
                    {isRTL ? currentTargetLangInfo.persianName : currentTargetLangInfo.name}
                  </div>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-[8px] bg-[#1E9E93] text-white font-bold text-[10.5px] border border-[#1E1B2E] flex items-center gap-1">
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
                    className={`px-2 py-0.5 rounded-[8px] border text-[10px] font-bold shrink-0 flex items-center gap-1 transition-all ${
                      isSelected 
                        ? 'bg-[#1E9E93] text-white border-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]' 
                        : 'bg-[#FFFBF4] text-[#1E1B2E] border-[#1E1B2E]/40 hover:bg-[#F4EDE1]'
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
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1B2E] flex items-center gap-1.5">
                <Languages size={13} className="text-[#E0603F]" />
                <span>{isRTL ? 'زبان مادری و راهنما (Native Language):' : 'Native / Guide Language:'}</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setPickerMode('native');
              }}
              className="w-full p-2.5 rounded-[16px] bg-[#FFFBF4] hover:bg-[#F4EDE1] border-2 border-[#1E1B2E] text-[#1E1B2E] flex items-center justify-between shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-[#F4EDE1] border border-[#1E1B2E] flex items-center justify-center text-lg">
                  <FlagIcon language={settings.nativeLanguage} size={20} />
                </div>
                <div className="text-start">
                  <div className="font-extrabold text-xs text-[#1E1B2E]">
                    {currentNativeLangInfo.nativeName}
                  </div>
                  <div className="text-[9.5px] text-[#1E1B2E]/70 font-medium">
                    {isRTL ? currentNativeLangInfo.persianName : currentNativeLangInfo.name} ({isRTL ? 'ترجمه و راهنمای کارت' : 'Card guide language'})
                  </div>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-[8px] bg-[#E0603F] text-white font-bold text-[10.5px] border border-[#1E1B2E] flex items-center gap-1">
                <span>{isRTL ? 'تغییر ▾' : 'Change ▾'}</span>
              </div>
            </button>
          </div>

          {/* 3. Challenge Mode */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E1B2E] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Languages size={13} className="text-[#F2B63D]" />
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
                className={`p-2 rounded-[14px] border-2 flex flex-col items-center text-center gap-0.5 transition-all ${
                  settings.displayMode === 'text_and_audio'
                    ? 'bg-[#1E9E93] text-white border-[#1E1B2E] font-bold shadow-[2px_2px_0px_0px_#1E1B2E]'
                    : 'bg-[#F4EDE1] text-[#1E1B2E] border-[#1E1B2E]/30 hover:bg-[#eae0d0]'
                }`}
              >
                <FileText size={15} />
                <span className="text-[11px] font-bold">{isRTL ? '🗣️ روخوانی و تلفظ' : '🗣️ Reading & Speech'}</span>
                <span className="text-[9px] opacity-80 leading-tight">
                  {isRTL ? 'دیدن متن + تلفظ روان' : 'See text + speech'}
                </span>
              </button>

              {/* Mode 2: Translate to Target Language */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: 'translate_to_target' }));
                }}
                className={`p-2 rounded-[14px] border-2 flex flex-col items-center text-center gap-0.5 transition-all ${
                  settings.displayMode === 'translate_to_target'
                    ? 'bg-[#F2B63D] text-[#1E1B2E] border-[#1E1B2E] font-bold shadow-[2px_2px_0px_0px_#1E1B2E]'
                    : 'bg-[#F4EDE1] text-[#1E1B2E] border-[#1E1B2E]/30 hover:bg-[#eae0d0]'
                }`}
              >
                <Languages size={15} />
                <span className="text-[11px] font-bold">{isRTL ? '🔄 ترجمه به زبان هدف' : '🔄 To Target Lang'}</span>
                <span className="text-[9px] opacity-80 leading-tight">
                  {isRTL ? 'دیدن راهنما ➔ بیان به هدف' : 'Native ➔ speak target'}
                </span>
              </button>

              {/* Mode 3: Translate to Native */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: 'translate_to_native' }));
                }}
                className={`p-2 rounded-[14px] border-2 flex flex-col items-center text-center gap-0.5 transition-all ${
                  settings.displayMode === 'translate_to_native'
                    ? 'bg-[#E0603F] text-white border-[#1E1B2E] font-bold shadow-[2px_2px_0px_0px_#1E1B2E]'
                    : 'bg-[#F4EDE1] text-[#1E1B2E] border-[#1E1B2E]/30 hover:bg-[#eae0d0]'
                }`}
              >
                <ArrowRightLeft size={15} />
                <span className="text-[11px] font-bold">{isRTL ? '🔁 معکوس به زبان مادری' : '🔁 To Native Lang'}</span>
                <span className="text-[9px] opacity-80 leading-tight">
                  {isRTL ? 'دیدن هدف ➔ ترجمه مادری' : 'Target ➔ native meaning'}
                </span>
              </button>

              {/* Mode 4: Audio-Only */}
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setSettings(s => ({ ...s, displayMode: 'audio_only' }));
                }}
                className={`p-2 rounded-[14px] border-2 flex flex-col items-center text-center gap-0.5 transition-all ${
                  settings.displayMode === 'audio_only'
                    ? 'bg-[#1E1B2E] text-white border-[#1E1B2E] font-bold shadow-[2px_2px_0px_0px_#1E1B2E]'
                    : 'bg-[#F4EDE1] text-[#1E1B2E] border-[#1E1B2E]/30 hover:bg-[#eae0d0]'
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

          {/* 4. CEFR Level Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E1B2E] flex items-center gap-1.5">
              <Layers size={13} className="text-[#1E9E93]" />
              <span>{isRTL ? 'سطح دشواری (CEFR):' : 'Level (CEFR):'}</span>
            </label>
            <div className="grid grid-cols-5 gap-1 text-center">
              {(['A1', 'A2', 'B1', 'B2', 'all'] as CEFRLevel[]).map(lvl => {
                const isSelected = settings.cefrLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      sound.playToggle();
                      setSettings(s => ({ ...s, cefrLevel: lvl }));
                    }}
                    className={`py-1 rounded-[10px] border-2 font-bold text-[11px] transition-all ${
                      isSelected 
                        ? 'bg-[#1E9E93] text-white border-[#1E1B2E] shadow-[1.5px_1.5px_0px_0px_#1E1B2E]' 
                        : 'bg-[#F4EDE1] border-[#1E1B2E]/20 text-[#1E1B2E] hover:bg-[#eae0d0]'
                    }`}
                  >
                    {lvl === 'all' ? (isRTL ? 'همه' : 'All') : lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Number of Cards */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E1B2E] flex items-center gap-1.5">
              <Clock size={13} className="text-[#F2B63D]" />
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
                    className={`py-1 rounded-[10px] border-2 font-bold text-[11px] transition-all ${
                      isSelected 
                        ? 'bg-[#F2B63D] text-[#1E1B2E] border-[#1E1B2E] shadow-[1.5px_1.5px_0px_0px_#1E1B2E]' 
                        : 'bg-[#F4EDE1] border-[#1E1B2E]/20 text-[#1E1B2E] hover:bg-[#eae0d0]'
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
        <div className="p-3 bg-[#F4EDE1] border-t-2 border-[#1E1B2E]">
          <button
            onClick={handleStart}
            className="w-full py-2.5 rounded-[16px] bg-[#E0603F] hover:bg-[#d05333] text-white font-extrabold text-sm border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Play size={16} fill="#FFFFFF" />
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
