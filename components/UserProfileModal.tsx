import React, { useState, useEffect } from 'react';
import { Language, LeaderboardEntry, PersonalRecords } from '../types';
import { getPersonalRecords, fetchLeaderboard } from '../contentEngine';
import { auth, signInWithGoogle, logOut } from '../firebase';
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
  ChevronRight
} from 'lucide-react';

interface Props {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChange?: (user: User | null) => void;
  onOpenInstallModal?: () => void;
  initialTab?: 'records' | 'leaderboard';
}

export const UserProfileModal: React.FC<Props> = ({
  language,
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
  onOpenInstallModal,
  initialTab = 'records'
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'leaderboard'>(initialTab);
  const [records, setRecords] = useState<PersonalRecords>(getPersonalRecords());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isRTL = isRtlLang(language);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      setRecords(getPersonalRecords());
      loadLeaderboard();
    }
  }, [isOpen, initialTab]);

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

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    sound.playClick();
    setIsSigningIn(true);
    try {
      const user = await signInWithGoogle();
      if (onAuthChange) onAuthChange(user);
      sound.playSuccess();
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    sound.playClick();
    try {
      await logOut();
      if (onAuthChange) onAuthChange(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#1E1B2E]/60 backdrop-blur-sm animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[92dvh] flex flex-col bg-[#FFFBF4] text-[#1E1B2E] border-2 border-[#1E1B2E] rounded-[24px] shadow-[6px_6px_0px_0px_#1E1B2E] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with User Info */}
        <div className="bg-[#FFFBF4] p-4 border-b-2 border-[#1E1B2E]/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-[14px] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-[14px] bg-[#F2B63D] text-[#1E1B2E] flex items-center justify-center border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
                  <UserIcon size={24} />
                </div>
              )}
              
              <div className="text-start">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-lg font-bold text-[#1E1B2E] font-display leading-tight">
                    {currentUser?.displayName || (isRTL ? 'حساب کاربری مهمان' : 'Guest Player')}
                  </h2>
                  {currentUser && (
                    <span className="bg-[#1E9E93] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-[6px]">
                      {isRTL ? 'متصل' : 'Synced'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#1E1B2E]/70 font-medium">
                  {currentUser?.email || (isRTL ? 'رکوردهای شما روی این دستگاه ذخیره می‌شود' : 'Scores saved on this device')}
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-[8px] bg-[#F4EDE1] hover:bg-[#ebdcc8] flex items-center justify-center text-[#1E1B2E] border border-[#1E1B2E] transition-transform active:scale-95"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Auth Action Bar */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1E1B2E]/10 text-xs">
            {currentUser ? (
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#F4EDE1] hover:bg-[#ebdcc8] text-[#E0603F] border border-[#1E1B2E] text-[11px] font-bold transition-all shadow-[1px_1px_0px_0px_#1E1B2E]"
              >
                <LogOut size={13} />
                <span>{isRTL ? 'خروج از حساب' : 'Sign Out'}</span>
              </button>
            ) : (
              <button 
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] border-2 border-[#1E1B2E] text-xs font-bold shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5"
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

            <div className="flex items-center gap-1 text-[11px] text-[#1E1B2E]/70 font-medium">
              <ShieldCheck size={14} className="text-[#1E9E93]" />
              <span>{currentUser ? (isRTL ? 'همگام با کلود' : 'Cloud Synced') : (isRTL ? 'حافظه محلی' : 'Local Storage')}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Records & Leaderboard */}
        <div className="flex bg-[#F4EDE1] border-b-2 border-[#1E1B2E]/20 p-1.5 gap-1.5 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('records');
            }}
            className={`flex-1 py-2 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'records'
                ? 'bg-[#FFFBF4] text-[#1E1B2E] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                : 'text-[#1E1B2E]/70 hover:bg-[#FFFBF4]/50 border-2 border-transparent'
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
                ? 'bg-[#FFFBF4] text-[#1E1B2E] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                : 'text-[#1E1B2E]/70 hover:bg-[#FFFBF4]/50 border-2 border-transparent'
            }`}
          >
            <Trophy size={14} />
            <span>{isRTL ? '🏆 لیدربرد و رتبه‌بندی' : '🏆 Leaderboard'}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-ui">
          
          {/* TAB 1: PERSONAL RECORDS */}
          {activeTab === 'records' && (
            <div className="space-y-3">
              <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] flex items-center justify-between">
                <div className="text-start">
                  <span className="text-[10px] text-[#E0603F] font-bold uppercase tracking-wider block">
                    {isRTL ? 'بهترین رکورد ثبت‌شده شما' : 'Your Personal Best'}
                  </span>
                  <div className="text-2xl font-bold text-[#1E1B2E] font-display">
                    {records.highestScore} <span className="text-xs text-[#E0603F]">PTS</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-[14px] bg-[#F2B63D] text-[#1E1B2E] flex items-center justify-center border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
                  <Trophy size={26} />
                </div>
              </div>

              {/* 4-Stat Grid */}
              <div className="grid grid-cols-2 gap-2">
                
                {/* Max Streak */}
                <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] text-start">
                  <div className="flex items-center gap-1 text-[#E0603F] text-xs font-bold mb-1">
                    <Flame size={15} />
                    <span>{isRTL ? 'بیشترین کمبو' : 'Max Streak'}</span>
                  </div>
                  <div className="text-xl font-bold text-[#1E1B2E] font-display">
                    {records.longestStreak} <span className="text-xs font-ui text-[#1E1B2E]/60 font-medium">پاسخ متوالی</span>
                  </div>
                </div>

                {/* Fastest Answer */}
                <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] text-start">
                  <div className="flex items-center gap-1 text-[#1E9E93] text-xs font-bold mb-1">
                    <Timer size={15} />
                    <span>{isRTL ? 'سریع‌ترین پاسخ' : 'Fastest Answer'}</span>
                  </div>
                  <div className="text-xl font-bold text-[#1E1B2E] font-display">
                    {records.fastestAnswerSeconds > 0 ? `${records.fastestAnswerSeconds}s` : '---'}
                  </div>
                </div>

                {/* Best Accuracy */}
                <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] text-start">
                  <div className="flex items-center gap-1 text-[#1E9E93] text-xs font-bold mb-1">
                    <CheckCircle2 size={15} />
                    <span>{isRTL ? 'بالاترین دقت' : 'Best Accuracy'}</span>
                  </div>
                  <div className="text-xl font-bold text-[#1E1B2E] font-display">
                    {records.highestAccuracy}%
                  </div>
                </div>

                {/* Total Words & Sessions */}
                <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] text-start">
                  <div className="flex items-center gap-1 text-[#F2B63D] text-xs font-bold mb-1">
                    <BookOpen size={15} />
                    <span>{isRTL ? 'دورهای بازی‌شده' : 'Rounds Played'}</span>
                  </div>
                  <div className="text-xl font-bold text-[#1E1B2E] font-display">
                    {records.totalRoundsCompleted} <span className="text-xs font-ui text-[#1E1B2E]/60 font-medium">دور</span>
                  </div>
                </div>

              </div>

              {/* Motivational Banner */}
              <div className="bg-[#FFFBF4] border-2 border-[#E0603F] p-3 rounded-[14px] flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_#1E1B2E]">
                <p className="text-xs font-bold text-[#1E1B2E] leading-relaxed text-start">
                  {isRTL 
                    ? '💡 برای شکستن رکورد خود وارد چالش تک‌نفره شو! در هر دور زمان کم‌تر و سرعت بیشتر می‌شود.' 
                    : '💡 Jump into Single-Player to beat your high score! Timer tightens every round.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#1E1B2E]/80 font-bold pb-1">
                <span>{isRTL ? 'برترین بازیکنان جهان و محلی' : 'Top Global Players'}</span>
                <button
                  onClick={loadLeaderboard}
                  disabled={isLoadingLeaderboard}
                  className="flex items-center gap-1 text-[#E0603F] hover:underline font-bold"
                >
                  <RefreshCw size={12} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
                  <span>{isRTL ? 'تازه‌سازی' : 'Refresh'}</span>
                </button>
              </div>

              {isLoadingLeaderboard && leaderboard.length === 0 ? (
                <div className="py-10 text-center text-[#1E1B2E]/60 text-xs font-bold flex flex-col items-center gap-2">
                  <RefreshCw size={22} className="animate-spin text-[#E0603F]" />
                  <span>{isRTL ? 'در حال دریافت رتبه‌ها...' : 'Loading ranks...'}</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-8 text-center bg-[#F4EDE1] rounded-[16px] border-2 border-[#1E1B2E] p-4">
                  <Trophy size={32} className="mx-auto text-[#F2B63D] mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#1E1B2E]/70">
                    {isRTL ? 'هنوز رکوردی ثبت نشده است. اولین نفری باشید که رکورد می‌زند!' : 'No records yet. Be the first to post a score!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.map((entry, index) => {
                    const isTop3 = index < 3;
                    const medalBg = index === 0 ? '#F2B63D' : index === 1 ? '#e2e8f0' : index === 2 ? '#fed7aa' : null;

                    return (
                      <div 
                        key={entry.id || index}
                        className={`flex items-center justify-between p-2.5 rounded-[14px] border-2 border-[#1E1B2E] transition-transform ${
                          index === 0 
                            ? 'bg-[#FFF8FD] shadow-[2px_2px_0px_0px_#1E1B2E]' 
                            : 'bg-[#F4EDE1]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 text-start">
                          <div 
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center font-bold text-xs shrink-0 border border-[#1E1B2E]"
                            style={{ 
                              backgroundColor: medalBg || '#FFFBF4', 
                              color: '#1E1B2E' 
                            }}
                          >
                            {isTop3 ? <Medal size={15} /> : `#${index + 1}`}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#1E1B2E] truncate max-w-[140px]">
                              {entry.playerName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#1E1B2E]/70 font-medium">
                              <FlagIcon language={entry.targetLanguage} size={12} />
                              <span>دقت: {entry.accuracy}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-end shrink-0">
                          <div className="text-sm font-bold text-[#E0603F] font-display">
                            {entry.score} <span className="text-[10px] text-[#1E1B2E]/60 font-ui font-medium">PTS</span>
                          </div>
                          <span className="text-[9.5px] text-[#1E1B2E]/50 font-medium">{entry.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MOBILE INSTALL AT THE BOTTOM OF THE LIST */}
          <div className="mt-4 pt-3 border-t-2 border-[#1E1B2E]/20 space-y-2 shrink-0 text-start">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1B2E]">
                <Smartphone size={15} />
                <span>{isRTL ? '📲 نصب روی موبایل (Android & iOS)' : '📲 Mobile App & PWA'}</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#1E9E93] bg-[#FFFBF4] px-2 py-0.5 rounded-[6px] border border-[#1E1B2E]">
                {isInstalled ? (isRTL ? 'نصب شده ✓' : 'Installed ✓') : (isRTL ? 'آفلاین و سریع' : 'Offline Ready')}
              </span>
            </div>

            <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] space-y-2">
              <p className="text-[11.5px] text-[#1E1B2E]/80 leading-relaxed font-medium">
                {isRTL 
                  ? 'برنامه را مانند یک اپلیکیشن بومی روی صفحه گوشی خود اضافه کنید تا تمام‌صفحه و با سرعت بالا اجرا شود.' 
                  : 'Install this app on Android or iOS for fast standalone launch and offline play.'}
              </p>

              {isInstalled ? (
                <div className="p-2.5 bg-[#FFFBF4] border-2 border-[#1E1B2E] text-[#1E9E93] rounded-[12px] flex items-center justify-center gap-2 font-bold text-xs shadow-[2px_2px_0px_0px_#1E1B2E]">
                  <CheckCircle2 size={16} />
                  <span>{isRTL ? 'اپلیکیشن روی این دستگاه نصب شده است!' : 'App is already installed!'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    sound.playClick();
                    if (isInstallable) {
                      await install();
                    } else if (onOpenInstallModal) {
                      onOpenInstallModal();
                    }
                  }}
                  className="pixel-btn pixel-btn-orange w-full py-2.5 px-3 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={15} />
                  <span>{isRTL ? 'نصب مستقیم روی گوشی (PWA / اندروید)' : 'Install on Mobile Device'}</span>
                </button>
              )}

              {/* Quick helper tip */}
              <div className="text-[10px] text-[#1E1B2E]/70 font-medium bg-[#FFFBF4] p-2 rounded-[10px] border border-[#1E1B2E] leading-relaxed">
                {isRTL 
                  ? '💡 در مرورگر Chrome: منوی ۳ نقطه بالا را بزنید و گزینه «افزودن به صفحه اصلی» (Install App) را انتخاب کنید.' 
                  : '💡 In Chrome: Tap 3 dots menu and select "Install App" or "Add to Home Screen".'}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FFFBF4] border-t-2 border-[#1E1B2E]/20 flex items-center justify-between text-[11px] text-[#1E1B2E]/70 font-medium">
          <span>{isRTL ? 'نسخه ۳.۰ • طراحی Tabletop' : 'v3.0 • Tabletop Design'}</span>
          <button 
            onClick={onClose}
            className="px-3 py-1 rounded-[8px] bg-[#F4EDE1] hover:bg-[#ebdcc8] text-[#1E1B2E] border border-[#1E1B2E] font-bold"
          >
            {isRTL ? 'بستن' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
