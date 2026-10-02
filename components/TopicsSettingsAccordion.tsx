import React, { useState } from 'react';
import { GameSettings } from '../types';
import { CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { isRtlLang, tUI } from '../ui';
import { NeonCategoryIcon } from './NeonIcons';
import { sound } from '../soundManager';
import { 
  Layers, 
  ChevronDown, 
  Sparkles, 
  CheckSquare, 
  Check 
} from 'lucide-react';

export const ESSENTIAL_TOPICS = [
  'CAT_EVERYDAY',
  'CAT_RESTAURANT',
  'CAT_FOOD',
  'CAT_TRAVEL',
  'CAT_SHOPPING',
  'CAT_WORK',
  'CAT_SMALLTALK'
];

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  isOpenDefault?: boolean;
}

export const TopicsSettingsAccordion: React.FC<Props> = ({
  settings,
  onSave,
  isOpenDefault = false
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);

  const allCategoryKeys = Object.keys(CATEGORIES);
  const selectedCategories = settings.selectedCategories && settings.selectedCategories.length > 0
    ? settings.selectedCategories
    : ESSENTIAL_TOPICS;

  const isEssentialOnly = 
    selectedCategories.length === ESSENTIAL_TOPICS.length && 
    ESSENTIAL_TOPICS.every(cat => selectedCategories.includes(cat));

  const isAllSelected = selectedCategories.length === allCategoryKeys.length;

  const toggleOpen = () => {
    sound.playClick();
    setIsOpen(prev => !prev);
  };

  const toggleCategory = (catKey: string) => {
    sound.playToggle();
    let selected = [...selectedCategories];
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

  const selectEssentials = () => {
    sound.playToggle();
    onSave({ ...settings, selectedCategories: ESSENTIAL_TOPICS });
  };

  const badgeText = isEssentialOnly
    ? (t.essentialsTopics || 'Essentials')
    : isAllSelected
    ? (t.selectAllTopics || 'All Topics')
    : `${selectedCategories.length} ${t.activeCount || 'Active'}`;

  return (
    <div className="bg-white border-[2.5px] border-[#0f172a] shadow-[2.5px_2.5px_0px_0px_#0f172a] rounded-2xl overflow-hidden transition-all" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Bar - Tap to Expand / Collapse */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] hover:bg-slate-100 transition-colors text-right touch-manipulation"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#f59e0b] border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shrink-0 shadow-[1px_1px_0px_0px_#0f172a]">
            <Layers size={15} />
          </div>
          <div className="text-right truncate">
            <span className="text-xs sm:text-sm font-black text-[#0f172a] block leading-tight">
              {t.categories_title || 'Game Topics & Situations'}
            </span>
            <span className="text-[10px] text-slate-500 font-bold block truncate">
              {isEssentialOnly 
                ? `${t.essentialsTopics} • ${selectedCategories.length}`
                : `${selectedCategories.length} / ${allCategoryKeys.length}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 border border-[#0f172a] rounded-lg font-black shadow-[1px_1px_0px_0px_#0f172a] ${
            isEssentialOnly 
              ? 'bg-[#FFE600] text-[#0f172a]' 
              : 'bg-[#39FF14] text-[#0f172a]'
          }`}>
            {badgeText}
          </span>
          <ChevronDown 
            size={18} 
            className={`text-[#0f172a] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Expandable Content Area */}
      {isOpen && (
        <div className="p-3 bg-[#fafafa] border-t-2 border-[#0f172a] space-y-2.5 animate-fadeIn">
          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={selectEssentials}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black border-2 border-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a] flex items-center justify-center gap-1 active:translate-y-0.5 transition-all ${
                isEssentialOnly
                  ? 'bg-[#FFE600] text-[#0f172a]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={13} className="text-[#f43f5e]" />
              <span>{t.essentialsTopics}</span>
            </button>

            <button
              type="button"
              onClick={selectAll}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black border-2 border-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a] flex items-center justify-center gap-1 active:translate-y-0.5 transition-all ${
                isAllSelected
                  ? 'bg-[#39FF14] text-[#0f172a]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CheckSquare size={13} className="text-[#10b981]" />
              <span>{t.selectAllTopics}</span>
            </button>
          </div>

          {/* Grid of Categories */}
          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {allCategoryKeys.map(catKey => {
              const isSelected = selectedCategories.includes(catKey);
              const translatedName = t.categories[catKey] || catKey.replace('CAT_', '');
              
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => toggleCategory(catKey)}
                  className={`p-2 rounded-xl border-[2px] border-[#0f172a] flex items-center justify-between gap-1.5 transition-all text-right active:scale-95 ${
                    isSelected
                      ? 'bg-[#fef08a] text-[#0f172a] shadow-[1.5px_1.5px_0px_0px_#0f172a]'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="p-1 rounded-lg border border-[#0f172a] shrink-0 bg-[#0f172a]">
                      <NeonCategoryIcon catKey={catKey} size={13} />
                    </div>
                    <span className="font-black text-[10.5px] truncate leading-tight">
                      {translatedName}
                    </span>
                  </div>

                  <div className={`w-4 h-4 border-2 border-[#0f172a] flex items-center justify-center rounded-md shrink-0 ${
                    isSelected ? 'bg-[#0f172a]' : 'bg-white'
                  }`}>
                    {isSelected && (
                      <Check size={11} color="#39FF14" strokeWidth={4} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
