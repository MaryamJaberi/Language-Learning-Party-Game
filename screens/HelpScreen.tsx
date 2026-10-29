import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { tUI, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  ChevronUp, 
  ShieldCheck, 
  ExternalLink,
  Users,
  Swords,
  User,
  Box,
  Globe,
  Trophy,
  Mic,
  Clock,
  Layers,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  Flame
} from 'lucide-react';
import { useGoogleScrollBars } from '../useGoogleScrollBars';
import { FlagIcon } from '../components/FlagIcon';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LanguagePickerModal } from '../components/LanguagePickerModal';

const RULES_CHALLENGE_AND_COMBO: Record<string, { challenge: string; combo: string; title: string }> = {
  fa: {
    title: 'کارت‌های چالش و کمبو',
    challenge: 'کارت‌های چالش: برخی کارت‌ها دشوارترند و در صورت حدس درست ۲+ امتیاز دارند.',
    combo: 'کمبو: حدس‌های متوالی درست زنجیره می‌سازند؛ رد کردن آن را ریست می‌کند. بدون امتیاز اضافی.'
  },
  en: {
    title: 'Challenge Cards & Combo',
    challenge: 'Challenge cards: some cards are harder and score +2 when guessed right.',
    combo: 'Combo: guess correctly in a row to build a streak; skipping resets it. No extra points.'
  },
  'en-US': {
    title: 'Challenge Cards & Combo',
    challenge: 'Challenge cards: some cards are harder and score +2 when guessed right.',
    combo: 'Combo: guess correctly in a row to build a streak; skipping resets it. No extra points.'
  },
  nl: {
    title: 'Uitdaagkaarten & Combo',
    challenge: 'Uitdaagkaarten: sommige kaarten zijn moeilijker en leveren +2 punten op bij een goed antwoord.',
    combo: 'Combo: raad achter elkaar goed voor een reeks; overslaan reset dit. Geen extra punten.'
  },
  de: {
    title: 'Herausforderungskarten & Kombo',
    challenge: 'Herausforderungskarten: Manche Karten sind schwerer und bringen +2 Punkte bei richtiger Antwort.',
    combo: 'Kombo: Richtig in Folge raten für eine Serie; Überspringen setzt sie zurück. Keine Extrapunkte.'
  },
  fr: {
    title: 'Cartes défi & Combo',
    challenge: 'Cartes défi : certaines cartes sont plus difficiles et rapportent +2 si elles sont réussies.',
    combo: 'Combo : devinez correctement d\'affilée pour une série ; passer réinitialise. Pas de points bonus.'
  },
  es: {
    title: 'Tarjetas de desafío y Combo',
    challenge: 'Tarjetas de desafío: algunas tarjetas son más difíciles y dan +2 si se aciertan.',
    combo: 'Combo: acierta seguido para crear una racha; pasar la reinicia. Sin puntos extra.'
  },
  it: {
    title: 'Carte sfida & Combo',
    challenge: 'Carte sfida: alcune carte sono più difficili e valgono +2 punti se indovinate.',
    combo: 'Combo: indovina di fila per creare una serie; passare la azzera. Nessun punto extra.'
  },
  tr: {
    title: 'Meydan Okuma Kartları ve Kombo',
    challenge: 'Meydan okuma kartları: bazı kartlar daha zordur ve doğru bilinirse +2 puan kazandırır.',
    combo: 'Kombo: seri yapmak için peş peşe doğru bilin; pas geçmek sıfırlar. Ekstra puan yok.'
  },
  ar: {
    title: 'بطاقات التحدي والكومبو',
    challenge: 'بطاقات التحدي: بعض البطاقات أصعب وتمنح +2 نقطة عند تخمينها بشكل صحيح.',
    combo: 'كومبو: خمّن بشكل صحيح متتالٍ لبناء سلسلة؛ التخطي يعيد ضبطها. بدون نقاط إضافية.'
  },
  ru: {
    title: 'Карты-вызовы и Комбо',
    challenge: 'Карты-вызовы: некоторые карты сложнее и дают +2 очка при правильном ответе.',
    combo: 'Комбо: угадывайте подряд для серии; пропуск сбрасывает ее. Без дополнительных очков.'
  },
  zh: {
    title: '挑战卡与连击',
    challenge: '挑战卡：部分卡片难度更高，猜对可得+2分。',
    combo: '连击：连续猜对可累积连击；跳过则重置连击。无额外加分。'
  },
  ja: {
    title: 'チャレンジカード＆コンボ',
    challenge: 'チャレンジカード：難易度が高いカードで、正解すると+2点獲得できます。',
    combo: 'コンボ：連続正解でストリークを構築。スキップでリセット。追加点はありません。'
  },
  ko: {
    title: '챌린지 카드 & 콤보',
    challenge: '챌린지 카드: 더 어려운 카드이며 정답 시 +2점을 획득합니다.',
    combo: '콤보: 연속으로 맞히면 연속 기록이 쌓이며, 건너뛰면 초기화됩니다. 추가 점수 없음.'
  },
  sv: {
    title: 'Utmaningskort & Combo',
    challenge: 'Utmaningskort: vissa kort är svårare och ger +2 poäng vid rätt svar.',
    combo: 'Combo: gissa rätt i rad för en svit; att hoppa över återställer den. Inga extrapoäng.'
  },
  pl: {
    title: 'Karty wyzwań i Kombinacja',
    challenge: 'Karty wyzwań: niektóre karty są trudniejsze i dają +2 punkty za poprawną odpowiedź.',
    combo: 'Kombinacja: odgaduj poprawnie z rzędu; pominięcie resetuje serię. Bez dodatkowych punktów.'
  },
  uk: {
    title: 'Картки-виклики та Комбо',
    challenge: 'Картки-виклики: деякі картки складніші й дають +2 бали за правильну відповідь.',
    combo: 'Комбо: відгадуйте поспіль для серії; пропуск скидає її. Без дополнительных балів.'
  },
  pt: {
    title: 'Cartões de Desafio e Combo',
    challenge: 'Cartões de desafio: alguns cartões são mais difíciles e valem +2 ao acertar.',
    combo: 'Combo: acerte em sequência para criar uma sequência; pular reinicia. Sem pontos extras.'
  },
  no: {
    title: 'Utfordringskort og Combo',
    challenge: 'Utfordringskort: noen kort er vanskeligere og gir +2 poeng ved riktig svar.',
    combo: 'Combo: gjett riktig på rad for en rekke; hopping over tilbakestiller den. Ingen ekstra poeng.'
  },
  da: {
    title: 'Udfordringskort & Combo',
    challenge: 'Udfordringskort: nogle kort er sværere og giver +2 point ved rigtigt svar.',
    combo: 'Combo: gæt rigtigt i træk for en stime; spring over nulstiller. Ingen ekstra point.'
  },
  fi: {
    title: 'Haastekortit ja Combo',
    challenge: 'Haastekortit: jotkin kortit ovat vaikeampia ja antavat +2 pistettä oikeasta vastauksesta.',
    combo: 'Combo: arvaa oikein peräkkäin sarjaa varten; ohittaminen nollaa. Ei lisäpisteitä.'
  },
  el: {
    title: 'Κάρτες Πρόκλησης & Combo',
    challenge: 'Κάρτες πρόκλησης: ορισμένες κάρτες είναι δυσκολότερες και δίνουν +2 πόντους αν απαντηθούν σωστά.',
    combo: 'Combo: μαντέψτε σωστά στη σειρά για σερί. Η παράκαμψη επαναφέρει. Χωρίς επιπλέον πόντους.'
  },
  cs: {
    title: 'Karty výzev a Combo',
    challenge: 'Karty výzev: některé karty jsou těžší a za správnou odpověď dávají +2 body.',
    combo: 'Combo: hádejte správně v řadě pro sérii; přeskočení ji resetuje. Žádné body navíc.'
  },
  ro: {
    title: 'Carduri Provocare și Combo',
    challenge: 'Carduri de provocare: unele carduri sunt mai grele și aduc +2 puncte dacă sunt ghicite corect.',
    combo: 'Combo: ghicește corect consecutiv pentru o serie; trecerea peste resetează. Fără puncte în plus.'
  },
  hu: {
    title: 'Kihíváskártyák és Combo',
    challenge: 'Kihíváskártyák: néhány kártya nehezebb és helyes válasz esetén +2 pontot ér.',
    combo: 'Combo: találj el többet egymás után a sorozathoz; a kihagyás visszaállítja. Nincs plusz pont.'
  },
  hi: {
    title: 'चैलेंज कार्ड और कॉम्बो',
    challenge: 'चैलेंज कार्ड: कुछ कार्ड कठिन होते हैं और सही अनुमान पर +2 अंक मिलते हैं।',
    combo: 'कॉम्बो: स्ट्रीक बनाने के लिए लगातार सही अनुमान लगाएं; छोड़ना इसे रीसेट करता है। कोई अतिरिक्त अंक नहीं।'
  },
  ur: {
    title: 'چیلنج کارڈز اور کمبو',
    challenge: 'چیلنج کارڈز: کچھ کارڈز مشکل ہوتے ہیں اور صحیح جواب پر +2 پوائنٹس ملتے ہیں۔',
    combo: 'کمبو: سٹریک بنانے کے لیے مسلسل درست جواب دیں؛ چھوڑنا اسے ری سیٹ کر دیتا ہے۔ کوئی اضافی پوائنٹس نہیں۔'
  },
  id: {
    title: 'Kartu Tantangan & Kombo',
    challenge: 'Kartu tantangan: beberapa kartu lebih sulit dan bernilai +2 poin jika dijawab benar.',
    combo: 'Kombo: tebak benar beruntun untuk membangun streak; melewati akan meresetnya. Tanpa poin ekstra.'
  },
  ms: {
    title: 'Kad Cabaran & Kombo',
    challenge: 'Kad cabaran: sesetengah kad lebih sukar dan memberi +2 mata jika dijawab betul.',
    combo: 'Kombo: teka betul berturut-turut untuk membina rentak; langkau menetapkannya semula. Tiada mata tambahan.'
  },
  vi: {
    title: 'Thẻ Thử Thách & Combo',
    challenge: 'Thẻ thử thách: một số thẻ khó hơn và được +2 điểm khi đoán đúng.',
    combo: 'Combo: đoán đúng liên tiếp để tạo chuỗi; bỏ qua sẽ đặt lại. Không có điểm thưởng.'
  },
  th: {
    title: 'การ์ดท้าทายและคอมโบ',
    challenge: 'การ์ดท้าทาย: การ์ดยากกว่าและได้ +2 คะแนนเมื่อทายถูก',
    combo: 'คอมโบ: ทายถูกติดต่อกันเพื่อสะสมสตรีค การข้ามจะรีเซ็ต ไม่มีคะแนนพิเศษ'
  },
  tl: {
    title: 'Challenge Cards at Combo',
    challenge: 'Mga challenge card: mas mahirap ang ilan at may +2 puntos kapag nahulaan nang tama.',
    combo: 'Combo: hulaan nang sunod-sunod para sa streak; pag-skip ay nagre-reset nito. Walang dagdag na puntos.'
  },
  ku: {
    title: 'کارتەکانی ئاڵنگاری و کۆمبۆ',
    challenge: 'کارتەکانی ئاڵنگاری: هەندێک کارت سەختترن و ئەگەر دروست بوون +٢ خاڵیان هەیە.',
    combo: 'کۆمبۆ: لەسەریەک دروست بزانە بۆ دروستکردنی زنجیرە؛ تێپەڕاندن سفر دەکاتەوە. بەبێ خاڵی زیادە.'
  },
  az: {
    title: 'Meydan Oxuma Kartları və Kombo',
    challenge: 'Meydan oxuma kartları: bəzi kartlar daha çətindir və düzgün cavabda +2 xal qazandırır.',
    combo: 'Kombo: silsilə üçün ardıcıl düzgün tapın; ötürmək onu sıfırlayır. Əlavə xal yoxdur.'
  },
  he: {
    title: 'כרטיסי אתגר וקומבו',
    challenge: 'כרטיסי אתגר: חלק מהכרטיסים קשים יותר ומעניקים +2 נקודות על תשובה נכונה.',
    combo: 'קומבו: נחשו נכון ברצף כדי לבנות רצף; דילוג מאפס אותו. ללא נקודות נוספות.'
  },
  hy: {
    title: 'Մարտահրավերի քարտեր և Կոմբո',
    challenge: 'Մարտահրավերի քարտեր. որոշ քարտեր ավելի բարդ են և ճիշտ պատասխանի դեպքում տալիս են +2 միավոր:',
    combo: 'Կոմբո. շարք կազմելու համար անընդմեջ ճիշտ գուշակեք, բաց թողնելը զրոյացնում է: Առանց հավելյալ միավորների:'
  },
  ka: {
    title: 'გამოწვევის ბარათები და კომბო',
    challenge: 'გამოწვევის ბარათები: ზოგიერთი ბარათი უფრო რთულია და სწორ პასუხზე +2 ქულას იძლევა.',
    combo: 'კომბო: გამოიცანით ზედიზედ სერიის შესაქმნელად; გამოტოვება ანულებს მას. დამატებითი ქულების გარეშე.'
  },
  bn: {
    title: 'চ্যালেঞ্জ কার্ড এবং কম্বো',
    challenge: 'চ্যালেঞ্জ কার্ড: কিছু কার্ড কঠিন এবং সঠিকভাবে অনুমান করলে +২ পয়েন্ট পাওয়া যায়।',
    combo: 'কম্বো: স্ট্রিক তৈরি করতে পরপর সঠিক অনুমান করুন; এড়িয়ে গেলে এটি রিসেট হয়। কোনো অতিরিক্ত পয়েন্ট নেই।'
  }
};

