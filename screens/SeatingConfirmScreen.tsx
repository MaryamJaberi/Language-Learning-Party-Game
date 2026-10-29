import React, { useState } from 'react';
import { GameSettings, Team, Player, TeamColor } from '../types';
import { COLORS_MAP, PLAYER_AVATARS } from '../constants';
import { tUI, isRtlLang, toPersianDigits } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import ExitConfirmModal from '../components/ExitConfirmModal';
import { 
  BookOpen, 
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
  const radius = 84;
  const centerX = 160;
  const centerY = 150;
  const playerCount = settings?.playerCount || 4;
  const teamCount = Math.max(1, Math.floor(playerCount / 2));

  // Exit Confirmation Modal State
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Edit Player Modal State (Name only, no avatars)
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editNameInput, setEditNameInput] = useState('');

  const openPlayerEditor = (idx: number) => {
    sound.playClick();
    const p = players[idx];
    if (!p) return;
    setEditingPlayerIndex(idx);
    setEditNameInput(p.name);
  };

  const handleSavePlayerEdit = () => {
    if (editingPlayerIndex === null) return;
    sound.playPowerUp();
    const trimmed = editNameInput.trim() || (isRTL ? `بازیکن ${editingPlayerIndex + 1}` : `Player ${editingPlayerIndex + 1}`);
    onUpdatePlayer?.(editingPlayerIndex, trimmed, '');
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
          <div className="w-9 h-9 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold font-display leading-tight text-[var(--ink)]">
              {t.tableSeatingTitle}
            </h2>
            <span className="text-[11px] text-[var(--mute)] font-bold block">
              {isRTL ? 'برای تغییر نام بازیکن روی صندلی بزنید' : 'Tap any seat to edit player name'}
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
            <BookOpen size={15} />
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
            title={t.randomize || (isRTL ? 'اسامی تصادفی' : 'Randomize')}
          >
            <Shuffle size={13} className="text-[var(--turq)]" />
            <span>{t.randomize || (isRTL ? 'اسامی تصادفی' : 'Randomize')}</span>
          </button>
        )}
      </div>

      {/* 3. Clean High-Legibility Table Seating Diagram (No Avatars) */}
      <div className="w-full max-w-[320px] sm:max-w-[340px] aspect-[16/15] mx-auto my-auto shrink-0 flex items-center justify-center p-2 bg-[var(--panel)] border border-[var(--line)] rounded-[26px] shadow-xs relative">
        <svg 
          viewBox="0 0 320 300" 
          className="w-full h-full max-h-[36vh] mx-auto select-none"
        >
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

          {/* Partner Cross Lines (drawn underneath the center table) */}
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
                className="opacity-45"
              />
            );
          })}

          {/* Table Center Base (solid cover over partner cross lines) */}
          <circle cx={centerX} cy={centerY} r="38" fill="var(--panel)" stroke="var(--line)" strokeWidth="2.5" />
          <circle cx={centerX} cy={centerY} r="28" fill="var(--lapis-soft)" />
          <text 
            x={centerX} 
            y={centerY} 
            textAnchor="middle" 
            dominantBaseline="central"
            fill="var(--lapis)" 
            className="text-[10px] font-black uppercase tracking-widest select-none pointer-events-none"
          >
            {t.tableCenter || (isRTL ? 'میز بازی' : 'TABLE')}
          </text>

          {/* Player Seats with Number Badges & High-Contrast Name Pills */}
          {players.map((p, i) => {
            const deg = (i * 360 / players.length - 90);
            const angle = deg * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const config = COLORS_MAP[p.teamColor] || { hex: '#2347C5' };
            const isTopHalf = Math.sin(angle) < -0.15;
            const labelY = isTopHalf ? y - 30 : y + 32;
            const pillW = Math.max(64, Math.min(104, p.name.length * 7.5 + 22));

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
                {/* Seat Circle with Team Color Fill */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="19" 
                  fill={config.hex} 
                  stroke="var(--panel)" 
                  strokeWidth="3" 
                  className="transition-transform group-hover:scale-105 shadow-sm"
                />

                {/* Seat Number (#1, #2, ...) */}
                <text 
                  x={x} 
                  y={y + 1} 
                  textAnchor="middle" 
                  dominantBaseline="central" 
                  fill="#ffffff"
                  className="text-xs font-black select-none pointer-events-none"
                >
                  #{isRTL ? toPersianDigits(i + 1) : i + 1}
                </text>

                {/* High-Contrast Name Pill Background */}
                <rect
                  x={x - pillW / 2}
                  y={labelY - 11}
                  width={pillW}
                  height="22"
                  rx="8"
                  fill="var(--panel)"
                  stroke={config.hex}
                  strokeWidth="1.5"
                />

                {/* Full Clean Player Name */}
                <text 
                  x={x} 
                  y={labelY + 1} 
                  textAnchor="middle" 
                  dominantBaseline="central"
                  className="text-[11.5px] font-black fill-[var(--ink)] select-none pointer-events-none"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Small subtle tap-to-edit hint indicator */}
        <div className="absolute bottom-2 right-2.5 text-[10px] font-bold text-[var(--mute)] flex items-center gap-1 opacity-80">
          <Edit3 size={11} />
          <span>{(t.tapToEdit || (isRTL ? 'ویرایش نام' : 'Tap to edit')).replace(/✏️/g, '').trim()}</span>
        </div>
      </div>

      {/* 4. Teams Roster Cards (Clean Names Without Avatars) */}
      <div className="grid grid-cols-2 gap-2 shrink-0 my-1 font-ui">
        {teams.map(team => {
          const config = COLORS_MAP[team.color];
          const teamPlayers = players.filter(p => p.teamId === team.id);
          return (
            <div 
              key={team.id}
              className="bg-[var(--panel)] p-2.5 rounded-xl border border-[var(--line)] flex items-center gap-2.5 shadow-2xs"
              style={{ borderInlineStartWidth: '4px', borderInlineStartColor: config.hex }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: config.hex }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black text-[var(--mute)] uppercase truncate">
                  {t.teamNames[team.color]}
                </div>
                <div className="text-xs font-extrabold text-[var(--ink)] truncate flex items-center gap-1.5 mt-0.5">
                  {teamPlayers.map((p, idx) => (
                    <span key={p.id} className="inline-flex items-center gap-1 truncate">
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
          className="btn-ghost flex-1 !min-h-[48px] text-xs sm:text-sm font-black"
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
          className="btn-primary flex-[2] !min-h-[48px] text-sm sm:text-base font-black shadow-md"
        >
          <span>{t.seatedStart || `${t.start} ${t.round} 1`}</span>
          <Zap size={18} fill="currentColor" />
        </button>
      </div>

      {/* QUICK PLAYER EDIT MODAL (Name Only) */}
      {editingPlayerIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-ui"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setEditingPlayerIndex(null)}
        >
          <div 
            className="w-full max-w-xs sm:max-w-sm bg-[var(--panel)] border-2 border-[var(--line)] rounded-[24px] p-5 shadow-2xl text-[var(--ink)] space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[var(--ink)]">
                  {isRTL ? `ویرایش نام بازیکن ${toPersianDigits(editingPlayerIndex + 1)}` : `Edit Player ${editingPlayerIndex + 1}`}
                </h3>
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--mute)] block">
                {isRTL ? 'نام بازیکن:' : 'Player Name:'}
              </label>
              <input 
                type="text"
                value={editNameInput}
                onChange={e => setEditNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSavePlayerEdit();
                }}
                maxLength={16}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-sm font-black text-[var(--ink)] outline-none focus:border-[var(--lapis)]"
                placeholder={isRTL ? 'نام بازیکن' : 'Name'}
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingPlayerIndex(null)}
                className="btn-ghost flex-1 !min-h-[44px]"
              >
                {t.cancel || (isRTL ? 'انصراف' : 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSavePlayerEdit}
                className="btn-primary flex-1 !min-h-[44px]"
              >
                <Check size={15} />
                <span>{t.saveChanges || (isRTL ? 'ذخیره' : 'Save')}</span>
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
          onOpenHelp={onOpenHelp ? () => {
            setShowExitConfirm(false);
            onOpenHelp();
          } : undefined}
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
