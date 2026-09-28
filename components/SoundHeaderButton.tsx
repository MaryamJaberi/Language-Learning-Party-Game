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
      className={`flex items-center justify-center rounded-[14px] border-2 border-[#1E1B2E] font-bold text-xs shadow-[3px_3px_0px_0px_#1E1B2E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1E1B2E] transition-all shrink-0 select-none ${
        variant === 'icon-only' ? 'w-10 h-10 p-0' : 'gap-1 px-3 py-1.5'
      } ${
        isMuted
          ? 'bg-[#E0603F] text-white'
          : 'bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E]'
      } ${className}`}
    >
      {isMuted ? (
        <VolumeX size={16} className="text-white shrink-0 animate-pulse" />
      ) : (
        <Volume2 size={16} className="text-[#120524] shrink-0" />
      )}
      {variant !== 'icon-only' && (
        <span className="text-[11px] leading-none">
          {label}
        </span>
      )}
    </button>
  );
};
