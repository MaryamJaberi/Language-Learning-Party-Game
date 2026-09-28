import { LanguageCard, Language, CEFRLevel } from './types';

// The 40 advanced C1 noun phrases/entities translated across supported languages
export interface C1Entity {
  id: number;
  topic: string;
  texts: Record<string, string>;
}

export const C1_ENTITIES: C1Entity[] = [
  {
    id: 1,
    topic: 'CAT_SOCIAL',
    texts: {
      en: 'the erosion of public trust',
      'en-US': 'the erosion of public trust',
      ar: 'تآكل الثقة العامة',
      fa: 'فرسایش اعتماد عمومی',
      zh: '公众信任的削弱',
      ja: '国民の信頼の低下',
      ko: '대중의 신뢰 약화',
      fr: "l'érosion de la confiance publique",
      hi: 'जनता के विश्वास का क्षरण',
      nl: 'de uitholling van het publieke vertrouwen',
      de: 'die Erosion des öffentlichen Vertrauens',
      uk: 'підрив суспільної довіри',
      tr: 'kamuoyu güveninin aşınması',
      pl: 'erozja zaufania publicznego',
      pt: 'a erosão da confiança pública',
      es: 'la pérdida de confianza pública',
      it: 'la perdita di fiducia pubblica'
    }
  },
  {
    id: 2,
    topic: 'CAT_WORK',
    texts: {
      en: "the committee's interim findings",
      'en-US': "the committee's interim findings",
      ar: 'النتائج الأولية للجنة',
      fa: 'یافته‌های موقت کمیته',
      zh: '委员会的中期调查结果',
      ja: '委員会の暫定的な調査結果',
      ko: '위원회의 중간 조사 결과',
      fr: 'les conclusions provisoires de la commission',
      hi: 'समिति के अंतरिम निष्कर्ष',
      nl: 'de tussentijdse bevindingen van de commissie',
      de: 'die vorläufigen Ergebnisse des Ausschusses',
      uk: 'проміжні висновки комітету',
      tr: 'komitenin ara bulguları',
      pl: 'wstępne ustalenia komisji',
      pt: 'as conclusões intercalares do comité',
      es: 'las conclusiones provisionales de la comisión',
      it: 'le conclusioni provvisorie della commissione'
    }
  },
  {
    id: 3,
    topic: 'CAT_SOCIAL',
    texts: {
      en: 'her reluctance to commit publicly',
      'en-US': 'her reluctance to commit publicly',
      ar: 'ترددها في الالتزام علناً',
      fa: 'تردید او برای اعلام موضع علنی',
      zh: '她在公开承诺上的犹豫',
      ja: '公に言及することへの彼女の躊躇',
      ko: '공개적 약속에 대한 그녀의 주저함',
      fr: "sa réticence à s'engager publiquement",
      hi: 'सार्वजनिक रूप से प्रतिबद्ध होने में उसकी अनिच्छा',
      nl: 'haar terughoudendheid om zich publiekelijk te binden',
      de: 'ihr Zögern, sich öffentlich festzulegen',
      uk: 'її небажання брати публічні зобовʼязання',
      tr: 'kamuoyu önünde taahhütte bulunma konusundaki isteksizliği',
      pl: 'jej niechęć do publicznego zaangażowania',
      pt: 'a sua relutância em comprometer-se publicamente',
      es: 'su reticencia a comprometerse públicamente',
      it: 'la sua riluttanza a impegnarsi pubblicamente'
    }
  },
  {
    id: 4,
    topic: 'CAT_WORK',
    texts: {
      en: 'the proposed legislative overhaul',
      'en-US': 'the proposed legislative overhaul',
      ar: 'التعديل التشريعي المقترح',
      fa: 'اصلاحات قانونی پیشنهادی',
      zh: '拟议的立法改革',
      ja: '提案された法改正の抜本的見直し',
      ko: '제안된 전면적 입법 개혁',
      fr: 'la refonte législative proposée',
      hi: 'प्रस्तावित विधायी फेरबदल',
      nl: 'de voorgestelde grondige herziening van de wetgeving',
      de: 'die vorgeschlagene Gesetzesreform',
      uk: 'запропонована законодавча реформа',
      tr: 'önerilen kapsamlı yasa reformu',
      pl: 'proponowana reforma ustawodawcza',
      pt: 'a profunda reforma legislativa proposta',
      es: 'la reforma legislativa propuesta',
      it: 'la proposta di revisione legislativa'
    }
  },
  {
    id: 5,
    topic: 'CAT_SOCIAL',
    texts: {
      en: 'the widening wealth gap',
      'en-US': 'the widening wealth gap',
      ar: 'اتساع الفجوة في الثروة',
      fa: 'شکاف فزاینده طبقاتی و ثروت',
      zh: '不断扩大的贫富差距',
      ja: '広がり続ける富の格差',
      ko: '벌어지는 빈부격차',
      fr: "l'accroissement du fossé des richesses",
      hi: 'बढ़ती धन की खाई',
      nl: 'de steeds groter wordende vermogenskloof',
      de: 'die wachsende Kluft zwischen Arm und Reich',
      uk: 'зростання прірви між багатими й бідними',
      tr: 'giderek açılan refah uçurumu',
      pl: 'pogłębiająca się przepaść majątkowa',
      pt: 'o fosso crescente da riqueza',
      es: 'la creciente brecha de riqueza',
      it: 'il divario di ricchezza sempre più ampio'
    }
  },
  {
    id: 6,
    topic: 'CAT_WORK',
    texts: {
      en: 'an alleged conflict of interest',
      'en-US': 'an alleged conflict of interest',
      ar: 'تضارب محتمل في المصالح',
      fa: 'تعارض منافع ادعایی',
      zh: '涉嫌利益冲突',
      ja: '指摘されている利益相反',
      ko: '주장된 이해충돌',
      fr: "un prétendu conflit d'intérêts",
      hi: 'कथित हितों का टकराव',
      nl: 'een vermeende belangenverstrengeling',
      de: 'ein mutmaßlicher Interessenkonflikt',
      uk: 'ймовірний конфлікт інтересів',
      tr: 'iddia edilen çıkar çatışması',
      pl: 'rzekomy konflikt interesów',
      pt: 'um alegado conflito de interesses',
      es: 'un supuesto conflicto de intereses',
      it: 'un presunto conflitto di interessi'
    }
  },
  {
    id: 7,
    topic: 'CAT_SOCIAL',
    texts: {
      en: 'the prevailing public narrative',
      'en-US': 'the prevailing public narrative',
      ar: 'الرواية السائدة بين الرأي العام',
      fa: 'روایت غالب افکار عمومی',
      zh: '主流的公众叙事',
      ja: '世論において優勢な言説',
      ko: '지배적인 대중의 담론',
      fr: 'le récit dominant dans le public',
      hi: 'प्रचलित सार्वजनिक आख्यान',
      nl: 'het heersende publieke narratief',
      de: 'das vorherrschende öffentliche Narrativ',
      uk: 'панівний суспільний наратив',
      tr: 'hâkim kamuoyu anlatısı',
      pl: 'dominująca narracja publiczna',
      pt: 'a narrativa pública predominante',
      es: 'la narrativa pública predominante',
      it: 'la narrazione pubblica prevalente'
    }
  },
  {
    id: 8,
    topic: 'CAT_EVERYDAY',
    texts: {
      en: 'the unintended long-term consequences',
      'en-US': 'the unintended long-term consequences',
      ar: 'العواقب غير المقصودة على المدى الطويل',
      fa: 'پیامدهای ناخواسته بلندمدت',
      zh: '非预期的长期后果',
      ja: '意図せざる長期的な結末',
      ko: '의도치 않은 장기적 결과',
      fr: 'les conséquences involontaires à long terme',
      hi: 'अनपेक्षित दीर्घकालिक परिणाम',
      nl: 'de onbedoelde gevolgen op de lange termijn',
      de: 'die unbeabsichtigten langfristigen Folgen',
      uk: 'ненавмисні довгострокові наслідки',
      tr: 'öngörülmeyen uzun vadeli sonuçlar',
      pl: 'niezamierzone długofalowe skutki',
      pt: 'as consequências não intencionais a longo prazo',
      es: 'las consecuencias involuntarias a largo plazo',
      it: 'le conseguenze involontarie a lungo termine'
    }
  },
  {
    id: 9,
    topic: 'CAT_WORK',
    texts: {
      en: "the project's long-term viability",
      'en-US': "the project's long-term viability",
      ar: 'جدوى المشروع على المدى البعيد',
      fa: 'پایداری و دوام بلندمدت پروژه',
      zh: '该项目的长期可行性',
      ja: 'プロジェクトの長期的な実行可能性',
      ko: '프로젝트의 장기적 실행 가능성',
      fr: 'la viabilité à long terme du projet',
      hi: 'परियोजना की दीर्घकालिक व्यवहार्यता',
      nl: 'de levensvatbaarheid van het project op de lange termijn',
      de: 'die langfristige Tragfähigkeit des Projekts',
      uk: 'довгострокова життєздатність проєкту',
      tr: 'projenin uzun vadeli sürdürülebilirliği',
      pl: 'długoterminowa rentowność projektu',
      pt: 'a viabilidade a longo prazo do projeto',
      es: 'la viabilidad a largo plazo del proyecto',
      it: 'la fattibilità a lungo termine del progetto'
    }
  },
  {
    id: 10,
    topic: 'CAT_WORK',
    texts: {
      en: 'a carefully worded disclaimer',
      'en-US': 'a carefully worded disclaimer',
      ar: 'إخلاء مسؤولية صيغ بعناية',
      fa: 'سلب مسئولیتِ با دقت نگاشته‌شده',
      zh: '措辞谨慎的免责声明',
      ja: '慎重に言葉を選んだ免責事項',
      ko: '주의 깊게 표현된 면책 조항',
      fr: 'une clause de non-responsabilité soigneusement formulée',
      hi: 'सावधानीपूर्वक शब्दों में दिया गया अस्वीकरण',
      nl: 'een zorgvuldig geformuleerde disclaimer',
      de: 'ein sorgfältig formulierter Haftungsausschluss',
      uk: 'ретельно сформульоване застереження',
      tr: 'özenle hazırlanmış bir sorumluluk reddi',
      pl: 'starannie sformułowane zastrzeżenie prawne',
      pt: 'uma exoneração de responsabilidade cuidadosamente redigida',
      es: 'un descargo de responsabilidad cuidadosamente redactado',
      it: 'una dichiarazione di non responsabilità formulata con cura'
    }
  },
  {
    id: 11,
    topic: 'CAT_EDUCATION',
    texts: {
      en: 'the so-called evidence base',
      'en-US': 'the so-called evidence base',
      ar: 'ما يُسمى بقاعدة الأدلة',
      fa: 'به‌اصطلاح پایگاه شواهد و مدارک',
      zh: '所谓的证据基础',
      ja: 'いわゆる証拠の根拠',
      ko: '이른바 증거 기반',
      fr: 'la soi-disant base factuelle',
      hi: 'तथाकथित साक्ष्य आधार',
      nl: 'de zogenaamde wetenschappelijke basis',
      de: 'die sogenannte Evidenzbasis',
      uk: 'так звана доказова база',
      tr: 'sözde kanıt temeli',
      pl: 'tak zwana baza dowodowa',
      pt: 'a chamada base de evidências',
      es: 'la llamada base de evidencia',
      it: 'la cosiddetta base probatoria'
    }
  },
  {
    id: 12,
    topic: 'CAT_WORK',
    texts: {
      en: 'a climate of institutional caution',
      'en-US': 'a climate of institutional caution',
      ar: 'مناخ من الحذر المؤسسي',
      fa: 'فضای احتیاط سازمانی',
      zh: '体制性谨慎的氛围',
      ja: '組織的な慎重姿勢の蔓延',
      ko: '조직적인 신중함의 분위기',
      fr: "un climat de prudence institutionnelle",
      hi: 'संस्थागत सावधानी का माहौल',
      nl: 'een sfeer van institutionele voorzichtigheid',
      de: 'ein Klima institutioneller Vorsicht',
      uk: 'клімат інституційної обережності',
      tr: 'kurumsal ihtiyat ortamı',
      pl: 'atmosfera ostrożności instytucjonalnej',
      pt: 'um clima de prudência institucional',
      es: 'un clima de cautela institucional',
      it: 'un clima di cautela istituzionale'
    }
  },
  {
    id: 13,
    topic: 'CAT_WORK',
    texts: {
      en: 'the dwindling room for compromise',
      'en-US': 'the dwindling room for compromise',
      ar: 'تضاؤل مجال التوافق',
      fa: 'کاهش فضای سازش و مصالحه',
      zh: '不断缩小的妥协空间',
      ja: '妥協の余地が狭まること',
      ko: '점점 줄어드는 타협의 여지',
      fr: 'le rétrécissement de la marge de compromis',
      hi: 'समझौते की घटती गुंजाइश',
      nl: 'de afnemende ruimte voor een compromis',
      de: 'der schwindende Spielraum für Kompromisse',
      uk: 'звуження простору для компромісу',
      tr: 'uzlaşma için daralan alan',
      pl: 'kurczące się pole do kompromisu',
      pt: 'a margem decrescente para concessões',
      es: 'el margen decreciente para el acuerdo',
      it: 'il margine sempre più ridotto per il compromesso'
    }
  },
  {
    id: 14,
    topic: 'CAT_EDUCATION',
    texts: {
      en: 'an overreliance on anecdotal data',
      'en-US': 'an overreliance on anecdotal data',
      ar: 'الاعتماد المفرط على بيانات غير علمية',
      fa: 'اتکای بیش از حد به شواهد موردی و تجربی',
      zh: '对轶事数据的过度依赖',
      ja: '体験談や逸話に基づくデータへの過度な依存',
      ko: '일화적 데이터에 대한 과도한 의존',
      fr: 'une dépendance excessive aux données anecdotiques',
      hi: 'कहानियों पर आधारित डेटा पर अत्यधिक निर्भरता',
      nl: 'een overmatig vertrouwen op anekdotische gegevens',
      de: 'ein übermäßiges Vertrauen auf anekdotische Daten',
      uk: 'надмірна залежність від уривчастих даних',
      tr: 'anekdotik verilere aşırı bağımlılık',
      pl: 'nadmierne poleganie na danych anegdotycznych',
      pt: 'uma dependência excessiva de dados anedóticos',
      es: 'una dependencia excesiva de datos anecdóticos',
      it: 'un eccessivo affidamento su dati aneddotici'
    }
  },
  {
    id: 15,
    topic: 'CAT_WORK',
    texts: {
      en: 'the opacity of the decision-making process',
      'en-US': 'the opacity of the decision-making process',
      ar: 'غموض عملية اتخاذ القرار',
      fa: 'عدم شفافیت در روند تصمیم‌گیری',
      zh: '决策过程的不透明性',
      ja: '意思決定プロセスの不透明さ',
      ko: '의사결정 과정의 불투명성',
      fr: 'le manque de transparence du processus décisionnel',
      hi: 'निर्णय लेने की प्रक्रिया की अपारदर्शिता',
      nl: 'de ondoorzichtigheid van het besluitvormingsproces',
      de: 'die Undurchsichtigkeit des Entscheidungsprozesses',
      uk: 'непрозорість процесу прийняття рішень',
      tr: 'karar alma sürecinin şeffaf olmaması',
      pl: 'nieprzejrzystość procesu podejmowania decyzji',
      pt: 'a opacidade do processo de tomada de decisão',
      es: 'la opacidad del proceso de toma de decisiones',
      it: 'la mancanza di trasparenza del processo decisionale'
    }
  },
  {
    id: 16,
    topic: 'CAT_SOCIAL',
    texts: {
      en: 'the commodification of personal data',
      'en-US': 'the commodification of personal data',
      ar: 'تسليع البيانات الشخصية',
      fa: 'کالاشدگی و تجاری‌سازی داده‌های شخصی',
      zh: '个人数据的商品化',
      ja: '個人情報の商業化',
      ko: '개인정보의 상품화',
      fr: 'la marchandisation des données personnelles',
      hi: 'व्यक्तिगत डेटा का वस्तुकरण',
      nl: 'het vermarkten van persoonsgegevens',
      de: 'die Kommerzialisierung persönlicher Daten',
      uk: 'комерціалізація персональних даних',
      tr: 'kişisel verilerin metalaştırılması',
      pl: 'komercjalizacja danych osobowych',
      pt: 'a mercantilização dos dados pessoais',
      es: 'la mercantilización de los datos personales',
      it: 'la mercificazione dei dati personali'
    }
  },
  {
    id: 17,
    topic: 'CAT_SOCIAL',
    texts: {
      en: 'the ethical grey area involved',
      'en-US': 'the ethical gray area involved',
      ar: 'المنطقة الرمادية الأخلاقية في الأمر',
      fa: 'منطقه خاکستری اخلاقی موجود در موضوع',
      zh: '所涉及的道德灰色地带',
      ja: 'そこに介在する倫理的なグレーゾーン',
      ko: '관련된 윤리적 회색 지대',
      fr: "la zone grise éthique qui s'y rattache",
      hi: 'शामिल नैतिक संशय का क्षेत्र',
      nl: 'het ethische schemergebied dat ermee gemoeid is',
      de: 'die damit verbundene ethische Grauzone',
      uk: 'етична сіра зона в цьому питанні',
      tr: 'işin içindeki etik gri alan',
      pl: 'związana z tym szara strefa etyczna',
      pt: 'a zona cinzenta ética envolvida',
      es: 'la zona gris ética que implica',
      it: 'la zona d’ombra etica implicata'
    }
  },
  {
    id: 18,
    topic: 'CAT_WORK',
    texts: {
      en: 'the asymmetry of information between parties',
      'en-US': 'the asymmetry of information between parties',
      ar: 'عدم تماثل المعلومات بين الأطراف',
      fa: 'عدم تقارن اطلاعاتی بین طرفین',
      zh: '各方之间的信息不对称',
      ja: '当事者間の情報の非対称性',
      ko: '당사자 간의 정보 비대칭',
      fr: "l'asymétrie d'information entre les parties",
      hi: 'पक्षों के बीच सूचना की विषमता',
      nl: 'de informatieasymmetrie tussen de partijen',
      de: 'die Informationsasymmetrie zwischen den Parteien',
      uk: 'інформаційна асиметрія між сторонами',
      tr: 'taraflar arasındaki bilgi asimetrisi',
      pl: 'asymetria informacji między stronami',
      pt: 'a assimetria de informação entre as partes',
      es: 'la asimetría de información entre las partes',
      it: 'l’asimmetria informativa tra le parti'
    }
  },
  {
    id: 19,
    topic: 'CAT_EVERYDAY',
    texts: {
      en: 'the shrinking window for meaningful intervention',
      'en-US': 'the shrinking window for meaningful intervention',
      ar: 'تقلص فرصة التدخل الفعّال',
      fa: 'کاهش فرصت برای مداخله موثر',
      zh: '采取有意义干预的窗口正在缩小',
      ja: '有効な介入を行うための猶予が狭まること',
      ko: '의미 있는 개입을 위한 시간이 줄어듦',
      fr: "la réduction de la marge d'intervention efficace",
      hi: 'सार्थक हस्तक्षेप के लिए घटता अवसर',
      nl: 'de krimpende tijdspanne voor zinvolle interventie',
      de: 'das schrumpfende Zeitfenster für wirksame Maßnahmen',
      uk: 'звуження вікна для ефективного втручання',
      tr: 'anlamlı müdahale için daralan fırsat penceresi',
      pl: 'kurczące się okno na skuteczną interwencję',
      pt: 'a janela cada vez menor para uma intervenção significativa',
      es: 'la ventana cada vez más reducida para una intervención significativa',
      it: 'la finestra temporale sempre più ridotta per un intervento significativo'
    }
  },
  {
    id: 20,
    topic: 'CAT_EDUCATION',
    texts: {
      en: 'a chronic underinvestment in prevention',
      'en-US': 'a chronic underinvestment in prevention',
      ar: 'نقص مزمن في الاستثمار في الوقاية',
      fa: 'سرمایه‌گذاری ناکافی مزمن در حوزه پیشگیری',
      zh: '在预防方面的长期投入不足',
      ja: '予防に対する慢性的な投資不足',
      ko: '예방에 대한 만성적인 투자 부족',
      fr: 'un sous-investissement chronique dans la prévention',
      hi: 'रोकथाम में दीर्घकालिक कम निवेश',
      nl: 'chronische onderinvestering in preventie',
      de: 'chronische Unterinvestition in die Prävention',
      uk: 'хронічне недофінансування профілактики',
      tr: 'önlem almaya yönelik kronik yetersiz yatırım',
      pl: 'chroniczne niedoinwestowanie profilaktyki',
      pt: 'um subinvestimento crónico na prevenção',
      es: 'una falta crónica de inversión en prevención',
      it: 'un cronico sottoinvestimento nella prevenzione'
    }
  }
];

