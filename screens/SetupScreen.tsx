import React, { useState } from 'react';
import { GameSettings, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { 
  NeonLightning, 
  NeonVolume, 
  NeonClock, 
  NeonUsers, 
  NeonSliders,
  NeonPhone
} from '../components/NeonIcons';
import { sound } from '../soundManager';
import { 
  Users, 
  Zap, 
  Clock, 
  Phone, 
  Volume2, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Wand2, 
  ChevronDown,
  VolumeX,
  Play
} from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp: () => void;
}

const SetupScreen: React.FC<Props> = ({ settings, onSave, onNext, onBack, onOpenHelp }) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fa;
  const isRTL = settings.language === 'fa' || settings.language === 'ar';
  
  // Accordion state - all sections collapsed by default as requested
  const [openSection, setOpenSection] = useState<string | null>(null);
  
  const updateSettings = (key: keyof GameSettings, value: any) => {
    onSave({ ...settings, [key]: value });
  };

  const toggleSection = (sectionId: string) => {
    sound.playClick();
    setOpenSection(prev => prev === sectionId ? null : sectionId);
  };

  // Quick speech test samples
  const speechSamples = [
    { text: 'سلام، حالت چطوره؟', lang: 'fa', label: 'فارسی' },
    { text: 'Hello, how are you today?', lang: 'en', label: 'انگلیسی' },
    { text: 'Hi, how are you doing?', lang: 'en-US', label: 'آمریکایی' },
    { text: 'Hallo, hoe gaat het?', lang: 'nl', label: 'هلندی' },
    { text: 'Hallo, wie geht es dir?', lang: 'de', label: 'آلمانی' },
    { text: 'Bonjour, comment ça va ?', lang: 'fr', label: 'فرانسوی' },
    { text: 'Hola, ¿qué tal?', lang: 'es', label: 'اسپانیایی' },
    { text: 'Ciao, come stai?', lang: 'it', label: 'ایتالیایی' },
    { text: 'Olá, tudo bem?', lang: 'pt', label: 'پرتغالی' },
    { text: 'مرحبا، كيف حالك؟', lang: 'ar', label: 'عربی' },
    { text: 'Merhaba, nasılsın?', lang: 'tr', label: 'ترکی' },
    { text: 'Cześć, jak się masz?', lang: 'pl', label: 'لهستانی' },
    { text: 'Привіт, як справи?', lang: 'uk', label: 'اوکراینی' },
    { text: '你好，你好吗？', lang: 'zh', label: 'چینی' },
    { text: 'こんにちは、元気ですか？', lang: 'ja', label: 'ژاپنی' },
    { text: '안녕하세요, 잘 지내세요?', lang: 'ko', label: 'کره‌ای' },
    { text: 'नमस्ते, आप कैसे हैं?', lang: 'hi', label: 'هندی' },
  ];

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white p-2.5 sm:p-3 border-[2.5px] border-[#0f172a] rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#f59e0b] border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shadow-[1px_1px_0px_0px_#0f172a]">
              <NeonSliders size={18} color="#0f172a" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider leading-tight">
                {t.setup}
              </h1>
              <span className="text-[10px] text-[#f59e0b] font-black block">
                مرحله ۳ از ۴: شخصی‌سازی و قوانین مسابقه
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }} 
            className="px-2.5 py-1.5 bg-[#f59e0b] hover:bg-amber-400 text-[#0f172a] border-2 border-[#0f172a] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#0f172a] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
          >
            <HelpCircle size={14} color="#0f172a" />
            <span>{t.guide}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area with Collapsible Accordion Sections */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-2 space-y-2 overscroll-contain">
        
        {/* SECTION 1: Audio & Voice Capabilities (صدا و قابلیت‌های تلفظ هوشمند) */}
        <section className="bg-white border-[2.5px] border-[#0f172a] shadow-[2.5px_2.5px_0px_0px_#0f172a] rounded-2xl overflow-hidden transition-all">
          {/* Header Toggle */}
          <button
            type="button"
            onClick={() => toggleSection('audio')}
            className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] text-right touch-manipulation hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#0ea5e9] border-2 border-[#0f172a] flex items-center justify-center text-white shrink-0 shadow-[1px_1px_0px_0px_#0f172a]">
                <Volume2 size={15} />
              </div>
              <div className="text-right truncate">
                <span className="text-xs sm:text-sm font-black text-[#0f172a] block leading-tight">
                  تنظیمات صدا و تلفظ هوشمند
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">
                  قابلیت‌های تلفظ صوتی نیتیو و افکت‌ها
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 border-2 border-[#0f172a] font-black text-[10px] rounded-lg ${
                settings.autoPronounceOnCorrect !== false ? 'bg-[#10b981] text-[#0f172a]' : 'bg-slate-200 text-slate-800'
              }`}>
                {settings.autoPronounceOnCorrect !== false ? 'تلفظ 🔊' : 'دستی 🔈'}
              </span>
              <span className={`px-2 py-0.5 border-2 border-[#0f172a] font-black text-[10px] rounded-lg ${
                settings.soundEnabled !== false ? 'bg-[#f59e0b] text-[#0f172a]' : 'bg-slate-200 text-slate-800'
              }`}>
                {settings.soundEnabled !== false ? 'صدا وصل' : 'بی‌صدا'}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[#0f172a] transition-transform duration-200 ${
                  openSection === 'audio' ? 'rotate-180' : 'rotate-0'
                }`} 
              />
            </div>
          </button>

          {/* Expanded Content */}
          {openSection === 'audio' && (
            <div className="p-3 border-t-2 border-[#241442]/20 space-y-3 bg-white">
              
              {/* Feature 1: Auto Pronunciation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-[#1a0833] flex items-center gap-1">
                    <span>۱. تلفظ صوتی پس از پاسخ صحیح 🗣️</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold">تقویت لهجه نیتیو</span>
                </div>
                <p className="text-[10.5px] font-bold text-slate-700 mb-2 leading-relaxed bg-[#F8EFFF] p-2 rounded-xl border border-[#241442]/30">
                  با ثبت پاسخ درست، تلفظ صوتی واژه با صدای طبیعی نیتیو پخش می‌شود تا تلفظ در حافظه شنیداری بازیکنان ثبت شود.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      sound.speak("Let's go!", 'en');
                      updateSettings('autoPronounceOnCorrect', true);
                    }}
                    className={`py-2 px-2 text-[11px] font-black uppercase rounded-xl border-2 border-[#241442] flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      settings.autoPronounceOnCorrect !== false
                        ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Volume2 size={14} />
                    <span>پخش خودکار تلفظ 🔊</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('autoPronounceOnCorrect', false);
                    }}
                    className={`py-2 px-2 text-[11px] font-black uppercase rounded-xl border-2 border-[#241442] flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      settings.autoPronounceOnCorrect === false
                        ? 'bg-[#FF007F] text-white shadow-[2px_2px_0px_0px_#241442]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Volume2 size={14} className="opacity-60" />
                    <span>فقط با دکمه روی کارت</span>
                  </button>
                </div>
              </div>

              {/* Feature 2: Interactive Live Voice Test */}
              <div className="pt-2 border-t border-dashed border-[#241442]/20">
                <span className="text-[11px] font-black text-[#1a0833] block mb-1.5">
                  ۲. تست زنده تلفظ همهٔ زبان‌ها (آنلاین، لمس برای شنیدن):
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {speechSamples.map(sample => (
                    <button
                      key={sample.lang}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        sound.speak(sample.text, sample.lang, { force: true });
                      }}
                      className="p-1.5 bg-[#FFF9E6] hover:bg-[#FFE600] active:scale-95 text-[#1a0833] border-2 border-[#241442] rounded-xl text-[10px] font-black shadow-[1.5px_1.5px_0px_0px_#241442] flex items-center justify-center gap-1 transition-all"
                    >
                      <Play size={10} className="fill-[#1a0833]" />
                      <span>{sample.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature 3: Game Sound Effects & BGM */}
              <div className="pt-2 border-t border-dashed border-[#241442]/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-[#1a0833]">
                    ۳. جلوه‌های صوتی و هیجان بازی:
                  </span>
                  <span className={`px-2 py-0.5 border-2 border-[#241442] font-black text-[9.5px] rounded-lg ${
                    settings.soundEnabled !== false ? 'bg-[#39FF14] text-[#1a0833]' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {settings.soundEnabled !== false ? 'فعال 🔊' : 'بی‌صدا 🔇'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.setMuted(false);
                      sound.playToggle();
                      sound.startMenuBGM();
                      updateSettings('soundEnabled', true);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#241442] flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      settings.soundEnabled !== false 
                        ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Volume2 size={14} />
                    <span>صدا و موزیک وصل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.setMuted(true);
                      updateSettings('soundEnabled', false);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#241442] flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      settings.soundEnabled === false 
                        ? 'bg-[#FF007F] text-white shadow-[2px_2px_0px_0px_#241442]' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <VolumeX size={14} />
                    <span>حالت بی‌صدا</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* SECTION 2: Players & Rounds (تعداد بازیکنان و دورها) */}
        <section className="bg-white border-[2.5px] border-[#241442] shadow-[2.5px_2.5px_0px_0px_#241442] rounded-2xl overflow-hidden transition-all">
          {/* Header Toggle */}
          <button
            type="button"
            onClick={() => toggleSection('players')}
            className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#F0FCFF] to-[#E6F8FF] text-right touch-manipulation hover:bg-[#DDF4FF] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#00F0FF] border-2 border-[#241442] flex items-center justify-center text-[#1a0833] shrink-0 shadow-[1px_1px_0px_0px_#241442]">
                <Users size={15} />
              </div>
              <div className="text-right truncate">
                <span className="text-xs sm:text-sm font-black text-[#1a0833] block leading-tight">
                  {t.players} و دورهای مسابقه
                </span>
                <span className="text-[10px] text-cyan-800 font-bold block">
                  ترکیب تیم‌ها و طول بازی
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 bg-[#FFE600] border-2 border-[#241442] font-black text-[10px] text-[#1a0833] rounded-lg">
                {settings.playerCount} نفر • {settings.roundsCount} دور
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[#241442] transition-transform duration-200 ${
                  openSection === 'players' ? 'rotate-180' : 'rotate-0'
                }`} 
              />
            </div>
          </button>

          {/* Expanded Content */}
          {openSection === 'players' && (
            <div className="p-3 border-t-2 border-[#241442]/20 space-y-3 bg-white">
              <div>
                <label className="text-xs font-black text-[#1a0833] block mb-1.5">
                  تعداد کل بازیکنان (۲ بازیکن در هر تیم):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 6, 8].map(count => {
                    const isSelected = settings.playerCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          sound.playToggle();
                          updateSettings('playerCount', count);
                        }}
                        className={`p-2 rounded-xl border-2 border-[#241442] flex flex-col items-center justify-center font-black transition-all active:scale-95 ${
                          isSelected 
                            ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] -translate-y-0.5' 
                            : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black">{count} {t.players}</span>
                        <span className="text-[9.5px] text-slate-600 font-bold">
                          ({count / 2} تیم)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-[#241442]/20">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-black text-[#1a0833]">{t.rounds} مسابقه:</span>
                  <span className="bg-[#FF007F] text-white px-2.5 py-0.5 border-2 border-[#241442] font-black text-xs rounded-lg shadow-[1.5px_1.5px_0px_0px_#241442]">
                    {settings.roundsCount} {t.round}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-[#F4E8FF] p-2 rounded-xl border-2 border-[#241442]">
                  <span className="text-xs font-black text-slate-700">۳</span>
                  <input 
                    type="range" min="3" max="10" step="1"
                    value={settings.roundsCount}
                    onChange={(e) => {
                      sound.playClick();
                      updateSettings('roundsCount', parseInt(e.target.value));
                    }}
                    className="w-full h-3 bg-white border-2 border-[#241442] rounded-lg appearance-none cursor-pointer accent-[#FF007F]"
                    style={{ outline: 'none' }}
                  />
                  <span className="text-xs font-black text-slate-700">۱۰</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: Round Duration / Time Management (زمان هر دور مسابقه) */}
        <section className="bg-white border-[2.5px] border-[#241442] shadow-[2.5px_2.5px_0px_0px_#241442] rounded-2xl overflow-hidden transition-all">
          {/* Header Toggle */}
          <button
            type="button"
            onClick={() => toggleSection('timer')}
            className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#FFFEE6] to-[#FFF9D2] text-right touch-manipulation hover:bg-[#FFF4BC] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#1a0833] shrink-0 shadow-[1px_1px_0px_0px_#241442]">
                <Clock size={15} />
              </div>
              <div className="text-right truncate">
                <span className="text-xs sm:text-sm font-black text-[#1a0833] block leading-tight">
                  {t.duration || 'زمان هر نوبت / مسابقه'}
                </span>
                <span className="text-[10px] text-yellow-900 font-bold block">
                  سرعت و چالش هر دور
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 bg-[#00F0FF] border-2 border-[#241442] font-black text-[10px] text-[#1a0833] rounded-lg shadow-[1px_1px_0px_0px_#241442]">
                {settings.roundDuration} {t.seconds}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[#241442] transition-transform duration-200 ${
                  openSection === 'timer' ? 'rotate-180' : 'rotate-0'
                }`} 
              />
            </div>
          </button>

          {/* Expanded Content */}
          {openSection === 'timer' && (
            <div className="p-3 border-t-2 border-[#241442]/20 space-y-2.5 bg-white">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { sec: 30, label: '۳۰ث (برق‌آسا ⚡)' },
                  { sec: 45, label: '۴۵ث (پارتی 🎯)' },
                  { sec: 60, label: '۶۰ث (کلاسیک ⏱️)' },
                  { sec: 75, label: '۷۵ث (متعادل ⚖️)' },
                  { sec: 90, label: '۹۰ث (تمرکزی 🧠)' },
                  { sec: 120, label: '۱۲۰ث (مکالمه 🧘)' }
                ].map(preset => {
                  const isSelected = settings.roundDuration === preset.sec;
                  return (
                    <button
                      key={preset.sec}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        updateSettings('roundDuration', preset.sec);
                      }}
                      className={`py-2 px-1 rounded-xl font-black text-[10.5px] border-2 border-[#241442] transition-all flex items-center justify-center active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#00F0FF] to-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] -translate-y-0.5'
                          : 'bg-[#F9F5FF] text-slate-800 hover:bg-[#F2E8FF]'
                      }`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 bg-[#F4E8FF] p-2 rounded-xl border-2 border-[#241442]">
                <span className="text-[11px] font-black text-slate-700 shrink-0">۲۰ث</span>
                <input 
                  type="range" min="20" max="180" step="5"
                  value={settings.roundDuration}
                  onChange={(e) => {
                    sound.playClick();
                    updateSettings('roundDuration', parseInt(e.target.value));
                  }}
                  className="w-full h-3 bg-white border-2 border-[#241442] rounded-lg appearance-none cursor-pointer accent-[#FF007F]"
                  style={{ outline: 'none' }}
                />
                <span className="text-[11px] font-black text-slate-700 shrink-0">۱۸۰ث</span>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: Game Rules & Power Cards (قوانین بازی و کارت‌های قدرت) */}
        <section className="bg-white border-[2.5px] border-[#0f172a] shadow-[2.5px_2.5px_0px_0px_#0f172a] rounded-2xl overflow-hidden transition-all">
          {/* Header Toggle */}
          <button
            type="button"
            onClick={() => toggleSection('gameplay')}
            className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] text-right touch-manipulation hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#f43f5e] border-2 border-[#0f172a] flex items-center justify-center text-white shrink-0 shadow-[1px_1px_0px_0px_#0f172a]">
                <Wand2 size={15} />
              </div>
              <div className="text-right truncate">
                <span className="text-xs sm:text-sm font-black text-[#0f172a] block leading-tight">
                  قوانین مسابقه و کارت‌های شانس
                </span>
                <span className="text-[10px] text-slate-500 font-bold block">
                  کارت قدرت، ترجمه معکوس و تحویل گوشی
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 border-2 border-[#0f172a] font-black text-[10px] rounded-lg ${
                settings.powerCardsEnabled !== false ? 'bg-[#10b981] text-[#0f172a]' : 'bg-slate-200 text-slate-800'
              }`}>
                {settings.powerCardsEnabled !== false ? 'کارت شانس ⚡' : 'ساده'}
              </span>
              <span className="px-2 py-0.5 border-2 border-[#0f172a] bg-[#0ea5e9] text-white font-black text-[10px] rounded-lg">
                {settings.cardGameMode === 'reverse' ? 'معکوس 🔄' : settings.cardGameMode === 'standard' ? 'کلاسیک 🎯' : 'ترکیبی 🔀'}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[#0f172a] transition-transform duration-200 ${
                  openSection === 'gameplay' ? 'rotate-180' : 'rotate-0'
                }`} 
              />
            </div>
          </button>

          {/* Expanded Content */}
          {openSection === 'gameplay' && (
            <div className="p-3 border-t-2 border-[#241442]/20 space-y-3 bg-white">
              
              {/* Power Cards Toggle */}
              <div>
                <label className="text-xs font-black text-[#1a0833] block mb-1">
                  کارت‌های شانس و قدرت (+۱۰ ثانیه، راهنما، رد کردن):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('powerCardsEnabled', true);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#241442] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.powerCardsEnabled !== false 
                        ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>فعال بودن کارت‌های قدرت 🔥</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('powerCardsEnabled', false);
                    }}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border-2 border-[#241442] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.powerCardsEnabled === false 
                        ? 'bg-[#FF007F] text-white shadow-[2px_2px_0px_0px_#241442]' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>کلاسیک (بدون کارت قدرت)</span>
                  </button>
                </div>
              </div>

              {/* Translation Card Mode */}
              <div className="pt-2 border-t border-dashed border-[#241442]/20">
                <label className="text-xs font-black text-[#1a0833] block mb-1">
                  حالت کارت‌ها و ترجمه معکوس:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('cardGameMode', 'mixed');
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#241442] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      settings.cardGameMode === 'mixed' || !settings.cardGameMode
                        ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
                        : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>🔀 ترکیبی هوشمند</span>
                    <span className="text-[8.5px] text-slate-600 font-bold">(توضیح + ترجمه)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('cardGameMode', 'reverse');
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#241442] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      settings.cardGameMode === 'reverse'
                        ? 'bg-[#FFE600] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
                        : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>🔄 ترجمه معکوس</span>
                    <span className="text-[8.5px] text-slate-600 font-bold">(فارسی ➔ هدف)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('cardGameMode', 'standard');
                    }}
                    className={`p-2 rounded-xl font-black text-[10px] border-2 border-[#241442] flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      settings.cardGameMode === 'standard'
                        ? 'bg-[#00F0FF] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
                        : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>🎯 کلاسیک</span>
                    <span className="text-[8.5px] text-slate-600 font-bold">(توضیح کلمه)</span>
                  </button>
                </div>
              </div>

              {/* Pass Phone Screen Mode */}
              <div className="pt-2 border-t border-dashed border-[#241442]/20">
                <label className="text-xs font-black text-[#1a0833] block mb-1">
                  نحوه تحویل گوشی به نفر بعدی:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('passPhoneScreenEnabled', false);
                    }}
                    className={`p-2 rounded-xl font-black text-[10.5px] border-2 border-[#241442] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      !settings.passPhoneScreenEnabled
                        ? 'bg-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Zap size={13} />
                    <span>شروع فوری (سیب‌زمینی داغ ⚡)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      updateSettings('passPhoneScreenEnabled', true);
                    }}
                    className={`p-2 rounded-xl font-black text-[10.5px] border-2 border-[#241442] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      settings.passPhoneScreenEnabled
                        ? 'bg-[#00F0FF] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Phone size={13} />
                    <span>صفحه تایید و تحویل نوبت</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* Small Mascot Banner at bottom of scrollable area */}
        <div className="p-2 bg-white/95 border-2 border-[#241442] rounded-2xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#241442]">
          <TeamMascot color="YELLOW" size={24} />
          <span className="text-[11px] text-[#1a0833] font-black">
            {settings.language === 'fa' 
              ? '⚡ هر عنوان را لمس کنید تا تنظیمات مربوط به آن باز یا بسته شود' 
              : '⚡ Tap any title above to expand or collapse its options'}
          </span>
        </div>

      </div>

      {/* Fixed Footer Navigation */}
      <footer className="shrink-0 pt-2 border-t-2 border-[#241442]/20">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
          >
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t.back}</span>
          </button>
          <button 
            type="button"
            onClick={() => {
              sound.playStartGame();
              onNext();
            }} 
            className="pixel-btn pixel-btn-pink flex-[2] py-2.5 text-sm sm:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{t.next} (اسامی بازیکنان)</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </footer>

    </div>
  );
};

export default SetupScreen;
