import { Language, CEFRLevel, LanguageCard, ContentType, LearningMode } from './types';
import { SUPPORTED_LANGUAGES } from './constants';

export const RTL_LANGUAGES: Language[] = ['fa', 'ar', 'ur', 'he', 'ku'];

export function isLanguageRTL(lang: Language | string): boolean {
  return RTL_LANGUAGES.includes(lang as Language);
}

// Prompt templates translated into major native languages
export const PROMPTS_BY_NATIVE_LANG: Record<string, { explain: string; reverse: (target: string) => string; speak: string; situation: string }> = {
  fa: {
    explain: 'این کلمه یا عبارت را برای یارتان به زبان هدف توضیح دهید',
    reverse: (target: string) => `🔄 ترجمه به ${target}: این عبارت را به زبان هدف ادا کن!`,
    speak: 'این عبارت را با تلفظ روان و طبیعی بیان کن',
    situation: 'در این موقعیت، بهترین واکنش را به زبان هدف بگو'
  },
  en: {
    explain: 'Explain this word or phrase to your partner in the target language',
    reverse: (target: string) => `🔄 Reverse Translate into ${target}: Speak the phrase!`,
    speak: 'Speak this phrase with clear, natural pronunciation',
    situation: 'In this situation, say the natural response in the target language'
  },
  'en-US': {
    explain: 'Explain this word or phrase to your partner in the target language',
    reverse: (target: string) => `🔄 Reverse Translate into ${target}: Speak the phrase!`,
    speak: 'Speak this phrase with clear, natural pronunciation',
    situation: 'In this situation, say the natural response in the target language'
  },
  nl: {
    explain: 'Leg dit woord of deze zin uit aan je partner in de doeltaal',
    reverse: (target: string) => `🔄 Vertaal naar het ${target}: Spreek de zin uit!`,
    speak: 'Spreek deze zin duidelijk en natuurlijk uit',
    situation: 'Geef in deze situatie het juiste antwoord in de doeltaal'
  },
  de: {
    explain: 'Erkläre deinem Partner dieses Wort in der Zielsprache',
    reverse: (target: string) => `🔄 Übersetze ins ${target}: Sprich den Satz aus!`,
    speak: 'Sprich diesen Satz mit klarer Aussprache',
    situation: 'Gib in dieser Situation die passende Antwort in der Zielsprache'
  },
  fr: {
    explain: 'Expliquez ce mot ou cette phrase à votre partenaire dans la langue cible',
    reverse: (target: string) => `🔄 Traduisez en ${target} : Prononcez la phrase !`,
    speak: 'Prononcez cette phrase avec fluidité',
    situation: 'Dans cette situation, donnez la réponse appropriée dans la langue cible'
  },
  es: {
    explain: 'Explica esta palabra o frase a tu compañero en el idioma de destino',
    reverse: (target: string) => `🔄 Traduce al ${target}: ¡Pronuncia la frase!`,
    speak: 'Pronuncia esta frase de forma clara y natural',
    situation: 'En esta situación, responde en el idioma de destino'
  },
  it: {
    explain: 'Spiega questa parola o frase al tuo compagno nella lingua di arrivo',
    reverse: (target: string) => `🔄 Traduci in ${target}: Pronuncia la frase!`,
    speak: 'Pronuncia questa frase in modo chiaro e naturale',
    situation: 'In questa situazione, dì la risposta adeguata nella lingua di arrivo'
  },
  ar: {
    explain: 'اشرح هذه الكلمة أو العبارة لزميلك باللغة الهدف',
    reverse: (target: string) => `🔄 ترجم إلى ${target}: انطق العبارة باللغة الهدف!`,
    speak: 'انطق هذه العبارة بنطق واضح وطبيعي',
    situation: 'في هذا الموقف، قل الرد المناسب باللغة الهدف'
  },
  tr: {
    explain: 'Bu kelime veya ifadeyi takım arkadaşına hedef dilde açıkla',
    reverse: (target: string) => `🔄 ${target} diline çevir: Bu ifadeyi söyle!`,
    speak: 'Bu cümleyi akıcı ve doğal bir şekilde seslendir',
    situation: 'Bu durumda hedef dilde en uygun yanıtı ver'
  },
  ru: {
    explain: 'Объясните это слово или фразу партнеру на изучаемом языке',
    reverse: (target: string) => `🔄 Переведите на ${target}: Произнесите эту фразу!`,
    speak: 'Произнесите эту фразу четко и естественно',
    situation: 'В этой ситуации скажите подходящую фразу на изучаемом языке'
  },
  pt: {
    explain: 'Explica esta palavra ou frase ao teu parceiro na língua de destino',
    reverse: (target: string) => `🔄 Traduz para ${target}: Fala a frase na língua de destino!`,
    speak: 'Fala esta frase com pronúncia clara e natural',
    situation: 'Nesta situação, dá a resposta adequada na língua de destino'
  },
  pl: {
    explain: 'Wyjaśnij to słowo lub wyrażenie partnerowi w języku docelowym',
    reverse: (target: string) => `🔄 Przetłumacz na ${target}: Wypowiedz to wyrażenie!`,
    speak: 'Wypowiedz to zdanie płynnie i wyraźnie',
    situation: 'W tej sytuacji udziel właściwej odpowiedzi w języku docelowym'
  },
  uk: {
    explain: 'Поясніть це слово або фразу партнеру мовою, яку вивчаєте',
    reverse: (target: string) => `🔄 Перекладіть на ${target}: Промовте цю фразу!`,
    speak: 'Вимовте цю фразу чітко та природно',
    situation: 'У цій ситуації скажіть доречну відповідь цільовою мовою'
  },
  zh: {
    explain: '用目标语言向你的搭档解释这个词语或句子',
    reverse: (target: string) => `🔄 翻译成${target}：大声说出这个短语！`,
    speak: '用自然流利的语调朗读此短语',
    situation: '在此情境下，用目标语言给出合适的回应'
  },
  ja: {
    explain: '目標言語でこの単語やフレーズをパートナーに説明してください',
    reverse: (target: string) => `🔄 ${target}に翻訳：フレーズを発音してください！`,
    speak: '自然で明瞭な発音で発話してください',
    situation: 'この状況で、目標言語で適切な返答をしてください'
  },
  ko: {
    explain: '목표 언어로 파트너에게 이 단어나 문장을 설명하세요',
    reverse: (target: string) => `🔄 ${target}(으)로 번역: 해당 표현을 말하세요!`,
    speak: '자연스럽고 또렷한 발음으로 말하세요',
    situation: '이 상황에서 목표 언어로 알맞은 대답을 하세요'
  },
  hi: {
    explain: 'लक्ष्य भाषा में अपने साथी को इस शब्द या वाक्यांश का अर्थ समझाएं',
    reverse: (target: string) => `🔄 ${target} में अनुवाद करें: वाक्य बोलें!`,
    speak: 'इस वाक्य को स्पष्ट और स्वाभाविक उच्चारण के साथ बोलें',
    situation: 'इस स्थिति में लक्ष्य भाषा में उपयुक्त उत्तर दें'
  },
  ur: {
    explain: 'ہدف زبان میں اپنے ساتھی کو اس لفظ یا جملے کا مطلب سمجھائیں',
    reverse: (target: string) => `🔄 ${target} میں ترجمہ کریں: یہ جملہ ادا کریں!`,
    speak: 'اس جملے کو واضح اور قدرتی تلفظ کے ساتھ ادا کریں',
    situation: 'اس صورتحال میں ہدف زبان میں مناسب جواب دیں'
  },
  ku: {
    explain: 'ئەم وشەیە یان دەستەواژەیە بە زمانی ئامانج بۆ ھاوڕێکەت شی بکەوە',
    reverse: (target: string) => `🔄 وەربگێڕە بۆ ${target}: بە زمانی ئامانج دەستەواژەکە بڵێ!`,
    speak: 'ئەم ڕستەیە بە بێژەکردنێکی ڕوون دەرببڕە',
    situation: 'لە ئەم دۆخەدا بە زمانی ئامانج وەڵام بدەوە'
  },
  he: {
    explain: 'הסבר מילה או ביטוי זה לבן/בת הזוג בשפת היעד',
    reverse: (target: string) => `🔄 תרגם ל-${target}: אמור את הביטוי בשפת היעד!`,
    speak: 'אמור משפט זה בהגייה ברורה וטבעית',
    situation: 'במצב זה, אמור את התגובה המתאימה בשפת היעד'
  },
  sv: {
    explain: 'Förklara detta ord eller fras för din partner på målspråket',
    reverse: (target: string) => `🔄 Översätt till ${target}: Säg frasen på målspråket!`,
    speak: 'Uttala denna fras tydligt och naturligt',
    situation: 'Ge rätt svar på målspråket i denna situation'
  }
};

