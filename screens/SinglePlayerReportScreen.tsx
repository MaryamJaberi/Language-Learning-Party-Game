import React, { useState } from 'react';
import { SinglePlayerSessionReport, Language, LanguageCard } from '../types';
import { sound } from '../soundManager';
import { tUI, isRtlLang } from '../ui';
import { submitScoreToLeaderboard, getPersonalRecords } from '../contentEngine';
import { FlagIcon } from '../components/FlagIcon';
import { 
  Trophy, 
  Award, 
  CheckCircle, 
  RotateCcw, 
  ArrowLeft, 
  Flame, 
  Volume2, 
  Sparkles,
  Send,
  AlertCircle
} from 'lucide-react';

interface Props {
  report: SinglePlayerSessionReport;
  language: Language;
  onPlayAgain: () => void;
  onPracticeWeakCards: (cards: LanguageCard[]) => void;
  onOpenLeaderboard?: () => void;
  onExit: () => void;
}

const SinglePlayerReportScreen: React.FC<Props> = ({
  report,
  language,
  onPlayAgain,
  onPracticeWeakCards,
  onOpenLeaderboard,
  onExit
}) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('dor_single_player_name') || t.languagePro || (isRTL ? 'قهرمان زبان' : 'Language Pro');
  });
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const personalRecords = getPersonalRecords();
  const isAllTimeBest = report.totalScore >= personalRecords.highestScore && report.totalScore > 0;

  // Grade calculation
  const getGrade = (acc: number) => {
    if (acc >= 95) return { grade: 'A+', color: '#15803d', label: isRTL ? 'فوق‌العاده!' : 'Outstanding!' };
    if (acc >= 80) return { grade: 'A', color: '#1E9E93', label: isRTL ? 'بسیار عالی' : 'Great!' };
    if (acc >= 65) return { grade: 'B', color: '#b45309', label: isRTL ? 'خوب' : 'Good' };
    return { grade: 'C', color: '#E0603F', label: isRTL ? 'نیاز به تمرین' : 'Needs Practice' };
  };

  const gradeInfo = getGrade(report.accuracy);

  const handleSpeak = (text: string, lang: Language) => {
    sound.speakNative(text, lang);
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim() || isScoreSubmitted || isSubmitting) return;
    setIsSubmitting(true);
    sound.playClick();
    try {
      localStorage.setItem('dor_single_player_name', playerName.trim());
      await submitScoreToLeaderboard({
        playerName: playerName.trim(),
        score: report.totalScore,
        accuracy: report.accuracy,
        totalCards: report.totalCards,
        targetLanguage: report.settings.targetLanguage,
        cefrLevel: report.settings.cefrLevel,
        date: new Date().toLocaleDateString()
      });
      setIsScoreSubmitted(true);
      sound.playCorrect();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col justify-between p-3 sm:p-4 text-[var(--ink)] bg-[var(--bg)] select-none overflow-y-auto overscroll-contain font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0 mb-2 font-ui">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--line)] text-xs font-bold text-[var(--ink)] shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          <span>{isRTL ? 'منوی اصلی' : 'Main Menu'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--panel)] border border-[var(--line)] shadow-xs text-xs font-bold text-[var(--turq)]">
          <FlagIcon language={report.settings.targetLanguage} size={15} />
          <span>{report.settings.cefrLevel}</span>
        </div>
      </div>

      {/* Main Card: Learning Summary */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-3 shrink-0">
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-xs p-4 sm:p-5 text-center relative font-ui">
          
          <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-[var(--lapis-soft)] text-[var(--lapis)] text-[10px] font-bold uppercase rounded-lg mb-1">
            <Award size={13} />
            <span>{t.reportCard}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display text-[var(--ink)]">
            {gradeInfo.label}
          </h1>

          {/* Grade and Total Score Badge */}
          <div className="my-3 flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] border border-[var(--line)] flex flex-col items-center justify-center shadow-xs">
              <span className="text-2xl font-black font-display" style={{ color: gradeInfo.color }}>
                {gradeInfo.grade}
              </span>
              <span className="text-[9px] text-[var(--mute)] font-bold">{isRTL ? 'رتبه' : 'Grade'}</span>
            </div>

            <div className="text-left rtl:text-right">
              <div className="text-3xl sm:text-4xl font-black font-display text-[var(--lapis)]">
                {report.totalScore.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-[var(--turq)] flex items-center gap-1">
                <Sparkles size={12} />
                <span>{isRTL ? 'مجموع امتیاز مسابقه' : 'Total Score Earned'}</span>
              </div>
            </div>
          </div>

          {/* Personal Record Indicator */}
          <div className="my-2 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[var(--ink)] font-bold">
              <Trophy size={14} className="text-[var(--saffron)]" />
              <span>{isRTL ? 'بهترین رکورد شما:' : 'Your Personal Best:'}</span>
            </div>
            <div className="font-mono font-bold text-[var(--turq)] text-sm">
              {Math.max(personalRecords.highestScore, report.totalScore).toLocaleString()} PTS
            </div>
          </div>

          {isAllTimeBest && (
            <div className="mb-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-pulse">
              🎉 {isRTL ? 'رکورد شخصی جدید! شما بهترین امتیاز خود را ثبت کردید!' : 'New Personal Record! You achieved your highest score ever!'}
            </div>
          )}

          {/* Detailed Metric Grid */}
          <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
            <div className="bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)]">
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{report.accuracy}%</div>
              <div className="text-[10px] text-[var(--mute)] font-bold">{t.accuracy}</div>
            </div>
            <div className="bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)]">
              <div className="text-base font-black text-[var(--turq)]">{report.correctFirstTry} / {report.totalCards}</div>
              <div className="text-[10px] text-[var(--mute)] font-bold">{isRTL ? 'درست بار اول' : 'First Try'}</div>
            </div>
            <div className="bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)]">
              <div className="text-base font-black text-[var(--saffron)]">{report.correctedCount}</div>
              <div className="text-[10px] text-[var(--mute)] font-bold">{isRTL ? 'تصحیح‌شده' : 'Corrected'}</div>
            </div>
          </div>
        </div>

        {/* Submit to Leaderboard Form */}
        <div className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs font-ui">
          <div className="text-xs font-bold text-[var(--ink)] mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-[var(--saffron)]" />
              <span>{isRTL ? 'ثبت رکورد در رده‌بندی جهانی' : 'Post to Leaderboard'}</span>
            </div>
            <span className="text-[10px] text-[var(--mute)] font-medium">
              {isRTL ? 'مشاهده در پروفایل کاربر' : 'View in User Profile'}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              disabled={isScoreSubmitted || isSubmitting}
              placeholder={isRTL ? 'نام خود را وارد کنید...' : 'Enter player name...'}
              className="flex-1 bg-[var(--bg)] text-[var(--ink)] px-3 py-2 rounded-xl border border-[var(--line)] text-xs font-bold focus:border-[var(--lapis)] focus:outline-hidden"
            />
            <button
              onClick={handleSubmitScore}
              disabled={isScoreSubmitted || isSubmitting || !playerName.trim()}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer ${
                isScoreSubmitted 
                  ? 'bg-[var(--turq)] text-white' 
                  : 'bg-[var(--lapis)] text-[var(--on-lapis)] hover:brightness-105'
              }`}
            >
              {isScoreSubmitted ? (
                <>
                  <CheckCircle size={14} />
                  <span>{isRTL ? 'ثبت شد' : 'Posted'}</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{isRTL ? 'ثبت' : 'Submit'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Weak Cards Section */}
        {report.weakCards.length > 0 && (
          <div className="bg-[var(--panel)] p-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-xs font-ui">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                <AlertCircle size={15} />
                <span>{t.weakCards} ({report.weakCards.length})</span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onPracticeWeakCards(report.weakCards);
                }}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <RotateCcw size={11} />
                <span>{t.practiceWeakCards}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {report.weakCards.map((card, idx) => (
                <div 
                  key={card.id || idx}
                  className="bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[var(--ink)] truncate">{card.targetText}</div>
                    <div className="text-[10.5px] text-[var(--mute)] truncate">{card.translation}</div>
                  </div>
                  <button
                    onClick={() => handleSpeak(card.targetText, card.targetLanguage)}
                    className="p-1.5 rounded-lg bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--line)]/50 border border-[var(--line)] shrink-0 ml-2 rtl:mr-2 rtl:ml-0 cursor-pointer"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-2 mt-3 shrink-0 font-ui">
        <button
          onClick={() => {
            sound.playClick();
            onPlayAgain();
          }}
          className="w-full py-3.5 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] font-extrabold text-sm sm:text-base shadow-md uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <RotateCcw size={18} />
          <span className="whitespace-nowrap">{isRTL ? 'تمرین مجدد' : 'Play Again'}</span>
          <Flame size={16} className="text-[var(--saffron)]" />
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
        >
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          <span>{isRTL ? 'بازگشت به منوی اصلی' : 'Back to Main Menu'}</span>
        </button>
      </div>
    </div>
  );
};

export default SinglePlayerReportScreen;
