import React from 'react';
import { GameSettings } from '../types';
import { CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { NeonCategoryIcon } from '../components/NeonIcons';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import { sound } from '../soundManager';
import { isRtlLang } from '../ui';
import { Layers, HelpCircle, ArrowRight, ArrowLeft, Check, Sparkles, CheckSquare } from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp?: () => void;
}

const CategoryScreen: React.FC<Props> = ({ settings, onSave, onNext, onBack, onOpenHelp }) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fa;
  const isRTL = isRtlLang(settings.language);
  
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
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2">
        <div className="flex items-center justify-between bg-[#FFFBF4] text-[#1E1B2E] p-2.5 sm:p-3 border-2 border-[#1E1B2E] rounded-[20px] shadow-[3px_3px_0px_0px_#1E1B2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]">
              <Layers size={16} color="#1E1B2E" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider leading-tight">
                {t.categories_title || 'موضوعات و دسته‌بندی‌ها'}
              </h2>
              <span className="text-[10px] text-[#E0603F] font-bold block">
                مرحله ۲ از ۴: موقعیت‌های مکالمه و واژگان
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <SoundHeaderButton language={settings.language} />
            <button 
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenHelp?.();
              }} 
              className="px-2.5 py-1.5 bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] font-bold text-[11px] sm:text-xs rounded-[10px] shadow-[2px_2px_0px_0px_#1E1B2E] transition-transform active:translate-y-0.5 flex items-center gap-1"
            >
              <HelpCircle size={14} color="#1E1B2E" />
              <span>{t.guide}</span>
            </button>
          </div>
        </div>

        {/* Quick Action Bar (Select All / Essentials) inside Top Section */}
        <div className="flex items-center justify-between gap-2 mt-2 font-ui">
          <button
            type="button"
            onClick={selectAll}
            className="flex-1 py-1.5 px-2 bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] border-2 border-[#1E1B2E] rounded-[12px] text-[11px] sm:text-xs font-bold shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-1 active:translate-y-0.5"
          >
            <CheckSquare size={13} className="text-[#1E9E93]" />
            <span>{t.selectAllTopics || 'انتخاب همه'}</span>
          </button>

          <button
            type="button"
            onClick={selectEssentialTopics}
            className="flex-1 py-1.5 px-2 bg-[#F4EDE1] hover:bg-[#eae0d2] text-[#1E1B2E] border-2 border-[#1E1B2E] rounded-[12px] text-[11px] sm:text-xs font-bold shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-1 active:translate-y-0.5"
          >
            <Sparkles size={13} className="text-[#E0603F]" />
            <span>موضوعات ضروری</span>
          </button>
        </div>
      </header>

      {/* Categories Scrollable Container - Compact 2-column Grid */}
      <div 
        className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-2 overscroll-contain font-ui"
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {allCategoryKeys.map(catKey => {
            const isSelected = (settings.selectedCategories || []).includes(catKey);
            const translatedName = t.categories[catKey] || catKey.replace('CAT_', '');
            
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => toggleCategory(catKey)}
                className={`p-2 sm:p-2.5 rounded-[16px] border-2 border-[#1E1B2E] flex items-center justify-between gap-1.5 transition-all text-start ${
                  isSelected
                  ? 'bg-[#F2B63D] text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] -translate-y-0.5'
                  : 'bg-[#FFFBF4] text-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E] hover:bg-[#F4EDE1]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="p-1 rounded-[8px] border border-[#1E1B2E] shrink-0 bg-[#1E1B2E] text-white">
                    <NeonCategoryIcon catKey={catKey} size={15} />
                  </div>
                  <span className="font-bold text-[11px] sm:text-xs text-[#1E1B2E] truncate leading-tight">
                    {translatedName}
                  </span>
                </div>

                {/* High Contrast Checkbox */}
                <div className={`w-5 h-5 border-2 border-[#1E1B2E] flex items-center justify-center rounded-[6px] shrink-0 shadow-[1px_1px_0px_0px_#1E1B2E] ${
                  isSelected ? 'bg-[#1E1B2E]' : 'bg-[#FFFBF4]'
                }`}>
                  {isSelected && (
                    <Check size={13} color="#F2B63D" strokeWidth={3.5} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Informational tip */}
        <div className="mt-3 p-2.5 bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[18px] flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#1E1B2E]">
          <TeamMascot color="GREEN" size={24} />
          <span className="text-[11px] text-[#1E1B2E] font-bold">
            {settings.language === 'fa' 
              ? '⚡ موضوعات انتخابی با کلمات جذاب بین زبان‌ها توزیع می‌شوند' 
              : '⚡ Selected categories are balanced dynamically across languages'}
          </span>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <footer className="shrink-0 pt-2 border-t-2 border-[#1E1B2E]/15 font-ui">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="pixel-btn pixel-btn-orange flex-1 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-[16px] active:scale-95"
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
            className="pixel-btn pixel-btn-teal flex-[2] py-2.5 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[16px] active:scale-95"
          >
            <span>{t.next} (تنظیمات)</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CategoryScreen;
