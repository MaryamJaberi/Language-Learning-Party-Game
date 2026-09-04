import { Language } from './types';

export const CARTOON_CHARACTERS: Record<string, string[]> = {
  fa: [
    'کلاه‌قرمزی',
    'پسرخاله',
    'باب اسفنجی',
    'پاتریک',
    'سوباسا',
    'شرک',
    'وودی',
    'پاندای کونگ‌فوکار',
    'میتی‌کومان',
    'زورو',
    'شازده کوچولو',
    'سندباد',
    'تام',
    'جری',
    'پلنگ صورتی',
    'پینوکیو'
  ],
  en: [
    'SpongeBob',
    'Patrick',
    'Shrek',
    'Woody',
    'Buzz Lightyear',
    'Batman',
    'Pikachu',
    'Mario',
    'Luigi',
    'Sonic',
    'Simba',
    'Scooby-Doo',
    'Garfield',
    'Pooh Bear',
    'Nemo',
    'Aladdin'
  ],
  nl: [
    'Nijntje',
    'SpongeBob',
    'Buurman',
    'Donald Duck',
    'Kuifje',
    'Patrick',
    'Shrek',
    'Woody',
    'Lucky Luke',
    'Pikachu',
    'Mario',
    'Asterix'
  ],
  de: [
    'Pumuckl',
    'SpongeBob',
    'Asterix',
    'Obelix',
    'Biene Maja',
    'Patrick',
    'Shrek',
    'Woody',
    'Pikachu',
    'Tabaluga',
    'Mario',
    'Käptn Blaubär'
  ],
  fr: [
    'Tintin',
    'Astérix',
    'Obélix',
    'Spirou',
    'Bob l\'éponge',
    'Patrick',
    'Woody',
    'Shrek',
    'Pikachu',
    'Gaston Lagaffe',
    'Lucky Luke',
    'Mario'
  ],
  ar: [
    'سبونج بوب',
    'باتريك',
    'عدنان',
    'لينا',
    'غراندايزر',
    'سندباد',
    'شرك',
    'ماجد',
    'وودي',
    'توم',
    'جيري',
    'بسيط'
  ],
  es: [
    'Bob Esponja',
    'Patricio',
    'Shrek',
    'Woody',
    'Pikachu',
    'Mario',
    'El Chavo',
    'Zorro',
    'Goku',
    'Simba'
  ],
  tr: [
    'Sünger Bob',
    'Patrick',
    'Keloglan',
    'Nasreddin',
    'Shrek',
    'Woody',
    'Pikachu',
    'Tom',
    'Jerry',
    'Baris'
  ]
};

export function getRandomCharacters(lang: Language | string = 'fa', count: number = 8): string[] {
  const normLang = (lang === 'en-US' ? 'en' : lang) || 'fa';
  const pool = CARTOON_CHARACTERS[normLang] || CARTOON_CHARACTERS.fa || CARTOON_CHARACTERS.en;
  
  // Shuffle array using Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // If count exceeds pool length, generate numbered duplicates
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}
