import React, { useState } from 'react';
import { GameSettings, Team, Player, TeamColor } from '../types';
import { COLORS_MAP, PLAYER_AVATARS } from '../constants';
import { tUI, isRtlLang, toPersianDigits } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import ExitConfirmModal from '../components/ExitConfirmModal';
import { 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Users, 
  Zap, 
  Sparkles, 
  LogOut, 
  Shuffle, 
  Edit3, 
  X, 
  Check 
} from 'lucide-react';

interface Props {
  settings: GameSettings;
  teams: Team[];
  players: Player[];
  onConfirm: () => void;
  onBack: () => void;
  onExitHome?: () => void;
  onExitSetup?: () => void;
  onUpdatePlayer?: (index: number, newName: string, newAvatar: string) => void;
  onRandomizePlayers?: () => void;
  onOpenHelp?: () => void;
}

const AVATAR_CHOICES = [
  '🦊', '🦁', '🐼', '🐨', '🐯', '🐰', '🐸', '🐵',
  '🦄', '🐙', '👾', '🤖', '🧙‍♂️', '🦸', '🥷', '👑',
  '🌟', '🐱', '🐶', '🦉', '🐬', '🦚', '🚀', '🔥'
];

export const SeatingConfirmScreen: React.FC<Props> = ({
  settings,
  teams,
  players,
  onConfirm,
  onBack,
  onExitHome,
  onExitSetup,
  onUpdatePlayer,
  onRandomizePlayers,
  onOpenHelp
}) => {
  const lang = settings?.language || 'fa';
  const t = tUI(lang);
  const isRTL = isRtlLang(lang);
  const radius = 98;
  const centerX = 140;
  const centerY = 140;
  const playerCount = settings?.playerCount || 4;
  const teamCount = Math.max(1, Math.floor(playerCount / 2));

  // Exit Confirmation Modal State
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Edit Player Modal State
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editAvatarSelected, setEditAvatarSelected] = useState('🦊');

  const openPlayerEditor = (idx: number) => {
    sound.playClick();
    const p = players[idx];
    if (!p) return;
    setEditingPlayerIndex(idx);
    setEditNameInput(p.name);
    setEditAvatarSelected(p.avatar || '🦊');
  };

  const handleSavePlayerEdit = () => {
    if (editingPlayerIndex === null) return;
    sound.playPowerUp();
    const trimmed = editNameInput.trim() || (isRTL ? `بازیکن ${editingPlayerIndex + 1}` : `Player ${editingPlayerIndex + 1}`);
    onUpdatePlayer?.(editingPlayerIndex, trimmed, editAvatarSelected);
    setEditingPlayerIndex(null);
  };

  return (
    <div 
      className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full max-h-[100dvh] min-h-0 flex-1 flex flex-col justify-between p-2.5 sm:p-3 select-none overflow-hidden font-ui bg-[var(--bg)] text-[var(--ink)]" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Header Bar with Exit and Help buttons */}
      <div className="flex items-center justify-between bg-[var(--panel)] text-[var(--ink)] p-2.5 sm:p-3 border border-[var(--line)] rounded-[20px] shadow-xs shrink-0 font-ui">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold font-display leading-tight text-[var(--ink)]">
              {t.tableSeatingTitle}
            </h2>
            <span className="text-[10.5px] text-[var(--mute)] font-bold block">
              {t.tapSeatToCustomize || (isRTL ? 'برای تغییر نام و آواتار روی صندلی بزنید' : 'Tap any seat to customize player')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Exit Game Button */}
          <button
            type="button"
            aria-label="Exit Game"
            title={isRTL ? 'خروج از بازی' : 'Exit Match'}
            onClick={() => {
              sound.playClick();
              setShowExitConfirm(true);
            }}
            className="w-10 h-10 rounded-full border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <LogOut size={16} className={isRTL ? 'rotate-180' : ''} />
          </button>

          {/* Guide / Help */}
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenHelp?.();
            }} 
            className="min-h-[40px] px-3 py-1.5 bg-[var(--lapis-soft)] hover:bg-[var(--lapis-soft)]/80 text-[var(--lapis)] font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle size={15} />
            <span className="hidden sm:inline">{t.guide}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Tip & Quick Re-roll Bar */}
      <div className="flex items-center justify-between gap-2 bg-[var(--panel)] px-3 py-2 border border-[var(--line)] rounded-xl shadow-xs text-xs shrink-0 my-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--mute)] truncate">
          <Sparkles size={13} className="text-[var(--saffron)] shrink-0" />
          <span className="truncate">{t.tableSeatingTip}</span>
        </div>

        {onRandomizePlayers && (
          <button
            type="button"
            onClick={() => {
              sound.playPowerUp();
              onRandomizePlayers();
            }}
            className="min-h-[38px] px-2.5 py-1.5 bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--ink)] border border-[var(--line)] rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title={t.randomize || (isRTL ? 'اسامی تصادفی 🎲' : 'Randomize 🎲')}
          >
            <Shuffle size={13} className="text-[var(--turq)]" />
            <span>{t.randomize || (isRTL ? 'اسامی تصادفی 🎲' : 'Randomize 🎲')}</span>
          </button>
        )}
      </div>

      {/* 3. Responsive Scaled Table Seating Circle SVG */}
      <div className="w-full max-w-[270px] sm:max-w-[290px] aspect-square mx-auto my-auto shrink-0 flex items-center justify-center p-1 bg-[var(--panel)] border border-[var(--line)] rounded-[26px] shadow-xs relative">
        <svg 
          viewBox="0 0 280 280" 
          className="w-full h-full max-h-[35vh] mx-auto select-none"
        >
          {/* Table Center Base */}
          <circle cx={centerX} cy={centerY} r="42" fill="var(--bg)" stroke="var(--line)" strokeWidth="2.5" />
          <circle cx={centerX} cy={centerY} r="32" fill="var(--lapis-soft)" />
          <text 
            x={centerX} 
            y={centerY - 2} 
            textAnchor="middle" 
            dominantBaseline="central" 
            fontSize="18"
            className="select-none pointer-events-none"
          >
            🎲
          </text>
          <text 
            x={centerX} 
            y={centerY + 16} 
            textAnchor="middle" 
            fill="var(--lapis)" 
            className="text-[9.5px] font-black uppercase tracking-widest font-mono select-none pointer-events-none"
          >
            {t.tableCenter || (isRTL ? 'میز بازی' : 'TABLE')}
          </text>

          {/* Dotted Seating Circle Path */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={radius} 
            fill="none" 
            stroke="var(--line)" 
            strokeWidth="2" 
            strokeDasharray="5,5" 
            className="opacity-75"
          />

          {/* Partner Cross Lines */}
          {Array.from({ length: teamCount }).map((_, i) => {
            const angle1 = (i * 360 / settings.playerCount - 90) * (Math.PI / 180);
            const angle2 = ((i + teamCount) * 360 / settings.playerCount - 90) * (Math.PI / 180);
            const x1 = centerX + radius * Math.cos(angle1);
            const y1 = centerY + radius * Math.sin(angle1);
            const x2 = centerX + radius * Math.cos(angle2);
            const y2 = centerY + radius * Math.sin(angle2);
            const team = teams[i];
            const colorConfig = team ? COLORS_MAP[team.color] : { hex: '#12B5A4' };

            return (
              <line 
                key={`line-${i}`} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke={colorConfig.hex} 
                strokeWidth="2.5" 
                strokeDasharray="4,4"
                className="opacity-40"
              />
            );
          })}

          {/* Player Seats with Real Avatars & Full Clean Names */}
          {players.map((p, i) => {
            const angle = (i * 360 / players.length - 90) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const config = COLORS_MAP[p.teamColor] || { hex: '#12B5A4' };
            const playerAvatar = p.avatar || PLAYER_AVATARS[i % PLAYER_AVATARS.length] || '🦊';

            return (
              <g 
                key={`seat-${p.id}`} 
                data-testid={`player-seat-${i}`}
                role="button"
                tabIndex={0}
                aria-label={isRTL ? `ویرایش ${p.name}` : `Edit ${p.name}`}
                className="cursor-pointer group"
                onClick={() => openPlayerEditor(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    openPlayerEditor(i);
                  }
                }}
              >
                {/* Team-colored outer halo on hover */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="25" 
                  fill="none" 
                  stroke={config.hex} 
                  strokeWidth="2" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />

                {/* Team Seat Circle */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="21" 
                  fill="var(--panel)" 
                  stroke={config.hex} 
                  strokeWidth="3.5" 
                  className="transition-transform group-hover:scale-105 shadow-sm"
                />

                {/* Real Player Avatar Emoji */}
                <text 
                  x={x} 
                  y={y + 1} 
                  textAnchor="middle" 
                  dominantBaseline="central" 
                  fontSize="19"
                  className="select-none pointer-events-none"
                >
                  {playerAvatar}
                </text>

                {/* Full Clean Player Name Below */}
                <text 
                  x={x} 
                  y={y + (angle > 0 && angle < Math.PI ? 28 : 28)} 
                  textAnchor="middle" 
                  className="text-[10px] font-black fill-[var(--ink)] select-none pointer-events-none"
                  style={{ fontFamily: 'Vazirmatn, sans-serif' }}
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Small subtle tap-to-edit hint indicator */}
        <div className="absolute bottom-2 right-2 text-[10px] font-bold text-[var(--mute)] flex items-center gap-1 opacity-70">
          <Edit3 size={11} />
          <span>{t.tapToEdit || (isRTL ? 'ویرایش ✎' : 'Tap to edit')}</span>
        </div>
      </div>

      {/* 4. Teams Roster Cards with Mascots & Avatars */}
      <div className="grid grid-cols-2 gap-1.5 shrink-0 my-1 font-ui">
        {teams.map(team => {
          const config = COLORS_MAP[team.color];
          const teamPlayers = players.filter(p => p.teamId === team.id);
          return (
            <div 
              key={team.id}
              className="bg-[var(--panel)] p-2 rounded-xl border border-[var(--line)] flex items-center gap-2 shadow-2xs"
              style={{ borderInlineStartWidth: '4px', borderInlineStartColor: config.hex }}
            >
              <TeamMascot color={team.color} size={22} animate={false} />
              <div className="min-w-0 flex-1">
                <div className="text-[9.5px] font-black text-[var(--mute)] uppercase truncate">
                  {t.teamNames[team.color]}
                </div>
                <div className="text-[11px] font-bold text-[var(--ink)] truncate flex items-center gap-1.5">
                  {teamPlayers.map((p, idx) => (
                    <span key={p.id} className="inline-flex items-center gap-0.5 truncate">
                      <span className="text-xs">{p.avatar || '🦊'}</span>
                      <span className="truncate">{p.name}</span>
                      {idx < teamPlayers.length - 1 && <span className="text-[var(--mute)]">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Bottom Navigation Buttons */}
      <div className="flex gap-2.5 pt-2 shrink-0 border-t border-[var(--line)] font-ui">
        <button 
          type="button"
          onClick={() => {
            sound.playClick();
            if (onExitSetup) onExitSetup();
            else onBack();
          }} 
          className="flex-1 min-h-[48px] py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          <span>{t.back}</span>
        </button>
        <button 
          type="button"
          onClick={() => {
            sound.playStartGame();
            onConfirm();
          }} 
          className="flex-[2] min-h-[48px] py-2.5 sm:py-3 text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <span>{t.seatedStart || `${t.start} ${t.round} 1`}</span>
          <Zap size={18} fill="currentColor" />
        </button>
      </div>

      {/* QUICK PLAYER EDIT MODAL */}
      {editingPlayerIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-ui"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setEditingPlayerIndex(null)}
        >
          <div 
            className="w-full max-w-xs sm:max-w-sm bg-[var(--panel)] border-2 border-[var(--line)] rounded-[26px] p-5 shadow-2xl text-[var(--ink)] space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editAvatarSelected}</span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[var(--ink)]">
                    {isRTL ? `ویرایش بازیکن ${toPersianDigits(editingPlayerIndex + 1)}` : `Edit Player ${editingPlayerIndex + 1}`}
                  </h3>
                  <span className="text-[10.5px] font-bold text-[var(--mute)]">
                    {isRTL ? 'انتخاب نام و آواتار دلخواه' : 'Change name and avatar'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlayerIndex(null)}
                className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-[var(--line)] flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--mute)] block">
                {isRTL ? 'نام بازیکن:' : 'Player Name:'}
              </label>
              <input 
                type="text"
                value={editNameInput}
                onChange={e => setEditNameInput(e.target.value)}
                maxLength={16}
                className="w-full py-2 px-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs sm:text-sm font-black text-[var(--ink)] outline-none focus:border-[var(--lapis)]"
                placeholder={isRTL ? 'نام بازیکن' : 'Name'}
                autoFocus
              />
            </div>

            {/* Avatar Selector Grid */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--mute)] block">
                {isRTL ? 'انتخاب آواتار:' : 'Choose Avatar:'}
              </label>
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[var(--bg)] rounded-xl border border-[var(--line)]">
                {AVATAR_CHOICES.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setEditAvatarSelected(em);
                    }}
                    className={`h-9 rounded-lg flex items-center justify-center text-lg transition-transform cursor-pointer ${
                      editAvatarSelected === em
                        ? 'bg-[var(--lapis)] text-white scale-110 shadow-xs'
                        : 'hover:bg-[var(--panel)]'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingPlayerIndex(null)}
                className="flex-1 min-h-[44px] py-2 rounded-xl border border-[var(--line)] text-xs font-bold hover:bg-[var(--bg)] cursor-pointer"
              >
                {t.cancel || (isRTL ? 'انصراف' : 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSavePlayerEdit}
                className="flex-1 min-h-[44px] py-2 rounded-xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                <span>{t.saveChanges || (isRTL ? 'ذخیره تغییرات' : 'Save')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <ExitConfirmModal
          isRTL={isRTL}
          onCancel={() => setShowExitConfirm(false)}
          onExitHome={() => {
            setShowExitConfirm(false);
            if (onExitHome) onExitHome();
            else onBack();
          }}
          onExitSetup={() => {
            setShowExitConfirm(false);
            if (onExitSetup) onExitSetup();
            else onBack();
          }}
        />
      )}
    </div>
  );
};

export default SeatingConfirmScreen;
