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
      className={`flex items-center justify-center rounded-[12px] border font-bold text-xs shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all shrink-0 select-none ${
        variant === 'icon-only' ? 'w-9 h-9 p-0' : 'gap-1 px-3 py-1.5'
      } ${
        isMuted
          ? 'bg-[var(--vermilion)] text-white border-[var(--vermilion)]'
          : 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]'
      } ${className}`}
    >
      {isMuted ? (
        <VolumeX size={16} className="text-white shrink-0 animate-pulse" />
      ) : (
        <Volume2 size={16} className="text-[var(--ink)] shrink-0" />
      )}
      {variant !== 'icon-only' && (
        <span className="text-[11px] leading-none">
          {label}
        </span>
      )}
    </button>
  );
};
