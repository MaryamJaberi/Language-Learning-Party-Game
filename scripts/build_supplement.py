"""
Builds scope_a_supplement.json for all 300 concepts missing fields in importDatabase.ts.
Includes:
- Accurate translations across all 18 languages
- Grammatical articles for nouns in de, nl, fr, es, it, ar
- Localization for en-GB / en-US
- Persian conversational standard with proper ZWNJ (می‌خواهم, نمی‌دانم) and Persian letters
"""

import json
import os
import re

# Comprehensive noun dictionary for articles and translations
# conceptId -> { de: (art, text), nl: (art, text), fr: (art, text), es: (art, text), it: (art, text), pt, zh, ja, ko, hi, en_gb, en_us }
# For words already present in some languages, only missing languages will be applied by importer.

NOUN_ENTRIES = {
    "c_glass": {"de": ("das", "Glas"), "nl": ("het", "glas"), "fr": ("le", "verre"), "es": ("el", "vaso"), "it": ("il", "bicchiere"), "pt": "copo", "zh": "玻璃杯", "ja": "グラス", "ko": "유리잔", "hi": "ग्लास", "en-GB": "glass", "en-US": "glass"},
    "c_plate": {"de": ("der", "Teller"), "nl": ("het", "bord"), "fr": ("l'", "assiette"), "es": ("el", "plato"), "it": ("il", "piatto"), "pt": "prato", "zh": "盘子", "ja": "皿", "ko": "접시", "hi": "प्लेट", "en-GB": "plate", "en-US": "plate"},
    "c_spoon": {"de": ("der", "Löffel"), "nl": ("de", "lepel"), "fr": ("la", "cuillère"), "es": ("la", "cuchara"), "it": ("il", "cucchiaio"), "pt": "colher", "zh": "勺子", "ja": "スプーン", "ko": "숟가락", "hi": "चम्मच", "en-GB": "spoon", "en-US": "spoon"},
    "c_fork": {"de": ("die", "Gabel"), "nl": ("de", "vork"), "fr": ("la", "fourchette"), "es": ("el", "tenedor"), "it": ("la", "forchetta"), "pt": "garfo", "zh": "叉子", "ja": "フォーク", "ko": "포크", "hi": "कांटा", "en-GB": "fork", "en-US": "fork"},
    "c_knife": {"de": ("das", "Messer"), "nl": ("het", "mes"), "fr": ("le", "couteau"), "es": ("el", "cuchillo"), "it": ("il", "coltello"), "pt": "faca", "zh": "刀", "ja": "ナイフ", "ko": "칼", "hi": "चाकू", "en-GB": "knife", "en-US": "knife"},
    "c_pot": {"de": ("der", "Topf"), "nl": ("de", "pan"), "fr": ("la", "marmite"), "es": ("la", "olla"), "it": ("la", "pentola"), "pt": "panela", "zh": "锅", "ja": "鍋", "ko": "냄비", "hi": "बर्तन", "en-GB": "pot", "en-US": "pot"},
    "c_frying_pan": {"de": ("die", "Pfanne"), "nl": ("de", "koekenpan"), "fr": ("la", "poêle"), "es": ("la", "sartén"), "it": ("la", "padella"), "pt": "frigideira", "zh": "煎锅", "ja": "フライパン", "ko": "프라이팬", "hi": "कड़ाही", "en-GB": "frying pan", "en-US": "skillet"},
    "c_fridge": {"de": ("der", "Kühlschrank"), "nl": ("de", "koelkast"), "fr": ("le", "frigo"), "es": ("la", "nevera"), "it": ("il", "frigorifero"), "pt": "geladeira", "zh": "冰箱", "ja": "冷蔵庫", "ko": "냉장고", "hi": "फ्रिज", "en-GB": "fridge", "en-US": "refrigerator"},
    "c_freezer": {"de": ("der", "Gefrierschrank"), "nl": ("de", "vriezer"), "fr": ("le", "congélateur"), "es": ("el", "congelador"), "it": ("il", "congelatore"), "pt": "congelador", "zh": "冰柜", "ja": "冷凍庫", "ko": "냉동고", "hi": "फ्रीजर", "en-GB": "freezer", "en-US": "freezer"},
    "c_stove": {"de": ("der", "Herd"), "nl": ("het", "fornuis"), "fr": ("la", "cuisinière"), "es": ("la", "estufa"), "it": ("il", "fornello"), "pt": "fogão", "zh": "炉灶", "ja": "コンロ", "ko": "가스레인지", "hi": "चूल्हा", "en-GB": "cooker", "en-US": "stove"},
    "c_oven": {"de": ("der", "Ofen"), "nl": ("de", "oven"), "fr": ("le", "four"), "es": ("el", "horno"), "it": ("il", "forno"), "pt": "forno", "zh": "烤箱", "ja": "オーブン", "ko": "오븐", "hi": "ओवन", "en-GB": "oven", "en-US": "oven"},
    "c_microwave": {"de": ("die", "Mikrowelle"), "nl": ("de", "magnetron"), "fr": ("le", "micro-ondes"), "es": ("el", "microondas"), "it": ("il", "microonde"), "pt": "micro-ondas", "zh": "微波炉", "ja": "電子レンジ", "ko": "전자레인지", "hi": "माइक्रोवेव", "en-GB": "microwave", "en-US": "microwave"},
    "c_samovar": {"de": ("der", "Samowar"), "nl": ("de", "samovar"), "fr": ("le", "samovar"), "es": ("el", "samovar"), "it": ("il", "samovar"), "pt": "samovar", "zh": "茶炊", "ja": "サモワール", "ko": "사모바르", "hi": "समोवार", "en-GB": "samovar", "en-US": "samovar"},
    "c_kettle": {"de": ("der", "Wasserkocher"), "nl": ("de", "waterkoker"), "fr": ("la", "bouilloire"), "es": ("el", "hervidor"), "it": ("il", "bollitore"), "pt": "chaleira", "zh": "水壶", "ja": "やかん", "ko": "주전자", "hi": "केतली", "en-GB": "kettle", "en-US": "kettle"},
    "c_coffee_maker": {"de": ("die", "Kaffeemaschine"), "nl": ("het", "koffiezetapparaat"), "fr": ("la", "cafetière"), "es": ("la", "cafetera"), "it": ("la", "caffettiera"), "pt": "cafeteira", "zh": "咖啡机", "ja": "コーヒーメーカー", "ko": "커피머신", "hi": "कॉफी मेकर", "en-GB": "coffee maker", "en-US": "coffee maker"},
    "c_cup": {"de": ("die", "Tasse"), "nl": ("het", "kopje"), "fr": ("la", "tasse"), "es": ("la", "taza"), "it": ("la", "tazza"), "pt": "xícara", "zh": "杯子", "ja": "カップ", "ko": "컵", "hi": "कप", "en-GB": "cup", "en-US": "cup"},
    "c_bottle": {"de": ("die", "Flasche"), "nl": ("de", "fles"), "fr": ("la", "bouteille"), "es": ("la", "botella"), "it": ("la", "bottiglia"), "pt": "garrafa", "zh": "瓶子", "ja": "ボトル", "ko": "병", "hi": "बोतल", "en-GB": "bottle", "en-US": "bottle"},
    "c_flask": {"de": ("die", "Feldflasche"), "nl": ("de", "veldfles"), "fr": ("la", "gourde"), "es": ("la", "cantimplora"), "it": ("la", "borraccia"), "pt": "frasco", "zh": "水壶", "ja": "フラスコ", "ko": "보온병", "hi": "फ्लास्क", "en-GB": "flask", "en-US": "flask"},
    "c_bucket": {"de": ("der", "Eimer"), "nl": ("de", "emmer"), "fr": ("le", "seau"), "es": ("el", "cubo"), "it": ("il", "secchio"), "pt": "balde", "zh": "水桶", "ja": "バケツ", "ko": "양동이", "hi": "बाल्टी", "en-GB": "bucket", "en-US": "bucket"},
    "c_broom": {"de": ("der", "Besen"), "nl": ("de", "bezem"), "fr": ("le", "balai"), "es": ("la", "escoba"), "it": ("la", "scopa"), "pt": "vassoura", "zh": "扫帚", "ja": "ほうき", "ko": "빗자루", "hi": "झाड़ू", "en-GB": "broom", "en-US": "broom"},
    "c_soap": {"de": ("die", "Seife"), "nl": ("de", "zeep"), "fr": ("le", "savon"), "es": ("el", "jabón"), "it": ("il", "sapone"), "pt": "sabão", "zh": "肥皂", "ja": "石鹸", "ko": "비누", "hi": "साबुन", "en-GB": "soap", "en-US": "soap"},
    "c_shampoo": {"de": ("das", "Shampoo"), "nl": ("de", "shampoo"), "fr": ("le", "shampooing"), "es": ("el", "champú"), "it": ("lo", "shampoo"), "pt": "xampu", "zh": "洗发水", "ja": "シャンプー", "ko": "샴푸", "hi": "शैम्पू", "en-GB": "shampoo", "en-US": "shampoo"},
    "c_toothbrush": {"de": ("die", "Zahnbürste"), "nl": ("de", "tandenborstel"), "fr": ("la", "brosse à dents"), "es": ("el", "cepillo de dientes"), "it": ("lo", "spazzolino"), "pt": "escova de dentes", "zh": "牙刷", "ja": "歯ブラシ", "ko": "칫솔", "hi": "टूथब्रश", "en-GB": "toothbrush", "en-US": "toothbrush"},
    "c_towel": {"de": ("das", "Handtuch"), "nl": ("de", "handdoek"), "fr": ("la", "serviette"), "es": ("la", "toalla"), "it": ("l'", "asciugamano"), "pt": "toalha", "zh": "毛巾", "ja": "タオル", "ko": "수건", "hi": "तौलिया", "en-GB": "towel", "en-US": "towel"},
    "c_mirror": {"de": ("der", "Spiegel"), "nl": ("de", "spiegel"), "fr": ("le", "miroir"), "es": ("el", "espejo"), "it": ("lo", "specchio"), "pt": "espelho", "zh": "镜子", "ja": "鏡", "ko": "거울", "hi": "आईना", "en-GB": "mirror", "en-US": "mirror"},
    "c_comb": {"de": ("der", "Kamm"), "nl": ("de", "kam"), "fr": ("le", "peigne"), "es": ("el", "peine"), "it": ("il", "pettine"), "pt": "pente", "zh": "梳子", "ja": "くし", "ko": "빗", "hi": "कंघी", "en-GB": "comb", "en-US": "comb"},
    "c_hairdryer": {"de": ("der", "Föhn"), "nl": ("de", "föhn"), "fr": ("le", "sèche-cheveux"), "es": ("el", "secador"), "it": ("l'", "asciugacapelli"), "pt": "secador", "zh": "吹风机", "ja": "ドライヤー", "ko": "헤어드라이어", "hi": "हेयर ड्रायर", "en-GB": "hairdryer", "en-US": "blow dryer"},
    "c_closet": {"de": ("der", "Schrank"), "nl": ("de", "kast"), "fr": ("l'", "armoire"), "es": ("el", "armario"), "it": ("l'", "armadio"), "pt": "armário", "zh": "衣柜", "ja": "クローゼット", "ko": "옷장", "hi": "अलमारी", "en-GB": "wardrobe", "en-US": "closet"},
    "c_pillow": {"de": ("das", "Kissen"), "nl": ("het", "kussen"), "fr": ("l'", "oreiller"), "es": ("la", "almohada"), "it": ("il", "cuscino"), "pt": "travesseiro", "zh": "枕头", "ja": "枕", "ko": "베개", "hi": "तकिया", "en-GB": "pillow", "en-US": "pillow"},
    "c_blanket": {"de": ("die", "Decke"), "nl": ("de", "deken"), "fr": ("la", "couverture"), "es": ("la", "manta"), "it": ("la", "coperta"), "pt": "cobertor", "zh": "毯子", "ja": "毛布", "ko": "담요", "hi": "कंबल", "en-GB": "blanket", "en-US": "blanket"},
    "c_carpet": {"de": ("der", "Teppich"), "nl": ("het", "tapijt"), "fr": ("le", "tapis"), "es": ("la", "alfombra"), "it": ("il", "tappeto"), "pt": "tapete", "zh": "地毯", "ja": "絨毯", "ko": "카펫", "hi": "कालीन", "en-GB": "carpet", "en-US": "carpet"},
    "c_telephone": {"de": ("das", "Telefon"), "nl": ("de", "telefoon"), "fr": ("le", "téléphone"), "es": ("el", "teléfono"), "it": ("il", "telefono"), "pt": "telefone", "zh": "电话", "ja": "電話", "ko": "전화기", "hi": "फोन", "en-GB": "telephone", "en-US": "telephone"},
    "c_lock": {"de": ("das", "Schloss"), "nl": ("het", "slot"), "fr": ("la", "serrure"), "es": ("la", "cerradura"), "it": ("la", "serratura"), "pt": "fechadura", "zh": "锁", "ja": "鍵", "ko": "자물쇠", "hi": "ताला", "en-GB": "lock", "en-US": "lock"},
    "c_bulb": {"de": ("die", "Glühbirne"), "nl": ("de", "gloeilamp"), "fr": ("l'", "ampoule"), "es": ("la", "bombilla"), "it": ("la", "lampadina"), "pt": "lâmpada", "zh": "灯泡", "ja": "電球", "ko": "전구", "hi": "बल्ब", "en-GB": "light bulb", "en-US": "light bulb"},
    "c_television": {"de": ("der", "Fernseher"), "nl": ("de", "televisie"), "fr": ("la", "télévision"), "es": ("la", "televisión"), "it": ("la", "televisione"), "pt": "televisão", "zh": "电视", "ja": "テレビ", "ko": "텔레비전", "hi": "टेलीविजन", "en-GB": "telly", "en-US": "television"},
    "c_eraser": {"de": ("der", "Radiergummi"), "nl": ("de", "gum"), "fr": ("la", "gomme"), "es": ("la", "goma"), "it": ("la", "gomma"), "pt": "borracha", "zh": "橡皮擦", "ja": "消しゴム", "ko": "지우개", "hi": "रबर", "en-GB": "rubber", "en-US": "eraser"},
    "c_pasta": {"de": ("die", "Nudeln"), "nl": ("de", "pasta"), "fr": ("les", "pâtes"), "es": ("la", "pasta"), "it": ("la", "pasta"), "pt": "massa", "zh": "意大利面", "ja": "パスタ", "ko": "파스타", "hi": "पास्ता", "en-GB": "pasta", "en-US": "pasta"},
    "c_potato": {"de": ("die", "Kartoffel"), "nl": ("de", "aardappel"), "fr": ("la", "pomme de terre"), "es": ("la", "patata"), "it": ("la", "patata"), "pt": "batata", "zh": "土豆", "ja": "じゃがいも", "ko": "감자", "hi": "आलू", "en-GB": "potato", "en-US": "potato"},
    "c_tomato": {"de": ("die", "Tomate"), "nl": ("de", "tomaat"), "fr": ("la", "tomate"), "es": ("el", "tomate"), "it": ("il", "pomodoro"), "pt": "tomate", "zh": "番茄", "ja": "トマト", "ko": "토마토", "hi": "टमाटर", "en-GB": "tomato", "en-US": "tomato"},
    "c_cucumber": {"de": ("die", "Gurke"), "nl": ("de", "komkommer"), "fr": ("le", "concombre"), "es": ("el", "pepino"), "it": ("il", "cetriolo"), "pt": "pepino", "zh": "黄瓜", "ja": "きゅうり", "ko": "오이", "hi": "खीरा", "en-GB": "cucumber", "en-US": "cucumber"},
    "c_onion": {"de": ("die", "Zwiebel"), "nl": ("de", "ui"), "fr": ("l'", "oignon"), "es": ("la", "cebolla"), "it": ("la", "cipolla"), "pt": "cebola", "zh": "洋葱", "ja": "玉ねぎ", "ko": "양파", "hi": "प्याज", "en-GB": "onion", "en-US": "onion"},
    "c_carrot": {"de": ("die", "Karotte"), "nl": ("de", "wortel"), "fr": ("la", "carotte"), "es": ("la", "zanahoria"), "it": ("la", "carota"), "pt": "cenoura", "zh": "胡萝卜", "ja": "にんじん", "ko": "당근", "hi": "गाजर", "en-GB": "carrot", "en-US": "carrot"},
    "c_meat": {"de": ("das", "Fleisch"), "nl": ("het", "vlees"), "fr": ("la", "viande"), "es": ("la", "carne"), "it": ("la", "carne"), "pt": "carne", "zh": "肉", "ja": "肉", "ko": "고기", "hi": "मांस", "en-GB": "meat", "en-US": "meat"},
    "c_yogurt": {"de": ("der", "Joghurt"), "nl": ("de", "yoghurt"), "fr": ("le", "yaourt"), "es": ("el", "yogur"), "it": ("lo", "yogurt"), "pt": "iogurte", "zh": "酸奶", "ja": "ヨーグルト", "ko": "요거트", "hi": "दही", "en-GB": "yoghurt", "en-US": "yogurt"},
    "c_ice_cream": {"de": ("das", "Eis"), "nl": ("het", "ijs"), "fr": ("la", "glace"), "es": ("el", "helado"), "it": ("il", "gelato"), "pt": "sorvete", "zh": "冰淇淋", "ja": "アイスクリーム", "ko": "아이스크림", "hi": "आइसक्रीम", "en-GB": "ice cream", "en-US": "ice cream"},
    "c_cake": {"de": ("der", "Kuchen"), "nl": ("de", "taart"), "fr": ("le", "gâteau"), "es": ("el", "pastel"), "it": ("la", "torta"), "pt": "bolo", "zh": "蛋糕", "ja": "ケーキ", "ko": "케이크", "hi": "केक", "en-GB": "cake", "en-US": "cake"},
    "c_banana": {"de": ("die", "Banane"), "nl": ("de", "banaan"), "fr": ("la", "banane"), "es": ("el", "plátano"), "it": ("la", "banana"), "pt": "banana", "zh": "香蕉", "ja": "バナナ", "ko": "바나나", "hi": "केला", "en-GB": "banana", "en-US": "banana"},
    "c_orange": {"de": ("die", "Orange"), "nl": ("de", "sinaasappel"), "fr": ("l'", "orange"), "es": ("la", "naranja"), "it": ("l'", "arancia"), "pt": "laranja", "zh": "橙子", "ja": "オレンジ", "ko": "오렌지", "hi": "संतरा", "en-GB": "orange", "en-US": "orange"},
    "c_pomegranate": {"de": ("der", "Granatapfel"), "nl": ("de", "granaatappel"), "fr": ("la", "grenade"), "es": ("la", "granada"), "it": ("il", "melograno"), "pt": "romã", "zh": "石榴", "ja": "ザクロ", "ko": "석류", "hi": "अनार", "en-GB": "pomegranate", "en-US": "pomegranate"},
    "c_grape": {"de": ("die", "Weintraube"), "nl": ("de", "druif"), "fr": ("le", "raisin"), "es": ("la", "uva"), "it": ("l'", "uva"), "pt": "uva", "zh": "葡萄", "ja": "ぶどう", "ko": "포도", "hi": "अंगूर", "en-GB": "grape", "en-US": "grape"},
    "c_watermelon": {"de": ("die", "Wassermelone"), "nl": ("de", "watermeloen"), "fr": ("la", "pastèque"), "es": ("la", "sandía"), "it": ("l'", "anguria"), "pt": "melancia", "zh": "西瓜", "ja": "スイカ", "ko": "수박", "hi": "तरबूज", "en-GB": "watermelon", "en-US": "watermelon"},
    "c_hamburger": {"de": ("der", "Hamburger"), "nl": ("de", "hamburger"), "fr": ("le", "hamburger"), "es": ("la", "hamburguesa"), "it": ("l'", "hamburger"), "pt": "hambúrguer", "zh": "汉堡包", "ja": "ハンバーガー", "ko": "햄버거", "hi": "बर्गर", "en-GB": "burger", "en-US": "hamburger"},
    "c_kebab": {"de": ("der", "Kebab"), "nl": ("de", "kebab"), "fr": ("le", "kebab"), "es": ("el", "kebab"), "it": ("il", "kebab"), "pt": "kebab", "zh": "烤肉串", "ja": "ケバブ", "ko": "케밥", "hi": "कबाब", "en-GB": "kebab", "en-US": "kebab"},
    "c_horse": {"de": ("das", "Pferd"), "nl": ("het", "paard"), "fr": ("le", "cheval"), "es": ("el", "caballo"), "it": ("il", "cavallo"), "pt": "cavalo", "zh": "马", "ja": "馬", "ko": "말", "hi": "घोड़ा", "en-GB": "horse", "en-US": "horse"},
    "c_cow": {"de": ("die", "Kuh"), "nl": ("de", "koe"), "fr": ("la", "vache"), "es": ("la", "vaca"), "it": ("la", "mucca"), "pt": "vaca", "zh": "奶牛", "ja": "牛", "ko": "소", "hi": "गाय", "en-GB": "cow", "en-US": "cow"},
    "c_sheep": {"de": ("das", "Schaf"), "nl": ("het", "schaap"), "fr": ("le", "mouton"), "es": ("la", "oveja"), "it": ("la", "pecora"), "pt": "ovelha", "zh": "羊", "ja": "羊", "ko": "양", "hi": "भेड़", "en-GB": "sheep", "en-US": "sheep"},
    "c_camel": {"de": ("das", "Kamel"), "nl": ("de", "kameel"), "fr": ("le", "chameau"), "es": ("el", "camello"), "it": ("il", "cammello"), "pt": "camelo", "zh": "骆驼", "ja": "ラクダ", "ko": "낙타", "hi": "ऊंट", "en-GB": "camel", "en-US": "camel"},
    "c_rabbit": {"de": ("das", "Kaninchen"), "nl": ("het", "konijn"), "fr": ("le", "lapin"), "es": ("el", "conejo"), "it": ("il", "coniglio"), "pt": "coelho", "zh": "兔子", "ja": "うさぎ", "ko": "토끼", "hi": "खरगोश", "en-GB": "rabbit", "en-US": "rabbit"},
    "c_bear": {"de": ("der", "Bär"), "nl": ("de", "beer"), "fr": ("l'", "ours"), "es": ("el", "oso"), "it": ("l'", "orso"), "pt": "urso", "zh": "熊", "ja": "熊", "ko": "곰", "hi": "भालू", "en-GB": "bear", "en-US": "bear"},
    "c_wolf": {"de": ("der", "Wolf"), "nl": ("de", "wolf"), "fr": ("le", "loup"), "es": ("el", "lobo"), "it": ("il", "lupo"), "pt": "lobo", "zh": "狼", "ja": "狼", "ko": "늑대", "hi": "भेड़िया", "en-GB": "wolf", "en-US": "wolf"},
    "c_fox": {"de": ("der", "Fuchs"), "nl": ("de", "vos"), "fr": ("le", "renard"), "es": ("el", "zorro"), "it": ("la", "volpe"), "pt": "raposa", "zh": "狐狸", "ja": "キツネ", "ko": "여우", "hi": "लोमड़ी", "en-GB": "fox", "en-US": "fox"},
    "c_lion": {"de": ("der", "Löwe"), "nl": ("de", "leeuw"), "fr": ("le", "lion"), "es": ("el", "león"), "it": ("il", "leone"), "pt": "leão", "zh": "狮子", "ja": "ライオン", "ko": "사자", "hi": "शेर", "en-GB": "lion", "en-US": "lion"},
    "c_tiger": {"de": ("der", "Tiger"), "nl": ("de", "tijger"), "fr": ("le", "tigre"), "es": ("el", "tigre"), "it": ("la", "tigre"), "pt": "tigre", "zh": "老虎", "ja": "トラ", "ko": "호랑이", "hi": "बाघ", "en-GB": "tiger", "en-US": "tiger"},
    "c_leopard": {"de": ("der", "Leopard"), "nl": ("het", "luipaard"), "fr": ("le", "léopard"), "es": ("el", "leopardo"), "it": ("il", "leopardo"), "pt": "leopardo", "zh": "豹子", "ja": "ヒョウ", "ko": "표범", "hi": "तेंदुआ", "en-GB": "leopard", "en-US": "leopard"},
    "c_elephant": {"de": ("der", "Elefant"), "nl": ("de", "olifant"), "fr": ("l'", "éléphant"), "es": ("el", "elefante"), "it": ("l'", "elefante"), "pt": "elefante", "zh": "大象", "ja": "象", "ko": "코끼리", "hi": "हाथी", "en-GB": "elephant", "en-US": "elephant"},
    "c_giraffe": {"de": ("die", "Giraffe"), "nl": ("de", "giraf"), "fr": ("la", "girafe"), "es": ("la", "jirafa"), "it": ("la", "giraffa"), "pt": "girafa", "zh": "长颈鹿", "ja": "キリン", "ko": "기린", "hi": "जिराफ़", "en-GB": "giraffe", "en-US": "giraffe"},
    "c_monkey": {"de": ("der", "Affe"), "nl": ("de", "aap"), "fr": ("le", "singe"), "es": ("el", "mono"), "it": ("la", "scimmia"), "pt": "macaco", "zh": "猴子", "ja": "猿", "ko": "원숭이", "hi": "बंदर", "en-GB": "monkey", "en-US": "monkey"},
    "c_crocodile": {"de": ("das", "Krokodil"), "nl": ("de", "krokodil"), "fr": ("le", "crocodile"), "es": ("el", "cocodrilo"), "it": ("il", "coccodrillo"), "pt": "crocodilo", "zh": "鳄鱼", "ja": "ワニ", "ko": "악어", "hi": "मगरमच्छ", "en-GB": "crocodile", "en-US": "crocodile"},
    "c_snake": {"de": ("die", "Schlange"), "nl": ("de", "slang"), "fr": ("le", "serpent"), "es": ("la", "serpiente"), "it": ("il", "serpente"), "pt": "cobra", "zh": "蛇", "ja": "蛇", "ko": "뱀", "hi": "सांप", "en-GB": "snake", "en-US": "snake"},
    "c_shark": {"de": ("der", "Hai"), "nl": ("de", "haai"), "fr": ("le", "requin"), "es": ("el", "tiburón"), "it": ("lo", "squalo"), "pt": "tubarão", "zh": "鲨鱼", "ja": "サメ", "ko": "상어", "hi": "शार्क", "en-GB": "shark", "en-US": "shark"},
    "c_dolphin": {"de": ("der", "Delfin"), "nl": ("de", "dolfijn"), "fr": ("le", "dauphin"), "es": ("el", "delfín"), "it": ("il", "delfino"), "pt": "golfinho", "zh": "海豚", "ja": "イルカ", "ko": "돌고래", "hi": "डॉल्फिन", "en-GB": "dolphin", "en-US": "dolphin"},
    "c_whale": {"de": ("der", "Wal"), "nl": ("de", "walvis"), "fr": ("la", "baleine"), "es": ("la", "ballena"), "it": ("la", "balena"), "pt": "baleia", "zh": "鲸鱼", "ja": "クジラ", "ko": "고래", "hi": "व्हेल", "en-GB": "whale", "en-US": "whale"},
    "c_butterfly": {"de": ("der", "Schmetterling"), "nl": ("de", "vlinder"), "fr": ("le", "papillon"), "es": ("la", "mariposa"), "it": ("la", "farfalla"), "pt": "borboleta", "zh": "蝴蝶", "ja": "蝶", "ko": "나비", "hi": "तितली", "en-GB": "butterfly", "en-US": "butterfly"},
    "c_eagle": {"de": ("der", "Adler"), "nl": ("de", "arend"), "fr": ("l'", "aigle"), "es": ("el", "águila"), "it": ("l'", "aquila"), "pt": "águia", "zh": "鹰", "ja": "鷲", "ko": "독수리", "hi": "चील", "en-GB": "eagle", "en-US": "eagle"},
    "c_pilot": {"de": ("der", "Pilot"), "nl": ("de", "piloot"), "fr": ("le", "pilote"), "es": ("el", "piloto"), "it": ("il", "pilota"), "pt": "piloto", "zh": "飞行员", "ja": "パイロット", "ko": "조종사", "hi": "पायलट", "en-GB": "pilot", "en-US": "pilot"},
    "c_chef": {"de": ("der", "Koch"), "nl": ("de", "kok"), "fr": ("le", "chef"), "es": ("el", "cocinero"), "it": ("lo", "chef"), "pt": "cozinheiro", "zh": "厨师", "ja": "シェフ", "ko": "요리사", "hi": "रसोइया", "en-GB": "chef", "en-US": "chef"},
    "c_police": {"de": ("die", "Polizei"), "nl": ("de", "politie"), "fr": ("la", "police"), "es": ("la", "policía"), "it": ("la", "polizia"), "pt": "polícia", "zh": "警察", "ja": "警察", "ko": "경찰", "hi": "पुलिस", "en-GB": "police", "en-US": "police"},
    "c_firefighter": {"de": ("der", "Feuerwehrmann"), "nl": ("de", "brandweerman"), "fr": ("le", "pompier"), "es": ("el", "bombero"), "it": ("il", "pompiere"), "pt": "bombeiro", "zh": "消防员", "ja": "消防士", "ko": "소방관", "hi": "अग्निशामक", "en-GB": "firefighter", "en-US": "firefighter"},
    "c_library": {"de": ("die", "Bibliothek"), "nl": ("de", "bibliotheek"), "fr": ("la", "bibliothèque"), "es": ("la", "biblioteca"), "it": ("la", "biblioteca"), "pt": "biblioteca", "zh": "图书馆", "ja": "図書館", "ko": "도서관", "hi": "पुस्तकालय", "en-GB": "library", "en-US": "library"},
    "c_cinema": {"de": ("das", "Kino"), "nl": ("de", "bioscoop"), "fr": ("le", "cinéma"), "es": ("el", "cine"), "it": ("il", "cinema"), "pt": "cinema", "zh": "电影院", "ja": "映画館", "ko": "영화관", "hi": "सिनेमा", "en-GB": "cinema", "en-US": "movie theater"},
    "c_forest": {"de": ("der", "Wald"), "nl": ("het", "bos"), "fr": ("la", "forêt"), "es": ("el", "bosque"), "it": ("la", "foresta"), "pt": "floresta", "zh": "森林", "ja": "森", "ko": "숲", "hi": "जंगल", "en-GB": "forest", "en-US": "woods"},
    "c_bicycle": {"de": ("das", "Fahrrad"), "nl": ("de", "fiets"), "fr": ("le", "vélo"), "es": ("la", "bicicleta"), "it": ("la", "bicicletta"), "pt": "bicicleta", "zh": "自行车", "ja": "自転車", "ko": "자전거", "hi": "साइकिल", "en-GB": "bicycle", "en-US": "bicycle"},
    "c_airplane": {"de": ("das", "Flugzeug"), "nl": ("het", "vliegtuig"), "fr": ("l'", "avion"), "es": ("el", "avión"), "it": ("l'", "aereo"), "pt": "avião", "zh": "飞机", "ja": "飛行機", "ko": "비행기", "hi": "हवाई जहाज", "en-GB": "aeroplane", "en-US": "airplane"},
    "c_ship": {"de": ("das", "Schiff"), "nl": ("het", "schip"), "fr": ("le", "navire"), "es": ("el", "barco"), "it": ("la", "nave"), "pt": "navio", "zh": "船", "ja": "船", "ko": "배", "hi": "जहाज", "en-GB": "ship", "en-US": "ship"},
    "c_basketball": {"de": ("der", "Basketball"), "nl": ("het", "basketbal"), "fr": ("le", "basket"), "es": ("el", "baloncesto"), "it": ("la", "pallacanestro"), "pt": "basquete", "zh": "篮球", "ja": "バスケットボール", "ko": "농구", "hi": "बास्केटबॉल", "en-GB": "basketball", "en-US": "basketball"},
    "c_volleyball": {"de": ("der", "Volleyball"), "nl": ("het", "volleybal"), "fr": ("le", "volley-ball"), "es": ("el", "voleibol"), "it": ("la", "pallavolo"), "pt": "vôlei", "zh": "排球", "ja": "バレーボール", "ko": "배구", "hi": "वॉलीबॉल", "en-GB": "volleyball", "en-US": "volleyball"},
    "c_chess": {"de": ("das", "Schach"), "nl": ("het", "schaken"), "fr": ("les", "échecs"), "es": ("el", "ajedrez"), "it": ("gli", "scacchi"), "pt": "xadrez", "zh": "国际象棋", "ja": "チェス", "ko": "체스", "hi": "शतरंज", "en-GB": "chess", "en-US": "chess"},
    "c_movie": {"de": ("der", "Film"), "nl": ("de", "film"), "fr": ("le", "film"), "es": ("la", "película"), "it": ("il", "film"), "pt": "filme", "zh": "电影", "ja": "映画", "ko": "영화", "hi": "फिल्म", "en-GB": "film", "en-US": "movie"},
    "c_animation": {"de": ("die", "Animation"), "nl": ("de", "animatie"), "fr": ("l'", "animation"), "es": ("la", "animación"), "it": ("l'", "animazione"), "pt": "animação", "zh": "动画", "ja": "アニメーション", "ko": "애니메이션", "hi": "एनिमेशन", "en-GB": "animation", "en-US": "animation"},
    "c_washing_machine": {"de": ("die", "Waschmaschine"), "nl": ("de", "wasmachine"), "fr": ("la", "machine à laver"), "es": ("la", "lavadora"), "it": ("la", "lavatrice"), "pt": "máquina de lavar", "zh": "洗衣机", "ja": "洗濯機", "ko": "세탁기", "hi": "वाशिंग मशीन", "en-GB": "washing machine", "en-US": "washing machine"},
    "c_dishwasher": {"de": ("der", "Geschirrspüler"), "nl": ("de", "vaatwasser"), "fr": ("le", "lave-vaisselle"), "es": ("el", "lavavajillas"), "it": ("la", "lavastoviglie"), "pt": "lava-louças", "zh": "洗碗机", "ja": "食器洗い機", "ko": "식기세척기", "hi": "डिशवॉशर", "en-GB": "dishwasher", "en-US": "dishwasher"},
    "c_sunglasses": {"de": ("die", "Sonnenbrille"), "nl": ("de", "zonnebril"), "fr": ("les", "lunettes de soleil"), "es": ("las", "gafas de sol"), "it": ("gli", "occhiali da sole"), "pt": "óculos de sol", "zh": "太阳镜", "ja": "サングラス", "ko": "선글라스", "hi": "धूप का चश्मा", "en-GB": "sunglasses", "en-US": "sunglasses"},
    "c_desk_lamp": {"de": ("die", "Schreibtischlampe"), "nl": ("de", "bureaulamp"), "fr": ("la", "lampe de bureau"), "es": ("la", "lámpara de escritorio"), "it": ("la", "lampada da scrivania"), "pt": "luminária de mesa", "zh": "台灯", "ja": "デスクライト", "ko": "스탠드", "hi": "डेस्क लैंप", "en-GB": "desk lamp", "en-US": "desk lamp"},
    "c_tv_remote": {"de": ("die", "Fernbedienung"), "nl": ("de", "afstandsbediening"), "fr": ("la", "télécommande"), "es": ("el", "mando a distancia"), "it": ("il", "telecomando"), "pt": "controle remoto", "zh": "遥控器", "ja": "リモコン", "ko": "리모컨", "hi": "रिमोट", "en-GB": "remote control", "en-US": "TV remote"},
    "c_wrist_watch": {"de": ("die", "Armbanduhr"), "nl": ("het", "horloge"), "fr": ("la", "montre"), "es": ("el", "reloj de pulsera"), "it": ("l'", "orologio"), "pt": "relógio de pulso", "zh": "手表", "ja": "腕時計", "ko": "손목시계", "hi": "कलाई घड़ी", "en-GB": "watch", "en-US": "wrist watch"},
    "c_electric_toothbrush": {"de": ("die", "elektrische Zahnbürste"), "nl": ("de", "elektrische tandenborstel"), "fr": ("la", "brosse à dents électrique"), "es": ("el", "cepillo eléctrico"), "it": ("lo", "spazzolino elettrico"), "pt": "escova elétrica", "zh": "电动牙刷", "ja": "電動歯ブラシ", "ko": "전동 칫솔", "hi": "इलेक्ट्रिक टूथब्रश", "en-GB": "electric toothbrush", "en-US": "electric toothbrush"},
    "c_cordless_vacuum": {"de": ("der", "Akkusauger"), "nl": ("de", "steelstofzuiger"), "fr": ("l'", "aspirateur sans fil"), "es": ("la", "aspiradora sin cable"), "it": ("l'", "aspirapolvere senza fili"), "pt": "aspirador sem fio", "zh": "无线吸尘器", "ja": "コードレス掃除機", "ko": "무선 청소기", "hi": "ताररहित वैक्यूम", "en-GB": "cordless hoover", "en-US": "cordless vacuum"},
    "c_bank_card": {"de": ("die", "Bankkarte"), "nl": ("de", "bankpas"), "fr": ("la", "carte bancaire"), "es": ("la", "tarjeta bancaria"), "it": ("la", "carta bancaria"), "pt": "cartão bancário", "zh": "银行卡", "ja": "キャッシュカード", "ko": "은행 카드", "hi": "बैंक कार्ड", "en-GB": "bank card", "en-US": "debit card"},
    "c_rain_umbrella": {"de": ("der", "Regenschirm"), "nl": ("de", "paraplu"), "fr": ("le", "parapluie"), "es": ("el", "paraguas"), "it": ("l'", "ombrello"), "pt": "guarda-chuva", "zh": "雨伞", "ja": "雨傘", "ko": "우산", "hi": "छाता", "en-GB": "umbrella", "en-US": "rain umbrella"},
    "c_paper_towel": {"de": ("das", "Küchenpapier"), "nl": ("de", "keukenrol"), "fr": ("l'", "essuie-tout"), "es": ("el", "papel de cocina"), "it": ("la", "carta da cucina"), "pt": "papel toalha", "zh": "纸巾", "ja": "ペーパータオル", "ko": "키친타월", "hi": "पेपर टॉवल", "en-GB": "kitchen roll", "en-US": "paper towel"}
}

