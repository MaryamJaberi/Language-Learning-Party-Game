import React from 'react';

export type AvatarId =
  | 'pirate'
  | 'wizard'
  | 'winter_slime'
  | 'king'
  | 'punk_rocker'
  | 'chef'
  | 'detective'
  | 'cyber_dj'
  | 'astronaut'
  | 'ninja'
  | 'dino'
  | 'diver'
  | 'tennis'
  | 'cute_monster'
  | 'samurai'
  | 'ghost_cloud'
  | 'vampire_bat';

export interface AvatarMeta {
  id: AvatarId;
  name: { fa: string; en: string };
  badgeColor: string;
  bgHex: string;
}

export const AVATARS_LIST: AvatarMeta[] = [
  { id: 'pirate', name: { fa: 'کاپیتان دزد دریایی', en: 'Pirate Captain' }, badgeColor: '#FFE600', bgHex: '#3d2800' },
  { id: 'wizard', name: { fa: 'جادوگر کهکشانی', en: 'Cosmic Wizard' }, badgeColor: '#00F0FF', bgHex: '#002244' },
  { id: 'winter_slime', name: { fa: 'اسلایم زمستانی', en: 'Winter Slime' }, badgeColor: '#FF007F', bgHex: '#3a0026' },
  { id: 'king', name: { fa: 'پادشاه تاج‌دار', en: 'Royal King' }, badgeColor: '#39FF14', bgHex: '#0f3800' },
  { id: 'punk_rocker', name: { fa: 'راک‌استار پرانرژی', en: 'Punk Rocker' }, badgeColor: '#FF007F', bgHex: '#400028' },
  { id: 'chef', name: { fa: 'سرآشپز خوش‌خنده', en: 'Happy Chef' }, badgeColor: '#FFE600', bgHex: '#3b2505' },
  { id: 'detective', name: { fa: 'کارآگاه باهوش', en: 'Clever Detective' }, badgeColor: '#FFE600', bgHex: '#352102' },
  { id: 'cyber_dj', name: { fa: 'دی‌جی سایبری', en: 'Cyber DJ' }, badgeColor: '#00F0FF', bgHex: '#022b3a' },
  { id: 'astronaut', name: { fa: 'فضانورد ماجراجو', en: 'Astronaut' }, badgeColor: '#00F0FF', bgHex: '#0a1d37' },
  { id: 'ninja', name: { fa: 'نینجا مخفی', en: 'Stealth Ninja' }, badgeColor: '#FF1058', bgHex: '#1e1026' },
  { id: 'dino', name: { fa: 'دایناسور بازیگوش', en: 'Playful Dino' }, badgeColor: '#39FF14', bgHex: '#07330a' },
  { id: 'diver', name: { fa: 'غواص اقیانوس', en: 'Ocean Diver' }, badgeColor: '#00F0FF', bgHex: '#012338' },
  { id: 'tennis', name: { fa: 'قهرمان مسابقه', en: 'Tennis Champ' }, badgeColor: '#FF007F', bgHex: '#38062b' },
  { id: 'cute_monster', name: { fa: 'هیولای شاخ‌دار', en: 'Horned Monster' }, badgeColor: '#39FF14', bgHex: '#093605' },
  { id: 'samurai', name: { fa: 'سامورایی شجاع', en: 'Brave Samurai' }, badgeColor: '#FF1058', bgHex: '#38000c' },
  { id: 'ghost_cloud', name: { fa: 'روح ابری خندان', en: 'Cloud Ghost' }, badgeColor: '#00F0FF', bgHex: '#0f2742' },
  { id: 'vampire_bat', name: { fa: 'خفاش کوچولو', en: 'Little Bat' }, badgeColor: '#7B2CBF', bgHex: '#25083d' },
];

export const getRandomAvatar = (): AvatarId => {
  const ids: AvatarId[] = [
    'pirate', 'wizard', 'winter_slime', 'king', 'punk_rocker', 'chef', 
    'detective', 'cyber_dj', 'astronaut', 'ninja', 'dino', 'diver', 
    'tennis', 'cute_monster', 'samurai', 'ghost_cloud', 'vampire_bat'
  ];
  return ids[Math.floor(Math.random() * ids.length)];
};

