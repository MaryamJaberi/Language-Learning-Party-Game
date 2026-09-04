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
    <div className="h-full min-h-0 flex-1 flex flex-col bg-pixel-grid overflow-hidden select-none relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Panel with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : '-translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3.5 bg-gradient-to-r from-[#7B2CBF] via-[#FF007F] to-[#FF2E93] border-b-4 border-[#241442] flex items-center justify-between text-white shadow-[0px_3px_0px_0px_#241442]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#1a0833] shadow-[1px_1px_0px_0px_#241442]">
              <BookOpen size={18} color="#1a0833" />
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">{help.title || t?.guide || 'راهنما'}</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="w-9 h-9 flex items-center justify-center bg-[#FFE600] hover:bg-yellow-300 text-[#1a0833] border-2 border-[#241442] font-black rounded-xl active:translate-y-0.5 shadow-[2px_2px_0px_0px_#241442]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Rules content */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain"
      >
        
        {/* Intro Tip bubble */}
        <div className="bg-white p-3.5 border-[3px] border-[#241442] rounded-2xl shadow-[3px_3px_0px_0px_#241442] flex items-center gap-3">
          <TeamMascot color="PARTY" size={40} />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] bg-[#FFE600] text-[#1a0833] border border-[#241442] px-2 py-0.5 rounded-lg font-black uppercase shadow-xs flex items-center gap-1 w-fit">
              <Zap size={11} color="#1a0833" fill="#1a0833" />
              <span>{language === 'fa' ? 'نکته طلایی بازی' : 'PARTY TIP'}</span>
            </span>
            <p className="text-[11px] font-black text-[#1a0833] leading-normal mt-1">
              {language === 'fa' ? 'کلمه را به یارتان برسانید و بدون اتلاف وقت گوشی را به نفر بعد بدهید!' : 'Pass the phone after every correct word. Avoid using forbidden gestures!'}
            </p>
          </div>
        </div>

        {/* Dynamic Sections */}
        {sections.map((section: any) => (
          <section 
            key={section.id || section.title} 
            id={`help-${section.id}`}
            className="bg-white p-3.5 rounded-2xl border-[3px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] relative overflow-hidden"
          >
            {/* Tag Badge */}
            <div className="bg-[#00F0FF] border-2 border-[#241442] inline-flex items-center gap-1.5 font-black text-[#1a0833] px-3 py-1 text-xs rounded-xl uppercase shadow-[2px_2px_0px_0px_#241442] mb-2">
              <Sparkles size={14} color="#1a0833" />
              <span>{section.title}</span>
            </div>
            
            {/* Styled body */}
            <p className="text-xs font-bold text-[#1a0833] leading-relaxed whitespace-pre-line tracking-wide bg-[#F8EFFF] p-3 border border-[#241442]/20 rounded-xl">
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
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[#241442]/90 hover:bg-[#241442] text-[#FFE600] border border-[#FFE600]/40 rounded-full text-[11px] font-black shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse"
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
        <div className="p-3 bg-white border-t-4 border-[#241442] flex gap-4">
          <button 
            onClick={handleClose} 
            className="pixel-btn pixel-btn-pink w-full py-3.5 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>{t?.resume || 'ادامه'}</span>
            <Zap size={18} color="#FFE600" fill="#FFE600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
