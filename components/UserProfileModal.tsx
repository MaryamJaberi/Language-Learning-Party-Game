import React, { useState, useEffect } from 'react';
import { Language, LeaderboardEntry, PersonalRecords, GameHistoryEntry } from '../types';
import { getPersonalRecords, fetchLeaderboard } from '../contentEngine';
import { auth, signInWithGoogle, logOut, fetchUserMatchHistory } from '../firebase';
import { User } from 'firebase/auth';
import { FlagIcon } from './FlagIcon';
import { sound } from '../soundManager';
import { usePWAInstall } from '../usePWAInstall';
import { isRtlLang } from '../ui';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Timer, 
  CheckCircle2, 
  BookOpen, 
  User as UserIcon, 
  LogOut, 
  Download, 
  Smartphone, 
  X, 
  RefreshCw, 
  Medal, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  History,
  Calendar,
  Users,
  AlertCircle,
  HardDrive,
  Cloud
} from 'lucide-react';

interface Props {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChange?: (user: User | null) => void;
  onOpenInstallModal?: () => void;
  initialTab?: 'history' | 'records' | 'leaderboard';
}

export const UserProfileModal: React.FC<Props> = ({
  language,
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
  onOpenInstallModal,
  initialTab = 'history'
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'records' | 'leaderboard'>(initialTab);
  const [records, setRecords] = useState<PersonalRecords>(getPersonalRecords());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // History state
  const [localHistory, setLocalHistory] = useState<GameHistoryEntry[]>([]);
  const [cloudHistory, setCloudHistory] = useState<GameHistoryEntry[]>([]);
  const [historySource, setHistorySource] = useState<'all' | 'local' | 'cloud'>('all');
  const [isLoadingCloudHistory, setIsLoadingCloudHistory] = useState(false);

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isRTL = isRtlLang(language);

  // Load history from localStorage
  const loadLocalHistory = () => {
    try {
      const saved = localStorage.getItem('dor_game_history');
      if (saved) {
        setLocalHistory(JSON.parse(saved));
      } else {
        setLocalHistory([]);
      }
    } catch {
      setLocalHistory([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      setRecords(getPersonalRecords());
      loadLocalHistory();
      loadLeaderboard();
      if (currentUser) {
        loadCloudHistory(currentUser.uid);
      }
    }
  }, [isOpen, initialTab, currentUser]);

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const loadCloudHistory = async (uid: string) => {
    setIsLoadingCloudHistory(true);
    try {
      const matches = await fetchUserMatchHistory(uid);
      setCloudHistory(matches);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCloudHistory(false);
    }
  };

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    sound.playClick();
    setIsSigningIn(true);
    setLoginError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        if (onAuthChange) onAuthChange(user);
        loadCloudHistory(user.uid);
        sound.playSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const isPopupBlocked = err?.code === 'auth/popup-blocked';
      setLoginError(
        isPopupBlocked
          ? (isRTL 
              ? 'پنجره پاپ‌آپ گوگل توسط مرورگر مسدود شد. راه‌حل: در نوار آدرس مرورگر به پاپ‌آپ‌ها اجازه نمایش دهید.' 
              : 'Popup was blocked by your browser. Fix: Allow popups for this site in your browser address bar.')
          : (isRTL 
              ? 'ارتباط با سرور گوگل برقرار نشد. راه‌حل: اینترنت خود را چک کنید و مجدداً تلاش نمایید.'
              : 'Could not connect to Google sign-in. Fix: Check your network and try again.')
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    sound.playClick();
    try {
      await logOut();
      if (onAuthChange) onAuthChange(null);
      setCloudHistory([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Combine and deduplicate history
  const allHistory = (() => {
    if (historySource === 'local') return localHistory;
    if (historySource === 'cloud') return cloudHistory;
    const combined = [...localHistory];
    cloudHistory.forEach(ch => {
      if (!combined.some(lh => lh.id === ch.id)) {
        combined.push(ch);
      }
    });
    return combined;
  })();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[92dvh] flex flex-col bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] rounded-[20px] shadow-[var(--shadow)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with User Info */}
        <div className="bg-[var(--panel)] p-4 border-b border-[var(--line)] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-[14px] border border-[var(--line)] shadow-[var(--shadow-sm)] object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-[14px] bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center border border-[var(--line)] shadow-[var(--shadow-sm)]">
                  <UserIcon size={24} />
                </div>
              )}
              
              <div className="text-start">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] font-display leading-tight">
                    {currentUser?.displayName || (isRTL ? 'حساب کاربری مهمان' : 'Guest Player')}
                  </h2>
                  {currentUser && (
                    <span className="bg-[var(--teal)] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-[6px]">
                      {isRTL ? 'متصل' : 'Synced'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--mute)] font-medium">
                  {currentUser?.email || (isRTL ? 'سوابق و امتیازات در این دستگاه ذخیره می‌شود' : 'Saved locally on this device')}
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-[10px] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] flex items-center justify-center transition-transform active:scale-95"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Actionable Error Banner if login fails */}
          {loginError && (
            <div className="mt-2.5 p-2.5 rounded-[12px] bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start justify-between gap-2 animate-fade-in">
              <div className="flex items-start gap-2 flex-1">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-start leading-relaxed font-bold">
                  {loginError}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginError(null)}
                className="text-rose-600 hover:text-rose-800 p-0.5"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Cloud Auth Bar */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs">
            {currentUser ? (
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--vermilion)] border border-[var(--line)] text-[11px] font-bold transition-all shadow-[var(--shadow-sm)]"
              >
                <LogOut size={13} />
                <span>{isRTL ? 'خروج از حساب' : 'Sign Out'}</span>
              </button>
            ) : (
              <button 
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] text-xs font-bold shadow-[var(--shadow-sm)] active:translate-y-0.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isRTL ? 'ورود با گوگل برای همگام‌سازی ابری' : 'Sign in with Google'}</span>
              </button>
            )}

            <div className="flex items-center gap-1 text-[11px] text-[var(--mute)] font-medium">
              <ShieldCheck size={14} className="text-[var(--teal)]" />
              <span>{currentUser ? (isRTL ? 'همگام با کلود' : 'Cloud Synced') : (isRTL ? 'حافظه محلی' : 'Local Storage')}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation: History, Records & Leaderboard */}
        <div className="flex bg-[var(--bg)] border-b border-[var(--line)] p-1.5 gap-1.5 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('history');
            }}
            className={`flex-1 py-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--mute)] hover:bg-[var(--panel)]/50 border border-transparent'
            }`}
          >
            <History size={14} />
            <span>{isRTL ? 'تاریخچه بازی‌ها' : 'Match History'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('records');
            }}
            className={`flex-1 py-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'records'
                ? 'bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--mute)] hover:bg-[var(--panel)]/50 border border-transparent'
            }`}
          >
            <Sparkles size={14} />
            <span>{isRTL ? 'رکوردهای من' : 'My Records'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--mute)] hover:bg-[var(--panel)]/50 border border-transparent'
            }`}
          >
            <Trophy size={14} />
            <span>{isRTL ? 'رده‌بندی' : 'Leaderboard'}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 font-ui">
          
          {/* TAB 1: MATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2.5">
              {currentUser && (
                <div className="flex gap-1.5 bg-[var(--bg)] p-1 rounded-[10px] border border-[var(--line)] text-[11px] font-bold">
                  <button
                    onClick={() => setHistorySource('all')}
                    className={`flex-1 py-1 rounded-[8px] transition-all ${historySource === 'all' ? 'bg-[var(--panel)] text-[var(--ink)] shadow-xs' : 'text-[var(--mute)]'}`}
                  >
                    {isRTL ? 'همه' : 'All'} ({allHistory.length})
                  </button>
                  <button
                    onClick={() => setHistorySource('local')}
                    className={`flex-1 py-1 rounded-[8px] transition-all ${historySource === 'local' ? 'bg-[var(--panel)] text-[var(--ink)] shadow-xs' : 'text-[var(--mute)]'}`}
                  >
                    {isRTL ? 'حافظه دستگاه' : 'Local'} ({localHistory.length})
                  </button>
                  <button
                    onClick={() => setHistorySource('cloud')}
                    className={`flex-1 py-1 rounded-[8px] transition-all ${historySource === 'cloud' ? 'bg-[var(--panel)] text-[var(--ink)] shadow-xs' : 'text-[var(--mute)]'}`}
                  >
                    {isRTL ? 'سوابق ابری' : 'Cloud'} ({cloudHistory.length})
                  </button>
                </div>
              )}

              {allHistory.length === 0 ? (
                <div className="py-10 text-center bg-[var(--bg)] rounded-[16px] border border-[var(--line)] p-4 space-y-2">
                  <History size={36} className="mx-auto text-[var(--vermilion)] opacity-60" />
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {isRTL ? 'هنوز بازی‌ای ثبت نشده است' : 'No matches played yet'}
                  </h3>
                  <p className="text-xs text-[var(--mute)] leading-relaxed font-medium">
                    {isRTL 
                      ? 'راه‌حل: یک دست بازی دورهمی یا انفرادی شروع کنید تا تاریخچه امتیازها و تیم‌های برنده در اینجا ثبت شود.' 
                      : 'Fix: Start a new game with friends or single-player to record your match history here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allHistory.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5 text-start shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                          <Trophy size={14} className="text-[var(--saffron)]" />
                          <span>{item.winnerColor === 'TIE' ? (isRTL ? 'مساوی' : 'Tie') : (isRTL ? `تیم برنده: ${item.winnerNames?.join(' و ') || item.winnerColor}` : `Winner: ${item.winnerColor}`)}</span>
                        </div>
                        <span className="text-[10px] text-[var(--mute)] font-medium">
                          {item.date}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[var(--mute)] font-medium pt-1 border-t border-[var(--line)]">
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-[var(--teal)]" />
                          <span className="truncate max-w-[200px] text-[var(--ink)]">{item.players?.join(', ') || '-'}</span>
                        </div>
                        {item.totalScore !== undefined && (
                          <span className="font-bold text-[var(--vermilion)] font-mono">
                            {item.totalScore} PTS
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERSONAL RECORDS */}
          {activeTab === 'records' && (
            <div className="space-y-3">
              <div className="bg-[var(--bg)] p-3.5 rounded-[16px] border border-[var(--line)] flex items-center justify-between">
                <div className="text-start">
                  <span className="text-[10px] text-[var(--vermilion)] font-bold uppercase tracking-wider block">
                    {isRTL ? 'بهترین رکورد ثبت‌شده شما' : 'Your Personal Best'}
                  </span>
                  <div className="text-2xl font-bold text-[var(--ink)] font-display">
                    {records.highestScore} <span className="text-xs text-[var(--vermilion)]">PTS</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-[14px] bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center border border-[var(--line)] shadow-[var(--shadow-sm)]">
                  <Trophy size={26} />
                </div>
              </div>

              {/* 4-Stat Grid */}
              <div className="grid grid-cols-2 gap-2">
                
                {/* Max Streak */}
                <div className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] text-start">
                  <div className="flex items-center gap-1 text-[var(--vermilion)] text-xs font-bold mb-1">
                    <Flame size={15} />
                    <span>{isRTL ? 'بیشترین زنجیره' : 'Max Streak'}</span>
                  </div>
                  <div className="text-lg font-bold text-[var(--ink)] font-display">
                    {records.maxStreak} <span className="text-[10px] font-ui text-[var(--mute)]">{isRTL ? 'کارت پیاپی' : 'cards'}</span>
                  </div>
                </div>

                {/* Fastest Answer */}
                <div className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] text-start">
                  <div className="flex items-center gap-1 text-[var(--teal)] text-xs font-bold mb-1">
                    <Timer size={15} />
                    <span>{isRTL ? 'سریع‌ترین پاسخ' : 'Fastest'}</span>
                  </div>
                  <div className="text-lg font-bold text-[var(--ink)] font-display">
                    {records.fastestAnswerSeconds < 99 ? records.fastestAnswerSeconds : '--'} <span className="text-[10px] font-ui text-[var(--mute)]">{isRTL ? 'ثانیه' : 'sec'}</span>
                  </div>
                </div>

                {/* Total Cards Guessed */}
                <div className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] text-start">
                  <div className="flex items-center gap-1 text-[var(--saffron)] text-xs font-bold mb-1">
                    <CheckCircle2 size={15} />
                    <span>{isRTL ? 'کلمات موفق' : 'Correct Words'}</span>
                  </div>
                  <div className="text-lg font-bold text-[var(--ink)] font-display">
                    {records.totalCardsGuessed}
                  </div>
                </div>

                {/* Total Points */}
                <div className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] text-start">
                  <div className="flex items-center gap-1 text-[var(--ink)] text-xs font-bold mb-1">
                    <Zap size={15} />
                    <span>{isRTL ? 'مجموع امتیازها' : 'Total Score'}</span>
                  </div>
                  <div className="text-lg font-bold text-[var(--ink)] font-display">
                    {records.totalPoints}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: LIVE LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--mute)] font-bold pb-1">
                <span>{isRTL ? 'برترین بازیکنان جهان و محلی' : 'Top Global Players'}</span>
                <button
                  onClick={loadLeaderboard}
                  disabled={isLoadingLeaderboard}
                  className="flex items-center gap-1 text-[var(--vermilion)] hover:underline font-bold"
                >
                  <RefreshCw size={12} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
                  <span>{isRTL ? 'تازه‌سازی' : 'Refresh'}</span>
                </button>
              </div>

              {isLoadingLeaderboard && leaderboard.length === 0 ? (
                <div className="py-10 text-center text-[var(--mute)] text-xs font-bold flex flex-col items-center gap-2">
                  <RefreshCw size={22} className="animate-spin text-[var(--vermilion)]" />
                  <span>{isRTL ? 'در حال دریافت رتبه‌ها...' : 'Loading ranks...'}</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-8 text-center bg-[var(--bg)] rounded-[16px] border border-[var(--line)] p-4 space-y-2">
                  <Trophy size={32} className="mx-auto text-[var(--saffron)] opacity-60" />
                  <p className="text-xs font-bold text-[var(--mute)] leading-relaxed">
                    {isRTL ? 'هنوز رکوردی در جدول ثبت نشده است. راه‌حل: در بخش سینگل پلیر بازی کنید و امتیاز خود را ثبت کنید تا در جدول برترین‌ها قرار بگیرید!' : 'No records yet. Play single-player to record your score on the leaderboard!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.map((entry, index) => {
                    const isTop3 = index < 3;
                    const medalBg = index === 0 ? 'var(--saffron)' : index === 1 ? '#e2e8f0' : index === 2 ? '#fed7aa' : null;

                    return (
                      <div 
                        key={entry.id || index}
                        className={`flex items-center justify-between p-2.5 rounded-[14px] border border-[var(--line)] transition-transform ${
                          index === 0 
                            ? 'bg-[var(--panel)] shadow-[var(--shadow-sm)]' 
                            : 'bg-[var(--bg)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 text-start">
                          <div 
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center font-bold text-xs shrink-0 border border-[var(--line)]"
                            style={{ 
                              backgroundColor: medalBg || 'var(--panel)', 
                              color: 'var(--ink)' 
                            }}
                          >
                            {isTop3 ? <Medal size={15} /> : `#${index + 1}`}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[var(--ink)] truncate max-w-[140px]">
                              {entry.playerName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--mute)] font-medium">
                              <FlagIcon language={entry.targetLanguage} size={14} />
                              <span>{isRTL ? 'دقت:' : 'Acc:'} {entry.accuracy}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-end shrink-0">
                          <div className="text-sm font-bold text-[var(--vermilion)] font-display">
                            {entry.score} <span className="text-[10px] text-[var(--mute)] font-ui font-medium">PTS</span>
                          </div>
                          <span className="text-[9.5px] text-[var(--mute)] font-medium">{entry.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MOBILE INSTALL AT THE BOTTOM OF THE LIST */}
          <div className="mt-4 pt-3 border-t border-[var(--line)] space-y-2 shrink-0 text-start">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                <Smartphone size={15} />
                <span>{isRTL ? '📲 نصب روی موبایل (Android & iOS)' : '📲 Mobile App & PWA'}</span>
              </div>
              <span className="text-[9.5px] font-bold text-[var(--teal)] bg-[var(--panel)] px-2 py-0.5 rounded-[6px] border border-[var(--line)]">
                {isInstalled ? (isRTL ? 'نصب شده ✓' : 'Installed ✓') : (isRTL ? 'آفلاین و سریع' : 'Offline Ready')}
              </span>
            </div>

            <div className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] space-y-2">
              <p className="text-[11.5px] text-[var(--mute)] leading-relaxed font-medium">
                {isRTL 
                  ? 'برنامه را مانند یک اپلیکیشن بومی روی صفحه گوشی خود اضافه کنید تا تمام‌صفحه و با سرعت بالا اجرا شود.' 
                  : 'Install this app on Android or iOS for fast standalone launch and offline play.'}
              </p>

              {isInstalled ? (
                <div className="p-2.5 bg-[var(--panel)] border border-[var(--line)] text-[var(--teal)] rounded-[12px] flex items-center justify-center gap-2 font-bold text-xs shadow-[var(--shadow-sm)]">
                  <CheckCircle2 size={16} />
                  <span>{isRTL ? 'اپلیکیشن روی این دستگاه نصب شده است!' : 'App is already installed!'}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <a
                    href="./downloads/dor-zaban-v1.0.apk"
                    download="dor-zaban-v1.0.apk"
                    onClick={() => sound.playClick()}
                    className="w-full py-2.5 px-3 bg-[#2347C5] hover:bg-[#1a38a0] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all text-center no-underline"
                  >
                    <Download size={15} />
                    <span>{isRTL ? 'دانلود مستقیم فایل نصبی APK (اندروید)' : 'Download Android APK (1.2 MB)'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={async () => {
                      sound.playClick();
                      if (onOpenInstallModal) {
                        onOpenInstallModal();
                      } else if (isInstallable) {
                        await install();
                      }
                    }}
                    className="w-full py-2 px-3 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
                  >
                    <Smartphone size={15} />
                    <span>{isRTL ? 'نصب مستقیم روی گوشی (PWA و پکیج گوگل‌پلی)' : 'Install on Mobile Device (PWA & Play Store)'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--mute)] font-medium">
          <span>{isRTL ? 'حساب کاربری و سوابق' : 'Account & Records'}</span>
          <button 
            onClick={onClose}
            className="px-3.5 py-1 rounded-[8px] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold active:translate-y-0.5 transition-all"
          >
            {isRTL ? 'بازگشت' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
