import { TeamColor, Language, CEFRLevel } from './types';

export const COLORS_MAP: Record<TeamColor, { bg: string, text: string, hex: string, surface: string, border: string, glow: string, name: string, faName: string }> = {
  [TeamColor.Blue]: { 
    bg: 'bg-[#2347C5]', 
    text: 'text-white', 
    hex: '#2347C5', 
    surface: 'var(--panel)', 
    border: '#2347C5',
    glow: 'rgba(35, 71, 197, 0.25)',
    name: 'Blue',
    faName: 'آبی'
  },
  [TeamColor.Red]: { 
    bg: 'bg-[#E0533C]', 
    text: 'text-white', 
    hex: '#E0533C', 
    surface: 'var(--panel)', 
    border: '#E0533C',
    glow: 'rgba(224, 83, 60, 0.25)',
    name: 'Red',
    faName: 'قرمز'
  },
  [TeamColor.Green]: { 
    bg: 'bg-[#12B5A4]', 
    text: 'text-white', 
    hex: '#12B5A4', 
    surface: 'var(--panel)', 
    border: '#12B5A4',
    glow: 'rgba(18, 181, 164, 0.25)',
    name: 'Green',
    faName: 'سبز'
  },
  [TeamColor.Yellow]: { 
    bg: 'bg-[#F5B52E]', 
    text: 'text-[#15204A]', 
    hex: '#F5B52E', 
    surface: 'var(--panel)', 
    border: '#F5B52E',
    glow: 'rgba(245, 181, 46, 0.25)',
    name: 'Yellow',
    faName: 'زرد'
  },
};

export const PLAYER_AVATARS = ['🦊', '🦁', '🐼', '🐨', '🐯', '🐰', '🐸', '🐵'];

export interface ArcadeAvatarMeta {
  emoji: string;
  nameFa: string;
  nameEn: string;
  badgeColor: string;
  glow: string;
}

