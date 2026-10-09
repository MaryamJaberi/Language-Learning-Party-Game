import React, { useState, useEffect, useRef } from 'react';
import { OnlineRoomState, OnlinePlayer, Language, TeamColor, LanguageCard, PlayedCardRecord } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { isRtlLang, tUI, tf } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { 
  subscribeToRoom, 
  recordOnlineCardAction, 
  advanceOnlineTurn, 
  sendReactionToRoom, 
  syncRoomTimer,
  getDeviceId 
} from '../onlineRoomService';
import ShareScorecardModal from '../components/ShareScorecardModal';
import { FlagIcon } from '../components/FlagIcon';
import ExitConfirmModal from '../components/ExitConfirmModal';
import { 
  Check, 
  X, 
  RotateCw, 
  Flame, 
  Volume2, 
  Sparkles, 
  Headphones, 
  ExternalLink, 
  Clock, 
  EyeOff, 
  Eye, 
  Trophy, 
  Share2, 
  ArrowLeft,
  Crown
} from 'lucide-react';

interface Props {
  initialRoom: OnlineRoomState;
  myPlayerId: number;
  language: Language;
  onExit: () => void;
}

export const OnlineGameplayScreen: React.FC<Props> = ({
  initialRoom,
  myPlayerId,
  language,
  onExit
}) => {
  const t = tUI(language);
  const isRTL = isRtlLang(language);
  const myDeviceId = getDeviceId();

  const [room, setRoom] = useState<OnlineRoomState>(initialRoom);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; emoji: string; sender: string }>>([]);

  const isHost = room.hostId === myDeviceId;
  const activePlayer = room.players[room.activePlayerIndex] || room.players[0];
  const isMyTurnToGuess = activePlayer?.deviceId === myDeviceId;

  // Active Team & Color
  const activeTeam = room.teams.find(tm => tm.id === activePlayer?.teamId) || room.teams[0];
  const teamConfig = COLORS_MAP[activeTeam?.color || TeamColor.Blue] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };

  // Listen for real-time room updates
  useEffect(() => {
    const unsubscribe = subscribeToRoom(room.id, (updatedRoom) => {
      if (!updatedRoom) return;

      // Check for new incoming reactions
      if (updatedRoom.reactions && updatedRoom.reactions.length > 0) {
        const latest = updatedRoom.reactions[updatedRoom.reactions.length - 1];
        if (Date.now() - latest.timestamp < 3000) {
          setFloatingEmojis(prev => [...prev.slice(-6), latest]);
          setTimeout(() => {
            setFloatingEmojis(prev => prev.filter(e => e.id !== latest.id));
          }, 2000);
        }
      }

      setRoom(updatedRoom);
    });

    return () => unsubscribe();
  }, [room.id]);

  // Host runs authoritative timer loop and syncs to Firestore every second
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isHost || room.status !== 'playing' || !room.isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setRoom(prev => {
        const newTimer = Math.max(0, prev.roundTimer - 1000);

        // Deduct from active team time remaining
        const updatedTeams = prev.teams.map(t => {
          if (t.id === activePlayer.teamId) {
            return { ...t, timeRemaining: Math.max(0, t.timeRemaining - 1000) };
          }
          return t;
        });

        // If time's up for turn
        if (newTimer <= 0) {
          const nextIdx = (prev.activePlayerIndex + 1) % prev.players.length;
          const nextRound = nextIdx === 0 ? prev.currentRound + 1 : prev.currentRound;
          const isGameOver = nextRound > (prev.settings.roundsCount || 3);
          advanceOnlineTurn(prev.id, nextIdx, nextRound, isGameOver);
        } else if (newTimer % 3000 === 0) {
          // Sync timer heartbeat every 3s
          syncRoomTimer(prev.id, newTimer, updatedTeams);
        }

        return {
          ...prev,
          roundTimer: newTimer,
          teams: updatedTeams
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHost, room.status, room.isTimerRunning, activePlayer?.teamId, room.players.length, room.settings.roundsCount]);

  // Handle Correct Answer
  const handleCorrect = async () => {
    if (!room.currentCard) return;
    sound.playCorrect();
    await recordOnlineCardAction(
      room.id,
      true,
      room.currentCard,
      activePlayer.name,
      activeTeam.color,
      5
    );
  };

  // Handle Pass / Skip
  const handlePass = async () => {
    if (!room.currentCard) return;
    sound.playPass();
    await recordOnlineCardAction(
      room.id,
      false,
      room.currentCard,
      activePlayer.name,
      activeTeam.color,
      5
    );
  };

  // Send Reaction
  const handleSendReaction = (emoji: string) => {
    sound.playClick();
    const myPlayer = room.players.find(p => p.id === myPlayerId);
    sendReactionToRoom(room.id, myPlayer?.name || 'بازیکن', emoji);
  };

  // Pronounce word
  const handlePronounce = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fa' ? 'fa-IR' : lang === 'nl' ? 'nl-NL' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentCard = room.currentCard;
  const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === currentCard?.targetLanguage);

  // Calculate Winners if Game Over
  const maxScore = Math.max(...room.teams.map(t => t.score || 0));
  const winners = room.teams.filter(t => (t.score || 0) === maxScore);

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col justify-between p-2.5 sm:p-4 text-center select-none relative overflow-y-auto overscroll-contain bg-[var(--bg)] text-[var(--ink)] font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingEmojis.map(e => (
          <div
            key={e.id}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[var(--panel)] text-[var(--ink)] px-3 py-1 rounded-full border border-[var(--line)] text-sm font-bold flex items-center gap-1.5 shadow-[var(--shadow-sm)] animate-float-up font-ui"
          >
            <span className="text-xl">{e.emoji}</span>
            <span className="text-[10px] text-[var(--mute)]">{e.sender}</span>
          </div>
        ))}
      </div>

      {/* Top Bar: Voice Call Connection & Round Tracker */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-[var(--line)] shrink-0 font-ui gap-1.5">
        
        {/* Voice Platform Helper */}
        {room.voiceLink && (
          <a
            href={room.voiceLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-[#1E9E93] text-white px-2.5 py-1.5 rounded-[12px] text-xs font-bold shadow-[var(--shadow-sm)] active:translate-y-0.5"
          >
            <Headphones size={13} />
            <span>{language === 'fa' ? 'تماس صوتی فعال' : 'Voice call active'}</span>
            <ExternalLink size={11} />
          </a>
        )}

        {/* Round Badge */}
        <div className="flex items-center gap-1.5 bg-[var(--saffron)] text-[var(--ink)] px-3 py-1.5 rounded-[12px] text-xs font-bold border border-[var(--line)] shadow-[var(--shadow-sm)]">
          <Clock size={13} />
          <span>{language === 'fa' ? `راند ${room.currentRound} از ${room.settings.roundsCount || 3}` : `Round ${room.currentRound} of ${room.settings.roundsCount || 3}`}</span>
        </div>

        {/* Room Code & Exit Button */}
        <div className="flex items-center gap-1.5">
          <div className="bg-[var(--panel)] text-[var(--ink)] px-2.5 py-1.5 rounded-[12px] text-[11px] font-mono font-bold border border-[var(--line)] shadow-[var(--shadow-sm)]">
            #{room.code}
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowExitConfirm(true);
            }}
            className="w-8 h-8 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition-colors"
            title={language === 'fa' ? 'خروج از بازی' : 'Exit Game'}
          >
            <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      {/* Live Teams Scoreboard Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-2 shrink-0 font-ui">
        {room.teams.map(t => {
          const isActive = t.id === activeTeam.id;
          const teamLabel = language === 'fa'
            ? `تیم ${t.color === 'BLUE' ? 'آبی' : t.color === 'RED' ? 'قرمز' : t.color === 'GREEN' ? 'سبز' : 'زرد'}`
            : `Team ${t.color === 'BLUE' ? 'Blue' : t.color === 'RED' ? 'Red' : t.color === 'GREEN' ? 'Green' : 'Yellow'}`;

          return (
            <div
              key={t.id}
              className={`p-1.5 sm:p-2 rounded-[12px] border transition-all flex items-center justify-between ${
                isActive 
                  ? 'border-[var(--vermilion)] bg-[var(--panel)] ring-2 ring-[var(--vermilion)] shadow-[var(--shadow-sm)]' 
                  : 'border-[var(--line)] bg-[var(--panel)]/70 opacity-80'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                <TeamMascot color={t.color} size={18} animate={false} />
                <span className="text-[10px] font-bold text-[var(--ink)] truncate">
                  {teamLabel}
                </span>
              </div>
              <span className="text-xs font-bold px-1.5 py-0.5 bg-[var(--bg)] text-[var(--ink)] rounded-[6px] border border-[var(--line)] font-mono ml-1 shrink-0">
                {t.score || 0} ⭐
              </span>
            </div>
          );
        })}
      </div>

      {/* GAME OVER SCREEN MODAL VIEW */}
      {room.status === 'game_over' ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 my-auto font-ui">
          <div className="p-5 bg-[var(--panel)] rounded-[20px] border border-[var(--line)] shadow-[var(--shadow)] w-full max-w-sm space-y-3">
            <Trophy size={48} className="text-[var(--saffron)] mx-auto drop-shadow-md" />
            <h2 className="text-xl font-bold text-[var(--ink)] font-display">
              {language === 'fa' ? 'پایان مسابقه آنلاین! 🏆' : 'Online Match Complete! 🏆'}
            </h2>
            <div className="p-3 bg-[var(--bg)] rounded-[14px] border border-[var(--line)]">
              <span className="text-xs font-bold text-[var(--vermilion)] block">{language === 'fa' ? 'تیم قهرمان:' : 'Champion Team:'}</span>
              <span className="text-sm font-bold text-[var(--ink)]">
                {winners.map(w => language === 'fa' ? `تیم ${w.color === 'BLUE' ? 'آبی' : w.color === 'RED' ? 'قرمز' : w.color === 'GREEN' ? 'سبز' : 'زرد'}` : `Team ${w.color}`).join(language === 'fa' ? ' و ' : ' & ')}
              </span>
            </div>

            {/* Open Share Scorecard Modal */}
            <button
              onClick={() => {
                sound.playClick();
                setIsShareModalOpen(true);
              }}
              className="w-full py-2.5 bg-[var(--vermilion)] hover:bg-[#c94b2a] text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 rounded-[12px] shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
            >
              <Share2 size={16} />
              <span>{language === 'fa' ? 'اشتراک‌گذاری کارنامه مسابقه 📤' : 'Share Match Scorecard 📤'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setShowExitConfirm(true);
              }}
              className="w-full py-2 bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] rounded-[12px] font-bold text-xs border border-[var(--line)] shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
            >
              {language === 'fa' ? 'خروج به صفحه اصلی' : 'Exit to Main Menu'}
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE TURN GAMEPLAY */
        <div className="flex-1 min-h-0 flex flex-col justify-between my-auto space-y-2 font-ui">
          
          {/* Active Player & Turn Notification */}
          <div 
            className="p-2 sm:p-2.5 rounded-[16px] border border-[var(--line)] flex items-center justify-between text-[var(--ink)] shadow-[var(--shadow-sm)] shrink-0 bg-[var(--panel)]"
          >
            <div className="flex items-center gap-2">
              <TeamMascot color={activeTeam.color} size={28} />
              <div className="text-start">
                <span className="text-[10px] text-[var(--mute)] font-bold uppercase block">{language === 'fa' ? 'نوبت توضیح و حدس:' : 'Active Guesser / Turn:'}</span>
                <span className="text-xs font-bold text-[var(--ink)]">{activePlayer?.name}</span>
              </div>
            </div>

            {/* Big Round Seconds Timer */}
            <div className="px-3 py-1 bg-[var(--saffron)] text-[var(--ink)] rounded-[12px] font-mono text-lg font-bold border border-[var(--line)] shadow-[var(--shadow-sm)]">
              {Math.ceil(room.roundTimer / 1000)}s
            </div>
          </div>

          {/* MAIN CARD VIEWPORT */}
          <div className="flex-1 flex flex-col justify-center font-ui">
            
            {/* 1. SCENARIO A: ACTIVE GUESSER SCREEN (CARD IS SECRET / BLINDFOLDED AS REQUESTED) */}
            {isMyTurnToGuess ? (
              <div className="bg-[var(--panel)] text-[var(--ink)] p-5 rounded-[20px] border border-[var(--line)] shadow-[var(--shadow)] space-y-3 font-ui">
                <div className="w-14 h-14 bg-[var(--saffron)] text-[var(--ink)] rounded-[16px] flex items-center justify-center mx-auto border border-[var(--line)] shadow-[var(--shadow-sm)] animate-bounce">
                  <EyeOff size={28} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[var(--ink)] font-display">
                    {language === 'fa' ? '🙈 نوبت حدس زدن شماست!' : "🙈 It's your turn to guess!"}
                  </h3>
                  <p className="text-xs text-[var(--mute)] leading-relaxed font-medium">
                    {language === 'fa' 
                      ? 'کارت از روی صفحه شما مخفی است تا بازی لو نرود. به صدای هم‌تیمی‌هایتان در تماس صوتی (گوگل میت / دیسکورد) گوش دهید و کلمه هدف را حدس بزنید!' 
                      : 'The card is hidden on your screen to avoid spoilers. Listen to your teammates on the voice call and guess the target word!'}
                  </p>
                </div>

                {/* Animated Audio Waves */}
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <span className="w-1.5 h-6 bg-[var(--teal)] rounded-full animate-pulse" />
                  <span className="w-1.5 h-10 bg-[var(--vermilion)] rounded-full animate-pulse delay-75" />
                  <span className="w-1.5 h-4 bg-[var(--saffron)] rounded-full animate-pulse delay-150" />
                  <span className="w-1.5 h-8 bg-[var(--ink)] rounded-full animate-pulse delay-200" />
                </div>

                <div className="text-[10px] text-[var(--ink)] font-bold bg-[var(--bg)] px-3 py-1 rounded-[12px] border border-[var(--line)]">
                  {language === 'fa' ? '🎙️ در حال گوش دادن به هم‌تیمی‌ها...' : '🎙️ Listening to teammates...'}
                </div>
              </div>
            ) : (
              /* 2. SCENARIO B: DESCRIBER / SPECTATORS SEE THE CARD TO EXPLAIN */
              <div className="bg-[var(--panel)] p-4 rounded-[20px] border border-[var(--line)] shadow-[var(--shadow)] text-start space-y-2.5 relative font-ui">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b pb-2 border-[var(--line)]">
                  <div className="flex items-center gap-1.5">
                    <FlagIcon language={langInfo?.code || 'fa'} size={18} />
                    <span className="text-xs font-bold text-[var(--ink)]">{langInfo?.name}</span>
                    <span className="text-[9.5px] bg-[var(--bg)] text-[var(--vermilion)] px-1.5 py-0.5 rounded font-bold border border-[var(--line)]">
                      {currentCard?.cefrLevel}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold bg-[var(--saffron)] text-[var(--ink)] px-2 py-0.5 rounded-[8px] border border-[var(--line)]">
                    {(currentCard?.points || 1) * (currentCard?.isGolden ? 2 : 1)} {t.score || 'pts'} ⭐
                  </span>
                </div>

                {/* Target Word with Subtle Tinted Plate for AAA Readability */}
                <div className="text-center p-3 rounded-[16px] bg-[var(--bg)] border border-[var(--line)] space-y-1.5">
                  <span className="text-[10px] text-[var(--mute)] font-bold block uppercase">
                    {tf(language, 'describeFor', { player: activePlayer?.name || '' })}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <h2 dir="ltr" className="text-2xl sm:text-3xl font-bold text-[var(--ink)] font-card-word">
                      {currentCard?.targetText || 'Loading...'}
                    </h2>
                    {currentCard && (
                      <button
                        onClick={() => handlePronounce(currentCard.targetText, currentCard.targetLanguage)}
                        className="p-1.5 bg-[var(--saffron)] hover:bg-[#e0a634] rounded-[10px] border border-[var(--line)] text-[var(--ink)] shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
                        title={t.audioPronunciation || "Audio Pronunciation"}
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Native Translation in AAA High-Contrast Badge */}
                  <div className="inline-block px-3 py-1 bg-[var(--panel)] rounded-[10px] border border-[var(--line)] text-xs font-bold text-[var(--ink)]">
                    {currentCard?.translation}
                  </div>
                </div>

                {/* Grammar / Hint Clue */}
                {currentCard?.grammarPoint && (
                  <div className="text-[11px] bg-[var(--bg)] p-2 rounded-[12px] border border-[var(--line)] text-[var(--ink)]">
                    <span className="font-bold text-[var(--teal)]">{t.grammarNote || 'Grammar Note: '}</span>
                    <span>{currentCard.grammarPoint}</span>
                  </div>
                )}

                {/* Controls for Describers & Host */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-ui">
                  <button
                    onClick={handleCorrect}
                    className="py-2.5 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1 bg-[var(--teal)] hover:bg-[#17857c] text-white shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
                  >
                    <Check size={16} />
                    <span>{t.guessedCorrectly}</span>
                  </button>

                  <button
                    onClick={handlePass}
                    className="py-2.5 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1 bg-[var(--vermilion)] hover:bg-[#c94b2a] text-white shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
                  >
                    <X size={16} />
                    <span>{t.passWrong}</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Quick Real-Time Emoji Reaction Bar */}
          <div className="flex items-center justify-center gap-2 bg-[var(--panel)] p-1.5 rounded-[16px] border border-[var(--line)] shadow-[var(--shadow-sm)] shrink-0 font-ui">
            <span className="text-[10px] text-[var(--mute)] font-bold ml-1">{t.react || 'React:'}</span>
            {['👏', '🔥', '😂', '💡', '⚡'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="w-8 h-8 rounded-[10px] bg-[var(--bg)] hover:bg-[var(--panel)] border border-[var(--line)] active:scale-110 transition-transform flex items-center justify-center text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* Share Scorecard Modal */}
      <ShareScorecardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        winners={winners}
        players={room.players}
        playedCards={room.playedCards || []}
        language={language}
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <ExitConfirmModal
          isRTL={isRTL}
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setShowExitConfirm(false);
            onExit();
          }}
        />
      )}

    </div>
  );
};

export default OnlineGameplayScreen;
