import React from 'react';
import { GameSettings, Language, CEFRLevel } from '../types';
import { SUPPORTED_LANGUAGES, CEFR_LEVELS } from '../constants';
import { TRANSLATIONS, NATIVE_LANGUAGE_NAMES } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { FlagIcon } from '../components/FlagIcon';
import { sound } from '../soundManager';
import { 
  Globe, 
  Sparkles, 
  Check, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Shuffle, 
  Award,
  BookOpen
} from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp: () => void;
}

const LanguageSelectScreen: React.FC<Props> = ({
  settings,
  onSave,
  onNext,
  onBack,
  onOpenHelp
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fa;
  const isRTL = settings.language === 'fa' || settings.language === 'ar';

  const nativeLang = settings.nativeLanguage || settings.language || 'fa';
  const targetLangs = settings.targetLanguages && settings.targetLanguages.length > 0
    ? settings.targetLanguages
    : ['nl', 'en'];
  const currentCefr = settings.cefrLevel || 'all';

  const setNativeLang = (lang: Language) => {
    sound.playToggle();
    // Also sync app UI language for consistency
    onSave({
      ...settings,
      language: lang,
      nativeLanguage: lang
    });
  };

  const toggleTargetLang = (lang: Language) => {
    sound.playToggle();
    let newTargets = [...targetLangs];
    if (newTargets.includes(lang)) {
      if (newTargets.length > 1) {
        newTargets = newTargets.filter(l => l !== lang);
      }
    } else {
      newTargets.push(lang);
    }
    onSave({
      ...settings,
      targetLanguages: newTargets
    });
  };

  const selectCefrLevel = (level: CEFRLevel) => {
    sound.playToggle();
    onSave({
      ...settings,
      cefrLevel: level
    });
  };

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#7B2CBF] via-[#FF007F] to-[#FF2E93] text-white p-2.5 sm:p-3 border-[3px] border-[#241442] rounded-2xl shadow-[3px_3px_0px_0px_#241442]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#241442] shadow-[1px_1px_0px_0px_#241442]">
              <Globe size={18} color="#241442" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider leading-tight">
                {t.languageSelectTitle || 'انتخاب زبان‌های مسابقه'}
              </h1>
              <span className="text-[10px] text-[#FFE600] font-black block">
                مرحله ۱ از ۴: زبان‌ها و سطح تسلط
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }} 
            className="px-2.5 py-1.5 bg-[#FFE600] hover:bg-yellow-300 text-[#1a0833] border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
          >
            <HelpCircle size={14} color="#1a0833" />
            <span>{t.guide}</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div 
        className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-2 space-y-2.5 overscroll-contain"
      >
        
        {/* Step 1: Target Learning Languages (Multi-Select) */}
        <section className="bg-white p-3 border-[2.5px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#39FF14] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <BookOpen size={13} />
              </div>
              <span className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                {t.targetLanguagesLabel || 'زبان‌های هدف مسابقه:'}
              </span>
            </div>
            <span className="text-[10.5px] bg-[#39FF14] text-[#1a0833] px-2 py-0.5 border-2 border-[#241442] rounded-lg font-black shadow-[1px_1px_0px_0px_#241442]">
              {targetLangs.length} زبان فعال
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5" dir="ltr">
            {SUPPORTED_LANGUAGES.map(lang => {
              const isSelected = targetLangs.includes(lang.code);
              const displayName = settings.language === 'fa' ? lang.persianName : lang.name;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleTargetLang(lang.code)}
                  className={`p-2 rounded-xl font-black text-xs transition-all border-2 border-[#241442] flex flex-col items-center justify-center gap-0.5 relative touch-manipulation active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#FFE600] to-[#FFF033] text-[#1a0833] shadow-[2.5px_2.5px_0px_0px_#241442] -translate-y-0.5'
                      : 'bg-[#FAF7FC] text-slate-800 hover:bg-white'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-[#241442] rounded-full flex items-center justify-center">
                      <Check size={10} color="#39FF14" strokeWidth={3.5} />
                    </div>
                  )}
                  <FlagIcon language={lang.code} size={22} />
                  <span className="text-[11px] font-black leading-tight text-center mt-0.5">{displayName}</span>
                  <span className="text-[9px] text-slate-600 font-bold leading-none">{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: CEFR Level Selector */}
        <section className="bg-white p-3 border-[2.5px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#00F0FF] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <Award size={13} />
              </div>
              <span className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                {t.cefrLevelTitle || 'سطح تسلط CEFR:'}
              </span>
            </div>
            <span className="text-[10px] bg-[#00F0FF] text-[#1a0833] px-2 py-0.5 border-2 border-[#241442] rounded-lg font-black shadow-[1px_1px_0px_0px_#241442]">
              {CEFR_LEVELS.find(l => l.id === currentCefr)?.badge || 'ALL'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {CEFR_LEVELS.map(level => {
              const isSelected = currentCefr === level.id;
              const levelName = level.name[settings.language] || level.name.en || level.id;
              const levelDesc = level.desc[settings.language] || level.desc.en || '';

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => selectCefrLevel(level.id)}
                  className={`p-2 rounded-xl border-2 border-[#241442] text-start flex flex-col justify-between transition-all touch-manipulation active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#00F0FF] to-[#39FF14] text-[#1a0833] shadow-[2.5px_2.5px_0px_0px_#241442] -translate-y-0.5'
                      : 'bg-[#F9F5FF] text-slate-800 hover:bg-[#F2E8FF]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="font-black text-[11px] sm:text-xs text-[#1a0833]">{levelName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#241442] text-white font-black">
                      {level.code}
                    </span>
                  </div>
                  <p className="text-[9.5px] leading-tight font-bold text-slate-700 line-clamp-2">
                    {levelDesc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Native / Support Language */}
        <section className="bg-white p-3 border-[2.5px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#FF007F] border-2 border-[#241442] flex items-center justify-center text-white">
                <Globe size={13} />
              </div>
              <span className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                {t.nativeLanguageLabel || 'زبان مادری / ترجمه:'}
              </span>
            </div>
            <span className="text-[10px] bg-[#FF007F] text-white px-2 py-0.5 border-2 border-[#241442] rounded-lg font-black">
              {NATIVE_LANGUAGE_NAMES[nativeLang]}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5" dir="ltr">
            {SUPPORTED_LANGUAGES.map(lang => {
              const isSelected = nativeLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setNativeLang(lang.code)}
                  className={`py-1.5 px-1 rounded-xl font-black text-[11px] transition-all border-2 border-[#241442] text-center touch-manipulation active:scale-95 flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF007F] to-[#FF2E93] text-white shadow-[2px_2px_0px_0px_#241442]'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <FlagIcon language={lang.code} size={18} />
                  <span>{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </section>

      </div>

      {/* Fixed Footer Navigation */}
      <footer className="shrink-0 pt-2 border-t-2 border-[#241442]/20">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
          >
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t.back}</span>
          </button>
          <button 
            type="button"
            onClick={() => {
              sound.playStartGame();
              onNext();
            }} 
            className="pixel-btn pixel-btn-pink flex-[2] py-2.5 text-sm sm:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{t.next} (انتخاب موضوعات)</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </footer>

    </div>
  );
};

export default LanguageSelectScreen;
