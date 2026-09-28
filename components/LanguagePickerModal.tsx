import React, { useState, useMemo } from 'react';
import { Search, X, Check, Globe, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES, LanguageInfo, LanguageRegion } from '../constants';
import { FlagIcon } from './FlagIcon';
import { sound } from '../soundManager';

const DEFAULT_SELECTED_LANGUAGES: Language[] = [];

interface LanguagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage?: Language;
  selectedLanguages?: Language[];
  onSelectLanguage?: (lang: Language) => void;
  onSelectLanguages?: (langs: Language[]) => void;
  mode?: 'single' | 'multi';
  title?: string;
  subtitle?: string;
  isRTL?: boolean;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  selectedLanguages = DEFAULT_SELECTED_LANGUAGES,
  onSelectLanguage,
  onSelectLanguages,
  mode = 'single',
  title,
  subtitle,
  isRTL = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<LanguageRegion | 'all'>('all');
  const [tempMultiSelected, setTempMultiSelected] = useState<Language[]>(selectedLanguages);

  // Synchronize when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempMultiSelected(selectedLanguages || DEFAULT_SELECTED_LANGUAGES);
      setSearchQuery('');
    }
  }, [isOpen]);

  const regionTabs: { id: LanguageRegion | 'all'; labelFa: string; labelEn: string; icon: string }[] = [
    { id: 'all', labelFa: 'همه زبان‌ها', labelEn: 'All', icon: '🌍' },
    { id: 'popular', labelFa: 'پرطرفدار', labelEn: 'Popular', icon: '🌟' },
    { id: 'middle_east', labelFa: 'خاورمیانه', labelEn: 'Middle East', icon: '🕌' },
    { id: 'europe', labelFa: 'اروپا', labelEn: 'Europe', icon: '🏛️' },
    { id: 'asia', labelFa: 'آسیا', labelEn: 'Asia', icon: '⛩️' },
    { id: 'americas', labelFa: 'آمریکا', labelEn: 'Americas', icon: '🌎' },
  ];

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SUPPORTED_LANGUAGES.filter(lang => {
      // Region filter
      if (activeRegion !== 'all') {
        if (activeRegion === 'popular') {
          if (!lang.popular) return false;
        } else if (lang.region !== activeRegion) {
          return false;
        }
      }

      // Search filter
      if (!q) return true;
      const inPersian = lang.persianName.toLowerCase().includes(q);
      const inName = lang.name.toLowerCase().includes(q);
      const inNative = lang.nativeName.toLowerCase().includes(q);
      const inCode = lang.code.toLowerCase().includes(q);
      return inPersian || inName || inNative || inCode;
    });
  }, [searchQuery, activeRegion]);

  if (!isOpen) return null;

  const handleSingleSelect = (code: Language) => {
    sound.playClick();
    if (onSelectLanguage) {
      onSelectLanguage(code);
    }
    onClose();
  };

  const handleToggleMulti = (code: Language) => {
    sound.playToggle();
    setTempMultiSelected(prev => {
      if (prev.includes(code)) {
        // Prevent deselecting the last language
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleConfirmMulti = () => {
    sound.playClick();
    if (onSelectLanguages) {
      onSelectLanguages(tempMultiSelected);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div 
        className="bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[28px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-[6px_6px_0px_0px_#1E1B2E] overflow-hidden text-[#1E1B2E]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#FFFBF4] p-3.5 sm:p-4 text-[#1E1B2E] flex items-center justify-between border-b-2 border-[#1E1B2E] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[14px] bg-[#F4EDE1] border-2 border-[#1E1B2E] text-[#1E1B2E] flex items-center justify-center shadow-[2px_2px_0px_0px_#1E1B2E]">
              <Globe size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight leading-tight font-display">
                {title || (isRTL ? 'انتخاب زبان' : 'Select Language')}
              </h2>
              <p className="text-[11px] text-[#1E1B2E]/60 font-medium font-ui">
                {subtitle || (isRTL ? `${SUPPORTED_LANGUAGES.length} زبان زنده دنیا` : `${SUPPORTED_LANGUAGES.length} supported languages`)}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-[12px] bg-[#F4EDE1] hover:bg-[#E6DFD5] border-2 border-[#1E1B2E] text-[#1E1B2E] flex items-center justify-center transition-transform active:translate-y-0.5 shadow-[2px_2px_0px_0px_#1E1B2E]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Region Filter Bar */}
        <div className="p-3 bg-[#F4EDE1] border-b-2 border-[#1E1B2E] space-y-2 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-[#1E1B2E]/60 pointer-events-none`}>
              <Search size={16} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'جستجوی نام زبان (فارسی، انگلیسی، بومی)...' : 'Search language (e.g. Spanish, فارسی, Français)...'}
              className={`w-full py-2 bg-[#FFFBF4] text-[#1E1B2E] placeholder:text-[#1E1B2E]/40 font-medium text-xs rounded-[14px] border-2 border-[#1E1B2E] focus:outline-none transition-colors font-ui ${
                isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2.5' : 'right-2.5'} text-[#1E1B2E]/50 hover:text-[#1E1B2E]`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Region Tabs (Horizontal Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-ui">
            {regionTabs.map(tab => {
              const isActive = activeRegion === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sound.playToggle();
                    setActiveRegion(tab.id);
                  }}
                  className={`px-3 py-1 rounded-[12px] font-bold text-[11px] whitespace-nowrap transition-all border-2 border-[#1E1B2E] shrink-0 flex items-center gap-1 active:translate-y-0.5 ${
                    isActive
                      ? 'bg-[#E0603F] text-white shadow-[2px_2px_0px_0px_#1E1B2E]'
                      : 'bg-[#FFFBF4] text-[#1E1B2E] hover:bg-[#F4EDE1]'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{isRTL ? tab.labelFa : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 overscroll-contain bg-[#FFFBF4]">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-8 text-[#1E1B2E]/60 space-y-2">
              <Globe size={32} className="mx-auto text-[#1E1B2E]/40" />
              <p className="font-bold text-xs font-ui">
                {isRTL ? 'هیچ زبانی با این عبارت پیدا نشد.' : 'No languages found matching your query.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveRegion('all');
                }}
                className="px-3 py-1 bg-[#E0603F] text-white text-xs font-bold rounded-xl border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]"
              >
                {isRTL ? 'نمایش همه زبان‌ها' : 'Show all languages'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="ltr">
              {filteredLanguages.map(lang => {
                const isSelected = mode === 'single' 
                  ? selectedLanguage === lang.code 
                  : tempMultiSelected.includes(lang.code);

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      if (mode === 'single') {
                        handleSingleSelect(lang.code);
                      } else {
                        handleToggleMulti(lang.code);
                      }
                    }}
                    className={`p-2.5 rounded-[16px] border-2 border-[#1E1B2E] transition-all flex items-center justify-between text-start active:translate-y-0.5 relative group font-ui ${
                      isSelected
                        ? 'bg-[#1E9E93] text-white shadow-[3px_3px_0px_0px_#1E1B2E]'
                        : 'bg-[#FFFBF4] text-[#1E1B2E] hover:bg-[#F4EDE1] shadow-[2px_2px_0px_0px_#1E1B2E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#F4EDE1] flex items-center justify-center shrink-0 border border-[#1E1B2E]/30">
                        <FlagIcon language={lang.code} size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-[#1E1B2E]'}`}>
                            {lang.nativeName}
                          </span>
                          {lang.popular && (
                            <span className="text-[9px] px-1.5 rounded-full bg-[#F2B63D] text-[#1E1B2E] font-bold leading-tight">
                              ★
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-white/80 font-medium' : 'text-[#1E1B2E]/60 font-medium'}`}>
                          {lang.name} • {lang.persianName}
                        </p>
                      </div>
                    </div>

                    {/* Indicator */}
                    <div className="shrink-0 ml-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-white text-[#1E9E93] flex items-center justify-center shadow-sm">
                          <Check size={12} strokeWidth={3.5} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#1E1B2E]/30 group-hover:border-[#1E1B2E]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer (for multi-select or quick stats) */}
        {mode === 'multi' ? (
          <div className="p-3 bg-[#F4EDE1] border-t-2 border-[#1E1B2E] flex items-center justify-between gap-3 shrink-0 font-ui">
            <div className="text-[#1E1B2E] text-xs font-bold flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#E0603F]" />
              <span>
                {isRTL 
                  ? `${tempMultiSelected.length} زبان انتخاب شده` 
                  : `${tempMultiSelected.length} languages selected`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleConfirmMulti}
              className="px-5 py-2.5 bg-[#1E9E93] hover:bg-[#18837a] text-white font-bold text-xs uppercase tracking-wider rounded-[14px] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5 flex items-center gap-1.5"
            >
              <Check size={15} strokeWidth={3} />
              <span>{isRTL ? 'تایید و ذخیره زبان‌ها' : 'Apply Languages'}</span>
            </button>
          </div>
        ) : (
          <div className="p-2.5 bg-[#F4EDE1] border-t-2 border-[#1E1B2E] flex items-center justify-between text-[11px] text-[#1E1B2E]/70 px-4 shrink-0 font-ui">
            <span>{isRTL ? 'برای انتخاب کافیست روی هر زبان ضربه بزنید' : 'Tap any language to select instantly'}</span>
            <span className="text-[#E0603F] font-bold">{SUPPORTED_LANGUAGES.length} {isRTL ? 'زبان' : 'languages'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
