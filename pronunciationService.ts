import { Language } from './types';
import { isRtlLang } from './ui';

/**
 * Curated pronunciation map for frequent words & phrases across target languages.
 * Keys are normalized lower-case target text strings.
 */
interface PronunciationEntry {
  fa: string;         // Persian phonetic transcription (e.g. «کومِن»)
  en: string;         // English phonetic respelling (e.g. [KOH-men])
  ipa: string;        // International Phonetic Alphabet (e.g. /ˈkoː.mən/)
}

const PRONUNCIATION_DICTIONARY: Record<string, Record<string, PronunciationEntry>> = {
  // DUTCH (nl)
  nl: {
    'komen': { fa: 'کومِن', en: 'KOH-men', ipa: 'ˈkoː.mən' },
    'kom': { fa: 'کُم', en: 'kom', ipa: 'kɔm' },
    'komt': { fa: 'کُمت', en: 'komt', ipa: 'kɔmt' },
    'gaan': { fa: 'خان', en: 'GHAHN', ipa: 'ɣaːn' },
    'ga': { fa: 'خا', en: 'ghah', ipa: 'ɣaː' },
    'eten': { fa: 'اِیتِن', en: 'AY-ten', ipa: 'ˈeː.tən' },
    'drinken': { fa: 'درینکِن', en: 'DRING-ken', ipa: 'ˈdrɪŋ.kən' },
    'water': { fa: 'واتِر', en: 'VAH-ter', ipa: 'ˈʋaː.tər' },
    'mineraalwater': { fa: 'مینِرال‌واتِر', en: 'mee-nuh-RAHL-vah-ter', ipa: 'mi.nəˈraːl.ʋaː.tər' },
    'brood': { fa: 'برود', en: 'BROHT', ipa: 'broːt' },
    'vers brood': { fa: 'فِرس برود', en: 'fers-broht', ipa: 'vɛrs broːt' },
    'koffie': { fa: 'کُفی', en: 'KOF-ee', ipa: 'ˈkɔ.fi' },
    'thee': { fa: 'تِی', en: 'TAY', ipa: 'teː' },
    'melk': { fa: 'مِلک', en: 'melk', ipa: 'mɛlk' },
    'suiker': { fa: 'سَوکِر', en: 'SOY-ker', ipa: 'ˈsœy.kər' },
    'hallo': { fa: 'هالو', en: 'HAH-loh', ipa: 'ˈɦɑ.loː' },
    'goedemorgen': { fa: 'خوتِه‌مُرخِن', en: 'GHOO-duh-mor-ghen', ipa: 'ˌɣu.dəˈmɔr.ɣə(n)' },
    'goedemiddag': { fa: 'خوتِه‌میداخ', en: 'GHOO-duh-mee-dahkh', ipa: 'ˌɣu.dəˈmɪ.dɑx' },
    'goedenavond': { fa: 'خوتِن‌آفُنت', en: 'GHOO-dun-ah-vont', ipa: 'ˌɣu.dənˈaː.vɔnt' },
    'goedenacht': { fa: 'خوتِه‌ناخت', en: 'GHOO-duh-nahkht', ipa: 'ˌɣu.dəˈnɑxt' },
    'tot ziens': { fa: 'تُت زینْس', en: 'tot ZEENS', ipa: 'tɔt ˈzins' },
    'tot straks': { fa: 'تُت استراکس', en: 'tot STRAHKS', ipa: 'tɔt ˈstrɑks' },
    'dag': { fa: 'داخ', en: 'dahkh', ipa: 'dɑx' },
    'doei': { fa: 'دویی', en: 'DOO-ee', ipa: 'duːi' },
    'dank je': { fa: 'دانک یِه‌', en: 'dahnk yuh', ipa: 'ˈdɑŋk jə' },
    'dank je wel': { fa: 'دانک یِه‌ وِل', en: 'dahnk yuh vel', ipa: 'ˈdɑŋk jə ʋɛl' },
    'dank u wel': { fa: 'دانک یو وِل', en: 'dahnk oo vel', ipa: 'ˈdɑŋk y ʋɛl' },
    'bedankt': { fa: 'بِه‌دانکت', en: 'buh-DAHNKT', ipa: 'bəˈdɑŋkt' },
    'alsjeblieft': { fa: 'آلس‌یِه‌بلیفت', en: 'AHL-shuh-bleeft', ipa: 'ˌɑl.ʃəˈblift' },
    'alstublieft': { fa: 'آلستو-بلیفت', en: 'AHL-stoo-bleeft', ipa: 'ˌɑl.styˈblift' },
    'graag gedaan': { fa: 'خراخ خِه‌دان', en: 'ghrahkh ghuh-DAHN', ipa: 'ɣraːx xəˈdaːn' },
    'pardon': { fa: 'پاردُن', en: 'par-DON', ipa: 'pɑrˈdɔn' },
    'sorry': { fa: 'سُری', en: 'SOR-ee', ipa: 'ˈsɔ.ri' },
    'het spijt me': { fa: 'هِت اسپَیت مِه‌', en: 'het spayt muh', ipa: 'hɛt ˈspɛit mə' },
    'ja': { fa: 'یا', en: 'yah', ipa: 'jaː' },
    'nee': { fa: 'نِی', en: 'nay', ipa: 'neː' },
    'hoe gaat het': { fa: 'هو خات هِت', en: 'hoo ghaht het', ipa: 'hu ɣaːt hɛt' },
    'hoe gaat het?': { fa: 'هو خات هِت؟', en: 'hoo ghaht het?', ipa: 'hu ɣaːt hɛt' },
    'goed': { fa: 'خوت', en: 'ghoot', ipa: 'ɣut' },
    'slecht': { fa: 'سلِخت', en: 'slekht', ipa: 'slɛxt' },
    'huis': { fa: 'هاوس', en: 'HOYS', ipa: 'hœys' },
    'fiets': { fa: 'فیتس', en: 'feets', ipa: 'fits' },
    'auto': { fa: 'اُوتو', en: 'OW-toh', ipa: 'ˈɔu.toː' },
    'trein': { fa: 'ترِین', en: 'trayn', ipa: 'trɛin' },
    'bus': { fa: 'بوس', en: 'bus', ipa: 'bʏs' },
    'station': { fa: 'استاسیون', en: 'stah-SYON', ipa: 'staːˈʃɔn' },
    'straat': { fa: 'استرات', en: 'straht', ipa: 'straːt' },
    'stad': { fa: 'استات', en: 'staht', ipa: 'stɑt' },
    'land': { fa: 'لاند', en: 'lahnt', ipa: 'lɑnt' },
    'boek': { fa: 'بوک', en: 'book', ipa: 'buk' },
    'pen': { fa: 'پِن', en: 'pen', ipa: 'pɛn' },
    'tafel': { fa: 'تافِل', en: 'TAH-fel', ipa: 'ˈtaː.fəl' },
    'stoel': { fa: 'استول', en: 'stool', ipa: 'stul' },
    'bed': { fa: 'بِت', en: 'bet', ipa: 'bɛt' },
    'deur': { fa: 'دُور', en: 'dur', ipa: 'døːr' },
    'raam': { fa: 'رام', en: 'rahm', ipa: 'raːm' },
    'geld': { fa: 'خِلد', en: 'khelt', ipa: 'ɣɛlt' },
    'rekening': { fa: 'رِیکِه‌نینگ', en: 'RAY-kuh-ning', ipa: 'ˈreː.kə.nɪŋ' },
    'hoeveel kost het?': { fa: 'هو فِیل کُست هِت؟', en: 'hoo-vayl kost het?', ipa: 'huˈveːl kɔst hɛt' },
    'mag ik de rekening?': { fa: 'ماخ ایک دِ رِیکِه‌نینگ؟', en: 'mahkh ik duh ray-kuh-ning?', ipa: 'mɑx ɪk də ˈreː.kə.nɪŋ' },
    'spreekt u engels?': { fa: 'اسپرِیکت یو اِنگِلس؟', en: 'spraykt oo eng-els?', ipa: 'spreːkt y ˈɛŋ.əls' },
    'ik begrijp het niet': { fa: 'ایک بِه‌خرایپ هِت نیت', en: 'ik buh-ghrayp het neet', ipa: 'ɪk bəˈɣrɛip hɛt nit' },
    'gezellig': { fa: 'خِه‌زِلِیخ', en: 'khuh-ZEL-ukh', ipa: 'ɣəˈzɛ.ləx' },
    'gezelligheid': { fa: 'خِه‌زِلِیخ‌هایت', en: 'khuh-ZEL-ukh-hayt', ipa: 'ɣəˈzɛ.ləx.ɦɛit' }
  },

  // ENGLISH (en / en-US)
  en: {
    'come': { fa: 'کام', en: 'kʌm', ipa: 'kʌm' },
    'hello': { fa: 'هِلُو', en: 'heh-LOH', ipa: 'həˈloʊ' },
    'thank you': { fa: 'تَنک یو', en: 'THANK yoo', ipa: 'ˈθæŋk juː' },
    'water': { fa: 'واتِر', en: 'WAH-ter', ipa: 'ˈwɔː.tər' },
    'coffee': { fa: 'کافی', en: 'KOF-ee', ipa: 'ˈkɒ.fi' },
    'bread': { fa: 'برِد', en: 'bred', ipa: 'brɛd' },
    'please': { fa: 'پلیز', en: 'pleez', ipa: 'pliːz' },
    'excuse me': { fa: 'اکسکیوز می', en: 'ek-SKYOOZ mee', ipa: 'ɪkˈskjuːz miː' },
    'sorry': { fa: 'ساری', en: 'SOR-ee', ipa: 'ˈsɒr.i' },
    'goodbye': { fa: 'گودبای', en: 'good-BYE', ipa: 'ˌɡʊdˈbaɪ' },
    'how are you?': { fa: 'هاو آر یو؟', en: 'how ahr yoo?', ipa: 'haʊ ɑːr juː' },
    'see you later': { fa: 'سی یو لِیتِر', en: 'see yoo lay-ter', ipa: 'siː juː ˈleɪ.tər' },
    'check please': { fa: 'چِک پلیز', en: 'chek pleez', ipa: 'tʃɛk pliːz' },
    'could i get a glass of water?': { fa: 'کود آی گِت اِ گلس آو واتِر؟', en: 'kood eye get uh glahs ov wah-ter?', ipa: 'kʊd aɪ ɡɛt ə ɡlæs əv ˈwɔːtər' }
  },

  // GERMAN (de)
  de: {
    'kommen': { fa: 'کُمِن', en: 'KOM-en', ipa: 'ˈkɔmən' },
    'hallo': { fa: 'هالو', en: 'HAH-loh', ipa: 'ˈhaloː' },
    'guten tag': { fa: 'گوتِن تاگ', en: 'GOO-ten tahk', ipa: 'ˌɡuːtn̩ ˈtaːk' },
    'guten morgen': { fa: 'گوتِن مُرگِن', en: 'GOO-ten mor-gen', ipa: 'ˌɡuːtn̩ ˈmɔʁɡn̩' },
    'danke': { fa: 'دانکِه', en: 'DAHN-kuh', ipa: 'ˈdaŋkə' },
    'danke schön': { fa: 'دانکِه شُون', en: 'DAHN-kuh shurn', ipa: 'ˈdaŋkə ˌʃøːn' },
    'bitte': { fa: 'بیتِه', en: 'BIT-tuh', ipa: 'ˈbɪtə' },
    'wasser': { fa: 'واسِر', en: 'VAHS-ser', ipa: 'ˈvasɐ' },
    'brot': { fa: 'بروت', en: 'broht', ipa: 'bʁoːt' },
    'kaffee': { fa: 'کافِه', en: 'KAH-fay', ipa: 'ˈkafeː' },
    'auf wiedersehen': { fa: 'آوف ویدِرزِین', en: 'owf VEE-der-zayn', ipa: 'aʊf ˈviːdɐˌzeːən' },
    'entschuldigung': { fa: 'اِنتشولدینگونگ', en: 'ent-SHOOL-dee-goong', ipa: 'ɛntˈʃʊldɪɡʊŋ' },
    'ja': { fa: 'یا', en: 'yah', ipa: 'jaː' },
    'nein': { fa: 'ناین', en: 'nine', ipa: 'naɪn' }
  },

  // FRENCH (fr)
  fr: {
    'venir': { fa: 'وِنیر', en: 'vuh-NEER', ipa: 'və.niʁ' },
    'bonjour': { fa: 'بُنژور', en: 'bohn-ZHOOR', ipa: 'bɔ̃.ʒuʁ' },
    'bonsoir': { fa: 'بُنسوار', en: 'bohn-SWAHR', ipa: 'bɔ̃.swaʁ' },
    'merci': { fa: 'مرسی', en: 'mehr-SEE', ipa: 'mɛʁ.si' },
    'merci beaucoup': { fa: 'مرسی بوکو', en: 'mehr-see boh-KOO', ipa: 'mɛʁ.si bo.ku' },
    's\'il vous plaît': { fa: 'سیل وو پلِه', en: 'seel voo pleh', ipa: 'sil vu plɛ' },
    'de rien': { fa: 'دُوریَن', en: 'duh ryahn', ipa: 'də ʁjɛ̃' },
    'eau': { fa: 'او', en: 'oh', ipa: 'o' },
    'pain': { fa: 'پَن', en: 'pahn', ipa: 'pɛ̃' },
    'café': { fa: 'کافِه', en: 'kah-FAY', ipa: 'ka.fe' },
    'au revoir': { fa: 'او روآر', en: 'oh ruh-VWAHR', ipa: 'o ʁə.vwaʁ' },
    'oui': { fa: 'وی', en: 'wee', ipa: 'wi' },
    'non': { fa: 'نُن', en: 'nohn', ipa: 'nɔ̃' }
  },

  // SPANISH (es)
  es: {
    'venir': { fa: 'وِنیر', en: 'beh-NEER', ipa: 'beˈniɾ' },
    'hola': { fa: 'اُلا', en: 'OH-lah', ipa: 'ˈo.la' },
    'buenos días': { fa: 'بوئنُس دیاس', en: 'BWAY-nohs DEE-ahs', ipa: 'ˌbwe.noz ˈdi.as' },
    'gracias': { fa: 'گراسیاس', en: 'GRAH-syahs', ipa: 'ˈɡɾa.sjas' },
    'muchas gracias': { fa: 'موچاس گراسیاس', en: 'MOO-chahs GRAH-syahs', ipa: 'ˌmu.tʃaz ˈɡɾa.sjas' },
    'por favor': { fa: 'پُر فابُر', en: 'por fah-VOR', ipa: 'poɾ faˈβoɾ' },
    'de nada': { fa: 'دِ نادا', en: 'day NAH-dah', ipa: 'de ˈna.ða' },
    'agua': { fa: 'آگوا', en: 'AH-gwah', ipa: 'ˈa.ɣwa' },
    'pan': { fa: 'پان', en: 'pahn', ipa: 'pan' },
    'café': { fa: 'کافِه', en: 'kah-FAY', ipa: 'kaˈfe' },
    'adiós': { fa: 'آدیُس', en: 'ah-DYOHS', ipa: 'aˈðjos' },
    'sí': { fa: 'سی', en: 'see', ipa: 'si' },
    'no': { fa: 'نو', en: 'noh', ipa: 'no' }
  },

  // ITALIAN (it)
  it: {
    'venire': { fa: 'وِنیره', en: 'veh-NEE-reh', ipa: 'veˈni.re' },
    'ciao': { fa: 'چائو', en: 'CHOW', ipa: 'ˈtʃaː.o' },
    'buongiorno': { fa: 'بون‌جورنو', en: 'bwohn-JOHR-noh', ipa: 'bwonˈdʒor.no' },
    'grazie': { fa: 'گراتسیه', en: 'GRAHT-syeh', ipa: 'ˈɡrat.tsje' },
    'grazie mille': { fa: 'گراتسیه میلّه', en: 'GRAHT-syeh MEEL-leh', ipa: 'ˈɡrat.tsje ˈmil.le' },
    'per favore': { fa: 'پر فاووره', en: 'pair fah-VOH-reh', ipa: 'per faˈvo.re' },
    'prego': { fa: 'پرِگو', en: 'PRAY-goh', ipa: 'ˈprɛː.ɡo' },
    'acqua': { fa: 'آکوا', en: 'AHK-wah', ipa: 'ˈak.kwa' },
    'pane': { fa: 'پانه', en: 'PAH-neh', ipa: 'ˈpaː.ne' },
    'caffè': { fa: 'کافّه', en: 'kahf-FEH', ipa: 'kafˈfɛ' },
    'arrivederci': { fa: 'آریوِدرچی', en: 'ah-ree-veh-DAIR-chee', ipa: 'ar.ri.veˈder.tʃi' }
  }
};

