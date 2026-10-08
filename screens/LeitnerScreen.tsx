import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Flame, 
  Calendar, 
  Bell, 
  BellOff, 
  ArrowLeft, 
  Check, 
  X, 
  RotateCw, 
  Sparkles, 
  Trophy, 
  AlertTriangle, 
  HelpCircle, 
  Zap, 
  Plus, 
  Volume2, 
  Layers, 
  ShieldAlert 
} from 'lucide-react';
import { 
  getLeitnerState, 
  enrollCardsInLeitner, 
  getDueLeitnerCards, 
  recordLeitnerCardReview, 
  requestLeitnerNotificationPermission,
  LEITNER_INTERVALS,
  getTodayDateString 
} from '../leitnerBoxService';
import { LeitnerState, Language, CEFRLevel, LanguageCard } from '../types';
import { sound } from '../soundManager';
import { FlagIcon } from '../components/FlagIcon';
import ExitConfirmModal from '../components/ExitConfirmModal';
import { generateChallengingReflexOptions } from '../utils/testQuestionEngine';

interface Props {
  language: Language;
  onExit: () => void;
  isRTL?: boolean;
}

export const LeitnerScreen: React.FC<Props> = ({
  language,
  onExit,
  isRTL = true
}) => {
  const [leitnerState, setLeitnerState] = useState<LeitnerState>(getLeitnerState());
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewResult, setReviewResult] = useState<'success' | 'fail' | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<boolean>(leitnerState.notificationsEnabled);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Due Cards for Today
  const dueQuestions = useMemo(() => {
    return getDueLeitnerCards(leitnerState);
  }, [leitnerState]);

  const currentDueItem = dueQuestions[activeCardIndex] || null;

  // Generate 4 challenging reflex options for the active card
  const reflexChoices = useMemo(() => {
    if (!currentDueItem?.item?.card) return [];
    const pool = leitnerState.cards.map(c => c.card);
    return generateChallengingReflexOptions(currentDueItem.item.card, pool, leitnerState.targetLanguage);
  }, [currentDueItem?.item?.cardId, leitnerState.targetLanguage, leitnerState.cards]);

  // Compartment card counts
  const boxCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    leitnerState.cards.forEach(c => {
      const idx = Math.min(Math.max(0, c.boxIndex), 4);
      counts[idx] += 1;
    });
    return counts;
  }, [leitnerState.cards]);

  // Request Notifications
  const handleEnableNotifications = async () => {
    sound.playClick();
    const granted = await requestLeitnerNotificationPermission();
    setNotificationStatus(granted);
    setShowNotificationModal(false);
    if (granted) {
      sound.playSuccess();
    }
  };

  // Add more cards
  const handleEnrollMore = () => {
    sound.playClick();
    const updated = enrollCardsInLeitner(
      leitnerState.targetLanguage,
      leitnerState.nativeLanguage,
      leitnerState.cefrLevel,
      15
    );
    setLeitnerState({ ...updated });
    sound.playPowerUp();
  };

  // Process Card Answer
  const handleAnswer = (isCorrect: boolean, selectedText?: string) => {
    if (!currentDueItem || reviewResult !== null) return;

    if (selectedText) setSelectedAnswer(selectedText);

    if (isCorrect) {
      sound.playCorrect();
      setReviewResult('success');
    } else {
      sound.playBuzzer();
      setReviewResult('fail');
    }

    recordLeitnerCardReview(currentDueItem.item.cardId, isCorrect);

    // Refresh state after 1.1s
    setTimeout(() => {
      setLeitnerState(getLeitnerState());
      setIsFlipped(false);
      setReviewResult(null);
      setSelectedAnswer(null);
      if (activeCardIndex + 1 < dueQuestions.length) {
        setActiveCardIndex(prev => prev + 1);
      } else {
        setActiveCardIndex(0);
      }
    }, 1100);
  };

  return (
    <div 
      className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto min-h-screen px-3 sm:px-4 py-4 font-ui flex flex-col justify-between select-none relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-[var(--panel)] p-3 rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="w-8 h-8 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-colors"
            >
              <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--lapis)]/15 text-[var(--lapis)] flex items-center justify-center">
                <Box size={18} />
              </div>
              <div>
                <h1 className="text-sm font-black text-[var(--ink)] leading-none">
                  {isRTL ? 'جعبه لایتنر ۵ خانه' : '5-Box Leitner Spaced Repetition'}
                </h1>
                <span className="text-[10px] font-bold text-[var(--mute)]">
                  {isRTL ? 'مرور هوشمند و ملکه شدن در حافظه' : 'Smart spaced memory review'}
                </span>
              </div>
            </div>
          </div>

          {/* Streak Counter & Bell */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-600 text-xs font-black">
              <Flame size={14} className="animate-bounce" />
              <span>{leitnerState.consecutiveStreak} {isRTL ? 'روز متوالی' : 'days streak'}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowNotificationModal(true);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                notificationStatus
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600'
                  : 'bg-[var(--bg)] border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
              title={isRTL ? 'اعلان یادآوری روزانه' : 'Daily Reminder Notification'}
            >
              {notificationStatus ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
          </div>
        </div>

        {/* Missed Day Penalty Alert Banner */}
        {leitnerState.missedDayWarningShown && (
          <div className="p-3 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl flex items-start gap-2.5 text-xs text-rose-600 animate-fade-in">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black">
                {isRTL ? '⚠️ متأسفانه یک روز غیبت داشتید!' : '⚠️ You missed a day!'}
              </strong>
              <p className="mt-0.5 leading-relaxed text-[11px] text-rose-500/90">
                {isRTL 
                  ? 'طبق قانون جعبه لایتنر، برای جلوگیری از فراموشی، دوره جاری ریست شد و کارت‌ها به خانه ۱ بازگشتند تا از نو ملکه ذهن شوند.'
                  : 'According to Leitner rules, missed days reset the streak and cards drop back to Box 1 for complete mastery.'}
              </p>
            </div>
          </div>
        )}

        {/* 5-Boxes Visual Grid */}
        <div className="bg-[var(--panel)] p-3 rounded-2xl border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="flex items-center gap-1 text-[var(--ink)]">
              <Layers size={14} className="text-[var(--lapis)]" />
              <span>{isRTL ? 'وضعیت ۵ خانه لایتنر:' : 'Leitner Compartments:'}</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <Trophy size={13} />
              <span>{leitnerState.totalCardsMastered} {isRTL ? 'کارت مسلط‌شده' : 'Mastered'}</span>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center">
            {LEITNER_INTERVALS.map((interval, idx) => {
              const count = boxCounts[idx];
              const isMasterBox = idx === 4;
              return (
                <div 
                  key={`box-${idx}`}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between transition-all ${
                    isMasterBox 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-[var(--bg)] border-[var(--line)]'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[var(--mute)]">
                    {idx === 0 ? (isRTL ? '۱ روزه' : '1 Day') : `${interval} ${isRTL ? 'روزه' : 'd'}`}
                  </span>
                  <span className={`text-base font-black my-0.5 ${isMasterBox ? 'text-amber-500' : 'text-[var(--ink)]'}`}>
                    {count}
                  </span>
                  <span className="text-[9px] font-bold text-[var(--mute)]">
                    {isRTL ? `خانه ${idx + 1}` : `Box ${idx + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Review Session Area */}
      <div className="my-auto py-3 space-y-3">
        {currentDueItem ? (
          <div className="space-y-3">
            {/* Card Container */}
            <div 
              className={`bg-[var(--panel)] border-2 rounded-[28px] p-5 shadow-xl text-center space-y-3 relative transition-all duration-300 ${
                reviewResult === 'success' 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : reviewResult === 'fail' 
                    ? 'border-rose-500 bg-rose-500/5' 
                    : 'border-[var(--line)]'
              }`}
            >
              {/* Box Tag & Question Type */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-[var(--lapis)]/10 text-[var(--lapis)] border border-[var(--lapis)]/20 rounded-full text-[10px] font-black">
                  {isRTL ? `خانه ${currentDueItem.item.boxIndex + 1} از ۵` : `Box ${currentDueItem.item.boxIndex + 1} of 5`}
                </span>
                <span className="text-[11px] font-bold text-[var(--mute)]">
                  {isRTL ? `کارت ${activeCardIndex + 1} از ${dueQuestions.length}` : `Card ${activeCardIndex + 1} of ${dueQuestions.length}`}
                </span>
              </div>

              {/* Entertaining Alternative Question Prompt */}
              <div className="p-2.5 bg-[var(--bg)] rounded-xl border border-[var(--line)] text-xs font-black text-[var(--lapis)]">
                {currentDueItem.entertainingQuestion}
              </div>

              {/* Main Card Prompt */}
              <div className="py-3">
                <h2 className="text-xl sm:text-2xl font-black text-[var(--ink)] leading-snug">
                  {isFlipped 
                    ? currentDueItem.item.card.targetText 
                    : (currentDueItem.item.card.prompt || currentDueItem.item.card.translation)}
                </h2>
                {isFlipped && (
                  <p className="text-xs font-bold text-[var(--mute)] mt-1.5">
                    {currentDueItem.item.card.translation}
                  </p>
                )}
              </div>

              {/* Flip Card Action */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsFlipped(!isFlipped);
                }}
                className="py-1.5 px-4 bg-[var(--bg)] hover:bg-[var(--line)] rounded-full text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw size={13} />
                <span>{isFlipped ? (isRTL ? 'نمایش صورت سؤال' : 'Show Question') : (isRTL ? 'مشاهده ترجمه / پشت کارت' : 'Flip Card')}</span>
              </button>
            </div>

            {/* 4 Reflex Options or Self-Rating Buttons */}
            {reflexChoices.length >= 4 ? (
              <div className="grid grid-cols-2 gap-2">
                {reflexChoices.map((choice, cIdx) => {
                  const isCorrect = choice.trim().toLowerCase() === currentDueItem.item.card.targetText.trim().toLowerCase();
                  const isSelected = selectedAnswer === choice;
                  const showGreen = reviewResult && isCorrect;
                  const showRed = isSelected && !isCorrect;

                  return (
                    <button
                      key={`leitner-opt-${cIdx}`}
                      type="button"
                      disabled={reviewResult !== null}
                      onClick={() => handleAnswer(isCorrect, choice)}
                      className={`p-3 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer flex items-center justify-center text-center shadow-xs active:scale-95 min-h-[56px] ${
                        showGreen 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : showRed 
                            ? 'bg-rose-500 border-rose-500 text-white' 
                            : 'bg-[var(--panel)] hover:bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--lapis)]'
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Self-evaluation Buttons */
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAnswer(false)}
                  className="py-3 px-3 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/30 text-rose-600 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <X size={16} />
                  <span>{isRTL ? 'بلد نبودم (برگشت به خانه ۱)' : 'Forgot (Drop to Box 1)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswer(true)}
                  className="py-3 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Check size={16} />
                  <span>{isRTL ? 'بلد بودم (صعود به خانه بعد) 🚀' : 'Mastered (Next Box) 🚀'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* All Daily Cards Completed! */
          <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-[28px] p-6 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-inner">
              <Trophy size={34} className="animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[var(--ink)]">
                {isRTL ? 'آفرین! کارت‌های امروز لایتنر کامل شد! 🎉' : 'All Due Cards Reviewed for Today! 🎉'}
              </h3>
              <p className="text-xs text-[var(--mute)] mt-1.5 leading-relaxed">
                {isRTL 
                  ? 'فردا حتماً سر بزن تا دوره‌ات نسوزه و کارت‌های جدید آماده مرور بشن!'
                  : 'Visit again tomorrow to keep your streak alive and review next interval cards!'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleEnrollMore}
                className="w-full py-3 bg-[var(--lapis)] hover:bg-[#1a38a0] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Plus size={16} />
                <span>{isRTL ? 'افزودن ۱۵ کارت جدید به جعبه لایتنر' : 'Add 15 New Cards to Deck'}</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 border border-[var(--line)] text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] rounded-xl cursor-pointer"
              >
                {isRTL ? 'بازگشت به منوی اصلی' : 'Back to Menu'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Permission Request Modal */}
      {showNotificationModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-ui"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={() => setShowNotificationModal(false)}
        >
          <div 
            className="w-full max-w-xs bg-[var(--panel)] border-2 border-[var(--line)] rounded-[28px] p-5 shadow-2xl text-[var(--ink)] space-y-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto">
              <Bell size={28} className="animate-bounce" />
            </div>

            <div>
              <h3 className="text-base font-black text-[var(--ink)]">
                {isRTL ? 'یادآوری روزانه جعبه لایتنر 🔔' : 'Daily Leitner Reminder 🔔'}
              </h3>
              <p className="text-xs text-[var(--mute)] mt-1.5 leading-relaxed">
                {isRTL 
                  ? 'با فعال‌سازی اعلان، هر شب یک پیام کوتاه دریافت می‌کنی تا دوره لایتنرت نسوزه و کارت‌ها به خانه ۱ برنگردند!'
                  : 'Enable reminders to get a daily alert so you never miss a day and lose your Leitner streak!'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="py-2.5 rounded-xl border border-[var(--line)] text-xs font-bold hover:bg-[var(--bg)] cursor-pointer"
              >
                {isRTL ? 'فعلاً نه' : 'Not Now'}
              </button>
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                {isRTL ? 'فعال‌سازی اعلان' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <ExitConfirmModal
          isRTL={isRTL}
          onCancel={() => setShowExitModal(false)}
          onConfirm={() => {
            setShowExitModal(false);
            onExit();
          }}
        />
      )}
    </div>
  );
};

export default LeitnerScreen;
