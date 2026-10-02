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
  onOpenLeaderboard: () => void;
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
      className="h-full min-h-0 flex-1 flex flex-col justify-between p-3.5 sm:p-4 text-[#1E1B2E] select-none overflow-y-auto overscroll-contain font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0 mb-2 font-ui">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-[12px] bg-[#FFFBF4] border-2 border-[#1E1B2E] text-xs font-bold text-[#1E1B2E] hover:bg-[#F4EDE1] shadow-[2px_2px_0px_0px_#1E1B2E]"
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          <span>{isRTL ? 'منوی اصلی' : 'Main Menu'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[12px] bg-[#FFFBF4] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] text-xs font-bold text-[#1E9E93]">
          <FlagIcon language={report.settings.targetLanguage} size={15} />
          <span>{report.settings.cefrLevel}</span>
        </div>
      </div>

      {/* Main Card: Learning Summary */}
      <div className="w-full max-w-sm mx-auto space-y-3 shrink-0">
        <div className="bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B2E] p-4 text-center relative font-ui">
          
          <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-[#F2B63D] text-[#1E1B2E] text-[10px] font-bold uppercase rounded-[8px] border border-[#1E1B2E] mb-1">
            <Award size={13} />
            <span>{t.reportCard}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#1E1B2E]">
            {gradeInfo.label}
          </h1>

          {/* Grade and Total Score Badge */}
          <div className="my-3 flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-[16px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_#1E1B2E]">
              <span className="text-2xl font-bold font-display" style={{ color: gradeInfo.color }}>
                {gradeInfo.grade}
              </span>
              <span className="text-[9px] text-[#1E1B2E]/60 font-bold">{isRTL ? 'رتبه' : 'Grade'}</span>
            </div>

            <div className="text-left rtl:text-right">
              <div className="text-3xl sm:text-4xl font-bold font-display text-[#E0603F]">
                {report.totalScore.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-[#1E9E93] flex items-center gap-1">
                <Sparkles size={12} />
                <span>{isRTL ? 'مجموع امتیاز مسابقه' : 'Total Score Earned'}</span>
              </div>
            </div>
          </div>

          {/* Personal Record Indicator */}
          <div className="my-2 p-2 rounded-[14px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#1E1B2E] font-bold">
              <Trophy size={14} className="text-[#F2B63D]" />
              <span>{isRTL ? 'بهترین رکورد شما:' : 'Your Personal Best:'}</span>
            </div>
            <div className="font-mono font-bold text-[#E0603F] text-sm">
              {Math.max(personalRecords.highestScore, report.totalScore).toLocaleString()} PTS
            </div>
          </div>

          {isAllTimeBest && (
            <div className="mb-2 p-2 rounded-[14px] bg-[#dcfce7] border-2 border-[#1E1B2E] text-[#15803d] text-xs font-bold text-center animate-pulse">
              🎉 {isRTL ? 'رکورد شخصی جدید! شما بهترین امتیاز خود را ثبت کردید!' : 'New Personal Record! You achieved your highest score ever!'}
            </div>
          )}

          {/* Detailed Metric Grid */}
          <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
            <div className="bg-[#F4EDE1] p-2 rounded-[14px] border-2 border-[#1E1B2E]">
              <div className="text-base font-bold text-[#15803d]">{report.accuracy}%</div>
              <div className="text-[10px] text-[#1E1B2E]/70 font-bold">{t.accuracy}</div>
            </div>
            <div className="bg-[#F4EDE1] p-2 rounded-[14px] border-2 border-[#1E1B2E]">
              <div className="text-base font-bold text-[#1E9E93]">{report.correctFirstTry} / {report.totalCards}</div>
              <div className="text-[10px] text-[#1E1B2E]/70 font-bold">{isRTL ? 'درست بار اول' : 'First Try'}</div>
            </div>
            <div className="bg-[#F4EDE1] p-2 rounded-[14px] border-2 border-[#1E1B2E]">
              <div className="text-base font-bold text-[#F2B63D]">{report.correctedCount}</div>
              <div className="text-[10px] text-[#1E1B2E]/70 font-bold">{isRTL ? 'تصحیح‌شده' : 'Corrected'}</div>
            </div>
          </div>
        </div>

        {/* Submit to Leaderboard Form */}
        <div className="bg-[#FFFBF4] p-3 rounded-[20px] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] font-ui">
          <div className="text-xs font-bold text-[#1E1B2E] mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-[#F2B63D]" />
              <span>{isRTL ? 'ثبت رکورد در لیدربرد' : 'Post to Leaderboard'}</span>
            </div>
            <button 
              onClick={() => {
                sound.playClick();
                onOpenLeaderboard();
              }}
              className="text-[10px] text-[#1E9E93] font-bold hover:underline"
            >
              {isRTL ? 'مشاهده لیدربرد' : 'View Ranks'}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              disabled={isScoreSubmitted || isSubmitting}
              placeholder={isRTL ? 'نام خود را وارد کنید...' : 'Enter player name...'}
              className="flex-1 bg-[#F4EDE1] text-[#1E1B2E] px-3 py-2 rounded-[12px] border-2 border-[#1E1B2E] text-xs font-bold focus:outline-none"
            />
            <button
              onClick={handleSubmitScore}
              disabled={isScoreSubmitted || isSubmitting || !playerName.trim()}
              className={`px-3.5 py-2 rounded-[12px] font-bold text-xs border-2 border-[#1E1B2E] flex items-center gap-1 shadow-[2px_2px_0px_0px_#1E1B2E] transition-transform active:scale-95 ${
                isScoreSubmitted 
                  ? 'bg-[#1E9E93] text-white' 
                  : 'bg-[#F2B63D] text-[#1E1B2E] hover:bg-[#e0a634]'
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
          <div className="bg-[#FFFBF4] p-3 rounded-[20px] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] font-ui">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#E0603F]">
                <AlertCircle size={15} />
                <span>{t.weakCards} ({report.weakCards.length})</span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onPracticeWeakCards(report.weakCards);
                }}
                className="px-2.5 py-1 bg-[#E0603F] text-white rounded-[8px] border border-[#1E1B2E] text-[10px] font-bold flex items-center gap-1 hover:bg-[#c94d2f]"
              >
                <RotateCcw size={11} />
                <span>{t.practiceWeakCards}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {report.weakCards.map((card, idx) => (
                <div 
                  key={card.id || idx}
                  className="bg-[#F4EDE1] p-2 rounded-[12px] border border-[#1E1B2E] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#1E1B2E] truncate">{card.targetText}</div>
                    <div className="text-[10.5px] text-[#1E1B2E]/60 truncate">{card.translation}</div>
                  </div>
                  <button
                    onClick={() => handleSpeak(card.targetText, card.targetLanguage)}
                    className="p-1.5 rounded-[8px] bg-[#FFFBF4] text-[#1E1B2E] hover:bg-[#eae0d2] border border-[#1E1B2E] shrink-0 ml-2 rtl:mr-2 rtl:ml-0"
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
      <div className="w-full max-w-sm mx-auto space-y-2 mt-3 shrink-0 font-ui">
        <button
          onClick={() => {
            sound.playClick();
            onPlayAgain();
          }}
          className="pixel-btn pixel-btn-teal w-full py-3 rounded-[16px] text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          <span>{isRTL ? 'تمرین مجدد با همین تنظیمات' : 'Play Again'}</span>
          <Flame size={16} color="#F2B63D" />
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="pixel-btn pixel-btn-mustard py-2.5 rounded-[14px] text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Trophy size={15} color="#1E1B2E]" />
            <span>{t.leaderboard}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="bg-[#FFFBF4] border-2 border-[#1E1B2E] text-[#1E1B2E] rounded-[14px] shadow-[2px_2px_0px_0px_#1E1B2E] hover:bg-[#F4EDE1] py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={15} className={isRTL ? 'rotate-180' : ''} />
            <span>{isRTL ? 'منوی اصلی' : 'Main Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SinglePlayerReportScreen;