export interface C1Frame {
  id: number;
  type: 'Sentence' | 'Question';
  grammarFocus: string;
  prefix: Record<string, string>;
  suffix: Record<string, string>;
}

export const C1_FRAMES: C1Frame[] = [
  {
    id: 1,
    type: 'Sentence',
    grammarFocus: 'Hedging & Stance (face value)',
    prefix: {
      en: 'It is by no means self-evident that ',
      'en-US': 'It is by no means self-evident that ',
      fa: 'به‌هیچ‌وجه بدیهی نیست که ',
      ar: 'ليس من البديهي على الإطلاق أن يُؤخذ ',
      nl: 'Het is allerminst vanzelfsprekend dat ',
      de: 'Es ist keineswegs selbstverständlich, dass ',
      fr: "Il n'est nullement évident que ",
      es: 'No es de ninguna manera evidente que ',
      it: 'Non è affatto scontato che ',
      tr: 'Bunun apaçık olduğunu söylemek mümkün değildir: ',
      ru: 'Отнюдь не очевидно, что '
    },
    suffix: {
      en: ' can be taken at face value.',
      'en-US': ' can be taken at face value.',
      fa: ' را بتوان ظاهرش گرفت.',
      ar: ' على ظاهره.',
      nl: ' voor zoete koek kan worden aangenomen.',
      de: ' für bare Münze genommen werden kann.',
      fr: ' puisse être pris au pied de la lettre.',
      es: ' pueda tomarse al pie de la letra.',
      it: ' possa essere preso per oro colato.',
      tr: ' olduğu gibi kabul edilsin.',
      ru: ' можно принимать за чистую монету.'
    }
  },
  {
    id: 2,
    type: 'Sentence',
    grammarFocus: 'Inverted Conditionals (Were it not for)',
    prefix: {
      en: 'Were it not for ',
      'en-US': 'Were it not for ',
      fa: 'اگر ',
      ar: 'لولا ',
      nl: 'Ware het niet voor ',
      de: 'Ohne ',
      fr: 'Sans ',
      es: 'Si no fuera por ',
      it: 'Se non fosse per ',
      tr: 'Olmasaydı ',
      ru: 'Если бы не '
    },
    suffix: {
      en: ', the outcome would scarcely have materialised.',
      'en-US': ', the outcome would scarcely have materialized.',
      fa: ' نبود، بعید بود نتیجه حاصل شود.',
      ar: ' لما تحقق الناتج إلا بصعوبة.',
      nl: ', dan was het resultaat nauwelijks tot stand gekomen.',
      de: ', wäre das Ergebnis wohl kaum zustande gekommen.',
      fr: ", le résultat ne se serait guère concrétisé.",
      es: ', el resultado difícilmente se habría materializado.',
      it: ', il risultato difficilmente si sarebbe concretizzato.',
      tr: ', sonucun ortaya çıkması neredeyse imkansız olurdu.',
      ru: ', результат вряд ли бы материализовался.'
    }
  },
  {
    id: 3,
    type: 'Sentence',
    grammarFocus: 'Cleft Sentences & Emphasis (What is at stake)',
    prefix: {
      en: 'What is at stake here is not merely ',
      'en-US': 'What is at stake here is not merely ',
      fa: 'آنچه در اینجا در معرض خطر است صرفاً ',
      ar: 'المخاطر هنا لا تقتصر على ',
      nl: 'Wat hier op het spel staat is niet alleen ',
      de: 'Hier steht nicht nur ',
      fr: "Ce qui est en jeu ici n'est pas seulement ",
      es: 'Lo que está en juego aquí no es simplemente ',
      it: 'Ciò che è in gioco non è soltanto ',
      tr: 'Burada tehlikede olan şey yalnızca ',
      ru: 'На карту поставлено не просто '
    },
    suffix: {
      en: ', but the credibility of the entire process.',
      'en-US': ', but the credibility of the entire process.',
      fa: ' نیست، بلکه اعتبار کل فرایند است.',
      ar: ' بل مصداقية العملية برمتها.',
      nl: ', maar de geloofwaardigheid van het proces zelf.',
      de: ', sondern die Glaubwürdigkeit des gesamten Prozesses.',
      fr: ", mais la crédibilité du processus lui-même.",
      es: ', sino la credibilidad del proceso mismo.',
      it: ', ma la credibilità del processo stesso.',
      tr: ' değil, sürecin bizzat güvenilirliğidir.',
      ru: ', но и авторитет самого процесса.'
    }
  },
  {
    id: 4,
    type: 'Sentence',
    grammarFocus: 'Stance (Hard-pressed to argue)',
    prefix: {
      en: 'One would be hard-pressed to argue that ',
      'en-US': 'One would be hard-pressed to argue that ',
      fa: 'به‌سختی بتوان ادعا کرد که ',
      ar: 'من الصعب للغاية القول بأن ',
      nl: 'Men zal moeite hebben te betogen dat ',
      de: 'Man dürfte Mühe haben zu argumentieren, dass ',
      fr: "On aurait bien du mal à soutenir que ",
      es: 'Sería muy difícil sostener que ',
      it: 'Difficilmente si potrebbe sostenere che ',
      tr: 'Şunu iddia etmek oldukça güç olacaktır: ',
      ru: 'Трудно спорить с тем, что '
    },
    suffix: {
      en: ' is merely incidental.',
      'en-US': ' is merely incidental.',
      fa: ' صرفاً امری اتفاقی و کم‌اهمیت است.',
      ar: ' مجرد مسألة عرضية.',
      nl: ' slechts toevallig is.',
      de: ' lediglich nebensächlich ist.',
      fr: " n'est que pure coïncidence.",
      es: ' sea meramente incidental.',
      it: ' sia puramente accidentale.',
      tr: ' yalnızca tesadüfidir.',
      ru: ' является случайностью.'
    }
  },
  {
    id: 5,
    type: 'Sentence',
    grammarFocus: 'Subjunctive & Condition (To the extent that)',
    prefix: {
      en: 'To the extent that ',
      'en-US': 'To the extent that ',
      fa: 'تا جایی که ',
      ar: 'بقدر ما يؤثر ',
      nl: 'Voor zover ',
      de: 'Insofern ',
      fr: "Dans la mesure où ",
      es: 'En la medida en que ',
      it: 'Nella misura in cui ',
      tr: 'Öyle ki, ',
      ru: 'В той мере, в какой '
    },
    suffix: {
      en: ' shapes the debate, any hasty conclusion would be premature.',
      'en-US': ' shapes the debate, any hasty conclusion would be premature.',
      fa: ' بر مباحث اثر می‌گذارد، هرگونه نتیجه‌گیری شتاب‌زده زودرس خواهد بود.',
      ar: ' في النقاش، فإن أي استنتاج متسرع سيكون سابقاً لأوانه.',
      nl: ' het debat bepaalt, zou elke overhaaste conclusie voorbarig zijn.',
      de: ' die Debatte prägt, wäre jeder voreilige Schluss verfrüht.',
      fr: ' oriente le débat, toute conclusion hâtive serait prématurée.',
      es: ' defina el debate, cualquier conclusión precipitada sería prematura.',
      it: ' orienti il dibattito, qualsiasi conclusione affrettata risulterebbe prematura.',
      tr: ' tartışmayı şekillendiriyorsa, her türlü acele karar erkendir.',
      ru: ' определяет дискуссию, любые поспешные выводы преждевременны.'
    }
  },
  {
    id: 6,
    type: 'Sentence',
    grammarFocus: 'Correlative Opposition (Far from resolving)',
    prefix: {
      en: 'Far from resolving the issue, ',
      'en-US': 'Far from resolving the issue, ',
      fa: 'نه تنها مسئله را حل نکرده، بلکه ',
      ar: 'بدلاً من حل المشكلة، فإن ',
      nl: 'Verre van de kwestie op te lossen, heeft ',
      de: 'Weit davon entfernt, das Problem zu lösen, hat ',
      fr: "Loin de résoudre le problème, ",
      es: 'Lejos de resolver la cuestión, ',
      it: 'Lungi dal risolvere la questione, ',
      tr: 'Sorunu çözmek bir yana, ',
      ru: 'Вместо того чтобы решить проблему, '
    },
    suffix: {
      en: ' has, if anything, compounded it.',
      'en-US': ' has, if anything, compounded it.',
      fa: ' چه بسا اوضاع را پیچیده‌تر و وخیم‌تر ساخته است.',
      ar: ' زاد الأمر تعقيداً إن لم يكن أسوأ.',
      nl: ' dit zo mogelijk alleen maar verergerd.',
      de: ' die Lage wohl eher noch verschärft.',
      fr: " n'a fait qu'aggraver la situation.",
      es: ' no ha hecho sino agravarla.',
      it: ' non ha fatto che complicarla ulteriormente.',
      tr: ' durumu daha da zorlaştırmıştır.',
      ru: ' лишь усугубило её.'
    }
  },
  {
    id: 7,
    type: 'Question',
    grammarFocus: 'Rhetorical Inquiry & Discursive Critique',
    prefix: {
      en: 'Can it truly be maintained that ',
      'en-US': 'Can it truly be maintained that ',
      fa: 'آیا واقعاً می‌توان ادعا کرد که ',
      ar: 'هل يمكن حقاً الادعاء بأن ',
      nl: 'Kan er werkelijk worden volgehouden dat ',
      de: 'Lässt sich wirklich behaupten, dass ',
      fr: "Peut-on réellement soutenir que ",
      es: '¿Realmente se puede sostener que ',
      it: 'Si può davvero sostenere che ',
      tr: 'Gerçekten iddia edilebilir mi ki ',
      ru: 'Можно ли всерьёз утверждать, что '
    },
    suffix: {
      en: " falls completely outside the institution's remit?",
      'en-US': " falls completely outside the institution's remit?",
      fa: ' کاملاً از حیطه وظایف و اختیارات سازمان خارج است؟',
      ar: ' يقع خارج نطاق اختصاص المؤسسة تماماً؟',
      nl: ' volledig buiten de bevoegdheid van de instelling valt?',
      de: ' völlig außerhalb der Zuständigkeit der Institution liegt?',
      fr: " échappe totalement aux compétences de l'institution ?",
      es: ' queda fuera de las competencias de la institución?',
      it: " ricada del tutto al di fuori delle competenze dell'istituzione?",
      tr: ' tamamen kurumun yetki alanı dışında kalmaktadır?',
      ru: ' полностью выходит за рамки полномочий института?'
    }
  },
  {
    id: 8,
    type: 'Question',
    grammarFocus: 'Evaluative Assessment (To what extent)',
    prefix: {
      en: 'To what extent does ',
      'en-US': 'To what extent does ',
      fa: 'تا چه اندازه ',
      ar: 'إلى أي مدى يقوض ',
      nl: 'In welke mate ondermijnt ',
      de: 'Inwiefern untergräbt ',
      fr: "Dans quelle mesure ",
      es: '¿Hasta qué punto ',
      it: 'Fino a che punto ',
      tr: 'Ne dereceye kadar ',
      ru: 'До какой степени '
    },
    suffix: {
      en: ' undermine the very premise of the reform?',
      'en-US': ' undermine the very premise of the reform?',
      fa: ' اساس و شالوده اصلاحات را تضعیف می‌کند؟',
      ar: ' الفرضية الأساسية للإصلاح؟',
      nl: ' het uitgangspunt van de hervorming zelf?',
      de: ' die eigentliche Prämisse der Reform?',
      fr: " sape-t-il le principe même de la réforme ?",
      es: ' socava la premisa fundamental de la reforma?',
      it: ' mina la premessa fondamentale della riforma?',
      tr: ' reformun temelini sarsmaktadır?',
      ru: ' подрывает саму основу реформы?'
    }
  },
  {
    id: 9,
    type: 'Sentence',
    grammarFocus: 'Negative Inversion (Seldom has)',
    prefix: {
      en: 'Seldom has ',
      'en-US': 'Seldom has ',
      fa: 'به‌ندرت پیش آمده که ',
      ar: 'نادراً ما خضع ',
      nl: 'Zelden is ',
      de: 'Selten ist ',
      fr: "Rarement ",
      es: 'Raras veces ',
      it: 'Raramente ',
      tr: 'Çok nadirdir ki ',
      ru: 'Редко когда '
    },
    suffix: {
      en: ' been subjected to such sustained public scrutiny.',
      'en-US': ' been subjected to such sustained public scrutiny.',
      fa: ' تا این حد زیر ذره‌بین دقیق و موشکافانه عمومی قرار گیرد.',
      ar: ' لمثل هذا التدقيق المستمر.',
      nl: ' aan een dergelijk grondig onderzoek onderworpen.',
      de: ' einer solch anhaltenden Prüfung unterzogen worden.',
      fr: " n'a fait l'objet d'un examen aussi rigoureux.",
      es: ' ha sido objeto de un escrutinio tan riguroso.',
      it: ' sia stato sottoposto a un esame così attento.',
      tr: ' bu denli yoğun bir denetime tabi tutulmuştur.',
      ru: ' подвергалось столь пристальному вниманию.'
    }
  },
  {
    id: 10,
    type: 'Sentence',
    grammarFocus: 'Hedging & Evaluation (There is little to be gained)',
    prefix: {
      en: 'There is little to be gained from pretending that ',
      'en-US': 'There is little to be gained from pretending that ',
      fa: 'فایده‌ای ندارد وانمود کنیم که ',
      ar: 'لا جدوى من التظاهر بأن ',
      nl: 'Het heeft weinig zin te doen alsof ',
      de: 'Es bringt wenig, so zu tun, als sei ',
      fr: "Il n'y a rien à gagner à prétendre que ",
      es: 'Poco se gana fingiendo que ',
      it: 'Non serve a nulla fingere che ',
      tr: 'Şunu görmezden gelmek kimseye fayda sağlamaz: ',
      ru: 'Бессмысленно делать вид, что '
    },
    suffix: {
      en: ' is merely a peripheral concern.',
      'en-US': ' is merely a peripheral concern.',
      fa: ' صرفاً یک نگرانی حاشیه‌ای است.',
      ar: ' مجرد مسألة ثانوية.',
      nl: ' slechts een bijzaak is.',
      de: ' nur ein Randproblem ist.',
      fr: " n'est qu'une préoccupation secondaire.",
      es: ' sea solo una cuestión menor.',
      it: ' sia una preoccupazione marginale.',
      tr: ' sadece tali bir meseledir.',
      ru: ' лишь второстепенный вопрос.'
    }
  }
];

