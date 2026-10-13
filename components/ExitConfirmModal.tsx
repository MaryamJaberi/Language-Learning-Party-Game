import React from 'react';
import { AlertTriangle, Home, Sliders, X, Play } from 'lucide-react';
import { sound } from '../soundManager';

interface Props {
  isOpen?: boolean;
  isRTL?: boolean;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm?: () => void;
  onExitHome?: () => void;
  onExitSetup?: () => void;
}

export const ExitConfirmModal: React.FC<Props> = ({
  isOpen = true,
  isRTL = true,
  title,
  message,
  onCancel,
  onConfirm,
  onExitHome,
  onExitSetup
}) => {
  if (!isOpen) return null;

  const defaultTitle = isRTL ? 'خروج از بازی' : 'Leave Match?';
  const defaultMessage = isRTL 
    ? 'می‌خواهید به کدام صفحه بازگردید؟ پیشرفت این دست ثبت نخواهد شد.'
    : 'Where would you like to return? Current round progress will not be saved.';

  const handleGoHome = () => {
    sound.playElimination();
    if (onExitHome) onExitHome();
    else if (onConfirm) onConfirm();
    else onCancel();
  };

  const handleGoSetup = () => {
    sound.playClick();
    if (onExitSetup) onExitSetup();
    else if (onConfirm) onConfirm();
    else onCancel();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-xs sm:max-w-sm bg-[var(--panel)] border-2 border-rose-500/40 rounded-[28px] p-5 sm:p-6 shadow-2xl text-[var(--ink)] space-y-4 text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle red neon glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-500/15 rounded-full blur-xl pointer-events-none" />

        {/* Top-corner Cross (X) to dismiss/cancel */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onCancel();
          }}
          className="absolute top-4 rtl:left-4 ltr:right-4 w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
          title={isRTL ? 'پشیمان شدم (ادامه بازی)' : 'Cancel & continue playing'}
          aria-label={isRTL ? 'بستن پنجره خروج' : 'Close exit dialog'}
        >
          <X size={16} />
        </button>

        <div className="w-13 h-13 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner mt-1">
          <AlertTriangle size={26} className="animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-[var(--ink)]">
            {title || defaultTitle}
          </h3>
          <p className="text-xs text-[var(--mute)] leading-relaxed px-1">
            {message || defaultMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Button 1: Return to Home / Intro */}
          <button
            type="button"
            onClick={handleGoHome}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black shadow-sm cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Home size={15} />
            <span>{isRTL ? 'برگشت به صفحه اول' : 'Return to Home Screen'}</span>
          </button>

          {/* Button 2: Return to Settings / Setup */}
          <button
            type="button"
            onClick={handleGoSetup}
            className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--line)]/50 border border-[var(--line)] text-[var(--ink)] text-xs font-black shadow-2xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sliders size={15} className="text-[var(--lapis)]" />
            <span>{isRTL ? 'برگشت به صفحه تنظیمات' : 'Return to Game Settings'}</span>
          </button>

          {/* Button 3: Cancel / Keep Playing */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg)] cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <Play size={13} />
            <span>{isRTL ? 'پشیمان شدم (ادامه بازی 🎮)' : 'Cancel & Keep Playing 🎮'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
