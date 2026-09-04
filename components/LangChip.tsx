import React from 'react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { FlagIcon } from './FlagIcon';
import { Check } from 'lucide-react';

const SHORT: Record<string, string> = {
  'en-US': 'US',
  en: 'GB',
  nl: 'NL',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  fa: 'FA',
  ar: 'AR',
  tr: 'TR',
  pl: 'PL',
  uk: 'UA',
  pt: 'PT',
  zh: 'ZH',
  ja: 'JA',
  ko: 'KO',
  hi: 'HI',
};

export function LangChip({
  code,
  selected,
  onClick,
  showName = false,
}: {
  code: Language;
  selected?: boolean;
  onClick: () => void;
  showName?: boolean;
}) {
  const info = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-9 min-w-0 rounded-xl border-2 border-[#241442] px-1.5 flex items-center justify-center gap-1 text-[10px] font-black transition-transform active:scale-95 ${
        selected
          ? 'bg-[#FFE600] text-[#1a0833] shadow-[1.5px_1.5px_0_0_#241442]'
          : 'bg-white text-[#1a0833]'
      }`}
    >
      <FlagIcon language={code} size={16} />
      <span className="leading-none">{showName ? info?.nativeName : SHORT[code] || code.toUpperCase()}</span>
      {selected ? (
        <Check size={11} strokeWidth={3.5} className="shrink-0" />
      ) : null}
    </button>
  );
}

export function LangChipGrid({
  selected,
  onToggle,
  compact = true,
}: {
  selected: Language | Language[];
  onToggle: (code: Language) => void;
  compact?: boolean;
}) {
  const sel = Array.isArray(selected) ? selected : [selected];
  return (
    <div className={`grid gap-1.5 ${compact ? 'grid-cols-5' : 'grid-cols-4'}`} dir="ltr">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <LangChip
          key={lang.code}
          code={lang.code}
          selected={sel.includes(lang.code)}
          onClick={() => onToggle(lang.code)}
        />
      ))}
    </div>
  );
}
