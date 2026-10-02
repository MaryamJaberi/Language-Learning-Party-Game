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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#4c0519] border-[3.5px] border-[#0f172a] rounded-3xl p-3.5 sm:p-4 text-white shadow-[6px_6px_0px_0px_#0f172a] flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b-2 border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] text-[#1e1b4b] border-2 border-[#0f172a] flex items-center justify-center font-black shadow-[1.5px_1.5px_0px_0px_#0f172a]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">
                {t.chooseCuteAvatar || (isRTL ? 'انتخاب آواتار بامزه' : 'Choose Cute Avatar')}
              </h3>
              <span className="text-[10.5px] text-[#FFE600] font-bold block">
                {isRTL ? `برای: ${playerName}` : `For: ${playerName}`}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Random Button */}
        <div className="mb-2 shrink-0">
          <button
            type="button"
            onClick={handleRandomize}
            className="w-full py-2 px-3 bg-[#10b981] hover:bg-emerald-600 active:translate-y-0.5 text-[#0f172a] border-2 border-[#0f172a] rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center gap-1.5 transition-all"
          >
            <Dices size={16} />
            <span>{t.randomAvatarBtn || (isRTL ? 'انتخاب تصادفی آواتار 🎲' : 'Random Avatar 🎲')}</span>
          </button>
        </div>

        {/* Grid of Avatars */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 grid grid-cols-3 gap-2 overscroll-contain pb-1">
          {AVATARS_LIST.map((av) => {
            const isSelected = selectedAvatarId === av.id;
            const displayName = isRTL ? av.name.fa : av.name.en;

            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleSelect(av.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 text-center relative ${
                  isSelected
                    ? 'bg-[#FFE600] border-white shadow-[0_0_12px_rgba(255,230,0,0.8)]'
                    : 'bg-[#18122B] hover:bg-[#251a44] border-white/15'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#10b981] border-2 border-[#0f172a] flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                <div className="w-12 h-12 flex items-center justify-center">
                  <PixelAvatar id={av.id} size={44} animate={isSelected} />
                </div>
                <span className={`text-[10px] font-black mt-1 truncate max-w-full ${
                  isSelected ? 'text-[#1e1b4b]' : 'text-slate-200'
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
