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
    <div className="h-full min-h-0 flex-1 flex flex-col bg-[#F4EDE1] overflow-hidden select-none relative font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Panel with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : '-translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[#FFFBF4] border-b-2 border-[#1E1B2E] flex items-center justify-between text-[#1E1B2E] shadow-[0px_3px_0px_0px_#1E1B2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]">
              <Trophy size={16} color="#1E1B2E" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-display leading-tight">{t.history}</h2>
          </div>
          <button 
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="px-3.5 py-1.5 flex items-center justify-center bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] font-bold text-xs rounded-[10px] shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5"
          >
            {t.back}
          </button>
        </div>
      </div>

      {/* Cloud / Local Tab Selector */}
      {currentUser ? (
        <div className="flex gap-2 p-2 bg-[#FFFBF4] border-b-2 border-[#1E1B2E] shrink-0 z-10 font-ui">
          <button
            onClick={() => { sound.playClick(); setActiveTab('local'); }}
            className={`flex-1 py-1.5 px-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 border-2 border-[#1E1B2E] transition-all ${
              activeTab === 'local' 
                ? 'bg-[#1E9E93] text-white shadow-[2px_2px_0px_0px_#1E1B2E]' 
                : 'bg-[#F4EDE1] text-[#1E1B2E]/70 hover:bg-[#eae0d2]'
            }`}
          >
            <HardDrive size={14} />
            <span>{language === 'fa' ? 'سوابق این دستگاه' : 'Local Matches'} ({history.length})</span>
          </button>

          <button
            onClick={() => { sound.playClick(); setActiveTab('cloud'); }}
            className={`flex-1 py-1.5 px-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 border-2 border-[#1E1B2E] transition-all ${
              activeTab === 'cloud' 
                ? 'bg-[#F2B63D] text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]' 
                : 'bg-[#F4EDE1] text-[#1E1B2E]/70 hover:bg-[#eae0d2]'
            }`}
          >
            <Cloud size={14} />
            <span>{language === 'fa' ? 'سوابق ابری (Firestore)' : 'Cloud Matches'} ({cloudHistory.length})</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-[#FFFBF4] text-[#1E1B2E] border-b-2 border-[#1E1B2E] flex items-center justify-between gap-2 shrink-0 z-10 font-ui">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B2E]">
            <Cloud size={16} className="text-[#1E9E93]" />
            <span>{language === 'fa' ? 'برای همگام‌سازی ابری تاریخچه وارد شوید:' : 'Sign in to sync your match history:'}</span>
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
            className="px-3 py-1 rounded-[10px] bg-[#1E9E93] hover:bg-[#188a80] text-white font-bold text-xs border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5 flex items-center gap-1 shrink-0"
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
            <div className="w-8 h-8 border-3 border-[#E0603F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#1E1B2E]">{language === 'fa' ? 'در حال بارگذاری از پایگاه داده فایربیس...' : 'Loading from Firebase Firestore...'}</p>
          </div>
        ) : displayedHistory.length === 0 ? (
          /* Empty scoreboard state */
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div>
              <TeamMascot color={TeamColor.Yellow} size={80} />
            </div>
            <div className="bg-[#FFFBF4] p-4 border-2 border-[#1E1B2E] rounded-[20px] shadow-[3px_3px_0px_0px_#1E1B2E] max-w-xs">
              <span className="text-[10px] bg-[#F2B63D] border border-[#1E1B2E] px-2 py-0.5 rounded-[8px] font-bold uppercase text-[#1E1B2E]">
                ⚡ NO GAMES YET
              </span>
              <p className="text-xs font-bold text-[#1E1B2E]/70 mt-2">
                {t.noHistory || 'No games recorded yet.'}
              </p>
            </div>
          </div>
        ) : (
          displayedHistory.map(entry => {
            /* High scores list */
            const hasColorMatch = entry.winnerColor !== 'TIE';
            const winnerBg = hasColorMatch ? COLORS_MAP[entry.winnerColor as TeamColor]?.bg : 'bg-slate-300';
            const winnerHex = hasColorMatch ? COLORS_MAP[entry.winnerColor as TeamColor]?.hex : '#94a3b8';

            return (
              <div 
                key={entry.id} 
                className="bg-[#FFFBF4] p-3 rounded-[18px] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] flex items-center justify-between gap-3 relative transition-all"
              >
                {/* Score listing details */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-[#1E1B2E]/60 tracking-wider mb-0.5 uppercase flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{entry.date}</span>
                  </div>
                  <div className="text-[#1E1B2E] font-bold text-sm uppercase tracking-tight flex items-center gap-1.5">
                    <Crown size={15} color="#E0603F" />
                    <span className="truncate">{entry.winnerNames.join(' & ')}</span>
                  </div>
                  <div className="text-[11px] font-medium text-[#1E1B2E]/70 truncate mt-0.5 flex items-center gap-1">
                    <Users size={12} />
                    <span>{t.players}: {entry.players.join(', ')}</span>
                  </div>
                </div>

                {/* Actions & Shield badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedShareEntry(entry);
                    }}
                    className="p-2 bg-[#F4EDE1] hover:bg-[#eae0d2] text-[#1E1B2E] rounded-[10px] border-2 border-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E] active:translate-y-0.5"
                    title="اشتراک‌گذاری کارنامه"
                  >
                    <Share2 size={15} />
                  </button>

                  <div 
                    className="w-11 h-11 rounded-[14px] flex flex-col items-center justify-center font-bold text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] border-2 border-[#1E1B2E] shrink-0"
                    style={{ backgroundColor: winnerHex }}
                  >
                    <Trophy size={15} color="#1E1B2E" />
                    <span className="text-[8px] text-[#1E1B2E] font-bold tracking-tighter uppercase leading-none mt-0.5">
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
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[#1E1B2E] hover:bg-[#2E2844] text-[#F2B63D] border border-[#1E1B2E] rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse font-ui"
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
        <div className="p-3 bg-[#FFFBF4] border-t-2 border-[#1E1B2E] font-ui">
          <button 
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-teal w-full py-3 text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[18px]"
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
