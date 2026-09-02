import React from 'react';
import { GameSettings, Language, CEFRLevel } from '../types';
import { SUPPORTED_LANGUAGES, CEFR_LEVELS } from '../constants';
import { TRANSLATIONS, NATIVE_LANGUAGE_NAMES } from '../translations';
import { TeamMascot } from '../components/Mascots';
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
  BookOpen,
  ChevronUp
} from 'lucide-react';
import { useGoogleScrollBars } from '../useGoogleScrollBars';

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
  const { isBarsVisible, scrollContainerRef, handleScroll, showBars } = useGoogleScrollBars();

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
      if (newTargets.length < 5) {
        newTargets.push(lang);
      }
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
    <div className="h-full min-h-0 flex-1 flex flex-col p-3.5 sm:p-4 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-28 mb-2' 
            : '-translate-y-12 opacity-0 max-h-0 mb-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#7B2CBF] via-[#FF007F] to-[#FF2E93] text-white p-3 border-[3.5px] border-[#241442] rounded-2xl shadow-[4px_4px_0px_0px_#241442]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#241442] shadow-[1px_1px_0px_0px_#241442]">
              <Globe size={18} color="#241442" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">
                {t.languageSelectTitle || 'انتخاب زبان‌های مسابقه'}
              </h2>
              <span className="text-[10px] text-[#FFE600] font-black block">
                مرحله ۱ از ۴: زبان‌ها و سطح تسلط
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }} 
            className="px-3 py-1.5 bg-[#FFE600] hover:bg-yellow-300 text-[#1a0833] border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
          >
            <HelpCircle size={15} color="#1a0833" />
            <span>{t.guide}</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto pr-1 pb-2 space-y-3 overscroll-contain"
      >
        
        {/* Step 1: Target Learning Languages (Multi-Select) */}
        <section className="bg-white p-3 sm:p-3.5 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#39FF14] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <BookOpen size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                {t.targetLanguagesLabel || 'زبان‌های هدف (در حال یادگیری):'}
              </label>
            </div>
            <span className="text-[10px] bg-[#39FF14] text-[#1a0833] px-2.5 py-0.5 border-2 border-[#241442] rounded-xl font-black shadow-[1px_1px_0px_0px_#241442]">
              {targetLangs.length} زبان فعال
            </span>
          </div>

          <div className="bg-[#F4E8FF] p-2 rounded-xl border-2 border-[#241442] text-[10.5px] font-bold text-[#1a0833] mb-2.5 flex items-start gap-1.5">
            <Shuffle size={14} className="text-[#FF007F] shrink-0 mt-0.5" />
            <span>{t.targetLanguagesHint}</span>
          </div>

          {/* Quick Selection Presets */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                onSave({ ...settings, targetLanguages: ['en'] });
              }}
              className={`px-2.5 py-1 rounded-xl font-black text-[10.5px] border-2 border-[#241442] flex items-center gap-1 transition-all ${
                targetLangs.length === 1 && targetLangs[0] === 'en'
                  ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] -translate-y-0.5'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🇬🇧 فقط انگلیسی</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                onSave({ ...settings, targetLanguages: ['nl'] });
              }}
              className={`px-2.5 py-1 rounded-xl font-black text-[10.5px] border-2 border-[#241442] flex items-center gap-1 transition-all ${
                targetLangs.length === 1 && targetLangs[0] === 'nl'
                  ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] -translate-y-0.5'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🇳🇱 فقط هلندی</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                onSave({ ...settings, targetLanguages: ['nl', 'en'] });
              }}
              className={`px-2.5 py-1 rounded-xl font-black text-[10.5px] border-2 border-[#241442] flex items-center gap-1 transition-all ${
                targetLangs.length === 2 && targetLangs.includes('en') && targetLangs.includes('nl')
                  ? 'bg-[#FFE600] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] -translate-y-0.5'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🇬🇧 🇳🇱 انگلیسی + هلندی</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                onSave({ ...settings, targetLanguages: ['en', 'nl', 'de', 'fr'] });
              }}
              className={`px-2.5 py-1 rounded-xl font-black text-[10.5px] border-2 border-[#241442] flex items-center gap-1 transition-all ${
                targetLangs.length >= 4
                  ? 'bg-[#00F0FF] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] -translate-y-0.5'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🌍 ۴ زبان اروپایی</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2" dir="ltr">
            {SUPPORTED_LANGUAGES.map(lang => {
              const isSelected = targetLangs.includes(lang.code);
              const displayName = settings.language === 'fa' ? lang.persianName : lang.name;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleTargetLang(lang.code)}
                  className={`p-2 rounded-xl font-black text-xs transition-all border-2 border-[#241442] flex flex-col items-center justify-center gap-0.5 relative ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#FFE600] to-[#FFF033] text-[#1a0833] shadow-[3px_3px_0px_0px_#241442] -translate-y-0.5'
                      : 'bg-white text-slate-700 hover:bg-slate-50 opacity-90'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-[#241442] rounded-full flex items-center justify-center">
                      <Check size={10} color="#39FF14" strokeWidth={3.5} />
                    </div>
                  )}
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-[11px] font-black">{displayName}</span>
                  <span className="text-[9px] text-slate-600 font-bold">{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: CEFR Level Selector */}
        <section className="bg-white p-3 sm:p-3.5 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#00F0FF] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <Award size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                {t.cefrLevelTitle || 'سطح تسلط CEFR:'}
              </label>
            </div>
            <span className="text-[10px] bg-[#00F0FF] text-[#1a0833] px-2.5 py-0.5 border-2 border-[#241442] rounded-xl font-black shadow-[1px_1px_0px_0px_#241442]">
              {CEFR_LEVELS.find(l => l.id === currentCefr)?.badge || 'ALL'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CEFR_LEVELS.map(level => {
              const isSelected = currentCefr === level.id;
              const levelName = level.name[settings.language] || level.name.en || level.id;
              const levelDesc = level.desc[settings.language] || level.desc.en || '';

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => selectCefrLevel(level.id)}
                  className={`p-2.5 rounded-xl border-2 border-[#241442] text-start flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#00F0FF] to-[#39FF14] text-[#1a0833] shadow-[3px_3px_0px_0px_#241442] -translate-y-0.5'
                      : 'bg-[#F9F5FF] text-slate-800 hover:bg-[#F2E8FF]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-black text-xs text-[#1a0833]">{levelName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#241442] text-white font-black">
                      {level.code}
                    </span>
                  </div>
                  <p className="text-[9.5px] leading-tight font-bold text-slate-700">
                    {levelDesc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Native / Support Language (Dropdown / Grid) */}
        <section className="bg-white p-3 sm:p-3.5 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FF007F] border-2 border-[#241442] flex items-center justify-center text-white">
                <Globe size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                {t.nativeLanguageLabel || 'زبان مبدا و ترجمه (راهنما):'}
              </label>
            </div>
            <span className="text-[10px] bg-[#FF007F] text-white px-2 py-0.5 border-2 border-[#241442] rounded-xl font-black">
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
                  className={`py-1.5 px-1 rounded-xl font-black text-[11px] transition-all border-2 border-[#241442] text-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF007F] to-[#FF2E93] text-white shadow-[2px_2px_0px_0px_#241442]'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-1">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Mascot Fun Banner */}
        <div className="p-2.5 bg-[#FFE600] border-2 border-[#241442] rounded-2xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#241442]">
          <TeamMascot color="YELLOW" size={30} />
          <span className="text-[11px] text-[#1a0833] font-black">
            {settings.language === 'fa' 
              ? '⚡ هر کارتی که رو میشه به زبان و سطح انتخابی شما تطبیق پیدا می‌کنه!' 
              : '⚡ Cards automatically adapt to your chosen languages and CEFR levels!'}
          </span>
        </div>

      </div>

      {/* Floating reveal trigger when bars are hidden */}
      {!isBarsVisible && (
        <button
          onClick={showBars}
          aria-label="Show menu"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[#241442]/90 hover:bg-[#241442] text-[#FFE600] border border-[#FFE600]/40 rounded-full text-[11px] font-black shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse"
        >
          <ChevronUp size={14} />
          <span>{settings.language === 'fa' ? 'نمایش منو' : 'Show Controls'}</span>
        </button>
      )}

      {/* Footer Navigation with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-bottom shrink-0 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24 pt-2' 
            : 'translate-y-12 opacity-0 max-h-0 pt-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="flex gap-3 border-t-2 border-[#241442]/20 pt-1">
          <button 
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-dark flex-1 py-3 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{t.back}</span>
          </button>
          <button 
            onClick={() => {
              sound.playStartGame();
              onNext();
            }} 
            className="pixel-btn pixel-btn-pink flex-[2] py-3 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>{t.next} (انتخاب موضوعات)</span>
            {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>

    </div>
  );
};

export default LanguageSelectScreen;
