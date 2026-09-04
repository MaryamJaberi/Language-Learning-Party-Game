import React from 'react';
import { GameSettings } from '../types';
import { CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { tUI, tf, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { NeonCategoryIcon } from '../components/NeonIcons';
import { sound } from '../soundManager';
import { Layers, HelpCircle, ArrowRight, ArrowLeft, Check, Sparkles, CheckSquare } from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenHelp: () => void;
}

const CategoryScreen: React.FC<Props> = ({ settings, onSave, onNext, onBack, onOpenHelp }) => {
  const t = tUI(settings.language);
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
    <div className="h-full min-h-0 flex-1 flex flex-col p-3 sm:p-3.5 select-none overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Fixed Header */}
      <header className="shrink-0 mb-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white p-2.5 sm:p-3 border-[2.5px] border-[#0f172a] rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#f59e0b] border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shadow-[1px_1px_0px_0px_#0f172a]">
              <Layers size={18} color="#0f172a" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider leading-tight">
                {t.categories_title || 'موضوعات و دسته‌بندی‌ها'}
              </h2>
              <span className="text-[10px] text-[#f59e0b] font-black block">
                {tf(settings.language, 'stepOf', { n: 2, total: 4 })} · {t.stepTopics}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }} 
            className="px-2.5 py-1.5 bg-[#f59e0b] hover:bg-amber-400 text-[#0f172a] border-2 border-[#0f172a] font-black text-[11px] sm:text-xs rounded-xl shadow-[2px_2px_0px_0px_#0f172a] transition-transform active:translate-y-0.5 flex items-center gap-1"
          >
            <HelpCircle size={14} color="#0f172a" />
            <span>{t.guide}</span>
          </button>
        </div>

        {/* Quick Action Bar (Select All / Essentials) inside Top Section */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <button
            type="button"
            onClick={selectAll}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 text-[#0f172a] border-2 border-[#0f172a] rounded-xl text-[11px] sm:text-xs font-black shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center gap-1 active:translate-y-0.5"
          >
            <CheckSquare size={13} className="text-[#10b981]" />
            <span>{t.selectAllTopics || 'انتخاب همه'}</span>
          </button>

          <button
            type="button"
            onClick={selectEssentialTopics}
            className="flex-1 py-1.5 px-2 bg-[#f1f5f9] hover:bg-slate-200 text-[#0f172a] border-2 border-[#0f172a] rounded-xl text-[11px] sm:text-xs font-black shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center gap-1 active:translate-y-0.5"
          >
            <Sparkles size={13} className="text-[#f43f5e]" />
            <span>{t.essentialsTopics || 'موضوعات ضروری'}</span>
          </button>
        </div>
      </header>

      {/* Categories Scrollable Container - Compact 2-column Grid */}
      <div 
        className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-2 overscroll-contain"
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
                className={`p-2 sm:p-2.5 rounded-xl border-[2px] border-[#0f172a] flex items-center justify-between gap-1.5 transition-all text-right ${
                  isSelected
                  ? 'bg-gradient-to-r from-[#fef3c7] to-[#fde68a] text-[#0f172a] shadow-[2px_2px_0px_0px_#0f172a] -translate-y-0.5'
                  : 'bg-white text-[#0f172a] shadow-[1px_1px_0px_0px_#0f172a] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="p-1 rounded-lg border border-[#0f172a] shrink-0 bg-[#0f172a]">
                    <NeonCategoryIcon catKey={catKey} size={15} />
                  </div>
                  <span className="font-black text-[11px] sm:text-xs text-[#0f172a] truncate leading-tight">
                    {translatedName}
                  </span>
                </div>

                {/* High Contrast Checkbox */}
                <div className={`w-5 h-5 border-2 border-[#0f172a] flex items-center justify-center rounded-lg shrink-0 shadow-[1px_1px_0px_0px_#0f172a] ${
                  isSelected ? 'bg-[#0f172a]' : 'bg-white'
                }`}>
                  {isSelected && (
                    <Check size={13} color="#10b981" strokeWidth={4} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Informational tip */}
        <div className="mt-3 p-2 bg-white/95 border-2 border-[#0f172a] rounded-2xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#0f172a]">
          <TeamMascot color="GREEN" size={24} />
          <span className="text-[11px] text-[#0f172a] font-black">
            {settings.language === 'fa' 
              ? '⚡ موضوعات انتخابی با کلمات جذاب بین زبان‌ها توزیع می‌شوند' 
              : '⚡ Selected categories are balanced dynamically across languages'}
          </span>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <footer className="shrink-0 pt-2 border-t-2 border-[#0f172a]/20">
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
            <span>{t.nextSetup || t.next}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CategoryScreen;
