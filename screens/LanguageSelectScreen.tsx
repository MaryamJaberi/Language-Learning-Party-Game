import React from 'react';
import { GameSettings } from '../types';
import { LanguageAndCefrDropdowns } from '../components/LanguageAndCefrDropdowns';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import { sound } from '../soundManager';
import { tUI, tf, isRtlLang } from '../ui';
import { 
  Globe, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft
} from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
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

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col p-3 sm:p-4 select-none overflow-hidden relative font-ui bg-[var(--bg)] text-[var(--ink)]" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2 font-ui">
        <div className="flex items-center justify-between bg-[var(--panel)] text-[var(--ink)] p-2.5 sm:p-3 border border-[var(--line)] rounded-[18px] shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] shadow-[var(--shadow-sm)]">
              <Globe size={16} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider leading-tight">
                {t.languageSelectTitle || 'تنظیم زبان و سطح تسلط'}
              </h1>
              <span className="text-[10px] text-[var(--vermilion)] font-bold block">
                {tf(settings.language, 'stepOf', { n: 1, total: 4 })}: {t.stepLanguages}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Sound Mute / Unmute Header Control */}
            <SoundHeaderButton language={settings.language} />

            <button 
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenHelp?.();
              }} 
              className="px-2.5 py-1.5 bg-[var(--saffron)] hover:bg-[#e0a634] text-[var(--ink)] border border-[var(--line)] font-bold text-xs rounded-[10px] shadow-[var(--shadow-sm)] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
            >
              <HelpCircle size={14} />
              <span>{t.guide}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content: Pure Dropdowns */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-2 space-y-2 overscroll-contain font-ui">
        <LanguageAndCefrDropdowns
          settings={settings}
          onSave={onSave}
          defaultOpenSection="target"
        />
      </div>

      {/* Fixed Footer Navigation */}
      <footer className="shrink-0 pt-2 border-t border-[var(--line)] font-ui">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="flex-1 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-[14px] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
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
            className="flex-[2] py-2.5 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[14px] bg-[var(--teal)] hover:bg-[#17857c] text-white shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
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
