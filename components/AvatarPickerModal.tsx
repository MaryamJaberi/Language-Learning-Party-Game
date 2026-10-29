import React from 'react';
import { PixelAvatar, AVATARS_LIST, AvatarId } from './PixelAvatars';
import { sound } from '../soundManager';
import { isRtlLang, tUI } from '../ui';
import { X, Sparkles, Dices, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatarId: AvatarId;
  onSelectAvatar: (avatarId: AvatarId) => void;
  playerName?: string;
  language?: string;
}

export const AvatarPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedAvatarId,
  onSelectAvatar,
  playerName = 'بازیکن',
  language = 'fa'
}) => {
  if (!isOpen) return null;

  const isRTL = isRtlLang(language);
  const t = tUI(language);

  const handleSelect = (id: AvatarId) => {
    sound.playToggle();
    onSelectAvatar(id);
    onClose();
  };

  const handleRandomize = () => {
    sound.playPowerUp();
    const randomPick = AVATARS_LIST[Math.floor(Math.random() * AVATARS_LIST.length)].id;
    onSelectAvatar(randomPick);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={() => {
        sound.playClick();
        onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-[24px] p-4 sm:p-5 text-[var(--ink)] shadow-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--lapis)]/10 text-[var(--lapis)] border border-[var(--lapis)]/20 flex items-center justify-center font-black">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--ink)] leading-tight">
                {(t.chooseCuteAvatar || (isRTL ? 'انتخاب آواتار' : 'Choose Avatar')).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()}
              </h3>
              <span className="text-[11px] text-[var(--muted)] font-bold block mt-0.5">
                {isRTL ? `برای: ${playerName}` : `For: ${playerName}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-95 border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Random Button */}
        <div className="mb-3 shrink-0">
          <button
            type="button"
            onClick={handleRandomize}
            className="w-full py-2.5 px-3.5 bg-[var(--bg)] hover:bg-[var(--lapis)]/10 hover:border-[var(--lapis)]/30 active:scale-[0.99] text-[var(--lapis)] border border-[var(--line)] rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Dices size={16} />
            <span>
              {(t.randomAvatarBtn || (isRTL ? 'انتخاب تصادفی آواتار' : 'Random Avatar')).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()}
            </span>
          </button>
        </div>

        {/* Grid of Avatars */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 grid grid-cols-3 gap-2.5 overscroll-contain pb-1">
          {AVATARS_LIST.map((av) => {
            const isSelected = selectedAvatarId === av.id;
            const displayName = isRTL ? av.name.fa : av.name.en;

            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleSelect(av.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all active:scale-95 text-center relative cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--lapis)]/10 border-[var(--lapis)] shadow-sm'
                    : 'bg-[var(--bg)] hover:border-[var(--lapis)]/40 border-[var(--line)]'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--lapis)] border-2 border-[var(--panel)] flex items-center justify-center text-white shadow-sm">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
                <div className="w-12 h-12 flex items-center justify-center">
                  <PixelAvatar id={av.id} size={44} animate={isSelected} />
                </div>
                <span className={`text-[10.5px] font-black mt-1.5 truncate max-w-full ${
                  isSelected ? 'text-[var(--lapis)]' : 'text-[var(--ink)]'
                }`}>
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
