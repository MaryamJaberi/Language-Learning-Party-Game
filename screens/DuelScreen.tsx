import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Swords, 
  RotateCw, 
  Zap, 
  Trophy, 
  Volume2, 
  RotateCcw, 
  ArrowLeft, 
  Flame, 
  ShieldAlert, 
  Check, 
  X as XIcon,
  Sparkles
} from 'lucide-react';
import { LanguageCard, Language } from '../types';
import { DuelSettings } from '../components/DuelSetupModal';
import { sound } from '../soundManager';
import { feedbackDirector } from '../feedbackDirector';
import { FlagIcon } from '../components/FlagIcon';

interface Props {
  settings: DuelSettings;
  cards: LanguageCard[];
  uiLanguage: Language;
  onExit: () => void;
  isRTL?: boolean;
}

export const DuelScreen: React.FC<Props> = ({
  settings,
  cards,
  uiLanguage,
  onExit,
  isRTL = true
}) => {
  // Match Scores
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [p1Streak, setP1Streak] = useState<number>(0);
  const [p2Streak, setP2Streak] = useState<number>(0);

  // Sabotage abilities
  const [p1SabotageUsed, setP1SabotageUsed] = useState<boolean>(false);
  const [p2SabotageUsed, setP2SabotageUsed] = useState<boolean>(false);
  const [p1Dizzy, setP1Dizzy] = useState<boolean>(false);
  const [p2Dizzy, setP2Dizzy] = useState<boolean>(false);

  // Round State
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<'p1' | 'p2' | null>(null);
  const [reactionDiffMs, setReactionDiffMs] = useState<number | null>(null);
  const [isLockedP1, setIsLockedP1] = useState<boolean>(false);
  const [isLockedP2, setIsLockedP2] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<'p1' | 'p2' | null>(null);
  const [isRoundResolving, setIsRoundResolving] = useState<boolean>(false);

  // Orientation toggle (face-to-face 180° vs side-by-side 0°)
  const [isFaceToFace, setIsFaceToFace] = useState<boolean>(settings.faceToFaceRotation);

  // Timing
  const cardStartTimeRef = useRef<number>(Date.now());
  const roundTimerRef = useRef<number | null>(null);

  const currentCard = useMemo(() => {
    if (!cards || cards.length === 0) return null;
    return cards[cardIndex % cards.length];
  }, [cards, cardIndex]);

  // Generate 4 randomized reflex options for current card
  const roundChoices = useMemo(() => {
    if (!currentCard || cards.length === 0) return [];
    const correct = currentCard.targetText;
    const others = cards.filter(c => c.id !== currentCard.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const distractors = new Set<string>();

    for (const c of shuffledOthers) {
      if (c.targetText && c.targetText !== correct && !distractors.has(c.targetText)) {
        distractors.add(c.targetText);
        if (distractors.size === 3) break;
      }
    }

    const all = [correct, ...Array.from(distractors)];
    return all.sort(() => Math.random() - 0.5);
  }, [currentCard?.id, cards]);

  // Reset round on card change
  useEffect(() => {
    cardStartTimeRef.current = Date.now();
    setRoundWinner(null);
    setReactionDiffMs(null);
    setIsLockedP1(false);
    setIsLockedP2(false);
    setIsRoundResolving(false);
  }, [cardIndex]);

  // Handle player answer attempt
  const handlePlayerAnswer = (player: 'p1' | 'p2', selectedText: string) => {
    if (isRoundResolving || matchWinner || !currentCard) return;

    if (player === 'p1' && isLockedP1) return;
    if (player === 'p2' && isLockedP2) return;

    const isCorrect = selectedText.trim().toLowerCase() === currentCard.targetText.trim().toLowerCase();
    const elapsedMs = Date.now() - cardStartTimeRef.current;

    if (isCorrect) {
      // WINNER of this round!
      setIsRoundResolving(true);
      setRoundWinner(player);
      setReactionDiffMs(elapsedMs);
      sound.playCorrect();

      if (player === 'p1') {
        const streak = p1Streak + 1;
        setP1Streak(streak);
        setP2Streak(0);
        const added = streak >= 2 ? 2 : 1;
        const newScore = p1Score + added;
        setP1Score(newScore);

        feedbackDirector.triggerScoreGained({
          points: added * 10,
          combo: streak,
          label: `${settings.player1Name} ⚡`
        });

        if (newScore >= settings.winningScore) {
          setMatchWinner('p1');
          sound.playVictory();
          return;
        }
      } else {
        const streak = p2Streak + 1;
        setP2Streak(streak);
        setP1Streak(0);
        const added = streak >= 2 ? 2 : 1;
        const newScore = p2Score + added;
        setP2Score(newScore);

        feedbackDirector.triggerScoreGained({
          points: added * 10,
          combo: streak,
          label: `${settings.player2Name} ⚡`
        });

        if (newScore >= settings.winningScore) {
          setMatchWinner('p2');
          sound.playVictory();
          return;
        }
      }

      // Next card after 1.2s celebration
      roundTimerRef.current = window.setTimeout(() => {
        setCardIndex(prev => prev + 1);
      }, 1300);

    } else {
      // WRONG: Lockout penalty for this player!
      sound.playElimination();
      if (player === 'p1') {
        setIsLockedP1(true);
        setTimeout(() => setIsLockedP1(false), 1400);
      } else {
        setIsLockedP2(true);
        setTimeout(() => setIsLockedP2(false), 1400);
      }
    }
  };

  // Sabotage shock trigger
  const handleTriggerSabotage = (byPlayer: 'p1' | 'p2') => {
    if (!settings.sabotageEnabled || isRoundResolving || matchWinner) return;
    sound.playPowerUp();

    if (byPlayer === 'p1' && !p1SabotageUsed) {
      setP1SabotageUsed(true);
      setP2Dizzy(true);
      setTimeout(() => setP2Dizzy(false), 1200);
    } else if (byPlayer === 'p2' && !p2SabotageUsed) {
      setP2SabotageUsed(true);
      setP1Dizzy(true);
      setTimeout(() => setP1Dizzy(false), 1200);
    }
  };

  // Rematch
  const handleRematch = () => {
    sound.playStartGame();
    setP1Score(0);
    setP2Score(0);
    setP1Streak(0);
    setP2Streak(0);
    setP1SabotageUsed(false);
    setP2SabotageUsed(false);
    setMatchWinner(null);
    setCardIndex(prev => prev + 1);
  };

  // Calculate Tug-of-War percentage (50% is center)
  const scoreDiff = p1Score - p2Score;
  const maxScore = settings.winningScore;
  const tugOfWarPercent = Math.max(10, Math.min(90, 50 + (scoreDiff / maxScore) * 40));

  if (!currentCard) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 text-center">
        <p className="font-bold text-sm text-[var(--mute)]">
          {isRTL ? 'کارت‌های کافی برای این زبان یافت نشد.' : 'No cards found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden bg-[var(--bg)] text-[var(--ink)] font-ui select-none relative">
      
      {/* ======================================================== */}
      {/* 1. TOP ZONE: PLAYER 2 (Red) */}
      {/* ======================================================== */}
      <div 
        className={`w-full p-2.5 sm:p-3 flex flex-col justify-between transition-transform duration-300 ${
          isFaceToFace ? 'rotate-180' : ''
        } ${isLockedP2 ? 'bg-red-500/10' : ''} ${p2Dizzy ? 'animate-wiggle blur-[1px]' : ''}`}
        style={{ height: '43%' }}
      >
        {/* P2 Header & Score Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{settings.player2Avatar}</span>
            <div>
              <span className="text-xs sm:text-sm font-black text-[#E0533C] flex items-center gap-1">
                {settings.player2Name}
                {p2Streak >= 2 && (
                  <span className="text-[10px] font-black text-amber-500 bg-amber-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                    <Flame size={12} /> {p2Streak}x
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[var(--mute)] font-bold">
                {isRTL ? `امتیاز: ${p2Score} از ${settings.winningScore}` : `Score: ${p2Score} / ${settings.winningScore}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* P2 Sabotage Shock button */}
            {settings.sabotageEnabled && !p2SabotageUsed && (
              <button
                type="button"
                onClick={() => handleTriggerSabotage('p2')}
                className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-950/40 text-[#E0533C] border border-[#E0533C]/30 text-[10px] font-black flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                title={isRTL ? 'شوک سرعت حریف' : 'Sabotage Opponent'}
              >
                <Zap size={12} fill="currentColor" />
                <span>{isRTL ? 'شوک ⚡' : 'Shock'}</span>
              </button>
            )}

            {/* P2 Lockout Indicator */}
            {isLockedP2 && (
              <span className="text-[11px] font-black text-rose-500 bg-rose-500/15 px-2 py-0.5 rounded-full animate-bounce">
                ❄️ {isRTL ? 'قفل اشتباه!' : 'Locked!'}
              </span>
            )}
          </div>
        </div>

        {/* P2 4 Reflex Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {roundChoices.map((choice, idx) => {
            const isWinnerChoice = roundWinner === 'p2' && choice.trim().toLowerCase() === currentCard.targetText.trim().toLowerCase();
            return (
              <button
                key={`p2-choice-${idx}-${choice}`}
                type="button"
                disabled={isLockedP2 || isRoundResolving}
                onClick={() => handlePlayerAnswer('p2', choice)}
                className={`py-3 sm:py-3.5 px-2.5 rounded-2xl border text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer shadow-sm text-center truncate ${
                  isWinnerChoice
                    ? '!bg-emerald-500 !text-white !border-emerald-600 scale-102 ring-4 ring-emerald-500/30'
                    : 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:border-[#E0533C]'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MIDDLE ARENA: Target Card, Tug-of-War Bar & Controls */}
      {/* ======================================================== */}
      <div className="w-full bg-[var(--panel)] border-y-2 border-[var(--line)] p-2 sm:p-2.5 flex flex-col justify-between shadow-md relative z-10" style={{ height: '14%' }}>
        
        {/* Dynamic Tug-of-War Gauge */}
        <div className="w-full h-2 rounded-full bg-[var(--line)] overflow-hidden relative mb-1">
          <div 
            className="absolute top-0 bottom-0 bg-gradient-to-r from-[#2347C5] via-[var(--teal)] to-[#E0533C] transition-all duration-500 rounded-full"
            style={{ 
              left: 0,
              width: `${tugOfWarPercent}%`
            }}
          />
          {/* Tug-of-War Marker */}
          <div 
            className="absolute top-0 bottom-0 w-2.5 bg-white border border-black/30 rounded-full shadow-md -translate-x-1/2 transition-all duration-500"
            style={{ left: `${tugOfWarPercent}%` }}
          />
        </div>

        {/* Middle Information Plate */}
        <div className="flex items-center justify-between px-1">
          {/* Left Action / Flip Orientation */}
          <button
            type="button"
            onClick={() => { sound.playClick(); setIsFaceToFace(!isFaceToFace); }}
            className="w-7 h-7 rounded-lg bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
            title={isRTL ? 'چرخش صفحه (رو در رو یا کنار هم)' : 'Flip Screen Orientation'}
          >
            <RotateCw size={14} className={isFaceToFace ? 'rotate-180' : ''} />
          </button>

          {/* Central Prompt Word */}
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-black text-[var(--mute)] uppercase tracking-wider">
                {currentCard.topic.replace('CAT_', '')}
              </span>
              <span className="text-[9px] font-black bg-[var(--turq)]/15 text-[var(--turq)] px-1.5 py-0.2 rounded-md">
                {currentCard.cefrLevel}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[var(--ink)] leading-tight tracking-tight">
              {currentCard.translation}
            </h2>
          </div>

          {/* Right Action: Sound & Exit */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                sound.speakNative(currentCard.targetText, currentCard.targetLanguage);
              }}
              className="w-7 h-7 rounded-lg bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--teal)] flex items-center justify-center transition-colors cursor-pointer"
              title={isRTL ? 'پخش تلفظ صوتی' : 'Play audio'}
            >
              <Volume2 size={14} />
            </button>
            <button
              type="button"
              onClick={onExit}
              className="w-7 h-7 rounded-lg bg-[var(--bg)] hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
              title={isRTL ? 'خروج' : 'Exit'}
            >
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>

        {/* Reaction Diff Notification Banner */}
        {roundWinner && reactionDiffMs && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white text-xs font-black animate-fade-in z-20">
            <span>
              {roundWinner === 'p1' ? settings.player1Name : settings.player2Name} ⚡{' '}
              {isRTL 
                ? `در ${(reactionDiffMs / 1000).toFixed(2)} ثانیه زودتر پاسخ داد!`
                : `was faster in ${(reactionDiffMs / 1000).toFixed(2)}s!`}
            </span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. BOTTOM ZONE: PLAYER 1 (Blue) */}
      {/* ======================================================== */}
      <div 
        className={`w-full p-2.5 sm:p-3 flex flex-col justify-between transition-transform duration-300 ${
          isLockedP1 ? 'bg-blue-500/10' : ''
        } ${p1Dizzy ? 'animate-wiggle blur-[1px]' : ''}`}
        style={{ height: '43%' }}
      >
        {/* P1 4 Reflex Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-auto">
          {roundChoices.map((choice, idx) => {
            const isWinnerChoice = roundWinner === 'p1' && choice.trim().toLowerCase() === currentCard.targetText.trim().toLowerCase();
            return (
              <button
                key={`p1-choice-${idx}-${choice}`}
                type="button"
                disabled={isLockedP1 || isRoundResolving}
                onClick={() => handlePlayerAnswer('p1', choice)}
                className={`py-3 sm:py-3.5 px-2.5 rounded-2xl border text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer shadow-sm text-center truncate ${
                  isWinnerChoice
                    ? '!bg-emerald-500 !text-white !border-emerald-600 scale-102 ring-4 ring-emerald-500/30'
                    : 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:border-[#2347C5]'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {/* P1 Header & Score Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{settings.player1Avatar}</span>
            <div>
              <span className="text-xs sm:text-sm font-black text-[#2347C5] flex items-center gap-1">
                {settings.player1Name}
                {p1Streak >= 2 && (
                  <span className="text-[10px] font-black text-amber-500 bg-amber-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                    <Flame size={12} /> {p1Streak}x
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[var(--mute)] font-bold">
                {isRTL ? `امتیاز: ${p1Score} از ${settings.winningScore}` : `Score: ${p1Score} / ${settings.winningScore}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* P1 Sabotage Shock button */}
            {settings.sabotageEnabled && !p1SabotageUsed && (
              <button
                type="button"
                onClick={() => handleTriggerSabotage('p1')}
                className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-[#2347C5] border border-[#2347C5]/30 text-[10px] font-black flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                title={isRTL ? 'شوک سرعت حریف' : 'Sabotage Opponent'}
              >
                <Zap size={12} fill="currentColor" />
                <span>{isRTL ? 'شوک ⚡' : 'Shock'}</span>
              </button>
            )}

            {/* P1 Lockout Indicator */}
            {isLockedP1 && (
              <span className="text-[11px] font-black text-rose-500 bg-rose-500/15 px-2 py-0.5 rounded-full animate-bounce">
                ❄️ {isRTL ? 'قفل اشتباه!' : 'Locked!'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MATCH WINNER VICTORY PODIUM MODAL */}
      {/* ======================================================== */}
      {matchWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[var(--panel)] border-2 border-[var(--line)] rounded-[28px] p-6 text-center text-[var(--ink)] space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-[var(--saffron)] text-[#15204A] flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Trophy size={36} />
            </div>

            <div>
              <span className="text-xs font-black text-[var(--mute)] uppercase tracking-wider block mb-1">
                {isRTL ? 'پیروزی در دوئل سرعتی!' : 'DUEL CHAMPION!'}
              </span>
              <h2 className="text-2xl font-black">
                {matchWinner === 'p1' ? settings.player1Name : settings.player2Name}
              </h2>
              <p className="text-3xl mt-1">
                {matchWinner === 'p1' ? settings.player1Avatar : settings.player2Avatar} 👑
              </p>
            </div>

            {/* Match Final Scores */}
            <div className="grid grid-cols-2 gap-3 py-2 bg-[var(--bg)] p-3 rounded-2xl border border-[var(--line)]">
              <div className="text-center">
                <span className="text-[11px] font-bold text-[#2347C5] block">{settings.player1Name}</span>
                <span className="text-xl font-black">{p1Score} PTS</span>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-bold text-[#E0533C] block">{settings.player2Name}</span>
                <span className="text-xl font-black">{p2Score} PTS</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRematch}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2347C5] to-[#E0533C] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>{isRTL ? 'انتقام / بازی دوباره 🔁' : 'Rematch 🔁'}</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
              >
                {isRTL ? 'بازگشت به منوی اصلی' : 'Back to Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuelScreen;
