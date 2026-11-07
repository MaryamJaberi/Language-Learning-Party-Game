import { TeamColor, Language, CEFRLevel, GameSettings } from './types';

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

// DOŪR Language Party Game Modern Color Palette (Based on HTML design)
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
  { code: 'ru', name: 'Russian (Beta - Limited)', nativeName: 'Русский (Бета)', persianName: 'روسی (بتا — محتوای محدود)', flag: '🇷🇺', direction: 'ltr', popular: false, region: 'europe', speechCode: 'ru-RU' },
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

export function getCefrText(map: Record<string, string>, lang?: string): string {
  if (!map) return '';
  const raw = String(lang || 'en').trim();
  const normalized = raw === 'en-US' ? 'en' : raw;
  if (map[raw]) return map[raw];
  if (map[normalized]) return map[normalized];
  if (normalized === 'fa') return map.fa || map.en || '';
  return map.en || '';
}

export const CEFR_LEVELS: CEFRLevelInfo[] = [
  {
    id: 'Pre-A1',
    code: 'Pre-A1',
    name: {
      fa: 'پایه مقدماتی (Pre-A1)',
      en: 'Pre-A1',
      'en-US': 'Pre-A1',
      nl: 'Basis 0',
      de: 'Grundstufe 0',
      fr: 'Pré-A1',
      es: 'Inicial 0',
      it: 'Base 0',
      tr: 'Giriş 0',
      ar: 'مبتدئ تمهيدي',
      ru: 'Вводный 0'
    },
    desc: {
      fa: 'الفبا، اعداد، رنگ‌ها و پایه‌ای‌ترین کلمات ابتدایی',
      en: 'Alphabet, basic numbers, colors, and core foundational words',
      'en-US': 'Alphabet, basic numbers, colors, and core foundational words',
      nl: 'Alfabet, cijfers, kleuren en fundamentele basiswoorden',
      de: 'Alphabet, Zahlen, Farben und grundlegendste Wörter',
      fr: 'Alphabet, chiffres, couleurs et premiers mots de base',
      es: 'Alfabeto, números, colores y palabras fundamentales',
      it: 'Alfabeto, numeri, colori e prime parole fondamentali',
      tr: 'Alfabe, temel sayılar, renkler ve ilk temel kelimeler',
      ar: 'الحروف الأبجدية، الأرقام الأساسية، الألوان والكلمات التمهيدية الأولى',
      ru: 'Алфавит, цифры, цвета и фундаментальные первые слова'
    },
    example: {
      fa: 'مثال: سلام، بله، خیر، یک، دو',
      en: 'e.g. Hello, Yes, No, One, Two',
      'en-US': 'e.g. Hello, Yes, No, One, Two',
      nl: 'bijv. Hallo, Ja, Nee, Een, Twee',
      de: 'z. B. Hallo, Ja, Nein, Eins, Zwei',
      fr: 'ex. Bonjour, Oui, Non, Un, Deux',
      es: 'ej. Hola, Sí, No, Uno, Dos',
      it: 'es. Ciao, Sì, No, Uno, Due',
      tr: 'örn. Merhaba, Evet, Hayır, Bir, İki',
      ar: 'مثال: مرحباً، نعم، لا، واحد، اثنان',
      ru: 'напр. Привет, Да, Нет, Один, Два'
    },
    color: '#06B6D4',
    badge: 'Pre-A1'
  },
  {
    id: 'A0+',
    code: 'A0+',
    name: {
      fa: 'پایه پلاس',
      en: 'Pre-A1+',
      'en-US': 'Pre-A1+',
      nl: 'Basis 0+',
      de: 'Grundstufe 0+',
      fr: 'Pré-A1+',
      es: 'Inicial 0+',
      it: 'Base 0+',
      tr: 'Giriş 0+',
      ar: 'تمهيدي متقدم',
      ru: 'Вводный +'
    },
    desc: {
      fa: 'عبارات احوالپرسی کوتاه و اشیاء روزمره اولیه',
      en: 'Short greetings and essential first everyday objects',
      'en-US': 'Short greetings and essential first everyday objects',
      nl: 'Korte begroetingen en eerste alledaagse voorwerpen',
      de: 'Kurze Begrüßungen und erste Alltagsgegenstände',
      fr: 'Courtes salutations et premiers objets du quotidien',
      es: 'Saludos cortos y primeros objetos cotidianos',
      it: 'Brevi saluti e primi oggetti quotidiani',
      tr: 'Kısa selamlaşmalar ve ilk günlük nesneler',
      ar: 'تحيات قصيرة وأولى الأشياء اليومية الأساسية',
      ru: 'Короткие приветствия и первые бытовые предметы'
    },
    example: {
      fa: 'مثال: صبح بخیر، ممنون، آب لطفا',
      en: 'e.g. Good morning, Thank you, Water please',
      'en-US': 'e.g. Good morning, Thank you, Water please',
      nl: 'bijv. Goedemorgen, Dank je, Water alstublieft',
      de: 'z. B. Guten Morgen, Danke, Wasser bitte',
      fr: 'ex. Bonjour, Merci, De l’eau s’il vous plaît',
      es: 'ej. Buenos días, Gracias, Agua por favor',
      it: 'es. Buongiorno, Grazie, Acqua per favore',
      tr: 'örn. Günaydın, Teşekkürler, Su lütfen',
      ar: 'مثال: صباح الخير، شكراً، ماء من فضلك',
      ru: 'напр. Доброе утро, Спасибо, Воду пожалуйста'
    },
    color: '#10B981',
    badge: 'A0+'
  },
  {
    id: 'A1',
    code: 'A1',
    name: {
      fa: 'مبتدی',
      en: 'Beginner',
      'en-US': 'Beginner',
      nl: 'Beginner',
      de: 'Anfänger',
      fr: 'Débutant',
      es: 'Principiante',
      it: 'Principiante',
      tr: 'Başlangıç',
      ar: 'مبتدئ',
      ru: 'Начальный',
      pt: 'Iniciante',
      zh: '初学者',
      ja: '初級',
      ko: '초급',
      hi: 'शुरुआती',
      sv: 'Nybörjare',
      pl: 'Początkujący',
      uk: 'Початковий'
    },
    desc: { 
      fa: 'کلمات پایه، احوالپرسی و اصطلاحات روزمره بسیار ساده', 
      en: 'Basic words, greetings, and daily essentials',
      'en-US': 'Basic words, greetings, and daily essentials',
      nl: 'Basiswoorden, begroetingen en eenvoudige zinnen',
      de: 'Grundwörter, Begrüßungen und alltägliche Ausdrücke',
      fr: 'Mots de base, salutations et expressions du quotidien',
      es: 'Palabras básicas, saludos y frases cotidianas sencillas',
      it: 'Parole di base, saluti ed espressioni quotidiane semplici',
      tr: 'Temel kelimeler, selamlaşma ve günlük basit ifadeler',
      ar: 'كلمات أساسية، تحيات وعبارات يومية بسيطة جداً',
      ru: 'Базовые слова, приветствия и простые повседневные фразы'
    },
    example: {
      fa: 'مثال: آب، سلام، این چنده؟',
      en: 'e.g. Water, Hello, How much is this?',
      'en-US': 'e.g. Water, Hello, How much is this?',
      nl: 'bijv. Water, Hallo, Mag ik de rekening?',
      de: 'z. B. Wasser, Hallo, Wie viel kostet das?',
      fr: 'ex. Eau, Bonjour, Combien ça coûte ?',
      es: 'ej. Agua, Hola, ¿Cuánto cuesta esto?',
      it: 'es. Acqua, Ciao, Quanto costa?',
      tr: 'örn. Su, Merhaba, Bu ne kadar?',
      ar: 'مثال: ماء، مرحباً، بكم هذا؟',
      ru: 'напр. Вода, Привет, Сколько это стоит?'
    },
    color: '#22C55E',
    badge: 'A1'
  },
  {
    id: 'A1+',
    code: 'A1+',
    name: {
      fa: 'مبتدی پیشرفته',
      en: 'Beginner+',
      'en-US': 'Beginner+',
      nl: 'Beginner+',
      de: 'Anfänger+',
      fr: 'Débutant+',
      es: 'Principiante+',
      it: 'Principiante+',
      tr: 'Başlangıç+',
      ar: 'مبتدئ متقدم',
      ru: 'Начальный+'
    },
    desc: {
      fa: 'ترکیب جملات ساده، پرسش قیمت و ساعت و موقعیت مکانی',
      en: 'Combining basic sentences, asking price, time and location',
      'en-US': 'Combining basic sentences, asking price, time and location',
      nl: 'Eenvoudige zinnen combineren, prijs, tijd en richting vragen',
      de: 'Einfache Sätze verknüpfen, nach Preis, Uhrzeit und Ort fragen',
      fr: 'Combiner des phrases simples, demander l’heure, le prix et le lieu',
      es: 'Combinar oraciones sencillas, preguntar hora, precio y lugar',
      it: 'Combinare frasi semplici, chiedere l’ora, il prezzo e il luogo',
      tr: 'Basit cümleleri bağlama, saat, fiyat ve yer sorma',
      ar: 'تركيب جمل بسيطة، السؤال عن الوقت والسعر والاتجاه',
      ru: 'Связывание простых предложений, запрос времени, цены и дороги'
    },
    example: {
      fa: 'مثال: ساعت چنده؟ من اهل تهران هستم',
      en: 'e.g. What time is it? I am from London',
      'en-US': 'e.g. What time is it? I am from London',
      nl: 'bijv. Hoe laat is het? Ik kom uit Amsterdam',
      de: 'z. B. Wie spät ist es? Ich komme aus Berlin',
      fr: 'ex. Quelle heure est-il ? Je viens de Paris',
      es: 'ej. ¿Qué hora es? Soy de Madrid',
      it: 'es. Che ora è? Vengo da Roma',
      tr: 'örn. Saat kaç? Ben İstanbul’danım',
      ar: 'مثال: كم الساعة؟ أنا من دبي',
      ru: 'напр. Который час? Я из Москвы'
    },
    color: '#84CC16',
    badge: 'A1+'
  },
  {
    id: 'A2',
    code: 'A2',
    name: {
      fa: 'مقدماتی',
      en: 'Elementary',
      'en-US': 'Elementary',
      nl: 'Elementair',
      de: 'Grundlagen',
      fr: 'Élémentaire',
      es: 'Elemental',
      it: 'Elementare',
      tr: 'Temel',
      ar: 'أساسي',
      ru: 'Базовый',
      pt: 'Elementar',
      zh: '基础',
      ja: '初中級',
      ko: '초중급',
      hi: 'प्राथमिक',
      sv: 'Grundläggande',
      pl: 'Podstawowy',
      uk: 'Елементарний'
    },
    desc: { 
      fa: 'جملات کوتاه در رستوران، خرید، مسیر و احوالپرسی', 
      en: 'Short phrases in restaurants, shopping, and directions',
      'en-US': 'Short phrases in restaurants, shopping, and directions',
      nl: 'Korte zinnen in restaurants, winkelen en route',
      de: 'Kurze Sätze im Restaurant, beim Einkaufen und nach dem Weg fragen',
      fr: 'Phrases courtes au restaurant, courses et directions',
      es: 'Frases cortas en restaurantes, compras y direcciones',
      it: 'Frasi brevi al ristorante, acquisti e indicazioni',
      tr: 'Restoran, alışveriş ve yön sorma için kısa cümleler',
      ar: 'جمل قصيرة في المطعم، التسوق، الاتجاهات والتحية',
      ru: 'Короткие фразы в ресторане, магазине и при поиске дороги'
    },
    example: {
      fa: 'مثال: میز برای ۲ نفر، ایستگاه کجاست؟',
      en: 'e.g. Table for two, Where is the station?',
      'en-US': 'e.g. Table for two, Where is the station?',
      nl: 'bijv. Een tafel voor twee, Waar is het station?',
      de: 'z. B. Ein Tisch für zwei, Wo ist der Bahnhof?',
      fr: 'ex. Une table pour deux, Où est la gare ?',
      es: 'ej. Mesa para dos, ¿Dónde está la estación?',
      it: 'es. Tavolo per due, Dov’è la stazione?',
      tr: 'örn. İki kişilik masa, İstasyon nerede?',
      ar: 'مثال: طاولة لشخصين، أين المحطة؟',
      ru: 'напр. Столик на двоих, Где находится вокзал?'
    },
    color: '#EAB308',
    badge: 'A2'
  },
  {
    id: 'A2+',
    code: 'A2+',
    name: {
      fa: 'مقدماتی پیشرفته',
      en: 'Elementary+',
      'en-US': 'Elementary+',
      nl: 'Elementair+',
      de: 'Grundlagen+',
      fr: 'Élémentaire+',
      es: 'Elemental+',
      it: 'Elementare+',
      tr: 'Temel+',
      ar: 'أساسي متقدم',
      ru: 'Базовый+'
    },
    desc: {
      fa: 'توضیح علایق، برنامه‌های آینده، خرید و تعاملات سفر',
      en: 'Describing hobbies, future plans, shopping and travel interactions',
      'en-US': 'Describing hobbies, future plans, shopping and travel interactions',
      nl: 'Hobby’s beschrijven, toekomstplannen en reizen',
      de: 'Hobbys beschreiben, Zukunftspläne und Reiseinteraktionen',
      fr: 'Décrire ses loisirs, projets futurs et interactions de voyage',
      es: 'Describir pasatiempos, planes futuros e interacciones de viaje',
      it: 'Descrivere hobby, piani futuri e interazioni di viaggio',
      tr: 'Hobileri, gelecek planlarını anlatma ve seyahat etkileşimi',
      ar: 'وصف الهوايات، الخطط المستقبلية والتفاعل أثناء السفر',
      ru: 'Описание хобби, планов на будущее и общение в поездках'
    },
    example: {
      fa: 'مثال: فردا می‌خواهم به موزه بروم',
      en: 'e.g. Tomorrow I want to visit the museum',
      'en-US': 'e.g. Tomorrow I want to visit the museum',
      nl: 'bijv. Morgen wil ik naar het museum gaan',
      de: 'z. B. Morgen möchte ich ins Museum gehen',
      fr: 'ex. Demain, je veux visiter le musée',
      es: 'ej. Mañana quiero visitar el museo',
      it: 'es. Domani voglio visitare il museo',
      tr: 'örn. Yarın müzeyi ziyaret etmek istiyorum',
      ar: 'مثال: غداً أريد زيارة المتحف',
      ru: 'напр. Завтра я хочу посетить музей'
    },
    color: '#F59E0B',
    badge: 'A2+'
  },
  {
    id: 'B1',
    code: 'B1',
    name: {
      fa: 'متوسط',
      en: 'Intermediate',
      'en-US': 'Intermediate',
      nl: 'Gevorderd',
      de: 'Mittelstufe',
      fr: 'Intermédiaire',
      es: 'Intermedio',
      it: 'Intermedio',
      tr: 'Orta',
      ar: 'متوسط',
      ru: 'Средний',
      pt: 'Intermediário',
      zh: '中级',
      ja: '中級',
      ko: '중급',
      hi: 'मध्यम',
      sv: 'Medel',
      pl: 'Średniozaawansowany',
      uk: 'Середній'
    },
    desc: { 
      fa: 'مکالمات کاری، سفر، احساسات و بیان نظر شخصی', 
      en: 'Conversations at work, travel, and personal opinions',
      'en-US': 'Conversations at work, travel, and personal opinions',
      nl: 'Gesprekken op werk, reizen en meningen uiten',
      de: 'Gespräche bei der Arbeit, auf Reisen und eigene Meinungen',
      fr: 'Conversations au travail, voyages et opinions personnelles',
      es: 'Conversaciones en el trabajo, viajes y opiniones personales',
      it: 'Conversazioni di lavoro, viaggi e opinioni personali',
      tr: 'İş konuşmaları, seyahat, duygular ve kişisel görüşler',
      ar: 'محادثات العمل، السفر، المشاعر والتعبير عن الرأي الشخصي',
      ru: 'Разговоры на работе, в путешествиях и выражение своего мнения'
    },
    example: {
      fa: 'مثال: قرار ملاقات، مصاحبه، شرح خاطره',
      en: 'e.g. Meeting setup, Interview, Storytelling',
      'en-US': 'e.g. Meeting setup, Interview, Storytelling',
      nl: 'bijv. Afspraak maken, Sollicitatiegesprek',
      de: 'z. B. Termin vereinbaren, Vorstellungsgespräch',
      fr: 'ex. Prendre rendez-vous, Entretien, Raconter une histoire',
      es: 'ej. Concertar cita, Entrevista, Contar una experiencia',
      it: 'es. Fissare un incontro, Colloquio, Raccontare un’esperienza',
      tr: 'örn. Toplantı ayarlama, Mülakat, Anı anlatma',
      ar: 'مثال: تحديد موعد، مقابلة عمل، سرد تجربة',
      ru: 'напр. Назначение встречи, Собеседование, Рассказ о событии'
    },
    color: '#06B6D4',
    badge: 'B1'
  },
  {
    id: 'B1+',
    code: 'B1+',
    name: {
      fa: 'متوسط پیشرفته',
      en: 'Intermediate+',
      'en-US': 'Intermediate+',
      nl: 'Gevorderd+',
      de: 'Mittelstufe+',
      fr: 'Intermédiaire+',
      es: 'Intermedio+',
      it: 'Intermedio+',
      tr: 'Orta+',
      ar: 'متوسط متقدم',
      ru: 'Средний+'
    },
    desc: {
      fa: 'بحث درباره دلایل، مقایسه راهکارها، حل مشکلات روزمره کاری',
      en: 'Giving detailed reasons, comparing solutions, workplace problem solving',
      'en-US': 'Giving detailed reasons, comparing solutions, workplace problem solving',
      nl: 'Redenen geven, opties vergelijken en problemen op het werk oplossen',
      de: 'Gründe darlegen, Lösungen vergleichen, Probleme am Arbeitsplatz lösen',
      fr: 'Donner des raisons, comparer des solutions, résoudre des problèmes au travail',
      es: 'Dar razones detalladas, comparar soluciones y resolver problemas laborales',
      it: 'Fornire motivazioni dettagliate, confrontare opzioni e risolvere problemi di lavoro',
      tr: 'Detaylı gerekçe sunma, seçenekleri kıyaslama ve iş sorunlarını çözme',
      ar: 'إبداء الأسباب بالتفصيل، مقارنة الحلول وحل مشكلات العمل',
      ru: 'Обоснование мнения, сравнение вариантов и решение рабочих вопросов'
    },
    example: {
      fa: 'مثال: به نظر من این ایده مزایای بیشتری دارد',
      en: 'e.g. In my opinion this approach offers clearer advantages',
      'en-US': 'e.g. In my opinion this approach offers clearer advantages',
      nl: 'bijv. Naar mijn mening heeft deze aanpak duidelijkere voordelen',
      de: 'z. B. Meiner Ansicht nach bietet dieser Ansatz mehr Vorteile',
      fr: 'ex. À mon avis, cette approche offre de nets avantages',
      es: 'ej. En mi opinión, este enfoque tiene mayores ventajas',
      it: 'es. A mio parere, questo approccio offre vantaggi più evidenti',
      tr: 'örn. Bence bu yaklaşımın çok daha belirgin avantajları var',
      ar: 'مثال: في رأيي يقدم هذا النهج مزايا أكثر وضوحاً',
      ru: 'напр. На мой взгляд, этот подход даёт больше преимуществ'
    },
    color: '#3B82F6',
    badge: 'B1+'
  },
  {
    id: 'B2',
    code: 'B2',
    name: {
      fa: 'فرامتوسط',
      en: 'Upper-Int',
      'en-US': 'Upper-Int',
      nl: 'Boven-Gemiddeld',
      de: 'Gehoben',
      fr: 'Avancé-Int',
      es: 'Intermedio-Alto',
      it: 'Intermedio-Alto',
      tr: 'Orta-Üst',
      ar: 'فوق المتوسط',
      ru: 'Выше среднего',
      pt: 'Pós-Interm.',
      zh: '中高级',
      ja: '中上級',
      ko: '중고급',
      hi: 'उच्च-मध्यम',
      sv: 'Övre medel',
      pl: 'Wyżej średni',
      uk: 'Вище середнього'
    },
    desc: { 
      fa: 'واژگان غنی‌تر، اصطلاحات کاربردی و تقویت روان‌زبانی', 
      en: 'Extended vocabulary, practical idioms, and fluency building',
      'en-US': 'Extended vocabulary, practical idioms, and fluency building',
      nl: 'Uitgebreide woordenschat en praktische idiomen',
      de: 'Erweiterter Wortschatz, Redewendungen und flüssiges Sprechen',
      fr: 'Vocabulaire enrichi, expressions idiomatiques et fluidité',
      es: 'Vocabulario amplio, modismos prácticos y fluidez',
      it: 'Vocabolario amplio, modi di dire pratici e fluidità',
      tr: 'Zengin kelime dağarcığı, deyimler ve akıcı konuşma',
      ar: 'مفردات أغنى، تعبيرات اصطلاحية عملية وبناء الطلاقة',
      ru: 'Расширенный словарный запас, практичные идиомы и беглость'
    },
    example: {
      fa: 'مثال: قرارداد کاری، مذاکره، بحث روزمره',
      en: 'e.g. Contract, Negotiation, Everyday debate',
      'en-US': 'e.g. Contract, Negotiation, Everyday debate',
      nl: 'bijv. Onderhandelen, Werkcontract bespreken',
      de: 'z. B. Arbeitsvertrag, Verhandlung, Diskussion',
      fr: 'ex. Contrat, Négociation, Débat quotidien',
      es: 'ej. Contrato, Negociación, Debate cotidiano',
      it: 'es. Contratto, Negoziazione, Dibattito cotidiano',
      tr: 'örn. İş sözleşmesi, Müzakere, Günlük tartışma',
      ar: 'مثال: عقد عمل، تفاوض، نقاش يومي',
      ru: 'напр. Трудовой договор, Переговоры, Повседневный спор'
    },
    color: '#6366F1',
    badge: 'B2'
  },
  {
    id: 'B2+',
    code: 'B2+',
    name: {
      fa: 'فرامتوسط پیشرفته',
      en: 'Upper-Int+',
      'en-US': 'Upper-Int+',
      nl: 'Boven-Gemiddeld+',
      de: 'Gehoben+',
      fr: 'Avancé-Int+',
      es: 'Intermedio-Alto+',
      it: 'Intermedio-Alto+',
      tr: 'Orta-Üst+',
      ar: 'فوق المتوسط+',
      ru: 'Выше среднего+'
    },
    desc: {
      fa: 'مذاکرات جدی، استدلال منطقی و تسلط بر کنایه‌ها و کنایات حرفه‌ای',
      en: 'Professional negotiations, analytical reasoning, and nuanced expressions',
      'en-US': 'Professional negotiations, analytical reasoning, and nuanced expressions',
      nl: 'Professionele onderhandelingen en genuanceerde expressie',
      de: 'Professionelle Verhandlungen, analytische Argumentation und Nuancen',
      fr: 'Négociations professionnelles, raisonnement analytique et nuances',
      es: 'Negociaciones profesionales, argumentación analítica y matices',
      it: 'Negoziazioni professionali, ragionamento analitico e sfumature',
      tr: 'Profesyonel müzakereler, analitik düşünme ve incelikli ifadeler',
      ar: 'مفاوضات مهنية، استدلال تحليلي وتعبيرات دقيقة',
      ru: 'Профессиональные переговоры, аналитическое мышление и нюансы'
    },
    example: {
      fa: 'مثال: باید ریسک‌های جانبی این طرح را ارزیابی کنیم',
      en: 'e.g. We need to evaluate the collateral implications of this plan',
      'en-US': 'e.g. We need to evaluate the collateral implications of this plan',
      nl: 'bijv. We moeten de neveneffecten van dit plan evalueren',
      de: 'z. B. Wir müssen die Begleitwirkungen dieses Plans evaluieren',
      fr: 'ex. Nous devons évaluer les implications collatérales de ce plan',
      es: 'ej. Debemos evaluar las implicaciones colaterales de este plan',
      it: 'es. Dobbiamo valutare le implicazioni collaterali di questo piano',
      tr: 'örn. Bu planın yan etkilerini dikkatlice değerlendirmeliyiz',
      ar: 'مثال: يجب أن نقيّم الآثار الجانبية والمترتبة على هذه الخطة',
      ru: 'напр. Нам необходимо оценить сопутствующие последствия этого плана'
    },
    color: '#8B5CF6',
    badge: 'B2+'
  },
  {
    id: 'C1',
    code: 'C1',
    name: {
      fa: 'پیشرفته',
      en: 'Advanced',
      'en-US': 'Advanced',
      nl: 'Vergevorderd',
      de: 'Fortgeschritten',
      fr: 'Avancé',
      es: 'Avanzado',
      it: 'Avanzato',
      tr: 'İleri',
      ar: 'متقدم',
      ru: 'Продвинутый',
      pt: 'Avançado',
      zh: '高级',
      ja: '上級',
      ko: '고급',
      hi: 'उन्नत',
      sv: 'Avancerad',
      pl: 'Zaawansowany',
      uk: 'Просунутий'
    },
    desc: { 
      fa: 'اصطلاحات عامیانه عمیق، شوخی‌ها، ضرب‌المثل‌ها و مفاهیم پیچیده', 
      en: 'Native nuances, humor, proverbs, and complex themes',
      'en-US': 'Native nuances, humor, proverbs, and complex themes',
      nl: 'Diepe nuances, humor, spreekwoorden en complexe ideeën',
      de: 'Muttersprachliche Nuancen, Humor, Sprichwörter und komplexe Themen',
      fr: 'Nuances natives, humour, proverbes et thèmes complexes',
      es: 'Matices nativos, humor, proverbios y temas complejos',
      it: 'Sfumature madrelingua, umorismo, proverbi e temi complessi',
      tr: 'Derin deyimler, mizah, atasözleri ve karmaşık kavramlar',
      ar: 'تعبيرات عميقة، فكاهة، أمثال ومفاهيم معقدة',
      ru: 'Тонкие нюансы, юмор, пословицы и сложные темы'
    },
    example: {
      fa: 'مثال: ضرب‌المثل‌های اصیل، استعاره‌ها',
      en: 'e.g. Subtle idioms, cultural metaphors',
      'en-US': 'e.g. Subtle idioms, cultural metaphors',
      nl: 'bijv. Spreekwoorden en culturele metaforen',
      de: 'z. B. Feine Redewendungen, kulturelle Metaphern',
      fr: 'ex. Expressions subtiles, métaphores culturelles',
      es: 'ej. Modismos sutiles, metáforas culturales',
      it: 'es. Modi di dire sottili, metafore culturali',
      tr: 'örn. İnce deyimler, kültürel metaforlar',
      ar: 'مثال: أمثال أصيلة، استعارات ثقافية',
      ru: 'напр. Тонкие идиомы, культурные метафоры'
    },
    color: '#A855F7',
    badge: 'C1'
  },
  {
    id: 'C1+',
    code: 'C1+',
    name: {
      fa: 'پیشرفته پلاس',
      en: 'Advanced+',
      'en-US': 'Advanced+',
      nl: 'Vergevorderd+',
      de: 'Fortgeschritten+',
      fr: 'Avancé+',
      es: 'Avanzado+',
      it: 'Avanzato+',
      tr: 'İleri+',
      ar: 'متقدم متمكن',
      ru: 'Продвинутый+'
    },
    desc: {
      fa: 'تسلط کلامی بالا، استعاره‌های ادبی، طنز کلامی و اصطلاحات کوچه بازاری غنی',
      en: 'High rhetorical fluency, literary metaphors, witty banter, and rich slang',
      'en-US': 'High rhetorical fluency, literary metaphors, witty banter, and rich slang',
      nl: 'Hoge retorische vloeiendheid, literaire metaforen en rijke spreektaal',
      de: 'Hohe rhetorische Gewandtheit, literarische Metaphern und Alltagsslang',
      fr: 'Grande éloquence, métaphores littéraires, esprit et argot authentique',
      es: 'Gran elocuencia, metáforas literarias, agudeza verbal y jerga viva',
      it: 'Grande padronanza retorica, metafore letterarie, ironia e gergo autentico',
      tr: 'Yüksek retorik akıcılık, edebi metaforlar, nüktedanlık ve zengin sokak dili',
      ar: 'فصاحة وبلاغة خطابية، استعارات أدبية وتعبيرات دارجة عميقة',
      ru: 'Высокое ораторское мастерство, литературные метафоры и сочный сленг'
    },
    example: {
      fa: 'مثال: کنایه‌های رندانه، استدلال در سطح دانشگاهی و ادبی',
      en: 'e.g. Academic discourse, subtle irony, and rhetorical balance',
      'en-US': 'e.g. Academic discourse, subtle irony, and rhetorical balance',
      nl: 'bijv. Academisch discours en verfijnde ironie',
      de: 'z. B. Akademischer Diskurs, feine Ironie und rhetorische Eleganz',
      fr: 'ex. Discours académique, ironie subtile et équilibre rhétorique',
      es: 'ej. Discurso académico, fina ironía y equilibrio retórico',
      it: 'es. Discorso accademico, sottile ironia ed eleganza retorica',
      tr: 'örn. Akademik söylem, ince hiciv ve retorik denge',
      ar: 'مثال: الخطاب الأكاديمي، السخرية اللطيفة والتوازن البلاغي',
      ru: 'напр. Академический дискурс, тонкая ирония и риторический баланс'
    },
    color: '#D946EF',
    badge: 'C1+'
  },
  {
    id: 'C2',
    code: 'C2',
    name: {
      fa: 'تسلط کامل بومی',
      en: 'Mastery / Native',
      'en-US': 'Mastery / Native',
      nl: 'Volledige Beheersing',
      de: 'Muttersprachlich',
      fr: 'Maîtrise bilingue',
      es: 'Maestría / Nativo',
      it: 'Padronanza madrelingua',
      tr: 'Anadil Düzeyi',
      ar: 'إتقان تام (أصلي)',
      ru: 'В совершенстве'
    },
    desc: {
      fa: 'درک بی‌درنگ، طنزهای فرهنگی پیچیده و تسلط هم‌تراز با گویشور بومی فرهیخته',
      en: 'Effortless spontaneous understanding, complex cultural wit, educated native mastery',
      'en-US': 'Effortless spontaneous understanding, complex cultural wit, educated native mastery',
      nl: 'Moeiteloze spontane beheersing, culturele finesses op moedertaalniveau',
      de: 'Müheloses spontanes Verstehen, komplexe kulturelle Witze auf muttersprachlichem Niveau',
      fr: 'Compréhension spontanée sans effort, subtilités culturelles de locuteur natif',
      es: 'Comprensión espontánea sin esfuerzo, ingenio cultural al nivel de un nativo culto',
      it: 'Comprensione spontanea senza sforzo, finezze culturali a livello madrelingua',
      tr: 'Zahmetsiz akıcılık, derin kültürel nükte ve ana dil yetkinliği',
      ar: 'فهم تلقائي دون أي جهد، مفارقات ثقافية معقدة ومستوى المتحدث الأصلي',
      ru: 'Спонтанное свободное понимание, тонкий культурный юмор на уровне носителя'
    },
    example: {
      fa: 'مثال: مناظرات پیچیده حقوقی، اصطلاحات تاریخی و ظرایف فرهنگی خاص',
      en: 'e.g. Nuanced legal debates, historical idioms, spontaneous wit',
      'en-US': 'e.g. Nuanced legal debates, historical idioms, spontaneous wit',
      nl: 'bijv. Complexe juridische debatten en historische uitdrukkingen',
      de: 'z. B. Juristische Debatten, historische Redewendungen, spontane Schlagfertigkeit',
      fr: 'ex. Débats juridiques complexes, expressions historiques et esprit spontané',
      es: 'ej. Debates jurídicos complejos, giros históricos y agudeza espontánea',
      it: 'es. Dibattiti giuridici complessi, modi di dire storici e prontezza di spirito',
      tr: 'örn. Karmaşık hukuki münazaralar, tarihi deyimler ve anında hazırcevaplık',
      ar: 'مثال: مناظرات قانونية دقيقة، أمثال تاريخية وبديهة لغوية فورية',
      ru: 'напр. Сложные юридические дебаты, исторические фразеологизмы и остроумие'
    },
    color: '#EC4899',
    badge: 'C2'
  }
];

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

// System Admin Configuration (Authorized Admin for APK/AAB Downloads & Management)
export const ADMIN_EMAILS: string[] = ['m.jaberi1212@gmail.com'];

export const isAdminUser = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

export const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 4,
  roundsCount: 3,
  roundDuration: 60,
  difficulty: 'easy',
  cefrLevel: 'A1',
  nativeLanguage: 'fa',
  targetLanguages: ['en-US', 'nl'],
  cardGameMode: 'mixed',
  autoPronounceOnCorrect: true,
  selectedCategories: [
    "CAT_EVERYDAY",
    "CAT_RESTAURANT",
    "CAT_FOOD",
    "CAT_TRAVEL",
    "CAT_SHOPPING",
    "CAT_WORK",
    "CAT_SMALLTALK"
  ],
  playerNames: ['آرش', 'سارا', 'کیان', 'مریم', 'سامان', 'پریا', 'بردیا', 'نیکا'],
  language: 'fa',
  passPhoneScreenEnabled: false,
  soundEnabled: true,
  powerCardsEnabled: true,
  cardRevealEnabled: true
};



