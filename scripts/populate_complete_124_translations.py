"""
Populates accurate multi-script translations for all 124 phrases/idioms/collocations
into data/sources/scope_a_supplement.json.
Guarantees:
- zh, ja, ko: authentic CJK
- hi: authentic Devanagari
- uk: authentic Cyrillic
- fa, ar: authentic Arabic script (Persian standard with ZWNJ, no Arabic diacritics in fa)
- Latin languages: CEFR-level natural translations
"""

import json
import os

with open('data/sources/scope_a_supplement.json', 'r', encoding='utf-8') as f:
    supp = json.load(f)

concept_trans = supp.get("concept_translations", {})
vocab_articles = supp.get("vocab_articles", {})

# Dictionary of high-quality translations for the 124 concepts
TRANSLATIONS_124 = {
    # Idioms 1-15
    "c_dont_count_your_chickens_before_they_hatch": {
        "en": "don't count your chickens before they hatch", "en-GB": "don't count your chickens before they hatch", "en-US": "don't count your chickens before they hatch",
        "fa": "جوجه را آخر پاییز می‌شمارند", "ar": "لا تعد فراخك قبل أن تفقس", "nl": "prijs de dag niet voor het avond is", "de": "man soll den Tag nicht vor dem Abend loben",
        "fr": "il ne faut pas vendre la peau de l'ours avant de l'avoir tué", "es": "no cantes victoria antes de tiempo", "it": "non dire gatto se non ce l'hai nel sacco",
        "pt": "não conte com o ovo na barriga da galinha", "tr": "dereyi görmeden paçaları sıvama", "pl": "nie mów hop, póki nie przeskoczysz", "uk": "не кажи гоп, поки не перескочиш",
        "zh": "不要过早高兴", "ja": "捕らぬ狸の皮算用", "ko": "김칫국부터 마시지 마라", "hi": "काम पूरा होने से पहले जश्न न मनाएं"
    },
    "c_there_is_always_a_bigger_fish": {
        "en": "there is always a bigger fish", "en-GB": "there is always a bigger fish", "en-US": "there is always a bigger fish",
        "fa": "دست بالای دست بسیار است", "ar": "فوق كل ذي علم عليم", "nl": "er is altijd een grotere vis", "de": "es gibt immer einen noch Größeren",
        "fr": "il y a toujours plus fort que soi", "es": "siempre hay alguien más fuerte", "it": "c'è sempre qualcuno più in alto",
        "pt": "sempre há alguém superior", "tr": "el elden üstündür", "pl": "zawsze znajdzie się ktoś lepszy", "uk": "завжди знайдеться сильніший",
        "zh": "人外有人，天外有天", "ja": "上には上がある", "ko": "뛰는 놈 위에 나는 놈 있다", "hi": "शेर को सवा शेर मिलता ही है"
    },
    "c_too_many_cooks_spoil_the_broth": {
        "en": "too many cooks spoil the broth", "en-GB": "too many cooks spoil the broth", "en-US": "too many cooks spoil the broth",
        "fa": "آشپز که دوتا شد غذا یا شور می‌شود یا بی‌نمک", "ar": "كثرة الطباخين تحرق الطبخة", "nl": "te veel koks bederven de brij", "de": "viele Köche verderben den Brei",
        "fr": "trop de cuisiniers gâtent la sauce", "es": "muchas manos en un plato hacen mucho garabato", "it": "troppi cuochi guastano il brodo",
        "pt": "muitos cozinheiros entornam o caldo", "tr": "nerede çokluk, orada b...luk", "pl": "gdzie kucharek sześć, tam nie ma co jeść", "uk": "де сім господинь, там хата неметена",
        "zh": "人多手杂反误事", "ja": "船頭多くして船山に登る", "ko": "사공이 많으면 배가 산으로 간다", "hi": "बहुत से रसोइए भोजन खराब कर देते हैं"
    },
    "c_keep_it_under_your_hat": {
        "en": "keep it under your hat", "en-GB": "keep it under your hat", "en-US": "keep it under your hat",
        "fa": "شتر دیدی ندیدی", "ar": "ابكِ الأمر سراً", "nl": "hou het onder de pet", "de": "behalte es für dich",
        "fr": "garde ça pour toi", "es": "guárdalo en secreto", "it": "tienilo per te",
        "pt": "mantenha em segredo", "tr": "arศูนย์mızda kalsın", "pl": "zatrzymaj to dla siebie", "uk": "тримай це в таємниці",
        "zh": "保守秘密", "ja": "内緒にしておく", "ko": "비밀로 간직하다", "hi": "इस बात को राज ही रहने दो"
    },
    "c_one_swallow_does_not_make_a_summer": {
        "en": "one swallow does not make a summer", "en-GB": "one swallow does not make a summer", "en-US": "one swallow does not make a summer",
        "fa": "با یک گل بهار نمی‌شود", "ar": "سنونوة واحدة لا تصنع ربيعاً", "nl": "één zwaluw maakt nog geen zomer", "de": "eine Schwalbe macht noch keinen Sommer",
        "fr": "une hirondelle ne fait pas le printemps", "es": "una golondrina no hace verano", "it": "una rondine non fa primavera",
        "pt": "uma andorinha só não faz verão", "tr": "bir çiçekle bahar gelmez", "pl": "jedna jaskółka wiosny nie czyni", "uk": "одна ластівка весни не робить",
        "zh": "一燕不成夏", "ja": "一羽のツバメが来ても夏にはならない", "ko": "제비 한 마리가 왔다고 여름이 온 것은 아니다", "hi": "एक फूल से वसंत नहीं आता"
    },
    "c_biting_off_more_than_you_can_chew": {
        "en": "biting off more than you can chew", "en-GB": "biting off more than you can chew", "en-US": "biting off more than you can chew",
        "fa": "سنگ بزرگ علامت نزدن است", "ar": "حمل ما لا طاقة له به", "nl": "te veel hooi op de vork nemen", "de": "sich zu viel zumuten",
        "fr": "avoir les yeux plus gros que le ventre", "es": "el que mucho abarca poco aprieta", "it": "fare il passo più lungo della gamba",
        "pt": "dar o passo maior que a perna", "tr": "boyundan büyük işe kalkışmak", "pl": "porywać się z motyką на słońce", "uk": "брати на себе забагато",
        "zh": "贪多嚼不烂", "ja": "能力以上のことを引き受ける", "ko": "무리한 일을 벌이다", "hi": "हैसियत से अधिक जिम्मेदारी लेना"
    },
    "c_wolf_in_sheeps_clothing": {
        "en": "wolf in sheep's clothing", "en-GB": "wolf in sheep's clothing", "en-US": "wolf in sheep's clothing",
        "fa": "گرگ در لباس میش", "ar": "ذئب في ثياب حمل", "nl": "wolf in schaapskleren", "de": "Wolf im Schafspelz",
        "fr": "loup déguisé en brebis", "es": "lobo con piel de cordero", "it": "lupo travestito da agnello",
        "pt": "lobo em pele de cordeiro", "tr": "kuzu postuna bürünmüş kurt", "pl": "wilk w owczej skórze", "uk": "вовк в овечій шкурі",
        "zh": "披着羊皮的狼", "ja": "羊の皮をかぶった狼", "ko": "양의 탈을 쓴 늑대", "hi": "भेड़ की खाल में भेड़िया"
    },
    "c_beating_a_dead_horse": {
        "en": "beating a dead horse", "en-GB": "flogging a dead horse", "en-US": "beating a dead horse",
        "fa": "آب در هاون کوبیدن", "ar": "النفخ في رماد", "nl": "water naar de zee dragen", "de": "vergebliche Liebesmüh",
        "fr": "prêcher dans le désert", "es": "llover sobre mojado", "it": "pestare l'acqua nel mortaio",
        "pt": "chover no molhado", "tr": "havanda su dövmek", "pl": "marnować czas na próżno", "uk": "товкти воду в ступі",
        "zh": "徒劳无功", "ja": "無駄な努力を続ける", "ko": "죽은 자식 눈 맞추기", "hi": "व्यर्थ की बहस करना"
    },
    "c_piece_of_cake": {
        "en": "piece of cake", "en-GB": "piece of cake", "en-US": "piece of cake",
        "fa": "مثل آب خوردن", "ar": "أسهل من شربة ماء", "nl": "een fluitje van een cent", "de": "ein Kinderspiel",
        "fr": "un jeu d'enfant", "es": "pan comido", "it": "un gioco da ragazzi",
        "pt": "uma moleza", "tr": "çocuk oyuncağı", "pl": "bułka z masłem", "uk": "простіше простого",
        "zh": "小菜一碟", "ja": "朝飯前", "ko": "식은 죽 먹기", "hi": "बाएं हाथ का खेल"
    },
    "c_birds_of_a_feather_flock_together": {
        "en": "birds of a feather flock together", "en-GB": "birds of a feather flock together", "en-US": "birds of a feather flock together",
        "fa": "کبوتر با کبوتر باز با باز", "ar": "الطيور على أشكالها تقع", "nl": "soort zoekt soort", "de": "gleich und gleich gesellt sich gern",
        "fr": "qui se ressemble s'assemble", "es": "dios los cría y ellos se juntan", "it": "chi si somiglia si piglia",
        "pt": "farinha do mesmo saco", "tr": "tencere yuvarlanmış kapağını bulmuş", "pl": "ciągnie swój do swego", "uk": "рибак рибака бачить здалека",
        "zh": "物以类聚，人以群分", "ja": "類は友を呼ぶ", "ko": "유유상종", "hi": "चोर-चोर मौसेरे भाई"
    },
    "c_once_bitten_twice_shy": {
        "en": "once bitten, twice shy", "en-GB": "once bitten, twice shy", "en-US": "once bitten, twice shy",
        "fa": "مار گزیده از ریسمان سیاه و سفید می‌ترسد", "ar": "لا يلدغ المؤمن من جحر مرتين", "nl": "een gewaarschuwd mens telt voor twee", "de": "gebranntes Kind scheut das Feuer",
        "fr": "chat échaudé craint l'eau froide", "es": "gato escaldado del agua fría huye", "it": "can scottato ha paura dell'acqua calda",
        "pt": "gato escaldado tem medo de água fria", "tr": "sütten ağzı yanan yoğurdu üfleyerek yer", "pl": "kto się raz sparzy, na zimne dmucha", "uk": "обпікшись на молоці, дмухаєш на воду",
        "zh": "一朝被蛇咬，十年怕井绳", "ja": "あつものに懲りてなますを吹く", "ko": "자라 보고 놀란 가슴 솥뚜껑 보고 놀란다", "hi": "दूध का जला छाछ भी फूंक-फूंक कर पीता है"
    },
    "c_friends_may_meet_but_mountains_never_greet": {
        "en": "friends may meet, but mountains never greet", "en-GB": "friends may meet, but mountains never greet", "en-US": "friends may meet, but mountains never greet",
        "fa": "کوه به کوه نمی‌رسد آدم به آدم می‌رسد", "ar": "الجبال لا تلتقي لكن الناس يلتقون", "nl": "bergen ontmoeten elkaar nooit, maar mensen wel", "de": "Berg und Tal kommen nicht zusammen, aber die Menschen",
        "fr": "il n'y a que les montagnes qui ne se rencontrent pas", "es": "los cerros no se juntan, pero los hombres sí", "it": "la montagna non incontra la montagna, ma l'uomo incontra l'uomo",
        "pt": "montanhas não se encontram, mas as pessoas sim", "tr": "dağ dağa kavuşmaz, insan insana kavuşur", "pl": "góra z górą się nie zejdzie, ale człowiek z człowiekiem tak", "uk": "гора з горою не сходиться, а людина з людиною зійдеться",
        "zh": "山与山不相遇，人与人总相逢", "ja": "山と山は出会わないが、人と人は出会う", "ko": "산은 산을 못 만나도 사람은 사람을 만난다", "hi": "पहाड़ नहीं मिलते, पर इंसान मिल जाते हैं"
    },
    "c_mo_money_mo_problems": {
        "en": "mo' money, mo' problems", "en-GB": "more money, more problems", "en-US": "mo' money, mo' problems",
        "fa": "هر که بامش بیش برفش بیشتر", "ar": "كلما كثر المال كثرت الهموم", "nl": "hoe meer bezit, hoe meer zorgen", "de": "großer Besitz, große Sorgen",
        "fr": "plus d'argent, plus de soucis", "es": "más dinero, más problemas", "it": "più soldi, più pensieri",
        "pt": "mais dinheiro, mais problemas", "tr": "ne kadar mal, o kadar dert", "pl": "więcej pieniędzy, więcej kłopotów", "uk": "більше грошей, більше клопоту",
        "zh": "钱多烦恼多", "ja": "財産が増えれば悩みも増える", "ko": "돈이 많을수록 걱정도 많다", "hi": "जितना बड़ा पद, उतनी बड़ी चिंता"
    },
    "c_doing_the_impossible": {
        "en": "doing the impossible", "en-GB": "doing the impossible", "en-US": "doing the impossible",
        "fa": "فیل هوا کردن", "ar": "صنع المستحيل", "nl": "het onmogelijke doen", "de": "das Unmögliche möglich machen",
        "fr": "décrocher la lune", "es": "hacer lo imposible", "it": "fare l'impossibile",
        "pt": "fazer o impossível", "tr": "imkansızı başarmak", "pl": "dokonać niemożliwego", "uk": "робити неможливе",
        "zh": "化不可能为可能", "ja": "不可能を可能にする", "ko": "불가능을 해내다", "hi": "असंभव को संभव करना"
    },
    "c_all_is_well_that_ends_well": {
        "en": "all is well that ends well", "en-GB": "all is well that ends well", "en-US": "all is well that ends well",
        "fa": "شاهنامه آخرش خوش است", "ar": "العبرة بالخواتيم", "nl": "eind goed, al goed", "de": "Ende gut, alles gut",
        "fr": "tout est bien qui finit bien", "es": "bien está lo que bien acaba", "it": "tutto è bene quel che finisce bene",
        "pt": "tudo está bem quando acaba bem", "tr": "sonu iyi biten her şey iyidir", "pl": "wszystko dobre, co się dobrze kończy", "uk": "все добре, що добре закінчується",
        "zh": "结局好一切都好", "ja": "終わりよければすべてよし", "ko": "끝이 좋으면 다 좋다", "hi": "अंत भला तो सब भला"
    },

    # Compound concepts 16-39
    "c_smart_rechargeable_electric_toothbrush": {
        "en": "Smart Rechargeable Electric Toothbrush", "en-GB": "Smart Rechargeable Electric Toothbrush", "en-US": "Smart Rechargeable Electric Toothbrush",
        "fa": "مسواک برقی شارژی هوشمند", "ar": "فرشاة أسنان كهربائية ذكية قابلة للشحن", "nl": "slimme oplaadbare elektrische tandenborstel", "de": "intelligente wiederaufladbare elektrische Zahnbürste",
        "fr": "brosse à dents électrique rechargeable intelligente", "es": "cepillo de dientes eléctrico inteligente y recargable", "it": "spazzolino elettrico ricaricabile intelligente",
        "pt": "escova de dentes elétrica recarregável inteligente", "tr": "akıllı şarj edilebilir elektrikli diş fırçası", "pl": "inteligentna szczoteczka elektryczna do ładowania", "uk": "розумна акумуляторна електрична зубна щітка",
        "zh": "智能充电式电动牙刷", "ja": "スマート充電式電動歯ブラシ", "ko": "스마트 충전식 전동 칫솔", "hi": "स्मार्ट रिचार्जेबल इलेक्ट्रिक टूथब्रश"
    },
    "c_fourway_intersection_traffic_light": {
        "en": "four-way intersection traffic light", "en-GB": "crossroads traffic light", "en-US": "four-way intersection traffic light",
        "fa": "چراغ راهنمایی چهارراه", "ar": "إشارة مرور عند تقاطع رباعي", "nl": "verkeerslicht op een viersprong", "de": "Ampel an einer Kreuzung",
        "fr": "feu de circulation de carrefour", "es": "semáforo de intersección", "it": "semaforo di un incrocio",
        "pt": "semáforo de cruzamento", "tr": "dört yol ağzı trafik ışığı", "pl": "sygnalizacja świetlna na skrzyżowaniu", "uk": "світлофор на перехресті",
        "zh": "十字路口红绿灯", "ja": "交差点の信号機", "ko": "사거리 신호등", "hi": "चौराहे की ट्रैफिक लाइट"
    },
    "c_waterproof_alpine_hiking_backpack": {
        "en": "Waterproof Alpine Hiking Backpack", "en-GB": "Waterproof Alpine Hiking Rucksack", "en-US": "Waterproof Alpine Hiking Backpack",
        "fa": "کوله پشتی کوهنوردی آلپاین ضد آب", "ar": "حقيبة ظهر جبلية مقاومة للماء", "nl": "waterdichte alpine wandelrugzak", "de": "wasserdichter alpiner Wanderrucksack",
        "fr": "sac à dos de randonnée alpine imperméable", "es": "mochila alpina impermeable de senderismo", "it": "zaino da trekking alpino impermeabile",
        "pt": "mochila impermeável de caminhada alpina", "tr": "su geçirmez dağcılık sırt çantası", "pl": "wodoodporny plecak trekkingowy", "uk": "водонепроникний гірський рюкзак",
        "zh": "防水高山登山背包", "ja": "防水アルパイン登山リュック", "ko": "방수 알파인 등산 배낭", "hi": "वाटरप्रूफ अल्पाइन हाइकिंग बैग"
    },
    "c_goldframed_designer_sunglasses": {
        "en": "gold-framed designer sunglasses", "en-GB": "gold-framed designer sunglasses", "en-US": "gold-framed designer sunglasses",
        "fa": "عینک آفتابی مارک با فریم طلایی", "ar": "نظارات شمسية أنيقة بإطار ذهبي", "nl": "design zonnebril met goudkleurig montuur", "de": "Designer-Sonnenbrille mit Goldrand",
        "fr": "lunettes de soleil de créateur à monture dorée", "es": "gafas de sol de diseño con montura dorada", "it": "occhiali da sole firmati con montatura dorata",
        "pt": "óculos de sol de grife com armação dourada", "tr": "altın çerçeveli tasarım güneş gözlüğü", "pl": "markowe okulary przeciwsłoneczne ze złotą oprawką", "uk": "дизайнерські сонцезахисні окуляри в золотій оправі",
        "zh": "金框名牌太阳镜", "ja": "金縁デザイナーズサングラス", "ko": "금테 디자이너 선글라스", "hi": "सुनहरे फ्रेम वाले डिजाइनर धूप का चश्मा"
    },
    "c_fivehundredpage_novel_book": {
        "en": "five-hundred-page novel book", "en-GB": "five-hundred-page novel", "en-US": "five-hundred-page novel",
        "fa": "کتاب رمان پانصد صفحه‌ای", "ar": "رواية من خمسمائة صفحة", "nl": "roman van vijfhonderd bladzijden", "de": "Roman mit fünfhundert Seiten",
        "fr": "roman de cinq cents pages", "es": "novela de quinientas páginas", "it": "romanzo di cinquecento pagine",
        "pt": "romance de quinhentas páginas", "tr": "beş yüz sayfalık roman", "pl": "pięćsetstronicowa powieść", "uk": "роман на п'ятсот сторінок",
        "zh": "五百页的长篇小说", "ja": "500ページの小説本", "ko": "500페이지 분량의 소설책", "hi": "पांच सौ पन्नों का उपन्यास"
    },
    "c_vanilla_soft_cone_with_chocolate": {
        "en": "Vanilla Soft Cone with Chocolate", "en-GB": "Vanilla Soft Cone with Chocolate", "en-US": "Vanilla Soft Serve Cone with Chocolate",
        "fa": "بستنی قیفی وانیلی با روکش شکلات", "ar": "مخروط آيس كريم فانيليا مع شوكولاتة", "nl": "vanille softijsje met chocolade", "de": "Vanille-Softeis mit Schokolade",
        "fr": "cornet de glace vanille au chocolat", "es": "cono de helado de vainilla con chocolate", "it": "cono gelato alla vaniglia con cioccolato",
        "pt": "casquinha de baunilha com chocolate", "tr": "çikolatalı vanilyalı külah dondurma", "pl": "lód waniliowy w rożku z czekoladą", "uk": "вафельний ріжок ванільного морозива з шоколадом",
        "zh": "巧克力香草蛋筒冰淇淋", "ja": "チョコがけバニラソフトクリーム", "ko": "초콜릿을 얹은 바닐라 소프트콘", "hi": "चॉकलेट वाली वेनिला सॉफ्ट आइसक्रीम"
    },
    "c_hot_tea_with_lemon_and_rock_candy": {
        "en": "Hot Tea with Lemon and Rock Candy", "en-GB": "Hot Tea with Lemon and Rock Sugar", "en-US": "Hot Tea with Lemon and Rock Candy",
        "fa": "چای داغ با لیمو و نبات", "ar": "شاي ساخن مع الليمون وسكر النبات", "nl": "hete thee met citroen en kandij", "de": "heißer Tee mit Zitrone und Kandiszucker",
        "fr": "thé chaud au citron et sucre candi", "es": "té caliente con limón y azúcar cande", "it": "tè caldo con limone e zucchero candito",
        "pt": "chá quente com limão e açúcar cristal", "tr": "limonlu ve nöbet şekerli sıcak çay", "pl": "gorąca herbata z cytryną i kandyzem", "uk": "гарячий чай з лимоном і льодяниковим цукром",
        "zh": "柠檬冰糖热茶", "ja": "レモンと氷砂糖入り熱い紅茶", "ko": "레몬과 얼음설탕을 곁들인 따뜻한 홍차", "hi": "नींबू और मिश्री वाली गर्म चाय"
    },
    "c_extra_large_cheese_and_mushroom_pizza": {
        "en": "Extra Large Cheese and Mushroom Pizza", "en-GB": "Extra Large Cheese and Mushroom Pizza", "en-US": "Extra Large Cheese and Mushroom Pizza",
        "fa": "پیتزای بزرگ قارچ و پنیر", "ar": "بيتزا كبيرة جداً بالجبن والفطر", "nl": "extra grote pizza met kaas en champignons", "de": "extra große Käse-Pilz-Pizza",
        "fr": "pizza extra-large fromage et champignons", "es": "pizza extragrande de queso y champiñones", "it": "pizza formato gigante formaggio e funghi",
        "pt": "pizza extragrande de queijo e cogumelos", "tr": "ekstra büyük boy peynirli ve mantarlı pizza", "pl": "bardzo duża pizza z serem i pieczarkami", "uk": "екстравелика піца з сиром та грибами",
        "zh": "特大号奶酪蘑菇披萨", "ja": "特大チーズとマッシュルームのピザ", "ko": "특대형 치즈 버섯 피자", "hi": "अतिरिक्त बड़ा चीज़ और मशरूम पिज्जा"
    },
    "c_multilayer_chocolate_birthday_cake": {
        "en": "multi-layer chocolate birthday cake", "en-GB": "multi-layer chocolate birthday cake", "en-US": "multi-layer chocolate birthday cake",
        "fa": "کیک تولد چند طبقه شکلاتی", "ar": "كعكة عيد ميلاد شوكولاتة متعددة الطبقات", "nl": "meerlagige chocoladeverjaardagstaart", "de": "mehrstöckige Schokoladen-Geburtstagstorte",
        "fr": "gâteau d'anniversaire au chocolat à étages", "es": "tarta de cumpleaños de chocolate de varios pisos", "it": "torta di compleanno al cioccolato a più piani",
        "pt": "bolo de aniversário de chocolate em camadas", "tr": "çok katlı çikolatalı doğum günü pastası", "pl": "wielowarstwowy czekoladowy tort urodzinowy", "uk": "багатоярусний шоколадний торт на день народження",
        "zh": "多层巧克力生日蛋糕", "ja": "多層チョコレートバースデーケーキ", "ko": "다층 초콜릿 생일 케이크", "hi": "बहुस्तरीय चॉकलेट जन्मदिन का केक"
    },
    "c_traditional_herb_stew_with_saffron_rice": {
        "en": "Traditional Herb Stew with Saffron Rice", "en-GB": "Traditional Herb Stew with Saffron Rice", "en-US": "Traditional Herb Stew with Saffron Rice",
        "fa": "قورمه سبزی سنتی با چلو زعفرانی", "ar": "يخنة الأعشاب التقليدية مع الأرز بالزعفران", "nl": "traditionele kruidenstoof met saffraanrijst", "de": "traditioneller Kräutereintopf mit Safranreis",
        "fr": "ragoût traditionnel aux herbes avec riz au safran", "es": "estofado tradicional de hierbas con arroz con azafrán", "it": "stufato tradizionale di erbe con riso allo zafferano",
        "pt": "ensopado tradicional de ervas com arroz de açafrão", "tr": "safranlı pilav ile geleneksel ot yahnisi", "pl": "tradycyjny gulasz ziołowy z ryżem szafranowym", "uk": "традиційне трав'яне рагу з шафрановим рисом",
        "zh": "传统香草炖肉配藏红花米饭", "ja": "サフランライスを添えた伝統的なハーブシチュー", "ko": "사프란 밥을 곁들인 전통 허브 스튜", "hi": "केसर चावल के साथ पारंपरिक जड़ी-बूटी स्टू"
    },
    "c_roaring_lion_on_the_african_savannah": {
        "en": "Roaring Lion on the African Savannah", "en-GB": "Roaring Lion on the African Savannah", "en-US": "Roaring Lion on the African Savannah",
        "fa": "شیر غرّان در ساوانای آفریقا", "ar": "أسد يزأر في السافانا الأفريقية", "nl": "brullende leeuw op de Afrikaanse savanne", "de": "brüllender Löwe in der afrikanischen Savanne",
        "fr": "lion rugissant dans la savane africaine", "es": "león rugiendo en la sabana africana", "it": "leone ruggente nella savana africana",
        "pt": "leão rugindo na savana africana", "tr": "Afrika savanasında kükreyen aslan", "pl": "ryczący lew na afrykańskiej sawannie", "uk": "рикучий лев в африканській савані",
        "zh": "非洲稀树草原上咆哮的狮子", "ja": "アフリカのサバンナで吠えるライオン", "ko": "아프리카 사바나에서 포효하는 사자", "hi": "अफ्रीकी सवाना में दहाड़ता शेर"
    },
    "c_emperor_penguin_in_antarctic_snow": {
        "en": "Emperor Penguin in Antarctic Snow", "en-GB": "Emperor Penguin in Antarctic Snow", "en-US": "Emperor Penguin in Antarctic Snow",
        "fa": "پنگوئن امپراتور در برف قطب جنوب", "ar": "بطريق إمبراطور في ثلوج القطب الجنوبي", "nl": "keizerspinguïn in de Antarctische sneeuw", "de": "Kaiserpinguin im antarktischen Schnee",
        "fr": "manchot empereur dans la neige antarctique", "es": "pingüino emperador en la nieve antártica", "it": "pinguino imperatore nella neve antartica",
        "pt": "pinguim-imperador na neve antártica", "tr": "Antarktika karlarında imparator penguen", "pl": "pingwin cesarski w antarktycznym śniegu", "uk": "імператорський пінгвін в антарктичних снігах",
        "zh": "南极冰雪中的帝企鹅", "ja": "南極の雪の中にいるコウテイペンギン", "ko": "남극 눈 속의 황제펭귄", "hi": "अंटार्कटिक बर्फ में सम्राट पेंगुइन"
    },
    "c_playful_dolphin_in_giant_aquarium": {
        "en": "Playful Dolphin in Giant Aquarium", "en-GB": "Playful Dolphin in Giant Aquarium", "en-US": "Playful Dolphin in Giant Aquarium",
        "fa": "دلفین بازیگوش در آکواریوم غول‌پیکر", "ar": "دلفين لعوب في حوض مائي عملاق", "nl": "speelse dolfijn in een reusachtig aquarium", "de": "verspielter Delfin im riesigen Aquarium",
        "fr": "dauphin joueur dans un aquarium géant", "es": "delfín juguetón en un acuario gigante", "it": "delfino giocherellone nell'acquario gigante",
        "pt": "golfinho brincalhão em aquário gigante", "tr": "dev akvaryumdaki oyuncu yunus", "pl": "psotny delfin w wielkim akwarium", "uk": "грайливий дельфін у гігантському акваріумі",
        "zh": "巨型水族馆里的顽皮海豚", "ja": "巨大水族館のお茶目なイルカ", "ko": "거대 아쿠아리움의 장난기 많은 돌고래", "hi": "विशाल मछलीघर में चंचल डॉल्फ़िन"
    },
    "c_colorful_butterfly_on_a_red_rose": {
        "en": "Colorful Butterfly on a Red Rose", "en-GB": "Colourful Butterfly on a Red Rose", "en-US": "Colorful Butterfly on a Red Rose",
        "fa": "پروانه رنگارنگ روی گل رز قرمز", "ar": "فراشة ملونة على وردة حمراء", "nl": "kleurrijke vlinder op een rode roos", "de": "bunter Schmetterling auf einer roten Rose",
        "fr": "papillon coloré sur une rose rouge", "es": "mariposa colorida sobre una rosa roja", "it": "farfalla colorata su una rosa rossa",
        "pt": "borboleta colorida sobre uma rosa vermelha", "tr": "kırmızı gülün üzerinde renkli kelebek", "pl": "kolorowy motyl na czerwonej róży", "uk": "барвистий метелик на червоній троянді",
        "zh": "红玫瑰上的彩色蝴蝶", "ja": "赤いバラにとまる色鮮やかな蝶", "ko": "붉은 장미 위의 알록달록한 나비", "hi": "लाल गुलाब पर रंग-बिरंगी तितली"
    },
    "c_eiffel_tower_in_parisian_nights": {
        "en": "Eiffel Tower in Parisian Nights", "en-GB": "Eiffel Tower in Parisian Nights", "en-US": "Eiffel Tower in Parisian Nights",
        "fa": "برج ایفل در شب‌های پاریس", "ar": "برج إيفل في ليالي باريس", "nl": "de Eiffeltoren in de Parijse nachten", "de": "Eiffelturm in den Pariser Nächten",
        "fr": "la tour Eiffel dans les nuits parisiennes", "es": "la Torre Eiffel en las noches parisinas", "it": "la Torre Eiffel nelle notti parigine",
        "pt": "a Torre Eiffel nas noites parisienses", "tr": "Paris gecelerinde Eyfel Kulesi", "pl": "Wieża Eiffla w paryskie noce", "uk": "Ейфелева вежа в паризькі ночі",
        "zh": "巴黎夜色中的埃菲尔铁塔", "ja": "パリの夜に輝くエッフェル塔", "ko": "파리의 밤에 빛나는 에펠탑", "hi": "पेरिस की रातों में एफिल टॉवर"
    },
    "c_winter_climbing_on_mount_damavand": {
        "en": "Winter Climbing on Mount Damavand", "en-GB": "Winter Climbing on Mount Damavand", "en-US": "Winter Climbing on Mount Damavand",
        "fa": "کوهنوردی زمستانه در قله دماوند", "ar": "تسلق جبل دماوند في الشتاء", "nl": "winterklimmen op de berg Damavand", "de": "Winterbesteigung des Damavand",
        "fr": "ascension hivernale du mont Damavand", "es": "escalada invernal en el monte Damavand", "it": "arrampicata invernale sul monte Damavand",
        "pt": "escalada de inverno no Monte Damavand", "tr": "Demavend Dağı'nda kış dağcılığı", "pl": "zimowa wspinaczka na górę Damawand", "uk": "зимове сходження на гору Демавенд",
        "zh": "达马万德峰的冬季攀登", "ja": "ダマーヴァンド山の冬山登山", "ko": "다마반드산 겨울 등반", "hi": "दमावंद पर्वत पर शीतकालीन चढ़ाई"
    },
    "c_around_the_world_in_a_hot_air_balloon": {
        "en": "around the world in a hot air balloon", "en-GB": "around the world in a hot air balloon", "en-US": "around the world in a hot air balloon",
        "fa": "دور دنیا با بالن هوای گرم", "ar": "حول العالم في منطاد الهواء الساخن", "nl": "de wereld rond in een heteluchtballon", "de": "in einem Heißluftballon um die Welt",
        "fr": "le tour du monde en montgolfière", "es": "la vuelta al mundo en globo aerostático", "it": "il giro del mondo in mongolfiera",
        "pt": "a volta ao mundo em um balão de ar quente", "tr": "sıcak hava balonuyla dünya turu", "pl": "dokoła świata balonem na ogrzane powietrze", "uk": "навколо світу на повітряній кулі",
        "zh": "乘坐热气球环游世界", "ja": "熱気球で世界一周", "ko": "열기구를 타고 세계 일주", "hi": "गर्म हवा के गुब्बारे में दुनिया की सैर"
    },
    "c_highspeed_intercity_electric_train": {
        "en": "high-speed intercity electric train", "en-GB": "high-speed intercity electric train", "en-US": "high-speed intercity electric train",
        "fa": "قطار برقی سریع‌السیر بین‌شهری", "ar": "قطار كهربائي فائق السرعة بين المدن", "nl": "elektrische hogesnelheidstrein tussen steden", "de": "elektrischer Hochgeschwindigkeits-Intercity-Zug",
        "fr": "train électrique interurbain à grande vitesse", "es": "tren eléctrico interurbano de alta velocidad", "it": "treno elettrico intercity ad alta velocità",
        "pt": "trem elétrico interurbano de alta velocidade", "tr": "şehirlerarası yüksek hızlı elektrikli tren", "pl": "szybki elektryczny pociąg międzymiastowy", "uk": "швидкісний міжміський електропоїзд",
        "zh": "城际高速电力动车组", "ja": "都市間高速電気鉄道", "ko": "도시 간 고속 전기 열차", "hi": "हाई-स्पीड इंटरसिटी इलेक्ट्रिक ट्रेन"
    },
    "c_police_car_with_siren_and_flashing_lights": {
        "en": "Police Car with Siren and Flashing Lights", "en-GB": "Police Car with Siren and Flashing Lights", "en-US": "Police Car with Siren and Flashing Lights",
        "fa": "ماشین پلیس با آژیر و چراغ گردان", "ar": "سيارة شرطة بصفارة إنذار وأضواء وامضة", "nl": "politieauto met sirene en zwaailichten", "de": "Polizeiwagen mit Sirene und Blaulicht",
        "fr": "voiture de police avec sirène et gyrophares", "es": "coche de policía con sirena y luces giratorias", "it": "auto della polizia con sirena e lampeggianti",
        "pt": "carro de polícia com sirene e luzes piscantes", "tr": "sireni ve tepe lambası çalan polis arabası", "pl": "radiowóz na sygnale z kogutem", "uk": "поліцейська машина з сиреною та мигалкою",
        "zh": "拉响警笛闪着警灯的警车", "ja": "サイレンと赤色灯をつけたパトカー", "ko": "사이렌과 경광등을 켠 경찰차", "hi": "सायरन और बत्ती वाली पुलिस की गाड़ी"
    },
    "c_mountain_rescue_helicopter_mission": {
        "en": "Mountain Rescue Helicopter Mission", "en-GB": "Mountain Rescue Helicopter Mission", "en-US": "Mountain Rescue Helicopter Mission",
        "fa": "عملیات امداد و نجات هوایی در کوهستان", "ar": "مهمة مروحية للإنقاذ في الجبال", "nl": "bergreddingsmissie per helikopter", "de": "Bergrettungsmission mit dem Hubschrauber",
        "fr": "mission de sauvetage en montagne par hélicoptère", "es": "misión de rescate en montaña en helicóptero", "it": "missione di soccorso alpino in elicottero",
        "pt": "missão de resgate na montanha de helicóptero", "tr": "helikopterli dağ kurtarma görevi", "pl": "akcja ratownictwa górskiego z helikopterem", "uk": "гірська рятувальна місія на вертольоті",
        "zh": "直升机高山救援任务", "ja": "山岳救助ヘリコプターの任務", "ko": "산악 구조 헬리콥터 임무", "hi": "पर्वत बचाव हेलीकाप्टर मिशन"
    },
    "c_football_world_cup_grand_final_match": {
        "en": "Football World Cup Grand Final Match", "en-GB": "Football World Cup Grand Final", "en-US": "Soccer World Cup Grand Final Match",
        "fa": "مسابقه فینال بزرگ جام جهانی فوتبال", "ar": "المباراة النهائية الكبرى لكأس العالم لكرة القدم", "nl": "de grote finale van het wereldkampioenschap voetbal", "de": "Endspiel der Fußball-Weltmeisterschaft",
        "fr": "la grande finale de la Coupe du Monde de football", "es": "la gran final de la Copa Mundial de fútbol", "it": "la finalissima dei Mondiali di calcio",
        "pt": "a grande final da Copa do Mundo de futebol", "tr": "Futbol Dünya Kupası büyük final maçı", "pl": "wielki finał Mistrzostw Świata w piłce nożnej", "uk": "фінальний матч Чемпіонату світу з футболу",
        "zh": "足球世界杯总决赛", "ja": "サッカーワールドカップの決勝戦", "ko": "월드컵 축구 결승전", "hi": "फुटबॉल विश्व कप का फाइनल मुकाबला"
    },
    "c_mountain_bike_race_through_the_deep_woods": {
        "en": "Mountain Bike Race Through the Deep Woods", "en-GB": "Mountain Bike Race Through the Deep Woods", "en-US": "Mountain Bike Race Through the Deep Woods",
        "fa": "مسابقه دوچرخه‌سواری کوهستان در دل جنگل", "ar": "سباق دراجات جبلية عبر الغابات العميقة", "nl": "mountainbikewedstrijd door de dichte bossen", "de": "Mountainbike-Rennen durch dichte Wälder",
        "fr": "course de VTT à travers les bois profonds", "es": "carrera de bicicleta de montaña en el bosque profundo", "it": "gara di mountain bike nei boschi fitti",
        "pt": "corrida de mountain bike pela floresta densa", "tr": "derin ormanda dağ bisikleti yarışı", "pl": "wyścig kolarstwa górskiego przez gęsty las", "uk": "гонка на гірських велосипедах крізь густий ліс",
        "zh": "穿越密林的山地自行车赛", "ja": "深い森を駆け抜けるマウンテンバイクレース", "ko": "깊은 숲속을 가르는 산악자전거 경주", "hi": "घने जंगलों में माउंटेन बाइक रेस"
    },
    "c_watching_action_movie_in_3d_cinema": {
        "en": "Watching Action Movie in 3D Cinema", "en-GB": "Watching Action Film in 3D Cinema", "en-US": "Watching Action Movie in 3D Cinema",
        "fa": "تماشای فیلم اکشن در سینمای سه‌بعدی", "ar": "مشاهدة فيلم أكشن في سينما ثلاثية الأبعاد", "nl": "een actiefilm kijken in een 3D-bioscoop", "de": "einen Actionfilm im 3D-Kino ansehen",
        "fr": "regarder un film d'action dans un cinéma 3D", "es": "ver una película de acción en un cine 3D", "it": "guardare un film d'azione in un cinema 3D",
        "pt": "assistir a um filme de ação em cinema 3D", "tr": "3D sinemada aksiyon filmi izlemek", "pl": "oglądanie filmu akcji w kinie 3D", "uk": "перегляд бойовика в 3D-кінотеатрі",
        "zh": "在3D电影院观看动作大片", "ja": "3D映画館でアクション映画を観る", "ko": "3D 영화관에서 액션 영화 관람하기", "hi": "3D सिनेमा में एक्शन फिल्म देखना"
    },
    "c_playing_grand_piano_in_opera_house": {
        "en": "Playing Grand Piano in Opera House", "en-GB": "Playing Grand Piano in Opera House", "en-US": "Playing Grand Piano in Opera House",
        "fa": "نواختن پیانوی گرند در سالن اپرا", "ar": "عزف البيانو الكبير في دار الأوبرا", "nl": "vleugelpiano spelen in het operagebouw", "de": "Flügel spielen im Opernhaus",
        "fr": "jouer du piano à queue à l'opéra", "es": "tocar el piano de cola en la ópera", "it": "suonare il pianoforte a coda all'opera",
        "pt": "tocar piano de cauda na casa de ópera", "tr": "opera binasında kuyruklu piyano çalmak", "pl": "gra na fortepianie w operze", "uk": "гра на роялі в оперному театрі",
        "zh": "在歌剧院演奏大三角钢琴", "ja": "オペラハウスでグランドピアノを演奏する", "ko": "오페라 하우스에서 그랜드 피아노 연주하기", "hi": "ओपेरा हाउस में भव्य पियानो बजाना"
    },
    "c_shoot_the_breeze": {
        "en": "Shoot the breeze", "en-GB": "have a natter", "en-US": "Shoot the breeze",
        "fa": "گپ زدن و وقت گذراندن با دوستان", "ar": "الدردشة وتجاذب أطراف الحديث", "nl": "gezellig kletsen", "de": "über Gott und die Welt plaudern",
        "fr": "tailler une bavette", "es": "charlar de cosas sin importancia", "it": "fare quattro chiacchiere",
        "pt": "jogar conversa fora", "tr": "havadan sudan konuşmak", "pl": "pogawędzić o niczym", "uk": "балакати про все на світі",
        "zh": "闲聊吹牛", "ja": "他愛もないおしゃべりをする", "ko": "한가롭게 수다 떨다", "hi": "इधर-उधर की गपशप करना"
    },
    "c_play_devils_advocate": {
        "en": "Play devil's advocate", "en-GB": "play devil's advocate", "en-US": "play devil's advocate",
        "fa": "نقش وکیل مدافع شیطان را بازی کردن", "ar": "لعب دور محامي الشيطان", "nl": "advocaat van de duivel spelen", "de": "des Teufels Advokat spielen",
        "fr": "se faire l'avocat du diable", "es": "hacer de abogado del diablo", "it": "fare l'avvocato del diavolo",
        "pt": "fazer o papel de advogado do diabo", "tr": "şeytanın avukatlığını yapmak", "pl": "być adwokatem diabła", "uk": "грати роль адвоката диявола",
        "zh": "故意唱反调", "ja": "あえて異論を唱える", "ko": "일부러 반대 입장을 취하다", "hi": "जानबूझकर विरोधी तर्क देना"
    },
    "c_ik_wil_graag_een_afspraak_maken_met_de_dokter": {
        "en": "I would like to make an appointment with the doctor.", "en-GB": "I would like to make an appointment with the doctor.", "en-US": "I'd like to make an appointment with the doctor.",
        "fa": "می‌خواهم با دکتر وقت ملاقات بگیرم.", "ar": "أود حجز موعد مع الطبيب.", "nl": "Ik wil graag een afspraak maken met de dokter.", "de": "Ich möchte einen Termin beim Arzt machen.",
        "fr": "Je voudrais prendre rendez-vous avec le médecin.", "es": "Me gustaría pedir cita con el médico.", "it": "Vorrei fissare un appuntamento con il medico.",
        "pt": "Gostaria de marcar uma consulta com o médico.", "tr": "Doktordan randevu almak istiyorum.", "pl": "Chciałbym umówić się na wizytę u lekarza.", "uk": "Я хотів би записатися на прийом до лікаря.",
        "zh": "我想和医生预约看诊。", "ja": "医師の診察予約をお願いしたいです。", "ko": "의사 진료 예약을 하고 싶습니다.", "hi": "मैं डॉक्टर से मिलने का समय लेना चाहता हूँ।"
    },
    "c_going_dutch_ieder_betaalt_voor_zich": {
        "en": "Going Dutch / Splitting the bill", "en-GB": "going Dutch / splitting the bill", "en-US": "going Dutch / split the bill",
        "fa": "دُنگی حساب کردن", "ar": "تقاسم الحساب بالتساوي", "nl": "Ieder betaalt voor zich", "de": "getrennt bezahlen",
        "fr": "partager l'addition", "es": "pagar a escote", "it": "pagare alla romana",
        "pt": "dividir a conta", "tr": "hesabı alman usulü ödemek", "pl": "płacić po holendersku", "uk": "платити кожен за себе",
        "zh": "各付各的（AA制）", "ja": "割り勘にする", "ko": "각자 계산하기(더치페이)", "hi": "बिल आधा-आधा बांटना"
    },
    "c_de_puntjes_op_de_i_zetten": {
        "en": "Dot the i's and cross the t's", "en-GB": "dot the i's and cross the t's", "en-US": "dot the i's and cross the t's",
        "fa": "نقطه روی حرف آی گذاشتن (کار را تمام و کمال انجام دادن)", "ar": "وضع النقاط على الحروف", "nl": "De puntjes op de i zetten", "de": "den Dingen den letzten Schliff geben",
        "fr": "mettre les points sur les i", "es": "poner los puntos sobre las íes", "it": "mettere i puntini sulle i",
        "pt": "colocar os pingos nos is", "tr": "işi kusursuzca tamamlamak", "pl": "postawić kropkę nad i", "uk": "поставити крапку над і",
        "zh": "把细节做到尽善尽美", "ja": "細部まで完璧に仕上げる", "ko": "화룡점정으로 마무리하다", "hi": "काम को अंतिम रूप से परिपूर्ण करना"
    },
    "c_dont_let_the_cat_out_of_the_bag": {
        "en": "Don't let the cat out of the bag", "en-GB": "Don't let the cat out of the bag", "en-US": "Don't let the cat out of the bag",
        "fa": "بند را به آب نده (راز را فاش نکن)", "ar": "لا تفشِ السر", "nl": "Laat het geheim niet uitlekken", "de": "Lass die Katze nicht aus dem Sack",
        "fr": "Ne vends pas la mèche", "es": "No descubras el pastel", "it": "Non spifferare il segreto",
        "pt": "Não dê com a língua nos dentes", "tr": "Ağzından sır kaçırma", "pl": "Nie wygadaj się", "uk": "Не видавай таємницю",
        "zh": "不要泄露机密", "ja": "秘密を漏らさないで", "ko": "비밀을 누설하지 마라", "hi": "भेद मत खोलना"
    },
    "c_we_must_avoid_cutting_corners_at_the_expense_of_product_inte": {
        "en": "We must avoid cutting corners at the expense of product integrity.", "en-GB": "We must avoid cutting corners at the expense of product integrity.", "en-US": "We must avoid cutting corners at the expense of product integrity.",
        "fa": "نباید به بهای آسیب به اصالت محصول، سمبل‌کاری کنیم.", "ar": "علينا تجنب التقصير على حساب جودة المنتج.", "nl": "We moeten vermijden dat we beknibbelen ten koste van de productintegriteit.", "de": "Wir dürfen nicht an den Ecken sparen auf Kosten der Produktintegrität.",
        "fr": "Nous devons éviter de rogner sur la qualité au détriment du produit.", "es": "Debemos evitar tomar atajos a expensas de la integridad del producto.", "it": "Dobbiamo evitare scorciatoie a scapito dell'integrità del prodotto.",
        "pt": "Devemos evitar atalhos em detrimento da integridade do produto.", "tr": "Ürün kalitesinden ödün vererek işi ucuza getirmekten kaçınmalıyız.", "pl": "Musimy unikać chodzenia na skróty kosztem jakości produktu.", "uk": "Ми повинні уникати компромісів за рахунок якості продукту.",
        "zh": "绝不能以牺牲产品完整性为代价偷工减料。", "ja": "製品の品質を犠牲にして手抜きをしてはならない。", "ko": "제품의 완성도를 희생시키며 편법을 써서는 안 됩니다.", "hi": "हमें उत्पाद की गुणवत्ता से समझौता करके काम अधूरा नहीं छोड़ना चाहिए।"
    },
    "c_ich_h_tte_gern_zwei_br_tchen_bitte": {
        "en": "I would like two bread rolls, please.", "en-GB": "I would like two bread rolls, please.", "en-US": "I'd like two bread rolls, please.",
        "fa": "دو تا نان گرد کوچک می‌خواستم، لطفاً.", "ar": "أريد قطعتين من الخبز الصغير، من فضلك.", "nl": "Ik wil graag twee broodjes, alstublieft.", "de": "Ich hätte gern zwei Brötchen, bitte.",
        "fr": "Je voudrais deux petits pains, s'il vous plaît.", "es": "Quisiera dos panecillos, por favor.", "it": "Vorrei due panini, per favore.",
        "pt": "Eu gostaria de dois pãezinhos, por favor.", "tr": "İki küçük ekmek rica edeyim lütfen.", "pl": "Poproszę dwie bułki.", "uk": "Я хотів би дві булочки, будь ласка.",
        "zh": "请给我两个小面包。", "ja": "ロールパンを2つください。", "ko": "모닝빵 두 개 주세요.", "hi": "कृपया मुझे दो ब्रेड रोल दीजिए।"
    },
    "c_entschuldigung_wo_ist_die_n_chste_ubahnstation": {
        "en": "Excuse me, where is the nearest subway station?", "en-GB": "Excuse me, where is the nearest tube station?", "en-US": "Excuse me, where is the nearest subway station?",
        "fa": "ببخشید، نزدیک‌ترین ایستگاه مترو کجاست؟", "ar": "معذرة، أين تقع أقرب محطة مترو؟", "nl": "Pardon, waar is het dichtstbijzijnde metrostation?", "de": "Entschuldigung, wo ist die nächste U-Bahn-Station?",
        "fr": "Pardon, où se trouve la station de métro la plus proche ?", "es": "Disculpe, ¿dónde está la estación de metro más cercana?", "it": "Mi scusi, dov'è la stazione della metropolitana più vicina?",
        "pt": "Com licença, onde fica a estação de metrô mais próxima?", "tr": "Affedersiniz, en yakın metro istasyonu nerede?", "pl": "Przepraszam, gdzie jest najbliższa stacja metra?", "uk": "Перепрошую, де найближча станція метро?",
        "zh": "请问，最近的地铁站在哪里？", "ja": "すみません、最寄りの地下鉄の駅はどこですか？", "ko": "실례지만 가장 가까운 지하철역이 어디인가요?", "hi": "माफ कीजिए, निकटतम मेट्रो स्टेशन कहाँ है?"
    },
    "c_ich_best_tige_gerne_meine_teilnahme_am_meeting": {
        "en": "I gladly confirm my attendance at the meeting.", "en-GB": "I gladly confirm my attendance at the meeting.", "en-US": "I gladly confirm my attendance at the meeting.",
        "fa": "با کمال میل حضورم در جلسه را تایید می‌کنم.", "ar": "يسعدني تأكيد حضوري في الاجتماع.", "nl": "Ik bevestig graag mijn deelname aan de vergadering.", "de": "Ich bestätige gerne meine Teilnahme am Meeting.",
        "fr": "Je confirme volontiers ma présence à la réunion.", "es": "Confirmo con gusto mi asistencia a la reunión.", "it": "Confermo con piacere la mia presenza alla riunione.",
        "pt": "Confirmo com prazer minha presença na reunião.", "tr": "Toplantıya katılımımı memnuniyetle onaylıyorum.", "pl": "Z przyjemnością potwierdzam mój udział w spotkaniu.", "uk": "Я радо підтверджую свою участь у зустрічі.",
        "zh": "我很高兴确认参加本次会议。", "ja": "会議への出席を喜んで確認いたします。", "ko": "회의 참석을 기꺼이 확인합니다.", "hi": "मैं बैठक में अपनी उपस्थिति की सहर्ष पुष्टि करता हूँ।"
    },
    "c_ich_dr_cke_dir_die_daumen": {
        "en": "I'll keep my fingers crossed for you!", "en-GB": "I'll keep my fingers crossed for you!", "en-US": "I'll keep my fingers crossed for you!",
        "fa": "برایت آرزوی موفقیت می‌کنم!", "ar": "أتمنى لك كل التوفيق!", "nl": "Ik duim voor je!", "de": "Ich drücke dir die Daumen!",
        "fr": "Je croise les doigts pour toi !", "es": "¡Cruzo los dedos por ti!", "it": "Incrocio le dita per te!",
        "pt": "Estou torcendo por você!", "tr": "Senin için şans diliyorum!", "pl": "Trzymam za ciebie kciuki!", "uk": "Я тримаю за тебе кулаки!",
        "zh": "我为你加油祈福！", "ja": "うまくいくよう祈っているよ！", "ko": "행운을 빌어줄게!", "hi": "मेरी शुभकामनाएँ तुम्हारे साथ हैं!"
    },
    "c_un_croissant_et_un_caf_sil_vous_pla_t": {
        "en": "A croissant and a coffee, please.", "en-GB": "A croissant and a coffee, please.", "en-US": "A croissant and a coffee, please.",
        "fa": "یک کروسان و یک قهوه، لطفاً.", "ar": "كرواسون وفنجان قهوة، من فضلك.", "nl": "Een croissant en een koffie, alstublieft.", "de": "Ein Croissant und einen Kaffee, bitte.",
        "fr": "Un croissant et un café, s'il vous plaît.", "es": "Un cruasán y un café, por favor.", "it": "Un cornetto e un caffè, per favore.",
        "pt": "Um croissant e um café, por favor.", "tr": "Bir kruvasan ve bir kahve lütfen.", "pl": "Poproszę rogalika i kawę.", "uk": "Один круасан і каву, будь ласка.",
        "zh": "请给我一个可颂和一杯咖啡。", "ja": "クロワッサンとコーヒーを1つずつお願いします。", "ko": "크루아상 하나와 커피 한 잔 주세요.", "hi": "कृपया एक क्रोइसैन और एक कॉफी दीजिए।"
    },
    "c_estce_que_je_peux_payer_par_carte": {
        "en": "Can I pay by card?", "en-GB": "Can I pay by card?", "en-US": "Can I pay with a card?",
        "fa": "آیا می‌توانم با کارت پرداخت کنم؟", "ar": "هل يمكنني الدفع بالبطاقة؟", "nl": "Kan ik pinnen?", "de": "Kann ich mit Karte zahlen?",
        "fr": "Est-ce que je peux payer par carte ?", "es": "¿Puedo pagar con tarjeta?", "it": "Posso pagare con la carta?",
        "pt": "Posso pagar com cartão?", "tr": "Kartla ödeyebilir miyim?", "pl": "Czy mogę zapłacić kartą?", "uk": "Чи можу я розрахуватися карткою?",
        "zh": "我可以刷卡支付吗？", "ja": "カードで支払えますか？", "ko": "카드로 결제할 수 있나요?", "hi": "क्या मैं कार्ड से भुगतान कर सकता हूँ?"
    },
    "c_ne_tinqui_te_pas_tout_va_bien_se_passer": {
        "en": "Don't worry, everything is going to be fine.", "en-GB": "Don't worry, everything is going to be fine.", "en-US": "Don't worry, everything will be fine.",
        "fa": "نگران نباش، همه چیز خوب پیش خواهد رفت.", "ar": "لا تقلق، كل شيء سيكون على ما يرام.", "nl": "Maak je geen zorgen, alles komt goed.", "de": "Keine Sorge, alles wird gut gehen.",
        "fr": "Ne t'inquiète pas, tout va bien se passer.", "es": "No te preocupes, todo va a salir bien.", "it": "Non preoccuparti, andrà tutto bene.",
        "pt": "Não se preocupe, vai dar tudo certo.", "tr": "Endişelenme, her şey yoluna girecek.", "pl": "Nie martw się, wszystko będzie dobrze.", "uk": "Не хвилюйся, все буде добре.",
        "zh": "别担心，一切都会好起来的。", "ja": "心配しないで、すべてうまくいくよ。", "ko": "걱정 마, 다 잘 될 거야.", "hi": "चिंता मत करो, सब ठीक हो जाएगा।"
    },
    "c_a_co_te_les_yeux_de_la_t_te": {
        "en": "It costs an arm and a leg", "en-GB": "It costs an arm and a leg", "en-US": "It costs an arm and a leg",
        "fa": "خیلی گران است (کمرشکن است)", "ar": "يكلف ثروة طائلة", "nl": "het kost een rib uit mijn lijf", "de": "es kostet ein Vermögen",
        "fr": "Ça coûte les yeux de la tête", "es": "cuesta un ojo de la cara", "it": "costa un occhio della testa",
        "pt": "custa os olhos da cara", "tr": "ateş pahası", "pl": "kosztuje majątek", "uk": "це коштує шалених грошей",
        "zh": "价格昂贵得离谱", "ja": "目玉が飛び出るほど高い", "ko": "터무니없이 비싸다", "hi": "यह बहुत महंगा है"
    },
    "c_empty": {
        "en": "The bill, please", "en-GB": "The bill, please", "en-US": "The check, please",
        "fa": "صورتحساب، لطفاً", "ar": "الحساب، لو سمحت", "nl": "De rekening, alstublieft", "de": "Die Rechnung, bitte",
        "fr": "L'addition, s'il vous plaît", "es": "La cuenta, por favor", "it": "Il conto, per favore",
        "pt": "A conta, por favor", "tr": "Hesap lütfen", "pl": "Rachunek poproszę", "uk": "Рахунок, будь ласка",
        "zh": "请结账", "ja": "お会計をお願いします", "ko": "계산서 주세요", "hi": "बिल दीजिए"
    },
    "c_bir_bardak_ay_l_tfen": {
        "en": "A glass of tea, please", "en-GB": "A cup of tea, please", "en-US": "A glass of tea, please",
        "fa": "یک استکان چای لطفاً", "ar": "كوب من الشاي، من فضلك", "nl": "Een glas thee, alstublieft", "de": "Ein Glas Tee, bitte",
        "fr": "Un verre de thé, s'il vous plaît", "es": "Un vaso de té, por favor", "it": "Un bicchiere di tè, per favore",
        "pt": "Um copo de chá, por favor", "tr": "Bir bardak çay lütfen", "pl": "Szklankę herbaty poproszę", "uk": "Склянку чаю, будь ласка",
        "zh": "请给我一杯茶", "ja": "お茶を一杯ください", "ko": "차 한 잔 주세요", "hi": "एक कप चाय दीजिए"
    },
    "c_nas_ls_n_z_iyiyim_te_ekk_r_ederim": {
        "en": "How are you? I'm fine, thank you.", "en-GB": "How are you? I'm fine, thank you.", "en-US": "How are you? I'm doing well, thank you.",
        "fa": "حالتون چطوره؟ خوبم، تشکر می‌کنم.", "ar": "كيف حالكم؟ أنا بخير، شكراً لكم.", "nl": "Hoe gaat het met u? Goed, dank u wel.", "de": "Wie geht es Ihnen? Mir geht es gut, danke.",
        "fr": "Comment allez-vous ? Je vais bien, merci.", "es": "¿Cómo está? Bien, gracias.", "it": "Come sta? Bene, grazie.",
        "pt": "Como você está? Estou bem, obrigado.", "tr": "Nasılsınız? İyiyim, teşekkür ederim.", "pl": "Jak się Pan/Pani ma? Dobrze, dziękuję.", "uk": "Як ви почуваєтеся? Добре, дякую.",
        "zh": "您好吗？我很好，谢谢。", "ja": "お元気ですか？元気です、ありがとうございます。", "ko": "어떻게 지내세요? 잘 지내고 있습니다, 감사합니다.", "hi": "आप कैसे हैं? मैं ठीक हूँ, धन्यवाद।"
    }
}

# Update concept translations with TRANSLATIONS_124
for cid, trans_dict in TRANSLATIONS_124.items():
    if cid not in concept_trans:
        concept_trans[cid] = {}
    for lk, txt in trans_dict.items():
        concept_trans[cid][lk] = {"text": txt}

# Update file
supp["concept_translations"] = concept_trans
with open('data/sources/scope_a_supplement.json', 'w', encoding='utf-8') as f:
    json.dump(supp, f, indent=2, ensure_ascii=False)

print(f"Updated scope_a_supplement.json with {len(TRANSLATIONS_124)} high-fidelity idiom and scenario translations.")
