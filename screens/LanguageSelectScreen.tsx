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
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2 font-ui">
        <div className="flex items-center justify-between bg-[#FFFBF4] text-[#1E1B2E] p-2.5 sm:p-3 border-2 border-[#1E1B2E] rounded-[20px] shadow-[3px_3px_0px_0px_#1E1B2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]">
              <Globe size={16} color="#1E1B2E" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider leading-tight">
                {t.languageSelectTitle || 'تنظیم زبان و سطح تسلط'}
              </h1>
              <span className="text-[10px] text-[#E0603F] font-bold block">
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
              className="px-2.5 py-1.5 bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] font-bold text-xs rounded-[10px] shadow-[2px_2px_0px_0px_#1E1B2E] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
            >
              <HelpCircle size={14} color="#1E1B2E" />
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
      <footer className="shrink-0 pt-2 border-t-2 border-[#1E1B2E]/15 font-ui">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-orange flex-1 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-[16px] active:scale-95"
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
            className="pixel-btn pixel-btn-teal flex-[2] py-2.5 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[16px] active:scale-95"
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
