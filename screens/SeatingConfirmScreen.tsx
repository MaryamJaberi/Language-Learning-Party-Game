import React from 'react';
import { GameSettings, Team, Player, TeamColor } from '../types';
import { COLORS_MAP } from '../constants';
import { TRANSLATIONS } from '../translations';
import { tUI, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { HelpCircle, ArrowRight, ArrowLeft, Users, Zap, Sparkles } from 'lucide-react';

interface Props {
  settings: GameSettings;
  teams: Team[];
  players: Player[];
  onConfirm: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
}

const SeatingConfirmScreen: React.FC<Props> = ({
  settings,
  teams,
  players,
  onConfirm,
  onBack,
  onOpenHelp
}) => {
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);
  const radius = 100;
  const centerX = 135;
  const centerY = 135;
  const teamCount = settings.playerCount / 2;

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col p-3 sm:p-4 select-none overflow-hidden font-ui bg-[var(--bg)] text-[var(--ink)]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2 bg-[var(--panel)] text-[var(--ink)] p-3 border border-[var(--line)] rounded-[20px] shadow-xs shrink-0 font-ui">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center">
            <Users size={16} />
          </div>
          <h2 className="text-base sm:text-lg font-bold font-display leading-tight text-[var(--ink)]">
            {t.tableSeatingTitle}
          </h2>
        </div>
        <button 
          onClick={() => {
            sound.playClick();
            onOpenHelp?.();
          }} 
          className="px-3 py-1.5 bg-[var(--lapis-soft)] hover:bg-[var(--lapis-soft)]/80 text-[var(--lapis)] font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <HelpCircle size={15} />
          <span>{t.guide}</span>
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-2 space-y-2 overscroll-contain flex flex-col justify-between font-ui">
        
        {/* Seating Tip */}
        <div className="text-[11px] font-bold text-[var(--mute)] bg-[var(--panel)] p-2.5 border border-[var(--line)] rounded-2xl text-center shadow-xs flex items-center justify-center gap-1.5 shrink-0">
          <Sparkles size={14} className="text-[var(--saffron)]" />
          <span>
            {t.tableSeatingTip}
          </span>
        </div>

        {/* Interactive Seating Circle SVG */}
        <div className="relative w-52 h-52 sm:w-64 sm:h-64 mx-auto select-none bg-[var(--panel)] p-2 border border-[var(--line)] rounded-[24px] shadow-xs my-auto flex items-center justify-center shrink-0">
          <svg viewBox="0 0 270 270" className="w-full h-full mx-auto">
            {/* Table Center */}
            <circle cx={centerX} cy={centerY} r="42" fill="var(--bg)" stroke="var(--line)" strokeWidth="2.5" />
            <circle cx={centerX} cy={centerY} r="34" fill="var(--lapis-soft)" />
            <text 
              x={centerX} 
              y={centerY + 4} 
              textAnchor="middle" 
              fill="var(--lapis)" 
              className="text-[11px] font-black uppercase tracking-widest font-mono"
            >
              TABLE
            </text>

            {/* Dotted Seating Circle */}
            <circle 
              cx={centerX} 
              cy={centerY} 
              r={radius} 
              fill="none" 
              stroke="var(--line)" 
              strokeWidth="2" 
              strokeDasharray="6,6" 
            />

            {/* Opposite Partner Lines */}
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
                  key={i} 
                  x1={x1} 
                  y1={y1} 
                  x2={x2} 
                  y2={y2} 
                  stroke={colorConfig.hex} 
                  strokeWidth="2" 
                  strokeDasharray="4,4"
                  className="opacity-70"
                />
              );
            })}

            {/* Player Seats */}
            {players.map((p, i) => {
              const angle = (i * 360 / players.length - 90) * (Math.PI / 180);
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              const config = COLORS_MAP[p.teamColor] || { hex: '#12B5A4' };

              return (
                <g key={p.id}>
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="22" 
                    fill={config.hex} 
                    stroke="var(--panel)" 
                    strokeWidth="2.5" 
                  />
                  <text 
                    x={x} 
                    y={y - 2} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="text-[10px] font-bold"
                  >
                    P{i + 1}
                  </text>
                  <text 
                    x={x} 
                    y={y + 11} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="text-[9px] font-extrabold"
                  >
                    {p.name.slice(0, 7)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Teams Roster Bar */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {teams.map(team => {
            const config = COLORS_MAP[team.color];
            const teamPlayers = players.filter(p => p.teamId === team.id);
            return (
              <div 
                key={team.id}
                className="bg-[var(--panel)] p-2 rounded-xl border border-[var(--line)] flex items-center gap-2 shadow-xs"
                style={{ borderInlineStartWidth: '4px', borderInlineStartColor: config.hex }}
              >
                <TeamMascot color={team.color} size={24} animate={false} />
                <div className="min-w-0 flex-1">
                  <div className="text-[9.5px] font-bold text-[var(--mute)] uppercase truncate">
                    {t.teamNames[team.color]}
                  </div>
                  <div className="text-[11px] font-bold text-[var(--ink)] truncate">
                    {teamPlayers.map(p => p.name).join(' • ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Buttons */}
      <div className="flex gap-2.5 pt-2 shrink-0 border-t border-[var(--line)] font-ui">
        <button 
          onClick={() => {
            sound.playClick();
            onBack();
          }} 
          className="flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          <span>{t.back}</span>
        </button>
        <button 
          onClick={() => {
            sound.playStartGame();
            onConfirm();
          }} 
          className="flex-[2] py-3 text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <span>{t.seatedStart || `${t.start} ${t.round} 1`}</span>
          <Zap size={18} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default SeatingConfirmScreen;
