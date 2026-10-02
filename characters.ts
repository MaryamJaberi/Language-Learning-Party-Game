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
    'Aladdin',
    'Mickey Mouse',
    'Donald Duck',
    'Homer Simpson',
    'Bugs Bunny'
  ],
  'en-US': [
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
    'Aladdin',
    'Mickey Mouse',
    'Donald Duck',
    'Homer Simpson',
    'Bugs Bunny'
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
  ],
  it: ['Topolino', 'Pinocchio', 'Calimero', 'Geronimo', 'Dylan Dog', 'Woody', 'Goku', 'Simba', 'Lupo Alberto', 'Pikachu'],
  ru: ['Чебурашка', 'Гена', 'Винни-Пух', 'Матроскин', 'Волк', 'Заяц', 'Карлсон', 'Незнайка', 'Кеша', 'Шарик'],
  pt: ['Mônica', 'Cebolinha', 'Cascão', 'Magali', 'Bob Esponja', 'Zé Carioca', 'Woody', 'Shrek', 'Pikachu', 'Goku'],
  zh: ['孙悟空', '哪吒', '葫芦娃', '黑猫警长', '大头儿子', '哆啦A梦', '皮卡丘', '喜羊羊', '光头强', '熊二'],
  ja: ['ドラえもん', 'ピカチュウ', 'アンパンマン', '悟空', 'ナルト', 'ルフィ', 'トトロ', 'コナン', 'マリオ', 'ソニック'],
  ko: ['뽀로로', '둘리', '타요', '펭수', '라바', '피카츄', '짱구', '폴리', '라이언', '어피치'],
  hi: ['छोटा भीम', 'मोटू', 'पतलू', 'शक्तिमान', 'कृष्णा', 'डोरेमोन', 'मोगली', 'चाचा चौधरी', 'साबू', 'पिकाचू'],
  pl: ['Bolek', 'Lolek', 'Reksio', 'Koziołek', 'Miś Uszatek', 'SpongeBob', 'Kajko', 'Kokosz', 'Pikachu', 'Shrek'],
  uk: ['Котигорошко', 'Капітошка', 'Грай', 'Око', 'Тур', 'Губка Боб', 'Мавка', 'Патрон', 'Вуді', 'Шрек'],
  sv: ['Pippi', 'Emil', 'Bamse', 'Karlsson', 'Mumin', 'Lillebror', 'Ronja', 'Alfons', 'SpongeBob', 'Woody'],
  no: ['Flåklypa', 'Solan', 'Ludvig', 'Pelle Politibil', 'Mormor', 'Karius', 'Baktus', 'Kaptein Sabeltann', 'SpongeBob', 'Shrek'],
  da: ['Rasmus Klump', 'Kaj', 'Andrea', 'Bamse', 'Kylling', 'Tintin', 'SpongeBob', 'Woody', 'Shrek', 'Pikachu'],
  fi: ['Muumipeikko', 'Nuuskamuikkunen', 'Pikku Myy', 'Nipsu', 'Rölli', 'Uppo-Nalle', 'SpongeBob', 'Shrek', 'Woody', 'Pikachu'],
  el: ['Καραγκιόζης', 'Χατζηαβάτης', 'Ηρακλής', 'Οδυσσέας', 'Σπογγομπάκης', 'Σρεκ', 'Γούντι', 'Πικάτσου', 'Μάριο', 'Σίμπα'],
  cs: ['Krtek', 'Křemílek', 'Vochomůrka', 'Rákosníček', 'Spejbl', 'Hurvínek', 'Bob', 'Bobek', 'SpongeBob', 'Pikachu'],
  ro: ['Guguță', 'Păcală', 'Tândală', 'Mihaela', 'SpongeBob', 'Woody', 'Shrek', 'Pikachu', 'Mario', 'Simba'],
  hu: ['Vuk', 'Mézga Géza', 'Frakk', 'Pom Pom', 'Kukori', 'Kotkoda', 'Süsü', 'SpongeBob', 'Woody', 'Shrek'],
  id: ['Si Unyil', 'Si Huma', 'Petruk', 'Gareng', 'SpongeBob', 'Upin', 'Ipin', 'Boboiboy', 'Pikachu', 'Doraemon'],
  ms: ['Upin', 'Ipin', 'BoBoiBoy', 'Keluarga Somat', 'SpongeBob', 'Ejen Ali', 'Pikachu', 'Doraemon', 'Woody', 'Shrek'],
  vi: ['Trạng Tí', 'Doraemon', 'Nobita', 'Songoku', 'Conan', 'Pikachu', 'SpongeBob', 'Woody', 'Shrek', 'Mario'],
  th: ['ปังปอนด์', 'หนูหิ่น', 'จอมขมังเวทย์', 'โดราเอมอน', 'ชินจัง', 'ปิกาจู', 'สพันจ์บ็อบ', 'วู้ดดี้', 'เชร็ค', 'มาริโอ้'],
  ur: ['عمرو عیار', 'عینک والا جن', 'چندا ماما', 'موٹو', 'پتلو', 'ڈوریمون', 'سپنج باب', 'شیر خان', 'ٹام', 'جیری'],
  ku: ['ڕەوەند', 'کاکە حەمە', 'شێرکۆ', 'زانا', 'سپۆنج بۆب', 'شڕێک', 'تۆم', 'جێری', 'پیکاتشۆ', 'سیمبا'],
  az: ['Cırtdan', 'Tıq-tıq xanım', 'Məlikməmməd', 'Keçəl', 'Kosa', 'SpongeBob', 'Shrek', 'Woody', 'Pikachu', 'Simba'],
  he: ['קישקשתא', 'פרפר נחמד', 'בץ', 'עוזה', 'פינגי', 'שאלתיאל', 'בובספוג', 'שרק', 'פיקאצ׳ו', 'וודי'],
  hy: ['Պույ-պույ', 'Նազար', 'Քաջ Նազար', 'Սասունցի Դավիթ', 'Սպոնջբոբ', 'Շրեկ', 'Վուդի', 'Պիկաչու', 'Մարիո', 'Սիմբա'],
  ka: ['ნაცარქექია', 'კომბლე', 'ჩხიკვთა ქორწილი', 'ბომბორა', 'სპანჯბობი', 'შრეკი', 'ვუდი', 'პიკაჩუ', 'მარიო', 'სიმბა'],
  bn: ['গোপাল ভাঁড়', 'নন্টে ফন্টে', 'বাঁটুল দি গ্রেট', 'টেনিদা', 'ছোটা ভীম', 'ডোরেমন', 'স্পঞ্জবব', 'পিকাচু', 'মিকি মাউস', 'টম'],
  tl: ['Darna', 'Captain Barbell', 'Panday', 'Gagamboy', 'Kenkoy', 'SpongeBob', 'Pikachu', 'Woody', 'Shrek', 'Mario']
};

export function getRandomCharacters(lang: Language | string = 'en-US', count: number = 8): string[] {
  const normLang = (lang === 'en-US' || lang === 'en') ? 'en' : (lang || 'en');
  const pool = CARTOON_CHARACTERS[normLang] || CARTOON_CHARACTERS[lang] || CARTOON_CHARACTERS.en || CARTOON_CHARACTERS.fa;
  
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