interface AvatarProps {
  id?: AvatarId | string;
  size?: number | string;
  className?: string;
  animate?: boolean;
}

export const PixelAvatar: React.FC<AvatarProps> = ({
  id = 'pirate',
  size = 48,
  className = '',
  animate = false
}) => {
  const isFloat = animate ? 'animate-party-float' : '';
  const effectiveId = (id as AvatarId) || 'pirate';

  switch (effectiveId) {
    case 'pirate':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Black Pirate Tricorn Hat */}
          <path d="M22,34 Q50,18 78,34 Q86,22 50,16 Q14,22 22,34 Z" fill="#181824" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
          <path d="M30,32 Q50,22 70,32" stroke="#FFE600" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* White Skull Emblem on Hat */}
          <circle cx="50" cy="24" r="4.5" fill="#FFFFFF" />
          <rect x="48" y="27" width="4" height="3" rx="1" fill="#FFFFFF" />
          {/* Yellow Round Blob Body */}
          <circle cx="50" cy="58" r="30" fill="#FFC800" stroke="#241442" strokeWidth="4" />
          {/* Rosy Cheeks */}
          <circle cx="34" cy="62" r="3.5" fill="#FF8000" />
          <circle cx="66" cy="62" r="3.5" fill="#FF8000" />
          {/* Pirate Eye Patch on Left */}
          <ellipse cx="38" cy="54" rx="6" ry="6" fill="#181824" stroke="#000000" strokeWidth="2" />
          <line x1="28" y1="46" x2="48" y2="62" stroke="#181824" strokeWidth="2" />
          {/* Right Eye (Happy Twinkle) */}
          <circle cx="62" cy="53" r="5" fill="#1a0833" />
          <circle cx="60" cy="51" r="1.8" fill="#FFFFFF" />
          {/* Pirate Smirk */}
          <path d="M46,65 Q53,70 60,64" stroke="#1a0833" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Golden Cutlass / Saber in Hand */}
          <path d="M80,56 Q88,52 86,40 Q84,54 78,62 Z" fill="#E2E8F0" stroke="#241442" strokeWidth="2.5" />
          <circle cx="78" cy="62" r="3.5" fill="#FFE600" stroke="#241442" strokeWidth="2" />
        </svg>
      );

    case 'wizard':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Pointy Wizard Hat with Stars */}
          <path d="M24,40 L50,8 L76,40 Q50,46 24,40 Z" fill="#1D4ED8" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" />
          {/* Hat Brim */}
          <ellipse cx="50" cy="40" rx="30" ry="7" fill="#2563EB" stroke="#1E1B4B" strokeWidth="3" />
          {/* Magic Yellow Star on Hat */}
          <path d="M50,22 L52,27 L57,27 L53,30 L55,35 L50,32 L45,35 L47,30 L43,27 L48,27 Z" fill="#FFE600" stroke="#B45309" strokeWidth="1" />
          {/* Cyan Blob Body */}
          <circle cx="50" cy="62" r="28" fill="#38BDF8" stroke="#0F172A" strokeWidth="4" />
          {/* Cute Big Sparkly Eyes */}
          <circle cx="39" cy="58" r="6" fill="#0F172A" />
          <circle cx="37" cy="56" r="2.2" fill="#FFFFFF" />
          <circle cx="61" cy="58" r="6" fill="#0F172A" />
          <circle cx="59" cy="56" r="2.2" fill="#FFFFFF" />
          {/* Cheeks */}
          <ellipse cx="32" cy="66" rx="4" ry="2.5" fill="#0284C7" />
          <ellipse cx="68" cy="66" rx="4" ry="2.5" fill="#0284C7" />
          {/* Smile */}
          <path d="M45,67 Q50,73 55,67" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Star Wand */}
          <line x1="75" y1="75" x2="88" y2="48" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="89" cy="47" r="4.5" fill="#FFE600" stroke="#B45309" strokeWidth="2" />
        </svg>
      );

    case 'winter_slime':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Pink Winter Beanie */}
          <path d="M28,42 C28,20 72,20 72,42 Z" fill="#EC4899" stroke="#1E1B4B" strokeWidth="3.5" />
          {/* Beanie Brim */}
          <rect x="24" y="38" width="52" height="10" rx="5" fill="#F472B6" stroke="#1E1B4B" strokeWidth="3" />
          {/* Top Fluffy Pom-Pom */}
          <circle cx="50" cy="18" r="8" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="3" />
          {/* Snowflake Details on Hat */}
          <circle cx="50" cy="30" r="2" fill="#FFFFFF" />
          {/* Sky Cyan Slime Body */}
          <circle cx="50" cy="64" r="28" fill="#67E8F9" stroke="#1E1B4B" strokeWidth="4" />
          {/* Rosy Cheeks */}
          <circle cx="34" cy="68" r="4" fill="#F43F5E" />
          <circle cx="66" cy="68" r="4" fill="#F43F5E" />
          {/* Smiling Eyes */}
          <path d="M36,58 Q41,54 44,58" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M56,58 Q61,54 64,58" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Cute Little Mouth */}
          <circle cx="50" cy="68" r="3.5" fill="#1E1B4B" />
        </svg>
      );

    case 'king':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Golden Jeweled Crown */}
          <path d="M26,38 L30,16 L42,26 L50,12 L58,26 L70,16 L74,38 Z" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <rect x="25" y="34" width="50" height="7" rx="2" fill="#D97706" stroke="#1E1B4B" strokeWidth="2.5" />
          {/* Jewels on Crown */}
          <circle cx="30" cy="16" r="3" fill="#EF4444" stroke="#1E1B4B" strokeWidth="1.5" />
          <circle cx="50" cy="12" r="3.5" fill="#3B82F6" stroke="#1E1B4B" strokeWidth="1.5" />
          <circle cx="70" cy="16" r="3" fill="#10B981" stroke="#1E1B4B" strokeWidth="1.5" />
          {/* Royal Green Slime Body */}
          <circle cx="50" cy="62" r="28" fill="#22C55E" stroke="#1E1B4B" strokeWidth="4" />
          {/* Proud Royal Eyes */}
          <circle cx="40" cy="58" r="5" fill="#1E1B4B" />
          <circle cx="38" cy="56" r="1.8" fill="#FFFFFF" />
          <circle cx="60" cy="58" r="5" fill="#1E1B4B" />
          <circle cx="58" cy="56" r="1.8" fill="#FFFFFF" />
          {/* Cheeks */}
          <circle cx="33" cy="64" r="3.5" fill="#16A34A" />
          <circle cx="67" cy="64" r="3.5" fill="#16A34A" />
          {/* Confident Smile */}
          <path d="M44,66 Q50,74 56,66" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Scepter on Right */}
          <line x1="78" y1="78" x2="86" y2="44" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="87" cy="43" r="5.5" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="2" />
        </svg>
      );

    case 'punk_rocker':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Wild Spiky Pink Hair */}
          <path d="M26,38 L22,18 L34,26 L42,12 L50,26 L58,10 L68,24 L78,16 L74,38 Z" fill="#F43F5E" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          {/* Black Studded Headband */}
          <rect x="24" y="34" width="52" height="7" rx="2" fill="#1E293B" stroke="#1E1B4B" strokeWidth="2.5" />
          <circle cx="36" cy="37.5" r="1.5" fill="#E2E8F0" />
          <circle cx="50" cy="37.5" r="1.5" fill="#E2E8F0" />
          <circle cx="64" cy="37.5" r="1.5" fill="#E2E8F0" />
          {/* Pink Slime Body */}
          <circle cx="50" cy="62" r="28" fill="#FB7185" stroke="#1E1B4B" strokeWidth="4" />
          {/* Excited Wink & Eye */}
          <path d="M35,56 Q40,51 45,56" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="61" cy="55" r="5.5" fill="#1E1B4B" />
          <circle cx="59" cy="53" r="2" fill="#FFFFFF" />
          {/* Singing Open Mouth */}
          <ellipse cx="50" cy="68" rx="7" ry="5" fill="#BE123C" stroke="#1E1B4B" strokeWidth="2.5" />
          {/* Microphone */}
          <circle cx="22" cy="68" r="5" fill="#94A3B8" stroke="#1E1B4B" strokeWidth="2" />
          <line x1="22" y1="73" x2="20" y2="84" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'chef':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* White Toque Blanche Chef Hat */}
          <path d="M30,36 C20,24 40,8 50,14 C60,8 80,24 70,36 Z" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="3" />
          <rect x="28" y="32" width="44" height="9" rx="3" fill="#F1F5F9" stroke="#1E1B4B" strokeWidth="2.5" />
          {/* Warm Peach Slime Body */}
          <circle cx="50" cy="62" r="28" fill="#FDE047" stroke="#1E1B4B" strokeWidth="4" />
          {/* Rosy Cheeks */}
          <circle cx="34" cy="66" r="4.5" fill="#F97316" />
          <circle cx="66" cy="66" r="4.5" fill="#F97316" />
          {/* Happy Closed Smiling Eyes */}
          <path d="M36,56 Q41,51 46,56" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M54,56 Q59,51 64,56" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Chef Mustache / Happy Smile */}
          <path d="M43,67 Q50,74 57,67" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Spatula / Spoon in Hand */}
          <line x1="80" y1="78" x2="86" y2="48" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="87" cy="46" rx="4" ry="6" fill="#94A3B8" stroke="#1E1B4B" strokeWidth="2" />
        </svg>
      );

    case 'detective':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Brown Detective Fedora Hat */}
          <path d="M28,36 Q50,14 72,36 Z" fill="#B45309" stroke="#1E1B4B" strokeWidth="3" />
          <ellipse cx="50" cy="38" rx="32" ry="7" fill="#D97706" stroke="#1E1B4B" strokeWidth="3" />
          <rect x="32" y="31" width="36" height="5" rx="1" fill="#78350F" />
          {/* Warm Amber Slime Body */}
          <circle cx="50" cy="64" r="28" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="4" />
          {/* Curious Detective Eyes */}
          <circle cx="40" cy="58" r="6" fill="#1E1B4B" />
          <circle cx="38" cy="56" r="2" fill="#FFFFFF" />
          <circle cx="60" cy="58" r="6" fill="#1E1B4B" />
          <circle cx="58" cy="56" r="2" fill="#FFFFFF" />
          {/* Thinking Smirk */}
          <path d="M45,70 Q52,73 57,68" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Magnifying Glass */}
          <circle cx="78" cy="62" r="10" fill="#E0F2FE88" stroke="#1E1B4B" strokeWidth="3" />
          <line x1="85" y1="69" x2="93" y2="80" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'cyber_dj':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Twin Antennas */}
          <line x1="36" y1="28" x2="30" y2="12" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="12" r="3.5" fill="#FFE600" stroke="#1E1B4B" strokeWidth="1.5" />
          <line x1="64" y1="28" x2="70" y2="12" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
          <circle cx="70" cy="12" r="3.5" fill="#FFE600" stroke="#1E1B4B" strokeWidth="1.5" />
          {/* DJ Headphone Band */}
          <path d="M20,54 Q50,14 80,54" stroke="#1E1B4B" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Headphone Ear Cups */}
          <rect x="14" y="44" width="10" height="20" rx="4" fill="#0284C7" stroke="#1E1B4B" strokeWidth="3" />
          <rect x="76" y="44" width="10" height="20" rx="4" fill="#0284C7" stroke="#1E1B4B" strokeWidth="3" />
          {/* Cyber Cyan Body */}
          <circle cx="50" cy="60" r="28" fill="#00F0FF" stroke="#1E1B4B" strokeWidth="4" />
          {/* Neon Digital Eyes (LED Squares or Visor) */}
          <rect x="34" y="52" width="10" height="8" rx="2" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" />
          <circle cx="39" cy="56" r="2" fill="#38BDF8" />
          <rect x="56" y="52" width="10" height="8" rx="2" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" />
          <circle cx="61" cy="56" r="2" fill="#38BDF8" />
          {/* Digital Smile */}
          <path d="M43,69 Q50,75 57,69" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'astronaut':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Big Clear Bubble Visor */}
          <circle cx="50" cy="54" r="36" fill="#0F172A" stroke="#CBD5E1" strokeWidth="4.5" />
          {/* Space Slime inside Bubble */}
          <circle cx="50" cy="56" r="25" fill="#38BDF8" />
          {/* Cute Big Eyes in Space */}
          <circle cx="41" cy="52" r="5" fill="#0F172A" />
          <circle cx="39" cy="50" r="2" fill="#FFFFFF" />
          <circle cx="59" cy="52" r="5" fill="#0F172A" />
          <circle cx="57" cy="50" r="2" fill="#FFFFFF" />
          <circle cx="34" cy="58" r="3.5" fill="#0284C7" />
          <circle cx="66" cy="58" r="3.5" fill="#0284C7" />
          <path d="M46,62 Q50,66 54,62" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Visor Glass Gleam Arc */}
          <path d="M26,36 Q50,22 68,30" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.65" />
          {/* Little Star Sparkle on Glass */}
          <circle cx="72" cy="34" r="2.5" fill="#FFE600" />
        </svg>
      );

    case 'ninja':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Dark Ninja Hood Body */}
          <circle cx="50" cy="56" r="32" fill="#1E1B4B" stroke="#09071A" strokeWidth="4" />
          {/* Red Ninja Headband */}
          <rect x="20" y="34" width="60" height="9" rx="2" fill="#DC2626" stroke="#09071A" strokeWidth="2.5" />
          {/* Face Opening Slit */}
          <rect x="30" y="46" width="40" height="18" rx="4" fill="#FED7AA" stroke="#09071A" strokeWidth="2.5" />
          {/* Determined Sharp Ninja Eyes */}
          <ellipse cx="40" cy="55" rx="4" ry="4" fill="#09071A" />
          <circle cx="39" cy="53" r="1.5" fill="#FFFFFF" />
          <ellipse cx="60" cy="55" rx="4" ry="4" fill="#09071A" />
          <circle cx="59" cy="53" r="1.5" fill="#FFFFFF" />
          {/* Headband Ribbon Tails Flapping */}
          <path d="M78,38 Q90,32 94,42" stroke="#DC2626" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M78,41 Q88,38 90,48" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'dino':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Sharp Spiky Dorsal Ridges */}
          <path d="M30,34 L36,18 L44,30 L52,14 L60,28 L68,16 L72,34 Z" fill="#F59E0B" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          {/* Green Dino Body */}
          <circle cx="50" cy="60" r="30" fill="#22C55E" stroke="#1E1B4B" strokeWidth="4" />
          {/* Little Yellow Belly Patch */}
          <ellipse cx="50" cy="72" rx="14" ry="9" fill="#FEF08A" stroke="#1E1B4B" strokeWidth="2" />
          {/* Playful Dino Eyes */}
          <circle cx="39" cy="52" r="6" fill="#1E1B4B" />
          <circle cx="37" cy="50" r="2.2" fill="#FFFFFF" />
          <circle cx="61" cy="52" r="6" fill="#1E1B4B" />
          <circle cx="59" cy="50" r="2.2" fill="#FFFFFF" />
          {/* Rosy Cheeks */}
          <circle cx="31" cy="60" r="3.5" fill="#16A34A" />
          <circle cx="69" cy="60" r="3.5" fill="#16A34A" />
          {/* Cute Open Dino Mouth */}
          <path d="M43,62 Q50,72 57,62 Z" fill="#BE123C" stroke="#1E1B4B" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Tiny Cute Fang */}
          <polygon points="46,62 48,65 50,62" fill="#FFFFFF" />
        </svg>
      );

    case 'diver':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Ocean Diver Helmet */}
          <circle cx="50" cy="56" r="32" fill="#0284C7" stroke="#1E1B4B" strokeWidth="4" />
          {/* Round Brass Porthole Window */}
          <circle cx="50" cy="56" r="20" fill="#E0F2FE" stroke="#F59E0B" strokeWidth="4" />
          {/* Diver Eyes behind Glass */}
          <circle cx="43" cy="56" r="4.5" fill="#1E1B4B" />
          <circle cx="42" cy="54" r="1.5" fill="#FFFFFF" />
          <circle cx="57" cy="56" r="4.5" fill="#1E1B4B" />
          <circle cx="56" cy="54" r="1.5" fill="#FFFFFF" />
          {/* Little Floating Bubbles */}
          <circle cx="76" cy="30" r="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
          <circle cx="84" cy="20" r="2.5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
          <circle cx="70" cy="16" r="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        </svg>
      );

    case 'tennis':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Sun Visor Cap */}
          <ellipse cx="50" cy="36" rx="28" ry="7" fill="#F43F5E" stroke="#1E1B4B" strokeWidth="3" />
          <path d="M30,36 C30,22 70,22 70,36 Z" fill="#FB7185" stroke="#1E1B4B" strokeWidth="2.5" />
          {/* Slime Athlete Body */}
          <circle cx="50" cy="62" r="28" fill="#38BDF8" stroke="#1E1B4B" strokeWidth="4" />
          {/* Enthusiastic Sporty Eyes */}
          <circle cx="40" cy="58" r="5" fill="#1E1B4B" />
          <circle cx="38" cy="56" r="1.8" fill="#FFFFFF" />
          <circle cx="60" cy="58" r="5" fill="#1E1B4B" />
          <circle cx="58" cy="56" r="1.8" fill="#FFFFFF" />
          {/* Grinning Mouth */}
          <path d="M44,67 Q50,73 56,67" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Tennis Racket */}
          <circle cx="82" cy="52" r="9" fill="none" stroke="#F59E0B" strokeWidth="3" />
          <line x1="77" y1="52" x2="87" y2="52" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="82" y1="47" x2="82" y2="57" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="82" y1="61" x2="82" y2="78" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'cute_monster':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Two Cute Yellow Horns */}
          <path d="M30,36 Q22,14 18,22 Q24,28 32,38 Z" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <path d="M70,36 Q78,14 82,22 Q76,28 68,38 Z" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          {/* Lime Emerald Slime Body */}
          <circle cx="50" cy="62" r="30" fill="#84CC16" stroke="#1E1B4B" strokeWidth="4" />
          {/* Big Expressive Eyes */}
          <circle cx="39" cy="56" r="6.5" fill="#1E1B4B" />
          <circle cx="37" cy="54" r="2.2" fill="#FFFFFF" />
          <circle cx="61" cy="56" r="6.5" fill="#1E1B4B" />
          <circle cx="59" cy="54" r="2.2" fill="#FFFFFF" />
          {/* Cheeks */}
          <circle cx="30" cy="64" r="4" fill="#65A30D" />
          <circle cx="70" cy="64" r="4" fill="#65A30D" />
          {/* Wide Monster Grin with 2 Little Teeth */}
          <path d="M40,68 Q50,78 60,68 Z" fill="#991B1B" stroke="#1E1B4B" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="44,68 46,71 48,68" fill="#FFFFFF" />
          <polygon points="52,68 54,71 56,68" fill="#FFFFFF" />
        </svg>
      );

    case 'samurai':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Golden Crest on Helmet */}
          <path d="M42,20 Q50,6 58,20 L50,14 Z" fill="#FBBF24" stroke="#1E1B4B" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Crimson Samurai Kabuto Helmet */}
          <path d="M22,44 C22,22 78,22 78,44 Z" fill="#DC2626" stroke="#1E1B4B" strokeWidth="3.5" />
          <rect x="20" y="40" width="60" height="8" rx="2" fill="#991B1B" stroke="#1E1B4B" strokeWidth="2.5" />
          {/* Fiery Red Body */}
          <circle cx="50" cy="64" r="28" fill="#EF4444" stroke="#1E1B4B" strokeWidth="4" />
          {/* Fierce Samurai Eyes */}
          <circle cx="40" cy="58" r="5" fill="#1E1B4B" />
          <circle cx="38" cy="56" r="1.8" fill="#FFFFFF" />
          <circle cx="60" cy="58" r="5" fill="#1E1B4B" />
          <circle cx="58" cy="56" r="1.8" fill="#FFFFFF" />
          {/* Samurai Mustache / Resolute Lip */}
          <path d="M42,66 Q50,70 58,66" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'ghost_cloud':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Fluffy Puffy Cloud Body */}
          <path d="M25,65 C15,65 15,48 26,44 C24,30 40,24 50,30 C60,24 76,30 74,44 C85,48 85,65 75,65 C68,76 56,76 50,70 C44,76 32,76 25,65 Z" 
            fill="#E0F2FE" stroke="#0284C7" strokeWidth="4" strokeLinejoin="round" />
          {/* Glowing Star Sparkle */}
          <circle cx="78" cy="28" r="3" fill="#FFE600" stroke="#0284C7" strokeWidth="1.5" />
          {/* Happy Ghost Eyes */}
          <circle cx="42" cy="48" r="4.5" fill="#0369A1" />
          <circle cx="40" cy="46" r="1.8" fill="#FFFFFF" />
          <circle cx="58" cy="48" r="4.5" fill="#0369A1" />
          <circle cx="56" cy="46" r="1.8" fill="#FFFFFF" />
          {/* Rosy Cheeks */}
          <ellipse cx="36" cy="55" rx="3.5" ry="2" fill="#BAE6FD" />
          <ellipse cx="64" cy="55" rx="3.5" ry="2" fill="#BAE6FD" />
          {/* Gentle Smile */}
          <path d="M47,56 Q50,61 53,56" stroke="#0369A1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'vampire_bat':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`${isFloat} ${className} shrink-0`}>
          {/* Pointy Bat Ears */}
          <polygon points="30,38 20,16 38,28" fill="#581C87" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="70,38 80,16 62,28" fill="#581C87" stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
          {/* Purple Bat Body */}
          <circle cx="50" cy="60" r="28" fill="#7E22CE" stroke="#1E1B4B" strokeWidth="4" />
          {/* Cute Little Wings on Sides */}
          <path d="M22,60 Q10,50 12,68 Q18,65 22,68 Z" fill="#581C87" stroke="#1E1B4B" strokeWidth="2.5" />
          <path d="M78,60 Q90,50 88,68 Q82,65 78,68 Z" fill="#581C87" stroke="#1E1B4B" strokeWidth="2.5" />
          {/* Big Sparkly Purple Eyes */}
          <circle cx="41" cy="56" r="5.5" fill="#1E1B4B" />
          <circle cx="39" cy="54" r="2" fill="#FFFFFF" />
          <circle cx="59" cy="56" r="5.5" fill="#1E1B4B" />
          <circle cx="57" cy="54" r="2" fill="#FFFFFF" />
          {/* Cheeks */}
          <circle cx="33" cy="63" r="3.5" fill="#A855F7" />
          <circle cx="67" cy="63" r="3.5" fill="#A855F7" />
          {/* Smile with 2 Tiny Fangs */}
          <path d="M45,66 Q50,72 55,66" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
          <polygon points="46,67 47,70 48,67" fill="#FFFFFF" />
          <polygon points="52,67 53,70 54,67" fill="#FFFFFF" />
        </svg>
      );

    default:
      return (
        <circle cx="50" cy="50" r="30" fill="#FFE600" stroke="#241442" strokeWidth="4" />
      );
  }
};
