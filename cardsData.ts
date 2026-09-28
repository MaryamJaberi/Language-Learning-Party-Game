import { Language, CEFRLevel, LanguageCard, ContentType, LearningMode, CardGameMode } from './types';
import { WORD_BANK } from './words';
import { cardsFromPhraseBank } from './phraseBank';
import { getC1CardsForSession } from './c1SentencesData';
import { buildCardsFromConcepts, getPromptForCard, UNIVERSAL_CONCEPTS } from './multiLangDictionary';
import { SUPPORTED_LANGUAGES } from './constants';

// Rich Curated Language Cards Database
export const CURATED_LANGUAGE_CARDS: LanguageCard[] = [
  // ==========================================
  // AMERICAN ENGLISH (en-US) - A1 to C1
  // ==========================================
  {
    id: 'EN_US_A1_REST_01',
    targetLanguage: 'en-US',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'در رستوران یا دایز آمریکایی می‌خواهی صورتحساب را بخواهی',
    targetText: 'Check, please!',
    translation: 'صورتحساب، لطفاً!',
    hint: 'در انگلیسی آمریکایی به جای bill می‌گویند check',
    grammarPoint: 'American Restaurant Phrasing: Check, please',
    pronunciation: 'چِک، پلیز!',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_US_A1_REST_02',
    targetLanguage: 'en-US',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Sentence',
    learningMode: 'Speak',
    prompt: 'سفارش غذای بیرون‌بر در فست‌فود آمریکایی',
    targetText: 'Can I get this to-go, please?',
    translation: 'می‌تونم این رو بیرون‌بر داشته باشم، لطفاً؟',
    hint: 'عبارت to-go برای غذای بیرون‌بر',
    grammarPoint: 'Modal request: Can I get ... to-go?',
    pronunciation: 'کَن آی گِت دیس تو-گو، پلیز؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_US_A1_EVERYDAY_01',
    targetLanguage: 'en-US',
    cefrLevel: 'A1',
    topic: 'CAT_EVERYDAY',
    contentType: 'Sentence',
    learningMode: 'Speak',
    prompt: 'احوالپرسی روزمره و خودمانی به سبک آمریکایی',
    targetText: "How's it going, buddy?",
    translation: 'اوضاع چطوره رفیق؟',
    hint: "How's it going...",
    grammarPoint: 'Informal greeting contraction',
    pronunciation: 'هاوز ایت گوئینگ، بادی؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_US_A1_TRANSPORT_01',
    targetLanguage: 'en-US',
    cefrLevel: 'A1',
    topic: 'CAT_TRANSPORT',
    contentType: 'Sentence',
    learningMode: 'Explain',
    prompt: 'پرسیدن آدرس نزدیک‌ترین ایستگاه مترو در نیویورک',
    targetText: 'Where is the nearest subway station?',
    translation: 'نزدیک‌ترین ایستگاه مترو کجاست؟',
    hint: 'در آمریکا به مترو Subway می‌گویند',
    grammarPoint: 'Superlative: nearest subway station',
    pronunciation: 'وِر ایز دِ نیرِست ساب‌وی استِیشِن؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_US_A2_SHOPPING_01',
    targetLanguage: 'en-US',
    cefrLevel: 'A2',
    topic: 'CAT_SHOPPING',
    contentType: 'Sentence',
    learningMode: 'Translate',
    prompt: 'خرد کردن یک اسکناس بیست دلاری در فروشگاه',
    targetText: 'Could you break a twenty-dollar bill for me?',
    translation: 'می‌تونید یه اسکناس بیست دلاری برام خرد کنید؟',
    hint: 'break a twenty-dollar bill',
    grammarPoint: 'Collocation: break a bill (اسکناس خرد کردن)',
    pronunciation: 'کود یو برِیک اِ توئنتی دالِر بیل فور می؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_US_A2_EVERYDAY_02',
    targetLanguage: 'en-US',
    cefrLevel: 'A2',
    topic: 'CAT_EVERYDAY',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'اعلام اینکه چند دقیقه دیر می‌رسید',
    targetText: "I'm running a few minutes late.",
    translation: 'چند دقیقه دیر می‌رسم.',
    hint: 'running late',
    grammarPoint: 'Continuous idiom: running late',
    pronunciation: 'آیم رانینگ اِ فیو مینیتس لِیت',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_US_B1_SMALLTALK_01',
    targetLanguage: 'en-US',
    cefrLevel: 'B1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'موکول کردن یک قرار یا دورهمی شام به زمانی دیگر (اصطلاح آمریکایی)',
    targetText: "Let's take a rain check on dinner.",
    translation: 'بیا شام رو بندازیم برای یه فرصت دیگه (موکول کردن)',
    hint: 'rain check اصطلاح معروف آمریکایی',
    grammarPoint: 'American Idiom: take a rain check',
    pronunciation: 'لِتس تِیک اِ رِین چِک آن دینِر',
    difficulty: 'medium',
    points: 2,
    isGolden: true
  },
  {
    id: 'EN_US_B1_TRAVEL_01',
    targetLanguage: 'en-US',
    cefrLevel: 'B1',
    topic: 'CAT_TRAVEL',
    contentType: 'Sentence',
    learningMode: 'Situation',
    prompt: 'درخواست پیاده شدن جلوی ترمینال فرودگاه از راننده',
    targetText: 'Can you drop me off at terminal two, please?',
    translation: 'میشه من رو دم ترمینال شماره دو پیاده کنید؟',
    hint: 'drop someone off یعنی پیاده کردن',
    grammarPoint: 'Phrasal verb: drop off',
    pronunciation: 'کَن یو دراپ می آف اَت تِرمینال تو، پلیز؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_US_B2_WORK_01',
    targetLanguage: 'en-US',
    cefrLevel: 'B2',
    topic: 'CAT_WORK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'با تمام قوا و بدون اتلاف وقت کاری را پرانرژی شروع کردن',
    targetText: 'Hit the ground running',
    translation: 'کار را با انرژی و قدرت تمام از همان اول شروع کردن',
    hint: 'اصطلاح کاری پرکاربرد آمریکایی',
    grammarPoint: 'Business Idiom: Hit the ground running',
    pronunciation: 'هیت دِ گراوند رانینگ',
    difficulty: 'hard',
    points: 3
  },
  {
    id: 'EN_US_B2_HEALTH_01',
    targetLanguage: 'en-US',
    cefrLevel: 'B2',
    topic: 'CAT_HEALTH',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'احساس کسالت یا سرماخوردگی خفیف داشتن',
    targetText: 'Under the weather',
    translation: 'کمی ناخوش‌احوال و کسل بودن',
    hint: 'under the weather',
    grammarPoint: 'Health idiom: Feeling under the weather',
    pronunciation: 'آندِر دِ وِدِر',
    difficulty: 'hard',
    points: 3
  },
  {
    id: 'EN_US_C1_SMALLTALK_01',
    targetLanguage: 'en-US',
    cefrLevel: 'C1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'گپ و گفت خودمانی و دوستانه زدن و وقت گذراندن',
    targetText: 'Shoot the breeze',
    translation: 'گپ زدن و وقت گذراندن با دوستان',
    hint: 'shoot the breeze اصطلاح خودمانی آمریکایی',
    grammarPoint: 'Conversational Slang: Shoot the breeze',
    pronunciation: 'شوت دِ breeze (بریز)',
    difficulty: 'hard',
    points: 3,
    isGolden: true
  },
  {
    id: 'EN_US_C1_WORK_02',
    targetLanguage: 'en-US',
    cefrLevel: 'C1',
    topic: 'CAT_WORK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'برای سنجش تمام جوانب، موقتاً نقش مخالف را بازی کردن',
    targetText: "Play devil's advocate",
    translation: 'نقش وکیل مدافع شیطان را بازی کردن (دیدگاه مخالف برای ارزیابی)',
    hint: "devil's advocate",
    grammarPoint: 'Idiomatic expression for critical analysis',
    pronunciation: 'پلِی دِویلز اَدووکِیت',
    difficulty: 'hard',
    points: 3
  },
  // ==========================================
  // DUTCH (Nederlands) - A1 / A2 / B1 / B2 / C1
  // ==========================================
  {
    id: 'NL_A1_REST_01',
    targetLanguage: 'nl',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'در رستوران می‌خواهی صورتحساب را درخواست کنی',
    targetText: 'Mag ik de rekening, alstublieft?',
    translation: 'می‌تونم صورتحساب رو داشته باشم، لطفاً؟',
    hint: 'از کلمه rekening و alstublieft استفاده کن',
    grammarPoint: 'الگوی مودبانه: Mag ik ... alstublieft?',
    pronunciation: 'ماخ ایک دِ رِیکِه‌نینگ، آلس‌توبلیفت؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'NL_A1_REST_02',
    targetLanguage: 'nl',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Vocabulary',
    learningMode: 'Explain',
    prompt: 'نوشیدنی گرم محبوب هلندی‌ها در کافه‌ها',
    targetText: 'Koffie verkeerd',
    translation: 'قهوه با شیر زیاد (لاته هلندی)',
    hint: 'ترکیبی از قهوه و کلمه "اشتباه/برعکس"',
    grammarPoint: 'اصطلاح کافه‌ای هلند',
    pronunciation: 'کُفی فِرکِیرد',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'NL_A1_EVERYDAY_01',
    targetLanguage: 'nl',
    cefrLevel: 'A1',
    topic: 'CAT_EVERYDAY',
    contentType: 'Sentence',
    learningMode: 'Speak',
    prompt: 'احوالپرسی روزمره و پرسیدن حال طرف مقابل',
    targetText: 'Hoe gaat het met jou?',
    translation: 'حالت چطوره؟ / اوضاعت چطوره؟',
    hint: 'Hoe gaat het...',
    grammarPoint: 'پرسش احوالپرسی غیررسمی',
    pronunciation: 'هو خات هِت مِت یاو؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'NL_A1_SHOPPING_01',
    targetLanguage: 'nl',
    cefrLevel: 'A1',
    topic: 'CAT_SHOPPING',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'در فروشگاه آلبرت هاین می‌خواهی قیمت یک جنس را بپرسی',
    targetText: 'Hoeveel kost dit?',
    translation: 'قیمت این چقدر است؟',
    hint: 'از کلمه hoeveel استفاده کن',
    grammarPoint: 'پرسش قیمت: Hoeveel kost...?',
    pronunciation: 'هو فِیل کُست دیت؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'NL_A2_TRANSPORT_01',
    targetLanguage: 'nl',
    cefrLevel: 'A2',
    topic: 'CAT_TRANSPORT',
    contentType: 'Situation',
    learningMode: 'Situation',
    prompt: 'در ایستگاه قطار آمستردام گم شدی و می‌پرسی قطار اوترخت از کدام سکو حرکت می‌کند',
    targetText: 'Vanaf welk spoor vertrekt de trein naar Utrecht?',
    translation: 'قطار اوترخت از کدام سکو حرکت می‌کند؟',
    hint: 'کلمه spoor یعنی سکو و vertrekken یعنی حرکت کردن',
    grammarPoint: 'حرف اضافه Vanaf + welk spoor',
    pronunciation: 'فان‌آف وِلک اسپور فِرتْرِکت دِ ترِین نار اوترِخت؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'NL_A2_WORK_01',
    targetLanguage: 'nl',
    cefrLevel: 'A2',
    topic: 'CAT_WORK',
    contentType: 'Sentence',
    learningMode: 'Translate',
    prompt: 'به همکارت می‌گویی فردا از خانه کار می‌کنی',
    targetText: 'Morgen werk ik vanuit huis.',
    translation: 'فردا از خانه کار می‌کنم.',
    hint: 'جای فعل و فاعل در ابتدای جمله با قید زمان (Inversion)',
    grammarPoint: 'قانون Inversion در هلندی: Morgen werk ik...',
    pronunciation: 'مُرخِن وِرک ایک فان‌آوت هاوس',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'NL_B1_SMALLTALK_01',
    targetLanguage: 'nl',
    cefrLevel: 'B1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'مفهوم معروف هلندی برای دنج بودن، حس گرما و صمیمیت در دورهمی',
    targetText: 'Gezelligheid',
    translation: 'حس دنجی، صفای دورهمی و حال خوش جمعی',
    hint: 'معروف‌ترین صفت و اسم فرهنگی هلند',
    grammarPoint: 'اسم انتزاعی فرهنگی (Ge-zellig-heid)',
    pronunciation: 'خِزِلِیخ‌هایت',
    difficulty: 'medium',
    points: 2,
    isGolden: true
  },
  {
    id: 'NL_B1_HEALTH_01',
    targetLanguage: 'nl',
    cefrLevel: 'B1',
    topic: 'CAT_HEALTH',
    contentType: 'Situation',
    learningMode: 'Situation',
    prompt: 'تماس با پزشک عمومی (Huisarts) برای گرفتن وقت ویزیت',
    targetText: 'Ik wil graag een afspraak maken met de dokter.',
    translation: 'می‌خواهم با دکتر وقت ملاقات بگیرم.',
    hint: 'afspraak maken یعنی وقت گرفتن',
    grammarPoint: 'ساختار مودبانه: Ik wil graag ... maken',
    pronunciation: 'ایک ویل خراخ اِن آفرسپراک ماکِن مِت دِ دُکتِر',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'NL_B2_SOCIAL_01',
    targetLanguage: 'nl',
    cefrLevel: 'B2',
    topic: 'CAT_SOCIAL',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'رسم هلندی‌ها که هرکس در مهمانی یا رستوران دُنگ خودش را حساب می‌کند',
    targetText: 'Going Dutch / Ieder betaalt voor zich',
    translation: 'دُنگی حساب کردن / هرکس سهم خودش را می‌پردازد',
    hint: 'اصطلاح تقسیم مساوی صورتحساب',
    grammarPoint: 'Wederkerend voornaamwoord (voor zich)',
    pronunciation: 'ایدر بِتالت فور زیخ',
    difficulty: 'hard',
    points: 3
  },
  {
    id: 'NL_C1_IDIOM_01',
    targetLanguage: 'nl',
    cefrLevel: 'C1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'ضرب‌المثل هلندی: وقتی کسی کاری را با پشتکار و دقت تمام به سرانجام می‌رساند',
    targetText: 'De puntjes op de i zetten',
    translation: 'نقطه روی حرف آی گذاشتن (کار را بی‌نقص و تمام و کمال انجام دادن)',
    hint: 'درباره نقطه گذاشتن روی حروف است',
    grammarPoint: 'ضرب‌المثل کنایی اصیل زبان هلندی',
    pronunciation: 'دِ پونتیِس اُپ دِ ای زِتِن',
    difficulty: 'hard',
    points: 4,
    isGolden: true
  },

  // ==========================================
  // ENGLISH - A1 / A2 / B1 / B2 / C1
  // ==========================================
  {
    id: 'EN_A1_REST_01',
    targetLanguage: 'en',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Ordering water at a cafe or restaurant politely',
    targetText: 'Could I have a glass of water, please?',
    translation: 'می‌تونم یک لیوان آب داشته باشم، لطفاً؟',
    hint: 'Use "Could I have..."',
    grammarPoint: 'Polite request with modal verb Could',
    pronunciation: 'کود آی هَو اِ گلَس آو واتِر، پِلیز؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_A1_REST_02',
    targetLanguage: 'en',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Asking for the bill/check at a restaurant',
    targetText: 'Could we get the bill, please?',
    translation: 'می‌تونیم صورتحساب رو داشته باشیم، لطفاً؟',
    hint: 'Ask for the bill or check',
    grammarPoint: 'Polite question with "Could we get..."',
    pronunciation: 'کود وی گِت دِ بیل، پلیز؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_A1_EVERYDAY_01',
    targetLanguage: 'en',
    cefrLevel: 'A1',
    topic: 'CAT_EVERYDAY',
    contentType: 'Sentence',
    learningMode: 'Speak',
    prompt: 'Introducing where you live in a friendly introduction',
    targetText: 'Nice to meet you, I live in Amsterdam.',
    translation: 'از دیدنتون خوشحالم، من در آمستردام زندگی می‌کنم.',
    hint: 'Nice to meet you...',
    grammarPoint: 'Present Simple for permanent states',
    pronunciation: 'نایس تو میت یو، آی لیو این آمستردام',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_A1_SHOPPING_01',
    targetLanguage: 'en',
    cefrLevel: 'A1',
    topic: 'CAT_SHOPPING',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Asking the price of an item in a clothing store',
    targetText: 'How much is this jacket?',
    translation: 'این کاپشن چنده؟',
    hint: 'How much is...',
    grammarPoint: 'Asking price with How much is + singular noun',
    pronunciation: 'هاو ماچ ایز دیس جَکِت؟',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'EN_A2_TRAVEL_01',
    targetLanguage: 'en',
    cefrLevel: 'A2',
    topic: 'CAT_TRAVEL',
    contentType: 'Situation',
    learningMode: 'Situation',
    prompt: 'Asking for flight gate directions at the international airport',
    targetText: 'Excuse me, which gate is boarding for flight 204?',
    translation: 'ببخشید، پرواز شماره ۲۰۴ از کدام گیت سوار می‌کند؟',
    hint: 'Which gate is boarding...',
    grammarPoint: 'Wh- questions with Present Continuous',
    pronunciation: 'اکسکیوز می، ویچ گیت ایز بوردینگ فور فلایت تو زیرو فور؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_A2_FOOD_01',
    targetLanguage: 'en',
    cefrLevel: 'A2',
    topic: 'CAT_FOOD',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Asking about vegetarian or allergy options on the menu',
    targetText: 'Do you have any vegetarian options?',
    translation: 'آیا گزینه گیاه‌خواری دارید؟',
    hint: 'Do you have any...',
    grammarPoint: 'Present simple question with "any"',
    pronunciation: 'دو یو هَو اِنی وِجِتِریَن آپشِنز؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_A2_HOTEL_01',
    targetLanguage: 'en',
    cefrLevel: 'A2',
    topic: 'CAT_TRAVEL',
    contentType: 'Situation',
    learningMode: 'Situation',
    prompt: 'Checking in at a hotel with a prior reservation',
    targetText: 'Hello, I have a reservation under the name Smith.',
    translation: 'سلام، من یک رزرو به نام اسمیت دارم.',
    hint: 'I have a reservation under...',
    grammarPoint: 'Preposition "under" used for names on bookings',
    pronunciation: 'هِلُو، آی هَو اِ رِزِروِیشِن آندِر دِ نِیم اسمیت',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_B1_WORK_01',
    targetLanguage: 'en',
    cefrLevel: 'B1',
    topic: 'CAT_WORK',
    contentType: 'Sentence',
    learningMode: 'Explain',
    prompt: 'Explaining a project deadline adjustment during a team sync',
    targetText: 'We need to reschedule the deadline to next Friday.',
    translation: 'باید ددلاین (موعد تحویل) را به جمعه آینده موکول کنیم.',
    hint: 'reschedule deadline',
    grammarPoint: 'Infinitive with need to + verb',
    pronunciation: 'وی نید تو ریسکِجول دِ دِدلاین تو نِکست فرایدِی',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_B1_WORK_02',
    targetLanguage: 'en',
    cefrLevel: 'B1',
    topic: 'CAT_WORK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Asking a colleague to follow up via email after a meeting',
    targetText: 'Could you shoot me an email with the summary?',
    translation: 'می‌تونی برام یک ایمیل حاوی خلاصه جلسه بفرستی؟',
    hint: 'shoot an email (send quickly)',
    grammarPoint: 'Idiomatic business phrase: shoot someone an email',
    pronunciation: 'کود یو شوت می اَن ایمیل ویت دِ سامِری؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_B1_SMALLTALK_01',
    targetLanguage: 'en',
    cefrLevel: 'B1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Expressing that you agree completely with someone',
    targetText: 'You took the words right out of my mouth!',
    translation: 'دقیقاً حرف دل من رو زدی!',
    hint: 'Words out of my mouth',
    grammarPoint: 'Conversational agreement idiom',
    pronunciation: 'یو توک دِ وُردز رایت آوت آو مای ماوث!',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'EN_B2_IDIOM_01',
    targetLanguage: 'en',
    cefrLevel: 'B2',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Famous English idiom meaning to face a difficult situation with courage',
    targetText: 'Bite the bullet',
    translation: 'دندان روی جگر گذاشتن / با شجاعت با سختی روبرو شدن',
    hint: 'Something about biting something metallic',
    grammarPoint: 'Metaphorical English idiom',
    pronunciation: 'بایت دِ بولِت',
    difficulty: 'hard',
    points: 3,
    isGolden: true
  },
  {
    id: 'EN_B2_WORK_01',
    targetLanguage: 'en',
    cefrLevel: 'B2',
    topic: 'CAT_WORK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Business idiom: To think creatively outside standard boundaries',
    targetText: 'Think outside the box',
    translation: 'خلاقانه و فراتر از چارچوب‌های معمول فکر کردن',
    hint: 'Outside the box...',
    grammarPoint: 'Metaphorical compound phrase',
    pronunciation: 'ثینک آوت‌ساید دِ باکس',
    difficulty: 'hard',
    points: 3
  },
  {
    id: 'EN_B2_IDIOM_02',
    targetLanguage: 'en',
    cefrLevel: 'B2',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Idiom meaning to reveal a secret unintentionally',
    targetText: 'Spill the beans',
    translation: 'لو دادن راز / بند را آب دادن',
    hint: 'Spilling something from a kitchen',
    grammarPoint: 'Colloquial idiom',
    pronunciation: 'اسپیل دِ بینز',
    difficulty: 'hard',
    points: 3,
    isGolden: true
  },
  {
    id: 'EN_C1_IDIOM_01',
    targetLanguage: 'en',
    cefrLevel: 'C1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'English proverb: Do not reveal a secret prematurely before the event',
    targetText: 'Don\'t let the cat out of the bag',
    translation: 'بند را به آب نده / راز را فاش نکن',
    hint: 'An animal coming out of a bag',
    grammarPoint: 'Imperative idiom with negative auxiliary',
    pronunciation: 'دُنت لِت دِ کَت آوت آو دِ بَگ',
    difficulty: 'hard',
    points: 4,
    isGolden: true
  },
  {
    id: 'EN_C1_BUSINESS_01',
    targetLanguage: 'en',
    cefrLevel: 'C1',
    topic: 'CAT_WORK',
    contentType: 'Sentence',
    learningMode: 'Explain',
    prompt: 'High-level business English: Balancing short-term gains against sustainable long-term growth',
    targetText: 'We must avoid cutting corners at the expense of product integrity.',
    translation: 'نباید به بهای آسیب به اصالت و کیفیت محصول، سمبل‌کاری کنیم.',
    hint: 'cutting corners at the expense of...',
    grammarPoint: 'Prepositional phrase: at the expense of + noun',
    pronunciation: 'وی ماست اِوُید کاتینگ کُرنِرز اَت دِ اکسپِنس آو پروداکت اینتِگریتی',
    difficulty: 'hard',
    points: 4,
    isGolden: true
  },

  // ==========================================
  // GERMAN (Deutsch) - A1 / A2 / B1 / B2 / C1
  // ==========================================
  {
    id: 'DE_A1_REST_01',
    targetLanguage: 'de',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'In a German bakery, ordering two fresh bread rolls politely',
    targetText: 'Ich hätte gern zwei Brötchen, bitte.',
    translation: 'دو تا نان گرد کوچک می‌خواستم، لطفاً.',
    hint: 'Ich hätte gern...',
    grammarPoint: 'Konjunktiv II for polite ordering',
    pronunciation: 'ایش هِته گِرن تسوای بروتشِن، بیته',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'DE_A2_CITY_01',
    targetLanguage: 'de',
    cefrLevel: 'A2',
    topic: 'CAT_CITY',
    contentType: 'Situation',
    learningMode: 'Situation',
    prompt: 'Asking where the nearest metro station (U-Bahn) is located',
    targetText: 'Entschuldigung, wo ist die nächste U-Bahn-Station?',
    translation: 'ببخشید، نزدیک‌ترین ایستگاه مترو کجاست؟',
    hint: 'wo ist die nächste...',
    grammarPoint: 'Superlative adjective with feminine noun (die nächste)',
    pronunciation: 'اِنت‌شولدیگونگ، وو ایست دی نِکستِه او-بان استاسیون؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'DE_B1_WORK_01',
    targetLanguage: 'de',
    cefrLevel: 'B1',
    topic: 'CAT_WORK',
    contentType: 'Sentence',
    learningMode: 'Translate',
    prompt: 'Sending an email confirming participation in tomorrow\'s meeting',
    targetText: 'Ich bestätige gerne meine Teilnahme am Meeting.',
    translation: 'با کمال میل حضورم در جلسه را تایید می‌کنم.',
    hint: 'bestätigen + Teilnahme',
    grammarPoint: 'Akkusativ object with feminine noun (meine Teilnahme)',
    pronunciation: 'ایش بِشتِتیگه گِرنه ماینه تایل‌نامه آم میتینگ',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'DE_B2_IDIOM_01',
    targetLanguage: 'de',
    cefrLevel: 'B2',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'German idiom meaning wishing someone good luck by pressing thumbs',
    targetText: 'Ich drücke dir die Daumen!',
    translation: 'برایت آرزوی موفقیت می‌کنم! / انگشتامو برات فشار می‌دم!',
    hint: 'Something with thumbs (Daumen)',
    grammarPoint: 'Dativ recipient (dir) + Akkusativ object (die Daumen)',
    pronunciation: 'ایش دروکِه دیر دی داومِن',
    difficulty: 'hard',
    points: 3,
    isGolden: true
  },

  // ==========================================
  // FRENCH (Français) - A1 / A2 / B1 / B2 / C1
  // ==========================================
  {
    id: 'FR_A1_REST_01',
    targetLanguage: 'fr',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Ordering a croissant and espresso at a Parisian cafe',
    targetText: 'Un croissant et un café, s\'il vous plaît.',
    translation: 'یک کروسان و یک قهوه، لطفاً.',
    hint: 's\'il vous plaît',
    grammarPoint: 'Masculine articles (un) + Polite marker',
    pronunciation: 'آن کْغواسان اِ آن کافه، سیل وو پْله',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'FR_A2_SHOPPING_01',
    targetLanguage: 'fr',
    cefrLevel: 'A2',
    topic: 'CAT_SHOPPING',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Asking if you can pay with card in a shop',
    targetText: 'Est-ce que je peux payer par carte ?',
    translation: 'آیا می‌توانم با کارت پرداخت کنم؟',
    hint: 'payer par carte',
    grammarPoint: 'Question structure: Est-ce que + modal peux',
    pronunciation: 'اِس کِه ژُ پو پِیه پاغ کاغت؟',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'FR_B1_SMALLTALK_01',
    targetLanguage: 'fr',
    cefrLevel: 'B1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Sentence',
    learningMode: 'Translate',
    prompt: 'Telling a friend that everything will turn out fine in the end',
    targetText: 'Ne t\'inquiète pas, tout va bien se passer.',
    translation: 'نگران نباش، همه چیز خوب پیش خواهد رفت.',
    hint: 'se passer = to happen',
    grammarPoint: 'Futur Proche (aller + infinitif)',
    pronunciation: 'نو تَنکیِت پا، تو وا بیَن سو پَسه',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'FR_B2_IDIOM_01',
    targetLanguage: 'fr',
    cefrLevel: 'B2',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Famous French idiom meaning to cost an arm and a leg / extremely expensive',
    targetText: 'Ça coûte les yeux de la tête',
    translation: 'خیلی گران است / چشم و چال آدم را درمی‌آورد!',
    hint: 'Something about eyes of the head',
    grammarPoint: 'Metaphorical expression for high prices',
    pronunciation: 'سا کوت لِزیُو دُو لا تِت',
    difficulty: 'hard',
    points: 3,
    isGolden: true
  },

  // ==========================================
  // PERSIAN (فارسی) - A1 / A2 / B1 / B2 / C1
  // ==========================================
  {
    id: 'FA_A1_REST_01',
    targetLanguage: 'fa',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'در رستوران یا کافه برای سفارش چای با قند',
    targetText: 'یک چای داغ با قند لطفاً',
    translation: 'A hot tea with sugar cubes, please',
    hint: 'از کلمه چای و قند استفاده کن',
    grammarPoint: 'ترکیب وصفی: چای داغ',
    pronunciation: 'Yek chaaye daagh baa ghand lotfan',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'FA_A2_TRAVEL_01',
    targetLanguage: 'fa',
    cefrLevel: 'A2',
    topic: 'CAT_TRAVEL',
    contentType: 'Situation',
    learningMode: 'Situation',
    prompt: 'پرسیدن آدرس نزدیک‌ترین ایستگاه مترو از عابر در خیابان',
    targetText: 'ببخشید، نزدیک‌ترین ایستگاه مترو کجاست؟',
    translation: 'Excuse me, where is the nearest metro station?',
    hint: 'ایستگاه مترو',
    grammarPoint: 'صفت برترین: نزدیک‌ترین',
    pronunciation: 'Bebakhshid, nazdiktarin istgah-e metro kojaast?',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'FA_B1_SMALLTALK_01',
    targetLanguage: 'fa',
    cefrLevel: 'B1',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'اصطلاح تعارف ایرانی برای تعارف صمیمانه غذا یا خدمت به مهمان',
    targetText: 'بفرمایید، نوش جان!',
    translation: 'Please help yourself, Bon Appétit!',
    hint: 'اصطلاح مهمانداری و غذا خوردن',
    grammarPoint: 'جمله دعایی و تعارفی متداول',
    pronunciation: 'Befarmaayid, noosh-e jaan!',
    difficulty: 'medium',
    points: 2
  },
  {
    id: 'FA_B2_IDIOM_01',
    targetLanguage: 'fa',
    cefrLevel: 'B2',
    topic: 'CAT_SMALLTALK',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'ضرب‌المثل اصیل فارسی: نباید قبل از رسیدن به نتیجه قطعی مغرور شد',
    targetText: 'جوجه را آخر پاییز می‌شمارند',
    translation: 'Don\'t count your chickens before they hatch',
    hint: 'درباره شمردن جوجه در فصل پاییز است',
    grammarPoint: 'ضرب‌المثل تمثیلی کنایی',
    pronunciation: 'Joojeh raa aakhar-e paayeez mishomaarand',
    difficulty: 'hard',
    points: 3,
    isGolden: true
  },

  // ==========================================
  // TURKISH (Türkçe) - A1 / A2 / B1
  // ==========================================
  {
    id: 'TR_A1_REST_01',
    targetLanguage: 'tr',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'Ordering Turkish tea at a cafe in Istanbul',
    targetText: 'Bir bardak çay lütfen',
    translation: 'یک استکان چای لطفاً',
    hint: 'Bir bardak çay...',
    grammarPoint: 'Unit noun (bardak) with noun (çay)',
    pronunciation: 'بیر بارداک چای لوتفَن',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'TR_A2_EVERYDAY_01',
    targetLanguage: 'tr',
    cefrLevel: 'A2',
    topic: 'CAT_EVERYDAY',
    contentType: 'Sentence',
    learningMode: 'Speak',
    prompt: 'Greeting and asking how someone is doing politely',
    targetText: 'Nasılsınız? İyiyim, teşekkür ederim.',
    translation: 'حالتون چطوره؟ خوبم، تشکر می‌کنم.',
    hint: 'Nasılsınız...',
    grammarPoint: 'Formal 2nd person suffix (-sınız)',
    pronunciation: 'ناسیل‌سینیز؟ اییم، تِشِکّور اِدِریم',
    difficulty: 'easy',
    points: 1
  },

  // ==========================================
  // ARABIC (العربية) - A1 / A2 / B1
  // ==========================================
  {
    id: 'AR_A1_REST_01',
    targetLanguage: 'ar',
    cefrLevel: 'A1',
    topic: 'CAT_RESTAURANT',
    contentType: 'Phrase',
    learningMode: 'Explain',
    prompt: 'طلب الحساب في المطعم أو المقهى بلباقة',
    targetText: 'الحساب، لو سمحت',
    translation: 'صورتحساب، لطفاً',
    hint: 'الحساب',
    grammarPoint: 'النداء المهذب: لو سمحت',
    pronunciation: 'Al-hisaab, law samaht',
    difficulty: 'easy',
    points: 1
  },
  {
    id: 'AR_A2_EVERYDAY_01',
    targetLanguage: 'ar',
    cefrLevel: 'A2',
    topic: 'CAT_EVERYDAY',
    contentType: 'Sentence',
    learningMode: 'Speak',
    prompt: 'التحية والسؤال عن الحال بلباقة وترحاب',
    targetText: 'أهلاً وسهلاً، كيف حالك اليوم؟',
    translation: 'خوش آمدید، امروز حالتون چطوره؟',
    hint: 'أهلاً وسهلاً',
    grammarPoint: 'جملة التحية والاستفهام',
    pronunciation: 'Ahlan wa sahlan, kayfa haaluka al-yawm?',
    difficulty: 'easy',
    points: 1
  }
];

