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
    <div className="h-full min-h-0 flex-1 flex flex-col p-3.5 sm:p-4 select-none overflow-hidden font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2 bg-[#FFFBF4] text-[#1E1B2E] p-3 border-2 border-[#1E1B2E] rounded-[20px] shadow-[3px_3px_0px_0px_#1E1B2E] shrink-0 font-ui">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[12px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]">
            <Users size={16} color="#1E1B2E" />
          </div>
          <h2 className="text-base sm:text-lg font-bold font-display leading-tight text-[#1E1B2E]">
            {settings.language === 'fa' ? 'چیدمان دور میز' : 'Table Seating Guide'}
          </h2>
        </div>
        <button 
          onClick={() => {
            sound.playClick();
            onOpenHelp?.();
          }} 
          className="px-3 py-1.5 bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] font-bold text-xs rounded-[14px] shadow-[2px_2px_0px_0px_#1E1B2E] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
        >
          <HelpCircle size={15} color="#1E1B2E" />
          <span>{t.guide}</span>
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-2 space-y-2 overscroll-contain flex flex-col justify-between font-ui">
        
        {/* Seating Tip */}
        <div className="text-[11px] font-bold text-[#1E1B2E] bg-[#FFFBF4] p-2.5 border-2 border-[#1E1B2E] rounded-[16px] text-center shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-1.5 shrink-0">
          <Sparkles size={14} color="#1E9E93" />
          <span>
            {settings.language === 'fa' 
              ? '🎯 هم‌تیمی‌ها روبروی هم می‌نشینند! چرخش نوبت ساعت‌گرد است.' 
              : '🎯 Teammates sit directly opposite each other! Rotation is clockwise.'}
          </span>
        </div>

        {/* Interactive Seating Circle SVG */}
        <div className="relative w-52 h-52 sm:w-64 sm:h-64 mx-auto select-none bg-[#FFFBF4] p-2 border-2 border-[#1E1B2E] rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B2E] my-auto flex items-center justify-center shrink-0">
          <svg viewBox="0 0 270 270" className="w-full h-full mx-auto">
            {/* Table Center */}
            <circle cx={centerX} cy={centerY} r="42" fill="#1E1B2E" stroke="#E0603F" strokeWidth="2.5" />
            <circle cx={centerX} cy={centerY} r="36" fill="#2E2844" />
            <text 
              x={centerX} 
              y={centerY + 4} 
              textAnchor="middle" 
              fill="#F2B63D" 
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
            >
              TABLE
            </text>

            {/* Dotted Seating Circle */}
            <circle 
              cx={centerX} 
              cy={centerY} 
              r={radius} 
              fill="none" 
              stroke="#1E1B2E" 
              strokeWidth="2.5" 
              strokeDasharray="6,6" 
              className="opacity-30"
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
              const colorConfig = team ? COLORS_MAP[team.color] : { hex: '#1E9E93' };

              return (
                <line 
                  key={i} 
                  x1={x1} 
                  y1={y1} 
                  x2={x2} 
                  y2={y2} 
                  stroke={colorConfig.hex} 
                  strokeWidth="2.5" 
                  strokeDasharray="4,4"
                  className="opacity-80"
                />
              );
            })}

            {/* Player Seats */}
            {players.map((p, i) => {
              const angle = (i * 360 / players.length - 90) * (Math.PI / 180);
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              const config = COLORS_MAP[p.teamColor] || { hex: '#1E9E93' };

              return (
                <g key={p.id}>
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="22" 
                    fill={config.hex} 
                    stroke="#1E1B2E" 
                    strokeWidth="2.5" 
                  />
                  <text 
                    x={x} 
                    y={y - 2} 
                    textAnchor="middle" 
                    fill="#1E1B2E" 
                    className="text-[10px] font-bold"
                  >
                    P{i + 1}
                  </text>
                  <text 
                    x={x} 
                    y={y + 11} 
                    textAnchor="middle" 
                    fill="#1E1B2E" 
                    className="text-[9px] font-bold"
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
                className="bg-[#FFFBF4] p-2 rounded-[14px] border-2 border-[#1E1B2E] flex items-center gap-2 shadow-[2px_2px_0px_0px_#1E1B2E]"
                style={{ borderLeftWidth: '5px', borderLeftColor: config.hex }}
              >
                <TeamMascot color={team.color} size={24} animate={false} />
                <div className="min-w-0 flex-1">
                  <div className="text-[9.5px] font-bold text-[#1E1B2E]/70 uppercase truncate">
                    {t.teamNames[team.color]}
                  </div>
                  <div className="text-[11px] font-bold text-[#1E1B2E] truncate">
                    {teamPlayers.map(p => p.name).join(' • ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2 shrink-0 border-t-2 border-[#1E1B2E]/20 font-ui">
        <button 
          onClick={() => {
            sound.playClick();
            onBack();
          }} 
          className="pixel-btn pixel-btn-mustard flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-[18px]"
        >
          {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          <span>{t.back}</span>
        </button>
        <button 
          onClick={() => {
            sound.playStartGame();
            onConfirm();
          }} 
          className="pixel-btn pixel-btn-teal flex-[2] py-3 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[18px]"
        >
          <span>{settings.language === 'fa' ? 'شروع دور ۱' : 'Start Round 1'}</span>
          <Zap size={18} />
        </button>
      </div>
    </div>
  );
};

export default SeatingConfirmScreen;
