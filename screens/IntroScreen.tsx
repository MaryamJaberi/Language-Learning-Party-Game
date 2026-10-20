import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, NATIVE_LANGUAGE_NAMES } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import InstallPromptModal from '../components/InstallPromptModal';
import { FlagIcon } from '../components/FlagIcon';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LanguagePickerModal } from '../components/LanguagePickerModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import ArcadeBackground from '../components/ArcadeBackground';
import { 
  Gamepad2, 
  Trophy, 
  BookOpen, 
  Sparkles, 
  Zap, 
  LogIn, 
  LogOut as LogOutIcon, 
  Globe, 
  CheckCircle,
  CloudCheck,
  Smartphone,
  Download,
  Mic,
  GraduationCap,
  History,
  Lock,
  X,
  ChevronRight,
  ChevronLeft,
  Users,
  User as UserIcon,
  ChevronDown,
  Award,
  Swords,
  Box,
  Bot,
  MapPin
} from 'lucide-react';
import { tUI, isRtlLang } from '../ui';
import { GameSettings } from '../types';
import { CEFR_LEVELS, isAdminUser } from '../constants';
import { AICoachChatModal } from '../components/AICoachChatModal';
import { AdminMeetupMapModal } from '../components/AdminMeetupMapModal';

interface Props {
  language: Language;
  settings?: GameSettings;
  onUpdateSettings?: (s: GameSettings) => void;
  onLanguageChange: (l: Language) => void;
  onNext: () => void;
  onOpenSinglePlayer: () => void;
  onOpenDuel?: () => void;
  onOpenOnline: () => void;
  onOpenLeitner?: () => void;
  onOpenHistory: () => void;
  onOpenLeaderboard?: () => void;
  onOpenHelp?: () => void;
  onResumeSession?: () => void;
  onDiscardSession?: () => void;
}

