import React, { useState, useEffect } from 'react';
import { Language, LeaderboardEntry } from '../types';
import { fetchLeaderboard } from '../contentEngine';
import { FlagIcon } from './FlagIcon';
import { sound } from '../soundManager';
import { tUI, isRtlLang } from '../ui';
import { Trophy, Medal, Flame, X, RefreshCw, Star } from 'lucide-react';

interface Props {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardModal: React.FC<Props> = ({ language, isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const t = tUI(language);
  const isRTL = isRtlLang(language);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[90dvh] flex flex-col bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] rounded-[24px] shadow-[var(--shadow)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--panel)] p-4 text-[var(--ink)] flex items-center justify-between border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[12px] bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center border border-[var(--line)] shadow-[var(--shadow-sm)]">
              <Trophy size={20} />
            </div>
            <div className="text-start">
              <h2 className="text-lg font-bold font-display text-[var(--ink)]">{isRTL ? 'لیدربرد چالش تک‌نفره' : 'Single-Player Leaderboard'}</h2>
              <p className="text-[11px] text-[var(--mute)] font-medium">{isRTL ? 'رتبه‌بندی برترین امتیازهای چالش واژگان و تلفظ' : 'Top single-player vocabulary & speech scores'}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-[8px] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] flex items-center justify-center transition-transform active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subheader & Refresh */}
        <div className="px-4 py-2 bg-[var(--bg)] flex items-center justify-between border-b border-[var(--line)] text-xs font-bold text-[var(--ink)]">
          <div className="flex items-center gap-1.5 text-[var(--vermilion)]">
            <Flame size={15} />
            <span>{isRTL ? 'برترین رکوردهای ثبت‌شده' : 'Global & Local Top Scores'}</span>
          </div>
          <button 
            onClick={() => {
              sound.playClick();
              loadData();
            }}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)] hover:bg-[var(--bg)] text-[11px] font-bold active:translate-y-0.5 transition-all"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>{isRTL ? 'تازه‌سازی' : 'Refresh'}</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 font-ui">
          {isLoading && entries.length === 0 ? (
            <div className="py-12 text-center text-[var(--mute)] text-sm font-bold flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-[var(--vermilion)]" />
              <span>{isRTL ? 'در حال دریافت رتبه‌ها...' : 'Loading ranks...'}</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-[var(--mute)] text-sm font-bold">
              <Star size={32} className="mx-auto mb-2 text-[var(--saffron)]" />
              <span>{isRTL ? 'هنوز رکوردی ثبت نشده! اولین نفری باش که رکورد می‌زنه.' : 'No records yet! Be the first to claim the top spot.'}</span>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const isTop1 = idx === 0;
              const isTop2 = idx === 1;
              const isTop3 = idx === 2;

              let rankBadge = (
                <span className="w-6 text-center text-xs font-bold text-[var(--mute)]">
                  #{idx + 1}
                </span>
              );

              if (isTop1) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-full bg-[var(--saffron)] text-[var(--ink)] border border-[var(--line)] flex items-center justify-center font-bold text-xs shadow-[var(--shadow-sm)]">
                    🥇
                  </div>
                );
              } else if (isTop2) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-[var(--ink)] border border-[var(--line)] flex items-center justify-center font-bold text-xs">
                    🥈
                  </div>
                );
              } else if (isTop3) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-full bg-amber-200 text-[var(--ink)] border border-[var(--line)] flex items-center justify-center font-bold text-xs">
                    🥉
                  </div>
                );
              }

              return (
                <div 
                  key={entry.id || idx}
                  className={`flex items-center justify-between p-2.5 rounded-[14px] border border-[var(--line)] transition-all ${
                    isTop1 
                      ? 'bg-[var(--panel)] shadow-[var(--shadow-sm)]' 
                      : 'bg-[var(--bg)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 text-start">
                    {rankBadge}
                    <div className="min-w-0">
                      <div className="text-[var(--ink)] font-bold text-sm truncate flex items-center gap-1.5">
                        <span>{entry.playerName}</span>
                        {entry.targetLanguage && (
                          <span className="inline-block scale-90">
                            <FlagIcon language={entry.targetLanguage} size={14} />
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-[var(--mute)] font-medium flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-[var(--panel)] text-[var(--vermilion)] rounded-[6px] border border-[var(--line)] font-bold">
                          {entry.cefrLevel || 'A1'}
                        </span>
                        <span>{entry.accuracy}% {isRTL ? 'دقت' : 'accuracy'}</span>
                        <span className="opacity-40">•</span>
                        <span>{entry.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <div className="text-[var(--vermilion)] font-bold text-base font-display">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-[9.5px] text-[var(--mute)] font-bold">
                      {isRTL ? 'امتیاز' : 'PTS'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] text-center font-ui">
          <button 
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2.5 text-xs font-bold uppercase rounded-[12px] bg-[var(--vermilion)] hover:bg-[#c94b2a] text-white shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
          >
            {isRTL ? 'بستن' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
