import React from 'react';
import { NeonClock } from './NeonIcons';
import { Team, TeamColor } from '../types';
import { COLORS_MAP } from '../constants';

interface Props {
  ms?: number;
  roundTimer?: number;
  teams?: Team[];
  activeTeamId?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  colorClass?: string;
}

const TimerDisplay: React.FC<Props> = ({ 
  ms, 
  roundTimer, 
  teams, 
  activeTeamId, 
  label, 
  size = 'md', 
  active = false 
}) => {
  const effectiveMs = Math.max(0, (roundTimer !== undefined ? roundTimer : (ms !== undefined ? ms : 0)));
  const seconds = Math.max(0, Math.floor(effectiveMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const centiseconds = Math.floor((effectiveMs % 1000) / 10);

  // Tabletop palette colors based on time status
  const isPanic = seconds <= 10;
  const digitColor = isPanic 
    ? 'text-[#E0603F]' 
    : 'text-[#1E1B2E]';

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl'
  };

  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none font-ui">
      {/* Clock Capsule */}
      <div className={`flex flex-col items-center transition-all ${active ? 'scale-105' : 'opacity-100'}`}>
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-white bg-[#E0603F] border-2 border-[#1E1B2E] px-2 py-0.5 rounded-[10px] font-bold mb-1 shadow-[2px_2px_0px_0px_#1E1B2E]">
            {label}
          </span>
        )}

        <div className={`px-4 py-1.5 bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[18px] shadow-[3px_3px_0px_0px_#1E1B2E] flex items-center justify-center gap-2 ${
          isPanic ? 'ring-2 ring-[#E0603F] animate-pulse' : ''
        }`}>
          <NeonClock size={18} color={isPanic ? '#E0603F' : '#1E9E93'} />

          <div className={`font-timer ${sizeClasses[size]} ${digitColor} tabular-nums flex items-baseline font-extrabold`} dir="ltr">
            <span>{minutes.toString().padStart(2, '0')}</span>
            <span className="mx-0.5 animate-pulse opacity-75">:</span>
            <span>{remainingSeconds.toString().padStart(2, '0')}</span>
            {size !== 'sm' && (
              <>
                <span className="mx-0.5 text-xs opacity-50">.</span>
                <span className="text-[11px] opacity-70 w-4 font-bold">{centiseconds.toString().padStart(2, '0')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Team Time Remaining Bars (if teams prop is present) */}
      {teams && teams.length > 0 && (
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-1 font-ui">
          {teams.map(t => {
            const config = COLORS_MAP[t.color] || { bg: 'bg-[#1E9E93]', text: 'text-white', hex: '#1E9E93' };
            const isActiveTeam = t.id === activeTeamId;
            const tSec = Math.max(0, Math.floor(t.timeRemaining / 1000));
            const tMin = Math.floor(tSec / 60);
            const tRemSec = tSec % 60;

            return (
              <div 
                key={t.id}
                className={`px-2 py-1 rounded-[12px] border-2 border-[#1E1B2E] flex items-center justify-between text-[11px] font-bold transition-all ${
                  t.isEliminated
                    ? 'bg-[#E6DFD5] opacity-50 line-through text-[#1E1B2E]/60'
                    : isActiveTeam 
                      ? 'bg-[#FFFBF4] shadow-[2px_2px_0px_0px_#1E1B2E] -translate-y-0.5 ring-2 ring-[#E0603F]' 
                      : 'bg-[#FFFBF4] text-[#1E1B2E]'
                }`}
                style={{ borderInlineStartWidth: '5px', borderInlineStartColor: config.hex }}
              >
                <div className="truncate flex items-center gap-1">
                  <span>{t.color}</span>
                  <span className="px-1.5 py-0.2 bg-[#F2B63D] text-[#1E1B2E] rounded-[6px] text-[10px] font-bold border border-[#1E1B2E]">
                    {t.score || 0}★
                  </span>
                </div>
                <span className="font-timer text-[11px] font-bold" dir="ltr">
                  {tMin}:{tRemSec.toString().padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;