function getSafeText(record: Record<string, string>, lang: string, fallback: string): string {
  if (record[lang]) return record[lang];
  const short = lang.split('-')[0];
  if (record[short]) return record[short];
  return record['en'] || fallback;
}

/**
 * Generate high-precision C1 LanguageCard items on demand for any language pair
 */
export function getC1CardsForSession(
  targetLanguage: Language,
  nativeLanguage: Language,
  selectedCategories: string[] = []
): LanguageCard[] {
  const cards: LanguageCard[] = [];

  C1_FRAMES.forEach(frame => {
    C1_ENTITIES.forEach(entity => {
      // Check topic match
      if (selectedCategories.length > 0 && !selectedCategories.includes(entity.topic)) {
        return;
      }

      const targetPrefix = getSafeText(frame.prefix, targetLanguage, frame.prefix['en']);
      const targetSuffix = getSafeText(frame.suffix, targetLanguage, frame.suffix['en']);
      const targetEntity = getSafeText(entity.texts, targetLanguage, entity.texts['en']);
      const targetText = `${targetPrefix}${targetEntity}${targetSuffix}`.trim();

      const isEnNative = nativeLanguage === 'en' || nativeLanguage === 'en-US';
      const nativeFallback = isEnNative ? (frame.prefix['en-US'] || frame.prefix['en']) : (frame.prefix['fa'] || frame.prefix['en']);
      const nativePrefix = getSafeText(frame.prefix, nativeLanguage, nativeFallback);
      const suffixFallback = isEnNative ? (frame.suffix['en-US'] || frame.suffix['en']) : (frame.suffix['fa'] || frame.suffix['en']);
      const nativeSuffix = getSafeText(frame.suffix, nativeLanguage, suffixFallback);
      const entityFallback = isEnNative ? (entity.texts['en-US'] || entity.texts['en']) : (entity.texts['fa'] || entity.texts['en']);
      const nativeEntity = getSafeText(entity.texts, nativeLanguage, entityFallback);
      const nativeText = `${nativePrefix}${nativeEntity}${nativeSuffix}`.trim();

      const cardId = `C1_SENT_${frame.id}_${entity.id}_${targetLanguage}`;

      cards.push({
        id: cardId,
        targetLanguage,
        nativeLanguage,
        cefrLevel: 'C1',
        topic: entity.topic,
        contentType: frame.type,
        learningMode: frame.type === 'Question' ? 'Speak' : 'Translate',
        prompt: nativeLanguage === 'fa' 
          ? `بیان یا ترجمه این عبارت پیشرفته (${frame.grammarFocus}):` 
          : `Express or translate this C1 sentence (${frame.grammarFocus}):`,
        targetText,
        translation: nativeText,
        difficulty: 'hard',
        points: 3,
        grammarPoint: nativeLanguage === 'fa' ? `نکته گرامری C1: ${frame.grammarFocus}` : `C1 Grammar: ${frame.grammarFocus}`,
        pronunciation: targetText.length > 60 ? targetText.substring(0, 50) + '...' : undefined
      });
    });
  });

  return cards;
}
