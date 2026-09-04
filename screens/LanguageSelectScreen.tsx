import React from 'react';
import { GameSettings, Language, CEFRLevel } from '../types';
import { CEFR_LEVELS } from '../constants';
import { NATIVE_LANGUAGE_NAMES } from '../translations';
import { tUI, tf, isRtlLang } from '../ui';
import { FlagIcon } from '../components/FlagIcon';
import { LangChipGrid } from '../components/LangChip';
import { sound } from '../soundManager';
import { Globe, HelpCircle, ArrowRight, ArrowLeft, BookOpen, Award } from 'lucide-react';

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
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);

  const nativeLang = settings.nativeLanguage || 'fa';
  const targetLangs = settings.targetLanguages && settings.targetLanguages.length > 0
    ? settings.targetLanguages
    : ['nl', 'en'];
  const currentCefr = settings.cefrLevel || 'all';

  const setNativeLang = (lang: Language) => {
    sound.playToggle();
    onSave({
      ...settings,
      nativeLanguage: lang,
    });
  };

  const toggleTargetLang = (lang: Language) => {
    sound.playToggle();
    let newTargets = [...targetLangs];
    if (newTargets.includes(lang)) {
      if (newTargets.length > 1) {
        newTargets = newTargets.filter(l => l !== lang);
      }
    } else if (newTargets.length < 4) {
      newTargets.push(lang);
    } else {
      newTargets = [...newTargets.slice(1), lang];
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

  const selectedCefr = CEFR_LEVELS.find(l => l.id === currentCefr);
  const cefrDesc = selectedCefr
    ? (selectedCefr.desc[settings.language] || selectedCefr.desc.en || '')
    : '';

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="shrink-0 mb-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#7B2CBF] via-[#FF007F] to-[#FF2E93] text-white p-2.5 border-[3px] border-[#241442] rounded-2xl shadow-[3px_3px_0px_0px_#241442]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#241442] shadow-[1px_1px_0px_0px_#241442] shrink-0">
              <Globe size={18} color="#241442" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black uppercase tracking-wider leading-tight truncate">
                {t.languageSelectTitle}
              </h1>
              <span className="text-[10px] text-[#FFE600] font-black block">
                {tf(settings.language, 'stepOf', { n: 1, total: 4 })} · {t.stepLanguages}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            className="px-2.5 py-1.5 bg-[#FFE600] hover:bg-yellow-300 text-[#1a0833] border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442] flex items-center gap-1.5 shrink-0"
          >
            <HelpCircle size={14} color="#1a0833" />
            <span>{t.guide}</span>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pb-1 overscroll-contain">
        <section className="bg-white p-2.5 border-[2.5px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#39FF14] border-2 border-[#241442] flex items-center justify-center shrink-0">
                <BookOpen size={13} />
              </div>
              <span className="text-[#1a0833] text-[11px] font-black leading-tight">
                {t.targetLanguagesLabel}
              </span>
            </div>
            <span className="text-[10px] bg-[#39FF14] text-[#1a0833] px-2 py-0.5 border-2 border-[#241442] rounded-lg font-black shrink-0">
              {tf(settings.language, 'activeCount', { n: targetLangs.length })}
            </span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold mb-1.5 leading-snug">{t.targetLanguagesHint}</p>
          <LangChipGrid selected={targetLangs} onToggle={toggleTargetLang} />
        </section>

        <section className="bg-white p-2.5 border-[2.5px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#FF007F] border-2 border-[#241442] flex items-center justify-center text-white shrink-0">
                <Globe size={13} />
              </div>
              <span className="text-[#1a0833] text-[11px] font-black leading-tight">
                {t.nativeLanguageLabel}
              </span>
            </div>
            <span className="text-[10px] bg-[#FF007F] text-white px-2 py-0.5 border-2 border-[#241442] rounded-lg font-black shrink-0 flex items-center gap-1">
              <FlagIcon language={nativeLang} size={12} />
              {NATIVE_LANGUAGE_NAMES[nativeLang]}
            </span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold mb-1.5 leading-snug">{t.nativeLanguageHint}</p>
          <LangChipGrid selected={nativeLang} onToggle={setNativeLang} />
        </section>

        <section className="bg-white p-2.5 border-[2.5px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#00F0FF] border-2 border-[#241442] flex items-center justify-center shrink-0">
                <Award size={13} />
              </div>
              <span className="text-[#1a0833] text-[11px] font-black">{t.cefrLevelTitle}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {CEFR_LEVELS.filter(l => ['A1', 'A2', 'B1', 'all'].includes(l.id)).map(level => {
              const isSelected = currentCefr === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => selectCefrLevel(level.id)}
                  className={`h-10 rounded-xl border-2 border-[#241442] text-[11px] font-black ${
                    isSelected
                      ? 'bg-[#00F0FF] text-[#1a0833] shadow-[1.5px_1.5px_0_0_#241442]'
                      : 'bg-[#F9F5FF] text-slate-800'
                  }`}
                >
                  {level.id === 'all' ? 'ALL' : level.code}
                </button>
              );
            })}
          </div>
          {cefrDesc ? (
            <p className="mt-1.5 text-[10px] text-slate-600 font-bold leading-snug">{cefrDesc}</p>
          ) : null}
        </section>
      </div>

      <footer className="shrink-0 pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
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
            className="pixel-btn pixel-btn-pink flex-[2] py-2.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{t.nextTopics}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LanguageSelectScreen;
