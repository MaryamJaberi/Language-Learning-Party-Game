import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { tUI, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  ChevronUp, 
  ShieldCheck, 
  ExternalLink,
  Users,
  Swords,
  User,
  Box,
  Globe,
  Trophy,
  Mic,
  Clock,
  Layers,
  CheckCircle2,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { useGoogleScrollBars } from '../useGoogleScrollBars';
import { FlagIcon } from '../components/FlagIcon';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LanguagePickerModal } from '../components/LanguagePickerModal';

interface Props {
  language: Language;
  onClose: () => void;
  initialSection?: string;
  onLanguageChange?: (lang: Language) => void;
}

export const HelpScreen: React.FC<Props> = ({ 
  language, 
  onClose, 
  initialSection,
  onLanguageChange 
}) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);
  const { isBarsVisible, scrollContainerRef, handleScroll, showBars } = useGoogleScrollBars();
  const [activeTab, setActiveTab] = useState<'game_modes' | 'rules' | 'privacy'>('game_modes');
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (initialSection && scrollContainerRef.current) {
      const element = document.getElementById(`help-${initialSection}`);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialSection]);

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div 
      className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col bg-[var(--bg)] overflow-hidden select-none relative font-ui text-[var(--ink)]" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header Panel with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-28' 
            : '-translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[var(--panel)] border-b border-[var(--line)] flex items-center justify-between text-[var(--ink)] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shadow-xs">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-display leading-tight">
                {isRTL ? 'راهنمای بازی «دور»' : 'Game Guide & Rules'}
              </h2>
              <p className="text-[11px] text-[var(--mute)] font-medium">
                {isRTL ? 'معرفی بازی و ۴ سبک جذاب، قوانین و امتیازدهی' : 'Game Introduction, 4 Modes & Rules'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Language Switch Button */}
            {onLanguageChange && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsLangPickerOpen(true);
                }}
                className="h-9 px-2.5 flex items-center gap-1.5 rounded-full bg-[var(--bg)] hover:bg-[var(--line)]/40 border border-[var(--line)] text-xs font-bold text-[var(--ink)] active:scale-95 transition-all cursor-pointer"
                title={isRTL ? 'تغییر زبان برنامه' : 'Change App Language'}
              >
                <FlagIcon language={language} size={16} />
                <span className="text-[10px] font-extrabold hidden sm:inline">{currentLangInfo.nativeName.split(' ')[0]}</span>
              </button>
            )}

            <button 
              type="button"
              onClick={handleClose} 
              className="w-9 h-9 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] border border-[var(--line)] font-bold rounded-full active:scale-95 shadow-xs transition-all cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-3 py-1.5 bg-[var(--bg)] border-b border-[var(--line)] flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setActiveTab('game_modes');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'game_modes'
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                : 'text-[var(--mute)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
            }`}
          >
            <Sparkles size={13} />
            <span>{isRTL ? '۴ سبک بازی' : '4 Game Modes'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setActiveTab('rules');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                : 'text-[var(--mute)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
            }`}
          >
            <Zap size={13} />
            <span>{isRTL ? 'قوانین و امتیاز' : 'Rules & Scoring'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setActiveTab('privacy');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                : 'text-[var(--mute)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
            }`}
          >
            <ShieldCheck size={13} />
            <span>{isRTL ? 'امنیت و حریم' : 'Privacy'}</span>
          </button>
        </div>
      </div>

      {/* Rules content */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain font-ui"
      >
        
        {/* Intro Tip banner */}
        <div className="bg-[var(--panel)] p-3.5 border border-[var(--line)] rounded-2xl shadow-xs flex items-center gap-3">
          <TeamMascot color="PARTY" size={40} />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] bg-[var(--saffron)] text-[#15204A] px-2 py-0.5 rounded-lg font-black uppercase shadow-xs flex items-center gap-1 w-fit">
              <Zap size={11} className="text-[#15204A] fill-[#15204A]" />
              <span>{isRTL ? 'راز هیجان و موفقیت در بازی' : 'KEY STRATEGY'}</span>
            </span>
            <p className="text-[11.5px] font-bold text-[var(--ink)] leading-normal mt-1">
              {isRTL 
                ? 'کلمه را سریع به یارتان برسانید و بدون اتلاف وقت گوشی را به نفر بعد بدهید تا زمان تیم شما حفظ شود!' 
                : 'Pass the device fast! Every second saved keeps your team ahead on the clock!'}
            </p>
          </div>
        </div>

        {/* TAB 1: 4 GAME MODES WITH ILLUSTRATIONS */}
        {activeTab === 'game_modes' && (
          <div className="space-y-3 animate-fade-in">
            
            {/* Mode 1: Team Party Game */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۱. بازی دورهمی تیمی' : '1. Team Party Game'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? '۴ تا ۸ بازیکن • چرخش گوشی دور میز' : '4-8 Players • Clockwise Passing'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {isRTL ? 'دورهمی حضوری' : 'Local Party'}
                </span>
              </div>

              {/* Mode 1 Visual Illustration SVG */}
              <div className="w-full h-36 bg-gradient-to-br from-blue-500/5 via-[var(--bg)] to-indigo-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Table Circle */}
                  <ellipse cx="160" cy="60" rx="90" ry="42" fill="var(--panel)" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4" />
                  
                  {/* Passing Arrow Clockwise */}
                  <path d="M 95 60 A 65 30 0 0 1 225 60" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />
                  <polygon points="228,62 222,54 220,64" fill="#3b82f6" />
                  
                  {/* Center Phone Device */}
                  <rect x="138" y="38" width="44" height="44" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                  <rect x="144" y="44" width="32" height="12" rx="3" fill="#3b82f6" />
                  <rect x="146" y="60" width="28" height="4" rx="2" fill="#ef4444" opacity="0.8" />
                  <rect x="146" y="66" width="20" height="4" rx="2" fill="#ef4444" opacity="0.6" />
                  <circle cx="160" cy="76" r="2.5" fill="#10b981" />

                  {/* Player 1 (Top Blue) */}
                  <circle cx="160" cy="16" r="12" fill="#3b82f6" />
                  <circle cx="160" cy="13" r="5" fill="white" opacity="0.9" />
                  
                  {/* Player 2 (Right Orange) */}
                  <circle cx="260" cy="60" r="12" fill="#f97316" />
                  <circle cx="260" cy="57" r="5" fill="white" opacity="0.9" />

                  {/* Player 3 (Bottom Green) */}
                  <circle cx="160" cy="104" r="12" fill="#10b981" />
                  <circle cx="160" cy="101" r="5" fill="white" opacity="0.9" />

                  {/* Player 4 (Left Purple) */}
                  <circle cx="60" cy="60" r="12" fill="#8b5cf6" />
                  <circle cx="60" cy="57" r="5" fill="white" opacity="0.9" />

                  {/* Time Bomb Icon */}
                  <circle cx="204" cy="36" r="10" fill="#f59e0b" />
                  <text x="200" y="40" fontSize="11">⏱️</text>
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'بازیکنان به تیم‌های ۲ نفره تقسیم می‌شوند و روبروی یکدیگر دور میز می‌نشینند.' : 'Players split into 2-person teams sitting across each other.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'کلمه هدف را برای یارتان توصیف کنید؛ استفاده از کلمات ممنوعه خطاست!' : 'Describe the prompt without uttering taboo words.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'به محض حدس درست، «درست بود!» را بزنید و گوشی را تحویل دهید تا زمان تیم شما متوقف شود.' : 'Press "Correct!" and pass immediately so your team clock stops.'}</span>
                </li>
              </ul>
            </div>

            {/* Mode 2: 2-Player Head-to-Head Duel */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <Swords size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۲. دوئل دونفره (روی ۱ گوشی یا آنلاین)' : '2. 2-Player Duel (Local & Online)'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? '۲ بازیکن • رقابت سرعتی رودررو' : '2 Players • Split-Screen / Online Clash'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {isRTL ? 'دوئل سرعتی' : '1v1 Duel'}
                </span>
              </div>

              {/* Mode 2 Visual Illustration SVG */}
              <div className="w-full h-36 bg-gradient-to-br from-rose-500/5 via-[var(--bg)] to-amber-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Phone Bezel */}
                  <rect x="70" y="10" width="180" height="100" rx="16" fill="var(--panel)" stroke="var(--line)" strokeWidth="2" />
                  
                  {/* Split Screen Line */}
                  <line x1="160" y1="12" x2="160" y2="108" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                  
                  {/* Player 1 Side (Left - Blue) */}
                  <rect x="80" y="22" width="70" height="76" rx="8" fill="#3b82f6" fillOpacity="0.12" />
                  <circle cx="115" cy="40" r="10" fill="#3b82f6" />
                  <rect x="90" y="60" width="50" height="14" rx="4" fill="#3b82f6" />
                  <text x="96" y="70" fontSize="8" fill="white" fontWeight="bold">PLAYER 1</text>
                  <rect x="92" y="80" width="22" height="10" rx="3" fill="#10b981" />
                  <rect x="118" y="80" width="22" height="10" rx="3" fill="#ef4444" />

                  {/* Clash Lightning in Center */}
                  <circle cx="160" cy="60" r="14" fill="#f59e0b" />
                  <path d="M 162 50 L 155 60 L 160 60 L 157 70 L 166 59 L 161 59 Z" fill="#ffffff" />

                  {/* Player 2 Side (Right - Red/Orange) */}
                  <rect x="170" y="22" width="70" height="76" rx="8" fill="#f43f5e" fillOpacity="0.12" />
                  <circle cx="205" cy="40" r="10" fill="#f43f5e" />
                  <rect x="180" y="60" width="50" height="14" rx="4" fill="#f43f5e" />
                  <text x="186" y="70" fontSize="8" fill="white" fontWeight="bold">PLAYER 2</text>
                  <rect x="182" y="80" width="22" height="10" rx="3" fill="#10b981" />
                  <rect x="208" y="80" width="22" height="10" rx="3" fill="#ef4444" />
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'روی ۱ گوشی با صفحه تقسیم‌شده (دو طرف گوشی) یا آنلاین بین ۲ گوشی با کد اتاق.' : 'Shared split-screen on one device or online 2-phone room.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'سرعت عمل کلید پیروزی است: اولین کسی که پاسخ درست را لمس کند امتیاز می‌گیرد.' : 'Reflex showdown: First player to tap the correct choice wins points.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'امکان بازی با پاسخ صوتی یا لمس گزینه‌های تستی در چند راند نفس‌گیر.' : 'Play with touch response or voice trigger across fast rounds.'}</span>
                </li>
              </ul>
            </div>

            {/* Mode 3: Single Player Flashcard & Voice Speedrun */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۳. چالش تک‌نفره و تست گفتار' : '3. Single-Player & Speech Challenge'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? 'انفرادی • بازیابی فعال ذهن و لیدربرد' : 'Solo • Active Recall & Leaderboard'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {isRTL ? 'لیدربرد سطح‌بندی‌شده' : 'CEFR Ranked'}
                </span>
              </div>

              {/* Mode 3 Visual Illustration SVG */}
              <div className="w-full h-36 bg-gradient-to-br from-emerald-500/5 via-[var(--bg)] to-teal-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Flashcard Body */}
                  <rect x="80" y="14" width="160" height="92" rx="14" fill="var(--panel)" stroke="var(--line)" strokeWidth="2" />
                  
                  {/* CEFR Level Badge */}
                  <rect x="90" y="24" width="36" height="14" rx="4" fill="#10b981" />
                  <text x="96" y="34" fontSize="9" fill="white" fontWeight="black">B1 CARD</text>

                  {/* Stopwatch Badge */}
                  <rect x="194" y="24" width="36" height="14" rx="4" fill="var(--bg)" stroke="var(--line)" />
                  <text x="198" y="34" fontSize="8" fill="var(--ink)" fontWeight="bold">⏱️ 60s</text>

                  {/* Prompt Text Line */}
                  <rect x="100" y="48" width="120" height="12" rx="3" fill="var(--ink)" fillOpacity="0.8" />
                  
                  {/* Active Recall Masked Hint Slots */}
                  <rect x="104" y="66" width="14" height="16" rx="3" fill="#10b981" fillOpacity="0.2" stroke="#10b981" />
                  <text x="108" y="78" fontSize="10" fill="#10b981" fontWeight="bold">B</text>
                  <rect x="122" y="66" width="14" height="16" rx="3" fill="var(--bg)" stroke="var(--line)" />
                  <text x="126" y="78" fontSize="10" fill="var(--mute)">_</text>
                  <rect x="140" y="66" width="14" height="16" rx="3" fill="var(--bg)" stroke="var(--line)" />
                  <text x="144" y="78" fontSize="10" fill="var(--mute)">_</text>
                  <rect x="158" y="66" width="14" height="16" rx="3" fill="var(--bg)" stroke="var(--line)" />
                  <text x="162" y="78" fontSize="10" fill="var(--mute)">_</text>
                  <rect x="176" y="66" width="14" height="16" rx="3" fill="#10b981" fillOpacity="0.2" stroke="#10b981" />
                  <text x="180" y="78" fontSize="10" fill="#10b981" fontWeight="bold">K</text>

                  {/* Mic Wave Icon */}
                  <circle cx="210" cy="74" r="10" fill="#0d9488" />
                  <path d="M 210 69 C 211 69 212 70 212 71 L 212 74 C 212 75 211 76 210 76 C 209 76 208 75 208 74 L 208 71 C 208 70 209 69 210 69 Z" fill="white" />
                  <path d="M 206 73 C 206 75.5 207.8 77.5 210 77.5 C 212.2 77.5 214 75.5 214 73" stroke="white" strokeWidth="1.2" strokeLinecap="round" />

                  {/* Leaderboard Trophy on side */}
                  <circle cx="45" cy="60" r="16" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" />
                  <text x="36" y="66" fontSize="16">🏆</text>

                  {/* Voice Wave */}
                  <circle cx="275" cy="60" r="16" fill="#10b981" fillOpacity="0.2" stroke="#10b981" />
                  <text x="267" y="66" fontSize="16">🎙️</text>
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'بازیابی فعال ذهن (Active Recall): گزینه‌ها به صورت پیش‌فرض پنهان هستند تا حافظه تقویت شود.' : 'Active Recall: Multiple choice options are hidden by default to train memory.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'انتخاب دلخواه نوع راهنما: حروف کمکی، سرنخ مفهومی، بازکردن گزینه‌ها یا تلفظ صوتی.' : 'Choose your hint: Letter skeleton, concept clue, reveal choices, or slow audio.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'مسابقه زمان کل (۳۰ تا ۱۲۰ ثانیه) با امتیازدهی متناسب با سطح دشواری CEFR و ثبت در لیدربرد.' : 'Timed Speedrun (30-120s) with CEFR weighted scoring submitted to leaderboard.'}</span>
                </li>
              </ul>
            </div>

            {/* Mode 4: 5-Box Spaced Repetition Leitner Box */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Box size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۴. جعبه لایتنر ۵ خانه (مرور با فواصل زمانی)' : '4. 5-Box Leitner Spaced Repetition'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? 'مرور روزانه • ثبت دائمی در حافظه بلندمدت' : 'Daily Review • Long-Term Retention'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {isRTL ? 'روش علمی لایتنر' : 'Scientific System'}
                </span>
              </div>

              {/* Mode 4 Visual Illustration SVG */}
              <div className="w-full h-36 bg-gradient-to-br from-amber-500/5 via-[var(--bg)] to-yellow-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* 5 Boxes */}
                  {/* Box 1 (1 Day) */}
                  <rect x="25" y="45" width="46" height="52" rx="8" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="35" y="65" fontSize="10" fill="#f59e0b" fontWeight="black">خانه ۱</text>
                  <text x="37" y="80" fontSize="8" fill="var(--mute)" fontWeight="bold">۱ روز</text>

                  {/* Box 2 (2 Days) */}
                  <rect x="80" y="40" width="46" height="57" rx="8" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="90" y="62" fontSize="10" fill="#f59e0b" fontWeight="black">خانه ۲</text>
                  <text x="92" y="77" fontSize="8" fill="var(--mute)" fontWeight="bold">۲ روز</text>

                  {/* Box 3 (4 Days) */}
                  <rect x="135" y="35" width="46" height="62" rx="8" fill="#f59e0b" fillOpacity="0.35" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="145" y="58" fontSize="10" fill="#f59e0b" fontWeight="black">خانه ۳</text>
                  <text x="147" y="73" fontSize="8" fill="var(--mute)" fontWeight="bold">۴ روز</text>

                  {/* Box 4 (8 Days) */}
                  <rect x="190" y="30" width="46" height="67" rx="8" fill="#f59e0b" fillOpacity="0.45" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="200" y="54" fontSize="10" fill="#f59e0b" fontWeight="black">خانه ۴</text>
                  <text x="202" y="69" fontSize="8" fill="var(--mute)" fontWeight="bold">۸ روز</text>

                  {/* Box 5 (16 Days) */}
                  <rect x="245" y="25" width="48" height="72" rx="8" fill="#f59e0b" fillOpacity="0.6" stroke="#f59e0b" strokeWidth="2" />
                  <text x="254" y="50" fontSize="10" fill="#15204A" fontWeight="black">خانه ۵</text>
                  <text x="255" y="65" fontSize="8" fill="#15204A" fontWeight="bold">۱۶ روز</text>

                  {/* Graduation Trophy */}
                  <circle cx="269" cy="16" r="10" fill="#10b981" />
                  <text x="264" y="20" fontSize="10">🎓</text>

                  {/* Progression green arrow */}
                  <path d="M 50 38 Q 160 15 240 22" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" fill="none" />
                  <polygon points="243,23 236,18 238,25" fill="#10b981" />
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'بر پایه فواصل زمانی علمی: مرور در روزهای ۱، ۲، ۴، ۸ و ۱۶ برای تثبیت دائمی.' : 'Spaced interval schedule: Reviews on days 1, 2, 4, 8, and 16.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'پاسخ درست، کارت را به خانه بالاتر می‌برد؛ پاسخ اشتباه آن را برای مرور مجدد به خانه اول بازمی‌گرداند.' : 'Correct answers promote cards; mistakes return them to Box 1 for retraining.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'کارت‌های خانه ۵ پس از موفقیت به مقام تسلط کامل (Mastered 🎓) فارغ‌التحصیل می‌شوند.' : 'Cards clearing Box 5 graduate to permanent mastery status 🎓.'}</span>
                </li>
              </ul>
            </div>

          </div>
        )}

        {/* TAB 2: RULES & TIME BOMB */}
        {activeTab === 'rules' && (
          <div className="space-y-3 animate-fade-in">
            {/* Rule 1 */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--lapis)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Sparkles size={13} className="text-white" />
                <span>{isRTL ? 'نحوه چرخش نوبت‌ها' : 'Turn Rotation Rules'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
                {isRTL 
                  ? 'گوشی در جهت عقربه‌های ساعت بین بازیکنان دست‌به‌دست می‌شود. در نوبت خود کلمه را برای یارتان توصیف کنید بدون گفتن خود کلمه یا ریشه مستقیم آن.'
                  : 'The device moves clockwise around the table. Describe the prompt to your partner without uttering root or forbidden words.'}
              </p>
            </section>

            {/* Rule 2: Scoring */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--saffron)] inline-flex items-center gap-1.5 font-black text-[#15204A] px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Trophy size={13} className="text-[#15204A]" />
                <span>{isRTL ? 'امتیازدهی و بمب زمان' : 'Scoring & Time Bomb'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
                {isRTL 
                  ? 'با هر حدس درست، دکمه «درست بود!» را لمس کرده و بلافاصله گوشی را به نفر بعد تحویل دهید. هر تیمی که زمانش زودتر تمام شود، امتیاز آن راند به تیم رقیب می‌رسد.'
                  : 'Tap "Correct!" on right guesses and hand off the device immediately. If your team timer hits zero, the round goes to rivals.'}
              </p>
            </section>

            {/* Rule 3: Single player scoring */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--teal)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Layers size={13} className="text-white" />
                <span>{isRTL ? 'ضرایب امتیاز بر اساس سطح دشواری کارت‌ها' : 'CEFR Difficulty Weighting'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
                {isRTL 
                  ? 'در چالش تک‌نفره، امتیاز هر پاسخ بر اساس سطح کارت (A1 تا C1) ضرب می‌شود: کارت‌های پیشرفته‌تر (B2 و C1) امتیاز بسیار بالاتری دارند و رتبه شما را در لیدربرد جهش می‌دهند.'
                  : 'In single player, points scale with card CEFR difficulty: A1 (1.0x), A2 (1.35x), B1 (1.8x), B2 (2.4x), C1 (3.2x), boosting your leaderboard rank.'}
              </p>
            </section>
          </div>
        )}

        {/* TAB 3: PRIVACY & SYSTEM LANGUAGE */}
        {activeTab === 'privacy' && (
          <div className="space-y-3 animate-fade-in">
            {/* System Language Detection Card */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--lapis)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Globe size={13} className="text-white" />
                <span>{isRTL ? 'زبان پیش‌فرض و تشخیص سیستم' : 'Default Language Detection'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl mb-2.5">
                {isRTL 
                  ? 'برنامه به صورت هوشمند زبان سیستم‌عامل کاربر را بررسی کرده و زبان رابط کاربری را هماهنگ می‌سازد. در صورت عدم تطابق، زبان پیش‌فرض انگلیسی آمریکایی است و هر زمان با زدن روی آیکون پرچم بالای صفحه می‌توانید زبان را تغییر دهید.'
                  : 'The app checks your system language and sets the interface accordingly. By default, it uses US English, and you can switch to any language using the flag icon on top.'}
              </p>
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg)] rounded-xl border border-[var(--line)] text-xs font-bold">
                <span>{isRTL ? 'زبان فعلی فعال:' : 'Active App Language:'}</span>
                <span className="flex items-center gap-1.5 text-[var(--lapis)]">
                  <FlagIcon language={language} size={16} />
                  <span>{currentLangInfo.nativeName}</span>
                </span>
              </div>
            </section>

            {/* Privacy Policy Card */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative overflow-hidden">
              <div className="bg-[var(--turq)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <ShieldCheck size={13} className="text-white" />
                <span>{isRTL ? 'حریم خصوصی و پردازش صدا' : 'Privacy & Voice Security'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl mb-2.5">
                {isRTL 
                  ? 'اطلاعات شما با بالاترین استانداردهای امنیتی محافظت می‌شود. هیچ صدای ضبط‌شده‌ای در سرور ذخیره نمی‌شود و پردازش صدا مستقیماً روی دستگاه انجام می‌شود.' 
                  : 'Your voice data is processed securely on-device. No recordings are retained or transmitted to external servers.'}
              </p>
              <a
                href="./privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-[var(--lapis-soft)] text-[var(--lapis)] hover:bg-[var(--lapis)] hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>{isRTL ? 'مشاهده متن کامل سیاست حریم خصوصی' : 'Read Full Privacy Policy'}</span>
                <ExternalLink size={13} />
              </a>
            </section>
          </div>
        )}

      </div>

      {/* Floating reveal trigger when bars are hidden */}
      {!isBarsVisible && (
        <button
          onClick={showBars}
          aria-label="Show menu"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[var(--ink)] text-[var(--saffron)] border border-[var(--line)] rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse font-ui cursor-pointer"
        >
          <ChevronUp size={14} />
          <span>{t.resume || (isRTL ? 'ادامه' : 'Resume')}</span>
        </button>
      )}

      {/* Footer Return Drawer */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-bottom shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : 'translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] flex gap-4 font-ui">
          <button 
            onClick={handleClose} 
            className="start-btn w-full"
          >
            <span>{t?.resume || (isRTL ? 'بازگشت به بازی' : 'Back to Game')}</span>
            <Zap size={18} />
          </button>
        </div>
      </div>

      {/* Language Picker Modal inside Help if triggered */}
      {isLangPickerOpen && onLanguageChange && (
        <LanguagePickerModal
          isOpen={true}
          onClose={() => setIsLangPickerOpen(false)}
          selectedLanguage={language}
          onSelectLanguage={(lang) => {
            onLanguageChange(lang);
            setIsLangPickerOpen(false);
          }}
          mode="single"
          title={isRTL ? 'انتخاب زبان برنامه' : 'Select App Language'}
          subtitle={isRTL ? 'تغییر زبان رابط کاربری' : 'Switch UI Language'}
          isRTL={isRTL}
        />
      )}
    </div>
  );
};

export default HelpScreen;