const IntroScreen: React.FC<Props> = ({ 
  language, 
  settings,
  onUpdateSettings,
  onLanguageChange, 
  onNext, 
  onOpenSinglePlayer,
  onOpenDuel,
  onOpenOnline,
  onOpenLeitner,
  onOpenHistory, 
  onOpenHelp,
  onResumeSession,
  onDiscardSession
}) => {
  const t = tUI(language);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [mascotBounce, setMascotBounce] = useState(false);
  const [partyEmote, setPartyEmote] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);
  const [isHistoryLoginModalOpen, setIsHistoryLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'records' | 'leaderboard'>('records');
  const [isAdminMeetupMapOpen, setIsAdminMeetupMapOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [isPartyChoiceModalOpen, setIsPartyChoiceModalOpen] = useState(false);

  // Check for restorable game session saved in localStorage
  const [savedSession, setSavedSession] = useState<{ round: number; maxRounds: number; timestamp: number } | null>(() => {
    try {
      const raw = localStorage.getItem('dour_active_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000)) {
        return {
          round: parsed.currentRound || 1,
          maxRounds: parsed.settings?.roundsCount || 3,
          timestamp: parsed.timestamp
        };
      }
    } catch {}
    return null;
  });

  // Animated gentle guide invitation nudge
  const [hasSeenGuideNudge, setHasSeenGuideNudge] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dor_guide_nudge_seen') === 'true';
    } catch {
      return false;
    }
  });

  const handleOpenHelpWithNudge = () => {
    sound.playClick();
    setHasSeenGuideNudge(true);
    try {
      localStorage.setItem('dor_guide_nudge_seen', 'true');
    } catch {}
    onOpenHelp?.();
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const currentCefr = settings?.cefrLevel || 'all';
  const activeCefrInfo = CEFR_LEVELS.find(l => l.id === currentCefr) || CEFR_LEVELS[5]; // default all

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Listen for PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandaloneMedia = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
      if (isStandaloneMedia || (navigator as any)?.standalone) {
        setIsAppInstalled(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isRTL = isRtlLang(language);

  const handleMascotClick = () => {
    sound.playCorrect();
    setMascotBounce(true);
    const emotes = ['⚡', '✨', '🎉', '💖', '⭐', '🌟', '🚀', '🔥'];
    setPartyEmote(emotes[Math.floor(Math.random() * emotes.length)]);
    setTimeout(() => setMascotBounce(false), 400);
    setTimeout(() => setPartyEmote(null), 900);
  };

  const handleGoogleAuth = async () => {
    sound.playClick();
    if (user) {
      await logOut();
    } else {
      setIsAuthLoading(true);
      try {
        await signInWithGoogle();
      } catch (e) {
        console.error(e);
      } finally {
        setIsAuthLoading(false);
      }
    }
  };

  const handleOpenInstall = () => {
    sound.playClick();
    setIsInstallModalOpen(true);
  };

  const handleHistoryClick = () => {
    sound.playClick();
    setProfileInitialTab('history');
    setIsProfileModalOpen(true);
  };

  const handleLoginForHistory = async () => {
    setIsAuthLoading(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setIsHistoryLoginModalOpen(false);
        onOpenHistory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3.5 sm:p-4 text-center select-none overflow-y-auto overscroll-contain bg-[var(--bg)] text-[var(--ink)] font-ui relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Retro Arcade Ambient Background (Exclusive to Intro Page) */}
      <ArcadeBackground />
      
      {/* Top Bar: Material 3 Top App Bar (44x44dp Touch Targets, Symmetrical Spacing) */}
      <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between px-1 mb-3 shrink-0 gap-3">
        {/* Language button: Flag icon (M3 Outlined/Tonal Circular Action) */}
        <button
          id="header-language-btn"
          data-testid="header-language-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            setIsLanguageModalOpen(true);
          }}
          className="w-11 h-11 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-[var(--line)] shadow-xs text-xs font-bold text-[var(--ink)] active:scale-95 transition-all cursor-pointer shrink-0"
          title={`${t.changeLanguage} (${currentLangInfo.nativeName || currentLangInfo.name})`}
          aria-label={t.changeLanguage || (isRTL ? 'تغییر زبان' : 'Change Language')}
        >
          <FlagIcon language={language} size={22} />
        </button>

        {/* Top Controls: Sound, Help & Profile (Consistent 44x44dp M3 Action Group) */}
        <div className="flex items-center gap-2">
          {/* Sound Mute / Unmute Button */}
          <SoundHeaderButton variant="icon-only" language={language} className="w-11 h-11 p-0 justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs active:scale-95 transition-all" />

          {/* Help / Guide button */}
          <button
            id="header-guide-btn"
            onClick={handleOpenHelpWithNudge}
            aria-label={t.guide || (isRTL ? 'راهنما' : 'Guide')}
            className="w-11 h-11 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] border border-[var(--line)] rounded-full shadow-xs active:scale-95 transition-all cursor-pointer relative"
            title={t.gameRules || (isRTL ? 'راهنمای بازی' : 'Game Rules')}
          >
            <BookOpen size={20} className={!hasSeenGuideNudge ? 'text-[var(--lapis)] animate-pulse' : ''} />
            {!hasSeenGuideNudge && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--saffron)] border-2 border-[var(--panel)] shadow-xs animate-ping" />
            )}
            {!hasSeenGuideNudge && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--saffron)] border-2 border-[var(--panel)] shadow-xs" />
            )}
          </button>

          {/* AI Coach & Referee Button (Gemini AI) */}
          <button
            id="header-ai-coach-btn"
            onClick={() => {
              sound.playClick();
              setIsAICoachOpen(true);
            }}
            aria-label="مربی و داور هوشمند دور (Gemini AI)"
            className="w-11 h-11 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 border border-amber-400/40 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer relative"
            title="مربی هوشمند و داور بازی دور (Gemini AI)"
          >
            <Bot size={20} className="text-amber-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
          </button>

          {/* Admin Meetup & Venue Map (Google Maps Grounding - Admin Only) */}
          {isAdminUser(user?.email) && (
            <button
              id="header-admin-map-btn"
              onClick={() => {
                sound.playClick();
                setIsAdminMeetupMapOpen(true);
              }}
              aria-label="نقشه کافه‌ها و قرارهای بازی (Google Maps)"
              className="w-11 h-11 flex items-center justify-center bg-teal-500/15 hover:bg-teal-500/25 text-[var(--turq)] border border-[var(--turq)] rounded-full shadow-xs active:scale-95 transition-all cursor-pointer relative"
              title="نقشه قرارهای بازی و کافه‌ها با Google Maps (ویژه مدیر)"
            >
              <MapPin size={20} className="text-[var(--turq)] animate-pulse" />
              <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
            </button>
          )}

          {/* User Profile button (Hosts History, Records & Leaderboard) */}
          <button
            id="header-profile-btn"
            onClick={handleHistoryClick}
            aria-label={isRTL ? 'پروفایل و لیدربرد و تاریخچه' : 'Profile, History & Leaderboard'}
            className="w-11 h-11 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] border border-[var(--line)] rounded-full shadow-xs active:scale-95 transition-all cursor-pointer relative"
            title={isRTL ? 'پروفایل و لیدربرد و تاریخچه' : 'Profile, History & Leaderboard'}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full border border-[var(--line)] object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon size={20} />
            )}
            {/* Small status dot if logged in */}
            {user && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--panel)]" />
            )}
          </button>
        </div>
      </div>

      {/* Friendly, Non-intrusive Animated Guide Invitation Nudge */}
      {!hasSeenGuideNudge && (
        <div 
          onClick={handleOpenHelpWithNudge}
          className="w-full max-w-sm sm:max-w-md mx-auto mb-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-[var(--lapis-soft)] via-[var(--panel)] to-[var(--lapis-soft)] border border-[var(--lapis)]/40 hover:border-[var(--lapis)] shadow-xs flex items-center justify-between gap-2.5 cursor-pointer transition-all active:scale-[0.98] group animate-fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0 text-start">
            <div className="w-8 h-8 rounded-xl bg-[var(--lapis)] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform animate-bounce">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-[var(--ink)] flex items-center gap-1.5 truncate">
                <span>{isRTL ? '✨ با ۴ سبک جذاب بازی «دور» آشنا شوید!' : '✨ Discover the 4 exciting game modes!'}</span>
              </div>
              <div className="text-[10px] text-[var(--mute)] font-medium truncate">
                {isRTL ? 'دورهمی تیمی • دوئل دونفره • چالش تک‌نفره • جعبه لایتنر' : 'Team Party • 2P Duel • Single-Player • Leitner Box'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] bg-[var(--lapis)] text-white font-black px-2.5 py-1 rounded-lg shadow-2xs group-hover:brightness-110 flex items-center gap-1">
              <span>{isRTL ? 'راهنما 📖' : 'Guide 📖'}</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                setHasSeenGuideNudge(true);
                try {
                  localStorage.setItem('dor_guide_nudge_seen', 'true');
                } catch {}
              }}
              className="p-1 rounded-full text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--line)]/50 cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Modern Card Area (Material Design 3 Surface Container) */}
      <div className="relative w-full max-w-sm sm:max-w-md mx-auto my-auto shrink-0">
        <div className="bg-[var(--panel)] border border-[var(--line)] p-5 sm:p-6 text-center flex flex-col justify-center min-h-[170px] sm:min-h-[185px] rounded-[24px] shadow-sm transition-all">
          {/* Interactive Mascot & Hero Title */}
          <div className="py-1 flex flex-col items-center">
            {/* Mascot Character with bouncy party feel */}
            <div 
              onClick={handleMascotClick}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95 inline-block relative mb-2.5 select-none"
              title={isRTL ? 'برای شادی بزن روی کاراکتر!' : 'Tap mascot for party cheer!'}
            >
              <TeamMascot color="BLUE" size={60} className={mascotBounce ? 'animate-bounce' : ''} />
              {partyEmote && (
                <span className="absolute -top-3 -right-2 text-2xl animate-ping select-none">{partyEmote}</span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-[var(--ink)] leading-none tracking-tight font-display mb-1.5">
              {t.title || 'دور'}
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-[var(--lapis)] leading-snug font-display max-w-xs mx-auto">
              {t.subtitle || (isRTL ? 'هیجان حدس کلمات و یادگیری زبان' : 'Word Guessing Party Game')}
            </h2>
          </div>
        </div>
      </div>

      {/* 3 EQUAL-VALUE GAME MODES (سه حالت بازی هم‌ارزش) */}
      <div className="w-full max-w-sm sm:max-w-md space-y-2.5 my-auto shrink-0 font-ui">
        {/* RECOVERY BANNER: Resume previous active session */}
        {savedSession && (
          <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/35 text-start space-y-2 animate-fade-in shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⏳</span>
                <span className="text-xs sm:text-sm font-black text-[var(--ink)]">
                  {isRTL 
                    ? `ادامه بازی دورهمی قبلی (راند ${savedSession.round} از ${savedSession.maxRounds})`
                    : `Resume Previous Match (Round ${savedSession.round} of ${savedSession.maxRounds})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('dour_active_session');
                  } catch {}
                  setSavedSession(null);
                  onDiscardSession?.();
                }}
                className="text-xs font-bold text-[var(--mute)] hover:text-rose-500 p-1"
                title={isRTL ? 'حذف و شروع تازه' : 'Discard'}
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onResumeSession?.();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
              >
                <span>{isRTL ? 'ادامه بازی (مکث‌شده)' : 'Resume Match'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('dour_active_session');
                  } catch {}
                  setSavedSession(null);
                  onDiscardSession?.();
                }}
                className="py-2 px-3 rounded-xl bg-[var(--panel)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--mute)] font-bold text-xs cursor-pointer"
              >
                <span>{isRTL ? 'شروع تازه' : 'Start Fresh'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 1: بازی دورهمی گروهی (Group Party - Local Pass&Play + Online Multiplayer Room) */}
        <div 
          id="intro-party-btn"
          role="button"
          tabIndex={0}
          aria-label={isRTL ? 'شروع بازی دورهمی' : 'Start Party Game'}
          onClick={() => {
            sound.playStartGame();
            onNext();
          }}
          className="group relative w-full p-3.5 sm:p-4 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--lapis)] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-start"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-black text-[var(--ink)] leading-tight">
                  {isRTL ? 'شروع بازی دورهمی' : (t.startNewGame || 'Start New Game')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] shrink-0">
                  {isRTL ? '۴ تا ۸ نفره' : '4-8 Players'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--mute)] font-medium truncate mt-0.5">
                {isRTL ? 'بازی دور یک میز + اتاق آنلاین تیمی' : 'Pass & Play + Online Room'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="intro-online-btn"
              aria-label={t.onlineRoom || (isRTL ? 'اتاق آنلاین' : 'Online Room')}
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onOpenOnline();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--turq)] text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              title={isRTL ? 'اتاق آنلاین تیمی از راه دور' : 'Online Multiplayer'}
            >
              <Globe size={12} />
              <span>{isRTL ? 'آنلاین' : 'Online'}</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shrink-0">
              {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>
        </div>

        {/* MODE 2: دوئل دونفره (1v1 Speed Duel - Local & Online) */}
        <div
          id="intro-duel-btn"
          onClick={() => {
            sound.playClick();
            onOpenDuel?.();
          }}
          className="group relative w-full p-3.5 sm:p-4 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--line)] hover:border-rose-400 dark:hover:border-rose-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-start"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Swords size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-black text-[var(--ink)] leading-tight">
                  {isRTL ? 'دوئل دونفره ⚔️' : '1v1 Speed Duel ⚔️'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                  {isRTL ? '۲ نفره' : '2 Players'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--mute)] font-medium truncate mt-0.5">
                {isRTL ? 'مسابقه سرعتی، شوک خرابکاری و هیجان' : 'Reflex Match, Sabotage Shocks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
            <Zap size={13} />
            <span>{isRTL ? 'دوئل' : 'Duel'}</span>
          </div>
        </div>

        {/* MODE 3: چالش تک‌نفره (Solo Challenge & Leitner) */}
        <div
          id="intro-single-player-btn"
          onClick={() => {
            sound.playClick();
            onOpenSinglePlayer();
          }}
          className="group relative w-full p-3.5 sm:p-4 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--turq)] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-start"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[var(--turq)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-black text-[var(--ink)] leading-tight">
                  {isRTL ? 'چالش تک‌نفره' : 'Solo Challenge'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-[var(--turq)] shrink-0">
                  {isRTL ? 'انفرادی' : 'Solo Run'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--mute)] font-medium truncate mt-0.5">
                {isRTL ? 'تلفظ صوتی، فلش‌کارت و جعبه لایتنر' : 'Voice, Flashcards & Practice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-teal-50 dark:bg-teal-950/40 text-[var(--turq)] px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
            <BookOpen size={13} />
            <span>{isRTL ? 'تمرین' : 'Learn'}</span>
          </div>
        </div>

        {/* Legal & Privacy Policy Link for Google Play Compliance */}
        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[var(--mute)] font-medium">
          <button
            type="button"
            onClick={() => {
              setProfileInitialTab('privacy');
              setIsProfileModalOpen(true);
            }}
            className="hover:text-[var(--ink)] underline underline-offset-4 transition-colors cursor-pointer"
          >
            {isRTL ? 'حریم خصوصی' : 'Privacy Policy'}
          </button>
          <span>•</span>
          <a
            href="./privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)] underline underline-offset-4 transition-colors cursor-pointer"
          >
            {isRTL ? 'خط‌مشی وب' : 'Web Policy'}
          </a>
          <span>•</span>
          <span className="opacity-75 font-mono text-[11px]">v1.0.5</span>
        </div>
      </div>

      {/* Install Prompt & Guide Modal */}
      <InstallPromptModal
        language={language}
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsAppInstalled(true)}
        currentUser={user}
      />

      {/* User Profile, Personal Records & Leaderboard Modal */}
      <UserProfileModal
        language={language}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={user}
        onAuthChange={(u) => setUser(u)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        initialTab={profileInitialTab}
        onOpenLeitner={onOpenLeitner}
        onOpenAdminMeetupMap={() => {
          setIsProfileModalOpen(false);
          setIsAdminMeetupMapOpen(true);
        }}
      />

      {/* Full 38+ Language Picker Modal */}
      <LanguagePickerModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLanguage={language}
        onSelectLanguage={(lang) => {
          onLanguageChange(lang);
          setIsLanguageModalOpen(false);
        }}
        mode="single"
        title={t.languageSelectTitle || (isRTL ? 'انتخاب زبان برنامه و بازی' : 'Select App & Game Language')}
        subtitle={t.all38Languages || (isRTL ? 'پشتیبانی از بیش از ۳۵ زبان دنیا' : 'Over 35 supported languages')}
        isRTL={isRTL}
      />

      {/* Game Mode Selection Modal */}
      {isGameModeModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setIsGameModeModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-[var(--shadow)] overflow-hidden text-[var(--ink)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[var(--panel)] p-4 flex items-center justify-between border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center font-bold shadow-[var(--shadow-sm)] border border-[var(--line)]">
                  <Gamepad2 size={20} />
                </div>
                <div className="text-start">
                  <h2 className="text-base sm:text-lg font-bold font-display tracking-tight text-[var(--ink)]">
                    {t.chooseGameMode || (isRTL ? 'نوع بازی را انتخاب کنید' : 'Choose Game Mode')}
                  </h2>
                  <p className="text-[11px] text-[var(--mute)] font-medium">
                    {t.selectChallengeMode || (isRTL ? 'حالت مسابقه مورد نظر خود را آغاز نمایید' : 'Select your preferred challenge mode')}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsGameModeModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center transition-transform active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Cards */}
            <div className="p-3.5 space-y-2.5 max-h-[75vh] overflow-y-auto">
              
              {/* Option 1: Pass & Play / Local Party */}
              <div 
                onClick={() => {
                  sound.playStartGame();
                  setIsGameModeModalOpen(false);
                  onNext();
                }}
                className="p-3 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] rounded-[18px] cursor-pointer transition-all active:scale-[0.98] shadow-[var(--shadow-sm)] flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center font-bold">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        {t.localPartyMode || (isRTL ? '۱. بازی دورهمی تیمی' : '1. Team Party Game')}
                      </h3>
                      <span className="text-[10px] text-[var(--teal)] font-bold">
                        {t.localPartyDesc || (isRTL ? '۲ تا ۸ بازیکن • مسابقه تیمی دورهمی' : '2 to 8 players • Team match')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[var(--saffron)] text-[var(--ink)] px-2.5 py-1 rounded-xl shadow-[var(--shadow-sm)] border border-[var(--line)]">
                    {t.start || (isRTL ? 'شروع ➔' : 'Start ➔')}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--mute)] font-medium leading-relaxed text-start">
                  {t.localPartySub || (isRTL 
                    ? 'مسابقه جذاب تیمی! تایمر زنگ‌دار، چرخ شانس موضوعات و کارت‌های واژگان برای دورهمی‌های پرشور دوستانه و خانوادگی.'
                    : 'Energetic team match! Buzzer timer, category wheel, and vocabulary cards for friends and family gatherings.')}
                </p>
              </div>

              {/* Option 2: Single Player Comprehensive Study & Practice */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setIsGameModeModalOpen(false);
                  onOpenSinglePlayer();
                }}
                className="p-3 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] rounded-[18px] cursor-pointer transition-all active:scale-[0.98] shadow-[var(--shadow-sm)] flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--vermilion)] text-white flex items-center justify-center font-bold">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        {t.singlePlayer || (isRTL ? '۲. یادگیری و تمرین تک‌نفره' : '2. Solo Study & Practice')}
                      </h3>
                      <span className="text-[10px] text-[var(--teal)] font-bold">
                        {t.singlePlayerSub || (isRTL ? 'فلش‌کارت، تستی، تایپ، تلفظ صوتی و لایتنر' : 'Flashcards, Quiz, Typing, Voice & Leitner')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[var(--vermilion)] text-white px-2.5 py-1 rounded-xl shadow-[var(--shadow-sm)]">
                    {t.start || (isRTL ? 'شروع ➔' : 'Start ➔')}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--mute)] font-medium leading-relaxed text-start">
                  {t.singlePlayerDetail || (isRTL 
                    ? 'پکیج کامل یادگیری زبان: آزمون‌های ۴ گزینه‌ای، املا و تایپ، سنجش تلفظ با گفتار، مرور با جعبه لایتنر و ثبت رکورد در لیدربرد.'
                    : 'Complete learning suite: 4-choice quizzes, spelling & typing, speech pronunciation scoring, Leitner spaced repetition, and leaderboard records.')}
                </p>
              </div>

              {/* Option 3: Online Multiplayer */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setIsGameModeModalOpen(false);
                  onOpenOnline();
                }}
                className="p-3 bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] rounded-[18px] cursor-pointer transition-all active:scale-[0.98] shadow-[var(--shadow-sm)] flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--teal)] text-white flex items-center justify-center font-bold">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        {t.onlineMultiplayer || (isRTL ? '۳. بازی آنلاین چندنفره (از راه دور)' : '3. Online Multiplayer (Remote Rooms)')}
                      </h3>
                      <span className="text-[10px] text-[var(--mute)] font-bold">
                        {t.onlineMultiplayerDesc || (isRTL ? 'اتاق‌های مجازی • کد دعوت ۶ رقمی' : 'Virtual rooms • 6-digit invite code')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[var(--teal)] text-white px-2.5 py-1 rounded-xl shadow-[var(--shadow-sm)]">
                    {t.joinGameBtn || (isRTL ? 'ورود ➔' : 'Join ➔')}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--mute)] font-medium leading-relaxed text-start">
                  {t.onlineMultiplayerSub || (isRTL 
                    ? 'از هر فاصله‌ای با دوستان خود بازی کنید! ساخت اتاق اختصاصی یا ورود با کد دعوت جهت مسابقه آنلاین تیمی.'
                    : 'Play with friends from anywhere! Host a custom room or join via invite code for real-time multiplayer.')}
                </p>
              </div>

              {/* Option 4: Two-Player 1v1 Duel (Local & Online Match) */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setIsGameModeModalOpen(false);
                  onOpenDuel?.();
                }}
                className="p-3 bg-gradient-to-br from-blue-50/60 to-red-50/60 dark:from-blue-950/20 dark:to-red-950/20 hover:bg-[var(--panel)] border-2 border-dashed border-[#2347C5]/40 rounded-[18px] cursor-pointer transition-all active:scale-[0.98] shadow-[var(--shadow-sm)] flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2347C5] to-[#E0533C] text-white flex items-center justify-center font-bold">
                      <Swords size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        {isRTL ? '۴. دوئل دونفره (حضوری یا مچ آنلاین)' : '4. 1v1 Duel (Local & Online Match)'}
                      </h3>
                      <span className="text-[10px] text-[#E0533C] font-bold">
                        {isRTL ? 'مسابقه همزمان دو نفره • حضوری یا آنلاین' : 'Head-to-head reflex race • Local or online'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[#E0533C] text-white px-2.5 py-1 rounded-xl shadow-[var(--shadow-sm)]">
                    {isRTL ? 'دوئل ⚔️' : 'Duel ⚔️'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--mute)] font-medium leading-relaxed text-start">
                  {isRTL 
                    ? 'مسابقه سرعتی دو نفره به صورت حضوری یا مچ آنلاین اینترنتی! پاسخ سریع‌تر به واژگان، طناب‌کشی امتیازی و راند نهایی.'
                    : 'Fast-paced 1v1 duel playable locally or via online matchmaking! Fastest reflex to tap the correct target word wins the round.'}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] text-center">
              <button
                type="button"
                onClick={() => setIsGameModeModalOpen(false)}
                className="text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
              >
                {t.close || (isRTL ? 'بستن پنجره' : 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Login Required Modal */}
      {isHistoryLoginModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setIsHistoryLoginModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-[var(--shadow)] overflow-hidden text-[var(--ink)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[var(--panel)] p-4 text-center border-b border-[var(--line)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center mx-auto mb-2 shadow-[var(--shadow-sm)] border border-[var(--line)]">
                <History size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                {t.signInForHistory || (isRTL ? 'ورود به حساب برای مشاهده تاریخچه' : 'Sign in to access Game History')}
              </h3>
            </div>

            <div className="p-4 space-y-3 text-center">
              <p className="text-xs text-[var(--mute)] font-medium leading-relaxed">
                {t.signInHistoryDesc || (isRTL 
                  ? 'سوابق مسابقات، امتیازات تیمی، کلمات یادگرفته‌شده و رکوردهای شما به صورت ابری ذخیره می‌شوند. برای مشاهده تاریخچه و ادامه، با حساب گوگل خود وارد شوید.'
                  : 'Your match logs, scores, learned vocabulary, and records are saved to the cloud. Please sign in with your Google account to access your history.')}
              </p>

              <button
                type="button"
                onClick={handleLoginForHistory}
                disabled={isAuthLoading}
                className="w-full py-2.5 bg-[var(--teal)] hover:bg-[#18837a] text-white font-bold text-sm rounded-[14px] shadow-[var(--shadow-sm)] active:translate-y-0.5 flex items-center justify-center gap-2 transition-all"
              >
                <LogIn size={16} />
                <span>{isAuthLoading ? (t.connecting || 'Connecting...') : (t.signInWithGoogle || 'Sign in with Google')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHistoryLoginModalOpen(false)}
                className="w-full py-2 text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
              >
                {t.cancel || (isRTL ? 'انصراف' : 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Party Mode Choice Modal: Pass & Play vs Online Room */}
      {isPartyChoiceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setIsPartyChoiceModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-2xl p-5 space-y-4 text-[var(--ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div className="text-start">
                  <h3 className="font-bold text-base text-[var(--ink)]">
                    {isRTL ? 'انتخاب سبک دورهمی گروهی' : 'Choose Group Party Style'}
                  </h3>
                  <p className="text-[11px] text-[var(--mute)] font-medium">
                    {isRTL ? 'حضوری دور یک میز یا آنلاین از راه دور؟' : 'Local or Remote Room?'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPartyChoiceModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                aria-label="بستن"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  sound.playStartGame();
                  setIsPartyChoiceModalOpen(false);
                  onNext();
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[var(--lapis)] to-[#1b3ca8] text-white flex items-center justify-between hover:brightness-105 active:scale-98 transition-all shadow-xs text-start cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Sparkles size={20} className="text-[var(--saffron)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">
                      {isRTL ? 'بازی دورهمی حضوری (یک گوشی)' : 'Pass & Play (1 Phone)'}
                    </h4>
                    <p className="text-[11px] text-white/80 font-normal mt-0.5">
                      {isRTL ? '۴ تا ۸ بازیکن دور هم، دست به دست کردن گوشی' : 'Pass phone around table'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className={isRTL ? 'rotate-180' : ''} />
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsPartyChoiceModalOpen(false);
                  onOpenOnline();
                }}
                className="w-full p-3.5 rounded-2xl bg-[var(--bg)] hover:bg-[var(--line)]/50 border border-[var(--line)] text-[var(--ink)] flex items-center justify-between active:scale-98 transition-all shadow-2xs text-start cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[var(--turq)] flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-[var(--ink)]">
                      {isRTL ? 'اتاق آنلاین تیمی (از راه دور)' : 'Online Room (Multi-Device)'}
                    </h4>
                    <p className="text-[11px] text-[var(--mute)] font-normal mt-0.5">
                      {isRTL ? 'ورود با کد اتاق مشترک روی چند گوشی' : 'Join shared room via code'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className={isRTL ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Meetup & Boardgame Cafe Map (Google Maps Grounding - Admin Only) */}
      <AdminMeetupMapModal
        isOpen={isAdminMeetupMapOpen}
        onClose={() => setIsAdminMeetupMapOpen(false)}
        language={language}
        isRTL={isRTL}
      />

      {/* AI Language Coach & Referee Chatbot (Gemini AI) */}
      <AICoachChatModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        learningLanguage={settings?.targetLanguages?.[0] || 'English'}
        guideLanguage={language === 'fa' ? 'Persian' : 'English'}
        isRTL={isRTL}
      />
    </div>
  );
};

export default IntroScreen;
