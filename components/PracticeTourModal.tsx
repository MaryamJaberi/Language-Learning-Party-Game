import React, { useState } from 'react';
import { 
  Volume2, 
  Volume1,
  Mic, 
  PenTool, 
  SkipForward, 
  Sparkles, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Star,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { sound } from '../soundManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isRTL: boolean;
}

interface TourStep {
  titleFa: string;
  titleEn: string;
  badgeFa: string;
  badgeEn: string;
  descFa: string;
  descEn: string;
  icon: React.ReactNode;
  iconBg: string;
  exampleUi?: React.ReactNode;
}

export const PracticeTourModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isRTL
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      titleFa: 'پخش تلفظ صوتی (نیتیو و شمرده)',
      titleEn: 'Audio Pronunciation (Normal & Slow)',
      badgeFa: 'قدم ۱: گوش دادن',
      badgeEn: 'Step 1: Listening',
      descFa: 'با دکمه بزرگ «پخش تلفظ» روی کارت، تلفظ طبیعی و باکیفیت را گوش کنید. اگر خواستید کلمه به کلمه بشنوید، روی دکمه «شمرده» بزنید.',
      descEn: 'Tap the large "Play Audio" button on the card to hear authentic native pronunciation. Tap "Slow" to hear it at a relaxed pace.',
      icon: <Volume2 size={28} className="text-sky-500" />,
      iconBg: 'bg-sky-500/15 border-sky-400/30',
      exampleUi: (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="px-4 py-2 rounded-xl bg-[var(--lapis)] text-white text-xs font-black flex items-center gap-2 shadow-xs">
            <Volume2 size={16} />
            <span>{isRTL ? 'پخش تلفظ صوتی' : 'Play Audio'}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-xs font-black flex items-center gap-1.5 shadow-2xs">
            <Volume1 size={15} className="text-[var(--turq)]" />
            <span>{isRTL ? 'شمرده' : 'Slow'}</span>
          </div>
        </div>
      )
    },
    {
      titleFa: 'میکروفون هوشمند و سنجش گفتار',
      titleEn: 'Smart Microphone & Speech Scoring',
      badgeFa: 'قدم ۲: صحبت کردن',
      badgeEn: 'Step 2: Speaking',
      descFa: 'دکمه صورتی میکروفون را لمس کنید و عبارت انگلیسی را با صدای رسا بخوانید. بعد از پایان، هوش مصنوعی دقیقاً به گفتارتان امتیاز می‌دهد.',
      descEn: 'Tap the pink microphone button and speak the phrase out loud. AI instantly analyzes your accent and accuracy.',
      icon: <Mic size={28} className="text-rose-500" />,
      iconBg: 'bg-rose-500/15 border-rose-400/30',
      exampleUi: (
        <div className="flex items-center justify-center py-2">
          <div className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-md">
            <Mic size={16} />
            <span>{isRTL ? 'لمس برای صحبت' : 'Touch to Speak'}</span>
          </div>
        </div>
      )
    },
    {
      titleFa: 'کادر نوشتن و کیبورد دستی',
      titleEn: 'Typing Box & Manual Input',
      badgeFa: 'قدم ۳: نوشتن',
      badgeEn: 'Step 3: Writing',
      descFa: 'در مکان‌های شلوغ یا زمانی که مایل به نوشتن هستید، می‌توانید پاسختان را در کادر متنی بنویسید یا دکمه «نوشتن» را لمس کنید.',
      descEn: 'In busy areas or when you prefer typing, write your answer in the text box or tap the "Write" button.',
      icon: <PenTool size={28} className="text-teal-500" />,
      iconBg: 'bg-teal-500/15 border-teal-400/30',
      exampleUi: (
        <div className="flex items-center justify-center gap-2 py-2 w-full max-w-xs mx-auto">
          <div className="flex-1 bg-[var(--panel)] border border-[var(--line)] px-3 py-1.5 rounded-xl text-xs text-[var(--mute)] font-medium text-start">
            {isRTL ? 'پاسخ را بنویسید...' : 'Type answer...'}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--lapis)] text-white text-xs font-bold">
            {isRTL ? 'ثبت' : 'Check'}
          </div>
        </div>
      )
    },
    {
      titleFa: 'دکمه رد کردن و یادگیری بدون استرس',
      titleEn: 'Skip Card & Stress-Free Learning',
      badgeFa: 'قدم ۴: یادگیری آسان',
      badgeEn: 'Step 4: Safe Skip',
      descFa: 'اگر جمله‌ای را بلد نبودید اصلاً نگران نشوید! دکمه «رد کردن» را بزنید تا پاسخ درست، معنی دقیق و نکته گرامری بلافاصله نمایش داده شود.',
      descEn: "Never get stuck or stressed! Tap 'Skip' anytime to immediately reveal the correct answer and grammar note.",
      icon: <SkipForward size={28} className="text-amber-500" />,
      iconBg: 'bg-amber-500/15 border-amber-400/30',
      exampleUi: (
        <div className="flex items-center justify-center py-2">
          <div className="px-4 py-2 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[var(--mute)] text-xs font-black flex items-center gap-2 shadow-2xs">
            <SkipForward size={15} />
            <span>{isRTL ? 'رد کردن' : 'Skip'}</span>
          </div>
        </div>
      )
    },
    {
      titleFa: 'جزئیات بیشتر: تلفظ فارسی و گرامر',
      titleEn: 'More Details: Phonetics & Grammar',
      badgeFa: 'قدم ۵: خلوت و متمرکز',
      badgeEn: 'Step 5: Clean & Focused',
      descFa: 'برای جلوگیری از شلوغی صفحه و سردرگمی، تلفظ نوشتاری فارسی و نکات گرامری زیر دکمه «نکات و جزئیات بیشتر» قرار دارند و هر زمان بخواهید باز می‌شوند.',
      descEn: 'To prevent cognitive overload, Persian phonetic guides and grammar points are neatly tucked under "More Details".',
      icon: <Star size={28} className="text-indigo-500" />,
      iconBg: 'bg-indigo-500/15 border-indigo-400/30',
      exampleUi: (
        <div className="flex items-center justify-center py-2">
          <div className="px-4 py-2 rounded-xl bg-[var(--panel)] border border-amber-500/30 text-[var(--ink)] text-xs font-black flex items-center gap-2 shadow-2xs">
            <Star size={14} className="text-amber-500" />
            <span>{isRTL ? 'نکات و تلفظ فارسی (بیشتر)' : 'More Details (Grammar & Hints)'}</span>
          </div>
        </div>
      )
    }
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    sound.playClick();
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    sound.playPowerUp();
    try {
      localStorage.setItem('dor_practice_tour_seen', 'true');
    } catch {}
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={handleComplete}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-[var(--panel)] border border-[var(--line)] rounded-[26px] p-5 shadow-2xl relative flex flex-col justify-between"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Bar with Step counter and Close */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center font-bold text-xs">
              <HelpCircle size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-[var(--ink)]">
                {isRTL ? 'راهنمای دکمه‌های تمرین' : 'Practice Guide & Buttons'}
              </h3>
              <span className="text-[10px] font-bold text-[var(--mute)]">
                {isRTL ? `مرحله ${currentStep + 1} از ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="p-1.5 rounded-xl hover:bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label={isRTL ? 'بستن راهنما' : 'Close Guide'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Card Content */}
        <div className="py-5 text-center flex flex-col items-center">
          {/* Step Kicker */}
          <div className="text-[11px] font-black text-[var(--lapis)] uppercase tracking-wider mb-3">
            {isRTL ? step.badgeFa : step.badgeEn}
          </div>

          {/* Animated Large Icon */}
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 shadow-sm ${step.iconBg}`}>
            {step.icon}
          </div>

          {/* Title */}
          <h4 className="text-base font-black text-[var(--ink)] mb-2">
            {isRTL ? step.titleFa : step.titleEn}
          </h4>

          {/* Description */}
          <p className="text-xs text-[var(--mute)] leading-relaxed max-w-xs mb-3">
            {isRTL ? step.descFa : step.descEn}
          </p>

          {/* Interactive UI Preview */}
          {step.exampleUi && (
            <div className="w-full bg-[var(--bg)] p-2.5 rounded-2xl border border-[var(--line)]/60 my-1">
              {step.exampleUi}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="pt-3 border-t border-[var(--line)]/60 flex items-center justify-between gap-2">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCurrentStep(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep 
                    ? 'w-6 bg-[var(--lapis)]' 
                    : 'w-2 bg-[var(--line)] hover:bg-[var(--mute)]'
                }`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleComplete}
              className="px-3 py-2 text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              {isRTL ? 'رد شدن (Skip)' : 'Skip'}
            </button>

            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                aria-label={isRTL ? 'قبلی' : 'Previous'}
              >
                <ArrowRight size={15} className={isRTL ? '' : 'rotate-180'} />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[var(--lapis)] hover:brightness-110 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{isLast ? (isRTL ? 'شروع تمرین!' : 'Get Started!') : (isRTL ? 'بعدی' : 'Next')}</span>
              {isLast ? (
                <Check size={14} />
              ) : (
                <ArrowLeft size={14} className={isRTL ? '' : 'rotate-180'} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