// English translations & prompts for curated cards when nativeLanguage is English (US or UK)
export const CURATED_EN_TRANSLATIONS: Record<string, { translation: string; prompt?: string; hint?: string }> = {
  // Dutch
  'NL_A1_REST_01': { translation: 'May I have the check, please?', prompt: 'In a Dutch restaurant, ask for the bill/check politely.', hint: 'Use "Mag ik de rekening, alstublieft?"' },
  'NL_A1_REST_02': { translation: 'Dutch latte / coffee with lots of warm milk', prompt: 'Popular Dutch warm coffee served in cafes with lots of milk.', hint: 'Koffie verkeerd' },
  'NL_A1_EVERYDAY_01': { translation: 'How are you doing?', prompt: 'Casual Dutch everyday greeting asking how someone is.', hint: 'Hoe gaat het met jou?' },
  'NL_A1_SHOPPING_01': { translation: 'How much does this cost?', prompt: 'In a supermarket or store, asking the price of an item.', hint: 'Hoeveel kost dit?' },
  'NL_A2_TRANSPORT_01': { translation: 'Which platform does the train to Utrecht depart from?', prompt: 'At Amsterdam Centraal, asking for the departure platform.', hint: 'Vanaf welk spoor vertrekt de trein...?' },
  'NL_A2_WORK_01': { translation: 'Tomorrow I am working from home.', prompt: 'Telling your colleague you will work from home tomorrow.', hint: 'Morgen werk ik vanuit huis.' },
  'NL_B1_SMALLTALK_01': { translation: 'Cozy togetherness / warm convivial atmosphere', prompt: 'Famous Dutch cultural concept for cozy warmth and togetherness.', hint: 'Gezelligheid' },
  'NL_B1_HEALTH_01': { translation: 'I would like to make an appointment with the doctor.', prompt: 'Calling the general practitioner (Huisarts) to book a visit.', hint: 'afspraak maken met de dokter' },
  'NL_B2_SOCIAL_01': { translation: 'Going Dutch / each person pays for themselves', prompt: 'Dutch tradition of splitting the bill so each person pays their own share.', hint: 'Ieder betaalt voor zich' },
  'NL_C1_IDIOM_01': { translation: 'Dotting the i’s and crossing the t’s (finishing flawlessly)', prompt: 'Dutch proverb: completing a project with thorough perfection.', hint: 'De puntjes op de i zetten' },

  // German
  'DE_A1_REST_01': { translation: 'I would like two bread rolls, please.', prompt: 'In a German bakery, politely ordering two fresh rolls.', hint: 'Ich hätte gern zwei Brötchen, bitte.' },
  'DE_A2_CITY_01': { translation: 'Excuse me, where is the nearest subway station?', prompt: 'Asking for the nearest metro station (U-Bahn) in the city.', hint: 'wo ist die nächste U-Bahn-Station?' },
  'DE_B1_WORK_01': { translation: 'I gladly confirm my participation in the meeting.', prompt: 'Replying to an email confirming you will attend tomorrow’s meeting.', hint: 'meine Teilnahme am Meeting' },
  'DE_B2_IDIOM_01': { translation: 'I’m keeping my fingers crossed for you! / Wishing you luck!', prompt: 'German idiom meaning wishing someone good luck by pressing thumbs.', hint: 'Ich drücke dir die Daumen!' },

  // French
  'FR_A1_REST_01': { translation: 'A croissant and an espresso, please.', prompt: 'Ordering a croissant and coffee at a Parisian cafe.', hint: 'Un croissant et un café, s\'il vous plaît.' },
  'FR_A2_SHOPPING_01': { translation: 'Can I pay by card?', prompt: 'Asking if card payments are accepted in a shop.', hint: 'Est-ce que je peux payer par carte ?' },
  'FR_B1_SMALLTALK_01': { translation: 'Don’t worry, everything is going to be fine.', prompt: 'Reassuring a friend that everything will turn out well.', hint: 'Ne t\'inquiète pas, tout va bien se passer.' },
  'FR_B2_IDIOM_01': { translation: 'It costs an arm and a leg / very expensive', prompt: 'French idiom meaning something is excessively costly.', hint: 'Ça coûte les yeux de la tête' },

  // Persian
  'FA_A1_REST_01': { translation: 'A hot tea with sugar cubes, please', prompt: 'Ordering hot tea with sugar cubes in an Iranian teahouse.', hint: 'Hot tea with sugar' },
  'FA_A2_TRAVEL_01': { translation: 'Excuse me, where is the nearest metro station?', prompt: 'Asking a pedestrian for the nearest subway station.', hint: 'Metro station' },
  'FA_B1_SMALLTALK_01': { translation: 'Please help yourself, Bon Appétit!', prompt: 'Warm Iranian hospitality phrase offering food to guests.', hint: 'Help yourself / Bon Appétit' },
  'FA_B2_IDIOM_01': { translation: 'Don’t count your chickens before they hatch', prompt: 'Persian proverb: wait for final results before celebrating.', hint: 'Count chickens in autumn' },

  // Turkish
  'TR_A1_REST_01': { translation: 'A glass of tea, please', prompt: 'Ordering Turkish tea at a cafe in Istanbul.', hint: 'Bir bardak çay lütfen' },
  'TR_A2_EVERYDAY_01': { translation: 'How are you? I am fine, thank you.', prompt: 'Greeting and asking how someone is doing politely in Turkish.', hint: 'Nasılsınız? İyiyim, teşekkür ederim.' },

  // Arabic
  'AR_A1_REST_01': { translation: 'The check/bill, please', prompt: 'Politely asking for the bill in a cafe or restaurant.', hint: 'Al-hisaab, law samaht' },
  'AR_A2_EVERYDAY_01': { translation: 'Welcome, how are you today?', prompt: 'Warmly greeting someone and asking how they are doing today.', hint: 'Ahlan wa sahlan' },

  // English (US)
  'EN_US_A1_REST_01': { translation: 'Check, please!', prompt: 'In an American diner or restaurant, asking for the check.' },
  'EN_US_A1_REST_02': { translation: 'Can I get this to-go, please?', prompt: 'Ordering food to-go at an American fast-food place.' },
  'EN_US_A1_EVERYDAY_01': { translation: 'How is it going, buddy?', prompt: 'Everyday casual American greeting.' },
  'EN_US_A1_TRANSPORT_01': { translation: 'Where is the nearest subway station?', prompt: 'Asking for the nearest subway station in New York.' },
  'EN_US_A2_SHOPPING_01': { translation: 'Could you break a twenty-dollar bill for me?', prompt: 'Asking to break a $20 bill at a store.' },
  'EN_US_A2_EVERYDAY_02': { translation: 'Running a few minutes late', prompt: 'Letting someone know you will arrive a few minutes late.' },
  'EN_US_B1_SMALLTALK_01': { translation: 'That makes total sense', prompt: 'Expressing complete understanding and agreement.' },
  'EN_US_B2_IDIOM_01': { translation: 'Hit the nail on the head', prompt: 'Describing something exactly right or accurate.' },
  'EN_US_C1_IDIOM_01': { translation: 'Play devil\'s advocate', prompt: 'Arguing the opposing view to test the strength of an argument.' },
};

