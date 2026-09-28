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
  History,
  Lock,
  X,
  ChevronRight,
  ChevronLeft,
  Users,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { tUI, isRtlLang } from '../ui';

interface Props {
  language: Language;
  onLanguageChange: (l: Language) => void;
  onNext: () => void;
  onOpenSinglePlayer: () => void;
  onOpenOnline: () => void;
  onOpenHistory: () => void;
  onOpenLeaderboard?: () => void;
  onOpenHelp?: () => void;
}

const IntroScreen: React.FC<Props> = ({ 
  language, 
  onLanguageChange, 
  onNext, 
  onOpenSinglePlayer,
  onOpenOnline,
  onOpenHistory, 
  onOpenHelp 
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

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

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
    onOpenHistory();
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
    <div className="h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3.5 sm:p-4 text-center select-none overflow-y-auto overscroll-contain" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Top Bar: Brand Pill on one side, Sound, History, Help & Profile on the other */}
      <div className="w-full max-w-sm flex items-center justify-between px-1 mb-2 shrink-0 gap-1.5">
        <div className="flex items-center gap-1.5 bg-[#FFFBF4] px-2.5 py-1 rounded-[14px] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] text-xs font-bold text-[#1E1B2E]">
          <FlagIcon language={language} size={15} />
          <span className="font-display tracking-tight">{language === 'fa' ? 'Turn · دور' : 'Turn'}</span>
        </div>

        {/* Top Controls: Sound, History, Help & Profile (Leaderboard is inside Profile) */}
        <div className="flex items-center gap-2">
          {/* Sound Mute / Unmute Button */}
          <SoundHeaderButton variant="icon-only" language={language} className="w-10 h-10 p-0 justify-center" />

          {/* History Button */}
          <button
            id="header-history-btn"
            onClick={handleHistoryClick}
            aria-label={t.history || 'تاریخچه'}
            className="w-10 h-10 p-0 flex items-center justify-center rounded-[14px] border-2 border-[#1E1B2E] bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1E1B2E] transition-all shrink-0"
            title={language === 'fa' ? 'تاریخچه بازی‌ها' : 'Game History'}
          >
            <History size={18} className="text-[#1E1B2E]" />
          </button>

          {/* Help / Guide button */}
          <button
            id="header-guide-btn"
            onClick={() => {
              sound.playClick();
              onOpenHelp?.();
            }}
            aria-label={t.guide || 'راهنما'}
            className="w-10 h-10 p-0 flex items-center justify-center rounded-[14px] border-2 border-[#1E1B2E] bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1E1B2E] transition-all shrink-0"
            title={language === 'fa' ? 'راهنمای بازی و قوانین' : 'Game Rules & Guide'}
          >
            <BookOpen size={18} className="text-[#1E1B2E]" />
          </button>

          {/* User Profile button (Hosts Leaderboard & Records) */}
          <button
            id="header-profile-btn"
            onClick={() => {
              sound.playClick();
              setProfileInitialTab('records');
              setIsProfileModalOpen(true);
            }}
            aria-label={language === 'fa' ? 'پروفایل و لیدربرد' : 'Profile & Leaderboard'}
            className="w-10 h-10 p-0 flex items-center justify-center rounded-[14px] border-2 border-[#1E1B2E] bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1E1B2E] transition-all shrink-0"
            title={language === 'fa' ? 'پروفایل، رکوردها و لیدربرد' : 'Profile, Records & Leaderboard'}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-5 h-5 rounded-lg border border-[#1E1B2E] object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon size={18} className="text-[#1E1B2E]" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Tabletop Card Area with Stacked Peeking Cards (Page 3 of Proposal) */}
      <div className="relative w-full max-w-sm mx-auto my-2 shrink-0">
        {/* Underneath Card 2: Mustard #F2B63D peek */}
        <div className="absolute inset-0 translate-x-2 translate-y-3 bg-[#F2B63D] border-2 border-[#1E1B2E] rounded-[28px] pointer-events-none" />
        {/* Underneath Card 1: Teal #1E9E93 peek */}
        <div className="absolute inset-0 translate-x-1 translate-y-1.5 bg-[#1E9E93] border-2 border-[#1E1B2E] rounded-[28px] pointer-events-none" />
        
        {/* Top Paper Card: #FFFBF4 with 2px ink border & 4x4 flat shadow */}
        <div className="relative bg-[#FFFBF4] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] rounded-[28px] p-5 sm:p-6 text-start flex flex-col justify-between min-h-[240px] sm:min-h-[260px]">
          {/* Top Label (A2 removed as requested) */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#E0603F] uppercase font-ui">
              VOCAB & CONVERSATION PARTY
            </span>
            <span className="px-2.5 py-0.5 bg-[#1E9E93] text-[#FFFBF4] text-[10.5px] font-bold rounded-full font-ui flex items-center gap-1">
              <Sparkles size={11} />
              <span>Multi-Lingual</span>
            </span>
          </div>

          {/* Main Titles */}
          <div className="my-auto py-2">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-[#1E1B2E] leading-none tracking-tight font-display mb-1">
              Turn
            </h1>
            {language === 'fa' ? (
              <h2 className="text-4xl sm:text-5xl font-normal text-[#E0603F] leading-tight font-display mb-2.5">
                دور
              </h2>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#E0603F] leading-tight font-display mb-2.5">
                Language Party Game
              </h2>
            )}
            <p className="text-[#1E1B2E]/70 text-xs sm:text-sm font-medium leading-relaxed font-ui">
              {language === 'fa' 
                ? 'گوشی رو دست‌به‌دست کن. زمان رو شکست بده. صحبت کن.' 
                : 'Pass one phone. Beat the clock. Speak.'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Language Selection Area */}
      <div className="w-full max-w-sm space-y-2.5 my-auto shrink-0">
        
        {/* Tabletop Language Selector Card */}
        <div className="bg-[#FFFBF4] p-3 rounded-[22px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center shrink-0">
              <Globe size={18} className="text-[#1E1B2E]" />
            </div>
            <div className="text-start min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#1E1B2E] truncate font-ui">
                {currentLangInfo.name}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#1E1B2E]/60 font-medium truncate font-ui">
                {language === 'fa' ? 'زبان برنامه و بازی' : 'App & game language'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsLanguageModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] text-xs font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] shrink-0 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1E1B2E] transition-all font-ui"
          >
            <span>{language === 'fa' ? 'تغییر' : 'Change'}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Primary Action: Orange "Start new game" Button (Page 3) */}
        <div className="flex flex-col gap-2.5">
          <button 
            type="button"
            id="intro-play-button"
            onClick={() => {
              sound.playStartGame();
              onNext();
            }}
            className="w-full h-14 sm:h-15 bg-[#E0603F] hover:bg-[#d55434] text-white border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] rounded-[18px] text-base sm:text-lg font-bold flex items-center justify-center gap-2.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1E1B2E] transition-all font-ui"
          >
            <Users size={22} className="text-white" />
            <span>{language === 'fa' ? 'شروع بازی جدید' : 'Start new game'}</span>
          </button>

          {/* Secondary Game Modes: Single player & Online room in Card surfaces */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Single Player Mode */}
            <button
              type="button"
              id="intro-single-player-btn"
              onClick={() => {
                sound.playClick();
                onOpenSinglePlayer();
              }}
              className="py-3 px-3 bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] border-2 border-[#1E1B2E] rounded-[18px] font-bold text-xs sm:text-sm shadow-[4px_4px_0px_0px_#1E1B2E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1E1B2E] transition-all flex items-center justify-center gap-2 font-ui"
            >
              <Mic size={16} className="text-[#1E1B2E]" />
              <span>{language === 'fa' ? 'تک‌نفره' : 'Single player'}</span>
            </button>

            {/* 2. Online Multiplayer Mode */}
            <button
              type="button"
              id="intro-online-btn"
              onClick={() => {
                sound.playClick();
                onOpenOnline();
              }}
              className="py-3 px-3 bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] border-2 border-[#1E1B2E] rounded-[18px] font-bold text-xs sm:text-sm shadow-[4px_4px_0px_0px_#1E1B2E] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1E1B2E] transition-all flex items-center justify-center gap-2 font-ui"
            >
              <Globe size={16} className="text-[#1E1B2E]" />
              <span>{language === 'fa' ? 'اتاق آنلاین' : 'Online room'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Install Prompt & Guide Modal */}
      <InstallPromptModal
        language={language}
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsAppInstalled(true)}
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
        title={language === 'fa' ? 'انتخاب زبان برنامه و بازی' : 'Select App & Game Language'}
        subtitle={language === 'fa' ? 'پشتیبانی از بیش از ۳۵ زبان دنیا' : 'Over 35 supported languages'}
        isRTL={isRTL}
      />

      {/* Game Mode Selection Modal */}
      {isGameModeModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setIsGameModeModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#1d0d38] border-[3.5px] border-[#FFE600] rounded-3xl shadow-[0_0_30px_rgba(255,230,0,0.3)] overflow-hidden text-white flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF007F] via-[#7B2CBF] to-[#241442] p-4 flex items-center justify-between border-b-[3px] border-[#241442]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FFE600] text-[#1a0833] flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#241442]">
                  <Gamepad2 size={20} />
                </div>
                <div className="text-start">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    {language === 'fa' ? 'نوع بازی را انتخاب کنید' : 'Choose Game Mode'}
                  </h2>
                  <p className="text-[11px] text-pink-200 font-bold">
                    {language === 'fa' ? 'حالت مسابقه مورد نظر خود را آغاز نمایید' : 'Select your preferred challenge mode'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsGameModeModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-transform active:scale-95"
              >
                <X size={18} />
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
                className="p-3 bg-[#2a134f] hover:bg-[#341861] border-2 border-[#FFE600] rounded-2xl cursor-pointer transition-all active:scale-[0.98] shadow-[3px_3px_0px_0px_#241442] flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FFE600] text-[#1a0833] flex items-center justify-center font-black">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#FFE600] group-hover:text-yellow-200">
                        {language === 'fa' ? '۱. بازی دورهمی حضوری (Pass & Play)' : '1. Local Party (Pass & Play)'}
                      </h3>
                      <span className="text-[10px] text-[#00F0FF] font-bold">
                        {language === 'fa' ? '۲ تا ۸ بازیکن • مسابقه با یک گوشی' : '2 to 8 players • One shared phone'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-[#FFE600] text-[#1a0833] px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_0px_#241442]">
                    {language === 'fa' ? 'شروع ➔' : 'Start ➔'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed text-start">
                  {language === 'fa' 
                    ? 'گوشی بین تیم‌ها می‌چرخد! تایمر زنگ‌دار، چرخ شانس موضوعات و کارت‌های واژگان برای یک مسابقه دورهمی پرشور.'
                    : 'Pass the phone between teams! Buzzer timer, category wheel, and vocabulary cards for an energetic party.'}
                </p>
              </div>

              {/* Option 2: Single Player Flashcard & Voice Challenge */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setIsGameModeModalOpen(false);
                  onOpenSinglePlayer();
                }}
                className="p-3 bg-[#2a134f] hover:bg-[#341861] border-2 border-[#FF007F] rounded-2xl cursor-pointer transition-all active:scale-[0.98] shadow-[3px_3px_0px_0px_#241442] flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FF007F] text-white flex items-center justify-center font-black">
                      <Mic size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#FF007F] group-hover:text-pink-300">
                        {language === 'fa' ? '۲. چالش تک‌نفره و سنجش تلفظ' : '2. Single-Player & Voice Challenge'}
                      </h3>
                      <span className="text-[10px] text-[#39FF14] font-bold">
                        {language === 'fa' ? 'تمرین گفتار با میکروفون • ثبت در لیدربرد' : 'Voice pronunciation • Leaderboard records'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-[#FF007F] text-white px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_0px_#241442]">
                    {language === 'fa' ? 'شروع ➔' : 'Start ➔'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed text-start">
                  {language === 'fa' 
                    ? 'فلش‌کارت‌های تخصصی در بیش از ۳۸ زبان، تمرین با هوش مصنوعی و میکروفون و ثبت رکوردهای برتر در لیدربرد تک‌نفره.'
                    : 'Curated CEFR flashcards in 38+ languages, AI pronunciation score via mic, and top scores on the solo leaderboard.'}
                </p>
              </div>

              {/* Option 3: Online Multiplayer */}
              <div 
                onClick={() => {
                  sound.playClick();
                  setIsGameModeModalOpen(false);
                  onOpenOnline();
                }}
                className="p-3 bg-[#2a134f] hover:bg-[#341861] border-2 border-[#00F0FF] rounded-2xl cursor-pointer transition-all active:scale-[0.98] shadow-[3px_3px_0px_0px_#241442] flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00F0FF] text-[#1a0833] flex items-center justify-center font-black">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#00F0FF] group-hover:text-cyan-200">
                        {language === 'fa' ? '۳. بازی آنلاین چندنفره (از راه دور)' : '3. Online Multiplayer (Remote Rooms)'}
                      </h3>
                      <span className="text-[10px] text-purple-300 font-bold">
                        {language === 'fa' ? 'اتاق‌های مجازی • کد دعوت ۶ رقمی' : 'Virtual rooms • 6-digit invite code'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-[#00F0FF] text-[#1a0833] px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_0px_#241442]">
                    {language === 'fa' ? 'ورود ➔' : 'Join ➔'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed text-start">
                  {language === 'fa' 
                    ? 'از هر فاصله‌ای با دوستان خود بازی کنید! ساخت اتاق اختصاصی یا ورود با کد دعوت جهت مسابقه آنلاین تیمی.'
                    : 'Play with friends from anywhere! Host a custom room or join via invite code for real-time multiplayer.'}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-[#17092c] border-t border-[#241442] text-center">
              <button
                type="button"
                onClick={() => setIsGameModeModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                {language === 'fa' ? 'بستن پنجره' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Login Required Modal */}
      {isHistoryLoginModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setIsHistoryLoginModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-[#1e0e38] border-[3.5px] border-[#FFE600] rounded-3xl shadow-[0_0_30px_rgba(255,230,0,0.3)] overflow-hidden text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#FF007F] to-[#7B2CBF] p-4 text-center border-b-2 border-[#241442]">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE600] text-[#1a0833] flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0px_0px_#241442]">
                <History size={24} />
              </div>
              <h3 className="text-base font-black">
                {language === 'fa' ? 'ورود به حساب برای مشاهده تاریخچه' : 'Sign in to access Game History'}
              </h3>
            </div>

            <div className="p-4 space-y-3 text-center">
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {language === 'fa' 
                  ? 'سوابق مسابقات، امتیازات تیمی، کلمات یادگرفته‌شده و رکوردهای شما به صورت ابری ذخیره می‌شوند. برای مشاهده تاریخچه و ادامه، با حساب گوگل خود وارد شوید.'
                  : 'Your match logs, scores, learned vocabulary, and records are saved to the cloud. Please sign in with your Google account to access your history.'}
              </p>

              <button
                type="button"
                onClick={handleLoginForHistory}
                disabled={isAuthLoading}
                className="w-full py-3 bg-[#39FF14] hover:bg-[#32e012] text-[#1a0833] font-black text-sm rounded-xl border-2 border-[#241442] shadow-[3px_3px_0px_0px_#241442] active:translate-y-0.5 flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                <span>{isAuthLoading ? (language === 'fa' ? 'در حال اتصال...' : 'Connecting...') : (language === 'fa' ? 'ورود با حساب گوگل' : 'Sign in with Google')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHistoryLoginModalOpen(false)}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                {language === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroScreen;
