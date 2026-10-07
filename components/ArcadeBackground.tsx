import React from 'react';

export const ArcadeBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10"
      aria-hidden="true"
    >
      {/* 1. Deep arcade ambient synthwave glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[480px] bg-gradient-to-b from-[#2347C5]/15 via-[#9333EA]/10 via-[#FF007F]/5 to-transparent blur-3xl opacity-80" />

      {/* 2. Retro Neon Horizon Sun (Synthwave Arcade Sun) */}
      <div className="absolute top-[32%] left-1/2 -translate-x-1/2 w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] rounded-full bg-gradient-to-t from-[#FF007F] via-[#F59E0B] to-[#FFE600] opacity-25 dark:opacity-40 blur-[1px] pointer-events-none">
        {/* Horizontal stripe cutouts for classic retro sun look */}
        <div className="absolute inset-0 flex flex-col justify-end gap-1.5 pb-2">
          <div className="h-1 bg-[var(--bg)] opacity-70 w-full" />
          <div className="h-1.5 bg-[var(--bg)] opacity-75 w-full" />
          <div className="h-2 bg-[var(--bg)] opacity-80 w-full" />
          <div className="h-2.5 bg-[var(--bg)] opacity-85 w-full" />
          <div className="h-3 bg-[var(--bg)] opacity-90 w-full" />
        </div>
      </div>
      
      {/* 3. Retro Arcade Perspective Grid (Moving Floor) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[52%] opacity-25 dark:opacity-35"
        style={{
          perspective: '450px',
          perspectiveOrigin: '50% 0%',
        }}
      >
        <div 
          className="w-[240%] -left-[70%] h-[200%] absolute top-0"
          style={{
            transform: 'rotateX(74deg)',
            transformOrigin: '50% 0%',
            backgroundImage: `
              linear-gradient(to right, rgba(35, 71, 197, 0.35) 1.5px, transparent 1.5px),
              linear-gradient(to bottom, rgba(234, 179, 8, 0.25) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '44px 44px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 85%)',
          }}
        />
      </div>

      {/* 4. Retro Horizon Neon Line */}
      <div className="absolute top-[48%] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] via-[#00F0FF] to-transparent shadow-[0_0_15px_#FF007F]" />

      {/* 5. Floating Arcade SVGs: Pixel Invader, Coin, Heart, Joysticks & Stars */}
      <svg className="absolute inset-0 w-full h-full opacity-50 dark:opacity-75" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="arcade-matrix" width="56" height="56" patternUnits="userSpaceOnUse">
            <rect x="27" y="27" width="2" height="2" fill="#2347C5" opacity="0.1" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#arcade-matrix)" />

        {/* 8-Bit Pixel Heart (Top Left Floating) */}
        <g className="animate-pulse" style={{ animationDuration: '3s' }} transform="translate(36, 75) scale(1.4)">
          <rect x="1" y="0" width="2" height="1" fill="#FF1058" />
          <rect x="5" y="0" width="2" height="1" fill="#FF1058" />
          <rect x="0" y="1" width="4" height="2" fill="#FF1058" />
          <rect x="4" y="1" width="4" height="2" fill="#FF1058" />
          <rect x="1" y="3" width="6" height="2" fill="#FF1058" />
          <rect x="2" y="5" width="4" height="1" fill="#FF1058" />
          <rect x="3" y="6" width="2" height="1" fill="#FF1058" />
          {/* Highlight */}
          <rect x="1" y="1" width="1" height="1" fill="#FFFFFF" opacity="0.9" />
        </g>

        {/* 8-Bit Pixel Coin (Top Right) */}
        <g className="animate-pulse" style={{ animationDuration: '3.6s', animationDelay: '0.5s' }} transform="translate(340, 85) scale(1.5)">
          <rect x="2" y="0" width="4" height="1" fill="#F59E0B" />
          <rect x="1" y="1" width="6" height="1" fill="#F59E0B" />
          <rect x="0" y="2" width="8" height="4" fill="#F59E0B" />
          <rect x="1" y="6" width="6" height="1" fill="#F59E0B" />
          <rect x="2" y="7" width="4" height="1" fill="#F59E0B" />
          <rect x="3" y="2" width="2" height="4" fill="#FEF08A" />
        </g>

        {/* 8-Bit Space Invader (Mid Left) */}
        <g opacity="0.45" transform="translate(24, 260) scale(1.3)">
          <rect x="2" y="0" width="1" height="1" fill="#00F0FF" />
          <rect x="8" y="0" width="1" height="1" fill="#00F0FF" />
          <rect x="3" y="1" width="1" height="1" fill="#00F0FF" />
          <rect x="7" y="1" width="1" height="1" fill="#00F0FF" />
          <rect x="2" y="2" width="7" height="1" fill="#00F0FF" />
          <rect x="1" y="3" width="2" height="1" fill="#00F0FF" />
          <rect x="4" y="3" width="3" height="1" fill="#00F0FF" />
          <rect x="8" y="3" width="2" height="1" fill="#00F0FF" />
          <rect x="0" y="4" width="11" height="2" fill="#00F0FF" />
          <rect x="0" y="6" width="1" height="2" fill="#00F0FF" />
          <rect x="2" y="6" width="1" height="1" fill="#00F0FF" />
          <rect x="8" y="6" width="1" height="1" fill="#00F0FF" />
          <rect x="10" y="6" width="1" height="2" fill="#00F0FF" />
        </g>

        {/* 8-Bit Joystick (Mid Right) */}
        <g opacity="0.45" transform="translate(345, 340) scale(1.4)">
          <circle cx="5" cy="2" r="3" fill="#FF007F" />
          <rect x="4" y="4" width="2" height="5" fill="#CBD5E1" />
          <rect x="0" y="9" width="10" height="3" rx="1.5" fill="#334155" />
          <circle cx="2" cy="10.5" r="0.8" fill="#F43F5E" />
          <circle cx="8" cy="10.5" r="0.8" fill="#F43F5E" />
        </g>

        {/* 8-Bit Pixel Sparkles */}
        <g className="animate-pulse" style={{ animationDuration: '2.2s' }} transform="translate(60, 180)">
          <rect x="-1" y="-5" width="2" height="10" fill="#00F0FF" opacity="0.85" />
          <rect x="-5" y="-1" width="10" height="2" fill="#00F0FF" opacity="0.85" />
          <rect x="-1.5" y="-1.5" width="3" height="3" fill="#fff" />
        </g>

        <g className="animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '1.2s' }} transform="translate(315, 230)">
          <rect x="-1" y="-4" width="2" height="8" fill="#FFE600" opacity="0.9" />
          <rect x="-4" y="-1" width="8" height="2" fill="#FFE600" opacity="0.9" />
          <rect x="-1" y="-1" width="2" height="2" fill="#fff" />
        </g>
      </svg>

      {/* 6. Subtle CRT Scanline overlay (classic arcade cabinet feel) */}
      <div 
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
  );
};

export default ArcadeBackground;