export interface HelpScreenProps {
  language: Language;
  onClose: () => void;
  initialSection?: string;
  onLanguageChange?: (lang: Language) => void;
}

type Props = HelpScreenProps;

export const HelpScreen: React.FC<Props> = ({ 
  language, 
  onClose, 
  initialSection,
  onLanguageChange 
}) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);
  const { isBarsVisible, scrollContainerRef, handleScroll, showBars } = useGoogleScrollBars();
  const [activeTab, setActiveTab] = useState<'game_modes' | 'rules' | 'privacy'>('game_modes');
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (initialSection && scrollContainerRef.current) {
      const element = document.getElementById(`help-${initialSection}`);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialSection]);

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div 
      className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col bg-[var(--bg)] overflow-hidden select-none relative font-ui text-[var(--ink)]" 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header Panel with Google-style dynamic auto-hide/reveal */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-top shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-28' 
            : '-translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[var(--panel)] border-b border-[var(--line)] flex items-center justify-between text-[var(--ink)] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shadow-xs">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-display leading-tight">
                {isRTL ? 'راهنمای بازی «دور»' : 'Game Guide & Rules'}
              </h2>
              <p className="text-[11px] text-[var(--mute)] font-medium">
                {isRTL ? 'معرفی بازی و ۴ سبک جذاب، قوانین و امتیازدهی' : 'Game Introduction, 4 Modes & Rules'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Language Switch Button */}
            {onLanguageChange && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsLangPickerOpen(true);
                }}
                className="h-9 px-2.5 flex items-center gap-1.5 rounded-full bg-[var(--bg)] hover:bg-[var(--line)]/40 border border-[var(--line)] text-xs font-bold text-[var(--ink)] active:scale-95 transition-all cursor-pointer"
                title={isRTL ? 'تغییر زبان برنامه' : 'Change App Language'}
              >
                <FlagIcon language={language} size={16} />
                <span className="text-[10px] font-extrabold hidden sm:inline">{currentLangInfo.nativeName.split(' ')[0]}</span>
              </button>
            )}

            <button 
              type="button"
              onClick={handleClose} 
              className="w-9 h-9 flex items-center justify-center bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] border border-[var(--line)] font-bold rounded-full active:scale-95 shadow-xs transition-all cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-3 py-1.5 bg-[var(--bg)] border-b border-[var(--line)] flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setActiveTab('game_modes');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'game_modes'
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                : 'text-[var(--mute)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
            }`}
          >
            <Sparkles size={13} />
            <span>{isRTL ? '۴ سبک بازی' : '4 Game Modes'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setActiveTab('rules');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                : 'text-[var(--mute)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
            }`}
          >
            <Zap size={13} />
            <span>{isRTL ? 'قوانین و امتیاز' : 'Rules & Scoring'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setActiveTab('privacy');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-[var(--lapis)] text-[var(--on-lapis)] shadow-xs'
                : 'text-[var(--mute)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
            }`}
          >
            <ShieldCheck size={13} />
            <span>{isRTL ? 'امنیت و حریم' : 'Privacy'}</span>
          </button>
        </div>
      </div>

      {/* Rules content */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain font-ui"
      >
        
        {/* Intro Tip banner */}
        <div className="bg-[var(--panel)] p-3.5 border border-[var(--line)] rounded-2xl shadow-xs flex items-center gap-3">
          <TeamMascot color="PARTY" size={40} />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] bg-[var(--saffron)] text-[#15204A] px-2 py-0.5 rounded-lg font-black uppercase shadow-xs flex items-center gap-1 w-fit">
              <Zap size={11} className="text-[#15204A] fill-[#15204A]" />
              <span>{isRTL ? 'راز هیجان و موفقیت در بازی' : 'KEY STRATEGY'}</span>
            </span>
            <p className="text-[11.5px] font-bold text-[var(--ink)] leading-normal mt-1">
              {isRTL 
                ? 'کلمه را سریع به یارتان برسانید و بدون اتلاف وقت گوشی را به نفر بعد بدهید تا زمان تیم شما حفظ شود!' 
                : 'Pass the device fast! Every second saved keeps your team ahead on the clock!'}
            </p>
          </div>
        </div>

        {/* TAB 1: 4 GAME MODES WITH ILLUSTRATIONS */}
        {activeTab === 'game_modes' && (
          <div className="space-y-3 animate-fade-in">
            
            {/* Mode 1: Team Party Game */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۱. بازی دورهمی تیمی' : '1. Team Party Game'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? '۴ تا ۸ بازیکن • چرخش گوشی دور میز' : '4-8 Players • Clockwise Passing'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {isRTL ? 'دورهمی حضوری' : 'Local Party'}
                </span>
              </div>

              {/* Mode 1 Visual Illustration SVG */}
              <div className="w-full h-36 bg-gradient-to-br from-blue-500/5 via-[var(--bg)] to-indigo-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Table Circle */}
                  <ellipse cx="160" cy="60" rx="90" ry="42" fill="var(--panel)" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4" />
                  
                  {/* Passing Arrow Clockwise */}
                  <path d="M 95 60 A 65 30 0 0 1 225 60" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" />
                  <polygon points="228,62 222,54 220,64" fill="#3b82f6" />
                  
                  {/* Center Phone Device */}
                  <rect x="138" y="38" width="44" height="44" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                  <rect x="144" y="44" width="32" height="12" rx="3" fill="#3b82f6" />
                  <rect x="146" y="60" width="28" height="4" rx="2" fill="#ef4444" opacity="0.8" />
                  <rect x="146" y="66" width="20" height="4" rx="2" fill="#ef4444" opacity="0.6" />
                  <circle cx="160" cy="76" r="2.5" fill="#10b981" />

                  {/* Player 1 (Top Blue) */}
                  <circle cx="160" cy="16" r="12" fill="#3b82f6" />
                  <circle cx="160" cy="13" r="5" fill="white" opacity="0.9" />
                  
                  {/* Player 2 (Right Orange) */}
                  <circle cx="260" cy="60" r="12" fill="#f97316" />
                  <circle cx="260" cy="57" r="5" fill="white" opacity="0.9" />

                  {/* Player 3 (Bottom Green) */}
                  <circle cx="160" cy="104" r="12" fill="#10b981" />
                  <circle cx="160" cy="101" r="5" fill="white" opacity="0.9" />

                  {/* Player 4 (Left Purple) */}
                  <circle cx="60" cy="60" r="12" fill="#8b5cf6" />
                  <circle cx="60" cy="57" r="5" fill="white" opacity="0.9" />

                  {/* Flat Timer Icon */}
                  <circle cx="204" cy="36" r="10" fill="#f59e0b" />
                  <circle cx="204" cy="36" r="6" stroke="white" strokeWidth="1.5" fill="none" />
                  <path d="M 204 33 L 204 36 L 206.5 36" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'بازیکنان به تیم‌های ۲ نفره تقسیم می‌شوند و روبروی یکدیگر دور میز می‌نشینند.' : 'Players split into 2-person teams sitting across each other.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'کلمه هدف را برای یارتان توصیف کنید؛ استفاده از کلمات ممنوعه خطاست!' : 'Describe the prompt without uttering taboo words.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'به محض حدس درست، «درست بود!» را بزنید و گوشی را تحویل دهید تا زمان تیم شما متوقف شود.' : 'Press "Correct!" and pass immediately so your team clock stops.'}</span>
                </li>
              </ul>
            </div>

            {/* Mode 2: 2-Player Head-to-Head Duel */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <Swords size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۲. دوئل دونفره (روی ۱ گوشی یا آنلاین)' : '2. 2-Player Duel (Local & Online)'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? '۲ بازیکن • رقابت سرعتی رودررو' : '2 Players • Split-Screen / Online Clash'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {isRTL ? 'دوئل سرعتی' : '1v1 Duel'}
                </span>
              </div>

              {/* Mode 2 Visual Illustration SVG */}
              <div dir="ltr" className="w-full h-36 bg-gradient-to-br from-rose-500/5 via-[var(--bg)] to-amber-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Phone Bezel */}
                  <rect x="70" y="10" width="180" height="100" rx="16" fill="var(--panel)" stroke="var(--line)" strokeWidth="2" />
                  
                  {/* Split Screen Line */}
                  <line x1="160" y1="12" x2="160" y2="108" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                  
                  {/* Player 1 Side (Left - Blue) */}
                  <rect x="80" y="22" width="70" height="76" rx="8" fill="#3b82f6" fillOpacity="0.12" />
                  <circle cx="115" cy="40" r="10" fill="#3b82f6" />
                  <rect x="90" y="60" width="50" height="14" rx="4" fill="#3b82f6" />
                  <text x="115" y="67" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="white" fontWeight="bold">PLAYER 1</text>
                  <rect x="92" y="80" width="22" height="10" rx="3" fill="#10b981" />
                  <rect x="118" y="80" width="22" height="10" rx="3" fill="#ef4444" />

                  {/* Clash Lightning in Center */}
                  <circle cx="160" cy="60" r="14" fill="#f59e0b" />
                  <path d="M 162 50 L 155 60 L 160 60 L 157 70 L 166 59 L 161 59 Z" fill="#ffffff" />

                  {/* Player 2 Side (Right - Red/Orange) */}
                  <rect x="170" y="22" width="70" height="76" rx="8" fill="#f43f5e" fillOpacity="0.12" />
                  <circle cx="205" cy="40" r="10" fill="#f43f5e" />
                  <rect x="180" y="60" width="50" height="14" rx="4" fill="#f43f5e" />
                  <text x="205" y="67" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="white" fontWeight="bold">PLAYER 2</text>
                  <rect x="182" y="80" width="22" height="10" rx="3" fill="#10b981" />
                  <rect x="208" y="80" width="22" height="10" rx="3" fill="#ef4444" />
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'روی ۱ گوشی به صورت روبه‌رو (دو طرف گوشی) یا آنلاین بین ۲ گوشی مستقل.' : 'Face-to-face split-screen on one device or online 2-phone match.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'سرعت عمل کلید پیروزی است: اولین کسی که پاسخ درست را لمس کند امتیاز می‌گیرد.' : 'Reflex showdown: First player to tap the correct choice wins points.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'اشتباه زدن باعث قفل کوتاه دکمه‌های همان بازیکن می‌شود تا رقیب فرصت پاسخ داشته باشد.' : 'Wrong taps trigger a brief lockout, giving your rival a window to score.'}</span>
                </li>
              </ul>
            </div>

            {/* Mode 3: Single Player Flashcard & Voice Speedrun */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۳. چالش تک‌نفره و تست گفتار' : '3. Single-Player & Speech Challenge'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? 'انفرادی • تقویت مکالمه، املا و لیدربرد' : 'Solo • Speech, Spelling & Leaderboard'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {isRTL ? 'لیدربرد سطح‌بندی‌شده' : 'CEFR Ranked'}
                </span>
              </div>

              {/* Mode 3 Visual Illustration SVG */}
              <div dir="ltr" className="w-full h-36 bg-gradient-to-br from-emerald-500/5 via-[var(--bg)] to-teal-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Flashcard Body */}
                  <rect x="80" y="14" width="160" height="92" rx="14" fill="var(--panel)" stroke="var(--line)" strokeWidth="2" />
                  
                  {/* CEFR Level Badge */}
                  <rect x="90" y="23" width="48" height="16" rx="5" fill="#10b981" />
                  <text x="114" y="31" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fill="white" fontWeight="900">B1 CARD</text>

                  {/* Stopwatch Badge */}
                  <rect x="192" y="23" width="38" height="16" rx="5" fill="var(--bg)" stroke="var(--line)" />
                  <text x="211" y="31" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fill="var(--ink)" fontWeight="bold">60s</text>

                  {/* Prompt Text Line */}
                  <rect x="100" y="47" width="120" height="11" rx="3.5" fill="var(--ink)" fillOpacity="0.8" />
                  
                  {/* Active Recall Masked Hint Slots */}
                  <rect x="98" y="66" width="15" height="17" rx="4" fill="#10b981" fillOpacity="0.18" stroke="#10b981" />
                  <text x="105.5" y="74.5" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fill="#10b981" fontWeight="bold">B</text>
                  <rect x="117" y="66" width="15" height="17" rx="4" fill="var(--bg)" stroke="var(--line)" />
                  <text x="124.5" y="74.5" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fill="var(--mute)" fontWeight="bold">•</text>
                  <rect x="136" y="66" width="15" height="17" rx="4" fill="var(--bg)" stroke="var(--line)" />
                  <text x="143.5" y="74.5" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fill="var(--mute)" fontWeight="bold">•</text>
                  <rect x="155" y="66" width="15" height="17" rx="4" fill="var(--bg)" stroke="var(--line)" />
                  <text x="162.5" y="74.5" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fill="var(--mute)" fontWeight="bold">•</text>
                  <rect x="174" y="66" width="15" height="17" rx="4" fill="#10b981" fillOpacity="0.18" stroke="#10b981" />
                  <text x="181.5" y="74.5" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fill="#10b981" fontWeight="bold">K</text>

                  {/* Mic Wave Icon */}
                  <circle cx="211" cy="74.5" r="10" fill="#0d9488" />
                  <path d="M 211 69.5 C 212 69.5 213 70.5 213 71.5 L 213 74.5 C 213 75.5 212 76.5 211 76.5 C 210 76.5 209 75.5 209 74.5 L 209 71.5 C 209 70.5 210 69.5 211 69.5 Z" fill="white" />
                  <path d="M 207 73.5 C 207 76 208.8 78 211 78 C 213.2 78 215 76 215 73.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />

                  {/* Flat Leaderboard Badge on side */}
                  <circle cx="45" cy="60" r="16" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" />
                  <polygon points="45,51 47.5,56.5 53.5,57.2 49,61.2 50.2,67 45,64 39.8,67 41,61.2 36.5,57.2 42.5,56.5" fill="#f59e0b" />

                  {/* Flat Voice Wave Badge */}
                  <circle cx="275" cy="60" r="16" fill="#10b981" fillOpacity="0.2" stroke="#10b981" />
                  <line x1="269" y1="57" x2="269" y2="63" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                  <line x1="275" y1="53" x2="275" y2="67" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                  <line x1="281" y1="57" x2="281" y2="63" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'تمرین تلفظ صوتی با میکروفون یا نوشتن املای دقیق عبارات به همراه پخش صدای طبیعی و شمرده.' : 'Practice speaking via microphone or typing answers with natural & slow audio playback.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'دکمه راهنمایی هوشمند بالای کارت برای دریافت سرنخ شروع عبارت یا راهنمای تلفظ.' : 'Smart hint button on top of the card for starting words or phonetic pronunciation clues.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'حالت کارت شمارشی یا مسابقه زمان‌دار با امتیازدهی متناسب با سطح CEFR و ثبت در لیدربرد.' : 'Card count or timed match mode with CEFR-weighted scoring and leaderboard ranking.'}</span>
                </li>
              </ul>
            </div>

            {/* Mode 4: 5-Box Spaced Repetition Leitner Box */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Box size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      {isRTL ? '۴. جعبه لایتنر ۵ خانه (مرور با فواصل زمانی)' : '4. 5-Box Leitner Spaced Repetition'}
                    </h3>
                    <span className="text-[10px] text-[var(--mute)] font-bold">
                      {isRTL ? 'مرور روزانه • ثبت دائمی در حافظه بلندمدت' : 'Daily Review • Long-Term Retention'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {isRTL ? 'روش علمی لایتنر' : 'Scientific System'}
                </span>
              </div>

              {/* Mode 4 Visual Illustration SVG */}
              <div className="w-full h-36 bg-gradient-to-br from-amber-500/5 via-[var(--bg)] to-yellow-500/5 rounded-xl border border-[var(--line)] flex items-center justify-center p-2 overflow-hidden relative">
                <svg viewBox="0 0 320 120" className="w-full h-full max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* 5 Boxes */}
                  {/* Box 1 (1 Day) */}
                  <rect x="25" y="45" width="46" height="52" rx="8" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="48" y="65" textAnchor="middle" fontSize="9.5" fill="#d97706" fontWeight="black">{isRTL ? 'خانه ۱' : 'Box 1'}</text>
                  <text x="48" y="80" textAnchor="middle" fontSize="8" fill="var(--mute)" fontWeight="bold">{isRTL ? '۱ روز' : 'Day 1'}</text>

                  {/* Box 2 (2 Days) */}
                  <rect x="80" y="40" width="46" height="57" rx="8" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="103" y="62" textAnchor="middle" fontSize="9.5" fill="#d97706" fontWeight="black">{isRTL ? 'خانه ۲' : 'Box 2'}</text>
                  <text x="103" y="77" textAnchor="middle" fontSize="8" fill="var(--mute)" fontWeight="bold">{isRTL ? '۲ روز' : 'Day 2'}</text>

                  {/* Box 3 (4 Days) */}
                  <rect x="135" y="35" width="46" height="62" rx="8" fill="#f59e0b" fillOpacity="0.35" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="158" y="58" textAnchor="middle" fontSize="9.5" fill="#d97706" fontWeight="black">{isRTL ? 'خانه ۳' : 'Box 3'}</text>
                  <text x="158" y="73" textAnchor="middle" fontSize="8" fill="var(--mute)" fontWeight="bold">{isRTL ? '۴ روز' : 'Day 4'}</text>

                  {/* Box 4 (8 Days) */}
                  <rect x="190" y="30" width="46" height="67" rx="8" fill="#f59e0b" fillOpacity="0.45" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="213" y="54" textAnchor="middle" fontSize="9.5" fill="#b45309" fontWeight="black">{isRTL ? 'خانه ۴' : 'Box 4'}</text>
                  <text x="213" y="69" textAnchor="middle" fontSize="8" fill="var(--mute)" fontWeight="bold">{isRTL ? '۸ روز' : 'Day 8'}</text>

                  {/* Box 5 (16 Days) */}
                  <rect x="245" y="25" width="48" height="72" rx="8" fill="#f59e0b" fillOpacity="0.6" stroke="#f59e0b" strokeWidth="2" />
                  <text x="269" y="50" textAnchor="middle" fontSize="9.5" fill="#15204A" fontWeight="black">{isRTL ? 'خانه ۵' : 'Box 5'}</text>
                  <text x="269" y="65" textAnchor="middle" fontSize="8" fill="#15204A" fontWeight="bold">{isRTL ? '۱۶ روز' : 'Day 16'}</text>

                  {/* Flat Mastery Check Badge */}
                  <circle cx="269" cy="15" r="9" fill="#10b981" />
                  <path d="M 265 15 L 268 18 L 273.5 12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                  {/* Progression green arrow */}
                  <path d="M 50 38 Q 160 15 240 22" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" fill="none" />
                  <polygon points="243,23 236,18 238,25" fill="#10b981" />
                </svg>
              </div>

              {/* Summary List */}
              <ul className="text-xs text-[var(--ink)] font-medium space-y-1.5 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'بر پایه فواصل زمانی علمی: مرور در روزهای ۱، ۲، ۴، ۸ و ۱۶ برای تثبیت دائمی.' : 'Spaced interval schedule: Reviews on days 1, 2, 4, 8, and 16.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'پاسخ درست، کارت را به خانه بالاتر می‌برد؛ پاسخ اشتباه آن را برای مرور مجدد به خانه اول بازمی‌گرداند.' : 'Correct answers promote cards; mistakes return them to Box 1 for retraining.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{isRTL ? 'کارت‌های خانه ۵ پس از موفقیت به مقام تسلط کامل (Mastered) فارغ‌التحصیل می‌شوند.' : 'Cards clearing Box 5 graduate to permanent mastery status.'}</span>
                </li>
              </ul>
            </div>

          </div>
        )}

        {/* TAB 2: RULES & TIME BOMB */}
        {activeTab === 'rules' && (
          <div className="space-y-3 animate-fade-in">
            {/* Rule 1 */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--lapis)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Sparkles size={13} className="text-white" />
                <span>{isRTL ? 'نحوه چرخش نوبت‌ها' : 'Turn Rotation Rules'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
                {isRTL 
                  ? 'گوشی در جهت عقربه‌های ساعت بین بازیکنان دست‌به‌دست می‌شود. در نوبت خود کلمه را برای یارتان توصیف کنید بدون گفتن خود کلمه یا ریشه مستقیم آن.'
                  : 'The device moves clockwise around the table. Describe the prompt to your partner without uttering root or forbidden words.'}
              </p>
            </section>

            {/* Rule 2: Scoring */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--saffron)] inline-flex items-center gap-1.5 font-black text-[#15204A] px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Trophy size={13} className="text-[#15204A]" />
                <span>{isRTL ? 'امتیازدهی و بمب زمان' : 'Scoring & Time Bomb'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
                {isRTL 
                  ? 'با هر حدس درست، دکمه «درست بود!» را لمس کرده و بلافاصله گوشی را به نفر بعد تحویل دهید. هر تیمی که زمانش زودتر تمام شود، امتیاز آن راند به تیم رقیب می‌رسد.'
                  : 'Tap "Correct!" on right guesses and hand off the device immediately. If your team timer hits zero, the round goes to rivals.'}
              </p>
            </section>

            {/* Rule 3: Single player scoring */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--teal)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Layers size={13} className="text-white" />
                <span>{isRTL ? 'ضرایب امتیاز بر اساس سطح دشواری کارت‌ها' : 'CEFR Difficulty Weighting'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl">
                {isRTL 
                  ? 'در چالش تک‌نفره، امتیاز هر پاسخ بر اساس سطح کارت (A1 تا C1) ضرب می‌شود: کارت‌های پیشرفته‌تر (B2 و C1) امتیاز بسیار بالاتری دارند و رتبه شما را در لیدربرد جهش می‌دهند.'
                  : 'In single player, points scale with card CEFR difficulty: A1 (1.0x), A2 (1.35x), B1 (1.8x), B2 (2.4x), C1 (3.2x), boosting your leaderboard rank.'}
              </p>
            </section>

            {/* Rule 4: Challenge Cards & Combo in every UI language */}
            {(() => {
              const ruleData = RULES_CHALLENGE_AND_COMBO[language] || RULES_CHALLENGE_AND_COMBO['en'];
              return (
                <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
                  <div className="bg-amber-500 inline-flex items-center gap-1.5 font-black text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                    <Flame size={13} className="text-white fill-white" />
                    <span>{ruleData.title}</span>
                  </div>
                  <div className="bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl space-y-2 text-xs font-medium text-[var(--ink)] leading-relaxed">
                    <p>{ruleData.challenge}</p>
                    <p>{ruleData.combo}</p>
                  </div>
                </section>
              );
            })()}
          </div>
        )}

        {/* TAB 3: PRIVACY & SYSTEM LANGUAGE */}
        {activeTab === 'privacy' && (
          <div className="space-y-3 animate-fade-in">
            {/* System Language Detection Card */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative">
              <div className="bg-[var(--lapis)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <Globe size={13} className="text-white" />
                <span>{isRTL ? 'زبان پیش‌فرض و تشخیص سیستم' : 'Default Language Detection'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl mb-2.5">
                {isRTL 
                  ? 'برنامه به صورت هوشمند زبان سیستم‌عامل کاربر را بررسی کرده و زبان رابط کاربری را هماهنگ می‌سازد. در صورت عدم تطابق، زبان پیش‌فرض انگلیسی آمریکایی است و هر زمان با زدن روی آیکون پرچم بالای صفحه می‌توانید زبان را تغییر دهید.'
                  : 'The app checks your system language and sets the interface accordingly. By default, it uses US English, and you can switch to any language using the flag icon on top.'}
              </p>
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg)] rounded-xl border border-[var(--line)] text-xs font-bold">
                <span>{isRTL ? 'زبان فعلی فعال:' : 'Active App Language:'}</span>
                <span className="flex items-center gap-1.5 text-[var(--lapis)]">
                  <FlagIcon language={language} size={16} />
                  <span>{currentLangInfo.nativeName}</span>
                </span>
              </div>
            </section>

            {/* Privacy Policy Card */}
            <section className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs relative overflow-hidden">
              <div className="bg-[var(--turq)] inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-1 text-xs rounded-xl shadow-xs mb-2">
                <ShieldCheck size={13} className="text-white" />
                <span>{isRTL ? 'حریم خصوصی و پردازش صدا' : 'Privacy & Voice Security'}</span>
              </div>
              <p className="text-xs font-medium text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl mb-2.5">
                {isRTL 
                  ? 'اطلاعات شما با بالاترین استانداردهای امنیتی محافظت می‌شود. هیچ صدای ضبط‌شده‌ای در سرور ذخیره نمی‌شود و پردازش صدا مستقیماً روی دستگاه انجام می‌شود.' 
                  : 'Your voice data is processed securely on-device. No recordings are retained or transmitted to external servers.'}
              </p>
              <a
                href="./privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-[var(--lapis-soft)] text-[var(--lapis)] hover:bg-[var(--lapis)] hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>{isRTL ? 'مشاهده متن کامل سیاست حریم خصوصی' : 'Read Full Privacy Policy'}</span>
                <ExternalLink size={13} />
              </a>
            </section>
          </div>
        )}

      </div>

      {/* Floating reveal trigger when bars are hidden */}
      {!isBarsVisible && (
        <button
          onClick={showBars}
          aria-label="Show menu"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-[var(--ink)] text-[var(--saffron)] border border-[var(--line)] rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-xs animate-pulse font-ui cursor-pointer"
        >
          <ChevronUp size={14} />
          <span>{t.resume || (isRTL ? 'ادامه' : 'Resume')}</span>
        </button>
      )}

      {/* Footer Return Drawer */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-bottom shrink-0 z-20 ${
          isBarsVisible 
            ? 'translate-y-0 opacity-100 max-h-24' 
            : 'translate-y-full opacity-0 max-h-0 pointer-events-none overflow-hidden'
        }`}
      >
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] flex gap-4 font-ui">
          <button 
            onClick={handleClose} 
            className="start-btn w-full"
          >
            <span>{t?.resume || (isRTL ? 'بازگشت به بازی' : 'Back to Game')}</span>
            <Zap size={18} />
          </button>
        </div>
      </div>

      {/* Language Picker Modal inside Help if triggered */}
      {isLangPickerOpen && onLanguageChange && (
        <LanguagePickerModal
          isOpen={true}
          onClose={() => setIsLangPickerOpen(false)}
          selectedLanguage={language}
          onSelectLanguage={(lang) => {
            onLanguageChange(lang);
            setIsLangPickerOpen(false);
          }}
          mode="single"
          title={isRTL ? 'انتخاب زبان برنامه' : 'Select App Language'}
          subtitle={isRTL ? 'تغییر زبان رابط کاربری' : 'Switch UI Language'}
          isRTL={isRTL}
        />
      )}
    </div>
  );
};

export default HelpScreen;
