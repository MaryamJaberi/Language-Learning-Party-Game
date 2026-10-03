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
  ChevronDown,
  Award
} from 'lucide-react';
import { tUI, isRtlLang } from '../ui';
import { GameSettings } from '../types';
import { CEFR_LEVELS } from '../constants';

interface Props {
  language: Language;
  settings?: GameSettings;
  onUpdateSettings?: (s: GameSettings) => void;
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
  settings,
  onUpdateSettings,
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
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3.5 sm:p-4 text-center select-none overflow-y-auto overscroll-contain bg-[var(--bg)] text-[var(--ink)] font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Top Bar: Language Picker Pill on one side, Sound, Help & Profile on the other */}
      <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between px-1 mb-2 shrink-0 gap-2">
        {/* Language button: Flag icon only as requested ("نام زبان رو ننویس همون آیکون زبان کافیه") */}
        <button
          id="header-language-btn"
          data-testid="header-language-btn"
          type="button"
          onClick={() => {
            sound.playClick();
            setIsLanguageModalOpen(true);
          }}
          className="w-10 h-10 flex items-center justify-center bg-[var(--panel)] hover:bg-[var(--bg)] rounded-full border border-[var(--line)] shadow-xs text-xs font-bold text-[var(--ink)] active:scale-95 transition-all cursor-pointer shrink-0"
          title={`${t.changeLanguage} (${currentLangInfo.nativeName || currentLangInfo.name})`}
          aria-label={t.changeLanguage}
        >
          <FlagIcon language={language} size={20} />
        </button>

        {/* Top Controls: Mobile APK, Sound, Help & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile APK / Play Store Download Button */}
          <button
            id="header-install-btn"
            type="button"
            onClick={handleOpenInstall}
            aria-label={isRTL ? 'دانلود APK اندروید و پکیج گوگل‌پلی' : 'Download Android APK & Play Store Package'}
            className="ib"
            title={isRTL ? 'دانلود APK اندروید و پکیج گوگل‌پلی' : 'Download Android APK & Play Store Package'}
          >
            <Download size={18} />
          </button>

          {/* Sound Mute / Unmute Button */}
          <SoundHeaderButton variant="icon-only" language={language} className="w-10 h-10 p-0 justify-center ib" />

          {/* Help / Guide button */}
          <button
            id="header-guide-btn"
            onClick={() => {
              sound.playClick();
              onOpenHelp?.();
            }}
            aria-label={t.guide || 'راهنما'}
            className="ib"
            title={t.gameRules}
          >
            <BookOpen size={18} />
          </button>

          {/* User Profile button (Hosts History, Records & Leaderboard) */}
          <button
            id="header-profile-btn"
            onClick={handleHistoryClick}
            aria-label={isRTL ? 'پروفایل و لیدربرد و تاریخچه' : 'Profile, History & Leaderboard'}
            className="ib"
            title={isRTL ? 'پروفایل و لیدربرد و تاریخچه' : 'Profile, History & Leaderboard'}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-5 h-5 rounded-full border border-[var(--line)] object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Hero Modern Card Area (Aligned with HTML design system) */}
      <div className="relative w-full max-w-sm mx-auto my-auto shrink-0">
        <div className="panel p-5 sm:p-6 text-start flex flex-col justify-between min-h-[230px] sm:min-h-[250px] rounded-[24px] shadow-sm">
          {/* Top Label */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[var(--lapis)] uppercase font-ui">
              {t.vocabParty}
            </span>
            <span className="px-2.5 py-0.5 bg-[var(--lapis-soft)] text-[var(--lapis)] text-[10.5px] font-bold rounded-full font-ui flex items-center gap-1">
              <Sparkles size={11} />
              <span>{t.multiLingual}</span>
            </span>
          </div>

          {/* Main Titles */}
          <div className="my-auto py-2">
            <h1 className="text-5xl sm:text-6xl font-black text-[var(--ink)] leading-none tracking-tight font-display mb-1">
              {t.title || 'Turn'}
            </h1>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--lapis)] leading-tight font-display mb-2">
              {t.subtitle}
            </h2>
            <p className="text-[var(--mute)] text-xs sm:text-sm font-medium leading-relaxed font-ui">
              {t.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Action Buttons */}
      <div className="w-full max-w-sm sm:max-w-md space-y-2.5 my-auto shrink-0">
        {/* Primary Action: Start Game Button */}
        <div className="flex flex-col gap-2.5">
          <button 
            type="button"
            id="intro-play-button"
            onClick={() => {
              sound.playStartGame();
              onNext();
            }}
            className="start-btn w-full h-14 sm:h-15 text-base sm:text-lg font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all font-ui"
          >
            <Users size={22} />
            <span>{t.startNewGame || t.newGame}</span>
          </button>

          {/* Secondary Game Modes: Single player & Online room */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Single Player Mode */}
            <button
              type="button"
              id="intro-single-player-btn"
              onClick={() => {
                sound.playClick();
                onOpenSinglePlayer();
              }}
              className="py-3 px-3 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-[16px] font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-ui"
            >
              <Mic size={16} className="text-[var(--lapis)]" />
              <span>{t.singlePlayerBtn}</span>
            </button>

            {/* 2. Online Multiplayer Mode */}
            <button
              type="button"
              id="intro-online-btn"
              onClick={() => {
                sound.playClick();
                onOpenOnline();
              }}
              className="py-3 px-3 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-[16px] font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-ui"
            >
              <Globe size={16} className="text-[var(--turq)]" />
              <span>{t.onlineRoom}</span>
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
                        {t.localPartyMode || (isRTL ? '۱. بازی دورهمی حضوری (Pass & Play)' : '1. Local Party (Pass & Play)')}
                      </h3>
                      <span className="text-[10px] text-[var(--teal)] font-bold">
                        {t.localPartyDesc || (isRTL ? '۲ تا ۸ بازیکن • مسابقه با یک گوشی' : '2 to 8 players • One shared phone')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[var(--saffron)] text-[var(--ink)] px-2.5 py-1 rounded-xl shadow-[var(--shadow-sm)] border border-[var(--line)]">
                    {t.start || (isRTL ? 'شروع ➔' : 'Start ➔')}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--mute)] font-medium leading-relaxed text-start">
                  {t.localPartySub || (isRTL 
                    ? 'گوشی بین تیم‌ها می‌چرخد! تایمر زنگ‌دار، چرخ شانس موضوعات و کارت‌های واژگان برای یک مسابقه دورهمی پرشور.'
                    : 'Pass the phone between teams! Buzzer timer, category wheel, and vocabulary cards for an energetic party.')}
                </p>
              </div>

              {/* Option 2: Single Player Flashcard & Voice Challenge */}
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
                      <Mic size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        {t.singlePlayer || (isRTL ? '۲. چالش تک‌نفره و سنجش تلفظ' : '2. Single-Player & Voice Challenge')}
                      </h3>
                      <span className="text-[10px] text-[var(--teal)] font-bold">
                        {t.singlePlayerSub || (isRTL ? 'تمرین گفتار با میکروفون • ثبت در لیدربرد' : 'Voice pronunciation • Leaderboard records')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[var(--vermilion)] text-white px-2.5 py-1 rounded-xl shadow-[var(--shadow-sm)]">
                    {t.start || (isRTL ? 'شروع ➔' : 'Start ➔')}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--mute)] font-medium leading-relaxed text-start">
                  {t.singlePlayerDetail || (isRTL 
                    ? 'فلش‌کارت‌های تخصصی در بیش از ۳۸ زبان، تمرین با هوش مصنوعی و میکروفون و ثبت رکوردهای برتر در لیدربرد تک‌نفره.'
                    : 'Curated CEFR flashcards in 38+ languages, AI pronunciation score via mic, and top scores on the solo leaderboard.')}
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
    </div>
  );
};

export default IntroScreen;
