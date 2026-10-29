import React from 'react';
import { Language } from '../types';

interface FlagIconProps {
  language: Language | string;
  size?: number | string;
  className?: string;
}

/**
 * Clean Language Abbreviation Badge (No country flags)
 * Displays ONLY the 2-letter uppercase English abbreviation of the language.
 */
export const FlagIcon: React.FC<FlagIconProps> = ({ 
  language, 
  size = 20, 
  className = '' 
}) => {
  const raw = (language || 'fa').toString().trim();
  const baseCode = raw.split(/[-_]/)[0].toUpperCase();
  const shortCode = (baseCode.length > 2 ? baseCode.slice(0, 2) : baseCode) || 'FA';

  const numSize = typeof size === 'number' ? size : parseInt(String(size)) || 20;
  const fontSize = Math.max(8.5, Math.round(numSize * 0.44));

  return (
    <span
      className={`inline-flex items-center justify-center font-black font-mono tracking-tighter uppercase rounded-[6px] bg-[#2347C5]/10 text-[#2347C5] dark:bg-[#5B7CF0]/20 dark:text-[#5B7CF0] border border-[#2347C5]/30 select-none shrink-0 leading-none ${className}`}
      style={{
        width: `${numSize}px`,
        height: `${numSize}px`,
        minWidth: `${numSize}px`,
        fontSize: `${fontSize}px`
      }}
      aria-hidden="true"
    >
      {shortCode}
    </span>
  );
};

export default FlagIcon;
