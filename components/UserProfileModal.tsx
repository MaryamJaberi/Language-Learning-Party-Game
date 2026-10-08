import React, { useState, useEffect } from 'react';
import { Language, LeaderboardEntry, PersonalRecords, GameHistoryEntry } from '../types';
import { getPersonalRecords, fetchLeaderboard } from '../contentEngine';
import { getLeitnerState, getDueLeitnerCards } from '../leitnerBoxService';
import { auth, signInWithGoogle, logOut, fetchUserMatchHistory, deleteUserAccountAndData } from '../firebase';
import { User } from 'firebase/auth';
import { sound } from '../soundManager';
import { usePWAInstall } from '../usePWAInstall';
import { isRtlLang } from '../ui';
import { downloadFileWithBlob } from '../utils/downloadHelper';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Timer, 
  CheckCircle2, 
  User as UserIcon, 
  LogOut, 
  Download, 
  Smartphone, 
  X, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  History,
  Users,
  AlertCircle,
  Loader2,
  Trash2,
  FileDown,
  Lock,
  ExternalLink,
  ShieldAlert,
  Box
} from 'lucide-react';

export type ProfileTab = 'history' | 'records' | 'leitner' | 'leaderboard' | 'downloads' | 'privacy';

interface Props {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChange?: (user: User | null) => void;
  onOpenInstallModal?: () => void;
  initialTab?: ProfileTab;
  onOpenLeitner?: () => void;
}

