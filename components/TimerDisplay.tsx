import React, { useEffect, useRef, useState } from 'react';
import { NeonClock } from './NeonIcons';
import { Team, Language } from '../types';
import { COLORS_MAP } from '../constants';
import { tUI, isRtlLang } from '../ui';

interface Props {
  ms?: number;
  roundTimer?: number;
  teams?: Team[];
  activeTeamId?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  colorClass?: string;
  language?: Language;
  isRTL?: boolean;
}

const TimerDisplay: React.FC<Props> = ({ 
  ms, 
  roundTimer, 
  teams, 
  activeTeamId, 
  label, 
  size = 'md', 
  active = false,
  language = 'fa',
  isRTL
}) => {
  const effectiveIsRTL = isRTL !== undefined ? isRTL : isRtlLang(language);
  const tStrings = tUI(language);

  // Track previous team scores to trigger temporary pulse/color-shift animation on score
  const prevScoresRef = useRef<Record<number, number>>({});
  const [scoringTeams, setScoringTeams] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!teams || teams.length === 0) return;
    const newlyScored: number[] = [];

    teams.forEach(team => {
      const currentScore = team.score || 0;
      const prevScore = prevScoresRef.current[team.id];
      if (prevScore !== undefined && currentScore > prevScore) {
        newlyScored.push(team.id);
      }
      prevScoresRef.current[team.id] = currentScore;
    });

    if (newlyScored.length > 0) {
      setScoringTeams(prev => {
        const next = { ...prev };
        newlyScored.forEach(id => { next[id] = true; });
        return next;
      });

      const timer = setTimeout(() => {
        setScoringTeams(prev => {
          const next = { ...prev };
          newlyScored.forEach(id => { delete next[id]; });
          return next;
        });
      }, 850);

      return () => clearTimeout(timer);
    }
  }, [teams]);

  const effectiveMs = Math.max(0, (roundTimer !== undefined ? roundTimer : (ms !== undefined ? ms : 0)));
  const seconds = Math.max(0, Math.floor(effectiveMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const centiseconds = Math.floor((effectiveMs % 1000) / 10);

  // Modern palette colors based on time status
  const isPanic = seconds <= 10;
  const digitColor = isPanic 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-[var(--ink)]';

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl'
  };

  const maxScore = teams && teams.length > 0
    ? Math.max(10, ...teams.map(t => (t.score || 0) + 2))
    : 10;

  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none font-ui">
      {/* Clock Capsule */}
      <div className={`flex flex-col items-center transition-all ${active ? 'scale-105' : 'opacity-100'}`}>
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-white bg-[var(--lapis)] px-2 py-0.5 rounded-lg font-bold mb-1 shadow-xs">
            {label}
          </span>
        )}

        <div className={`px-4 py-1.5 bg-[var(--panel)] border border-[var(--line)] rounded-2xl shadow-xs flex items-center justify-center gap-2 relative ${
          isPanic ? 'ring-2 ring-red-500 animate-pulse' : ''
        }`}>
          <NeonClock size={18} color={isPanic ? '#EF4444' : '#12B5A4'} />

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
          {/* Subtle Arcade Stage Indicator Dot */}
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--turq)] opacity-60 animate-ping hidden sm:inline-block" />
        </div>
      </div>

      {/* Team Progress & Time Remaining Bars (if teams prop is present) */}
      {teams && teams.length > 0 && (
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-1 font-ui">
          {teams.map(t => {
            const config = COLORS_MAP[t.color] || { bg: 'bg-[#1E9E93]', text: 'text-white', hex: '#1E9E93', name: String(t.color), faName: String(t.color) };
            const isActiveTeam = t.id === activeTeamId;
            const isScoring = Boolean(scoringTeams[t.id]);
            const tSec = Math.max(0, Math.floor(t.timeRemaining / 1000));
            const tMin = Math.floor(tSec / 60);
            const tRemSec = tSec % 60;
            const localizedTeamName = tStrings.teamNames?.[t.color] || (effectiveIsRTL ? config.faName : config.name);
            const scoreProgressPct = Math.min(100, Math.max(8, Math.round(((t.score || 0) / maxScore) * 100)));

            return (
              <div 
                key={t.id}
                data-testid={`team-progress-${t.color}`}
                className={`relative overflow-hidden px-2.5 pt-1.5 pb-2.5 rounded-xl border border-[var(--line)] flex items-center justify-between text-[11px] font-bold transition-all ${
                  isScoring ? 'animate-team-score' : ''
                } ${
                  t.isEliminated
                    ? 'bg-[var(--bg)] opacity-40 line-through text-[var(--mute)]'
                    : isActiveTeam 
                      ? 'bg-[var(--panel)] shadow-sm ring-2 ring-[var(--turq)] -translate-y-0.5' 
                      : 'bg-[var(--panel)] text-[var(--ink)] shadow-xs'
                }`}
                style={{ borderInlineStartWidth: '4px', borderInlineStartColor: config.hex }}
              >
                <div className="truncate flex items-center gap-1.5 relative z-10">
                  <span>{localizedTeamName}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors duration-300 ${
                    isScoring 
                      ? 'bg-[var(--turq)] text-white scale-110 shadow-xs' 
                      : 'bg-[var(--saffron)] text-[#15204A]'
                  }`}>
                    {t.score || 0}★
                  </span>
                </div>
                <span className="font-timer text-[11px] font-bold text-[var(--ink)] relative z-10" dir="ltr">
                  {tMin}:{tRemSec.toString().padStart(2, '0')}
                </span>

                {/* Bottom Team Score Progress Track */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--line)]/60 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${scoreProgressPct}%`,
                      backgroundColor: isScoring ? '#F5B52E' : config.hex
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;