/**
 * Automatically synthesizes comprehensive Language Cards from the 290+ items in WORD_BANK
 * for any given target language and CEFR level so that thousands of cards are available across all languages!
 */
export function generateSyntheticCardsForLanguage(
  targetLanguage: Language,
  nativeLanguage: Language = 'fa'
): LanguageCard[] {
  const targetInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
  const isEnNative = nativeLanguage === 'en' || nativeLanguage === 'en-US';
  const targetLangDisplayName = isEnNative 
    ? (targetInfo?.name || targetLanguage)
    : (targetInfo?.nativeName || targetLanguage);

  return WORD_BANK.map((w, index) => {
    const conceptFallback = UNIVERSAL_CONCEPTS[index % UNIVERSAL_CONCEPTS.length];
    const targetWord = w.words[targetLanguage] 
      || (targetLanguage === 'en-US' ? w.words['en'] : undefined) 
      || conceptFallback?.words[targetLanguage]
      || w.words['en'] 
      || 'Word';
    const nativeTranslation = w.words[nativeLanguage] 
      || (nativeLanguage === 'en-US' ? w.words['en'] : undefined)
      || conceptFallback?.words[nativeLanguage] 
      || (isEnNative ? (w.words['en'] || targetWord) : (w.words['fa'] || targetWord));
    
    // Map Word difficulty to CEFR level across A1, A2, B1, and B2
    const cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 
      w.difficulty === 'easy' ? (index % 2 === 0 ? 'A1' : 'A2') :
      w.difficulty === 'medium' ? (index % 2 === 0 ? 'A2' : 'B1') :
      (index % 2 === 0 ? 'B1' : 'B2');
    
    const isGold = index % 12 === 0;
    const learningMode: LearningMode = w.difficulty === 'easy' ? 'Explain' : w.difficulty === 'medium' ? 'Translate' : 'Speak';

    return {
      id: `SYN_${targetLanguage.toUpperCase()}_${w.category}_${index}`,
      nativeLanguage,
      targetLanguage,
      cefrLevel: cefr,
      topic: w.category,
      contentType: w.difficulty === 'easy' ? 'Vocabulary' : w.difficulty === 'medium' ? 'Phrase' : 'Sentence',
      learningMode,
      prompt: getPromptForCard(learningMode, nativeLanguage, targetLangDisplayName, false),
      targetText: targetWord,
      translation: nativeTranslation,
      hint: isEnNative 
        ? `Category: ${w.category.replace('CAT_', '')}`
        : (nativeLanguage === 'fa' ? `دسته‌بندی: ${w.category.replace('CAT_', '')}` : `Category: ${w.category.replace('CAT_', '')}`),
      grammarPoint: targetLanguage === 'nl' ? 'De / Het Woord' : targetLanguage === 'en-US' ? 'US English Usage' : 'Vocabulary Focus',
      difficulty: w.difficulty,
      points: w.difficulty === 'easy' ? 1 : w.difficulty === 'medium' ? 2 : 3,
      isGolden: isGold
    };
  });
}

