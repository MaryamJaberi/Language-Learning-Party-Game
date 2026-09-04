import React, { useEffect } from 'react';
import { GameSettings, TeamColor } from '../types';
import { COLORS_MAP } from '../constants';
import { TRANSLATIONS } from '../translations';
import { tUI, tf, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { getRandomCharacters } from '../characters';
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
  onOpenHelp: () => void;
}

const PlayerNameScreen: React.FC<Props> = ({ settings, onSave, onStart, onBack, onOpenHelp }) => {
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);

  // Ensure default names are populated with cartoon characters if blank
  useEffect(() => {
    const hasAnyEmpty = settings.playerNames.slice(0, settings.playerCount).some(n => !n || n.trim().length === 0);
    if (hasAnyEmpty) {
      const defaults = getRandomCharacters(settings.nativeLanguage || settings.language || 'fa', 8);
      const updated = settings.playerNames.map((name, i) => name && name.trim().length > 0 ? name : defaults[i]);
      onSave({ ...settings, playerNames: updated });
    }
  }, [settings.playerCount, settings.language, settings.nativeLanguage]);

  const randomizeAllNames = () => {
    sound.playPowerUp();
    const newCharacters = getRandomCharacters(settings.nativeLanguage || settings.language || 'fa', 8);
    onSave({ ...settings, playerNames: newCharacters });
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

  const labelColorText = (color: TeamColor) => {
    return t.teamNames[color] || color;
  };

  const defaultsList = getRandomCharacters(settings.nativeLanguage || settings.language || 'fa', 8);

  const handleStartGame = () => {
    // Fill any remaining blanks with cartoon defaults
    const finalNames = settings.playerNames.map((n, i) => (n && n.trim().length > 0) ? n.trim() : defaultsList[i]);
    onSave({ ...settings, playerNames: finalNames });
    sound.playStartGame();
    onStart();
  };

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Stable Header */}
      <header className="shrink-0 mb-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white p-2.5 sm:p-3 border-[2.5px] border-[#0f172a] rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#f59e0b] border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shadow-[1px_1px_0px_0px_#0f172a]">
              <Users size={18} color="#0f172a" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider leading-tight">
                {t.playerNames}
              </h1>
              <span className="text-[10px] text-[#f59e0b] font-black block">
                {tf(settings.language, 'stepOf', { n: 4, total: 4 })} · {t.stepPlayers}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }} 
            className="px-2.5 py-1.5 bg-[#f59e0b] hover:bg-amber-400 text-[#0f172a] border-2 border-[#0f172a] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#0f172a] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
          >
            <HelpCircle size={14} color="#0f172a" />
            <span>{t.guide}</span>
          </button>
        </div>
      </header>

      {/* Quick Action & Cartoon Characters Banner */}
      <div className="shrink-0 mb-2 flex items-center justify-between gap-2 bg-white p-2 border-[2px] border-[#0f172a] rounded-xl shadow-[2px_2px_0px_0px_#0f172a]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={15} className="text-[#f59e0b] shrink-0" />
          <span className="text-[11px] font-bold text-[#0f172a] truncate">
            اسامی کارتونی پیش‌فرض انتخاب شده‌اند (نیازی به نوشتن نیست)
          </span>
        </div>
        <button
          type="button"
          onClick={randomizeAllNames}
          className="shrink-0 px-2.5 py-1 bg-[#10b981] hover:bg-emerald-600 active:scale-95 text-[#0f172a] border-2 border-[#0f172a] rounded-lg font-black text-[10.5px] shadow-[1.5px_1.5px_0px_0px_#0f172a] flex items-center gap-1 transition-all"
        >
          <Dices size={14} />
          <span>تغییر تصادفی 🎲</span>
        </button>
      </div>

      {/* Players Input Form */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 space-y-2 pb-2 overscroll-contain">
        {Array.from({ length: settings.playerCount }).map((_, i) => {
          const color = getTeamColor(i);
          const colorConfig = COLORS_MAP[color];
          const placeholderName = defaultsList[i] || `بازیکن ${i + 1}`;
          
          return (
            <div key={i} className="flex items-center gap-2.5 bg-white p-2.5 border-[2px] border-[#0f172a] rounded-2xl shadow-[2px_2px_0px_0px_#0f172a]">
              {/* Mascot & Number Badge */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <TeamMascot color={color} size={36} animate={false} />
                <div className={`mt-0.5 px-1.5 py-0.5 rounded-lg text-[8.5px] font-black border border-[#0f172a] ${colorConfig.bg} ${colorConfig.text} uppercase`}>
                  #{i + 1} {labelColorText(color)}
                </div>
              </div>

              {/* Name Input Box */}
              <div className="flex-1 min-w-0">
                <input 
                  type="text" 
                  maxLength={16}
                  placeholder={placeholderName}
                  value={settings.playerNames[i] || ''}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="w-full p-2 bg-[#f8fafc] border-[1.5px] border-[#0f172a] rounded-xl focus:bg-white focus:outline-none transition-all font-black text-xs text-[#0f172a]"
                />
              </div>

              {/* Single Slot Re-roll Button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  const singlePool = getRandomCharacters(settings.nativeLanguage || settings.language || 'fa', 16);
                  const randomPick = singlePool[Math.floor(Math.random() * singlePool.length)];
                  updateName(i, randomPick);
                }}
                title="تغییر این نام"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-[#0f172a] rounded-lg shrink-0"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Fixed Stable Navigation Footer */}
      <footer className="shrink-0 pt-2 border-t-2 border-[#0f172a]/20">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5"
          >
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t.back}</span>
          </button>
          
          <button 
            type="button"
            onClick={handleStartGame} 
            className="pixel-btn pixel-btn-lime flex-[2] py-2.5 text-sm font-black uppercase flex items-center justify-center gap-2"
          >
            <span>{t.start}</span>
            <Zap size={16} color="#0f172a" fill="#0f172a" />
          </button>
        </div>
      </footer>

    </div>
  );
};

export default PlayerNameScreen;
