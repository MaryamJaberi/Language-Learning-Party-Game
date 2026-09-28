import React, { useState, useEffect, useRef } from 'react';
import { GameSettings } from '../types';
import { TRANSLATIONS } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { NeonSliders } from '../components/NeonIcons';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import { LanguageAndCefrDropdowns } from '../components/LanguageAndCefrDropdowns';
import { TopicsSettingsAccordion } from '../components/TopicsSettingsAccordion';
import { sound } from '../soundManager';
import { getRandomCharacters } from '../characters';
import { 
  Users, 
  Zap, 
  Clock, 
  Phone, 
  Volume2, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  ChevronDown, 
  Sparkles,
  Sliders,
  Globe,
  Layers,
  Play,
  Dices
} from 'lucide-react';

import { tUI, isRtlLang } from '../ui';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
}

const SetupScreen: React.FC<Props> = ({ settings, onSave, onNext, onBack, onOpenHelp }) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en || TRANSLATIONS.fa;
  const isRTL = isRtlLang(settings.language);
  
  // Accordion state for settings sections
  const [openSection, setOpenSection] = useState<string | null>('players');

  // Auto-initialize player names with cartoon defaults matching the native language
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    const isEnglishNative = settings.nativeLanguage === 'en-US' || settings.nativeLanguage === 'en' || settings.language === 'en-US' || settings.language === 'en';
    const effectiveLang = isEnglishNative ? 'en-US' : (settings.nativeLanguage || settings.language || 'en-US');
    const defaults = getRandomCharacters(effectiveLang, 8);
    const currentNames = settings.playerNames || [];
    const hasAnyEmpty = Array.from({ length: settings.playerCount }).some(
      (_, i) => !currentNames[i] || currentNames[i].trim().length === 0
    );
    const hasPersianNames = currentNames.some(name => /[\u0600-\u06FF]/.test(name));

    if (hasAnyEmpty || (isEnglishNative && hasPersianNames)) {
      initializedRef.current = true;
      const updatedNames = (isEnglishNative && hasPersianNames)
        ? defaults
        : Array.from({ length: 8 }).map(
            (_, i) => (currentNames[i] && currentNames[i].trim().length > 0) ? currentNames[i] : defaults[i]
          );
      onSave({
        ...settings,
        playerNames: updatedNames,
        language: (isEnglishNative && settings.language === 'fa') ? 'en-US' : settings.language
      });
    }
  }, [settings.playerCount, settings.language, settings.nativeLanguage]);
  
  const updateSettings = (key: keyof GameSettings, value: any) => {
    onSave({ ...settings, [key]: value });
  };

  const updatePlayerName = (index: number, name: string) => {
    const names = [...(settings.playerNames || [])];
    names[index] = name;
    onSave({ ...settings, playerNames: names });
  };

  const randomizePlayerNames = () => {
    sound.playPowerUp();
    const isEnglishNative = settings.nativeLanguage === 'en-US' || settings.nativeLanguage === 'en' || settings.language === 'en-US' || settings.language === 'en';
    const effectiveLang = isEnglishNative ? 'en-US' : (settings.nativeLanguage || settings.language || 'en-US');
    const newCharacters = getRandomCharacters(effectiveLang, 8);
    onSave({
      ...settings,
      playerNames: newCharacters
    });
  };

  const toggleSection = (sectionId: string) => {
    sound.playClick();
    setOpenSection(prev => prev === sectionId ? null : sectionId);
  };

  // Quick speech test samples
  const speechSamples = [
    { text: 'Hello, welcome to DOUR!', lang: 'en', label: isRTL ? 'انگلیسی 🇬🇧' : 'English 🇬🇧' },
    { text: 'Hallo, welkom bij het spel!', lang: 'nl', label: isRTL ? 'هلندی 🇳🇱' : 'Dutch 🇳🇱' },
    { text: 'Guten Tag, wie geht es dir?', lang: 'de', label: isRTL ? 'آلمانی 🇩🇪' : 'German 🇩🇪' },
    { text: 'Bonjour, enchanté!', lang: 'fr', label: isRTL ? 'فرانسوی 🇫🇷' : 'French 🇫🇷' },
    { text: '¡Hola, qué tal!', lang: 'es', label: isRTL ? 'اسپانیایی 🇪🇸' : 'Spanish 🇪🇸' },
    { text: 'سلام، به بازی دور خوش آمدید!', lang: 'fa', label: isRTL ? 'فارسی 🇮🇷' : 'Persian 🇮🇷' }
  ];

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2 font-ui">
        <div className="flex items-center justify-between bg-[#FFFBF4] text-[#1E1B2E] p-2.5 sm:p-3 border-2 border-[#1E1B2E] rounded-[20px] shadow-[3px_3px_0px_0px_#1E1B2E]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[14px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
              <NeonSliders size={18} color="#1E1B2E" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-display leading-tight text-[#1E1B2E]">
                {t.setup}
              </h1>
              <span className="text-[11px] text-[#1E1B2E]/60 font-medium block">
                {isRTL ? 'تنظیمات زبان، موضوعات و قوانین مسابقه' : 'Match settings, languages & rules'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick sound mute/unmute control right at top beside Help */}
            <SoundHeaderButton language={settings.language} />

            <button 
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenHelp?.();
              }} 
              className="px-3 py-1.5 bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] font-bold text-xs rounded-[14px] shadow-[2px_2px_0px_0px_#1E1B2E] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
            >
              <HelpCircle size={15} color="#1E1B2E" />
              <span>{t.guide}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Direct, Unified & Streamlined */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-2 space-y-2.5 overscroll-contain">
        
        {/* SECTION 1: Direct In-Place Languages, Search, Tags & CEFR (No dropdowns, no popular languages) */}
        <LanguageAndCefrDropdowns
          settings={settings}
          onSave={onSave}
          defaultOpenSection={null}
        />

        {/* SECTION 2: Players Count & Inline Player Names (Eliminating Redundant Separate Players Screen) */}
        <section className="bg-white border-[2.5px] border-[#0f172a] shadow-[2.5px_2.5px_0px_0px_#0f172a] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('players')}
            className={`w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] hover:bg-slate-100 transition-colors touch-manipulation ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#00F0FF] border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shrink-0 shadow-[1px_1px_0px_0px_#0f172a]">
                <Users size={15} />
              </div>
              <div className={`truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                <span className="text-xs sm:text-sm font-black text-[#0f172a] block leading-tight">
                  {isRTL ? `${t.players} و دورهای مسابقه` : `${t.players} & Match Rounds`}
                </span>
                <span className="text-[10px] text-slate-500 font-bold block truncate">
                  {settings.playerCount} {t.players} • {settings.playerCount / 2} {isRTL ? 'تیم' : 'Teams'} • {settings.roundsCount} {t.rounds}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 bg-[#FFE600] border border-[#0f172a] font-black text-[10px] text-[#0f172a] rounded-lg shadow-[1px_1px_0px_0px_#0f172a]">
                {settings.playerCount} {t.players}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[#0f172a] transition-transform duration-200 ${openSection === 'players' ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {openSection === 'players' && (
            <div className="p-3 border-t-2 border-[#0f172a] space-y-3 bg-[#fafafa] animate-fadeIn">
              <div>
                <label className="text-xs font-black text-[#0f172a] block mb-1.5">
                  {isRTL ? 'تعداد کل بازیکنان (۲ بازیکن در هر تیم):' : 'Total Players (2 per team):'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[4, 6, 8, 10].map(count => {
                    const isSelected = settings.playerCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        aria-label={`${count} ${t.players}`}
                        onClick={() => {
                          sound.playToggle();
                          updateSettings('playerCount', count);
                        }}
                        className={`p-2 rounded-xl border-2 border-[#0f172a] flex flex-col items-center justify-center font-black transition-all active:scale-95 ${
                          isSelected 
                            ? 'bg-[#39FF14] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a] -translate-y-0.5' 
                            : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black">{count} {t.players}</span>
                        <span className="text-[9px] text-slate-500 font-bold">
                          ({count / 2} {isRTL ? 'تیم' : 'Teams'})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inline Player Names Editor */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-[#0f172a]">
                    {isRTL ? 'اسامی بازیکنان و تیم‌ها:' : 'Player Names & Teams:'}
                  </span>
                  <button
                    type="button"
                    onClick={randomizePlayerNames}
                    className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#FFE600] border border-[#0f172a] text-[#0f172a] flex items-center gap-1 hover:bg-yellow-300 active:scale-95 shadow-[1px_1px_0px_0px_#0f172a]"
                  >
                    <Dices size={12} />
                    <span>{isRTL ? 'اسامی تصادفی 🎲' : 'Randomize 🎲'}</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  {Array.from({ length: settings.playerCount }).map((_, i) => {
                    const teamIdx = i % (settings.playerCount / 2);
                    const teamColorBadge = teamIdx === 0 ? 'bg-blue-500' : teamIdx === 1 ? 'bg-rose-500' : teamIdx === 2 ? 'bg-emerald-500' : 'bg-amber-500';
                    const teamName = isRTL ? `تیم ${teamIdx + 1}` : `Team ${teamIdx + 1}`;

                    return (
                      <div 
                        key={i} 
                        className="flex items-center gap-1.5 bg-white border-2 border-[#0f172a] rounded-xl px-2 py-1.5 shadow-[1px_1px_0px_0px_#0f172a]"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 border border-[#0f172a] ${teamColorBadge}`} title={teamName} />
                        <input
                          type="text"
                          value={settings.playerNames?.[i] || ''}
                          onChange={(e) => updatePlayerName(i, e.target.value)}
                          placeholder={isRTL ? `بازیکن ${i + 1}` : `Player ${i + 1}`}
                          className="w-full text-xs font-black text-[#0f172a] bg-transparent outline-none truncate"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rounds Count Slider */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-black text-[#0f172a]">
                    {isRTL ? `${t.rounds} مسابقه:` : 'Match Rounds:'}
                  </span>
                  <span className="bg-[#FF007F] text-white px-2.5 py-0.5 border border-[#0f172a] font-black text-xs rounded-lg shadow-[1px_1px_0px_0px_#0f172a]">
                    {settings.roundsCount} {t.round}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border-2 border-[#0f172a]">
                  <span className="text-xs font-black text-slate-600">{isRTL ? '۳' : '3'}</span>
                  <input 
                    type="range" min="3" max="10" step="1"
                    value={settings.roundsCount}
                    onChange={(e) => {
                      sound.playClick();
                      updateSettings('roundsCount', parseInt(e.target.value));
                    }}
                    className="w-full accent-[#FF007F] h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-600">{isRTL ? '۱۰' : '10'}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: Topics & Situations */}
        <TopicsSettingsAccordion
          settings={settings}
          onSave={onSave}
          isOpenDefault={false}
        />

        {/* SECTION 4: Duration & Speed */}
        <section className="bg-white border-[2.5px] border-[#0f172a] shadow-[2.5px_2.5px_0px_0px_#0f172a] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('duration')}
            className={`w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] hover:bg-slate-100 transition-colors touch-manipulation ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#FFE600] border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shrink-0 shadow-[1px_1px_0px_0px_#0f172a]">
                <Clock size={15} />
              </div>
              <div className={`truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                <span className="text-xs sm:text-sm font-black text-[#0f172a] block leading-tight">
                  {isRTL ? `${t.roundDuration} و سرعت بازی` : 'Round Duration & Pace'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold block truncate">
                  {isRTL ? `${settings.roundDuration} ثانیه برای هر نوبت` : `${settings.roundDuration} seconds per turn`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 bg-[#FFE600] border border-[#0f172a] font-black text-[10px] text-[#0f172a] rounded-lg shadow-[1px_1px_0px_0px_#0f172a]">
                {settings.roundDuration} {isRTL ? 'ثانیه' : 's'}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[#0f172a] transition-transform duration-200 ${openSection === 'duration' ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {openSection === 'duration' && (
            <div className="p-3 border-t-2 border-[#0f172a] space-y-3 bg-[#fafafa] animate-fadeIn">
              <div className="grid grid-cols-4 gap-1.5">
                {[30, 45, 60, 90].map(sec => {
                  const isSelected = settings.roundDuration === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        sound.playToggle();
                        updateSettings('roundDuration', sec);
                      }}
                      className={`p-2 rounded-xl font-black text-xs border-2 border-[#0f172a] transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#FFE600] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a] -translate-y-0.5'
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{sec} {t.seconds}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border-2 border-[#0f172a]">
                <span className="text-xs font-black text-slate-600">{isRTL ? '۲۰s' : '20s'}</span>
                <input 
                  type="range" min="20" max="120" step="5"
                  value={settings.roundDuration}
                  onChange={(e) => {
                    sound.playClick();
                    updateSettings('roundDuration', parseInt(e.target.value));
                  }}
                  className="w-full accent-[#f59e0b] h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-black text-slate-600">{isRTL ? '۱۲۰s' : '120s'}</span>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 5: Special Features, Pronunciation & Rules */}
        <section className="bg-white border-[2.5px] border-[#0f172a] shadow-[2.5px_2.5px_0px_0px_#0f172a] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('rules')}
            className={`w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] hover:bg-slate-100 transition-colors touch-manipulation ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#39FF14] border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shrink-0 shadow-[1px_1px_0px_0px_#0f172a]">
                <Zap size={15} />
              </div>
              <div className={`truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                <span className="text-xs sm:text-sm font-black text-[#0f172a] block leading-tight">
                  {isRTL ? 'کارت‌های قدرت و تلفظ هوشمند' : 'Power Cards & Pronunciation'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold block truncate">
                  {isRTL ? 'تلفظ خودکار، ترجمه معکوس و قوانین' : 'Auto pronounce, reverse mode & rules'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 bg-[#39FF14] border border-[#0f172a] font-black text-[10px] text-[#0f172a] rounded-lg shadow-[1px_1px_0px_0px_#0f172a]">
                {isRTL ? 'فعال' : 'ON'}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[#0f172a] transition-transform duration-200 ${openSection === 'rules' ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {openSection === 'rules' && (
            <div className="p-3 border-t-2 border-[#0f172a] space-y-3 bg-[#fafafa] animate-fadeIn">
              {/* Feature: Auto Pronunciation */}
              <div>
                <label className="text-xs font-black text-[#0f172a] block mb-1">
                  {isRTL ? 'تلفظ صوتی پس از پاسخ درست:' : 'Auto Pronunciation on Correct:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('autoPronounceOnCorrect', true);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#0f172a] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.autoPronounceOnCorrect !== false 
                        ? 'bg-[#39FF14] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]' 
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Volume2 size={13} />
                    <span>{isRTL ? 'پخش خودکار نیتیو 🔊' : 'Native Auto-Play 🔊'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('autoPronounceOnCorrect', false);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#0f172a] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.autoPronounceOnCorrect === false 
                        ? 'bg-[#FF007F] text-white shadow-[1.5px_1.5px_0px_0px_#0f172a]' 
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isRTL ? 'دستی (با دکمه روی کارت)' : 'Manual (Card Button)'}</span>
                  </button>
                </div>

                {/* Quick Voice Test Bar */}
                <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar" dir="ltr">
                  {speechSamples.map(sample => (
                    <button
                      key={sample.lang}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        sound.speak(sample.text, sample.lang);
                      }}
                      className="px-2 py-1 bg-white hover:bg-amber-100 active:scale-95 text-[#0f172a] border border-[#0f172a] rounded-lg text-[9.5px] font-black shrink-0 flex items-center gap-1 transition-all"
                    >
                      <Play size={9} className="fill-[#0f172a]" />
                      <span>{sample.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Power Cards Enable */}
              <div className="pt-2 border-t border-slate-200">
                <label className="text-xs font-black text-[#0f172a] block mb-1">
                  {isRTL ? 'کارت‌های قدرت و چالش ویژه:' : 'Power Cards & Challenges:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('powerCardsEnabled', true);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#0f172a] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.powerCardsEnabled !== false 
                        ? 'bg-[#39FF14] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]' 
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isRTL ? 'فعال بودن کارت‌های قدرت 🔥' : 'Enable Power Cards 🔥'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('powerCardsEnabled', false);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#0f172a] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.powerCardsEnabled === false 
                        ? 'bg-[#FF007F] text-white shadow-[1.5px_1.5px_0px_0px_#0f172a]' 
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isRTL ? 'کلاسیک (بدون کارت قدرت)' : 'Classic (No Power Cards)'}</span>
                  </button>
                </div>
              </div>

              {/* Translation Card Mode */}
              <div className="pt-2 border-t border-slate-200">
                <label className="text-xs font-black text-[#0f172a] block mb-1">
                  {isRTL ? 'حالت کارت‌ها و ترجمه:' : 'Card & Translation Mode:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('cardGameMode', 'mixed');
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#0f172a] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      settings.cardGameMode === 'mixed' || !settings.cardGameMode
                        ? 'bg-[#39FF14] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isRTL ? '🔀 ترکیبی' : '🔀 Mixed'}</span>
                    <span className="text-[8.5px] text-slate-500 font-bold">{isRTL ? '(توضیح + ترجمه)' : '(Describe + Translate)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('cardGameMode', 'reverse');
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#0f172a] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      settings.cardGameMode === 'reverse'
                        ? 'bg-[#FFE600] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isRTL ? '🔄 ترجمه معکوس' : '🔄 Reverse'}</span>
                    <span className="text-[8.5px] text-slate-500 font-bold">{isRTL ? '(مبدا ➔ هدف)' : '(Native ➔ Target)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('cardGameMode', 'standard');
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#0f172a] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      settings.cardGameMode === 'standard'
                        ? 'bg-[#00F0FF] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isRTL ? '🎯 کلاسیک' : '🎯 Classic'}</span>
                    <span className="text-[8.5px] text-slate-500 font-bold">{isRTL ? '(توضیح کلمه)' : '(Word Description)'}</span>
                  </button>
                </div>
              </div>

              {/* Pass Phone Screen Mode */}
              <div className="pt-2 border-t border-slate-200">
                <label className="text-xs font-black text-[#0f172a] block mb-1">
                  {isRTL ? 'نحوه تحویل گوشی به نفر بعدی:' : 'Turn Handover Style:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('passPhoneScreenEnabled', false);
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#0f172a] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      !settings.passPhoneScreenEnabled
                        ? 'bg-[#39FF14] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Zap size={12} />
                    <span>{isRTL ? 'شروع فوری (سیب‌زمینی داغ ⚡)' : 'Instant Hot Potato ⚡'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('passPhoneScreenEnabled', true);
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#0f172a] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.passPhoneScreenEnabled
                        ? 'bg-[#00F0FF] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Phone size={12} />
                    <span>{isRTL ? 'صفحه تایید تحویل نوبت' : 'Handover Screen'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* Fixed Footer Navigation */}
      <footer className="shrink-0 pt-2 border-t-2 border-[#1E1B2E] font-ui">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-mustard flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-[18px]"
          >
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{t.back}</span>
          </button>
          <button 
            type="button"
            onClick={() => {
              sound.playStartGame();
              onNext();
            }} 
            className="pixel-btn pixel-btn-orange flex-[2] py-3 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[18px]"
          >
            <span>{isRTL ? 'مرحله بعد: چیدمان دور میز و شروع بازی ⚡' : 'Next: Table Seating & Play ⚡'}</span>
            {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </footer>

    </div>
  );
};

export default SetupScreen;
