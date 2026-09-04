import { TeamColor, Language, CEFRLevel } from './types';

export const COLORS_MAP: Record<TeamColor, { bg: string, text: string, hex: string, surface: string, border: string, glow: string }> = {
  [TeamColor.Blue]: { 
    bg: 'bg-[#00F0FF]', 
    text: 'text-[#1a0833]', 
    hex: '#00F0FF', 
    surface: '#001D3D', 
    border: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.7)'
  },
  [TeamColor.Red]: { 
    bg: 'bg-[#FF1058]', 
    text: 'text-white', 
    hex: '#FF1058', 
    surface: '#380016', 
    border: '#FF1058',
    glow: 'rgba(255, 16, 88, 0.7)'
  },
  [TeamColor.Green]: { 
    bg: 'bg-[#39FF14]', 
    text: 'text-[#1a0833]', 
    hex: '#39FF14', 
    surface: '#002B11', 
    border: '#39FF14',
    glow: 'rgba(57, 255, 20, 0.7)'
  },
  [TeamColor.Yellow]: { 
    bg: 'bg-[#FFE600]', 
    text: 'text-[#1a0833]', 
    hex: '#FFE600', 
    surface: '#332600', 
    border: '#FFE600',
    glow: 'rgba(255, 230, 0, 0.7)'
  },
};

// High-Energy Party & Co SHOCK YOU! Color Palette
export const UI_COLORS = {
  shockPink: '#FF007F',        // Hot Pink / Magenta
  shockYellow: '#FFE600',      // Electric Yellow
  shockCyan: '#00F0FF',        // Electric Turquoise / Sky
  shockPurple: '#7B2CBF',      // Electric Purple / Violet
  deepIndigo: '#241442',       // Dark Navy / Indigo
  cardBackground: '#311b59',   // Dark card background
  darkBorder: '#241442',       // Bold Border Color
  neonLime: '#39FF14',         // Neon Lime Green
  dangerRed: '#FF2A6D',        // Neon Danger Red
  goldAccent: '#FFD700',       // Golden Card Glow
};

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  persianName: string;
  flag: string;
  direction: 'rtl' | 'ltr';
  popular?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'American English', persianName: 'انگلیسی آمریکایی', flag: '🇺🇸', direction: 'ltr', popular: true },
  { code: 'en', name: 'English (UK)', nativeName: 'British English', persianName: 'انگلیسی بریتانیایی', flag: '🇬🇧', direction: 'ltr', popular: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', persianName: 'هلندی', flag: '🇳🇱', direction: 'ltr', popular: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', persianName: 'آلمانی', flag: '🇩🇪', direction: 'ltr', popular: true },
  { code: 'fr', name: 'French', nativeName: 'Français', persianName: 'فرانسوی', flag: '🇫🇷', direction: 'ltr', popular: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', persianName: 'اسپانیایی', flag: '🇪🇸', direction: 'ltr', popular: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', persianName: 'ایتالیایی', flag: '🇮🇹', direction: 'ltr' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', persianName: 'فارسی', flag: '🇮🇷', direction: 'rtl', popular: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', persianName: 'عربی', flag: '🇸🇦', direction: 'rtl', popular: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', persianName: 'ترکی', flag: '🇹🇷', direction: 'ltr', popular: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', persianName: 'لهستانی', flag: '🇵🇱', direction: 'ltr' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', persianName: 'اوکراینی', flag: '🇺🇦', direction: 'ltr' }
];

export interface CEFRLevelInfo {
  id: CEFRLevel;
  code: string;
  name: Record<string, string>;
  desc: Record<string, string>;
  example: Record<string, string>;
  color: string;
  badge: string;
}

