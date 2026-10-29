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
    color: '#39FF14',
    badge: 'A1'
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
    color: '#FFE600',
    badge: 'A2'
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
    color: '#00F0FF',
    badge: 'B1'
  },
  {
    id: 'B2',
    code: 'B2',
    name: {
      fa: 'فرامتوسط',
      en: 'Upper-Int',
      'en-US': 'Upper-Int',
      nl: 'Gevorderd+',
      de: 'Gehoben',
      fr: 'Avancé-Int',
      es: 'Intermedio+',
      it: 'Intermedio+',
      tr: 'Orta-Üst',
      ar: 'فوق المتوسط',
      ru: 'Выше среднего',
      pt: 'Pós-Interm.',
      zh: '中高级',
      ja: '中上級',
      ko: '중고급',
      hi: 'उच्च-मध्यम',
      sv: 'Övre medel',
      pl: 'Выżej średni',
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
      it: 'Vocabolario ampio, modi di dire pratici e fluidità',
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
      it: 'es. Contratto, Negoziazione, Dibattito quotidiano',
      tr: 'örn. İş sözleşmesi, Müzakere, Günlük tartışma',
      ar: 'مثال: عقد عمل، تفاوض، نقاش يومي',
      ru: 'напр. Трудовой договор, Переговоры, Повседневный спор'
    },
    color: '#FF007F',
    badge: 'B2'
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
    color: '#7B2CBF',
    badge: 'C1'
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



