import React, { useEffect } from 'react';
import { Home, Sliders, X, Play, BookOpen, Pause } from 'lucide-react';
import { sound } from '../soundManager';

interface Props {
  isOpen?: boolean;
  isRTL?: boolean;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  homeLabel?: string;
  setupLabel?: string;
  helpLabel?: string;
  onCancel: () => void;
  onConfirm?: () => void;
  onExitHome?: () => void;
  onExitSetup?: () => void;
  onOpenHelp?: () => void;
}

export const ExitConfirmModal: React.FC<Props> = ({
  isOpen = true,
  isRTL = true,
  title,
  message,
  cancelLabel,
  homeLabel,
  setupLabel,
  helpLabel,
  onCancel,
  onConfirm,
  onExitHome,
  onExitSetup,
  onOpenHelp
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const defaultTitle = isRTL ? 'توقف بازی' : 'Game Paused';
  const defaultMessage = isRTL 
    ? 'بازی متوقف شده است. یکی از گزینه‌های زیر را انتخاب کنید:'
    : 'Game is paused. Choose an option below:';

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

  const handleOpenHelp = () => {
    sound.playClick();
    onCancel();
    if (onOpenHelp) onOpenHelp();
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={() => {
        sound.playClick();
        onCancel();
      }}
    >
      <div 
        className="w-full max-w-xs sm:max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-[24px] p-5 sm:p-6 shadow-2xl text-[var(--ink)] space-y-4 text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top-corner Cross (X) to dismiss/cancel */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onCancel();
          }}
          className="absolute top-3.5 rtl:left-3.5 ltr:right-3.5 w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer z-10"
          title={isRTL ? 'ادامه بازی' : 'Continue playing'}
          aria-label={isRTL ? 'بستن پنجره خروج' : 'Close exit dialog'}
        >
          <X size={16} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[var(--lapis-soft)] border border-[var(--lapis)]/30 text-[var(--lapis)] flex items-center justify-center mx-auto shadow-xs">
          <Pause size={24} />
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
          {/* Button 1: Resume / Keep Playing */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[var(--lapis)] hover:brightness-95 text-[var(--on-lapis)] text-xs font-black shadow-xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Play size={15} />
            <span>{cancelLabel || (isRTL ? 'ادامه بازی' : 'Resume Game')}</span>
            <span className="sr-only">{isRTL ? 'پشیمان شدم (ادامه بازی 🎮)' : 'Cancel & Keep Playing'}</span>
          </button>

          {/* Button 2: Open Help / Guide (if provided) */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={handleOpenHelp}
              className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--line)]/50 border border-[var(--line)] text-[var(--ink)] text-xs font-black shadow-2xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen size={15} className="text-[var(--turq)]" />
              <span>{helpLabel || (isRTL ? 'مشاهده راهنمای بازی' : 'Game Guide & Help')}</span>
            </button>
          )}

          {/* Button 3: Return to Settings / Setup */}
          <button
            type="button"
            onClick={handleGoSetup}
            className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--line)]/50 border border-[var(--line)] text-[var(--ink)] text-xs font-black shadow-2xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sliders size={15} className="text-[var(--lapis)]" />
            <span>{setupLabel || (isRTL ? 'برگشت به صفحه تنظیمات' : 'Return to Game Settings')}</span>
            {setupLabel && isRTL && <span className="sr-only">برگشت به صفحه تنظیمات</span>}
          </button>

          {/* Button 4: Return to Home / Exit Game */}
          <button
            type="button"
            onClick={handleGoHome}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Home size={15} />
            <span>{homeLabel || (isRTL ? 'خروج از بازی (صفحه اول)' : 'Exit Game (Home Screen)')}</span>
            <span className="sr-only">{isRTL ? 'برگشت به صفحه اول' : 'Return to Home Screen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;

