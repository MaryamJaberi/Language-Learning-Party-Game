import React, { useState, useEffect } from 'react';
import { GameHistoryEntry, TeamColor, Language } from '../types';
import { COLORS_MAP } from '../constants';
import { tUI, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { auth, fetchUserMatchHistory, signInWithGoogle } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Trophy, Crown, Zap, ArrowRight, ArrowLeft, Cloud, HardDrive, Calendar, Users, ChevronUp, Share2, LogIn } from 'lucide-react';
import { useGoogleScrollBars } from '../useGoogleScrollBars';
import ShareScorecardModal from '../components/ShareScorecardModal';

interface Props {
  language: Language;
  history: GameHistoryEntry[];
  onBack: () => void;
}

const HistoryScreen: React.FC<Props> = ({ language, history, onBack }) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudHistory, setCloudHistory] = useState<GameHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [selectedShareEntry, setSelectedShareEntry] = useState<GameHistoryEntry | null>(null);
  const { isBarsVisible, scrollContainerRef, handleScroll, showBars } = useGoogleScrollBars();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setActiveTab('cloud');
        setIsLoadingCloud(true);
        const cloudMatches = await fetchUserMatchHistory(user.uid);
        setCloudHistory(cloudMatches);
        setIsLoadingCloud(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const displayedHistory = activeTab === 'cloud' && currentUser ? cloudHistory : history;

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col bg-[var(--bg)] text-[var(--ink)] overflow-hidden select-none relative font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Panel with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : '-translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[var(--panel)] border-b border-[var(--line)] flex items-center justify-between text-[var(--ink)] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shadow-xs">
              <Trophy size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-black font-display leading-tight">{t.history}</h2>
          </div>
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="h-10 px-4 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] border border-[var(--line)] font-bold text-xs rounded-full shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            {t.back}
          </button>
        </div>
      </div>

      {/* Cloud / Local Tab Selector */}
      {currentUser ? (
        <div className="flex gap-2 p-2 bg-[var(--panel)] border-b border-[var(--line)] shrink-0 z-10 font-ui">
          <button
            onClick={() => { sound.playClick(); setActiveTab('local'); }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'local' 
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs' 
                : 'bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)]'
            }`}
          >
            <HardDrive size={14} />
            <span>{language === 'fa' ? 'سوابق این دستگاه' : 'Local Matches'} ({history.length})</span>
          </button>

          <button
            onClick={() => { sound.playClick(); setActiveTab('cloud'); }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cloud' 
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs' 
                : 'bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)]'
            }`}
          >
            <Cloud size={14} />
            <span>{language === 'fa' ? 'سوابق ابری' : 'Cloud Matches'} ({cloudHistory.length})</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-[var(--panel)] text-[var(--ink)] border-b border-[var(--line)] flex items-center justify-between gap-2 shrink-0 z-10 font-ui">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
            <Cloud size={16} className="text-[var(--turq)]" />
            <span className="text-[11px] sm:text-xs">{language === 'fa' ? 'برای همگام‌سازی ابری تاریخچه وارد شوید:' : 'Sign in to sync your match history:'}</span>
          </div>
          <button
            onClick={async () => {
              sound.playClick();
              try {
                await signInWithGoogle();
              } catch (e) {
                console.error(e);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[var(--turq)] hover:brightness-105 text-white font-bold text-xs shadow-xs active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <LogIn size={13} />
            <span>{language === 'fa' ? 'ورود با گوگل' : 'Sign In'}</span>
          </button>
        </div>
      )}

      {/* Scores Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-2.5 overscroll-contain font-ui"
      >
        {isLoadingCloud ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[var(--lapis)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[var(--mute)]">{language === 'fa' ? 'در حال بارگذاری از پایگاه داده فایربیس...' : 'Loading from Firebase Firestore...'}</p>
          </div>
        ) : displayedHistory.length === 0 ? (
          /* Empty scoreboard state */
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div>
              <TeamMascot color={TeamColor.Yellow} size={80} />
            </div>
            <div className="bg-[var(--panel)] p-4 border border-[var(--line)] rounded-2xl shadow-xs max-w-xs">
              <span className="text-[10px] bg-[var(--lapis-soft)] text-[var(--lapis)] px-2 py-0.5 rounded-md font-bold uppercase">
                ⚡ NO GAMES YET
              </span>
              <p className="text-xs font-bold text-[var(--mute)] mt-2">
                {t.noHistory || 'No games recorded yet.'}
              </p>
            </div>
          </div>
        ) : (
          displayedHistory.map(entry => {
            /* High scores list */
            const hasColorMatch = entry.winnerColor !== 'TIE';
            const winnerHex = hasColorMatch ? COLORS_MAP[entry.winnerColor as TeamColor]?.hex : '#94a3b8';

            return (
              <div 
                key={entry.id} 
                className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs flex items-center justify-between gap-3 relative transition-all"
              >
                {/* Score listing details */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-[var(--mute)] tracking-wider mb-0.5 uppercase flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{entry.date}</span>
                  </div>
                  <div className="text-[var(--ink)] font-bold text-sm uppercase tracking-tight flex items-center gap-1.5">
                    <Crown size={15} className="text-[var(--saffron)]" />
                    <span className="truncate">{entry.winnerNames.join(' & ')}</span>
                  </div>
                  <div className="text-[11px] font-medium text-[var(--mute)] truncate mt-0.5 flex items-center gap-1">
                    <Users size={12} />
                    <span>{t.players}: {entry.players.join(', ')}</span>
                  </div>
                </div>

                {/* Actions & Shield badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedShareEntry(entry);
                    }}
                    className="p-2.5 bg-[var(--bg)] hover:bg-[var(--line)]/50 text-[var(--ink)] rounded-xl border border-[var(--line)] shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="اشتراک‌گذاری کارنامه"
                  >
                    <Share2 size={15} />
                  </button>

                  <div 
                    className="w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-white shadow-xs border border-black/10 shrink-0"
                    style={{ backgroundColor: winnerHex }}
                  >
                    <Trophy size={15} />
                    <span className="text-[8px] font-bold tracking-tighter uppercase leading-none mt-0.5">
                      {entry.winnerColor === 'TIE' ? 'TIE' : entry.winnerColor.slice(0, 4)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Share Scorecard Modal for past matches */}
      {selectedShareEntry && (
        <ShareScorecardModal
          isOpen={!!selectedShareEntry}
          onClose={() => setSelectedShareEntry(null)}
          winners={[{
            id: 0,
            color: (selectedShareEntry.winnerColor as TeamColor) || TeamColor.Blue,
            timeRemaining: 0,
            isEliminated: false,
            playerIds: [],
            score: selectedShareEntry.totalScore || 20
          }]}
          players={selectedShareEntry.players.map((p, idx) => ({
            id: idx,
            name: p,
            teamId: 0,
            teamColor: (selectedShareEntry.winnerColor as TeamColor) || TeamColor.Blue
          }))}
          playedCards={[]}
          language={language}
          historyEntry={selectedShareEntry}
        />
      )}

      {/* Floating reveal trigger when bars are hidden */}
      {!isBarsVisible && (
        <button
          onClick={showBars}
          aria-label="Show menu"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-[var(--ink)] text-[var(--bg)] rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-xs font-ui cursor-pointer"
        >
          <ChevronUp size={14} />
          <span>{language === 'fa' ? 'بازگشت' : 'Back'}</span>
        </button>
      )}

      {/* Return footer tab with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-bottom shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : 'translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] font-ui">
          <button 
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="w-full py-3 text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{t.back}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
