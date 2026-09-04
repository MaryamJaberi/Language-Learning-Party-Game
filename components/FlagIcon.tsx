import React from 'react';
import { Language } from '../types';

interface FlagIconProps {
  language: Language | string;
  size?: number | string;
  className?: string;
}

/**
 * High-definition SVG Flag renderer with Lion & Sun (شیر و خورشید) for Persian
 */
export const FlagIcon: React.FC<FlagIconProps> = ({ 
  language, 
  size = 20, 
  className = '' 
}) => {
  const code = (language || '').toLowerCase();

  // Persian Flag: Historic Lion and Sun (شیر و خورشید) Tricolor (Green, White, Red with Golden Lion & Sun)
  if (code === 'fa' || code === 'per' || code === 'pes') {
    return (
      <svg
        width={size}
        height={typeof size === 'number' ? Math.round(size * 0.7) : 'auto'}
        viewBox="0 0 600 400"
        className={`inline-block rounded-sm overflow-hidden shadow-sm border border-black/10 shrink-0 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="پرچم ایران (شیر و خورشید)"
        role="img"
      >
        {/* Top Green Stripe */}
        <rect width="600" height="133.33" fill="#239F40" />
        {/* Middle White Stripe */}
        <rect y="133.33" width="600" height="133.33" fill="#FFFFFF" />
        {/* Bottom Red Stripe */}
        <rect y="266.66" width="600" height="133.34" fill="#DA0000" />
        
        {/* Center Emblem: Golden Lion and Radiant Sun (شیر و خورشید) */}
        <g transform="translate(300, 200) scale(0.68)">
          {/* Radiant Sun Rays */}
          <circle cx="20" cy="-22" r="32" fill="#FFA500" />
          <circle cx="20" cy="-22" r="26" fill="#FFD700" />
          
          {/* Sun Ray Beams */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <polygon
              key={deg}
              points="20,-22 17,-64 23,-64"
              fill="#FFB800"
              transform={`rotate(${deg}, 20, -22)`}
            />
          ))}
          
          {/* Golden Lion Body & Mane */}
          {/* Tail */}
          <path
            d="M-70,25 C-95,15 -110,-10 -95,-35 C-85,-48 -70,-35 -75,-20 C-80,-5 -60,5 -45,15 Z"
            fill="#D49000"
          />
          {/* Rear Haunches & Hind Legs */}
          <path
            d="M-55,10 C-65,0 -50,-20 -30,-15 C-15,-10 -5,5 -15,35 C-20,48 -35,55 -40,55 C-48,55 -52,40 -48,30 C-42,20 -50,15 -55,10 Z"
            fill="#E5A100"
          />
          {/* Torso */}
          <path
            d="M-40,15 C-20,-5 20,-8 50,5 C60,10 65,30 50,45 C30,55 -25,52 -40,15 Z"
            fill="#F2B200"
          />
          {/* Forelegs */}
          <path
            d="M35,25 L42,60 C42,65 35,68 30,65 L26,30 Z"
            fill="#D49000"
          />
          {/* Right Raised Paw holding Scimitar (شمشیر) */}
          <path
            d="M50,15 C60,8 75,-2 85,-15 C90,-12 88,-5 80,5 C70,18 60,25 50,15 Z"
            fill="#E5A100"
          />
          {/* Scimitar (Shamshir) Blade */}
          <path
            d="M75,-12 Q125,-45 130,-70 Q118,-45 80,-20 Q70,-15 75,-12 Z"
            fill="#E0E6ED"
            stroke="#6B7C96"
            strokeWidth="2"
          />
          {/* Scimitar Golden Handle */}
          <path
            d="M72,-16 L84,-8 L81,-3 L69,-11 Z"
            fill="#9A6B00"
          />
          
          {/* Mane & Head */}
          <path
            d="M20,10 C10,-10 20,-35 45,-40 C65,-45 75,-25 70,0 C65,15 40,25 20,10 Z"
            fill="#C98000"
          />
          <circle cx="50" cy="-22" r="18" fill="#F2B200" />
          {/* Ears */}
          <polygon points="40,-38 48,-48 52,-36" fill="#C98000" />
          <polygon points="56,-36 62,-46 66,-34" fill="#C98000" />
          {/* Muzzle & Nose */}
          <ellipse cx="62" cy="-18" rx="7" ry="6" fill="#D49000" />
          <polygon points="65,-21 68,-21 66.5,-18" fill="#4A2600" />
          {/* Eye */}
          <circle cx="53" cy="-25" r="2.5" fill="#1A0A00" />
          {/* Crown */}
          <polygon points="44,-42 48,-52 52,-44 56,-52 60,-42" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
        </g>
      </svg>
    );
  }

  // American English Flag (en-US)
  if (code === 'en-us') {
    return <span className={`text-base leading-none ${className}`}>🇺🇸</span>;
  }
  // British English Flag (en / en-gb)
  if (code === 'en' || code === 'en-gb') {
    return <span className={`text-base leading-none ${className}`}>🇬🇧</span>;
  }
  // Dutch (nl)
  if (code === 'nl') {
    return <span className={`text-base leading-none ${className}`}>🇳🇱</span>;
  }
  // German (de)
  if (code === 'de') {
    return <span className={`text-base leading-none ${className}`}>🇩🇪</span>;
  }
  // French (fr)
  if (code === 'fr') {
    return <span className={`text-base leading-none ${className}`}>🇫🇷</span>;
  }
  // Spanish (es)
  if (code === 'es') {
    return <span className={`text-base leading-none ${className}`}>🇪🇸</span>;
  }
  // Italian (it)
  if (code === 'it') {
    return <span className={`text-base leading-none ${className}`}>🇮🇹</span>;
  }
  // Arabic (ar)
  if (code === 'ar') {
    return <span className={`text-base leading-none ${className}`}>🇸🇦</span>;
  }
  // Turkish (tr)
  if (code === 'tr') {
    return <span className={`text-base leading-none ${className}`}>🇹🇷</span>;
  }
  // Polish (pl)
  if (code === 'pl') {
    return <span className={`text-base leading-none ${className}`}>🇵🇱</span>;
  }
  // Ukrainian (uk)
  if (code === 'uk') {
    return <span className={`text-base leading-none ${className}`}>🇺🇦</span>;
  }

  // Portuguese
  if (code === 'pt') {
    return <span className={`leading-none ${className}`} style={{ fontSize: typeof size === 'number' ? size : 16 }}>🇵🇹</span>;
  }
  // Chinese
  if (code === 'zh') {
    return <span className={`leading-none ${className}`} style={{ fontSize: typeof size === 'number' ? size : 16 }}>🇨🇳</span>;
  }
  // Japanese
  if (code === 'ja') {
    return <span className={`leading-none ${className}`} style={{ fontSize: typeof size === 'number' ? size : 16 }}>🇯🇵</span>;
  }
  // Korean
  if (code === 'ko') {
    return <span className={`leading-none ${className}`} style={{ fontSize: typeof size === 'number' ? size : 16 }}>🇰🇷</span>;
  }
  // Hindi / India
  if (code === 'hi') {
    return <span className={`leading-none ${className}`} style={{ fontSize: typeof size === 'number' ? size : 16 }}>🇮🇳</span>;
  }

  // Fallback Globe or emoji
  return <span className={`leading-none ${className}`} style={{ fontSize: typeof size === 'number' ? size : 16 }}>🌐</span>;
};

export default FlagIcon;
