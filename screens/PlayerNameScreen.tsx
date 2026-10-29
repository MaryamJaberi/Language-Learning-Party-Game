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
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col p-3 sm:p-4 select-none overflow-hidden relative font-ui text-[var(--ink)] bg-[var(--bg)]" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Stable Header */}
      <header className="shrink-0 mb-2 font-ui">
        <div className="flex items-center justify-between bg-[var(--panel)] text-[var(--ink)] p-2.5 sm:p-3 border border-[var(--line)] rounded-[20px] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider leading-tight text-[var(--ink)]">
                {t.playerNames}
              </h1>
              <span className="text-[10px] text-[var(--lapis)] font-bold block">
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
              className="px-2.5 py-1.5 bg-[var(--lapis-soft)] hover:bg-[var(--lapis-soft)]/80 text-[var(--lapis)] font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>{t.guide}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Action Banner */}
      <div className="shrink-0 mb-2 flex items-center justify-between gap-2 bg-[var(--panel)] p-2.5 border border-[var(--line)] rounded-xl shadow-xs font-ui">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={15} className="text-[var(--saffron)] shrink-0" />
          <span className="text-[11px] font-bold text-[var(--mute)] truncate">
            {isRTL 
              ? 'نام بازیکنان هر تیم را وارد کنید یا تصادفی انتخاب کنید' 
              : 'Enter player names for each team or randomize'}
          </span>
        </div>
        <button
          type="button"
          onClick={randomizeAllNames}
          className="shrink-0 px-2.5 py-1.5 bg-[var(--turq)] hover:brightness-105 active:scale-95 text-white rounded-xl font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all cursor-pointer"
        >
          <Dices size={14} />
          <span>{isRTL ? 'اسامی تصادفی' : 'Randomize'}</span>
        </button>
      </div>

      {/* Players Input Form */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 space-y-2 pb-2 overscroll-contain font-ui">
        {Array.from({ length: settings.playerCount }).map((_, i) => {
          const color = getTeamColor(i);
          const colorConfig = COLORS_MAP[color];
          const placeholderName = defaultsList[i] || (isRTL ? `بازیکن ${i + 1}` : `Player ${i + 1}`);
          
          return (
            <div key={i} className="flex items-center gap-2.5 bg-[var(--panel)] p-2.5 border border-[var(--line)] rounded-2xl shadow-xs">
              {/* Team Badge */}
              <div
                className="px-2.5 py-2 rounded-xl text-xs font-black text-white shrink-0 flex items-center gap-1.5 shadow-2xs"
                style={{ backgroundColor: colorConfig.hex }}
              >
                <span>#{i + 1}</span>
                <span>{labelColorText(color)}</span>
              </div>

              {/* Name Input Box */}
              <div className="flex-1 min-w-0">
                <input 
                  type="text" 
                  maxLength={16}
                  placeholder={placeholderName}
                  value={settings.playerNames[i] || ''}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl focus:border-[var(--lapis)] focus:outline-hidden transition-all font-bold text-xs sm:text-sm text-[var(--ink)]"
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
                }}
                title={isRTL ? 'تغییر نام' : 'Randomize name'}
                className="p-2.5 bg-[var(--bg)] hover:bg-[var(--line)]/60 active:scale-95 text-[var(--ink)] border border-[var(--line)] rounded-xl shrink-0 flex items-center justify-center transition-all cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Fixed Stable Navigation Footer */}
      <footer className="shrink-0 pt-2 border-t border-[var(--line)] font-ui">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="btn-ghost flex-1 !min-h-[48px]"
          >
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t.back}</span>
          </button>
          
          <button 
            type="button"
            onClick={handleStartGame} 
            className="btn-primary flex-[2] !min-h-[48px]"
          >
            <span>{t.start}</span>
            <Zap size={16} fill="currentColor" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PlayerNameScreen;
