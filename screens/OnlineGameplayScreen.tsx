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
    <div className="h-full min-h-0 flex-1 flex flex-col justify-between p-3 sm:p-4 text-center select-none relative overflow-hidden bg-[#F4EDE1] text-[#1E1B2E] font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingEmojis.map(e => (
          <div
            key={e.id}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#FFFBF4] text-[#1E1B2E] px-3 py-1 rounded-full border-2 border-[#1E1B2E] text-sm font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#1E1B2E] animate-float-up font-ui"
          >
            <span className="text-xl">{e.emoji}</span>
            <span className="text-[10px] text-[#1E1B2E]/70">{e.sender}</span>
          </div>
        ))}
      </div>

      {/* Top Bar: Voice Call Connection & Round Tracker */}
      <div className="w-full flex items-center justify-between pb-1.5 border-b-2 border-[#1E1B2E]/20 shrink-0 font-ui">
        
        {/* Voice Platform Helper */}
        {room.voiceLink && (
          <a
            href={room.voiceLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-[#1E9E93] text-white px-2.5 py-1 rounded-[12px] text-xs font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5"
          >
            <Headphones size={13} />
            <span>{language === 'fa' ? 'تماس صوتی فعال' : 'Voice call active'}</span>
            <ExternalLink size={11} />
          </a>
        )}

        {/* Round Badge */}
        <div className="flex items-center gap-1.5 bg-[#F2B63D] text-[#1E1B2E] px-3 py-1 rounded-[12px] text-xs font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
          <Clock size={13} />
          <span>{language === 'fa' ? `راند ${room.currentRound} از ${room.settings.roundsCount || 3}` : `Round ${room.currentRound} of ${room.settings.roundsCount || 3}`}</span>
        </div>

        {/* Room Code */}
        <div className="bg-[#FFFBF4] text-[#1E1B2E] px-2.5 py-1 rounded-[12px] text-[11px] font-mono font-bold border-2 border-[#1E1B2E]">
          #{room.code}
        </div>
      </div>

      {/* Live Teams Scoreboard Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-1.5 shrink-0 font-ui">
        {room.teams.map(t => {
          const cfg = COLORS_MAP[t.color] || { bg: 'bg-[#1E9E93]', text: 'text-[#1E1B2E]', hex: '#1E9E93' };
          const isActive = t.id === activeTeam.id;
          const teamLabel = language === 'fa'
            ? `تیم ${t.color === 'BLUE' ? 'آبی' : t.color === 'RED' ? 'قرمز' : t.color === 'GREEN' ? 'سبز' : 'زرد'}`
            : `Team ${t.color === 'BLUE' ? 'Blue' : t.color === 'RED' ? 'Red' : t.color === 'GREEN' ? 'Green' : 'Yellow'}`;

          return (
            <div
              key={t.id}
              className={`p-1.5 rounded-[12px] border-2 border-[#1E1B2E] flex items-center justify-between transition-all ${
                isActive ? 'ring-2 ring-[#E0603F] bg-[#FFFBF4] shadow-[2px_2px_0px_0px_#1E1B2E]' : 'bg-[#FFFBF4]/80 opacity-80'
              }`}
            >
              <div className="flex items-center gap-1">
                <TeamMascot color={t.color} size={18} animate={false} />
                <span className="text-[10px] font-bold text-[#1E1B2E] truncate">
                  {teamLabel}
                </span>
              </div>
              <span className="text-xs font-bold px-1.5 py-0.5 bg-[#F4EDE1] text-[#1E1B2E] rounded-[6px] border border-[#1E1B2E] font-mono">
                {t.score || 0} ⭐
              </span>
            </div>
          );
        })}
      </div>

      {/* GAME OVER SCREEN MODAL VIEW */}
      {room.status === 'game_over' ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 my-auto font-ui">
          <div className="p-4 bg-[#FFFBF4] rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] w-full max-w-sm space-y-2.5">
            <Trophy size={48} className="text-[#F2B63D] mx-auto drop-shadow-md" />
            <h2 className="text-xl font-bold text-[#1E1B2E] font-display">
              {language === 'fa' ? 'پایان مسابقه آنلاین! 🏆' : 'Online Match Complete! 🏆'}
            </h2>
            <div className="p-2.5 bg-[#F4EDE1] rounded-[14px] border-2 border-[#1E1B2E]">
              <span className="text-xs font-bold text-[#E0603F] block">{language === 'fa' ? 'تیم قهرمان:' : 'Champion Team:'}</span>
              <span className="text-sm font-bold text-[#1E1B2E]">
                {winners.map(w => language === 'fa' ? `تیم ${w.color === 'BLUE' ? 'آبی' : w.color === 'RED' ? 'قرمز' : w.color === 'GREEN' ? 'سبز' : 'زرد'}` : `Team ${w.color}`).join(language === 'fa' ? ' و ' : ' & ')}
              </span>
            </div>

            {/* Open Share Scorecard Modal */}
            <button
              onClick={() => {
                sound.playClick();
                setIsShareModalOpen(true);
              }}
              className="pixel-btn pixel-btn-orange w-full py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-1.5 rounded-[12px]"
            >
              <Share2 size={16} />
              <span>{language === 'fa' ? 'اشتراک‌گذاری کارنامه مسابقه 📤' : 'Share Match Scorecard 📤'}</span>
            </button>

            <button
              onClick={onExit}
              className="w-full py-2 bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] rounded-[12px] font-bold text-xs border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]"
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
            className="p-2 rounded-[16px] border-2 border-[#1E1B2E] flex items-center justify-between text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] shrink-0 bg-[#FFFBF4]"
          >
            <div className="flex items-center gap-2">
              <TeamMascot color={activeTeam.color} size={28} />
              <div className="text-start">
                <span className="text-[10px] text-[#1E1B2E]/70 font-bold uppercase block">{language === 'fa' ? 'نوبت توضیح و حدس:' : 'Active Guesser / Turn:'}</span>
                <span className="text-xs font-bold text-[#1E1B2E]">{activePlayer?.name}</span>
              </div>
            </div>

            {/* Big Round Seconds Timer */}
            <div className="px-3 py-1 bg-[#F2B63D] text-[#1E1B2E] rounded-[12px] font-mono text-lg font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
              {Math.ceil(room.roundTimer / 1000)}s
            </div>
          </div>

          {/* MAIN CARD VIEWPORT */}
          <div className="flex-1 flex flex-col justify-center font-ui">
            
            {/* 1. SCENARIO A: ACTIVE GUESSER SCREEN (CARD IS SECRET / BLINDFOLDED AS REQUESTED) */}
            {isMyTurnToGuess ? (
              <div className="bg-[#FFFBF4] text-[#1E1B2E] p-5 rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] space-y-3 font-ui">
                <div className="w-14 h-14 bg-[#F2B63D] text-[#1E1B2E] rounded-[16px] flex items-center justify-center mx-auto border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] animate-bounce">
                  <EyeOff size={28} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#1E1B2E] font-display">
                    {language === 'fa' ? '🙈 نوبت حدس زدن شماست!' : "🙈 It's your turn to guess!"}
                  </h3>
                  <p className="text-xs text-[#1E1B2E]/80 leading-relaxed font-medium">
                    {language === 'fa' 
                      ? 'کارت از روی صفحه شما مخفی است تا بازی لو نرود. به صدای هم‌تیمی‌هایتان در تماس صوتی (گوگل میت / دیسکورد) گوش دهید و کلمه هدف را حدس بزنید!' 
                      : 'The card is hidden on your screen to avoid spoilers. Listen to your teammates on the voice call and guess the target word!'}
                  </p>
                </div>

                {/* Animated Audio Waves */}
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <span className="w-1.5 h-6 bg-[#1E9E93] rounded-full animate-pulse" />
                  <span className="w-1.5 h-10 bg-[#E0603F] rounded-full animate-pulse delay-75" />
                  <span className="w-1.5 h-4 bg-[#F2B63D] rounded-full animate-pulse delay-150" />
                  <span className="w-1.5 h-8 bg-[#1E1B2E] rounded-full animate-pulse delay-200" />
                </div>

                <div className="text-[10px] text-[#1E1B2E] font-bold bg-[#F4EDE1] px-3 py-1 rounded-[12px] border border-[#1E1B2E]">
                  {language === 'fa' ? '🎙️ در حال گوش دادن به هم‌تیمی‌ها...' : '🎙️ Listening to teammates...'}
                </div>
              </div>
            ) : (
              /* 2. SCENARIO B: DESCRIBER / SPECTATORS SEE THE CARD TO EXPLAIN */
              <div className="bg-[#FFFBF4] p-4 rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] text-start space-y-2.5 relative font-ui">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b-2 pb-1.5 border-[#1E1B2E]/20">
                  <div className="flex items-center gap-1.5">
                    <FlagIcon language={langInfo?.code || 'fa'} size={18} />
                    <span className="text-xs font-bold text-[#1E1B2E]">{langInfo?.name}</span>
                    <span className="text-[9.5px] bg-[#F4EDE1] text-[#E0603F] px-1.5 py-0.5 rounded font-bold border border-[#1E1B2E]">
                      {currentCard?.cefrLevel}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold bg-[#F2B63D] text-[#1E1B2E] px-2 py-0.5 rounded-[8px] border border-[#1E1B2E]">
                    {(currentCard?.points || 1) * (currentCard?.isGolden ? 2 : 1)} {t.score || 'pts'} ⭐
                  </span>
                </div>

                {/* Target Word with Subtle Tinted Plate for AAA Readability */}
                <div className="text-center p-3 rounded-[16px] bg-[#F4EDE1] border-2 border-[#1E1B2E] space-y-1.5">
                  <span className="text-[10px] text-[#1E1B2E]/70 font-bold block uppercase">
                    {tf(language, 'describeFor', { player: activePlayer?.name || '' })}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <h2 dir="ltr" className="text-2xl sm:text-3xl font-bold text-[#1E1B2E] font-card-word">
                      {currentCard?.targetText || 'Loading...'}
                    </h2>
                    {currentCard && (
                      <button
                        onClick={() => handlePronounce(currentCard.targetText, currentCard.targetLanguage)}
                        className="p-1.5 bg-[#F2B63D] hover:bg-[#e0a634] rounded-[10px] border-2 border-[#1E1B2E] text-[#1E1B2E] shadow-[1.5px_1.5px_0px_0px_#1E1B2E]"
                        title={t.audioPronunciation || "Audio Pronunciation"}
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Native Translation in AAA High-Contrast Badge */}
                  <div className="inline-block px-3 py-1 bg-[#FFFBF4] rounded-[10px] border-2 border-[#1E1B2E] text-xs font-bold text-[#1E1B2E]">
                    {currentCard?.translation}
                  </div>
                </div>

                {/* Grammar / Hint Clue */}
                {currentCard?.grammarPoint && (
                  <div className="text-[11px] bg-[#FFFBF4] p-2 rounded-[12px] border border-[#1E1B2E] text-[#1E1B2E]">
                    <span className="font-bold text-[#1E9E93]">{t.grammarNote || 'Grammar Note: '}</span>
                    <span>{currentCard.grammarPoint}</span>
                  </div>
                )}

                {/* Controls for Describers & Host */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-ui">
                  <button
                    onClick={handleCorrect}
                    className="pixel-btn pixel-btn-teal py-2.5 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Check size={16} />
                    <span>{t.guessedCorrectly}</span>
                  </button>

                  <button
                    onClick={handlePass}
                    className="pixel-btn pixel-btn-orange py-2.5 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <X size={16} />
                    <span>{t.passWrong}</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Quick Real-Time Emoji Reaction Bar */}
          <div className="flex items-center justify-center gap-2 bg-[#FFFBF4] p-1.5 rounded-[16px] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] shrink-0 font-ui">
            <span className="text-[10px] text-[#1E1B2E]/70 font-bold ml-1">{t.react || 'React:'}</span>
            {['👏', '🔥', '😂', '💡', '⚡'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="w-8 h-8 rounded-[10px] bg-[#F4EDE1] hover:bg-[#eedfcb] border border-[#1E1B2E] active:scale-110 transition-transform flex items-center justify-center text-lg"
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

    </div>
  );
};

export default OnlineGameplayScreen;