export const ARCADE_CHARACTERS: ArcadeAvatarMeta[] = [
  { emoji: '🕹️', nameFa: 'دسته آرکید', nameEn: 'Retro Joystick', badgeColor: '#2347C5', glow: 'rgba(35, 71, 197, 0.4)' },
  { emoji: '👾', nameFa: 'مهاجم فضایی', nameEn: 'Space Invader', badgeColor: '#9333EA', glow: 'rgba(147, 51, 234, 0.4)' },
  { emoji: '🥷', nameFa: 'نینجا سایبری', nameEn: 'Cyber Ninja', badgeColor: '#E0533C', glow: 'rgba(224, 83, 60, 0.4)' },
  { emoji: '🤖', nameFa: 'ربات سایبورگ', nameEn: 'Cyborg Bot', badgeColor: '#00F0FF', glow: 'rgba(0, 240, 255, 0.4)' },
  { emoji: '⚡', nameFa: 'صاعقه نئونی', nameEn: 'Neon Bolt', badgeColor: '#FFE600', glow: 'rgba(255, 230, 0, 0.4)' },
  { emoji: '🐉', nameFa: 'اژدهای آتشین', nameEn: 'Fire Dragon', badgeColor: '#FF1058', glow: 'rgba(255, 16, 88, 0.4)' },
  { emoji: '🥊', nameFa: 'مشت‌زن آرکید', nameEn: 'Arcade Brawler', badgeColor: '#F97316', glow: 'rgba(249, 115, 22, 0.4)' },
  { emoji: '🛸', nameFa: 'سفینه کیهانی', nameEn: 'UFO Explorer', badgeColor: '#12B5A4', glow: 'rgba(18, 181, 164, 0.4)' },
  { emoji: '👑', nameFa: 'پادشاه پیکسل', nameEn: 'Pixel Monarch', badgeColor: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' },
  { emoji: '🦊', nameFa: 'روباه توربو', nameEn: 'Turbo Fox', badgeColor: '#EA580C', glow: 'rgba(234, 88, 12, 0.4)' },
  { emoji: '🦁', nameFa: 'شیر طلایی', nameEn: 'Golden Lion', badgeColor: '#EAB308', glow: 'rgba(234, 179, 8, 0.4)' },
  { emoji: '🐯', nameFa: 'ببر سرعتی', nameEn: 'Speed Tiger', badgeColor: '#D97706', glow: 'rgba(217, 119, 6, 0.4)' },
  { emoji: '🐼', nameFa: 'پاندای کونگ‌فو', nameEn: 'Kung-Fu Panda', badgeColor: '#64748B', glow: 'rgba(100, 116, 139, 0.4)' },
  { emoji: '🐰', nameFa: 'خرگوش جت', nameEn: 'Jet Bunny', badgeColor: '#EC4899', glow: 'rgba(236, 72, 153, 0.4)' },
  { emoji: '🐸', nameFa: 'قورباغه جهنده', nameEn: 'Super Frog', badgeColor: '#22C55E', glow: 'rgba(34, 197, 94, 0.4)' },
  { emoji: '🐱', nameFa: 'گربه نئون', nameEn: 'Neon Cat', badgeColor: '#A855F7', glow: 'rgba(168, 85, 247, 0.4)' }
];

export const ARCADE_AVATARS = ARCADE_CHARACTERS.map(c => c.emoji);

export const TEAM_HEX_COLORS: Record<TeamColor, string> = {
  [TeamColor.Blue]: '#2347C5',
  [TeamColor.Red]: '#E0533C',
  [TeamColor.Green]: '#12B5A4',
  [TeamColor.Yellow]: '#F5B52E',
};

// "Turn · Game night" Modern Color Palette (Based on HTML design)
export const UI_COLORS = {
  ink: '#15204A',              // text, borders
  paper: '#EEF3FA',            // background
  card: '#FFFFFF',             // surface cards
  lapis: '#2347C5',            // primary brand blue
  turq: '#12B5A4',             // turquoise accent
  saffron: '#F5B52E',          // saffron yellow accent
  line: '#DFE6F2',             // light borders
  orange: '#E0603F',           // primary, Team 1
  teal: '#1E9E93',             // correct, Team 2
  mustard: '#F2B63D',          // almost, points, Team 3
  darkBorder: '#1E1B2E',       // 2px ink outline
  cardBackground: '#FFFBF4',   // surface
  shockPink: '#E0603F',
  shockYellow: '#F2B63D',
  shockCyan: '#1E9E93',
  shockPurple: '#1E1B2E',
  deepIndigo: '#1E1B2E',
  neonLime: '#1E9E93',
  dangerRed: '#E0603F',
  goldAccent: '#F2B63D',
};

export type LanguageRegion = 'popular' | 'europe' | 'middle_east' | 'asia' | 'americas';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  persianName: string;
  flag: string;
  direction: 'rtl' | 'ltr';
  popular?: boolean;
  region: LanguageRegion;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  // Middle East & West Asia
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', persianName: 'فارسی', flag: '🇮🇷', direction: 'rtl', popular: true, region: 'middle_east', speechCode: 'fa-IR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', persianName: 'عربی', flag: '🇸🇦', direction: 'rtl', popular: true, region: 'middle_east', speechCode: 'ar-SA' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', persianName: 'ترکی استانبولی', flag: '🇹🇷', direction: 'ltr', popular: true, region: 'middle_east', speechCode: 'tr-TR' },
  { code: 'ku', name: 'Kurdish', nativeName: 'کوردی', persianName: 'کردی', flag: '☀️', direction: 'rtl', region: 'middle_east', speechCode: 'ckb-IQ' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', persianName: 'آذربایجانی', flag: '🇦🇿', direction: 'ltr', region: 'middle_east', speechCode: 'az-AZ' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', persianName: 'عبری', flag: '🇮🇱', direction: 'rtl', region: 'middle_east', speechCode: 'he-IL' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', persianName: 'ارمنی', flag: '🇦🇲', direction: 'ltr', region: 'middle_east', speechCode: 'hy-AM' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', persianName: 'گرجی', flag: '🇬🇪', direction: 'ltr', region: 'middle_east', speechCode: 'ka-GE' },

  // English
  { code: 'en-US', name: 'English (US)', nativeName: 'American English', persianName: 'انگلیسی آمریکایی', flag: '🇺🇸', direction: 'ltr', popular: true, region: 'americas', speechCode: 'en-US' },
  { code: 'en', name: 'English (UK)', nativeName: 'British English', persianName: 'انگلیسی بریتانیایی', flag: '🇬🇧', direction: 'ltr', popular: true, region: 'europe', speechCode: 'en-GB' },

  // Europe
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', persianName: 'هلندی', flag: '🇳🇱', direction: 'ltr', popular: true, region: 'europe', speechCode: 'nl-NL' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', persianName: 'آلمانی', flag: '🇩🇪', direction: 'ltr', popular: true, region: 'europe', speechCode: 'de-DE' },
  { code: 'fr', name: 'French', nativeName: 'Français', persianName: 'فرانسوی', flag: '🇫🇷', direction: 'ltr', popular: true, region: 'europe', speechCode: 'fr-FR' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', persianName: 'اسپانیایی', flag: '🇪🇸', direction: 'ltr', popular: true, region: 'europe', speechCode: 'es-ES' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', persianName: 'ایتالیایی', flag: '🇮🇹', direction: 'ltr', popular: true, region: 'europe', speechCode: 'it-IT' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', persianName: 'روسی', flag: '🇷🇺', direction: 'ltr', popular: true, region: 'europe', speechCode: 'ru-RU' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', persianName: 'پرتغالی', flag: '🇵🇹', direction: 'ltr', region: 'europe', speechCode: 'pt-PT' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', persianName: 'سوئدی', flag: '🇸🇪', direction: 'ltr', region: 'europe', speechCode: 'sv-SE' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', persianName: 'نروژی', flag: '🇳🇴', direction: 'ltr', region: 'europe', speechCode: 'nb-NO' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', persianName: 'دانمارکی', flag: '🇩🇰', direction: 'ltr', region: 'europe', speechCode: 'da-DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', persianName: 'فنلاندی', flag: '🇫🇮', direction: 'ltr', region: 'europe', speechCode: 'fi-FI' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', persianName: 'لهستانی', flag: '🇵🇱', direction: 'ltr', region: 'europe', speechCode: 'pl-PL' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', persianName: 'اوکراینی', flag: '🇺🇦', direction: 'ltr', region: 'europe', speechCode: 'uk-UA' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', persianName: 'یونانی', flag: '🇬🇷', direction: 'ltr', region: 'europe', speechCode: 'el-GR' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', persianName: 'چکی', flag: '🇨🇿', direction: 'ltr', region: 'europe', speechCode: 'cs-CZ' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', persianName: 'رومانیایی', flag: '🇷🇴', direction: 'ltr', region: 'europe', speechCode: 'ro-RO' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', persianName: 'مجارستانی', flag: '🇭🇺', direction: 'ltr', region: 'europe', speechCode: 'hu-HU' },

  // Asia
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', persianName: 'چینی', flag: '🇨🇳', direction: 'ltr', popular: true, region: 'asia', speechCode: 'zh-CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', persianName: 'ژاپنی', flag: '🇯🇵', direction: 'ltr', popular: true, region: 'asia', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', persianName: 'کره‌ای', flag: '🇰🇷', direction: 'ltr', popular: true, region: 'asia', speechCode: 'ko-KR' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', persianName: 'هندی', flag: '🇮🇳', direction: 'ltr', popular: true, region: 'asia', speechCode: 'hi-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', persianName: 'اردو', flag: '🇵🇰', direction: 'rtl', region: 'asia', speechCode: 'ur-PK' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', persianName: 'بنگالی', flag: '🇧🇩', direction: 'ltr', region: 'asia', speechCode: 'bn-BD' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', persianName: 'اندونزیایی', flag: '🇮🇩', direction: 'ltr', region: 'asia', speechCode: 'id-ID' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', persianName: 'مالایی', flag: '🇲🇾', direction: 'ltr', region: 'asia', speechCode: 'ms-MY' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', persianName: 'ویتنامی', flag: '🇻🇳', direction: 'ltr', region: 'asia', speechCode: 'vi-VN' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', persianName: 'تایلندی', flag: '🇹🇭', direction: 'ltr', region: 'asia', speechCode: 'th-TH' },
  { code: 'tl', name: 'Filipino', nativeName: 'Tagalog', persianName: 'فیلیپینی', flag: '🇵🇭', direction: 'ltr', region: 'asia', speechCode: 'fil-PH' }
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
