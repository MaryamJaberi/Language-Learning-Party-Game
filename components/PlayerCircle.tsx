import React from 'react';
import { Player, Team, TeamColor } from '../types';
import { COLORS_MAP } from '../constants';

interface Props {
  players: Player[];
  activeIndex?: number;
  activePlayerIndex?: number;
  eliminatedTeamIds?: number[];
  teams?: Team[];
  compact?: boolean;
}

const PlayerCircle: React.FC<Props> = ({ 
  players = [], 
  activeIndex, 
  activePlayerIndex, 
  eliminatedTeamIds, 
  teams,
  compact = false
}) => {
  const radius = compact ? 70 : 88;
  const centerX = 115;
  const centerY = 115;

  const currentActive = activePlayerIndex !== undefined 
    ? activePlayerIndex 
    : (activeIndex !== undefined ? activeIndex : 0);

  const safeEliminated = eliminatedTeamIds || (teams ? teams.filter(t => t.isEliminated || t.timeRemaining <= 0).map(t => t.id) : []);

  if (!players || players.length === 0) return null;

  return (
    <div className={`relative mx-auto select-none bg-[var(--panel)] border border-[var(--line)] rounded-2xl shadow-sm transition-all flex items-center justify-center ${
      compact ? 'w-44 h-44 p-1' : 'w-52 h-52 sm:w-60 sm:h-60 p-1.5'
    }`}>
      <svg 
        viewBox="0 0 230 230" 
        className="w-full h-full"
      >
        {/* Subtle radial ring */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={radius} 
          fill="none" 
          stroke="var(--line)" 
          strokeWidth="2" 
          strokeDasharray="4,5" 
          className="opacity-60"
        />
        
        {/* Circle Centers */}
        {players.map((p, i) => {
          const angle = (i * 360 / players.length - 90) * (Math.PI / 180);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const isActive = i === currentActive;
          const isEliminated = Array.isArray(safeEliminated) && safeEliminated.includes(p.teamId);
          const config = COLORS_MAP[p.teamColor] || { bg: 'bg-slate-500', hex: '#2347C5' };
          const playerAvatar = p.avatar || '🦊';

          return (
            <g key={p.id} className="transition-all duration-300">
              
              {/* Pulsing glow in team color for active turn */}
              {isActive && (
                <circle 
                  cx={x} cy={y} 
                  r={28} 
                  fill="none" 
                  stroke={config.hex} 
                  strokeWidth="3" 
                  className="animate-ping opacity-40"
                />
              )}

              {/* Main character head circle with team color ring */}
              <circle 
                cx={x} cy={y} 
                r={isActive ? 22 : 17} 
                fill={isEliminated ? '#cbd5e1' : 'var(--panel, #ffffff)'} 
                stroke={isEliminated ? '#94a3b8' : config.hex}
                strokeWidth={isActive ? '4' : '3.5'}
                className="transition-all"
              />

              {/* Player Unique Avatar inside the team ring */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isActive ? 18 : 14}
                className="select-none pointer-events-none"
              >
                {isEliminated ? '😵' : playerAvatar}
              </text>

              {/* Player Label Name below the avatar */}
              <text 
                x={x} y={y + (isActive ? 32 : 24)} 
                textAnchor="middle" 
                className={`text-[10px] font-bold ${
                  isActive 
                  ? 'fill-[var(--ink)]' 
                  : 'fill-[var(--mute)]'
                }`}
                style={{ fontFamily: 'Vazirmatn, sans-serif' }}
              >
                {p.name.slice(0, 9)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Decorative center icon inside the circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-8 h-8 bg-[var(--bg)] border border-[var(--line)] rounded-full flex items-center justify-center shadow-xs">
          <span className="text-xs">🔄</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCircle;