export function getPromptForCard(
  learningMode: LearningMode,
  nativeLang: Language,
  targetLangName: string,
  isReverse: boolean = false
): string {
  const p = PROMPTS_BY_NATIVE_LANG[nativeLang] || PROMPTS_BY_NATIVE_LANG['en'];
  if (isReverse || learningMode === 'Reverse') {
    return p.reverse(targetLangName);
  }
  if (learningMode === 'Speak') return p.speak;
  if (learningMode === 'Situation') return p.situation;
  return p.explain;
}

/**
 * Universal multi-lingual concepts dictionary
 * Each concept has authentic native words across all 38 supported languages
 */
export interface MultiLingualConcept {
  id: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  difficulty: 'easy' | 'medium' | 'hard';
  words: Record<string, string>;
}

export const UNIVERSAL_CONCEPTS: MultiLingualConcept[] = [
  // 1. Greetings & Everyday
  {
    id: 'C_GREETING_HELLO',
    topic: 'CAT_SOCIAL',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'سلام', en: 'Hello', 'en-US': 'Hello', nl: 'Hallo', de: 'Hallo', fr: 'Bonjour',
      es: 'Hola', it: 'Ciao', ar: 'مرحبا', tr: 'Merhaba', ru: 'Привет', pt: 'Olá',
      sv: 'Hej', no: 'Hei', da: 'Hej', fi: 'Hei', pl: 'Cześć', uk: 'Привіт',
      el: 'Γεια σας', cs: 'Ahoj', ro: 'Bună', hu: 'Szia', zh: '你好', ja: 'こんにちは',
      ko: '안녕하세요', hi: 'नमस्ते', ur: 'سلام', bn: 'নমস্কার', id: 'Halo', ms: 'Helo',
      vi: 'Xin chào', th: 'สวัสดี', tl: 'Kamusta', ku: 'سڵاو', az: 'Salam', he: 'שלום',
      hy: 'Բարև', ka: 'გამარჯობა'
    }
  },
  {
    id: 'C_GREETING_THANKS',
    topic: 'CAT_SOCIAL',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'متشکرم / مرسی', en: 'Thank you', 'en-US': 'Thank you', nl: 'Dank je wel', de: 'Danke schön', fr: 'Merci beaucoup',
      es: 'Muchas gracias', it: 'Grazie mille', ar: 'شكراً جزيلاً', tr: 'Teşekkürler', ru: 'Спасибо', pt: 'Obrigado',
      sv: 'Tack så mycket', no: 'Tusen takk', da: 'Mange tak', fi: 'Kiitos paljon', pl: 'Dziękuję bardzo', uk: 'Дякую',
      el: 'Ευχαριστώ', cs: 'Děkuji', ro: 'Mulțumesc', hu: 'Köszönöm', zh: '谢谢', ja: 'ありがとう',
      ko: '감사합니다', hi: 'धन्यवाद', ur: 'شکریہ', bn: 'ধন্যবাদ', id: 'Terima kasih', ms: 'Terima kasih',
      vi: 'Cảm ơn bạn', th: 'ขอบคุณ', tl: 'Salamat', ku: 'سوپاس', az: 'Çox sağ olun', he: 'תודה רבה',
      hy: 'Շնորհակալություն', ka: 'მადლობა'
    }
  },
  {
    id: 'C_FOOD_WATER',
    topic: 'CAT_FOOD',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'آب معدنی', en: 'Mineral water', 'en-US': 'Mineral water', nl: 'Mineraalwater', de: 'Mineralwasser', fr: 'Eau minérale',
      es: 'Agua mineral', it: 'Acqua minerale', ar: 'ماء معدني', tr: 'Maden suyu', ru: 'Минеральная вода', pt: 'Água mineral',
      sv: 'Mineralvatten', no: 'Mineralvann', da: 'Mineralvand', fi: 'Kivennäisvesi', pl: 'Woda mineralna', uk: 'Мінеральна вода',
      el: 'Μεταλλικό νερό', cs: 'Minerální voda', ro: 'Apă minerală', hu: 'Ásványvíz', zh: '矿泉水', ja: 'ミネラルウォーター',
      ko: '미네랄 워터', hi: 'खनिज पानी', ur: 'منرل واٹر', bn: 'খনিজ জল', id: 'Air mineral', ms: 'Air mineral',
      vi: 'Nước khoáng', th: 'น้ำแร่', tl: 'Mineral na tubig', ku: 'ئاوی کانزایی', az: 'Mineral su', he: 'מים מינרליים',
      hy: 'Հանքային ջուր', ka: 'მინერალური წყალი'
    }
  },
  {
    id: 'C_FOOD_COFFEE',
    topic: 'CAT_FOOD',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'قهوه داغ', en: 'Hot coffee', 'en-US': 'Hot coffee', nl: 'Hete koffie', de: 'Heißer Kaffee', fr: 'Café chaud',
      es: 'Café caliente', it: 'Caffè caldo', ar: 'قهوة ساخنة', tr: 'Sıcak kahve', ru: 'Горячий кофе', pt: 'Café quente',
      sv: 'Varmt kaffe', no: 'Varm kaffe', da: 'Varm kaffe', fi: 'Kuuma kahvi', pl: 'Gorąca kawa', uk: 'Гаряча кава',
      el: 'Ζεστός καφές', cs: 'Horká káva', ro: 'Cafea caldă', hu: 'Forró kávé', zh: '热咖啡', ja: 'ホットコーヒー',
      ko: '따뜻한 커피', hi: 'गर्म कॉफी', ur: 'گرم کافی', bn: 'গরম কফি', id: 'Kopi panas', ms: 'Kopi panas',
      vi: 'Cà phê nóng', th: 'กาแฟร้อน', tl: 'Mainit na kape', ku: 'قاوەی گەرم', az: 'İsti qəhvə', he: 'קפה חם',
      hy: 'Տաք սուրճ', ka: 'ცხელი ყავა'
    }
  },
  {
    id: 'C_FOOD_BREAD',
    topic: 'CAT_FOOD',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'نان تازه', en: 'Fresh bread', 'en-US': 'Fresh bread', nl: 'Vers brood', de: 'Frisches Brot', fr: 'Pain frais',
      es: 'Pan fresco', it: 'Pane fresco', ar: 'خبز طازج', tr: 'Taze ekmek', ru: 'Свежий хлеб', pt: 'Pão fresco',
      sv: 'Färskt bröd', no: 'Ferskt brød', da: 'Frisk brød', fi: 'Tuore leipä', pl: 'Świeży chleb', uk: 'Свіжий хліб',
      el: 'Φρέσκο ψωμί', cs: 'Čerstvý chléb', ro: 'Pâine proaspătă', hu: 'Friss kenyér', zh: '新鲜面包', ja: '焼きたてのパン',
      ko: '신선한 빵', hi: 'ताज़ी रोटी', ur: 'تازہ روٹی', bn: 'তাজা রুটি', id: 'Roti segar', ms: 'Roti segar',
      vi: 'Bánh mì tươi', th: 'ขนมปังสด', tl: 'Bagong lutong tinapay', ku: 'نانە فڕێش', az: 'Təzə çörək', he: 'לחם טרי',
      hy: 'Թարմ հաց', ka: 'ახალი პური'
    }
  },
  {
    id: 'C_REST_BILL',
    topic: 'CAT_RESTAURANT',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'صورتحساب لطفاً', en: 'The bill, please', 'en-US': 'Check, please', nl: 'Mag ik de rekening?', de: 'Die Rechnung, bitte', fr: "L'addition, s'il vous plaît",
      es: 'La cuenta, por favor', it: 'Il conto, per favore', ar: 'الحساب من فضلك', tr: 'Hesap lütfen', ru: 'Счет, пожалуйста', pt: 'A conta, por favor',
      sv: 'Notan, tack', no: 'Regningen, takk', da: 'Regningen, tak', fi: 'Lasku, kiitos', pl: 'Rachunek poproszę', uk: 'Рахунок, будь ласка',
      el: 'Το λογαριασμό, παρακαλώ', cs: 'Účet, prosím', ro: 'Nota de plată, vă rog', hu: 'A számlát, kérem', zh: '买单，谢谢', ja: 'お会計をお願いします',
      ko: '계산서 부탁드립니다', hi: 'बिल लाइए कृपया', ur: 'بل لائیں پلیز', bn: 'বিল দিন দয়া করে', id: 'Minta bonnya', ms: 'Kira bilnya',
      vi: 'Làm ơn tính tiền', th: 'เช็คบิลด้วยครับ', tl: 'Pakidala ang bill', ku: 'حسابەکە تکایە', az: 'Hesab, zəhmət olmasa', he: 'חשבון, בבקשה',
      hy: 'Հաշիվը, խնդրեմ', ka: 'ანგარიში, გეთაყვა'
    }
  },
  {
    id: 'C_REST_MENU',
    topic: 'CAT_RESTAURANT',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'منوی رستوران', en: 'Restaurant menu', 'en-US': 'Dinner menu', nl: 'Het menu', de: 'Die Speisekarte', fr: 'Le menu du restaurant',
      es: 'El menú del restaurante', it: 'Il menù del ristorante', ar: 'قائمة الطعام', tr: 'Yemek menüsü', ru: 'Меню ресторана', pt: 'O menu do restaurante',
      sv: 'Restaurangmenyn', no: 'Menyen', da: 'Spisekortet', fi: 'Ruokalista', pl: 'Menu restauracji', uk: 'Меню ресторану',
      el: 'Το μενού του εστιατορίου', cs: 'Jídelní lístek', ro: 'Meniul restaurantului', hu: 'Étlap', zh: '餐厅菜单', ja: 'レストランのメニュー',
      ko: '레스토랑 메뉴판', hi: 'रेस्तरां का मेनू', ur: 'کھانے کا مینو', bn: 'খাবারের তালিকা', id: 'Menu restoran', ms: 'Menu restoran',
      vi: 'Thực đơn nhà hàng', th: 'เมนูอาหาร', tl: 'Menu ng kainan', ku: 'مێنوی ڕێستۆرانت', az: 'Restoran menyusu', he: 'תפריט המסעדה',
      hy: 'Ճաշացանկ', ka: 'რესტორნის მენიუ'
    }
  },
  {
    id: 'C_TRAVEL_AIRPORT',
    topic: 'CAT_TRAVEL',
    level: 'A2',
    difficulty: 'medium',
    words: {
      fa: 'فرودگاه بین‌المللی', en: 'International airport', 'en-US': 'International airport', nl: 'Internationale luchthaven', de: 'Internationaler Flughafen', fr: 'Aéroport international',
      es: 'Aeropuerto internacional', it: 'Aeroporto internazionale', ar: 'مطار دولي', tr: 'Uluslararası havalimanı', ru: 'Международный аэропорт', pt: 'Aeroporto internacional',
      sv: 'Internationell flygplats', no: 'Internasjonal flyplass', da: 'International lufthavn', fi: 'Kansainvälinen lentokenttä', pl: 'Międzynarodowe lotnisko', uk: 'Міжнародний аеропорт',
      el: 'Διεθνές αεροδρόμιο', cs: 'Mezinárodní letiště', ro: 'Aeroport internațional', hu: 'Nemzetközi repülőtér', zh: '国际机场', ja: '国際空港',
      ko: '국제공항', hi: 'अंतर्राष्ट्रीय हवाई अड्डा', ur: 'بین الاقوامی ہوائی اڈہ', bn: 'আন্তর্জাতিক বিমানবন্দর', id: 'Bandara internasional', ms: 'Lapangan terbang antarabangsa',
      vi: 'Sân bay quốc tế', th: 'สนามบินนานาชาติ', tl: 'Pandaigdigang paliparan', ku: 'فڕۆکەخانەی نێودەوڵەتی', az: 'Beynəlxalq hava limanı', he: 'נמל תעופה בינלאומי',
      hy: 'Միջազգային օդանավակայան', ka: 'საერთაშორისო აეროპორტი'
    }
  },
  {
    id: 'C_TRAVEL_STATION',
    topic: 'CAT_TRAVEL',
    level: 'A2',
    difficulty: 'medium',
    words: {
      fa: 'ایستگاه مرکزی قطار', en: 'Central train station', 'en-US': 'Central station', nl: 'Centraal Station', de: 'Hauptbahnhof', fr: 'Gare centrale',
      es: 'Estación central de tren', it: 'Stazione centrale', ar: 'محطة القطار المركزية', tr: 'Merkez tren istasyonu', ru: 'Центральный вокзал', pt: 'Estação central de comboios',
      sv: 'Centralstationen', no: 'Sentralstasjonen', da: 'Hovedbanegården', fi: 'Päärautatieasema', pl: 'Dworzec Główny', uk: 'Центральний залізничний вокзал',
      el: 'Κεντρικός σιδηροδρομικός σταθμός', cs: 'Hlavní nádraží', ro: 'Gara centrală', hu: 'Főpályaudvar', zh: '中央火车站', ja: '中央駅',
      ko: '중앙 기차역', hi: 'केंद्रीय रेलवे स्टेशन', ur: 'مرکزی ریلوے اسٹیشن', bn: 'কেন্দ্রীয় রেলওয়ে স্টেশন', id: 'Stasiun kereta pusat', ms: 'Stesen kereta api pusat',
      vi: 'Ga xe lửa trung tâm', th: 'สถานีรถไฟกลาง', tl: 'Sentral na istasyon ng tren', ku: 'وێستگەی ناوەندیی شەمەندەفەر', az: 'Mərkəzi qatar stansiyası', he: 'תחנת רכבת מרכזית',
      hy: 'Կենտրոնական կայարան', ka: 'ცენტრალური რკინიგზის სადგური'
    }
  },
  {
    id: 'C_SHOPPING_DISCOUNT',
    topic: 'CAT_SHOPPING',
    level: 'A2',
    difficulty: 'medium',
    words: {
      fa: 'تخفیف ویژه فروشگاه', en: 'Special store discount', 'en-US': 'Special sale discount', nl: 'Speciale winkelkorting', de: 'Besonderer Rabatt', fr: 'Réduction spéciale',
      es: 'Descuento especial', it: 'Sconto speciale', ar: 'خصم خاص بالمتجر', tr: 'Özel mağaza indirimi', ru: 'Специальная скидка', pt: 'Desconto especial',
      sv: 'Särskild rabatt', no: 'Spesiell rabatt', da: 'Særlig rabat', fi: 'Erikoisalennus', pl: 'Specjalny rabat', uk: 'Спеціальна знижка',
      el: 'Ειδική έκπτωση', cs: 'Zvláštní sleva', ro: 'Reducere specială', hu: 'Különleges kedvezmény', zh: '特别折扣', ja: '特別割引',
      ko: '특별 할인', hi: 'विशेष छूट', ur: 'خصوصی رعایت', bn: 'বিশেষ ছাড়', id: 'Diskon khusus', ms: 'Diskaun istimewa',
      vi: 'Giảm giá đặc biệt', th: 'ส่วนลดพิเศษ', tl: 'Espesyal na diskwento', ku: 'داشکاندنی تایبەت', az: 'Xüsusi endirim', he: 'הנחה מיוחדת',
      hy: 'Հատուկ զեղչ', ka: 'სპეციალური ფასდაკლება'
    }
  },
  {
    id: 'C_WORK_MEETING',
    topic: 'CAT_WORK',
    level: 'B1',
    difficulty: 'medium',
    words: {
      fa: 'جلسه کاری فوری', en: 'Urgent business meeting', 'en-US': 'Urgent business meeting', nl: 'Dringende werkbespreking', de: 'Dringendes Meeting', fr: 'Réunion de travail urgente',
      es: 'Reunión de trabajo urgente', it: 'Riunione di lavoro urgente', ar: 'اجتماع عمل عاجل', tr: 'Acil iş toplantısı', ru: 'Срочная рабочая встреча', pt: 'Reunião de trabalho urgente',
      sv: 'Brådskande affärsmöte', no: 'Hastearbeidsmøte', da: 'Hastende arbejdsmøde', fi: 'Kiireellinen työkokous', pl: 'Pilne spotkanie biznesowe', uk: 'Термінова робоча нарада',
      el: 'Επείγουσα συνάντηση εργασίας', cs: 'Naléhavá pracovní schůzka', ro: 'Ședință de lucru urgentă', hu: 'Sürgős munkaértekezlet', zh: '紧急工作会议', ja: '緊急のビジネス会議',
      ko: '긴급 업무 회의', hi: 'अत्यावश्यक व्यावसायिक बैठक', ur: 'فوری کاروباری میٹنگ', bn: 'জরুরী কাজের বৈঠক', id: 'Rapat kerja mendesak', ms: 'Mesyuarat kerja penting',
      vi: 'Cuộc họp công việc khẩn cấp', th: 'การประชุมด่วน', tl: 'Agarang pulong sa trabaho', ku: 'کۆبوونەوەی بەپەلەی کار', az: 'Təcili iş görüşü', he: 'פגישת עבודה דחופה',
      hy: 'Հրատապ աշխատանքային հանդիպում', ka: 'გადაუდებელი საქმიანი შეხვედრა'
    }
  },
  {
    id: 'C_WORK_COLLAB',
    topic: 'CAT_WORK',
    level: 'B2',
    difficulty: 'hard',
    words: {
      fa: 'همکاری موفقیت‌آمیز', en: 'Successful collaboration', 'en-US': 'Successful collaboration', nl: 'Succesvolle samenwerking', de: 'Erfolgreiche Zusammenarbeit', fr: 'Collaboration fructueuse',
      es: 'Colaboración exitosa', it: 'Collaborazione di successo', ar: 'تعاون ناجح ومثمر', tr: 'Başarılı işbirliği', ru: 'Успешное сотрудничество', pt: 'Colaboração bem-sucedida',
      sv: 'Framgångsrikt samarbete', no: 'Vellykket samarbeid', da: 'Succesfuldt samarbejde', fi: 'Onnistunut yhteistyö', pl: 'Owocna współpraca', uk: 'Успішна співпраця',
      el: 'Επιτυχής συνεργασία', cs: 'Úspěšná spolupráce', ro: 'Colaborare de succes', hu: 'Sikeres együttműködés', zh: '成功的合作', ja: '実りある共同作業',
      ko: '성공적인 협력', hi: 'सफल सहयोग', ur: 'کامیاب تعاون', bn: 'সফল সহযোগিতা', id: 'Kolaborasi sukses', ms: 'Kerjasama berjaya',
      vi: 'Sự hợp tác thành công', th: 'ความร่วมมือที่ประสบความสำเร็จ', tl: 'Matagumpay na pagtutulungan', ku: 'هاوکارییەکی سەرکەوتوو', az: 'Uğurlu əməkdaşlıq', he: 'שיתוף פעולה מוצלח',
      hy: 'Հաջող համագործակցություն', ka: 'წარმატებული თანამშრომლობა'
    }
  },
  {
    id: 'C_SMALLTALK_COFFEE',
    topic: 'CAT_SMALLTALK',
    level: 'B1',
    difficulty: 'medium',
    words: {
      fa: 'گپ دوستانه عصرانه', en: 'Afternoon coffee chat', 'en-US': 'Afternoon coffee chat', nl: 'Gezellige koffieklets', de: 'Gemütliche Kaffeepause', fr: 'Pause café conviviale',
      es: 'Charla de café con amigos', it: 'Chiacchierata davanti a un caffè', ar: 'دردشة قهوة ودية', tr: 'Kahve eşliğinde sohbet', ru: 'Дружеская беседа за кофе', pt: 'Conversa agradável de café',
      sv: 'Trevlig fikastund', no: 'Koselig kaffeprat', da: 'Hyggelig kaffesnak', fi: 'Mukava kahvihetki', pl: 'Pogawędka przy kawie', uk: 'Дружня розмова за кавою',
      el: 'Φιλική κουβέντα για καφέ', cs: 'Povídání u kávy', ro: 'Discuție plăcută la o cafea', hu: 'Kellemes kávézás beszélgetéssel', zh: '午后咖啡闲聊', ja: 'お茶をしながらの雑談',
      ko: '커피 한잔하며 나누는 수다', hi: 'कॉफ़ी पर अनौपचारिक बातचीत', ur: 'کافی پر دوستانہ گفتگو', bn: 'কফি আড্ডার আলাপচারিতা', id: 'Ngobrol santai sambil ngopi', ms: 'Sembang santai minum kopi',
      vi: 'Trò chuyện bên tách cà phê', th: 'คุยเล่นระหว่างดื่มกาแฟ', tl: 'Kuwentuhan habang nagkakape', ku: 'قسەکردنی دۆستانە بە قاوەوە', az: 'Qəhvə arxasında dost söhbəti', he: 'שיחת קפה נעימה',
      hy: 'Ընկերական զրույց սուրճի շուրج', ka: 'მეგობრული საუბარი ყავაზე'
    }
  },
  {
    id: 'C_HEALTH_HOSPITAL',
    topic: 'CAT_HEALTH',
    level: 'A2',
    difficulty: 'medium',
    words: {
      fa: 'بخش اورژانس بیمارستان', en: 'Emergency room department', 'en-US': 'Emergency room', nl: 'Spoedeisende hulp (SEH)', de: 'Notaufnahme', fr: 'Service des urgences',
      es: 'Sala de urgencias', it: 'Pronto soccorso', ar: 'قسم الطوارئ بالمستشفى', tr: 'Acil servis bölümü', ru: 'Отделение скорой помощи', pt: 'Serviço de urgência',
      sv: 'Akutmottagning', no: 'Akuttmottak', da: 'Skadestue', fi: 'Ensiapu', pl: 'Szpitalny oddział ratunkowy (SOR)', uk: 'Відділення невідкладної допомоги',
      el: 'Τμήμα επειγόντων περιστατικών', cs: 'Pohotovost', ro: 'Unitate de primiri urgențe', hu: 'Sürgősségi osztály', zh: '医院急诊室', ja: '病院の救急救命室',
      ko: '병원 응급실', hi: 'आपातकालीन कक्ष विभाग', ur: 'ایمرجنسی وارڈ', bn: 'জরুরী বিভাগ', id: 'Instalasi gawat darurat (IGD)', ms: 'Jabatan kecemasan',
      vi: 'Phòng cấp cứu bệnh viện', th: 'แผนกฉุกเฉิน', tl: 'Kagawaran ng emergency', ku: 'بەشی فریاکەوتنی خێرا', az: 'Təcili yardım şöbəsi', he: 'חדר מיון',
      hy: 'Շտապօգնության բաժանմունք', ka: 'სასწრაფო დახმარების განყოფილება'
    }
  },
  {
    id: 'C_EVERYDAY_KEY',
    topic: 'CAT_EVERYDAY',
    level: 'A1',
    difficulty: 'easy',
    words: {
      fa: 'کلید خانه', en: 'House key', 'en-US': 'House key', nl: 'Huissleutel', de: 'Hausschlüssel', fr: 'Clé de maison',
      es: 'Llave de casa', it: 'Chiave di casa', ar: 'مفتاح المنزل', tr: 'Ev anahtarı', ru: 'Ключ от дома', pt: 'Chave de casa',
      sv: 'Husnyckel', no: 'Husnøkkel', da: 'Husnøgle', fi: 'Kotiavain', pl: 'Klucz do domu', uk: 'Ключ від дому',
      el: 'Κλειδί σπιτιού', cs: 'Klíč od domu', ro: 'Cheia casei', hu: 'Lakáskulcs', zh: '家门钥匙', ja: '家の鍵',
      ko: '집 열쇠', hi: 'घर की चाबी', ur: 'گھر کی چابی', bn: 'বাড়ির চাবি', id: 'Kunci rumah', ms: 'Kunci rumah',
      vi: 'Chìa khóa nhà', th: 'กุญแจบ้าน', tl: 'Susi ng bahay', ku: 'کلیلی ماڵ', az: 'Ev açarı', he: 'מפתח הבית',
      hy: 'Տան բանալի', ka: 'სახლის გასაღები'
    }
  }
];

