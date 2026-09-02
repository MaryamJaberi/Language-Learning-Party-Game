import React from 'react';
import { GameSettings } from '../types';
import { CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { NeonCategoryIcon } from '../components/NeonIcons';
import { sound } from '../soundManager';
import { Layers, HelpCircle, ArrowRight, ArrowLeft, Check, Sparkles, CheckSquare, Square, ChevronUp } from 'lucide-react';
import { useGoogleScrollBars } from '../useGoogleScrollBars';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp: () => void;
}

const CategoryScreen: React.FC<Props> = ({ settings, onSave, onNext, onBack, onOpenHelp }) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fa;
  const isRTL = settings.language === 'fa' || settings.language === 'ar';
  const { isBarsVisible, scrollContainerRef, handleScroll, showBars } = useGoogleScrollBars();
  
  const allCategoryKeys = Object.keys(CATEGORIES);

  const toggleCategory = (catKey: string) => {
    sound.playToggle();
    let selected = [...(settings.selectedCategories || [])];
    if (selected.includes(catKey)) {
      if (selected.length > 1) {
        selected = selected.filter(s => s !== catKey);
      }
    } else {
      selected.push(catKey);
    }
    onSave({ ...settings, selectedCategories: selected });
  };

  const selectAll = () => {
    sound.playToggle();
    onSave({ ...settings, selectedCategories: allCategoryKeys });
  };

  const selectEssentialTopics = () => {
    sound.playToggle();
    const essentials = [
      'CAT_EVERYDAY',
      'CAT_RESTAURANT',
      'CAT_FOOD',
      'CAT_TRAVEL',
      'CAT_SHOPPING',
      'CAT_WORK',
      'CAT_SMALLTALK'
    ];
    onSave({ ...settings, selectedCategories: essentials });
  };

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col p-3.5 sm:p-4 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-28 mb-2' 
            : '-translate-y-12 opacity-0 max-h-0 mb-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#7B2CBF] via-[#FF007F] to-[#FF2E93] text-white p-3 border-[3.5px] border-[#241442] rounded-2xl shadow-[4px_4px_0px_0px_#241442]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center text-[#1a0833] shadow-[1px_1px_0px_0px_#241442]">
              <Layers size={18} color="#1a0833" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">
                {t.categories_title || 'موضوعات و موقعیت‌ها'}
              </h2>
              <span className="text-[10px] text-[#FFE600] font-black block">
                مرحله ۲ از ۴: موقعیت‌های مکالمه و واژگان
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

      {/* Quick Action Bar (Select All / Essentials) */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <button
          onClick={selectAll}
          className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 text-[#1a0833] border-2 border-[#241442] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1 active:translate-y-0.5"
        >
          <CheckSquare size={14} className="text-[#39FF14]" />
          <span>{t.selectAllTopics || 'انتخاب همه موضوعات'}</span>
        </button>

        <button
          onClick={selectEssentialTopics}
          className="flex-1 py-1.5 px-2 bg-[#F4E8FF] hover:bg-[#ebd2ff] text-[#1a0833] border-2 border-[#241442] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1 active:translate-y-0.5"
        >
          <Sparkles size={14} className="text-[#FF007F]" />
          <span>موضوعات روزمره و ضروری</span>
        </button>
      </div>

      {/* Categories Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-2 pb-2 overscroll-contain"
      >
        {allCategoryKeys.map(catKey => {
          const isSelected = (settings.selectedCategories || []).includes(catKey);
          const translatedName = t.categories[catKey] || catKey.replace('CAT_', '');
          
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => toggleCategory(catKey)}
              className={`w-full p-2.5 sm:p-3 rounded-2xl border-[3px] border-[#241442] flex items-center justify-between transition-all ${
                isSelected
                ? 'bg-gradient-to-r from-[#FFF033] to-[#FFE600] text-[#1a0833] shadow-[3.5px_3.5px_0px_0px_#241442] -translate-y-0.5'
                : 'bg-white text-[#1a0833] shadow-[2px_2px_0px_0px_#241442] hover:bg-[#F9F0FF]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl border-2 border-[#241442] ${isSelected ? 'bg-[#241442]' : 'bg-[#241442]'}`}>
                  <NeonCategoryIcon catKey={catKey} size={18} />
                </div>
                <span className="font-black text-xs sm:text-sm uppercase text-[#1a0833]">{translatedName}</span>
              </div>

              {/* High Contrast Checkbox */}
              <div className={`w-6 h-6 border-2 border-[#241442] flex items-center justify-center rounded-xl shadow-[1px_1px_0px_0px_#241442] ${
                isSelected ? 'bg-[#241442]' : 'bg-white'
              }`}>
                {isSelected && (
                  <Check size={16} color="#39FF14" strokeWidth={3.5} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Decorative Mascot Green Buddy */}
      <div className="my-1 p-2 bg-white border-2 border-[#241442] rounded-2xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#241442] shrink-0">
        <TeamMascot color="GREEN" size={28} />
        <span className="text-[11px] text-[#1a0833] font-black">
          {settings.language === 'fa' 
            ? '⚡ کارت‌های این موضوعات بین زبان‌های انتخابی تقسیم و رندوم خواهند شد!' 
            : '⚡ Cards in selected topics will be dynamically served across active languages!'}
        </span>
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
            <span>{t.next} (تنظیمات بازیکنان)</span>
            {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryScreen;
