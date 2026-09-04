import React from 'react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Check } from 'lucide-react';

export function LangChip({
  code,
  selected,
  onClick,
}: {
  code: Language;
  selected?: boolean;
  onClick: () => void;
}) {
  const info = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-xl border-2 border-[#241442] px-2.5 text-[12px] font-black transition-transform active:scale-95 ${
        selected
          ? 'bg-[#FFE600] text-[#1a0833] shadow-[1.5px_1.5px_0_0_#241442]'
          : 'bg-white text-[#1a0833]'
      }`}
    >
      <span className="leading-none">{info?.nativeName || code}</span>
      {selected ? <Check size={12} strokeWidth={3.5} className="ms-1 inline" /> : null}
    </button>
  );
}

export function LangChipGrid({
  selected,
  onToggle,
}: {
  selected: Language | Language[];
  onToggle: (code: Language) => void;
}) {
  const sel = Array.isArray(selected) ? selected : [selected];
  return (
    <div className="flex flex-wrap gap-1.5">
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