/**
 * Fallback dictionary generator when a language pair is tested
 * Generates verified cards between ANY Target Language and ANY Native Language
 */
export function buildCardsFromConcepts(
  targetLanguage: Language,
  nativeLanguage: Language,
  cefrLevel: CEFRLevel = 'all',
  selectedCategories: string[] = [],
  isReverse: boolean = false
): LanguageCard[] {
  const isEnNative = nativeLanguage === 'en' || nativeLanguage === 'en-US';
  const targetInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
  const targetLangDisplayName = isEnNative 
    ? (targetInfo?.name || targetLanguage)
    : (targetInfo?.nativeName || targetLanguage);

  return UNIVERSAL_CONCEPTS.filter(c => {
    const levelMatch = cefrLevel === 'all' || c.level === cefrLevel;
    const catMatch = selectedCategories.length === 0 || selectedCategories.includes(c.topic);
    return levelMatch && catMatch;
  }).map((concept, idx) => {
    const targetText = concept.words[targetLanguage] || concept.words['en-US'] || concept.words['en'] || 'Phrase';
    const translation = concept.words[nativeLanguage] 
      || (isEnNative ? (concept.words['en-US'] || concept.words['en'] || targetText) : (concept.words['fa'] || concept.words['en'] || targetText));

    const shouldReverse = isReverse || (idx % 3 === 0);
    const learningMode: LearningMode = shouldReverse ? 'Reverse' : (concept.difficulty === 'easy' ? 'Explain' : 'Speak');

    return {
      id: `UNI_${concept.id}_${targetLanguage}_${nativeLanguage}`,
      targetLanguage,
      nativeLanguage,
      cefrLevel: concept.level,
      topic: concept.topic,
      contentType: concept.difficulty === 'easy' ? 'Vocabulary' : 'Phrase',
      learningMode,
      prompt: getPromptForCard(learningMode, nativeLanguage, targetLangDisplayName, shouldReverse),
      targetText: shouldReverse ? targetText : targetText,
      translation,
      hint: concept.topic.replace('CAT_', ''),
      difficulty: concept.difficulty,
      points: concept.difficulty === 'easy' ? 1 : concept.difficulty === 'medium' ? 2 : 3,
      isGolden: idx % 6 === 0,
      isReverse: shouldReverse
    };
  });
}
