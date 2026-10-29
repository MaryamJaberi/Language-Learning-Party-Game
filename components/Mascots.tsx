import React from 'react';
import { TeamColor } from '../types';

interface MascotProps {
  color?: TeamColor | 'PARTY';
  className?: string;
  size?: number | string;
  animate?: boolean;
}

export const TeamMascot: React.FC<MascotProps> = ({ color = TeamColor.Blue, className = '', size = 72, animate = true }: MascotProps) => {
  const isPartyAnimate = animate ? 'animate-party-float' : '';

  switch (color) {
    case TeamColor.Blue:
      /* BLUE TEAM: Clean, minimal and friendly avatar */
      return (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className={`${isPartyAnimate} ${className} drop-shadow-sm`}
        >
          {/* Subtle soft base shadow */}
          <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.06)" />

          {/* Clean minimal round body */}
          <circle cx="50" cy="50" r="35" fill="#0284C7" />
          <circle cx="50" cy="50" r="32" fill="#38BDF8" />

          {/* Friendly clean eyes */}
          <circle cx="40" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="38.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="60" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="58.5" cy="44.5" r="1.5" fill="#FFFFFF" />

          {/* Minimal soft cheeks */}
          <circle cx="31" cy="53" r="3.5" fill="#FB7185" opacity="0.6" />
          <circle cx="69" cy="53" r="3.5" fill="#FB7185" opacity="0.6" />

          {/* Gentle pleasant smile */}
          <path d="M44,53 Q50,59 56,53" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case TeamColor.Red:
      /* RED TEAM: Clean, minimal and friendly flat avatar */
      return (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className={`${isPartyAnimate} ${className} drop-shadow-sm`}
        >
          <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.06)" />
          <circle cx="50" cy="50" r="35" fill="#E11D48" />
          <circle cx="50" cy="50" r="32" fill="#FB7185" />
          <circle cx="40" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="38.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="60" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="58.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="31" cy="53" r="3.5" fill="#FFE4E6" opacity="0.6" />
          <circle cx="69" cy="53" r="3.5" fill="#FFE4E6" opacity="0.6" />
          <path d="M44,53 Q50,59 56,53" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case TeamColor.Green:
      /* GREEN TEAM: Clean, minimal and friendly flat avatar */
      return (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className={`${isPartyAnimate} ${className} drop-shadow-sm`}
        >
          <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.06)" />
          <circle cx="50" cy="50" r="35" fill="#059669" />
          <circle cx="50" cy="50" r="32" fill="#34D399" />
          <circle cx="40" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="38.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="60" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="58.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="31" cy="53" r="3.5" fill="#FB7185" opacity="0.55" />
          <circle cx="69" cy="53" r="3.5" fill="#FB7185" opacity="0.55" />
          <path d="M44,53 Q50,59 56,53" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case TeamColor.Yellow:
      /* YELLOW TEAM: Clean, minimal and friendly flat avatar */
      return (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className={`${isPartyAnimate} ${className} drop-shadow-sm`}
        >
          <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.06)" />
          <circle cx="50" cy="50" r="35" fill="#D97706" />
          <circle cx="50" cy="50" r="32" fill="#FBBF24" />
          <circle cx="40" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="38.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="60" cy="46" r="4.5" fill="#0F172A" />
          <circle cx="58.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="31" cy="53" r="3.5" fill="#FB7185" opacity="0.55" />
          <circle cx="69" cy="53" r="3.5" fill="#FB7185" opacity="0.55" />
          <path d="M44,53 Q50,59 56,53" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'PARTY':
      /* PARTY MASCOT: Clean flat avatar in brand Lapis/Saffron palette */
      return (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          className={`${isPartyAnimate} ${className} drop-shadow-sm`}
        >
          <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.06)" />
          <circle cx="50" cy="52" r="34" fill="#1E3A8A" />
          <circle cx="50" cy="52" r="31" fill="#3B82F6" />
          {/* Flat crown / star badge at top */}
          <polygon points="50,10 41,24 59,24" fill="#F59E0B" />
          <circle cx="50" cy="9" r="3" fill="#FBBF24" />
          {/* Friendly clean eyes */}
          <circle cx="40" cy="48" r="4.5" fill="#0F172A" />
          <circle cx="38.5" cy="46.5" r="1.5" fill="#FFFFFF" />
          <circle cx="60" cy="48" r="4.5" fill="#0F172A" />
          <circle cx="58.5" cy="46.5" r="1.5" fill="#FFFFFF" />
          <circle cx="31" cy="55" r="3.5" fill="#FB7185" opacity="0.6" />
          <circle cx="69" cy="55" r="3.5" fill="#FB7185" opacity="0.6" />
          <path d="M44,55 Q50,61 56,55" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
};