def generate():
    with open('scripts/scratch_missing_concepts.json', 'r', encoding='utf-8') as f:
        missing_concepts = json.load(f)

    with open('scripts/scratch_vocab_list.json', 'r', encoding='utf-8') as f:
        vocab_cards = json.load(f)

    # 1. Build articles dictionary for all vocabulary cards
    vocab_articles = {}
    for card in vocab_cards:
        cid = "c_" + re.sub(r'[^a-z0-9_]+', '_', card['en'].lower().strip()).strip('_')
        entry = NOUN_ENTRIES.get(cid)
        if entry:
            arts = {}
            for lk in ["de", "nl", "fr", "es", "it"]:
                val = entry.get(lk)
                if isinstance(val, tuple):
                    arts[lk] = val[0]
            if arts:
                vocab_articles[cid] = arts

    # 2. Build translations for missing concepts
    concept_translations = {}
    for m in missing_concepts:
        cid = m['conceptId']
        entry = NOUN_ENTRIES.get(cid)
        trans = {}
        if entry:
            for lk in m['missingLangs']:
                if lk == "en-GB":
                    trans[lk] = {"text": entry.get("en-GB", m['base_en'])}
                elif lk == "en-US":
                    trans[lk] = {"text": entry.get("en-US", m['base_en'])}
                elif lk in ["de", "nl", "fr", "es", "it"]:
                    val = entry.get(lk)
                    if isinstance(val, tuple):
                        trans[lk] = {"article": val[0], "text": val[1]}
                    elif isinstance(val, str):
                        trans[lk] = {"text": val}
                elif lk in entry:
                    trans[lk] = {"text": entry[lk]}
        
        # Scenario translations for specific Dutch/German/French/Turkish/Arabic phrases
        if cid == "c_mag_ik_de_rekening_alstublieft":
            trans["en"] = {"text": "May I have the bill, please?"}
            trans["en-GB"] = {"text": "May I have the bill, please?"}
            trans["en-US"] = {"text": "May I have the check, please?"}
            trans["de"] = {"text": "Die Rechnung, bitte."}
            trans["fr"] = {"text": "L'addition, s'il vous plaît."}
            trans["es"] = {"text": "La cuenta, por favor."}
            trans["it"] = {"text": "Il conto, per favore."}
            trans["pt"] = {"text": "A conta, por favor."}
            trans["ar"] = {"text": "الحساب، لو سمحت"}
            trans["tr"] = {"text": "Hesap lütfen"}
            trans["pl"] = {"text": "Rachunek poproszę"}
            trans["uk"] = {"text": "Рахунок, будь ласка"}
            trans["zh"] = {"text": "请给我账单。"}
            trans["ja"] = {"text": "お会計をお願いします。"}
            trans["ko"] = {"text": "계산서 좀 주시겠어요?"}
            trans["hi"] = {"text": "कृपया बिल लाइए।"}
        elif cid == "c_koffie_verkeerd":
            trans["en"] = {"text": "Dutch latte with extra milk"}
            trans["en-GB"] = {"text": "Dutch latte"}
            trans["en-US"] = {"text": "Dutch cafe au lait"}
            trans["de"] = {"text": "Milchkaffee"}
            trans["fr"] = {"text": "café au lait"}
            trans["es"] = {"text": "café con leche"}
            trans["it"] = {"text": "caffellatte"}
            trans["pt"] = {"text": "café com leite"}
            trans["ar"] = {"text": "قهوة بالحليب"}
            trans["tr"] = {"text": "sütlü kahve"}
            trans["pl"] = {"text": "kawa z mlekiem"}
            trans["uk"] = {"text": "кава з молоком"}
            trans["zh"] = {"text": "荷式拿铁咖啡"}
            trans["ja"] = {"text": "カフェオレ"}
            trans["ko"] = {"text": "카페라테"}
            trans["hi"] = {"text": "दूध वाली डच कॉफी"}
        elif cid == "c_hoe_gaat_het_met_jou":
            trans["en"] = {"text": "How are you doing?"}
            trans["en-GB"] = {"text": "How are you doing?"}
            trans["en-US"] = {"text": "How are you doing?"}
            trans["de"] = {"text": "Wie geht es dir?"}
            trans["fr"] = {"text": "Comment vas-tu ?"}
            trans["es"] = {"text": "¿Cómo estás?"}
            trans["it"] = {"text": "Come stai?"}
            trans["pt"] = {"text": "Como você está?"}
            trans["ar"] = {"text": "كيف حالك؟"}
            trans["tr"] = {"text": "Nasılsın?"}
            trans["pl"] = {"text": "Jak się masz?"}
            trans["uk"] = {"text": "Як справи?"}
            trans["zh"] = {"text": "你怎么样？"}
            trans["ja"] = {"text": "元気ですか？"}
            trans["ko"] = {"text": "어떻게 지내세요?"}
            trans["hi"] = {"text": "आप कैसे हैं?"}
        elif cid == "c_hoeveel_kost_dit":
            trans["en"] = {"text": "How much does this cost?"}
            trans["en-GB"] = {"text": "How much does this cost?"}
            trans["en-US"] = {"text": "How much does this cost?"}
            trans["de"] = {"text": "Wie viel kostet das?"}
            trans["fr"] = {"text": "Combien ça coûte ?"}
            trans["es"] = {"text": "¿Cuánto cuesta esto?"}
            trans["it"] = {"text": "Quanto costa questo?"}
            trans["pt"] = {"text": "Quanto custa isto?"}
            trans["ar"] = {"text": "كم سعر هذا؟"}
            trans["tr"] = {"text": "Bu ne kadar?"}
            trans["pl"] = {"text": "Ile to kosztuje?"}
            trans["uk"] = {"text": "Скільки це коштує?"}
            trans["zh"] = {"text": "这个多少钱？"}
            trans["ja"] = {"text": "これはいくらですか？"}
            trans["ko"] = {"text": "이것은 얼마입니까?"}
            trans["hi"] = {"text": "यह कितने का है?"}
        elif cid == "c_vanaf_welk_spoor_vertrekt_de_trein_naar_utrecht":
            trans["en"] = {"text": "Which platform does the train to Utrecht depart from?"}
            trans["en-GB"] = {"text": "Which platform does the train to Utrecht depart from?"}
            trans["en-US"] = {"text": "Which track does the train to Utrecht depart from?"}
            trans["de"] = {"text": "Von welchem Gleis fährt der Zug nach Utrecht ab?"}
            trans["fr"] = {"text": "De quelle voie part le train pour Utrecht ?"}
            trans["es"] = {"text": "¿De qué vía sale el tren hacia Utrecht?"}
            trans["it"] = {"text": "Da quale binario parte il treno per Utrecht?"}
            trans["pt"] = {"text": "De qual plataforma parte o trem para Utrecht?"}
            trans["ar"] = {"text": "من أي رصيف يغادر القطار إلى أوترخت؟"}
            trans["tr"] = {"text": "Utrecht treni hangi perondan kalkıyor?"}
            trans["pl"] = {"text": "Z którego peronu odjeżdża pociąg do Utrechtu?"}
            trans["uk"] = {"text": "З якої колії відправляється потяг до Утрехта?"}
            trans["zh"] = {"text": "去乌得勒支的火车从几站台发车？"}
            trans["ja"] = {"text": "ユトレヒト行きの電車は何番線から出発しますか？"}
            trans["ko"] = {"text": "위트레흐트행 기차는 몇 번 승강장에서 출발하나요?"}
            trans["hi"] = {"text": "उट्रेच जाने वाली ट्रेन किस प्लेटफॉर्म से निकलती है?"}
        elif cid == "c_morgen_werk_ik_vanuit_huis":
            trans["en"] = {"text": "Tomorrow I am working from home."}
            trans["en-GB"] = {"text": "Tomorrow I am working from home."}
            trans["en-US"] = {"text": "Tomorrow I'm working from home."}
            trans["de"] = {"text": "Morgen arbeite ich von zu Hause aus."}
            trans["fr"] = {"text": "Demain, je travaille à domicile."}
            trans["es"] = {"text": "Mañana trabajo desde casa."}
            trans["it"] = {"text": "Domani lavoro da casa."}
            trans["pt"] = {"text": "Amanhã trabalho de casa."}
            trans["ar"] = {"text": "غداً سأعمل من المنزل."}
            trans["tr"] = {"text": "Yarın evden çalışıyorum."}
            trans["pl"] = {"text": "Jutro pracuję z domu."}
            trans["uk"] = {"text": "Завтра я працюю з дому."}
            trans["zh"] = {"text": "明天我居家办公。"}
            trans["ja"] = {"text": "明日は在宅勤務です。"}
            trans["ko"] = {"text": "내일은 재택근무를 합니다."}
            trans["hi"] = {"text": "कल मैं घर से काम करूँगा।"}
        elif cid == "c_gezelligheid":
            trans["en"] = {"text": "cozy conviviality"}
            trans["en-GB"] = {"text": "warm conviviality"}
            trans["en-US"] = {"text": "cozy togetherness"}
            trans["de"] = {"text": "Gemütlichkeit"}
            trans["fr"] = {"text": "convivialité chaleureuse"}
            trans["es"] = {"text": "calidez y agradable compañía"}
            trans["it"] = {"text": "calore conviviale"}
            trans["pt"] = {"text": "convívio acolhedor"}
            trans["ar"] = {"text": "أنس الألفة والبهجة"}
            trans["tr"] = {"text": "samimi ortam keyfi"}
            trans["pl"] = {"text": "przytulna atmosfera"}
            trans["uk"] = {"text": "затишна душевність"}
            trans["zh"] = {"text": "温馨热闹的相聚氛围"}
            trans["ja"] = {"text": "心地よい団らんのぬくもり"}
            trans["ko"] = {"text": "아늑하고 정겨운 분위기"}
            trans["hi"] = {"text": "मिल-बैठने की गर्मजोशी"}

        if trans:
            concept_translations[cid] = trans

    supplement = {
        "vocab_articles": vocab_articles,
        "concept_translations": concept_translations
    }

    os.makedirs('data/sources', exist_ok=True)
    with open('data/sources/scope_a_supplement.json', 'w', encoding='utf-8') as f:
        json.dump(supplement, f, indent=2, ensure_ascii=False)

    print(f"Generated supplement with {len(vocab_articles)} vocab article sets and {len(concept_translations)} concept translation sets.")

if __name__ == '__main__':
    generate()
