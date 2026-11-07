# scripts/update_cefr_levels.py
import sys

NEW_CEFR_LEVELS = '''export const CEFR_LEVELS: CEFRLevelInfo[] = [
  {
    id: 'A0',
    code: 'A0',
    name: {
      fa: 'پایه صفر',
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
    badge: 'A0'
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
'''

with open('constants.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = 'export const CEFR_LEVELS: CEFRLevelInfo[] = ['
end_marker = 'export const CATEGORIES: Record<string, string[]> = {'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Error: Could not locate start or end marker in constants.tsx")
    sys.exit(1)

new_text = text[:start_idx] + NEW_CEFR_LEVELS + '\n' + text[end_idx:]

with open('constants.tsx', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Successfully updated constants.tsx with all 13 CEFR levels!")
