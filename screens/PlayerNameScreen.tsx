import React, { useState, useEffect, useRef } from 'react';
import { GameSettings, TeamColor } from '../types';
import { COLORS_MAP } from '../constants';
import { TRANSLATIONS } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { PixelAvatar, getRandomAvatar, AVATARS_LIST, AvatarId } from '../components/PixelAvatars';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import { sound } from '../soundManager';
import { getRandomCharacters } from '../characters';
import { isRtlLang } from '../ui';
import { 
  Users, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Sparkles, 
  Dices,
  RefreshCw
} from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onStart: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
}

const PlayerNameScreen: React.FC<Props> = ({ settings, onSave, onStart, onBack, onOpenHelp }) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fa;
  const isRTL = isRtlLang(settings.language);

  const [avatarPickerIndex, setAvatarPickerIndex] = useState<number | null>(null);

  // Ensure default names and avatars are populated with cartoon characters and retro avatars
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    const isEnglishNative = settings.nativeLanguage === 'en-US' || settings.nativeLanguage === 'en' || settings.language === 'en-US' || settings.language === 'en';
    const effectiveLang = isEnglishNative ? 'en-US' : (settings.nativeLanguage || settings.language || 'en-US');
    const defaults = getRandomCharacters(effectiveLang, 8);
    const defaultAvatars: AvatarId[] = [
      'pirate', 'wizard', 'winter_slime', 'king', 
      'punk_rocker', 'chef', 'detective', 'cyber_dj'
    ];

    const currentNames = settings.playerNames || [];
    const currentAvatars = settings.playerAvatars || [];

    const hasAnyEmpty = Array.from({ length: settings.playerCount }).some(
      (_, i) => !currentNames[i] || currentNames[i].trim().length === 0
    );
    const hasMissingAvatars = Array.from({ length: settings.playerCount }).some(
      (_, i) => !currentAvatars[i]
    );
    const hasPersianNames = currentNames.some(name => /[\u0600-\u06FF]/.test(name));

    if (hasAnyEmpty || hasMissingAvatars || (isEnglishNative && hasPersianNames)) {
      initializedRef.current = true;
      const updatedNames = (isEnglishNative && hasPersianNames)
        ? defaults
        : Array.from({ length: 8 }).map(
            (_, i) => (currentNames[i] && currentNames[i].trim().length > 0) ? currentNames[i] : defaults[i]
          );
      const updatedAvatars = Array.from({ length: 8 }).map(
        (_, i) => currentAvatars[i] || defaultAvatars[i % defaultAvatars.length]
      );

      onSave({
        ...settings,
        playerNames: updatedNames,
        playerAvatars: updatedAvatars
      });
    }
  }, [settings.playerCount, settings.language, settings.nativeLanguage]);

  const randomizeAllNames = () => {
    sound.playPowerUp();
    const isEnglishNative = settings.nativeLanguage === 'en-US' || settings.nativeLanguage === 'en' || settings.language === 'en-US' || settings.language === 'en';
    const effectiveLang = isEnglishNative ? 'en-US' : (settings.nativeLanguage || settings.language || 'en-US');
    const newCharacters = getRandomCharacters(effectiveLang, 8);
    // Also randomize avatars from the 17 cute characters
    const shuffledAvatars = [...AVATARS_LIST].sort(() => Math.random() - 0.5).map(a => a.id);
    onSave({ 
      ...settings, 
      playerNames: newCharacters,
      playerAvatars: shuffledAvatars
    });
  };

  const getTeamColor = (index: number): TeamColor => {
    const teamIndex = index % (settings.playerCount / 2);
    return Object.values(TeamColor)[teamIndex];
  };

  const updateName = (index: number, name: string) => {
    const names = [...settings.playerNames];
    names[index] = name;
    onSave({ ...settings, playerNames: names });
  };

  const updateAvatar = (index: number, avatarId: AvatarId) => {
    const avatars = [...(settings.playerAvatars || [])];
    avatars[index] = avatarId;
    onSave({ ...settings, playerAvatars: avatars });
  };

  const labelColorText = (color: TeamColor) => {
    return t.teamNames[color] || color;
  };

  const isEnglishNative = settings.nativeLanguage === 'en-US' || settings.nativeLanguage === 'en' || settings.language === 'en-US' || settings.language === 'en';
  const effectiveLang = isEnglishNative ? 'en-US' : (settings.nativeLanguage || settings.language || 'en-US');
  const defaultsList = getRandomCharacters(effectiveLang, 8);

  const handleStartGame = () => {
    const defaultAvatars: AvatarId[] = ['pirate', 'wizard', 'winter_slime', 'king', 'punk_rocker', 'chef', 'detective', 'cyber_dj'];
    const finalNames = Array.from({ length: settings.playerCount }).map((_, i) => {
      const n = settings.playerNames[i];
      if (isEnglishNative && n && /[\u0600-\u06FF]/.test(n)) {
        return defaultsList[i];
      }
      return (n && n.trim().length > 0) ? n.trim() : defaultsList[i];
    });
    const finalAvatars = Array.from({ length: settings.playerCount }).map((_, i) => {
      return (settings.playerAvatars && settings.playerAvatars[i]) || defaultAvatars[i % defaultAvatars.length];
    });

    onSave({ ...settings, playerNames: finalNames, playerAvatars: finalAvatars });
    sound.playStartGame();
    onStart();
  };

  const activeAvatarForModal = avatarPickerIndex !== null 
    ? ((settings.playerAvatars && settings.playerAvatars[avatarPickerIndex]) as AvatarId) || 'pirate'
    : 'pirate';

  const activePlayerNameForModal = avatarPickerIndex !== null
    ? settings.playerNames[avatarPickerIndex] || (isRTL ? `بازیکن ${avatarPickerIndex + 1}` : `Player ${avatarPickerIndex + 1}`)
    : '';

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Stable Header */}
      <header className="shrink-0 mb-2 font-ui">
        <div className="flex items-center justify-between bg-[#FFFBF4] text-[#1E1B2E] p-2.5 sm:p-3 border-2 border-[#1E1B2E] rounded-[20px] shadow-[3px_3px_0px_0px_#1E1B2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]">
              <Users size={16} color="#1E1B2E" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider leading-tight">
                {t.playerNames}
              </h1>
              <span className="text-[10px] text-[#E0603F] font-bold block">
                {isRTL ? 'مرحله ۴ از ۴: چیدمان و نام اعضا' : 'Step 4 of 4: Team Lineup & Names'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <SoundHeaderButton language={settings.language} />
            <button 
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenHelp?.();
              }} 
              className="px-2.5 py-1.5 bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] font-bold text-xs rounded-[10px] shadow-[2px_2px_0px_0px_#1E1B2E] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
            >
              <HelpCircle size={14} color="#1E1B2E" />
              <span>{t.guide}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Action & Cartoon Characters Banner */}
      <div className="shrink-0 mb-2 flex items-center justify-between gap-2 bg-[#FFFBF4] p-2 border-2 border-[#1E1B2E] rounded-[14px] shadow-[2px_2px_0px_0px_#1E1B2E] font-ui">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={15} className="text-[#E0603F] shrink-0" />
          <span className="text-[11px] font-bold text-[#1E1B2E] truncate">
            {isRTL 
              ? 'روی آواتار کلیک کنید تا شخصیت دلخواه خود را انتخاب کنید!' 
              : 'Tap any avatar to choose your favorite retro character!'}
          </span>
        </div>
        <button
          type="button"
          onClick={randomizeAllNames}
          className="shrink-0 px-2.5 py-1 bg-[#F2B63D] hover:bg-[#e0a634] active:scale-95 text-[#1E1B2E] border-2 border-[#1E1B2E] rounded-[10px] font-bold text-[10.5px] shadow-[1.5px_1.5px_0px_0px_#1E1B2E] flex items-center gap-1 transition-all"
        >
          <Dices size={14} />
          <span>{isRTL ? 'تغییر تصادفی 🎲' : 'Randomize 🎲'}</span>
        </button>
      </div>

      {/* Players Input Form */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 space-y-2 pb-2 overscroll-contain font-ui">
        {Array.from({ length: settings.playerCount }).map((_, i) => {
          const color = getTeamColor(i);
          const colorConfig = COLORS_MAP[color];
          const placeholderName = defaultsList[i] || (isRTL ? `بازیکن ${i + 1}` : `Player ${i + 1}`);
          const currentAvatarId = (settings.playerAvatars && (settings.playerAvatars[i] as AvatarId)) || 'pirate';
          
          return (
            <div key={i} className="flex items-center gap-2.5 bg-[#FFFBF4] p-2.5 border-2 border-[#1E1B2E] rounded-[16px] shadow-[2px_2px_0px_0px_#1E1B2E]">
              {/* Cute Pixel Avatar & Badge */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAvatarPickerIndex(i);
                }}
                title={isRTL ? 'تغییر آواتار بازیکن' : 'Change Avatar'}
                className="flex flex-col items-center justify-center shrink-0 group relative p-1 rounded-[12px] bg-[#F4EDE1] hover:bg-[#eae0d2] border-2 border-[#1E1B2E] transition-all active:scale-95"
              >
                <div className="w-10 h-10 flex items-center justify-center relative">
                  <PixelAvatar id={currentAvatarId} size={38} />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F2B63D] border border-[#1E1B2E] flex items-center justify-center text-[8px] text-[#1E1B2E] font-bold">
                    ✏️
                  </div>
                </div>
                <div className={`mt-0.5 px-1.5 py-0.5 rounded-[6px] text-[8.5px] font-bold border border-[#1E1B2E] ${colorConfig.bg} ${colorConfig.text} uppercase`}>
                  #{i + 1} {labelColorText(color)}
                </div>
              </button>

              {/* Name Input Box */}
              <div className="flex-1 min-w-0">
                <input 
                  type="text" 
                  maxLength={16}
                  placeholder={placeholderName}
                  value={settings.playerNames[i] || ''}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="w-full p-2 bg-[#F4EDE1] border-2 border-[#1E1B2E] rounded-[12px] focus:bg-[#FFFBF4] focus:outline-none transition-all font-bold text-xs text-[#1E1B2E]"
                />
              </div>

              {/* Single Slot Re-roll Button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  const singlePool = getRandomCharacters(effectiveLang, 16);
                  const randomPick = singlePool[Math.floor(Math.random() * singlePool.length)];
                  updateName(i, randomPick);
                  updateAvatar(i, getRandomAvatar());
                }}
                title={isRTL ? 'تغییر این نام و آواتار' : 'Change this name & avatar'}
                className="p-2 bg-[#F4EDE1] hover:bg-[#eae0d2] active:scale-95 text-[#1E1B2E] border-2 border-[#1E1B2E] rounded-[10px] shrink-0 flex items-center justify-center"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Fixed Stable Navigation Footer */}
      <footer className="shrink-0 pt-2 border-t-2 border-[#1E1B2E]/15 font-ui">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-orange flex-1 py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-1.5 rounded-[16px]"
          >
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t.back}</span>
          </button>
          
          <button 
            type="button"
            onClick={handleStartGame} 
            className="pixel-btn pixel-btn-teal flex-[2] py-2.5 text-sm font-bold uppercase flex items-center justify-center gap-2 rounded-[16px]"
          >
            <span>{t.start}</span>
            <Zap size={16} color="#ffffff" fill="#ffffff" />
          </button>
        </div>
      </footer>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={avatarPickerIndex !== null}
        onClose={() => setAvatarPickerIndex(null)}
        selectedAvatarId={activeAvatarForModal}
        onSelectAvatar={(avatarId) => {
          if (avatarPickerIndex !== null) {
            updateAvatar(avatarPickerIndex, avatarId);
          }
        }}
        playerName={activePlayerNameForModal}
        language={settings.language}
      />

    </div>
  );
};

export default PlayerNameScreen;
