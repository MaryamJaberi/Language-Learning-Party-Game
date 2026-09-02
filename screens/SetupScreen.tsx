import React from 'react';
import { GameSettings } from '../types';
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
import { Users, Zap, Clock, Phone, Volume2, HelpCircle, ArrowRight, ArrowLeft, Wand2, Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { useGoogleScrollBars } from '../useGoogleScrollBars';

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
  const { isBarsVisible, scrollContainerRef, handleScroll, showBars } = useGoogleScrollBars();
  
  const updateSettings = (key: keyof GameSettings, value: any) => {
    onSave({ ...settings, [key]: value });
  };

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3.5 sm:p-4 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header with Google-style dynamic auto-hide/reveal on scroll */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-28 mb-2' 
            : '-translate-y-12 opacity-0 max-h-0 mb-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#7B2CBF] via-[#FF007F] to-[#FF2E93] text-white p-3 border-[3.5px] border-[#241442] rounded-2xl shadow-[4px_4px_0px_0px_#241442]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#241442] shadow-[1px_1px_0px_0px_#241442]">
              <NeonSliders size={18} color="#241442" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">{t.setup}</h2>
              <span className="text-[10px] text-[#FFE600] font-black block">
                مرحله ۳ از ۴: بازیکنان و قوانین مسابقه
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }} 
            className="px-3 py-1.5 bg-[#FFE600] hover:bg-yellow-300 text-[#1a0833] border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
          >
            <HelpCircle size={15} color="#1a0833" />
            <span>{t.guide}</span>
          </button>
        </div>
      </div>

      {/* Main Form Dashboard */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto pr-1 pb-3 space-y-3 overscroll-contain"
      >
        
        {/* Player Count */}
        <section className="bg-white p-3.5 sm:p-4 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#00F0FF] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <Users size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">{t.players}</label>
            </div>
            <span className="text-[10px] bg-[#FFE600] border-2 border-[#241442] text-[#1a0833] px-2 py-0.5 rounded-lg font-black">
              ۲ بازیکن در هر تیم (روبروی هم)
            </span>
          </div>
          <div className="flex gap-2">
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
                  className={`pixel-btn flex-1 py-2.5 flex flex-col items-center justify-center font-black transition-all ${
                    isSelected 
                    ? 'pixel-btn-lime text-[#1a0833]' 
                    : 'pixel-btn-dark text-[#00F0FF]'
                  }`}
                >
                  <span className="text-sm sm:text-base font-black">{count} {t.players}</span>
                  <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-[#1a0833]' : 'text-slate-200'}`}>
                    ({count/2} {settings.language === 'fa' ? 'تیم' : 'Teams'})
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Power Cards & Combos Toggle */}
        <section className="bg-white p-3.5 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FF007F] border-2 border-[#241442] flex items-center justify-center text-white">
                <Wand2 size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                کارت‌های قدرت و ضریب کمبو 🔥
              </label>
            </div>
            <span className={`px-2.5 py-0.5 border-2 border-[#241442] font-black text-[10px] rounded-xl ${
              settings.powerCardsEnabled !== false ? 'bg-[#39FF14] text-[#1a0833]' : 'bg-slate-200 text-slate-800'
            }`}>
              {settings.powerCardsEnabled !== false ? 'فعال ⚡' : 'غیرفعال'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                updateSettings('powerCardsEnabled', true);
              }}
              className={`pixel-btn flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                settings.powerCardsEnabled !== false ? 'pixel-btn-lime text-[#1a0833]' : 'pixel-btn-dark text-[#00F0FF]'
              }`}
            >
              کارت‌های قدرت +۱۰ ثانیه و راهنما
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                updateSettings('powerCardsEnabled', false);
              }}
              className={`pixel-btn flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                settings.powerCardsEnabled === false ? 'pixel-btn-pink text-white' : 'pixel-btn-dark text-[#00F0FF]'
              }`}
            >
              کلاسیک و بدون کارت قدرت
            </button>
          </div>
        </section>

        {/* Rounds Count Slider */}
        <section className="bg-white p-3.5 sm:p-4 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FF007F] border-2 border-[#241442] flex items-center justify-center text-white">
                <NeonLightning size={14} color="#FFE600" />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">{t.rounds}</label>
            </div>
            <span className="bg-[#FF007F] text-white px-3 py-0.5 border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442]">
              {settings.roundsCount} {t.round}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs font-bold text-slate-700">3</span>
            <input 
              type="range" min="3" max="10" step="1"
              value={settings.roundsCount}
              onChange={(e) => {
                sound.playClick();
                updateSettings('roundsCount', parseInt(e.target.value));
              }}
              className="w-full h-3 bg-[#F4E8FF] border-2 border-[#241442] rounded-lg appearance-none cursor-pointer accent-[#FF007F]"
              style={{ outline: 'none' }}
            />
            <span className="text-xs font-bold text-slate-700">10</span>
          </div>
        </section>

        {/* Round Duration Slider */}
        <section className="bg-white p-3.5 sm:p-4 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#00F0FF] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <Clock size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">{t.duration}</label>
            </div>
            <span className="bg-[#00F0FF] text-[#1a0833] px-3 py-0.5 border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442]">
              {settings.roundDuration} {t.seconds}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs font-bold text-slate-700">60s</span>
            <input 
              type="range" min="60" max="300" step="15"
              value={settings.roundDuration}
              onChange={(e) => {
                sound.playClick();
                updateSettings('roundDuration', parseInt(e.target.value));
              }}
              className="w-full h-3 bg-[#F4E8FF] border-2 border-[#241442] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
              style={{ outline: 'none' }}
            />
            <span className="text-xs font-bold text-slate-700">300s</span>
          </div>
        </section>

        {/* Turn Passing Mode */}
        <section className="bg-white p-3.5 sm:p-4 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <Phone size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                حالت تحویل گوشی
              </label>
            </div>
            <span className="bg-[#FFE600] text-[#1a0833] px-2.5 py-0.5 border-2 border-[#241442] font-black text-[10px] rounded-xl shadow-[2px_2px_0px_0px_#241442]">
              {settings.passPhoneScreenEnabled ? 'صفحه حائل و مخفی‌سازی' : 'انتقال فوق سریع ⚡'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                updateSettings('passPhoneScreenEnabled', false);
              }}
              className={`pixel-btn py-2 px-2 text-xs font-black uppercase flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                !settings.passPhoneScreenEnabled
                  ? 'pixel-btn-lime text-[#1a0833] ring-2 ring-[#241442]'
                  : 'pixel-btn-dark text-[#00F0FF]'
              }`}
            >
              <Zap size={15} color={!settings.passPhoneScreenEnabled ? '#1a0833' : '#00F0FF'} />
              <span className="text-[11px] leading-tight">شروع فوری (سیب‌زمینی داغ)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                updateSettings('passPhoneScreenEnabled', true);
              }}
              className={`pixel-btn py-2 px-2 text-xs font-black uppercase flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                settings.passPhoneScreenEnabled
                  ? 'pixel-btn-cyan text-[#1a0833] ring-2 ring-[#241442]'
                  : 'pixel-btn-dark text-[#00F0FF]'
              }`}
            >
              <Phone size={15} color={settings.passPhoneScreenEnabled ? '#1a0833' : '#00F0FF'} />
              <span className="text-[11px] leading-tight">صفحه تحویل و تایید نوبت</span>
            </button>
          </div>
        </section>

        {/* Sound & Music Effects */}
        <section className="bg-white p-3.5 sm:p-4 border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#39FF14] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                <Volume2 size={14} />
              </div>
              <label className="text-[#1a0833] text-xs font-black uppercase tracking-wider">
                صدا و افکت‌های هیجان‌انگیز
              </label>
            </div>
            <span className={`px-2.5 py-0.5 border-2 border-[#241442] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#241442] ${
              settings.soundEnabled !== false ? 'bg-[#39FF14] text-[#1a0833]' : 'bg-slate-200 text-slate-800'
            }`}>
              {settings.soundEnabled !== false ? 'فعال 🔊' : 'بی‌صدا 🔇'}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                sound.setMuted(false);
                sound.playToggle();
                sound.startMenuBGM();
                updateSettings('soundEnabled', true);
              }}
              className={`pixel-btn flex-1 py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 rounded-xl ${
                settings.soundEnabled !== false 
                  ? 'pixel-btn-lime text-[#1a0833]' 
                  : 'pixel-btn-dark text-[#00F0FF]'
              }`}
            >
              <NeonVolume size={16} color={settings.soundEnabled !== false ? '#1a0833' : '#00F0FF'} glow={false} />
              <span>صدا وصل</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.setMuted(true);
                updateSettings('soundEnabled', false);
              }}
              className={`pixel-btn flex-1 py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 rounded-xl ${
                settings.soundEnabled === false 
                  ? 'pixel-btn-pink text-white' 
                  : 'pixel-btn-dark text-[#00F0FF]'
              }`}
            >
              <NeonVolume size={16} color="#FF4A6E" glow={false} muted={true} />
              <span>قطع صدا</span>
            </button>
          </div>
        </section>

      </div>

      {/* Floating reveal trigger when bars are hidden */}
      {!isBarsVisible && (
        <button
          onClick={showBars}
          aria-label="Show menu"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[#241442]/90 hover:bg-[#241442] text-[#FFE600] border border-[#FFE600]/40 rounded-full text-[11px] font-black shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse"
        >
          <ChevronUp size={14} />
          <span>{settings.language === 'fa' ? 'نمایش منو' : 'Show Controls'}</span>
        </button>
      )}

      {/* Footer Navigation with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-bottom shrink-0 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24 pt-2' 
            : 'translate-y-12 opacity-0 max-h-0 pt-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="flex gap-3 border-t-2 border-[#241442]/20 pt-1">
          <button 
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-dark flex-1 py-3 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{t.back}</span>
          </button>
          <button 
            onClick={() => {
              sound.playStartGame();
              onNext();
            }} 
            className="pixel-btn pixel-btn-pink flex-[2] py-3 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>{t.next} (اسامی بازیکنان)</span>
            {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
