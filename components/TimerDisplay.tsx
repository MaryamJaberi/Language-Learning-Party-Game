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

  // Pick vibrant pixel colors based on warnings
  const isPanic = seconds <= 10;
  const digitColor = isPanic 
    ? 'text-[#FF1058] drop-shadow-[0_0_8px_#FF1058]' 
    : (active ? 'text-[#39FF14] drop-shadow-[0_0_8px_#39FF14]' : 'text-[#00F0FF] drop-shadow-[0_0_8px_#00F0FF]');

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl'
  };

  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none">
      {/* Clock Capsule */}
      <div className={`flex flex-col items-center transition-all ${active ? 'scale-105' : 'opacity-95'}`}>
        {label && (
          <span className="text-[9.5px] uppercase tracking-wider text-[#160430] bg-[#FFE600] border border-[#160430] px-2 py-0.5 rounded font-black mb-1 shadow-[1px_1px_0px_0px_#160430]">
            {label}
          </span>
        )}

        <div className="px-3 py-1 bg-[#160430] border-2 border-[#241442] rounded-2xl shadow-[2px_2px_0px_0px_#160430] flex items-center justify-center gap-2">
          <NeonClock size={16} color={isPanic ? '#FF1058' : '#FFE600'} />

          <div className={`font-pixel ${sizeClasses[size]} ${digitColor} tabular-nums flex items-baseline`} dir="ltr">
            <span>{minutes.toString().padStart(2, '0')}</span>
            <span className="mx-0.5 animate-pulse opacity-85">:</span>
            <span>{remainingSeconds.toString().padStart(2, '0')}</span>
            {size !== 'sm' && (
              <>
                <span className="mx-0.5 text-xs opacity-65">.</span>
                <span className="text-[11px] opacity-80 w-4">{centiseconds.toString().padStart(2, '0')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Team Time Remaining Bars (if teams prop is present) */}
      {teams && teams.length > 0 && (
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-1">
          {teams.map(t => {
            const config = COLORS_MAP[t.color] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };
            const isActiveTeam = t.id === activeTeamId;
            const tSec = Math.max(0, Math.floor(t.timeRemaining / 1000));
            const tMin = Math.floor(tSec / 60);
            const tRemSec = tSec % 60;

            return (
              <div 
                key={t.id}
                className={`px-2 py-1 rounded-xl border-2 border-[#241442] flex items-center justify-between text-[11px] font-black transition-all ${
                  t.isEliminated || t.timeRemaining <= 0
                    ? 'bg-slate-200 opacity-60 line-through text-slate-500'
                    : isActiveTeam 
                      ? 'bg-white shadow-[2px_2px_0px_0px_#241442] -translate-y-0.5 ring-2 ring-[#FFE600]' 
                      : 'bg-white/90 text-[#1a0833]'
                }`}
                style={{ borderLeftWidth: '5px', borderLeftColor: config.hex }}
              >
                <span className="truncate max-w-[55px]">{t.color}</span>
                <span className="font-mono text-[10px]" dir="ltr">
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
