import React from 'react';

export const ArcadeBackground: React.FC = () => {
  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0"
      aria-hidden="true"
    >
      {/* 1. Deep arcade ambient glow (lapis & turquoise neon) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[380px] bg-gradient-to-b from-[var(--lapis)]/10 via-[var(--turq)]/5 to-transparent blur-3xl opacity-70" />
      
      {/* 2. Retro Arcade Perspective Grid (Floor) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[48%] opacity-20 dark:opacity-30"
        style={{
          perspective: '450px',
          perspectiveOrigin: '50% 0%',
        }}
      >
        <div 
          className="w-[200%] -left-[50%] h-[180%] absolute top-0"
          style={{
            transform: 'rotateX(72deg)',
            transformOrigin: '50% 0%',
            backgroundImage: `
              linear-gradient(to right, rgba(35, 71, 197, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(18, 181, 164, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          }}
        />
      </div>

      {/* 3. Retro Horizon Neon Line */}
      <div className="absolute top-[52%] left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--turq)]/30 to-transparent shadow-[0_0_10px_var(--turq)]" />

      {/* 4. Subtle arcade pixel stars & floating elements */}
      <svg className="absolute inset-0 w-full h-full opacity-40 dark:opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Pixel Cross Pattern */}
          <pattern id="pixel-dot" width="48" height="48" patternUnits="userSpaceOnUse">
            <rect x="23" y="23" width="2" height="2" fill="var(--lapis)" opacity="0.12" />
          </pattern>
        </defs>
        
        {/* Background Dot Matrix */}
        <rect width="100%" height="100%" fill="url(#pixel-dot)" />

        {/* Twinkling 8-bit Pixel Stars */}
        {/* Top Left Star */}
        <g className="animate-pulse" style={{ animationDuration: '2.5s' }} transform="translate(42, 65)">
          <rect x="-1" y="-4" width="2" height="8" fill="var(--turq)" opacity="0.75" />
          <rect x="-4" y="-1" width="8" height="2" fill="var(--turq)" opacity="0.75" />
          <rect x="-1" y="-1" width="2" height="2" fill="#fff" />
        </g>

        {/* Top Right Star */}
        <g className="animate-pulse" style={{ animationDuration: '3.2s', animationDelay: '0.8s' }} transform="translate(340, 95)">
          <rect x="-1" y="-5" width="2" height="10" fill="var(--saffron)" opacity="0.8" />
          <rect x="-5" y="-1" width="10" height="2" fill="var(--saffron)" opacity="0.8" />
          <rect x="-1.5" y="-1.5" width="3" height="3" fill="#fff" />
        </g>

        {/* Mid Left Sparkle */}
        <g className="animate-pulse" style={{ animationDuration: '4s', animationDelay: '1.5s' }} transform="translate(25, 230)">
          <rect x="-1" y="-3" width="2" height="6" fill="var(--lapis)" opacity="0.6" />
          <rect x="-3" y="-1" width="6" height="2" fill="var(--lapis)" opacity="0.6" />
        </g>

        {/* Mid Right Sparkle */}
        <g className="animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.4s' }} transform="translate(355, 280)">
          <rect x="-1" y="-4" width="2" height="8" fill="var(--turq)" opacity="0.7" />
          <rect x="-4" y="-1" width="8" height="2" fill="var(--turq)" opacity="0.7" />
        </g>

        {/* Floating Mini 8-Bit Pixel Invader/Coin Accent */}
        <g opacity="0.35" transform="translate(28, 380) scale(1.1)">
          {/* Retro Pixel Coin */}
          <rect x="2" y="0" width="4" height="1" fill="var(--saffron)" />
          <rect x="1" y="1" width="6" height="1" fill="var(--saffron)" />
          <rect x="0" y="2" width="8" height="4" fill="var(--saffron)" />
          <rect x="1" y="6" width="6" height="1" fill="var(--saffron)" />
          <rect x="2" y="7" width="4" height="1" fill="var(--saffron)" />
          {/* Inner dollar/coin line */}
          <rect x="3" y="3" width="2" height="2" fill="#fff" opacity="0.8" />
        </g>

        {/* Floating Retro Joystick silhouette */}
        <g opacity="0.3" transform="translate(345, 420) scale(1.1)">
          {/* Stick */}
          <circle cx="5" cy="2" r="2.5" fill="var(--lapis)" />
          <rect x="4" y="4" width="2" height="4" fill="var(--mute)" />
          {/* Base */}
          <rect x="0" y="8" width="10" height="3" rx="1" fill="var(--ink)" opacity="0.4" />
        </g>
      </svg>

      {/* 5. Subtle CRT Scanline overlay (ultra light, 3% opacity for true retro arcade feel) */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
  );
};

export default ArcadeBackground;
