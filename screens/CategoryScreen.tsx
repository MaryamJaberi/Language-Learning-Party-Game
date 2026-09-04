import React, { useState } from 'react';
import { GameSettings } from '../types';
import { CATEGORIES } from '../constants';
import { tUI, tf, isRtlLang } from '../ui';
import { ScreenFrame } from '../components/ScreenFrame';
import { NeonCategoryIcon } from '../components/NeonIcons';
import { sound } from '../soundManager';
import { Layers, HelpCircle, ArrowRight, ArrowLeft, Check, Sparkles, CheckSquare, ChevronDown } from 'lucide-react';

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
  const [openTopics, setOpenTopics] = useState(false);
  
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

  const selectedCats = settings.selectedCategories || [];
  const topicSummary = selectedCats
    .slice(0, 2)
    .map((k) => t.categories?.[k] || k.replace('CAT_', ''))
    .join(' · ') + (selectedCats.length > 2 ? ` +${selectedCats.length - 2}` : '');

  return (
    <ScreenFrame
      dir={isRTL ? 'rtl' : 'ltr'}
      className="p-3 sm:p-3.5 select-none"
      header={
        <header className="mb-2">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] text-white p-2.5 sm:p-3 border-[2.5px] border-[#0f172a] rounded-2xl shadow-[3px_3px_0px_0px_#0f172a]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#f59e0b] border-2 border-[#0f172a] flex items-center justify-center shrink-0">
                <Layers size={18} color="#0f172a" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black uppercase tracking-wider leading-tight truncate">
                  {t.categories_title}
                </h2>
                <span className="text-[10px] text-[#f59e0b] font-black block">
                  {tf(settings.language, 'stepOf', { n: 2, total: 4 })} · {t.stepTopics}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { sound.playClick(); onOpenHelp(); }}
              className="px-2.5 py-1.5 bg-[#f59e0b] text-[#0f172a] border-2 border-[#0f172a] font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_#0f172a] flex items-center gap-1 shrink-0"
            >
              <HelpCircle size={14} color="#0f172a" />
              <span>{t.guide}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={selectAll} className="flex-1 py-1.5 px-2 bg-white text-[#0f172a] border-2 border-[#0f172a] rounded-xl text-[11px] font-black shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center gap-1">
              <CheckSquare size={13} className="text-[#10b981]" />
              <span>{t.selectAllTopics}</span>
            </button>
            <button type="button" onClick={() => { selectEssentialTopics(); setOpenTopics(true); }} className="flex-1 py-1.5 px-2 bg-[#f1f5f9] text-[#0f172a] border-2 border-[#0f172a] rounded-xl text-[11px] font-black shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center gap-1">
              <Sparkles size={13} className="text-[#f43f5e]" />
              <span>{t.essentialsTopics}</span>
            </button>
          </div>
        </header>
      }
      footer={
        <div className="flex gap-2.5 pt-2">
          <button type="button" onClick={() => { sound.playClick(); onBack(); }} className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
            {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t.back}</span>
          </button>
          <button type="button" onClick={() => { sound.playStartGame(); onNext(); }} className="pixel-btn pixel-btn-pink flex-[2] py-2.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2">
            <span>{t.nextSetup || t.next}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      }
    >
      <section className="bg-white border-[2.5px] border-[#0f172a] shadow-[3px_3px_0px_0px_#0f172a] rounded-2xl overflow-hidden">
        <button type="button" onClick={() => { sound.playClick(); setOpenTopics(v => !v); }} className="w-full flex items-center gap-2 p-2.5 text-start">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t.categories_title}</div>
            <div className="text-[13px] font-black text-[#0f172a] truncate">{topicSummary}</div>
          </div>
          <ChevronDown size={16} className={`shrink-0 ${openTopics ? 'rotate-180' : ''}`} />
        </button>
        {openTopics ? (
          <div className="grid grid-cols-2 gap-2 p-2.5 pt-0">
            {allCategoryKeys.map(catKey => {
              const isSelected = selectedCats.includes(catKey);
              const translatedName = t.categories?.[catKey] || catKey.replace('CAT_', '');
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => toggleCategory(catKey)}
                  className={`p-2 rounded-xl border-[2px] border-[#0f172a] flex items-center justify-between gap-1.5 ${
                    isSelected ? 'bg-[#fde68a] shadow-[2px_2px_0px_0px_#0f172a]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="p-1 rounded-lg border border-[#0f172a] shrink-0 bg-[#0f172a]">
                      <NeonCategoryIcon catKey={catKey} size={15} />
                    </div>
                    <span className="font-black text-[11px] text-[#0f172a] truncate">{translatedName}</span>
                  </div>
                  <div className={`w-5 h-5 border-2 border-[#0f172a] flex items-center justify-center rounded-lg shrink-0 ${isSelected ? 'bg-[#0f172a]' : 'bg-white'}`}>
                    {isSelected ? <Check size={13} color="#10b981" strokeWidth={4} /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>
    </ScreenFrame>
  );
};

export default CategoryScreen;
