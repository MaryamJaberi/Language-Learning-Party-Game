import React, { useEffect, useState } from 'react';
import { feedbackDirector, FloatingScoreEvent, ParticleParticle, FantasyToast } from '../feedbackDirector';

export const FeedbackOverlay: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to director updates
    const unsubscribe = feedbackDirector.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const scores = feedbackDirector.activeScores;
  const particles = feedbackDirector.activeParticles;
  const toasts = feedbackDirector.activeToasts;

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* LAYER 3: Non-Intrusive Fantasy Board Toasts (Top Center / Corner) */}
      <aside 
        aria-label="اعلان‌های وضعیت جدول"
        className="absolute top-3 sm:top-5 right-2 left-2 sm:left-auto sm:right-4 sm:max-w-xs flex flex-col items-center sm:items-end gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-fantasy-toast flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[var(--panel)]/95 dark:bg-[#131d3b]/95 backdrop-blur-md border border-[var(--line)] shadow-lg shadow-black/5 text-start font-ui max-w-[94%] sm:max-w-none"
            style={{
              borderLeftColor: toast.color,
              borderLeftWidth: '3.5px'
            }}
          >
            {/* Courier Icon (Firefly, Feather, Crown) */}
            <span className="text-base shrink-0 select-none animate-pulse">
              {toast.icon}
            </span>

            {/* Poetic In-World Text */}
            <div className="flex flex-col min-w-0">
              <span className="text-[11.5px] sm:text-xs font-bold text-[var(--ink)] leading-snug tracking-tight">
                {toast.text}
              </span>
              {toast.subText && (
                <span className="text-[9.5px] font-semibold text-[var(--mute)]">
                  {toast.subText}
                </span>
              )}
            </div>
          </div>
        ))}
      </aside>

      {/* LAYER 1: Floating Score Numbers (+1, +2 x3) */}
      {scores.map((score) => (
        <div
          key={score.id}
          className="absolute animate-score-pop flex items-center gap-1 font-timer font-extrabold tabular-nums tracking-wider px-2.5 py-1 rounded-full shadow-md"
          style={{
            left: `${score.x}px`,
            top: `${score.y}px`,
            backgroundColor: score.combo >= 3 ? '#F5B52E' : (score.combo === 2 ? '#12B5A4' : '#2347C5'),
            color: '#FFFFFF',
            border: '1.5px solid rgba(255,255,255,0.7)',
            fontSize: score.combo >= 3 ? '18px' : (score.combo === 2 ? '16px' : '14px')
          }}
        >
          {score.combo >= 2 && <span className="text-xs">🔥</span>}
          <span>{score.label || `+${score.points}`}</span>
        </div>
      ))}

      {/* LAYER 2: Budgeted Particle Sparks (3-5 stars) */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            '--tx': `${p.vx * 0.4}px`,
            '--ty': `${p.vy * 0.4}px`,
            animation: 'spark-radiate 0.5s ease-out forwards'
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default FeedbackOverlay;
