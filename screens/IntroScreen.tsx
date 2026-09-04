import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { NATIVE_LANGUAGE_NAMES } from '../translations';
import { tUI, isRtlLang } from '../ui';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ScreenFrame } from '../components/ScreenFrame';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import InstallPromptModal from '../components/InstallPromptModal';
import { 
  Gamepad2, 
  Trophy, 
  BookOpen, 
  Sparkles, 
  Zap, 
  LogIn, 
  LogOut as LogOutIcon, 
  Globe, 
  ChevronDown,
  CheckCircle,
  CloudCheck,
  Smartphone,
  Download
} from 'lucide-react';

interface Props {
  language: Language;
  onLanguageChange: (l: Language) => void;
  onNext: () => void;
  onOpenOnline: () => void;
  onOpenHistory: () => void;
  onOpenHelp: () => void;
}

const IntroScreen: React.FC<Props> = ({ 
  language, 
  onLanguageChange, 
  onNext, 
  onOpenOnline,
  onOpenHistory, 
  onOpenHelp 
}) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);
  const [mascotBounce, setMascotBounce] = useState(false);
  const [partyEmote, setPartyEmote] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [openLangs, setOpenLangs] = useState(false);

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

  return (
    <>
    <ScreenFrame
      dir={isRTL ? 'rtl' : 'ltr'}
      className="p-3 text-center select-none"
      header={
      <div className="w-full max-w-sm mx-auto flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-1.5 bg-[#241442] text-[#FFE600] px-2.5 py-1 rounded-xl border border-[#FFE600]/40 text-[10px] font-black tracking-widest uppercase shadow-[2px_2px_0px_0px_#241442]">
          <Zap size={14} color="#FFE600" fill="#FFE600" />
          <span>SHOCK YOU!</span>
        </div>

        {/* Google Auth Status */}
        <button
          onClick={handleGoogleAuth}
          disabled={isAuthLoading}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-[#241442] text-[10px] font-black shadow-[2px_2px_0px_0px_#241442] transition-transform active:translate-y-0.5 ${
            user 
              ? 'bg-[#39FF14] text-[#1a0833]' 
              : 'bg-white hover:bg-slate-100 text-[#1a0833]'
          }`}
        >
          {user ? (
            <>
              {user.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-4 h-4 rounded-full border border-[#241442]" referrerPolicy="no-referrer" />
              ) : (
                <CloudCheck size={14} color="#1a0833" />
              )}
              <span className="max-w-[70px] truncate">{user.displayName?.split(' ')[0] || 'User'}</span>
              <LogOutIcon size={12} />
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{language === 'fa' ? 'ورود و ابری' : 'Sign In'}</span>
            </>
          )}
        </button>
      </div>
      }
      footer={
        <div className="w-full max-w-sm mx-auto space-y-2 text-start">
          <div className="bg-white p-2 rounded-2xl border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442]">
            <button
              type="button"
              onClick={() => { sound.playToggle(); setOpenLangs(v => !v); }}
              className="w-full flex items-center gap-2"
            >
              <Globe size={14} color="#FF007F" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-[#1a0833] font-black">{t.uiLanguageLabel}</div>
                <div className="text-sm font-black text-[#FF007F] truncate">{NATIVE_LANGUAGE_NAMES[language]}</div>
              </div>
              <ChevronDown size={16} className={`shrink-0 ${openLangs ? 'rotate-180' : ''}`} />
            </button>
            {openLangs ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUPPORTED_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => { sound.playToggle(); onLanguageChange(l.code); setOpenLangs(false); }}
                    className={`h-8 rounded-xl font-black text-[12px] border-2 border-[#241442] px-2.5 ${
                      language === l.code ? 'bg-gradient-to-r from-[#FF007F] to-[#FF2E93] text-white' : 'bg-[#F4E8FF]/60 text-[#1a0833]'
                    }`}
                  >
                    {l.nativeName}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            onClick={() => { sound.playStartGame(); onNext(); }}
            className="pixel-btn pixel-btn-pink w-full py-3 text-base font-display uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Gamepad2 size={22} color="#FFFFFF" />
            <span>{t.newGame}</span>
            <Zap size={18} color="#FFE600" fill="#FFE600" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { sound.playClick(); onOpenHistory(); }} className="pixel-btn pixel-btn-cyan py-2.5 text-xs font-black flex items-center justify-center gap-1.5">
              <Trophy size={16} color="#1a0833" />
              <span>{t.history}</span>
            </button>
            <button onClick={() => { sound.playClick(); onOpenHelp(); }} className="pixel-btn pixel-btn-yellow py-2.5 text-xs font-black flex items-center justify-center gap-1.5">
              <BookOpen size={16} color="#1a0833" />
              <span>{t.guide}</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Brand Title Area - Party & Co SHOCK YOU! Style */}
      <div className="w-full mt-0.5">
        <div className="pixel-card-shock bg-gradient-to-br from-[#2f1857] via-[#43167a] to-[#6b1cb0] text-white p-3.5 sm:p-4 mx-0.5 relative overflow-hidden border-[3.5px] border-[#241442]">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#FFE600_1px,transparent_1px)] [background-size:12px_12px]" />
          
          {/* Top Tag */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FFE600] text-[#1a0833] text-[9.5px] font-black uppercase rounded-md tracking-wider mb-1 shadow-[1px_1px_0px_0px_#241442]">
            <Zap size={11} color="#1a0833" fill="#1a0833" />
            <span>PARTY & CO</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl font-black mb-1.5 font-display tracking-tight text-white drop-shadow-[3px_3px_0px_#FF007F] leading-tight">
            {t.title}
          </h1>

          {/* Subtitle - High Contrast */}
          <div className="inline-block bg-[#00F0FF] text-[#1a0833] px-3 py-1 rounded-xl border-2 border-[#241442] font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#241442]">
            {t.subtitle}
          </div>
        </div>
      </div>

      {/* Center Mascot Character */}
      <div 
        className="my-2 flex flex-col items-center cursor-pointer relative shrink-0"
        onClick={handleMascotClick}
      >
        {partyEmote && (
          <div className="absolute -top-7 text-3xl animate-float-up pointer-events-none z-20">
            {partyEmote}
          </div>
        )}
        
        <div className="relative">
          <div className="absolute inset-0 bg-[#FF007F]/20 rounded-full blur-xl transform scale-125 pointer-events-none" />
          <div className={`transition-transform duration-200 ${mascotBounce ? 'scale-110 rotate-6' : 'hover:scale-105 active:scale-95'}`}>
            <TeamMascot color="PARTY" size={84} className="drop-shadow-[0_0_15px_rgba(255,0,127,0.8)]" />
          </div>
        </div>

        <div 
          className="mt-1.5 px-3 py-0.5 border-2 border-[#241442] bg-[#FFE600] rounded-full text-[11px] font-black text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] flex items-center gap-1.5"
        >
          <Sparkles size={13} color="#1a0833" />
          <span>{t.tapMascot}</span>
        </div>
      </div>
    </ScreenFrame>
      <InstallPromptModal
        language={language}
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsAppInstalled(true)}
      />
    </>
  );
};

export default IntroScreen;