export const UserProfileModal: React.FC<Props> = ({
  language,
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
  onOpenInstallModal,
  initialTab = 'history',
  onOpenLeitner
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [leitnerState, setLeitnerState] = useState(getLeitnerState());
  const [records, setRecords] = useState<PersonalRecords>(getPersonalRecords());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  // History state
  const [localHistory, setLocalHistory] = useState<GameHistoryEntry[]>([]);
  const [cloudHistory, setCloudHistory] = useState<GameHistoryEntry[]>([]);
  const [historySource, setHistorySource] = useState<'all' | 'local' | 'cloud'>('all');
  const [isLoadingCloudHistory, setIsLoadingCloudHistory] = useState(false);

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isRTL = isRtlLang(language);

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
      setLeitnerState(getLeitnerState());
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
              ? 'پنجره ورود به گوگل توسط مرورگر مسدود شد. لطفاً پاپ‌آپ را در نوار آدرس مجاز کنید.' 
              : 'Popup was blocked by your browser. Please allow popups for this site in your browser address bar.')
          : (isRTL 
              ? 'ارتباط با حساب گوگل برقرار نشد. لطفاً اتصال اینترنت خود را بررسی نمایید.'
              : 'Could not connect to Google. Please check your internet connection.')
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
      sound.playSuccess();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleDeleteAccount = async () => {
    sound.playClick();
    setIsDeletingAccount(true);
    try {
      await deleteUserAccountAndData();
      if (onAuthChange) onAuthChange(null);
      setCloudHistory([]);
      setDeleteConfirmOpen(false);
      setDeleteSuccessMsg(isRTL ? 'حساب کاربری و کلیه داده‌های شما با موفقیت حذف گردید.' : 'Your account and data were permanently deleted.');
      sound.playSuccess();
      setTimeout(() => setDeleteSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Delete account error:', err);
      alert(isRTL ? 'خطا در حذف حساب. لطفاً یک‌بار خارج شده، دوباره وارد شوید و مجدداً تلاش کنید.' : 'Failed to delete account. Please re-authenticate and try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleExportData = () => {
    try {
      const dataToExport = {
        app: 'DOŪR (دور)',
        packageId: 'com.solonovate.dour',
        exportDate: new Date().toISOString(),
        user: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        } : 'guest',
        personalRecords: records,
        matchHistory: localHistory,
        cloudMatchesCount: cloudHistory.length,
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dour-user-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMsg(isRTL ? 'فایل حاوی تمام داده‌های شما با موفقیت ذخیره شد.' : 'Your data was exported successfully.');
      setTimeout(() => setExportMsg(null), 3000);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

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

  const tabList: { id: ProfileTab; label: string; icon: React.FC<{ size?: number; className?: string; strokeWidth?: number }> }[] = [
    { id: 'history', label: isRTL ? 'تاریخچه بازی‌ها' : 'Match History', icon: History },
    { id: 'records', label: isRTL ? 'رکوردهای من' : 'My Records', icon: Sparkles },
    { id: 'leitner', label: isRTL ? 'جعبه لایتنر' : 'Leitner', icon: Box },
    { id: 'leaderboard', label: isRTL ? 'رده‌بندی' : 'Ranks', icon: Trophy },
    { id: 'downloads', label: isRTL ? 'نصب و دانلود' : 'Downloads & App', icon: Smartphone },
    { id: 'privacy', label: isRTL ? 'حریم خصوصی' : 'Privacy', icon: ShieldCheck },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[92dvh] flex flex-col bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] rounded-[28px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Material Design 3 Dialog Header */}
        <div className="bg-[var(--panel)] p-5 sm:p-6 pb-4 border-b border-[var(--line)] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full border border-[var(--line)] shadow-xs object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--lapis)] dark:text-blue-400 flex items-center justify-center border border-[var(--line)] shadow-xs">
                  <UserIcon size={22} strokeWidth={2} />
                </div>
              )}
              
              <div className="text-start">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] font-display tracking-tight leading-snug">
                    {currentUser?.displayName || (isRTL ? 'حساب کاربری مهمان' : 'Guest Player')}
                  </h2>
                  {currentUser && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {isRTL ? 'متصل' : 'Synced'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--mute)] font-normal mt-0.5">
                  {currentUser?.email || (isRTL ? 'سوابق و امتیازات در این دستگاه ذخیره می‌شود' : 'Saved locally on this device')}
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              aria-label="Close"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Actionable Error Banner if login fails */}
          {loginError && (
            <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2 animate-fade-in">
              <div className="flex items-start gap-2 flex-1">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-start leading-relaxed font-semibold">
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

          {/* Cloud Auth Bar with M3 Button styling */}
          <div className="mt-3.5 pt-3 flex items-center justify-between border-t border-[var(--line)] text-xs">
            {currentUser ? (
              <button 
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <LogOut size={14} strokeWidth={2} />
                <span>{isRTL ? 'خروج از حساب' : 'Sign Out'}</span>
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="flex items-center gap-2.5 h-10 px-4 rounded-full bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isSigningIn ? (isRTL ? 'در حال اتصال...' : 'Signing in...') : (isRTL ? 'ورود با حساب گوگل' : 'Sign in with Google')}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-xs text-[var(--mute)] font-medium">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>{currentUser ? (isRTL ? 'همگام با کلود' : 'Cloud Synced') : (isRTL ? 'ذخیره محلی' : 'Local Storage')}</span>
            </div>
          </div>
        </div>

        {/* Material Design 3 Primary Scrollable Tabs */}
        <div className="flex items-center gap-1 border-b border-[var(--line)] bg-[var(--panel)] px-2 sm:px-4 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
          {tabList.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id);
                }}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 min-h-[48px] text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer shrink-0 rounded-t-xl ${
                  isActive
                    ? 'font-bold text-[var(--lapis)] dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'font-medium text-[var(--mute)] hover:text-[var(--ink)] hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-[var(--lapis)] dark:text-blue-400' : 'text-[var(--mute)]'} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-[3px] bg-[var(--lapis)] dark:bg-blue-400 rounded-t-full transition-all" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-ui">
          
          {/* TAB 1: MATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {currentUser && (
                <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-full border border-[var(--line)] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setHistorySource('all')}
                    className={`flex-1 py-1.5 px-3 rounded-full transition-all ${historySource === 'all' ? 'bg-[var(--panel)] text-[var(--ink)] shadow-xs font-bold' : 'text-[var(--mute)]'}`}
                  >
                    {isRTL ? 'همه' : 'All'} ({allHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySource('local')}
                    className={`flex-1 py-1.5 px-3 rounded-full transition-all ${historySource === 'local' ? 'bg-[var(--panel)] text-[var(--ink)] shadow-xs font-bold' : 'text-[var(--mute)]'}`}
                  >
                    {isRTL ? 'حافظه دستگاه' : 'Local'} ({localHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySource('cloud')}
                    className={`flex-1 py-1.5 px-3 rounded-full transition-all ${historySource === 'cloud' ? 'bg-[var(--panel)] text-[var(--ink)] shadow-xs font-bold' : 'text-[var(--mute)]'}`}
                  >
                    {isRTL ? 'کلود' : 'Cloud'} ({cloudHistory.length})
                  </button>
                </div>
              )}

              {allHistory.length === 0 ? (
                <div className="py-10 px-6 text-center rounded-[24px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] space-y-3">
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[var(--lapis)] dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                    <History size={26} strokeWidth={2} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--ink)]">
                      {isRTL ? 'هنوز بازی‌ای ثبت نشده است' : 'No matches played yet'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--mute)] leading-relaxed font-normal max-w-xs mx-auto">
                      {isRTL 
                        ? 'پس از پایان اولین مسابقه دورهمی یا انفرادی، جزئیات امتیازها و برندگان در این قسمت ثبت می‌شود.' 
                        : 'After finishing your first party or solo game, match scores and winners will be saved here.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {allHistory.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="p-3.5 rounded-[20px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] space-y-2 text-start transition-shadow hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                          <Trophy size={15} className="text-amber-500" />
                          <span>{item.winnerColor === 'TIE' ? (isRTL ? 'مساوی' : 'Tie') : (isRTL ? `تیم برنده: ${item.winnerNames?.join(' و ') || item.winnerColor}` : `Winner: ${item.winnerColor}`)}</span>
                        </div>
                        <span className="text-[11px] text-[var(--mute)] font-medium">
                          {item.date}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--mute)] pt-2 border-t border-[var(--line)]">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-[var(--turq)]" />
                          <span className="truncate max-w-[220px] text-[var(--ink)] font-medium">{item.players?.join(', ') || '-'}</span>
                        </div>
                        {item.totalScore !== undefined && (
                          <span className="font-bold text-[var(--lapis)] font-mono text-xs">
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
            <div className="space-y-3.5">
              <div className="p-4 rounded-[22px] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex items-center justify-between">
                <div className="text-start">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider block">
                    {isRTL ? 'بهترین رکورد ثبت‌شده شما' : 'Your Personal Best'}
                  </span>
                  <div className="text-2xl font-bold text-[var(--ink)] font-display mt-0.5">
                    {records.highestScore} <span className="text-xs text-amber-600 font-bold">PTS</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center border border-amber-500/30 shadow-xs">
                  <Trophy size={24} strokeWidth={2} />
                </div>
              </div>

              {/* 4-Stat Grid in M3 styling */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Max Streak */}
                <div className="p-3.5 rounded-[20px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] text-start space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <Flame size={15} strokeWidth={2} />
                    <span>{isRTL ? 'بیشترین زنجیره' : 'Max Streak'}</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--ink)] font-display">
                    {records.maxStreak} <span className="text-xs font-normal text-[var(--mute)]">{isRTL ? 'کارت' : 'cards'}</span>
                  </div>
                </div>

                {/* Fastest Answer */}
                <div className="p-3.5 rounded-[20px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] text-start space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--turq)] text-xs font-semibold">
                    <Timer size={15} strokeWidth={2} />
                    <span>{isRTL ? 'سریع‌ترین پاسخ' : 'Fastest'}</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--ink)] font-display">
                    {records.fastestAnswerSeconds < 99 ? records.fastestAnswerSeconds : '--'} <span className="text-xs font-normal text-[var(--mute)]">{isRTL ? 'ثانیه' : 'sec'}</span>
                  </div>
                </div>

                {/* Total Cards Guessed */}
                <div className="p-3.5 rounded-[20px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] text-start space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <CheckCircle2 size={15} strokeWidth={2} />
                    <span>{isRTL ? 'کلمات موفق' : 'Correct Words'}</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--ink)] font-display">
                    {records.totalCardsGuessed}
                  </div>
                </div>

                {/* Total Points */}
                <div className="p-3.5 rounded-[20px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] text-start space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--lapis)] dark:text-blue-400 text-xs font-semibold">
                    <Zap size={15} strokeWidth={2} />
                    <span>{isRTL ? 'مجموع امتیازها' : 'Total Score'}</span>
                  </div>
                  <div className="text-xl font-bold text-[var(--ink)] font-display">
                    {records.totalPoints}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEITNER 5-BOX SPACED REPETITION (Single Player Only) */}
          {activeTab === 'leitner' && (
            <div className="space-y-3.5 text-start">
              <div className="p-4 rounded-[22px] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Box size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        {isRTL ? 'جعبه لایتنر ۵ خانه' : '5-Box Leitner (Solo Spaced Repetition)'}
                      </h3>
                      <p className="text-xs text-[var(--mute)]">
                        {isRTL ? 'مرور روزانه طبق منحنی فراموشی ابینگهاوس' : 'Daily spaced repetition intervals'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                    🔥 {leitnerState.consecutiveStreak} {isRTL ? 'روز استریک' : 'streak'}
                  </span>
                </div>

                {/* Leitner Stats Row */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-[16px] bg-[var(--panel)] border border-[var(--line)]">
                    <span className="text-lg font-bold text-amber-600 block">
                      {getDueLeitnerCards(leitnerState).length}
                    </span>
                    <span className="text-[11px] text-[var(--mute)] font-medium">
                      {isRTL ? 'آماده امروز ⚡' : 'Due Today ⚡'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-[16px] bg-[var(--panel)] border border-[var(--line)]">
                    <span className="text-lg font-bold text-emerald-600 block">
                      {leitnerState.totalCardsMastered}
                    </span>
                    <span className="text-[11px] text-[var(--mute)] font-medium">
                      {isRTL ? 'مسلط شده 🏆' : 'Mastered 🏆'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-[16px] bg-[var(--panel)] border border-[var(--line)]">
                    <span className="text-lg font-bold text-[var(--ink)] block">
                      {leitnerState.cards.length}
                    </span>
                    <span className="text-[11px] text-[var(--mute)] font-medium">
                      {isRTL ? 'کل کارت‌ها 📦' : 'Total Cards 📦'}
                    </span>
                  </div>
                </div>

                {/* 5-Boxes Distribution Visualizer */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--mute)]">
                    <span>{isRTL ? 'توزیع کارت‌ها در ۵ خانه لایتنر:' : '5 Leitner Boxes:'}</span>
                    <span>{isRTL ? '۱ ➔ ۲ ➔ ۴ ➔ ۸ ➔ ۱۵ روز' : '1 -> 2 -> 4 -> 8 -> 15 days'}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[0, 1, 2, 3, 4].map(bIdx => {
                      const count = leitnerState.cards.filter(c => c.boxIndex === bIdx).length;
                      return (
                        <div 
                          key={`box-${bIdx}`}
                          className={`p-2 rounded-[14px] border text-center transition-all ${
                            bIdx === 4
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                              : 'bg-[var(--panel)] border-[var(--line)] text-[var(--ink)]'
                          }`}
                        >
                          <span className="text-[10px] font-medium text-[var(--mute)] block">
                            {isRTL ? `خانه ${bIdx + 1}` : `Box ${bIdx + 1}`}
                          </span>
                          <span className="text-xs font-bold">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Leitner CTA Button */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playStartGame();
                    onClose();
                    onOpenLeitner?.();
                  }}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-white font-bold text-xs rounded-full shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <Sparkles size={16} />
                  <span>{isRTL ? 'ورود به جعبه لایتنر و مرور کارت‌های امروز' : 'Start Today\'s Leitner Practice'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--mute)] font-semibold pb-1">
                <span>{isRTL ? 'برترین بازیکنان جهان و محلی' : 'Top Global Players'}</span>
                <button
                  type="button"
                  onClick={loadLeaderboard}
                  disabled={isLoadingLeaderboard}
                  className="flex items-center gap-1.5 text-[var(--lapis)] hover:underline font-semibold cursor-pointer"
                >
                  <RefreshCw size={13} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
                  <span>{isRTL ? 'تازه‌سازی' : 'Refresh'}</span>
                </button>
              </div>

              {isLoadingLeaderboard && leaderboard.length === 0 ? (
                <div className="py-10 text-center text-[var(--mute)] text-xs font-medium flex flex-col items-center gap-2">
                  <RefreshCw size={22} className="animate-spin text-[var(--lapis)]" />
                  <span>{isRTL ? 'در حال دریافت رتبه‌ها...' : 'Loading ranks...'}</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-10 px-6 text-center rounded-[24px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
                    <Trophy size={24} strokeWidth={2} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--ink)]">
                      {isRTL ? 'هنوز رکوردی ثبت نشده است' : 'No leaderboard records yet'}
                    </h3>
                    <p className="text-xs text-[var(--mute)] leading-relaxed font-normal max-w-xs mx-auto">
                      {isRTL ? 'با انجام بازی در حالت تک‌نفره یا دورهمی می‌توانید اولین رکورد را در جدول برترین‌ها به نام خود ثبت کنید.' : 'Play single-player or group games to record your high score on the leaderboard!'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const isTop3 = index < 3;
                    const medalBg = index === 0 ? '#F5B52E' : index === 1 ? '#94A3B8' : index === 2 ? '#F97316' : null;

                    return (
                      <div 
                        key={entry.id || index}
                        className={`flex items-center justify-between p-3 rounded-[18px] border border-[var(--line)] transition-all ${
                          index === 0 
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 shadow-xs' 
                            : 'bg-slate-50/80 dark:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 text-start">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-2xs"
                            style={{ 
                              backgroundColor: medalBg || 'var(--mute)'
                            }}
                          >
                            {index + 1}
                          </div>

                          <div className="truncate">
                            <span className="font-bold text-xs text-[var(--ink)] block truncate">
                              {entry.displayName || (isRTL ? 'بازیکن' : 'Player')}
                            </span>
                            <span className="text-[11px] text-[var(--mute)] font-medium">
                              {entry.language}
                            </span>
                          </div>
                        </div>

                        <div className="text-end font-mono font-bold text-xs text-[var(--lapis)]">
                          {entry.score} <span className="text-[10px] text-[var(--mute)]">PTS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOWNLOADS & PACKAGES */}
          {activeTab === 'downloads' && (
            <div className="space-y-3.5 text-start">
              <div className="p-4 rounded-[22px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shrink-0">
                      <Download size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--ink)]">
                        {isRTL ? 'دانلود مستقیم فایل AAB (مخصوص گوگل پلی)' : 'Download Google Play AAB (.aab)'}
                      </h4>
                      <span className="text-xs text-[var(--mute)] font-medium">
                        {isRTL ? 'فرمت Android App Bundle (.aab) • حجم ۲.۲ مگابایت • نسخه ۱.۰.۴' : 'Format: Android App Bundle (.aab) • Size: 2.2 MB • v1.0.4'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {isRTL ? 'آماده انتشار' : 'Play Store Ready'}
                  </span>
                </div>

                <div className="text-xs text-[var(--mute)] space-y-0.5 font-mono bg-[var(--panel)] p-2.5 rounded-[14px] border border-[var(--line)]">
                  <div><strong>Package:</strong> <code className="text-[var(--lapis)]">com.solonovate.dour</code></div>
                  <div><strong>Version:</strong> 1.0.4 (VersionCode: 10004) • Target SDK: 36</div>
                </div>

                <button
                  type="button"
                  disabled={downloadingFile === 'dor-zaban-v1.0.aab'}
                  onClick={async () => {
                    sound.playClick();
                    setDownloadingFile('dor-zaban-v1.0.aab');
                    setDownloadMsg(isRTL ? 'در حال دریافت بسته باندل گوگل‌پلی...' : 'Downloading AAB...');
                    const res = await downloadFileWithBlob('./downloads/dor-zaban-v1.0.aab', 'dor-zaban-v1.0.aab', (s, msg) => {
                      if (msg) setDownloadMsg(msg);
                    });
                    setDownloadingFile(null);
                    if (!res.success && res.error) setDownloadMsg(res.error);
                  }}
                  className="w-full h-11 bg-[var(--lapis)] hover:bg-[#1a38a0] text-white rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer disabled:opacity-75"
                >
                  {downloadingFile === 'dor-zaban-v1.0.aab' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isRTL ? 'در حال دریافت فایل AAB...' : 'Downloading AAB...'}</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} strokeWidth={2} />
                      <span>{isRTL ? 'دانلود بسته رسمی AAB اندروید (۲.۲ مگابایت)' : 'Download Official Android AAB (2.2 MB)'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct APK Card */}
              <div className="p-4 rounded-[22px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <Smartphone size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--ink)]">
                        {isRTL ? 'دانلود مستقیم فایل APK اندروید' : 'Direct Android APK Installer'}
                      </h4>
                      <span className="text-xs text-[var(--mute)] font-medium">
                        {isRTL ? 'نصب مستقیم روی گوشی • حجم ۵.۸ مگابایت • نسخه ۱.۰.۴' : 'Direct Install on Android • 5.8 MB • v1.0.4'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={downloadingFile === 'dor-zaban-v1.0.apk'}
                  onClick={async () => {
                    sound.playClick();
                    setDownloadingFile('dor-zaban-v1.0.apk');
                    setDownloadMsg(isRTL ? 'در حال دریافت فایل APK...' : 'Fetching APK...');
                    const res = await downloadFileWithBlob('./downloads/dor-zaban-v1.0.apk', 'dor-zaban-v1.0.apk', (s, msg) => {
                      if (msg) setDownloadMsg(msg);
                    });
                    setDownloadingFile(null);
                    if (!res.success && res.error) setDownloadMsg(res.error);
                  }}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer disabled:opacity-75"
                >
                  {downloadingFile === 'dor-zaban-v1.0.apk' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isRTL ? 'در حال دریافت فایل APK...' : 'Downloading APK...'}</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} strokeWidth={2} />
                      <span>{isRTL ? 'دانلود فایل نصبی APK اندروید (۵.۸ مگابایت)' : 'Download Standalone APK (5.8 MB)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: DATA SAFETY & PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-3.5 text-start">
              {deleteSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{deleteSuccessMsg}</span>
                </div>
              )}
              {exportMsg && (
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                  <span>{exportMsg}</span>
                </div>
              )}

              {/* Data Safety Summary Card */}
              <div className="p-4 rounded-[22px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                  <ShieldCheck size={18} className="text-[var(--turq)]" />
                  <span>{isRTL ? 'شفافیت داده‌ها و امنیت گوگل‌پلی' : 'Google Play Data Safety'}</span>
                </div>

                <div className="space-y-2 text-xs text-[var(--mute)] leading-relaxed">
                  <div className="flex items-start gap-2.5 bg-[var(--panel)] p-2.5 rounded-[16px] border border-[var(--line)]">
                    <Lock size={15} className="text-[var(--lapis)] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--ink)] block font-semibold">{isRTL ? 'رمزنگاری کامل داده‌ها (HTTPS/TLS)' : 'Encryption in Transit'}</strong>
                      {isRTL ? 'کلیه ارتباطات شبکه رمزگذاری شده و با استانداردهای فایربیس گوگل محافظت می‌شوند.' : 'All data transferred between your device and Google cloud is encrypted.'}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-[var(--panel)] p-2.5 rounded-[16px] border border-[var(--line)]">
                    <ShieldCheck size={15} className="text-[var(--turq)] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--ink)] block font-semibold">{isRTL ? 'پردازش صوتی محلی (بدون ضبط صدا)' : 'On-Device Audio Only'}</strong>
                      {isRTL ? 'میکروفون تنها برای تشخیص زنده تلفظ روی گوشی استفاده شده و هیچ صدایی به سرور ارسال نمی‌شود.' : 'Microphone audio is processed strictly on-device in real-time. No audio is recorded or stored.'}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-[var(--panel)] p-2.5 rounded-[16px] border border-[var(--line)]">
                    <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--ink)] block font-semibold">{isRTL ? 'عدم فروش یا اشتراک داده' : 'No 3rd-Party Data Selling'}</strong>
                      {isRTL ? 'اطلاعات شما با هیچ شبکه تبلیغاتی یا بازاریابی به اشتراک گذاشته نمی‌شود.' : 'Your data is never sold, shared, or monetized with advertising networks.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Export */}
              <div className="p-3.5 rounded-[20px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--ink)]">
                    {isRTL ? 'استخراج و دانلود داده‌های من' : 'Export My Data'}
                  </h4>
                  <p className="text-[11px] text-[var(--mute)]">
                    {isRTL ? 'دریافت نسخه JSON از سوابق و رکوردهای شما' : 'Download JSON copy of your records & stats'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="h-9 px-3.5 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <FileDown size={14} />
                  <span>{isRTL ? 'دانلود داده‌ها' : 'Export'}</span>
                </button>
              </div>

              {/* Account Deletion */}
              {currentUser ? (
                <div className="p-4 rounded-[22px] bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
                    <ShieldAlert size={16} />
                    <span>{isRTL ? 'حذف دائمی حساب کاربری و داده‌ها' : 'Permanent Account & Data Deletion'}</span>
                  </div>
                  <p className="text-xs text-rose-600/90 dark:text-rose-400/80 leading-relaxed font-normal">
                    {isRTL 
                      ? 'طبق قوانین گوگل‌پلی، شما در هر زمان می‌توانید حساب کاربری و تمامی سوابق خود را برای همیشه حذف نمایید.' 
                      : 'Per Google Play policy, you can permanently delete your account and all associated cloud data at any time.'}
                  </p>

                  {!deleteConfirmOpen ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                      <span>{isRTL ? 'درخواست حذف دائمی حساب' : 'Delete Account & All Data'}</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-[16px] border border-rose-300 space-y-2.5">
                      <p className="text-xs font-bold text-rose-700">
                        {isRTL ? 'آیا کاملاً مطمئن هستید؟ این عمل غیرقابل بازگشت است و تمام رکوردهای ابری شما پاک خواهند شد.' : 'Are you sure? This action is permanent and cannot be undone.'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isDeletingAccount}
                          onClick={handleDeleteAccount}
                          className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          {isDeletingAccount ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          <span>{isRTL ? 'بله، حذف قطعی' : 'Yes, Delete Permanently'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmOpen(false)}
                          className="px-4 h-9 bg-slate-100 dark:bg-zinc-800 text-[var(--ink)] rounded-full text-xs font-bold cursor-pointer"
                        >
                          {isRTL ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-[18px] bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)] text-center text-xs text-[var(--mute)]">
                  {isRTL ? 'شما به عنوان کاربر مهمان بازی می‌کنید و حسابی در سرور ثبت نشده است.' : 'You are currently playing as a guest with no cloud account.'}
                </div>
              )}

              <div className="pt-1 text-center">
                <a
                  href="./privacy.html#delete-account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--lapis)] hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>{isRTL ? 'مشاهده شرایط حذف از وب و سیاست کامل حریم خصوصی' : 'Web Data Deletion Form & Full Privacy Policy'}</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* MOBILE INSTALLATION CARD (Google Material Design 3 Spec) */}
          <div className="mt-3 p-4 rounded-[22px] bg-slate-50/80 dark:bg-slate-900/60 border border-[var(--line)] space-y-2.5 text-start shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                <Smartphone size={16} className="text-[var(--lapis)]" />
                <span>{isRTL ? 'نصب روی موبایل (Android & iOS)' : 'Mobile App & PWA'}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {isInstalled ? (isRTL ? 'نصب شده ✓' : 'Installed ✓') : (isRTL ? 'آفلاین و سریع' : 'Offline Ready')}
              </span>
            </div>

            <p className="text-xs text-[var(--mute)] leading-relaxed font-normal">
              {isRTL 
                ? 'برنامه را روی گوشی خود نصب کنید تا تمام‌صفحه، آفلاین و سریع در مهمانی‌ها در دسترس باشد.' 
                : 'Install this app on Android or iOS for fast standalone launch and offline play.'}
            </p>

            {isInstalled ? (
              <div className="p-2.5 bg-[var(--panel)] border border-[var(--line)] text-emerald-600 rounded-full flex items-center justify-center gap-2 font-bold text-xs">
                <CheckCircle2 size={16} />
                <span>{isRTL ? 'اپلیکیشن روی این دستگاه نصب شده است!' : 'App is already installed!'}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-0.5">
                {downloadMsg && (
                  <div className="p-2 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                    <Loader2 size={14} className="animate-spin shrink-0" />
                    <span>{downloadMsg}</span>
                  </div>
                )}

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
                  className="w-full h-11 rounded-full bg-[var(--lapis-soft)] hover:bg-[var(--lapis)]/20 text-[var(--lapis)] dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Smartphone size={16} />
                  <span>{isRTL ? 'نصب مستقیم روی گوشی و سایر گزینه‌ها (PWA)' : 'Direct Mobile Install & More Options (PWA)'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Material Design 3 Dialog Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between text-xs">
          <a
            href="./privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--mute)] hover:text-[var(--ink)] flex items-center gap-1.5 font-medium transition-colors"
          >
            <ShieldCheck size={16} />
            <span>{isRTL ? 'حریم خصوصی' : 'Privacy Policy'}</span>
          </a>
          <button 
            type="button"
            onClick={onClose}
            aria-label={isRTL ? 'بازگشت' : 'Back'}
            className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--ink)] text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            {isRTL ? 'بازگشت' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