/**
 * Heuristic phonetic transliterator for Dutch into Persian script & IPA.
 * Handles vowels, diphthongs, and consonant clusters with high fidelity.
 */
function transliterateDutchToPersian(word: string): { fa: string; ipa: string } {
  const clean = word.toLowerCase().trim();
  let fa = clean;
  let ipa = clean;

  // Replace common Dutch combinations
  // Diphthongs & Double vowels
  fa = fa.replace(/sch/g, 'سخ');
  fa = fa.replace(/ch/g, 'خ');
  fa = fa.replace(/(^|\s)aa/g, '$1آ').replace(/aa/g, 'ا');
  fa = fa.replace(/(^|\s)ee/g, '$1ای').replace(/ee/g, 'ی');
  fa = fa.replace(/(^|\s)ie/g, '$1ای').replace(/ie/g, 'ی');
  fa = fa.replace(/(^|\s)oo/g, '$1او').replace(/oo/g, 'و');
  fa = fa.replace(/(^|\s)oe/g, '$1او').replace(/oe/g, 'و');
  fa = fa.replace(/(^|\s)ou/g, '$1او').replace(/ou/g, 'و');
  fa = fa.replace(/(^|\s)au/g, '$1او').replace(/au/g, 'و');
  fa = fa.replace(/(^|\s)ij/g, '$1اِی').replace(/ij/g, 'ِی');
  fa = fa.replace(/(^|\s)ei/g, '$1اِی').replace(/ei/g, 'ِی');
  fa = fa.replace(/(^|\s)ui/g, '$1اَی').replace(/ui/g, 'َی');
  fa = fa.replace(/(^|\s)eu/g, '$1اُو').replace(/eu/g, 'ُو');

  // Single consonants
  fa = fa.replace(/g/g, 'خ');
  fa = fa.replace(/v/g, 'ف');
  fa = fa.replace(/f/g, 'ف');
  fa = fa.replace(/w/g, 'و');
  fa = fa.replace(/j/g, 'ی');
  fa = fa.replace(/z/g, 'ز');
  fa = fa.replace(/k/g, 'ک');
  fa = fa.replace(/p/g, 'پ');
  fa = fa.replace(/t/g, 'ت');
  fa = fa.replace(/b/g, 'ب');
  fa = fa.replace(/d/g, 'د');
  fa = fa.replace(/m/g, 'م');
  fa = fa.replace(/n/g, 'ن');
  fa = fa.replace(/r/g, 'ر');
  fa = fa.replace(/l/g, 'ل');
  fa = fa.replace(/s/g, 'س');
  fa = fa.replace(/h/g, 'ه');

  // Single vowels
  fa = fa.replace(/o/g, 'و');
  fa = fa.replace(/e/g, 'ِ');
  fa = fa.replace(/a/g, 'اَ');
  fa = fa.replace(/i/g, 'ی');
  fa = fa.replace(/u/g, 'و');

  // Clean Persian joins
  fa = fa.replace(/ِ/g, 'ِ'); // keep explicit zer
  if (fa.endsWith('ِن')) {
    fa = fa.replace(/ِن$/, 'ِن');
  }

  // Basic Dutch IPA approximation
  ipa = clean
    .replace(/sch/g, 'sx')
    .replace(/ch/g, 'x')
    .replace(/g/g, 'ɣ')
    .replace(/ij|ei/g, 'ɛi')
    .replace(/ui/g, 'œy')
    .replace(/eu/g, 'øː')
    .replace(/ee/g, 'eː')
    .replace(/oo/g, 'oː')
    .replace(/aa/g, 'aː')
    .replace(/oe/g, 'u')
    .replace(/ie/g, 'i')
    .replace(/w/g, 'ʋ')
    .replace(/v/g, 'v');

  return { fa, ipa: `[ˈ${ipa}]` };
}

