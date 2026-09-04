import React, { useState } from 'react';
import { GameSettings, Language, CEFRLevel } from '../types';
import { CEFR_LEVELS } from '../constants';
import { NATIVE_LANGUAGE_NAMES } from '../translations';
import { tUI, tf, isRtlLang } from '../ui';
import { LangChipGrid } from '../components/LangChip';
import { ScreenFrame } from '../components/ScreenFrame';
import { sound } from '../soundManager';
import { Globe, HelpCircle, ArrowRight, ArrowLeft, BookOpen, Award, ChevronDown } from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp: () => void;
}

const Accordion: React.FC<{
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  summary: string;
  accent: string;
  children: React.ReactNode;
}> = ({ open, onToggle, icon, label, summary, accent, children }) => (
  <section className="bg-white border-[2.5px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] rounded-2xl overflow-hidden">
    <button type="button" onClick={onToggle} className="w-full flex items-center gap-2 p-2.5 text-start">
      <div className={`w-6 h-6 rounded-lg border-2 border-[#241442] flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
        <div className="text-[13px] font-black text-[#1a0833] truncate">{summary}</div>
      </div>
      <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open ? <div className="px-2.5 pb-2.5">{children}</div> : null}
  </section>
);

const LanguageSelectScreen: React.FC<Props> = ({
  settings,
  onSave,
  onNext,
  onBack,
  onOpenHelp
}) => {
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);
  const [open, setOpen] = useState<'target' | 'native' | 'cefr' | null>(null);

  const nativeLang = settings.nativeLanguage || 'fa';
  const targetLangs = settings.targetLanguages && settings.targetLanguages.length > 0
    ? settings.targetLanguages
    : ['nl', 'en'];
  const currentCefr = settings.cefrLevel || 'all';

  const setNativeLang = (lang: Language) => {
    sound.playToggle();
    onSave({ ...settings, nativeLanguage: lang });
    setOpen(null);
  };

  const toggleTargetLang = (lang: Language) => {
    sound.playToggle();
    let newTargets = [...targetLangs];
    if (newTargets.includes(lang)) {
      if (newTargets.length > 1) newTargets = newTargets.filter(l => l !== lang);
    } else if (newTargets.length < 4) {
      newTargets.push(lang);
    } else {
      newTargets = [...newTargets.slice(1), lang];
    }
    onSave({ ...settings, targetLanguages: newTargets });
  };

  const selectCefrLevel = (level: CEFRLevel) => {
    sound.playToggle();
    onSave({ ...settings, cefrLevel: level });
    setOpen(null);
  };

  const selectedCefr = CEFR_LEVELS.find(l => l.id === currentCefr);
  const cefrLabel = selectedCefr
    ? (selectedCefr.name[settings.language] || selectedCefr.name.en || selectedCefr.code)
    : currentCefr;
  const targetSummary = targetLangs.map(c => NATIVE_LANGUAGE_NAMES[c] || c).join(' · ');

  const toggle = (id: 'target' | 'native' | 'cefr') => {
    sound.playClick();
    setOpen(cur => cur === id ? null : id);
  };

  return (
    <ScreenFrame
      dir={isRTL ? 'rtl' : 'ltr'}
      className="p-3 select-none"
      header={
        <div className="flex items-center justify-between bg-gradient-to-r from-[#7B2CBF] via-[#FF007F] to-[#FF2E93] text-white p-2.5 border-[3px] border-[#241442] rounded-2xl shadow-[3px_3px_0px_0px_#241442] mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center shrink-0">
              <Globe size={18} color="#241442" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black uppercase tracking-wider leading-tight truncate">{t.languageSelectTitle}</h1>
              <span className="text-[10px] text-[#FFE600] font-black block">
                {tf(settings.language, 'stepOf', { n: 1, total: 4 })} · {t.stepLanguages}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { sound.playClick(); onOpenHelp(); }}
            className="px-2.5 py-1.5 bg-[#FFE600] text-[#1a0833] border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442] flex items-center gap-1.5 shrink-0"
          >
            <HelpCircle size={14} color="#1a0833" />
            <span>{t.guide}</span>
          </button>
        </div>
      }
      footer={
        <div className="flex gap-2.5 pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => { sound.playClick(); onBack(); }}
            className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t.back}</span>
          </button>
          <button
            type="button"
            onClick={() => { sound.playStartGame(); onNext(); }}
            className="pixel-btn pixel-btn-pink flex-[2] py-2.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>{t.nextTopics}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      }
    >
      <div className="space-y-2 py-1">
        <Accordion
          open={open === 'target'}
          onToggle={() => toggle('target')}
          icon={<BookOpen size={13} />}
          label={t.targetLanguagesLabel}
          summary={targetSummary}
          accent="bg-[#39FF14]"
        >
          <p className="text-[10px] text-slate-600 font-bold mb-1.5">{t.targetLanguagesHint}</p>
          <LangChipGrid selected={targetLangs} onToggle={toggleTargetLang} />
        </Accordion>

        <Accordion
          open={open === 'native'}
          onToggle={() => toggle('native')}
          icon={<Globe size={13} />}
          label={t.nativeLanguageLabel}
          summary={NATIVE_LANGUAGE_NAMES[nativeLang]}
          accent="bg-[#FF007F] text-white"
        >
          <p className="text-[10px] text-slate-600 font-bold mb-1.5">{t.nativeLanguageHint}</p>
          <LangChipGrid selected={nativeLang} onToggle={setNativeLang} />
        </Accordion>

        <Accordion
          open={open === 'cefr'}
          onToggle={() => toggle('cefr')}
          icon={<Award size={13} />}
          label={t.cefrLevelTitle}
          summary={cefrLabel}
          accent="bg-[#00F0FF]"
        >
          <div className="grid grid-cols-4 gap-1.5">
            {CEFR_LEVELS.filter(l => ['A1', 'A2', 'B1', 'all'].includes(l.id)).map(level => {
              const isSelected = currentCefr === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => selectCefrLevel(level.id)}
                  className={`h-10 rounded-xl border-2 border-[#241442] text-[11px] font-black ${
                    isSelected ? 'bg-[#00F0FF] text-[#1a0833] shadow-[1.5px_1.5px_0_0_#241442]' : 'bg-[#F9F5FF] text-slate-800'
                  }`}
                >
                  {level.id === 'all' ? 'ALL' : level.code}
                </button>
              );
            })}
          </div>
        </Accordion>
      </div>
    </ScreenFrame>
  );
};

export default LanguageSelectScreen;
