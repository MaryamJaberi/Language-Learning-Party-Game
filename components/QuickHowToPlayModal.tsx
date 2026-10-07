import React from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  Check, 
  Swords, 
  Users, 
  User, 
  Flame, 
  Zap, 
  X, 
  Smartphone, 
  Wifi, 
  Volume2 
} from 'lucide-react';
import { sound } from '../soundManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isRTL?: boolean;
}

export const QuickHowToPlayModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isRTL = true
}) => {
  if (!isOpen) return null;

  const handleDismiss = () => {
    sound.playClick();
    localStorage.setItem('dor_intro_guide_seen', 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={handleDismiss}
    >
      <div 
        className="w-full max-w-md bg-[var(--panel)] border-2 border-[var(--line)] rounded-[28px] shadow-2xl overflow-hidden text-[var(--ink)] flex flex-col max-h-[92vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Arcade Neon Header Banner */}
        <div className="bg-gradient-to-r from-[#2347C5] via-[#9333EA] to-[#E0533C] p-4 text-white flex items-center justify-between relative overflow-hidden">
          {/* Subtle star pattern */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-md">
              <Gamepad2 size={22} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                {isRTL ? 'نحوه بازی دور (سریع و مفید)' : 'How to Play Dour (Quick Guide)'}
              </h2>
              <span className="text-[11px] font-bold text-white/80">
                {isRTL ? 'در ۳۰ ثانیه استاد بازی شو!' : 'Master the game in 30 seconds!'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3 Steps Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Step 1: Goal */}
          <div className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--lapis)]/15 text-[var(--lapis)] flex items-center justify-center font-black text-sm shrink-0">
              ۱
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black text-[var(--ink)]">
                {isRTL ? '🎯 هدف اصلی بازی' : '🎯 Main Objective'}
              </h3>
              <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                {isRTL 
                  ? 'کارت‌های زبان مقصد (لغات و جملات پرکاربرد) نمایش داده می‌شوند؛ هرچه سریع‌تر و دقیق‌تر معنی، تلفظ یا پاسخ صحیح را بگویید یا انتخاب کنید.'
                  : 'Target language cards (key phrases and words) appear. Speak, type, or pick the correct translation as fast as possible.'}
              </p>
            </div>
          </div>

          {/* Step 2: Game Modes */}
          <div className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-black text-sm shrink-0">
              ۲
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-[var(--ink)]">
                {isRTL ? '🎮 سه حالت جذاب بازی' : '🎮 Three Exciting Game Modes'}
              </h3>
              <div className="space-y-1.5 text-[11px] text-[var(--mute)]">
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-[var(--lapis)] shrink-0" />
                  <span>
                    <strong className="text-[var(--ink)]">{isRTL ? 'تک‌نفره (Solo):' : 'Solo:'}</strong> {isRTL ? 'تمرین تلفظ صوتی، نوشتاری و تقویت واژگان.' : 'Voice recognition & vocab practice.'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Swords size={13} className="text-[#E0533C] shrink-0" />
                  <span>
                    <strong className="text-[var(--ink)]">{isRTL ? 'دوئل سرعتی (Duel):' : 'Duel:'}</strong> {isRTL ? 'مسابقه ۲ نفره؛ هم روی یک گوشی مشترک و هم روی ۲ گوشی مجزا با کد اتاق!' : '1v1 reflex race on 1 phone or 2 separate phones!'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong className="text-[var(--ink)]">{isRTL ? 'مهمانی تیمی (Party):' : 'Party:'}</strong> {isRTL ? 'بازی گروهی و دورهمی تیمی با تایمر نفس‌گیر.' : 'Team battle with explosive turn timer.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Pro Tips & Combos */}
          <div className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black text-sm shrink-0">
              ۳
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black text-[var(--ink)] flex items-center gap-1">
                <span>{isRTL ? '⚡ کومبو و راز پیروزی' : '⚡ Combos & Winning Tips'}</span>
                <Flame size={14} className="text-amber-500" />
              </h3>
              <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                {isRTL 
                  ? 'پاسخ‌های درست متوالی به شما «کومبو آتشین» و امتیاز دوبل می‌دهد! مواظب باشید، پاسخ اشتباه شما را موقتاً فریز می‌کند.'
                  : 'Consecutive correct answers trigger a Fire Combo with 2x points! Beware: wrong answers temporarily freeze your button.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-[var(--panel)] border-t border-[var(--line)]">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3 bg-gradient-to-r from-[#2347C5] to-[#E0533C] hover:opacity-95 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98 transition-transform"
          >
            <Sparkles size={16} />
            <span>{isRTL ? 'فهمیدم، بزن بریم بازی! 🚀' : 'Got it, Let’s Play! 🚀'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickHowToPlayModal;
