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
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col p-3 sm:p-4 select-none overflow-hidden relative font-ui bg-[var(--bg)] text-[var(--ink)]" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2">
        <div className="flex items-center justify-between bg-[var(--panel)] text-[var(--ink)] p-2.5 sm:p-3 border border-[var(--line)] rounded-[20px] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider leading-tight text-[var(--ink)]">
                {t.categories_title || 'موضوعات و دسته‌بندی‌ها'}
              </h2>
              <span className="text-[10px] text-[var(--lapis)] font-bold block">
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
              className="px-2.5 py-1.5 bg-[var(--lapis-soft)] hover:bg-[var(--lapis-soft)]/80 text-[var(--lapis)] font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>{t.guide}</span>
            </button>
          </div>
        </div>

        {/* Quick Action Bar (Select All / Essentials) inside Top Section */}
        <div className="flex items-center justify-between gap-2 mt-2 font-ui">
          <button
            type="button"
            onClick={selectAll}
            className="flex-1 py-2 px-2 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            <CheckSquare size={14} className="text-[var(--turq)]" />
            <span>{t.selectAllTopics || 'انتخاب همه'}</span>
          </button>

          <button
            type="button"
            onClick={selectEssentialTopics}
            className="flex-1 py-2 px-2 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-[var(--saffron)]" />
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
                className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-1.5 transition-all text-start cursor-pointer active:scale-98 ${
                  isSelected
                  ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs -translate-y-0.5'
                  : 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] shadow-xs hover:bg-[var(--bg)]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg)] text-[var(--ink)]'}`}>
                    <NeonCategoryIcon catKey={catKey} size={15} />
                  </div>
                  <span className="font-bold text-[11px] sm:text-xs truncate leading-tight">
                    {translatedName}
                  </span>
                </div>

                {/* High Contrast Checkbox */}
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? 'bg-white text-[var(--lapis)]' : 'bg-[var(--bg)] border border-[var(--line)]'
                }`}>
                  {isSelected && (
                    <Check size={13} strokeWidth={3.5} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Informational tip */}
        <div className="mt-3 p-2.5 bg-[var(--panel)] border border-[var(--line)] rounded-2xl flex items-center justify-center gap-2 shadow-xs">
          <TeamMascot color="GREEN" size={24} />
          <span className="text-[11px] text-[var(--mute)] font-bold">
            {t.categoriesHintTip || (isRTL 
              ? '⚡ موضوعات انتخابی با کلمات جذاب بین زبان‌ها توزیع می‌شوند' 
              : '⚡ Selected categories are balanced dynamically across languages')}
          </span>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <footer className="shrink-0 pt-2 border-t border-[var(--line)] font-ui">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onBack();
            }} 
            className="flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all active:scale-98 cursor-pointer"
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
            className="flex-[2] py-3 text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <span className="whitespace-nowrap">{t.next}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CategoryScreen;
