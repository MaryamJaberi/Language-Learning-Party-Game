import React, { useEffect } from 'react';
import { Language } from '../types';
import { tUI, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { BookOpen, HelpCircle, Sparkles, Zap, ArrowRight, ArrowLeft, ChevronUp } from 'lucide-react';
import { useGoogleScrollBars } from '../useGoogleScrollBars';

interface Props {
  language: Language;
  onClose: () => void;
  initialSection?: string;
}

const DEFAULT_HELP: Record<string, { title: string; sections: Array<{ id: string; title: string; body: string }> }> = {
  fa: {
    title: 'راهنمای بازی «دور»',
    sections: [
      {
        id: 'intro',
        title: 'معرفی بازی',
        body: '«دور» یک بازی گروهی هیجان‌انگیز و پرانرژی یادگیری زبان است. بازیکنان به تیم‌های ۲ نفره تقسیم می‌شوند و هم‌تیمی‌ها روبروی یکدیگر می‌نشینند.'
      },
      {
        id: 'rules',
        title: 'قوانین و چرخش نوبت‌ها',
        body: 'گوشی در جهت عقربه‌های ساعت بین بازیکنان دست‌به‌دست می‌شود. در نوبت خود کلمه را برای یارتان توصیف کنید بدون گفتن خود کلمه یا ریشه مستقیم آن.'
      },
      {
        id: 'scoring',
        title: 'امتیازدهی و بمب زمان',
        body: 'با هر پاسخ صحیح، دکمه «درست بود!» را لمس کرده و بلافاصله گوشی را به نفر بعدی تحویل دهید تا زمان تیم شما متوقف شود.'
      }
    ]
  },
  en: {
    title: 'Game Guide & Rules',
    sections: [
      {
        id: 'intro',
        title: 'Introduction',
        body: '"Turn" is an energetic language learning party game. Teammates sit opposite each other around the table.'
      },
      {
        id: 'rules',
        title: 'Clockwise Turns & Rules',
        body: 'The device passes clockwise. Describe the phrase to your partner without saying the forbidden target word.'
      },
      {
        id: 'scoring',
        title: 'Scoring & Timer',
        body: 'Press "Correct!" upon a right guess and pass the device immediately so your team clock stops ticking.'
      }
    ]
  }
};

const HelpScreen: React.FC<Props> = ({ language, onClose, initialSection }) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);
  const help = t?.helpContent || DEFAULT_HELP[language] || DEFAULT_HELP.fa;
  const sections = help.sections || DEFAULT_HELP.fa.sections;
  const { isBarsVisible, scrollContainerRef, handleScroll, showBars } = useGoogleScrollBars();

  useEffect(() => {
    if (initialSection && scrollContainerRef.current) {
      const element = document.getElementById(`help-${initialSection}`);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialSection]);

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col bg-[#F4EDE1] overflow-hidden select-none relative font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Panel with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : '-translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[#FFFBF4] border-b-2 border-[#1E1B2E] flex items-center justify-between text-[#1E1B2E] shadow-[0px_3px_0px_0px_#1E1B2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]">
              <BookOpen size={16} color="#1E1B2E" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-display leading-tight">{help.title || t?.guide || 'راهنما'}</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="w-8 h-8 flex items-center justify-center bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] font-bold rounded-[10px] active:translate-y-0.5 shadow-[2px_2px_0px_0px_#1E1B2E]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Rules content */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain font-ui"
      >
        
        {/* Intro Tip bubble */}
        <div className="bg-[#FFFBF4] p-3.5 border-2 border-[#1E1B2E] rounded-[20px] shadow-[3px_3px_0px_0px_#1E1B2E] flex items-center gap-3">
          <TeamMascot color="PARTY" size={36} />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] bg-[#F2B63D] text-[#1E1B2E] border border-[#1E1B2E] px-2 py-0.5 rounded-[8px] font-bold uppercase shadow-xs flex items-center gap-1 w-fit">
              <Zap size={11} color="#1E1B2E" fill="#1E1B2E" />
              <span>{language === 'fa' ? 'نکته طلایی بازی' : 'PARTY TIP'}</span>
            </span>
            <p className="text-[11.5px] font-bold text-[#1E1B2E] leading-normal mt-1">
              {language === 'fa' ? 'کلمه را به یارتان برسانید و بدون اتلاف وقت گوشی را به نفر بعد بدهید!' : 'Pass the phone after every correct word. Avoid using forbidden gestures!'}
            </p>
          </div>
        </div>

        {/* Dynamic Sections */}
        {sections.map((section: any) => (
          <section 
            key={section.id || section.title} 
            id={`help-${section.id}`}
            className="bg-[#FFFBF4] p-3.5 rounded-[22px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] relative overflow-hidden"
          >
            {/* Tag Badge */}
            <div className="bg-[#1E9E93] border-2 border-[#1E1B2E] inline-flex items-center gap-1.5 font-bold text-white px-3 py-1 text-xs rounded-[12px] uppercase shadow-[2px_2px_0px_0px_#1E1B2E] mb-2">
              <Sparkles size={14} color="#ffffff" />
              <span>{section.title}</span>
            </div>
            
            {/* Styled body */}
            <p className="text-xs font-medium text-[#1E1B2E] leading-relaxed whitespace-pre-line tracking-wide bg-[#F4EDE1] p-3 border-2 border-[#1E1B2E]/20 rounded-[14px]">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      {/* Floating reveal trigger when bars are hidden */}
      {!isBarsVisible && (
        <button
          onClick={showBars}
          aria-label="Show menu"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[#1E1B2E] hover:bg-[#2E2844] text-[#F2B63D] border border-[#1E1B2E] rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse font-ui"
        >
          <ChevronUp size={14} />
          <span>{language === 'fa' ? 'ادامه' : 'Resume'}</span>
        </button>
      )}

      {/* Footer Return Drawer with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-bottom shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : 'translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[#FFFBF4] border-t-2 border-[#1E1B2E] flex gap-4 font-ui">
          <button 
            onClick={handleClose} 
            className="pixel-btn pixel-btn-orange w-full py-3.5 text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[18px]"
          >
            <span>{t?.resume || 'ادامه'}</span>
            <Zap size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
