import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Swords, 
  Zap, 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  Flame, 
  ShieldAlert, 
  Check, 
  X as XIcon, 
  Sparkles, 
  AlertTriangle, 
  Copy, 
  Share2, 
  Wifi, 
  Smartphone,
  Crown,
  Users
} from 'lucide-react';
import { OnlineDuelRoom, Language, LanguageCard } from '../types';
import { 
  subscribeToOnlineDuelRoom, 
  submitOnlineDuelAnswer, 
  triggerOnlineDuelSabotage, 
  rematchOnlineDuel 
} from '../onlineRoomService';
import { sound } from '../soundManager';
import { FlagIcon } from '../components/FlagIcon';
import { generateChallengingReflexOptions } from '../utils/testQuestionEngine';
import { recordMistake } from '../mistakeReviewService';

interface Props {
  initialRoom: OnlineDuelRoom;
  myRole: 'p1' | 'p2';
  uiLanguage: Language;
  onExit: () => void;
  isRTL?: boolean;
}

export const OnlineDuelScreen: React.FC<Props> = ({
  initialRoom,
  myRole,
  uiLanguage,
  onExit,
  isRTL = true
}) => {
  const [room, setRoom] = useState<OnlineDuelRoom>(initialRoom);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const cardStartTimeRef = useRef<number>(Date.now());

  // Subscribe to real-time updates for this duel room
  useEffect(() => {
    const unsub = subscribeToOnlineDuelRoom(
      room.roomId,
      (updated) => {
        if (!updated) {
          onExit();
          return;
        }

        // Detect card advancement to play transition sound and reset selection
        if (updated.cardIndex !== room.cardIndex) {
          cardStartTimeRef.current = Date.now();
          setSelectedAnswer(null);
          sound.playSwap();
        }

        // Detect round winner
        if (updated.roundWinner && updated.roundWinner !== room.roundWinner) {
          if (updated.roundWinner === myRole) {
            sound.playScoreTick();
          } else {
            sound.playBuzzer();
          }
        }

        // Detect match winner
        if (updated.matchWinner && !room.matchWinner) {
          if (updated.matchWinner === myRole) {
            sound.playVictory();
          } else {
            sound.playRoundEnd();
          }
        }

        // Detect sabotage against me
        if (updated.sabotageTarget === myRole && room.sabotageTarget !== myRole) {
          sound.playElimination();
        }

        setRoom(updated);
      },
      () => {}
    );

    return () => unsub();
  }, [room.roomId, room.cardIndex, room.roundWinner, room.matchWinner, room.sabotageTarget, myRole, onExit]);

  const myPlayer = myRole === 'p1' ? room.player1 : room.player2;
  const oppPlayer = myRole === 'p1' ? room.player2 : room.player1;
  const oppRole: 'p1' | 'p2' = myRole === 'p1' ? 'p2' : 'p1';

  const currentCard: LanguageCard | null = useMemo(() => {
    if (!room.cards || room.cards.length === 0) return null;
    return room.cards[room.cardIndex % room.cards.length] || null;
  }, [room.cards, room.cardIndex]);

  // Generate 4 pedagogically challenging parallel options
  const roundChoices = useMemo(() => {
    if (!currentCard || !room.cards) return [];
    return generateChallengingReflexOptions(currentCard, room.cards, room.targetLanguage);
  }, [currentCard?.id, room.cards, room.targetLanguage]);

  // Copy code or link
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopiedCode(true);
      sound.playClick();
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {}
  };

  const handleShareInvite = async () => {
    sound.playClick();
    const shareText = isRTL 
      ? `بیا تو دوئل زبان ۲ نفره با من بازی کن! کد اتاق من: ${room.roomCode}`
      : `Join my 1v1 Language Duel! Room Code: ${room.roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'دوئل آنلاین ۲ نفره',
          text: shareText,
          url: window.location.origin
        });
      } catch (e) {}
    } else {
      handleCopyCode();
    }
  };

  // Submit Answer
  const handleAnswerClick = async (choiceText: string) => {
    if (!currentCard || room.status !== 'playing' || room.roundWinner || room.matchWinner) return;
    if (myPlayer?.isLocked) return;

    const reactionMs = Math.max(120, Date.now() - cardStartTimeRef.current);
    const isCorrect = choiceText.trim().toLowerCase() === currentCard.targetText.trim().toLowerCase();

    setSelectedAnswer(choiceText);

    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playBuzzer();
      recordMistake(currentCard, choiceText, 'online_duel');
    }

    await submitOnlineDuelAnswer(room.roomId, myRole, isCorrect, reactionMs);
  };

  // Trigger Sabotage Shock
  const handleSabotage = async () => {
    if (!myPlayer || myPlayer.sabotageUsed || !room.sabotageEnabled) return;
    sound.playClick();
    await triggerOnlineDuelSabotage(room.roomId, myRole);
  };

  // Rematch
  const handleRematch = async () => {
    sound.playStartGame();
    await rematchOnlineDuel(room.roomId);
  };

  const isDizzy = room.sabotageTarget === myRole;

  // ==========================================
  // VIEW 1: WAITING FOR PLAYER 2 (ON GUEST PHONE)
  // ==========================================
  if (room.status === 'waiting') {
    return (
      <div 
        className="w-full max-w-md mx-auto min-h-screen px-4 py-6 font-ui flex flex-col justify-between"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="w-10 h-10 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center hover:bg-[var(--bg)] cursor-pointer"
          >
            <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black text-amber-500 uppercase tracking-wider">
              {isRTL ? 'اتاق آنلاین آماده' : 'Online Room Ready'}
            </span>
          </div>
          <div className="w-10" />
        </div>

        {/* Center Card: Big Room Code */}
        <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-[28px] p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
          {/* Glowing background halo */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[var(--lapis)]/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#E0533C]/20 rounded-full blur-2xl" />

          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#2347C5] to-[#E0533C] text-white flex items-center justify-center shadow-lg animate-bounce">
            <Wifi size={32} />
          </div>

          <div>
            <h2 className="text-xl font-black text-[var(--ink)]">
              {isRTL ? 'دوئل دو گوشی (زنده)' : 'Live 2-Phones Duel'}
            </h2>
            <p className="text-xs text-[var(--mute)] mt-1">
              {isRTL 
                ? 'کد زیر را به دوستت بده تا در گوشی خودش وارد مسابقه شود:'
                : 'Share this code with your friend to play on their phone:'}
            </p>
          </div>

          {/* Huge Room Code Display */}
          <div 
            onClick={handleCopyCode}
            className="p-4 bg-[var(--bg)] border-2 border-dashed border-[var(--lapis)] rounded-2xl cursor-pointer hover:border-[var(--turq)] transition-colors group relative"
          >
            <div className="text-3xl sm:text-4xl font-black tracking-widest text-[var(--lapis)] select-all font-mono">
              {room.roomCode}
            </div>
            <span className="text-[11px] font-bold text-[var(--mute)] group-hover:text-[var(--ink)] flex items-center justify-center gap-1 mt-1.5">
              {copiedCode ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedCode ? (isRTL ? 'کد کپی شد! ✅' : 'Copied! ✅') : (isRTL ? 'لمس برای کپی کردن کد' : 'Tap to copy code')}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCopyCode}
              className="py-3 px-3 bg-[var(--bg)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy size={15} />
              <span>{copiedCode ? (isRTL ? 'کپی شد' : 'Copied') : (isRTL ? 'کپی کد' : 'Copy Code')}</span>
            </button>
            <button
              type="button"
              onClick={handleShareInvite}
              className="py-3 px-3 bg-[var(--lapis)] hover:bg-[#1a38a0] text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Share2 size={15} />
              <span>{isRTL ? 'اشتراک‌گذاری' : 'Share Invite'}</span>
            </button>
          </div>

          {/* Pulsing Status */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-[var(--mute)]">
            <Smartphone size={16} className="animate-pulse text-[var(--lapis)]" />
            <span>{isRTL ? 'در انتظار ورود گوشی حریف...' : 'Waiting for opponent phone...'}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold text-[var(--mute)]">
            {isRTL 
              ? 'هر دو بازیکن باید به اینترنت متصل باشند.'
              : 'Both devices must have an active internet connection.'}
          </p>
        </div>

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
  }

  // ==========================================
  // VIEW 2: ACTIVE GAMEPLAY / MATCH FINISHED
  // ==========================================
  const winningScore = room.winningScore || 5;
  const p1Score = room.player1.score;
  const p2Score = room.player2?.score || 0;
  const totalScore = p1Score + p2Score;
  const p1Progress = totalScore > 0 ? (p1Score / (winningScore * 1.5)) * 100 : 50;

  return (
    <div 
      className={`w-full max-w-md mx-auto min-h-screen px-3 py-3 font-ui flex flex-col justify-between relative transition-all duration-300 ${
        isDizzy ? 'blur-[2px] filter contrast-125' : ''
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Dizzy Shock Overlay if Sabotaged */}
      {isDizzy && (
        <div className="fixed inset-0 z-40 bg-purple-900/30 backdrop-blur-xs flex items-center justify-center pointer-events-none animate-pulse">
          <div className="p-4 bg-purple-600 text-white rounded-2xl font-black text-sm shadow-2xl flex items-center gap-2">
            <Zap size={22} className="animate-spin" />
            <span>{isRTL ? '⚡ شوک گیج‌کننده حریف!' : '⚡ Opponent Sabotage Shock!'}</span>
          </div>
        </div>
      )}

      {/* Top Bar: Opponent Info & Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-[var(--panel)] p-2.5 rounded-2xl border border-[var(--line)] shadow-xs">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="w-8 h-8 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
            title={isRTL ? 'خروج از دوئل' : 'Exit Duel'}
          >
            <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          </button>

          {/* Room Code Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg)] rounded-lg border border-[var(--line)]">
            <Wifi size={12} className="text-emerald-500" />
            <span className="text-[11px] font-mono font-black text-[var(--ink)]">{room.roomCode}</span>
          </div>

          {/* Sabotage Power */}
          {room.sabotageEnabled && (
            <button
              type="button"
              disabled={myPlayer?.sabotageUsed || room.matchWinner !== null}
              onClick={handleSabotage}
              className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                myPlayer?.sabotageUsed
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 opacity-50'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs active:scale-95 animate-pulse'
              }`}
            >
              <Zap size={13} />
              <span>{myPlayer?.sabotageUsed ? (isRTL ? 'استفاده شد' : 'Used') : (isRTL ? '⚡ شوک' : '⚡ Shock')}</span>
            </button>
          )}
        </div>

        {/* Players Status & Tug-of-war Bar */}
        <div className="bg-[var(--panel)] p-3 rounded-2xl border border-[var(--line)] space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            {/* Player 1 (Blue) */}
            <div className={`flex items-center gap-2 ${myRole === 'p1' ? 'text-[#2347C5]' : 'text-[var(--mute)]'}`}>
              <span className="text-xl">{room.player1.avatar}</span>
              <div>
                <div className="flex items-center gap-1">
                  <span>{room.player1.name}</span>
                  {myRole === 'p1' && <span className="text-[9px] bg-[#2347C5]/15 text-[#2347C5] px-1 rounded-sm">{isRTL ? 'شما' : 'You'}</span>}
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-base font-black text-[#2347C5]">{room.player1.score}</span>
                  {room.player1.streak >= 2 && (
                    <span className="flex items-center text-amber-500 font-bold">
                      <Flame size={12} className="animate-bounce" /> {room.player1.streak}x
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Target Score */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-[var(--mute)] uppercase tracking-wider">{isRTL ? 'هدف برد' : 'Target'}</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-600 border border-amber-400/30">
                {winningScore}
              </span>
            </div>

            {/* Player 2 (Red) */}
            <div className={`flex items-center gap-2 ${myRole === 'p2' ? 'text-[#E0533C]' : 'text-[var(--mute)]'}`}>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {myRole === 'p2' && <span className="text-[9px] bg-[#E0533C]/15 text-[#E0533C] px-1 rounded-sm">{isRTL ? 'شما' : 'You'}</span>}
                  <span>{room.player2?.name || 'Player 2'}</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-[11px]">
                  {room.player2 && room.player2.streak >= 2 && (
                    <span className="flex items-center text-amber-500 font-bold">
                      <Flame size={12} className="animate-bounce" /> {room.player2.streak}x
                    </span>
                  )}
                  <span className="text-base font-black text-[#E0533C]">{room.player2?.score || 0}</span>
                </div>
              </div>
              <span className="text-xl">{room.player2?.avatar || '🦁'}</span>
            </div>
          </div>

          {/* Tug-of-war Bar */}
          <div className="h-2.5 w-full bg-[var(--bg)] rounded-full overflow-hidden flex border border-[var(--line)]">
            <div 
              className="bg-[#2347C5] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, (room.player1.score / winningScore) * 50))}%` }}
            />
            <div className="flex-1 bg-[var(--bg)]" />
            <div 
              className="bg-[#E0533C] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, ((room.player2?.score || 0) / winningScore) * 50))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reaction Difference Notification */}
      {room.roundWinner && (
        <div className={`p-2.5 rounded-xl text-center text-xs font-black animate-fade-in shadow-md ${
          room.roundWinner === myRole
            ? 'bg-emerald-500 text-white'
            : 'bg-rose-500 text-white'
        }`}>
          {room.roundWinner === myRole ? (
            <span>
              {isRTL 
                ? `⚡ آفرین! امتیاز این دور برای شما شد (${room.reactionDiffMs || 250}ms)!`
                : `⚡ Point won! Reflex: ${room.reactionDiffMs || 250}ms!`}
            </span>
          ) : (
            <span>
              {isRTL 
                ? 'حریف سریع‌تر جواب داد! دور بعدی آماده باش!' 
                : 'Opponent was faster this round! Get ready!'}
            </span>
          )}
        </div>
      )}

      {/* Center Prompt Card */}
      {currentCard && (
        <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-[26px] p-5 shadow-xl text-center space-y-3 relative overflow-hidden">
          {/* CEFR Level Tag & Flag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FlagIcon language={room.targetLanguage} size={18} />
              <span className="text-[10px] font-black uppercase text-[var(--mute)]">
                {currentCard.topic.replace('CAT_', '')}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--turq)]/15 text-[var(--turq)] border border-[var(--turq)]/30">
              {currentCard.cefrLevel}
            </span>
          </div>

          {/* Main Target prompt */}
          <div className="py-2">
            <span className="text-[11px] font-bold text-[var(--mute)] block mb-1">
              {isRTL ? 'معادل یا ترجمه صحیح را انتخاب کن:' : 'Select the correct translation/match:'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--ink)] leading-snug">
              {currentCard.prompt || currentCard.translation}
            </h3>
          </div>

          {/* Locked out indicator if I made a mistake */}
          {myPlayer?.isLocked && (
            <div className="p-2 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-500 text-xs font-black animate-pulse flex items-center justify-center gap-1.5">
              <ShieldAlert size={15} />
              <span>{isRTL ? '❌ اشتباه زدی! قفل موقت (۱.۴ ثانیه)' : '❌ Wrong! Temporary lockout (1.4s)'}</span>
            </div>
          )}
        </div>
      )}

      {/* 4 Reflex Options */}
      <div className="grid grid-cols-2 gap-2.5 pb-2">
        {roundChoices.map((choice, idx) => {
          const isCorrectAnswer = currentCard && choice.trim().toLowerCase() === currentCard.targetText.trim().toLowerCase();
          const isMySelection = selectedAnswer === choice;
          const showSuccess = room.roundWinner && isCorrectAnswer;
          const showFailure = isMySelection && !isCorrectAnswer;

          return (
            <button
              key={`opt-${idx}-${choice}`}
              type="button"
              disabled={myPlayer?.isLocked || room.status !== 'playing' || room.roundWinner !== null}
              onClick={() => handleAnswerClick(choice)}
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center text-center shadow-md active:scale-95 disabled:opacity-50 select-none min-h-[64px] ${
                showSuccess
                  ? 'bg-emerald-500 text-white scale-102 ring-4 ring-emerald-300'
                  : showFailure
                    ? 'bg-rose-500 text-white scale-98'
                    : 'bg-[var(--panel)] hover:bg-[var(--bg)] border-2 border-[var(--line)] text-[var(--ink)] hover:border-[var(--lapis)]'
              }`}
            >
              <span>{choice}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* MATCH WINNER MODAL */}
      {/* ========================================== */}
      {room.matchWinner && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in font-ui"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="w-full max-w-sm bg-[var(--panel)] border-2 border-amber-400/50 rounded-[28px] p-6 text-center space-y-4 shadow-2xl text-[var(--ink)]">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg">
              <Trophy size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[var(--ink)]">
                {room.matchWinner === myRole
                  ? (isRTL ? '🏆 پیروزی باشکوه! شما بردید!' : '🏆 VICTORY! You Won!')
                  : (isRTL ? 'حریف برنده این مسابقه شد!' : 'Opponent Won the Match!')}
              </h2>
              <p className="text-xs text-[var(--mute)] mt-1">
                {isRTL 
                  ? `نتیجه نهایی: ${room.player1.score} در برابر ${room.player2?.score || 0}`
                  : `Final Score: ${room.player1.score} - ${room.player2?.score || 0}`}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRematch}
                className="w-full py-3 bg-gradient-to-r from-[#2347C5] to-[#E0533C] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
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

// Reusable Exit Modal
interface ExitModalProps {
  isRTL: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ExitConfirmModal: React.FC<ExitModalProps> = ({
  isRTL,
  onCancel,
  onConfirm
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-xs bg-[var(--panel)] border-2 border-rose-500/40 rounded-[24px] p-5 shadow-2xl text-[var(--ink)] space-y-4 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
          <AlertTriangle size={26} />
        </div>

        <div>
          <h3 className="text-base font-black text-[var(--ink)]">
            {isRTL ? 'مطمئنی می‌خوای خارج بشی؟' : 'Are you sure you want to quit?'}
          </h3>
          <p className="text-xs text-[var(--mute)] mt-1.5 leading-relaxed">
            {isRTL 
              ? 'اگر الان خارج بشی، بازی متوقف خواهد شد و امتیازات ثبت نمی‌شوند.' 
              : 'If you quit now, the match will end and progress will be lost.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="py-2.5 rounded-xl border border-[var(--line)] text-xs font-bold hover:bg-[var(--bg)] cursor-pointer"
          >
            {isRTL ? 'ادامه بازی' : 'Keep Playing'}
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playElimination();
              onConfirm();
            }}
            className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-md cursor-pointer"
          >
            {isRTL ? 'بله، خروج' : 'Yes, Quit'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default OnlineDuelScreen;