/**
 * Universal pronunciation resolver.
 * Given a word/phrase, target language, and user native language:
 * returns a localized pronunciation hint adhering to the user's explicit preference:
 * - Native language phonetic transcription (e.g. Persian «کومِن»)
 * - And/or phonetic alphabet (IPA)
 */
export function getPronunciationHint(
  targetText: string,
  targetLang: Language,
  nativeLang: Language = 'fa',
  existingPronunciation?: string
): string {
  if (!targetText) return '';

  const clean = targetText.trim();
  const lower = clean.toLowerCase().replace(/[.,!?;:؟]/g, '').trim();
  const isTargetDutch = targetLang === 'nl';
  const isTargetEnglish = targetLang === 'en' || targetLang === 'en-US';
  const isNativeFa = nativeLang === 'fa' || isRtlLang(nativeLang);

  // 1. Check curated pre-existing pronunciation on card
  if (existingPronunciation && existingPronunciation.trim()) {
    const rawPron = existingPronunciation.trim();
    if (isNativeFa) {
      return `تلفظ: «${rawPron}»`;
    }
    return `Pronunciation: [${rawPron}]`;
  }

  // 2. Check curated dictionary
  const langKey = isTargetEnglish ? 'en' : (targetLang as string);
  const dictForLang = PRONUNCIATION_DICTIONARY[langKey];
  if (dictForLang && dictForLang[lower]) {
    const entry = dictForLang[lower];
    if (isNativeFa) {
      const nativePhonetic = entry.fa;
      const ipa = entry.ipa ? ` [${entry.ipa}]` : '';
      return `تلفظ: «${nativePhonetic}»${ipa}`;
    } else {
      const respell = entry.en ? `[${entry.en}] ` : '';
      const ipa = entry.ipa ? `/${entry.ipa}/` : '';
      return `Pronunciation: ${respell}${ipa}`.trim();
    }
  }

  // 3. Multi-word phrase lookup (word by word)
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length > 1 && dictForLang) {
    const matchedPartsFa: string[] = [];
    const matchedPartsEn: string[] = [];
    let hasMatches = false;

    for (const w of words) {
      if (dictForLang[w]) {
        matchedPartsFa.push(dictForLang[w].fa);
        matchedPartsEn.push(dictForLang[w].en || dictForLang[w].ipa);
        hasMatches = true;
      } else if (isTargetDutch) {
        const fallback = transliterateDutchToPersian(w);
        matchedPartsFa.push(fallback.fa);
        matchedPartsEn.push(fallback.ipa);
      } else {
        matchedPartsFa.push(w);
        matchedPartsEn.push(w);
      }
    }

    if (hasMatches || isTargetDutch) {
      if (isNativeFa) {
        return `تلفظ: «${matchedPartsFa.join(' ')}»`;
      }
      return `Pronunciation: [${matchedPartsEn.join(' ')}]`;
    }
  }

  // 4. Algorithmic fallback for Dutch
  if (isTargetDutch) {
    const { fa, ipa } = transliterateDutchToPersian(clean);
    if (isNativeFa) {
      return `تلفظ: «${fa}» ${ipa}`;
    }
    return `Pronunciation: ${ipa}`;
  }

  // 5. General fallback: show cleaned phonetic guide
  if (isNativeFa) {
    return `تلفظ آوایی: [${clean}]`;
  }
  return `Pronunciation: [${clean}]`;
}
