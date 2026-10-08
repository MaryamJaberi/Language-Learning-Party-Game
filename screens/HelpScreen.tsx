import React, { useEffect } from 'react';
import { Language } from '../types';
import { tUI, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { BookOpen, HelpCircle, Sparkles, Zap, ArrowRight, ArrowLeft, ChevronUp, ShieldCheck, ExternalLink } from 'lucide-react';
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
  const help = t?.helpContent || DEFAULT_HELP[language] || DEFAULT_HELP.en || DEFAULT_HELP.fa;
  const sections = help.sections || (DEFAULT_HELP.en && DEFAULT_HELP.en.sections) || DEFAULT_HELP.fa.sections;
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
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col bg-[var(--bg)] overflow-hidden select-none relative font-ui text-[var(--ink)]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Panel with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : '-translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[var(--panel)] border-b border-[var(--line)] flex items-center justify-between text-[var(--ink)] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shadow-xs">
              <BookOpen size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-black font-display leading-tight">{help.title || t?.guide || 'راهنما'}</h2>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="w-10 h-10 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] border border-[var(--line)] font-bold rounded-full active:scale-95 shadow-xs transition-all cursor-pointer"
            aria-label="Close"
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
        <div className="bg-[var(--panel)] p-3.5 border border-[var(--line)] rounded-2xl shadow-xs flex items-center gap-3">
          <TeamMascot color="PARTY" size={36} />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] bg-[var(--saffron)] text-[#15204A] px-2 py-0.5 rounded-lg font-bold uppercase shadow-xs flex items-center gap-1 w-fit">
              <Zap size={11} className="text-[#15204A] fill-[#15204A]" />
              <span>{t.partyTipTitle || (isRTL ? 'نکته طلایی بازی' : 'PARTY TIP')}</span>
            </span>
            <p className="text-[11.5px] font-bold text-[var(--ink)] leading-normal mt-1">
              {t.partyTipDesc || (isRTL ? 'کلمه را به یارتان برسانید و بدون اتلاف وقت گوشی را به نفر بعد بدهید!' : 'Pass the phone after every correct word. Avoid using forbidden gestures!')}
            </p>
          </div>
        </div>

        {/* Dynamic Sections */}
        {sections.map((section: any) => (
          <section 
            key={section.id || section.title} 
            id={`help-${section.id}`}
            className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative overflow-hidden"
          >
            {/* Tag Badge */}
            <div className="bg-[var(--lapis)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
              <Sparkles size={13} className="text-white" />
              <span>{section.title}</span>
            </div>
            
            {/* Styled body */}
            <p className="text-xs font-medium text-[var(--ink)] leading-relaxed whitespace-pre-line bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
              {section.body}
            </p>
          </section>
        ))}

        {/* Privacy Policy Card */}
        <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative overflow-hidden">
          <div className="bg-[var(--turq)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
            <ShieldCheck size={13} className="text-white" />
            <span>{isRTL ? 'حریم خصوصی و امنیت' : 'Privacy & Security'}</span>
          </div>
          <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl mb-2.5">
            {isRTL 
              ? 'اطلاعات شما با بالاترین استانداردهای امنیتی محافظت می‌شود. هیچ صدای ضبط‌شده‌ای در سرور ذخیره نمی‌شود و اطلاعات با هیچ شخص ثالثی فروخته یا به اشتراک گذاشته نمی‌شود.' 
              : 'Your data is protected with enterprise security standards. No voice recordings are stored on servers and personal data is never sold or shared.'}
          </p>
          <a
            href="./privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 bg-[var(--lapis-soft)] text-[var(--lapis)] hover:bg-[var(--lapis)] hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <span>{isRTL ? 'مشاهده متن کامل سیاست حریم خصوصی' : 'Read Full Privacy Policy'}</span>
            <ExternalLink size={13} />
          </a>
        </section>
      </div>

      {/* Floating reveal trigger when bars are hidden */}
      {!isBarsVisible && (
        <button
          onClick={showBars}
          aria-label="Show menu"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[var(--ink)] text-[var(--saffron)] border border-[var(--line)] rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse font-ui"
        >
          <ChevronUp size={14} />
          <span>{t.resume || (isRTL ? 'ادامه' : 'Resume')}</span>
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
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] flex gap-4 font-ui">
          <button 
            onClick={handleClose} 
            className="start-btn w-full"
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
