import React, { useState, useEffect } from 'react';
import { sound } from '../soundManager';
import { Volume2, VolumeX } from 'lucide-react';

interface Props {
  className?: string;
  language?: string;
  onToggle?: (muted: boolean) => void;
  variant?: 'compact' | 'badge' | 'icon-only';
}

export const SoundHeaderButton: React.FC<Props> = ({
  className = '',
  language = 'fa',
  onToggle,
  variant = 'compact'
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Keep state in sync with sound manager
  useEffect(() => {
    setIsMuted(sound.getMuted());
    const unsub = sound.addMuteListener((m) => {
      setIsMuted(m);
    });
    return unsub;
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (nextMuted) {
      // stopped sound
    } else {
      sound.playClick();
    }
    if (onToggle) {
      onToggle(nextMuted);
    }
  };

  const isFa = language === 'fa';
  const label = isMuted 
    ? (isFa ? 'بی‌صدا' : 'Muted') 
    : (isFa ? 'صدا' : 'Sound');

  const titleText = isMuted ? (isFa ? 'وصل کردن صدای بازی' : 'Unmute sound') : (isFa ? 'قطع کردن صدای بازی' : 'Mute sound');

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={titleText}
      aria-label={label}
      style={{
        backgroundColor: isMuted ? '#f43f5e' : undefined,
        color: isMuted ? '#ffffff' : undefined,
        borderColor: isMuted ? '#e11d48' : undefined,
        opacity: 1,
        visibility: 'visible',
        display: 'inline-flex'
      }}
      className={`items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-all shrink-0 select-none cursor-pointer ${
        variant === 'icon-only' ? 'w-10 h-10 p-0 rounded-full' : 'gap-1.5 px-3 py-1.5 rounded-[12px]'
      } ${
        isMuted
          ? '!bg-rose-500 !text-white !border-2 !border-rose-600 dark:!bg-rose-600 dark:!border-rose-500 shadow-rose-500/20 shadow-md ring-2 ring-rose-400/30'
          : '!bg-[var(--panel)] hover:!bg-[var(--bg)] !text-[var(--ink)] !border !border-[var(--line)]'
      } ${className}`}
    >
      {isMuted ? (
        <VolumeX 
          size={18} 
          className="!text-white shrink-0 stroke-white" 
          strokeWidth={2.5} 
          style={{ color: '#ffffff', stroke: '#ffffff', display: 'block' }} 
        />
      ) : (
        <Volume2 
          size={18} 
          className="!text-[var(--ink)] shrink-0" 
          strokeWidth={2} 
          style={{ display: 'block' }}
        />
      )}
      {variant !== 'icon-only' && (
        <span className="text-[11px] leading-none" style={{ color: isMuted ? '#ffffff' : undefined }}>
          {label}
        </span>
      )}
    </button>
  );
};
