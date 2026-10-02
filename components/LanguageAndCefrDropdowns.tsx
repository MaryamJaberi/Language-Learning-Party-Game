import React, { useState, useMemo } from 'react';
import { GameSettings, Language, CEFRLevel } from '../types';
import { SUPPORTED_LANGUAGES, CEFR_LEVELS } from '../constants';
import { NATIVE_LANGUAGE_NAMES } from '../translations';
import { FlagIcon } from './FlagIcon';
import { LanguagePickerModal } from './LanguagePickerModal';
import { sound } from '../soundManager';
import { isRtlLang, tUI } from '../ui';
import { getRandomCharacters } from '../characters';
import { 
  Globe, 
  Award, 
  BookOpen, 
  Check, 
  Sparkles,
  Search,
  X,
  Plus,
  LayoutGrid
} from 'lucide-react';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  defaultOpenSection?: 'target' | 'cefr' | 'native' | null;
}

export const LanguageAndCefrDropdowns: React.FC<Props> = ({
  settings,
  onSave,
}) => {
  const t = tUI(settings.language);
  const isRTL = isRtlLang(settings.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pickerMode, setPickerMode] = useState<'target' | 'native' | 'ui' | null>(null);

  const nativeLang = settings.nativeLanguage || 'fa';
  const appUiLang = settings.language || 'fa';
  const targetLangs = settings.targetLanguages && settings.targetLanguages.length > 0
    ? settings.targetLanguages
    : ['nl', 'en-US'];
  const currentCefr = settings.cefrLevel || 'all';

  const nativeLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === nativeLang) || SUPPORTED_LANGUAGES[0];
  const appUiLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === appUiLang) || SUPPORTED_LANGUAGES[0];
  const activeCefrInfo = CEFR_LEVELS.find(l => l.id === currentCefr) || CEFR_LEVELS[CEFR_LEVELS.length - 1];

  // In-place search filtering for languages
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SUPPORTED_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.persianName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  const setNativeLang = (lang: Language) => {
    sound.playToggle();
    const newPlayerNames = getRandomCharacters(lang, 8);
    let newTargets = [...(settings.targetLanguages || ['en', 'es'])];
    newTargets = newTargets.filter(t => t !== lang && !(lang.startsWith('en') && t.startsWith('en')));
    if (newTargets.length === 0) {
      newTargets = lang.startsWith('en') ? ['es', 'fr'] : ['en', 'es'];
    }
    onSave({
      ...settings,
      nativeLanguage: lang,
      language: lang,
      playerNames: newPlayerNames,
      targetLanguages: newTargets
    });
  };

  const setAppLanguage = (lang: Language) => {
    sound.playToggle();
    const newPlayerNames = getRandomCharacters(lang, 8);
    let targets = (settings.targetLanguages || []).filter(t => t !== lang && !(lang.startsWith('en') && t.startsWith('en')));
    if (targets.length === 0) {
      targets = lang.startsWith('en') ? ['es', 'fr'] : ['en', 'es'];
    }
    onSave({
      ...settings,
      language: lang,
      nativeLanguage: lang,
      playerNames: newPlayerNames,
      targetLanguages: targets
    });
  };

  const addTargetLang = (lang: Language) => {
    sound.playPowerUp();
    if (!targetLangs.includes(lang)) {
      onSave({
        ...settings,
        targetLanguages: [...targetLangs, lang]
      });
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const removeTargetLang = (lang: Language) => {
    sound.playToggle();
    if (targetLangs.length > 1) {
      onSave({
        ...settings,
        targetLanguages: targetLangs.filter(l => l !== lang)
      });
    }
  };

  const selectCefrLevel = (level: CEFRLevel) => {
    sound.playToggle();
    onSave({
      ...settings,
      cefrLevel: level
    });
  };

  return (
    <div className="space-y-3 select-none font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* 1. TARGET LANGUAGES: In-Place Search & Tagged Chips */}
      <div className="bg-[#FFFBF4] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] rounded-[20px] p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[10px] bg-[#1E9E93] border-2 border-[#1E1B2E] flex items-center justify-center text-white shrink-0 shadow-[1px_1px_0px_0px_#1E1B2E]">
              <BookOpen size={14} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#1E1B2E] block leading-tight">
                {t.targetLanguages}
              </span>
              <span className="text-[10px] text-[#1E1B2E]/70 font-medium block">
                {t.targetLanguagesSub}
              </span>
            </div>
          </div>

          {/* 38 Languages Modal Opener */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setPickerMode('target');
            }}
            className="px-2.5 py-1 rounded-[10px] bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] border-2 border-[#1E1B2E] text-[10.5px] font-bold shrink-0 flex items-center gap-1 shadow-[1px_1px_0px_0px_#1E1B2E] active:scale-95 transition-all"
            title={t.all38Languages}
          >
            <Globe size={12} />
            <span>{t.all38Languages}</span>
          </button>
        </div>

        {/* Active Language Tags */}
        <div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {targetLangs.map(code => {
              const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
              return (
                <div 
                  key={code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-[#F2B63D] border-2 border-[#1E1B2E] text-[#1E1B2E] font-bold text-xs shadow-[2px_2px_0px_0px_#1E1B2E] animate-fadeIn transition-transform"
                >
                  <FlagIcon language={code} size={16} />
                  <span>{lang?.nativeName || code}</span>
                  <span className="text-[9px] opacity-75 font-mono uppercase bg-black/10 px-1 rounded">
                    {code}
                  </span>
                  {targetLangs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTargetLang(code)}
                      className="w-4 h-4 rounded-full bg-[#1E1B2E]/20 hover:bg-[#E0603F] hover:text-white flex items-center justify-center text-[10px] ml-0.5 transition-colors cursor-pointer"
                      title={t.removeLanguage}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* In-Place Search Box for Fast Tagging */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-[#F4EDE1] border-2 border-[#1E1B2E] rounded-[12px] px-2.5 py-1.5 shadow-[1.5px_1.5px_0px_0px_#1E1B2E] focus-within:bg-[#FFFBF4] transition-all">
            <Search size={14} className="text-[#1E1B2E]/60 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={t.searchLanguagePlaceholder}
              className="w-full bg-transparent text-xs font-bold text-[#1E1B2E] placeholder-[#1E1B2E]/40 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#1E1B2E]/60 hover:text-[#1E1B2E] p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[14px] shadow-[3px_3px_0px_0px_#1E1B2E] z-30 overflow-hidden divide-y divide-[#1E1B2E]/10 max-h-48 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-2.5 text-center text-xs font-bold text-[#1E1B2E]/60">
                  {t.all38Languages}
                </div>
              ) : (
                searchResults.map(lang => {
                  const isAlreadyAdded = targetLangs.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => addTargetLang(lang.code)}
                      disabled={isAlreadyAdded}
                      className={`w-full p-2 flex items-center justify-between text-start text-xs font-bold transition-colors ${
                        isAlreadyAdded 
                          ? 'bg-[#F4EDE1] text-[#1E1B2E]/40 cursor-not-allowed'
                          : 'hover:bg-[#F2B63D]/30 active:bg-[#F2B63D] text-[#1E1B2E]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FlagIcon language={lang.code} size={16} />
                        <span className="font-bold">{lang.nativeName}</span>
                        <span className="text-[10px] text-[#1E1B2E]/60 font-medium">({lang.name} • {lang.persianName})</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border border-[#1E1B2E]/20">
                        {isAlreadyAdded ? t.added : t.add}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. CEFR LEVEL SELECTOR: Direct Horizontal Row of Pills */}
      <div className="bg-[#FFFBF4] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] rounded-[20px] p-3 sm:p-3.5 space-y-2">
        <button
          type="button"
          onClick={() => sound.playClick()}
          className="w-full flex items-center justify-between gap-2 text-start cursor-default"
          aria-label={t.cefrLevel}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[10px] bg-[#F2B63D] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shrink-0 shadow-[1px_1px_0px_0px_#1E1B2E]">
              <Award size={14} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#1E1B2E] block leading-tight">
                {t.cefrLevel}
              </span>
              <span className="text-[10px] text-[#1E1B2E]/70 font-medium block truncate">
                {activeCefrInfo?.name[settings.language] || activeCefrInfo?.name.en}
              </span>
            </div>
          </div>

          <span className="text-[10px] bg-[#1E9E93] text-white px-2 py-0.5 border border-[#1E1B2E] rounded-[8px] font-bold shadow-[1px_1px_0px_0px_#1E1B2E]">
            {activeCefrInfo?.badge}
          </span>
        </button>

        {/* Directly visible CEFR Pills */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
          {CEFR_LEVELS.map(level => {
            const isSelected = currentCefr === level.id;
            const levelName = level.name[settings.language] || level.name.en || level.id;

            return (
              <button
                key={level.id}
                type="button"
                onClick={() => selectCefrLevel(level.id)}
                className={`py-2 px-1 rounded-[12px] border-2 border-[#1E1B2E] flex flex-col items-center justify-center transition-all touch-manipulation active:scale-95 ${
                  isSelected
                    ? 'bg-[#1E9E93] text-white shadow-[2px_2px_0px_0px_#1E1B2E] -translate-y-0.5 font-bold'
                    : 'bg-[#F4EDE1] hover:bg-[#eae0d2] text-[#1E1B2E] font-medium'
                }`}
              >
                <span className="font-bold text-xs leading-none mb-0.5">{level.code}</span>
                <span className="text-[9px] leading-tight truncate max-w-[95%] opacity-90">{levelName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. NATIVE LANGUAGE: Compact Card with Direct Tap */}
      <div className="bg-[#FFFBF4] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] rounded-[20px] p-2.5 sm:p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-[10px] bg-[#E0603F] border-2 border-[#1E1B2E] flex items-center justify-center text-white shrink-0 shadow-[1px_1px_0px_0px_#1E1B2E]">
            <Globe size={14} />
          </div>
          <div className="truncate">
            <span className="text-xs sm:text-sm font-bold text-[#1E1B2E] block leading-tight">
              {t.nativeLanguage}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <FlagIcon language={nativeLang} size={14} />
              <span className="text-[10px] text-[#1E1B2E]/70 font-bold truncate">
                {nativeLangInfo.nativeName} ({NATIVE_LANGUAGE_NAMES[nativeLang] || nativeLang})
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setPickerMode('native');
          }}
          className="px-2.5 py-1.5 rounded-[10px] bg-[#E0603F] text-white text-xs font-bold border-2 border-[#1E1B2E] shadow-[1.5px_1.5px_0px_0px_#1E1B2E] hover:bg-[#cf5435] active:scale-95 shrink-0"
        >
          {t.changeNative}
        </button>
      </div>

      {/* 4. APP UI LANGUAGE: Controls buttons and menus independently */}
      <div className="bg-[#FFFBF4] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] rounded-[20px] p-2.5 sm:p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-[10px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shrink-0 shadow-[1px_1px_0px_0px_#1E1B2E]">
            <LayoutGrid size={14} />
          </div>
          <div className="truncate">
            <span className="text-xs sm:text-sm font-bold text-[#1E1B2E] block leading-tight">
              {t.appUiLanguage}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <FlagIcon language={appUiLang} size={14} />
              <span className="text-[10px] text-[#1E1B2E]/70 font-bold truncate">
                {appUiLangInfo.nativeName} ({NATIVE_LANGUAGE_NAMES[appUiLang] || appUiLang})
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setPickerMode('ui');
          }}
          className="px-2.5 py-1.5 rounded-[10px] bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] text-xs font-bold border-2 border-[#1E1B2E] shadow-[1.5px_1.5px_0px_0px_#1E1B2E] active:scale-95 shrink-0"
        >
          {t.changeUi}
        </button>
      </div>

      {/* Language Picker Full Modal */}
      {pickerMode && (
        <LanguagePickerModal
          isOpen={true}
          onClose={() => setPickerMode(null)}
          onSelectLanguage={(lang) => {
            if (pickerMode === 'target') {
              addTargetLang(lang);
            } else if (pickerMode === 'ui') {
              setAppLanguage(lang);
            } else {
              setNativeLang(lang);
            }
          }}
          selectedLanguage={pickerMode === 'native' ? nativeLang : pickerMode === 'ui' ? appUiLang : undefined}
          mode={pickerMode === 'target' ? 'multi' : 'single'}
          selectedLanguages={pickerMode === 'target' ? targetLangs : undefined}
          onSelectLanguages={pickerMode === 'target' ? (langs) => onSave({ ...settings, targetLanguages: langs }) : undefined}
          title={pickerMode === 'target' 
            ? t.targetLanguages
            : pickerMode === 'ui'
              ? t.appUiLanguage
              : t.nativeLanguage}
          isRTL={isRTL}
        />
      )}

    </div>
  );
};