export const CEFR_LEVELS: CEFRLevelInfo[] = [
  {
    id: 'A1',
    code: 'A1',
    name: { fa: 'مبتدی (A1)', en: 'Beginner (A1)', nl: 'Beginner (A1)' },
    desc: { 
      fa: 'کلمات پایه، احوالپرسی و اصطلاحات روزمره بسیار ساده', 
      en: 'Basic words, greetings, and daily essentials',
      nl: 'Basiswoorden, begroetingen en eenvoudige zinnen'
    },
    example: { fa: 'مثال: آب، سلام، این چنده؟', en: 'e.g. Water, Hello, How much is this?', nl: 'bijv. Water, Hallo, Mag ik de rekening?' },
    color: '#39FF14',
    badge: '🟢 A1'
  },
  {
    id: 'A2',
    code: 'A2',
    name: { fa: 'مقدماتی (A2)', en: 'Elementary (A2)', nl: 'Elementair (A2)' },
    desc: { 
      fa: 'جملات کوتاه در رستوران، خرید، مسیر و احوالپرسی', 
      en: 'Short phrases in restaurants, shopping, and directions',
      nl: 'Korte zinnen in restaurants, winkelen en route'
    },
    example: { fa: 'مثال: میز برای ۲ نفر، ایستگاه کجاست؟', en: 'e.g. Table for two, Where is the station?', nl: 'bijv. Een tafel voor twee, Waar is het station?' },
    color: '#FFE600',
    badge: '🟡 A2'
  },
  {
    id: 'B1',
    code: 'B1',
    name: { fa: 'متوسط (B1)', en: 'Intermediate (B1)', nl: 'Gevorderd (B1)' },
    desc: { 
      fa: 'مکالمات کاری، سفر، احساسات و بیان نظر شخصی', 
      en: 'Conversations at work, travel, and personal opinions',
      nl: 'Gesprekken op werk, reizen en meningen uiten'
    },
    example: { fa: 'مثال: قرار ملاقات، مصاحبه، شرح خاطره', en: 'e.g. Meeting setup, Interview, Storytelling', nl: 'bijv. Afspraak maken, Sollicitatiegesprek' },
    color: '#00F0FF',
    badge: '🔵 B1'
  },
  {
    id: 'B2',
    code: 'B2',
    name: { fa: 'فوق متوسط (B2)', en: 'Upper-Intermediate (B2)', nl: 'Hoger Gemiddeld (B2)' },
    desc: { 
      fa: 'بحث‌های تخصصی‌تر، اصطلاحات محاوره‌ای و تحلیل موضوعات', 
      en: 'Specialized discussions, idioms, and fluent debates',
      nl: 'Vloeiende discussies, uitdrukkingen en debatten'
    },
    example: { fa: 'مثال: قرارداد کاری، مذاکره، بحث اجتماعی', en: 'e.g. Contract, Negotiation, Social debate', nl: 'bijv. Onderhandelen, Werkcontract bespreken' },
    color: '#FF007F',
    badge: '🟣 B2'
  },
  {
    id: 'C1',
    code: 'C1',
    name: { fa: 'پیشرفته (C1)', en: 'Advanced (C1)', nl: 'Gevorderd (C1)' },
    desc: { 
      fa: 'اصطلاحات عامیانه عمیق، شوخی‌ها، ضرب‌المثل‌ها و مفاهیم پیچیده', 
      en: 'Native nuances, humor, proverbs, and complex themes',
      nl: 'Diepe nuances, humor, spreekwoorden en complexe ideeën'
    },
    example: { fa: 'مثال: ضرب‌المثل‌های اصیل، استعاره‌ها', en: 'e.g. Subtle idioms, cultural metaphors', nl: 'bijv. Spreekwoorden en culturele metaforen' },
    color: '#7B2CBF',
    badge: '🔴 C1'
  },
  {
    id: 'all',
    code: 'ALL',
    name: { fa: 'ترکیبی (همه سطوح)', en: 'Mixed (All Levels)', nl: 'Gemengd (Alle Niveaus)' },
    desc: { 
      fa: 'ترکیب هیجان‌انگیز و متنوع از مبتدی تا پیشرفته', 
      en: 'Exciting balanced mix from beginner to advanced',
      nl: 'Afwisselende mix van beginner tot gevorderd'
    },
    example: { fa: 'چالش متعادل برای همه هم‌تیمی‌ها', en: 'Dynamic balance for all team members', nl: 'Dynamische uitdaging voor elk team' },
    color: '#00F0FF',
    badge: '🌈 ALL'
  }
];

// Rich Language Learning Categories (aligned with Document Topics)
export const CATEGORIES: Record<string, string[]> = {
  "CAT_EVERYDAY": [],
  "CAT_RESTAURANT": [],
  "CAT_FOOD": [],
  "CAT_TRAVEL": [],
  "CAT_TRANSPORT": [],
  "CAT_SHOPPING": [],
  "CAT_WORK": [],
  "CAT_EDUCATION": [],
  "CAT_FAMILY": [],
  "CAT_SOCIAL": [],
  "CAT_HEALTH": [],
  "CAT_CITY": [],
  "CAT_TECH": [],
  "CAT_SMALLTALK": [],
  "CAT_SPORTS": [],
  "CAT_NATURE": [],
  // Legacy categories for backward compatibility
  "CAT_OBJECTS": [],
  "CAT_ANIMALS": [],
  "CAT_JOBS": [],
  "CAT_PLACES": [],
  "CAT_VEHICLES": [],
  "CAT_FEELINGS": [],
  "CAT_ADJECTIVES": [],
  "CAT_ENTERTAINMENT": []
};