/**
 * Assembles and randomly shuffles a session pool of Language Cards based on:
 * - Selected Target Languages (can be 1, 2, 3, 4, 5, 6, 8, all!)
 * - Selected Categories / Topics
 * - Selected CEFR Level or Mixed
 * - Native Reference Language
 * - Card Game Mode: 'mixed' | 'reverse' | 'standard'
 */
export function buildSessionCardPool(
  targetLanguages?: Language[],
  selectedCategories?: string[],
  cefrLevel: CEFRLevel = 'all',
  nativeLanguage: Language = 'fa',
  cardGameMode: CardGameMode = 'mixed'
): LanguageCard[] {
  const isEnNative = nativeLanguage === 'en' || nativeLanguage === 'en-US';
  let activeTargets = Array.isArray(targetLanguages) && targetLanguages.length > 0 
    ? targetLanguages 
    : (['nl', 'es'] as Language[]);
  
  if (isEnNative) {
    activeTargets = activeTargets.filter(t => t !== 'en' && t !== 'en-US');
    if (activeTargets.length === 0) activeTargets = ['nl', 'es'];
  }

  const activeCats = Array.isArray(selectedCategories) ? selectedCategories : [];
  
  let pool: LanguageCard[] = [];

  // Target language names for reverse prompt
  const langDisplayNames: Record<string, string> = {
    'en-US': 'انگلیسی آمریکایی 🇺🇸',
    'en': 'انگلیسی بریتانیایی 🇬🇧',
    'nl': 'هلندی 🇳🇱',
    'de': 'آلمانی 🇩🇪',
    'fr': 'فرانسوی 🇫🇷',
    'es': 'اسپانیایی 🇪🇸',
    'it': 'ایتالیایی 🇮🇹',
    'fa': 'فارسی 🇮🇷',
    'ar': 'عربی 🇸🇦',
    'tr': 'ترکی 🇹🇷',
    'pl': 'لهستانی 🇵🇱',
    'uk': 'اوکراینی 🇺🇦',
    'pt': 'پرتغالی 🇵🇹',
    'zh': 'چینی 🇨🇳',
    'ja': 'ژاپنی 🇯🇵',
    'ko': 'کره‌ای 🇰🇷',
    'hi': 'هندی 🇮🇳'
  };

  // 1. Gather curated cards matching selected target languages
  CURATED_LANGUAGE_CARDS.forEach(card => {
    if (activeTargets.includes(card.targetLanguage)) {
      const topicMatch = activeCats.length === 0 || activeCats.includes(card.topic);
      const levelMatch = cefrLevel === 'all' || card.cefrLevel === cefrLevel;
      if (topicMatch && levelMatch) {
        const enOverride = isEnNative ? CURATED_EN_TRANSLATIONS[card.id] : undefined;
        let trans = enOverride?.translation || card.translation;
        let prmpt = enOverride?.prompt || card.prompt;
        let hnt = enOverride?.hint || card.hint;
        let pron = card.pronunciation;

        if (isEnNative) {
          // If translation still contains Persian script, skip this card
          if (!enOverride && /[\u0600-\u06FF]/.test(trans)) {
            return;
          }
          if (/[\u0600-\u06FF]/.test(prmpt)) {
            prmpt = `Explain this ${card.contentType.toLowerCase()} in the target language`;
          }
          if (hnt && /[\u0600-\u06FF]/.test(hnt)) {
            hnt = `Category: ${card.topic.replace('CAT_', '')}`;
          }
          // Remove Persian-script transliteration
          if (pron && /[\u0600-\u06FF]/.test(pron)) {
            pron = undefined;
          }
        }

        pool.push({
          ...card,
          nativeLanguage,
          translation: trans,
          prompt: prmpt,
          hint: hnt,
          pronunciation: pron
        });
      }
    }
  });

  // 2. Gather verified phrases from phraseBank (real-world idioms, dialogue lines, sentences)
  const bankCards = cardsFromPhraseBank(
    activeTargets,
    activeCats,
    cefrLevel,
    nativeLanguage,
    cardGameMode
  );
  bankCards.forEach(card => {
    if (!pool.some(existing => existing.id === card.id)) {
      pool.push(card);
    }
  });

  // 3. Gather authentic C1 Sentences if level is C1, C2, or all
  if (cefrLevel === 'C1' || cefrLevel === 'C2' || cefrLevel === 'all') {
    activeTargets.forEach(targetLang => {
      const c1Cards = getC1CardsForSession(targetLang, nativeLanguage, activeCats);
      c1Cards.forEach(card => {
        if (!pool.some(existing => existing.id === card.id)) {
          pool.push(card);
        }
      });
    });
  }

  // 4. Gather authentic universal concepts for any language combination
  activeTargets.forEach(targetLang => {
    const conceptCards = buildCardsFromConcepts(
      targetLang,
      nativeLanguage,
      cefrLevel,
      activeCats,
      cardGameMode === 'reverse'
    );
    conceptCards.forEach(card => {
      if (!pool.some(existing => existing.id === card.id)) {
        pool.push(card);
      }
    });
  });

  // 5. Gather synthetic cards for all selected target languages
  activeTargets.forEach(targetLang => {
    const synthCards = generateSyntheticCardsForLanguage(targetLang, nativeLanguage);
    synthCards.forEach(card => {
      const topicMatch = activeCats.length === 0 || activeCats.includes(card.topic);
      const levelMatch = cefrLevel === 'all' || card.cefrLevel === cefrLevel;
      if (topicMatch && levelMatch && !pool.some(existing => existing.id === card.id)) {
        pool.push(card);
      }
    });
  });

  // Fallback if pool is small (< 15 cards) while strictly respecting CEFR level
  if (pool.length < 15) {
    activeTargets.forEach(targetLang => {
      const synthCards = generateSyntheticCardsForLanguage(targetLang, nativeLanguage);
      synthCards.forEach(c => {
        const levelMatch = cefrLevel === 'all' || c.cefrLevel === cefrLevel;
        if (levelMatch && pool.length < 30 && !pool.some(existing => existing.id === c.id)) {
          pool.push(c);
        }
      });
    });
  }

  // 6. Apply Reverse Translation Transformation
  // In 'reverse' mode: ALL cards become reverse translation
  // In 'mixed' mode: ~40% of cards become reverse translation
  // In 'standard' mode: keep traditional explanation/speaking mode
  const transformedPool = pool.map((card, idx) => {
    if (card.isReverse) return card;
    const shouldBeReverse = cardGameMode === 'reverse' || (cardGameMode === 'mixed' && idx % 3 === 0);
    if (!shouldBeReverse) {
      return card;
    }

    const targetInfo = SUPPORTED_LANGUAGES.find(l => l.code === card.targetLanguage);
    const targetLangName = isEnNative 
      ? (targetInfo?.name || card.targetLanguage) 
      : (targetInfo?.nativeName || langDisplayNames[card.targetLanguage] || card.targetLanguage);
    return {
      ...card,
      isReverse: true,
      learningMode: 'Reverse' as LearningMode,
      prompt: getPromptForCard('Reverse', nativeLanguage, targetLangName, true)
    };
  });

  // 6. Round-Robin Interleaving for Multiple Target Languages (1 to 4 target languages)
  // Ensures perfectly balanced distribution across all chosen target languages!
  if (activeTargets.length > 1) {
    const byLang = new Map<Language, LanguageCard[]>();
    activeTargets.forEach(t => byLang.set(t, []));

    transformedPool.forEach(card => {
      const list = byLang.get(card.targetLanguage);
      if (list) {
        list.push(card);
      }
    });

    // Shuffle cards within each language bucket
    activeTargets.forEach(t => {
      const bucket = byLang.get(t);
      if (bucket) {
        bucket.sort(() => Math.random() - 0.5);
      }
    });

    const interleaved: LanguageCard[] = [];
    let hasMore = true;
    let roundIdx = 0;
    while (hasMore) {
      hasMore = false;
      for (const t of activeTargets) {
        const bucket = byLang.get(t);
        if (bucket && roundIdx < bucket.length) {
          interleaved.push(bucket[roundIdx]);
          hasMore = true;
        }
      }
      roundIdx++;
    }

    return interleaved.length > 0 ? interleaved : [...transformedPool].sort(() => Math.random() - 0.5);
  }

  return [...transformedPool].sort(() => Math.random() - 0.5);
}
