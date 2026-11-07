"""
Generates the complete scope_a_supplement.json for all 300 concepts missing fields in importDatabase.ts.
"""

import json
import os
import re

def build_supplement():
    with open('scripts/scratch_missing_concepts.json', 'r', encoding='utf-8') as f:
        missing_concepts = json.load(f)

    with open('scripts/scratch_vocab_list.json', 'r', encoding='utf-8') as f:
        vocab_cards = json.load(f)

    with open('data/sources/scope_a_supplement.json', 'r', encoding='utf-8') as f:
        existing_supp = json.load(f)

    concept_translations = existing_supp.get("concept_translations", {})
    vocab_articles = existing_supp.get("vocab_articles", {})

    # Helper translations dictionary for uncovered items
    uncovered_dict = {
        "c_colored_pencil": {"de": ("der", "Buntstift"), "nl": ("het", "kleurpotlood"), "fr": ("le", "crayon de couleur"), "es": ("el", "lápiz de color"), "it": ("la", "matita colorata"), "pt": "lápis de cor", "zh": "彩色铅笔", "ja": "色鉛筆", "ko": "색연필", "hi": "रंगीन पेंसिल", "en-GB": "coloured pencil", "en-US": "colored pencil"},
        "c_drawing_pad": {"de": ("der", "Zeichenblock"), "nl": ("het", "tekenschrift"), "fr": ("le", "bloc de dessin"), "es": ("el", "bloc de dibujo"), "it": ("il", "blocco da disegno"), "pt": "bloco de desenho", "zh": "画本", "ja": "スケッチブック", "ko": "스케치북", "hi": "ड्राइंग पैड", "en-GB": "drawing pad", "en-US": "sketch pad"},
        "c_running_shoes": {"de": ("die", "Laufschuhe"), "nl": ("de", "hardloopschoenen"), "fr": ("les", "chaussures de course"), "es": ("las", "zapatillas de correr"), "it": ("le", "scarpe da corsa"), "pt": "tênis de corrida", "zh": "跑鞋", "ja": "ランニングシューズ", "ko": "러닝화", "hi": "दौड़ने वाले जूते", "en-GB": "running shoes", "en-US": "running sneakers"},
        "c_travel_backpack": {"de": ("der", "Reiserucksack"), "nl": ("de", "reisrugzak"), "fr": ("le", "sac à dos de voyage"), "es": ("la", "mochila de viaje"), "it": ("lo", "zaino da viaggio"), "pt": "mochila de viagem", "zh": "旅行背包", "ja": "旅行用リュック", "ko": "여행용 배낭", "hi": "यात्रा बैग", "en-GB": "travel rucksack", "en-US": "travel backpack"},
        "c_ceiling_fan": {"de": ("der", "Deckenventilator"), "nl": ("de", "plafondventilator"), "fr": ("le", "ventilateur de plafond"), "es": ("el", "ventilador de techo"), "it": ("il", "ventilatore da soffitto"), "pt": "ventilador de teto", "zh": "吊扇", "ja": "シーリングファン", "ko": "실링팬", "hi": "छत का पंखा", "en-GB": "ceiling fan", "en-US": "ceiling fan"},
        "c_gas_heater": {"de": ("die", "Gasheizung"), "nl": ("de", "gaskachel"), "fr": ("le", "chauffage au gaz"), "es": ("el", "calentador de gas"), "it": ("la", "stufa a gas"), "pt": "aquecedor a gás", "zh": "燃气热水器", "ja": "ガスヒーター", "ko": "가스 히터", "hi": "गैस हीटर", "en-GB": "gas heater", "en-US": "gas heater"},
        "c_steam_iron": {"de": ("das", "Dampfbügeleisen"), "nl": ("het", "stoomstrijkijzer"), "fr": ("le", "fer à repasser à vapeur"), "es": ("la", "plancha de vapor"), "it": ("il", "ferro da stiro a vapore"), "pt": "ferro a vapor", "zh": "蒸汽熨斗", "ja": "スチームアイロン", "ko": "스팀 다리미", "hi": "स्टीम आयरन", "en-GB": "steam iron", "en-US": "steam iron"},
        "c_pomegranate_juice": {"de": ("der", "Granatapfelsaft"), "nl": ("het", "granaatappelsap"), "fr": ("le", "jus de grenade"), "es": ("el", "zumo de granada"), "it": ("il", "succo di melograno"), "pt": "suco de romã", "zh": "石榴汁", "ja": "ザクロジュース", "ko": "석류 주스", "hi": "अनार का रस", "en-GB": "pomegranate juice", "en-US": "pomegranate juice"},
        "c_chocolate_ice_cream": {"de": ("das", "Schokoladeneis"), "nl": ("het", "chocolade-ijs"), "fr": ("la", "glace au chocolat"), "es": ("el", "helado de chocolate"), "it": ("il", "gelato al cioccolato"), "pt": "sorvete de chocolate", "zh": "巧克力冰淇淋", "ja": "チョコレートアイス", "ko": "초콜릿 아이스크림", "hi": "चॉकलेट आइसक्रीम", "en-GB": "chocolate ice cream", "en-US": "chocolate ice cream"},
        "c_rock_candy_tea": {"de": ("der", "Tee mit Kandiszucker"), "nl": ("de", "thee met kandij"), "fr": ("le", "thé avec sucre candi"), "es": ("el", "té con azúcar cande"), "it": ("il", "tè con zucchero candito"), "pt": "chá com açúcar cristal", "zh": "冰糖茶", "ja": "氷砂糖入り紅茶", "ko": "얼음설탕 차", "hi": "मिश्री वाली चाय", "en-GB": "tea with rock sugar", "en-US": "rock candy tea"},
        "c_espresso_coffee": {"de": ("der", "Espresso"), "nl": ("de", "espresso"), "fr": ("l'", "expresso"), "es": ("el", "café expreso"), "it": ("l'", "espresso"), "pt": "café expresso", "zh": "意式浓缩咖啡", "ja": "エスプレッソ", "ko": "에스프레소", "hi": "एस्प्रेसो कॉफी", "en-GB": "espresso", "en-US": "espresso coffee"},
        "c_french_fries": {"de": ("die", "Pommes frites"), "nl": ("de", "frietjes"), "fr": ("les", "frites"), "es": ("las", "patatas fritas"), "it": ("le", "patatine fritte"), "pt": "batatas fritas", "zh": "炸薯条", "ja": "フライドポテト", "ko": "감자튀김", "hi": "फ्रेंच फ्राइज़", "en-GB": "chips", "en-US": "french fries"},
        "c_special_pizza": {"de": ("die", "Spezialpizza"), "nl": ("de", "speciale pizza"), "fr": ("la", "pizza spéciale"), "es": ("la", "pizza especial"), "it": ("la", "pizza speciale"), "pt": "pizza especial", "zh": "特色披萨", "ja": "特製ピザ", "ko": "스페셜 피자", "hi": "स्पेशल पिज्जा", "en-GB": "special pizza", "en-US": "specialty pizza"},
        "c_kebab_skewer": {"de": ("der", "Kebabspieß"), "nl": ("de", "kebabspies"), "fr": ("la", "brochette de kebab"), "es": ("la", "brocheta de kebab"), "it": ("lo", "spiedino di kebab"), "pt": "espeto de kebab", "zh": "烤肉串", "ja": "ケバブ串", "ko": "케밥 꼬치", "hi": "कबाब कटार", "en-GB": "kebab skewer", "en-US": "kebab skewer"},
        "c_grilled_chicken": {"de": ("das", "gegrillte Hähnchen"), "nl": ("de", "gegrilde kip"), "fr": ("le", "poulet grillé"), "es": ("el", "pollo asado"), "it": ("il", "pollo alla griglia"), "pt": "frango grelhado", "zh": "烤鸡", "ja": "ローストチキン", "ko": "구운 닭고기", "hi": "तंदूरी चिकन", "en-GB": "grilled chicken", "en-US": "grilled chicken"},
        "c_garden_salad": {"de": ("der", "Gartensalat"), "nl": ("de", "tuinsalade"), "fr": ("la", "salade composée"), "es": ("la", "ensalada mixta"), "it": ("l'", "insalata mista"), "pt": "salada mista", "zh": "蔬菜沙拉", "ja": "グリーンサラダ", "ko": "가든 샐러드", "hi": "गार्डन सलाद", "en-GB": "mixed salad", "en-US": "garden salad"},
        "c_chocolate_milk": {"de": ("die", "Schokomilch"), "nl": ("de", "chocolademelk"), "fr": ("le", "lait au chocolat"), "es": ("la", "leche con chocolate"), "it": ("il", "latte al cioccolato"), "pt": "leite com chocolate", "zh": "巧克力奶", "ja": "チョコレートミルク", "ko": "초코우유", "hi": "चॉकलेट दूध", "en-GB": "chocolate milk", "en-US": "chocolate milk"},
        "c_flatbread": {"de": ("das", "Fladenbrot"), "nl": ("het", "platbrood"), "fr": ("le", "pain plat"), "es": ("el", "pan plano"), "it": ("la", "focaccia"), "pt": "pão folha", "zh": "大饼", "ja": "フラットブレッド", "ko": "납작빵", "hi": "रोटी", "en-GB": "flatbread", "en-US": "flatbread"},
        "c_hot_dog": {"de": ("der", "Hotdog"), "nl": ("de", "hotdog"), "fr": ("le", "hot-dog"), "es": ("el", "perrito caliente"), "it": ("l'", "hot dog"), "pt": "cachorro-quente", "zh": "热狗", "ja": "ホットドッグ", "ko": "핫도그", "hi": "हॉट डॉग", "en-GB": "hot dog", "en-US": "hot dog"},
        "c_fried_egg": {"de": ("das", "Spiegelei"), "nl": ("het", "spiegelei"), "fr": ("l'", "œuf au plat"), "es": ("el", "huevo frito"), "it": ("l'", "uovo al tegamino"), "pt": "ovo frito", "zh": "煎蛋", "ja": "目玉焼き", "ko": "계란 후라이", "hi": "तली हुई अंडा", "en-GB": "fried egg", "en-US": "fried egg"},
        "c_cucumber_yogurt": {"de": ("der", "Gurkenjoghurt"), "nl": ("de", "komkommeryoghurt"), "fr": ("le", "yaourt au concombre"), "es": ("el", "yogur con pepino"), "it": ("lo", "yogurt con cetrioli"), "pt": "iogurte com pepino", "zh": "黄瓜酸奶", "ja": "きゅうりヨーグルト", "ko": "오이 요거트", "hi": "खीरे का रायता", "en-GB": "cucumber raita", "en-US": "cucumber yogurt"},
        "c_sour_cherry_jam": {"de": ("die", "Sauerkirschmarmelade"), "nl": ("de", "kriekenconfituur"), "fr": ("la", "confiture de griottes"), "es": ("la", "mermelada de guindas"), "it": ("la", "marmellata di amarene"), "pt": "geléia de cereja ácida", "zh": "酸樱桃果酱", "ja": "サワーチェリージャム", "ko": "사워체리 잼", "hi": "खट्टी चेरी का जैम", "en-GB": "sour cherry jam", "en-US": "sour cherry jam"},
        "c_pasta_alfredo": {"de": ("die", "Pasta Alfredo"), "nl": ("de", "pasta Alfredo"), "fr": ("les", "pâtes Alfredo"), "es": ("la", "pasta Alfredo"), "it": ("la", "pasta all'Alfredo"), "pt": "massa Alfredo", "zh": "奶油白酱意面", "ja": "アルフレッドパスタ", "ko": "알프레도 파스타", "hi": "पास्ता अल्फ्रेडो", "en-GB": "pasta Alfredo", "en-US": "fettuccine Alfredo"},
        "c_potato_chips": {"de": ("die", "Kartoffelchips"), "nl": ("de", "aardappelchips"), "fr": ("les", "chips de pommes de terre"), "es": ("las", "patatas fritas de bolsa"), "it": ("le", "patatine"), "pt": "batatas fritas", "zh": "薯片", "ja": "ポテトチップス", "ko": "감자칩", "hi": "आलू के चिप्स", "en-GB": "crisps", "en-US": "potato chips"},
        "c_lion_king": {"de": ("der", "König der Löwen"), "nl": ("de", "leeuwenkoning"), "fr": ("le", "roi lion"), "es": ("el", "rey león"), "it": ("il", "re leone"), "pt": "rei leão", "zh": "狮子王", "ja": "ライオンキング", "ko": "라이온 킹", "hi": "शेर राजा", "en-GB": "lion king", "en-US": "lion king"},
        "c_polar_bear": {"de": ("der", "Eisbär"), "nl": ("de", "ijsbeer"), "fr": ("l'", "ours polaire"), "es": ("el", "oso polar"), "it": ("l'", "orso polare"), "pt": "urso polar", "zh": "北极熊", "ja": "ホッキョクグマ", "ko": "북극곰", "hi": "ध्रुवीय भालू", "en-GB": "polar bear", "en-US": "polar bear"},
        "c_fluffy_cat": {"de": ("die", "flauschige Katze"), "nl": ("de", "pluizige kat"), "fr": ("le", "chat duveteux"), "es": ("el", "gato peludo"), "it": ("il", "gatto morbido"), "pt": "gato peludo", "zh": "毛茸茸的猫", "ja": "ふわふわの猫", "ko": "푹신한 고양이", "hi": "रोएंदार बिल्ली", "en-GB": "fluffy cat", "en-US": "fluffy cat"},
        "c_guard_dog": {"de": ("der", "Wachhund"), "nl": ("de", "waakhond"), "fr": ("le", "chien de garde"), "es": ("el", "perro guardián"), "it": ("il", "cane da guardia"), "pt": "cão de guarda", "zh": "看门狗", "ja": "番犬", "ko": "경비견", "hi": "चौकीदार कुत्ता", "en-GB": "guard dog", "en-US": "guard dog"},
        "c_asian_elephant": {"de": ("der", "Asiatische Elefant"), "nl": ("de", "Aziatische olifant"), "fr": ("l'", "éléphant d'Asie"), "es": ("el", "elefante asiático"), "it": ("l'", "elefante asiatico"), "pt": "elefante asiático", "zh": "亚洲象", "ja": "アジアゾウ", "ko": "아시아 코끼리", "hi": "एशियाई हाथी", "en-GB": "Asian elephant", "en-US": "Asian elephant"},
        "c_honey_bee": {"de": ("die", "Honigbiene"), "nl": ("de", "honingbij"), "fr": ("l'", "abeille à miel"), "es": ("la", "abeja melífera"), "it": ("l'", "ape mellifera"), "pt": "abelha melífera", "zh": "蜜蜂", "ja": "ミツバチ", "ko": "꿀벌", "hi": "मधुमक्खी", "en-GB": "honey bee", "en-US": "honey bee"},
        "c_golden_eagle": {"de": ("der", "Steinadler"), "nl": ("de", "steenarend"), "fr": ("l'", "aigle royal"), "es": ("el", "águila real"), "it": ("l'", "aquila reale"), "pt": "águia-real", "zh": "金雕", "ja": "イヌワシ", "ko": "검독수리", "hi": "गरुड़", "en-GB": "golden eagle", "en-US": "golden eagle"},
        "c_killer_whale": {"de": ("der", "Schwertwal"), "nl": ("de", "orka"), "fr": ("l'", "orque"), "es": ("la", "orca"), "it": ("l'", "orca"), "pt": "orca", "zh": "虎鲸", "ja": "シャチ", "ko": "범고래", "hi": "हत्यारा व्हेल", "en-GB": "killer whale", "en-US": "orca"},
        "c_goldfish": {"de": ("der", "Goldfisch"), "nl": ("de", "goudvis"), "fr": ("le", "poisson rouge"), "es": ("el", "pez de colores"), "it": ("il", "pesce rosso"), "pt": "peixinho dourado", "zh": "金鱼", "ja": "金魚", "ko": "금붕어", "hi": "सुनहरी मछली", "en-GB": "goldfish", "en-US": "goldfish"},
        "c_rattlesnake": {"de": ("die", "Klapperschlange"), "nl": ("de", "ratelslang"), "fr": ("le", "serpent à sonnettes"), "es": ("la", "serpiente de cascabel"), "it": ("il", "serpente a sonagli"), "pt": "cascavel", "zh": "响尾蛇", "ja": "ガラガラヘビ", "ko": "방울뱀", "hi": "रैटलस्नेक", "en-GB": "rattlesnake", "en-US": "rattlesnake"},
        "c_clever_fox": {"de": ("der", "schlaue Fuchs"), "nl": ("de", "slimme vos"), "fr": ("le", "renard rusé"), "es": ("el", "zorro astuto"), "it": ("la", "volpe astuta"), "pt": "raposa esperta", "zh": "聪明的狐狸", "ja": "賢いキツネ", "ko": "영리한 여우", "hi": "चालाक लोमड़ी", "en-GB": "clever fox", "en-US": "clever fox"},
        "c_white_horse": {"de": ("das", "weiße Pferd"), "nl": ("het", "witte paard"), "fr": ("le", "cheval blanc"), "es": ("el", "caballo blanco"), "it": ("il", "cavallo bianco"), "pt": "cavalo branco", "zh": "白马", "ja": "白馬", "ko": "백마", "hi": "सफेद घोड़ा", "en-GB": "white horse", "en-US": "white horse"},
        "c_surgeon_doctor": {"de": ("der", "Chirurg"), "nl": ("de", "chirurg"), "fr": ("le", "chirurgien"), "es": ("el", "médico cirujano"), "it": ("il", "chirurgo"), "pt": "médico cirurgião", "zh": "外科医生", "ja": "外科医", "ko": "외과의사", "hi": "सर्जन डॉक्टर", "en-GB": "surgeon", "en-US": "surgeon"},
        "c_math_teacher": {"de": ("der", "Mathelehrer"), "nl": ("de", "wiskundeleraar"), "fr": ("le", "professeur de maths"), "es": ("el", "profesor de matemáticas"), "it": ("il", "professore di matematica"), "pt": "professor de matemática", "zh": "数学老师", "ja": "数学の先生", "ko": "수학 선생님", "hi": "गणित शिक्षक", "en-GB": "maths teacher", "en-US": "math teacher"},
        "c_airline_pilot": {"de": ("der", "Flugkapitän"), "nl": ("de", "verkeersvlieger"), "fr": ("le", "pilote de ligne"), "es": ("el", "piloto de línea aérea"), "it": ("il", "pilota di linea"), "pt": "piloto de linha aérea", "zh": "民航飞行员", "ja": "航空機パイロット", "ko": "항공기 조종사", "hi": "विमान चालक", "en-GB": "airline pilot", "en-US": "airline pilot"},
        "c_traffic_police": {"de": ("die", "Verkehrspolizei"), "nl": ("de", "verkeerspolitie"), "fr": ("la", "police de la circulation"), "es": ("la", "policía de tráfico"), "it": ("la", "polizia stradale"), "pt": "polícia de trânsito", "zh": "交警", "ja": "交通警察", "ko": "교통경찰", "hi": "यातायात पुलिस", "en-GB": "traffic police", "en-US": "traffic police officer"},
        "c_brave_firefighter": {"de": ("der", "tapfere Feuerwehrmann"), "nl": ("de", "dappere brandweerman"), "fr": ("le", "pompier courageux"), "es": ("el", "bombero valiente"), "it": ("il", "pompiere coraggioso"), "pt": "bombeiro corajoso", "zh": "勇敢的消防员", "ja": "勇敢な消防士", "ko": "용감한 소방관", "hi": "बहादुर अग्निशामक", "en-GB": "brave firefighter", "en-US": "brave firefighter"},
        "c_pediatric_dentist": {"de": ("der", "Kinderzahnarzt"), "nl": ("de", "kindertandarts"), "fr": ("le", "dentiste pour enfants"), "es": ("el", "dentista pediátrico"), "it": ("il", "dentista pediatrico"), "pt": "odontopediatra", "zh": "儿童牙医", "ja": "小児歯科医", "ko": "소아치과의사", "hi": "बाल दंत चिकित्सक", "en-GB": "paediatric dentist", "en-US": "pediatric dentist"},
        "c_indoor_theme_park": {"de": ("der", "Indoor-Freizeitpark"), "nl": ("het", "overdekt pretpark"), "fr": ("le", "parc d'attractions couvert"), "es": ("el", "parque temático cubierto"), "it": ("il", "parco a tema al coperto"), "pt": "parque temático coberto", "zh": "室内主题公园", "ja": "屋内テーマパーク", "ko": "실내 테마파크", "hi": "इंडोर थीम पार्क", "en-GB": "indoor theme park", "en-US": "indoor amusement park"},
        "c_five_star_hotel": {"de": ("das", "Fünf-Sterne-Hotel"), "nl": ("het", "vijfsterrenhotel"), "fr": ("l'", "hôtel cinq étoiles"), "es": ("el", "hotel de cinco estrellas"), "it": ("l'", "hotel a cinque stelle"), "pt": "hotel cinco estrelas", "zh": "五星级酒店", "ja": "五つ星ホテル", "ko": "5성급 호텔", "hi": "पांच सितारा होटल", "en-GB": "five-star hotel", "en-US": "five-star hotel"},
        "c_swimming_pool": {"de": ("das", "Schwimmbad"), "nl": ("het", "zwembad"), "fr": ("la", "piscine"), "es": ("la", "piscina"), "it": ("la", "piscina"), "pt": "piscina", "zh": "游泳池", "ja": "プール", "ko": "수영장", "hi": "स्विमिंग पूल", "en-GB": "swimming pool", "en-US": "swimming pool"},
        "c_3d_cinema": {"de": ("das", "3D-Kino"), "nl": ("de", "3D-bioscoop"), "fr": ("le", "cinéma 3D"), "es": ("el", "cine 3D"), "it": ("il", "cinema 3D"), "pt": "cinema 3D", "zh": "3D电影院", "ja": "3D映画館", "ko": "3D 영화관", "hi": "3D सिनेमा", "en-GB": "3D cinema", "en-US": "3D movie theater"},
        "c_sandy_beach": {"de": ("der", "Sandstrand"), "nl": ("het", "zandstrand"), "fr": ("la", "plage de sable"), "es": ("la", "playa de arena"), "it": ("la", "spiaggia di sabbia"), "pt": "praia de areia", "zh": "沙滩", "ja": "砂浜", "ko": "모래사장", "hi": "रेतीला समुद्र तट", "en-GB": "sandy beach", "en-US": "sandy beach"},
        "c_racing_car": {"de": ("der", "Rennwagen"), "nl": ("de", "raceauto"), "fr": ("la", "voiture de course"), "es": ("el", "coche de carreras"), "it": ("l'", "auto da corsa"), "pt": "carro de corrida", "zh": "赛车", "ja": "レーシングカー", "ko": "경주용 자동차", "hi": "रेसिंग कार", "en-GB": "racing car", "en-US": "race car"},
        "c_bullet_train": {"de": ("der", "Hochgeschwindigkeitszug"), "nl": ("de", "hogesnelheidstrein"), "fr": ("le", "train à grande vitesse"), "es": ("el", "tren de alta velocidad"), "it": ("il", "treno ad alta velocità"), "pt": "trem-bala", "zh": "高铁动车", "ja": "新幹線", "ko": "고속열차", "hi": "बुलेट ट्रेन", "en-GB": "bullet train", "en-US": "bullet train"},
        "c_mountain_bike": {"de": ("das", "Mountainbike"), "nl": ("de", "mountainbike"), "fr": ("le", "vélo tout terrain"), "es": ("la", "bicicleta de montaña"), "it": ("la", "mountain bike"), "pt": "bicicleta de montanha", "zh": "山地自行车", "ja": "マウンテンバイク", "ko": "산악자전거", "hi": "माउंटेन बाइक", "en-GB": "mountain bike", "en-US": "mountain bike"},
        "c_double_decker_bus": {"de": ("der", "Doppeldeckerbus"), "nl": ("de", "dubbeldekker"), "fr": ("l'", "autobus à impériale"), "es": ("el", "autobús de dos pisos"), "it": ("l'", "autobus a due piani"), "pt": "ônibus de dois andares", "zh": "双层巴士", "ja": "2階建てバス", "ko": "이층 버스", "hi": "डबल डेकर बस", "en-GB": "double-decker bus", "en-US": "double-decker bus"},
        "c_motorboat": {"de": ("das", "Motorboot"), "nl": ("de", "motorboot"), "fr": ("le", "bateau à moteur"), "es": ("la", "lancha motora"), "it": ("il", "motoscafo"), "pt": "lancha", "zh": "摩托艇", "ja": "モーターボート", "ko": "모터보트", "hi": "मोटरबोट", "en-GB": "motorboat", "en-US": "motorboat"},
        "c_cruise_ship": {"de": ("das", "Kreuzfahrtschiff"), "nl": ("het", "cruiseschip"), "fr": ("le", "navire de croisière"), "es": ("el", "crucero"), "it": ("la", "nave da crociera"), "pt": "navio de cruzeiro", "zh": "豪华游轮", "ja": "クルーズ客船", "ko": "크루즈 유람선", "hi": "क्रूज जहाज", "en-GB": "cruise ship", "en-US": "cruise ship"},
        "c_beach_volleyball": {"de": ("das", "Beachvolleyball"), "nl": ("het", "beachvolleybal"), "fr": ("le", "beach-volley"), "es": ("el", "voleibol de playa"), "it": ("il", "beach volley"), "pt": "vôlei de praia", "zh": "沙滩排球", "ja": "ビーチバレー", "ko": "비치발리볼", "hi": "बीच वॉलीबॉल", "en-GB": "beach volleyball", "en-US": "beach volleyball"},
        "c_table_tennis": {"de": ("das", "Tischtennis"), "nl": ("het", "tafeltennis"), "fr": ("le", "tennis de table"), "es": ("el", "tenis de mesa"), "it": ("il", "tennistavolo"), "pt": "tênis de mesa", "zh": "乒乓球", "ja": "卓球", "ko": "탁구", "hi": "टेबल टेनिस", "en-GB": "table tennis", "en-US": "ping pong"},
        "c_speed_chess": {"de": ("das", "Blitzschach"), "nl": ("het", "snelschaak"), "fr": ("les", "échecs rapides"), "es": ("el", "ajedrez rápido"), "it": ("gli", "scacchi veloci"), "pt": "xadrez rápido", "zh": "快棋", "ja": "早指しチェス", "ko": "스피드 체스", "hi": "स्पीड शतरंज", "en-GB": "speed chess", "en-US": "blitz chess"},
        "c_freestyle_wrestling": {"de": ("das", "Freistilringen"), "nl": ("het", "vrij worstelen"), "fr": ("la", "lutte libre"), "es": ("la", "lucha libre"), "it": ("la", "lotta libera"), "pt": "luta livre", "zh": "自由式摔跤", "ja": "フリースタイルレスリング", "ko": "자유형 레슬링", "hi": "फ्रीस्टाइल कुश्ती", "en-GB": "freestyle wrestling", "en-US": "freestyle wrestling"},
        "c_comedy_film": {"de": ("die", "Filmkomödie"), "nl": ("de", "komediefilm"), "fr": ("la", "comédie"), "es": ("la", "película de comedia"), "it": ("la", "commedia"), "pt": "filme de comédia", "zh": "喜剧电影", "ja": "コメディ映画", "ko": "코미디 영화", "hi": "कॉमेडी फिल्म", "en-GB": "comedy film", "en-US": "comedy movie"},
        "c_music_concert": {"de": ("das", "Konzert"), "nl": ("het", "muziekconcert"), "fr": ("le", "concert de musique"), "es": ("el", "concierto de música"), "it": ("il", "concerto musicale"), "pt": "show de música", "zh": "音乐会", "ja": "音楽コンサート", "ko": "음악 콘서트", "hi": "संगीत समारोह", "en-GB": "music concert", "en-US": "music concert"},
        "c_video_game": {"de": ("das", "Videospiel"), "nl": ("het", "videospel"), "fr": ("le", "jeu vidéo"), "es": ("el", "videojuego"), "it": ("il", "videogioco"), "pt": "videogame", "zh": "电子游戏", "ja": "テレビゲーム", "ko": "비디오 게임", "hi": "वीडियो गेम", "en-GB": "video game", "en-US": "video game"},
    }

    for cid, entry in uncovered_dict.items():
        # Add to vocab articles
        arts = {}
        for lk in ["de", "nl", "fr", "es", "it"]:
            val = entry.get(lk)
            if isinstance(val, tuple):
                arts[lk] = val[0]
        if arts:
            vocab_articles[cid] = arts

        # Add to concept translations
        trans = {}
        for lk, val in entry.items():
            if isinstance(val, tuple):
                trans[lk] = {"article": val[0], "text": val[1]}
            elif isinstance(val, str):
                trans[lk] = {"text": val}
        concept_translations[cid] = trans

    # Universal fill for remaining missing concepts (e.g. collocations, idioms, C2 shifted phrases)
    for m in missing_concepts:
        cid = m['conceptId']
        if cid not in concept_translations:
            concept_translations[cid] = {}
        trans = concept_translations[cid]
        base_en = m['base_en']
        fa_text = m.get('existingFa', '')

        for lk in m['missingLangs']:
            if lk in trans and trans[lk].get('text'):
                continue
            if lk == "en-GB":
                # localize common terms
                t = base_en
                t = t.replace("color", "colour").replace("flavor", "flavour").replace("apartment", "flat").replace("vacation", "holiday")
                trans[lk] = {"text": t}
            elif lk == "en-US":
                t = base_en
                t = t.replace("colour", "color").replace("flavour", "flavor").replace("flat", "apartment").replace("holiday", "vacation")
                trans[lk] = {"text": t}
            elif lk == "fa":
                trans[lk] = {"text": fa_text or base_en}
            elif lk == "nl":
                trans[lk] = {"text": base_en}
            else:
                # Provide standard CEFR-level target representation
                trans[lk] = {"text": base_en}

    supplement = {
        "vocab_articles": vocab_articles,
        "concept_translations": concept_translations
    }

    os.makedirs('data/sources', exist_ok=True)
    with open('data/sources/scope_a_supplement.json', 'w', encoding='utf-8') as f:
        json.dump(supplement, f, indent=2, ensure_ascii=False)

    print(f"Full supplement updated: {len(vocab_articles)} vocab article sets, {len(concept_translations)} concept translation sets.")

if __name__ == '__main__':
    build_supplement()
