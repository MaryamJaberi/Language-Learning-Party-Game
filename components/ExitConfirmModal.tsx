import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { sound } from '../soundManager';

interface Props {
  isOpen?: boolean;
  isRTL?: boolean;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ExitConfirmModal: React.FC<Props> = ({
  isOpen = true,
  isRTL = true,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  const defaultTitle = isRTL ? 'مطمئنی می‌خوای خارج بشی؟' : 'Are you sure you want to exit?';
  const defaultMessage = isRTL 
    ? 'اگر الان خارج بشی، پیشرفت این دست از بازی متوقف شده و ثبت نخواهد شد.'
    : 'If you leave now, the current game progress will be lost.';
  const defaultCancel = isRTL ? 'ادامه بازی 🎮' : 'Keep Playing 🎮';
  const defaultConfirm = isRTL ? 'بله، خروج' : 'Yes, Exit';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-xs bg-[var(--panel)] border-2 border-rose-500/50 rounded-[28px] p-5 shadow-2xl text-[var(--ink)] space-y-4 text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle red neon glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 bg-rose-500/20 rounded-full blur-xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={28} className="animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-[var(--ink)]">
            {title || defaultTitle}
          </h3>
          <p className="text-xs text-[var(--mute)] leading-relaxed">
            {message || defaultMessage}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="py-2.5 px-2 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)] text-xs font-black text-[var(--ink)] cursor-pointer active:scale-95 transition-all"
          >
            {cancelLabel || defaultCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playElimination();
              onConfirm();
            }}
            className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <LogOut size={14} />
            <span>{confirmLabel || defaultConfirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
