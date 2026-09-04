import React, { useState, useEffect, useRef } from 'react';
import { OnlineRoomState, OnlinePlayer, Language, TeamColor, LanguageCard, PlayedCardRecord } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TRANSLATIONS } from '../translations';
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
  const t = TRANSLATIONS[language] || TRANSLATIONS.fa;
  const isRTL = language === 'fa' || language === 'ar';
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
    <div className="h-full min-h-0 flex-1 flex flex-col justify-between p-3 sm:p-4 text-center select-none relative overflow-hidden bg-[#170B2C]" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingEmojis.map(e => (
          <div
            key={e.id}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#241442]/90 text-white px-3 py-1 rounded-full border border-[#FFE600] text-sm font-black flex items-center gap-1.5 shadow-lg animate-float-up"
          >
            <span className="text-xl">{e.emoji}</span>
            <span className="text-[10px] text-slate-300">{e.sender}</span>
          </div>
        ))}
      </div>

      {/* Top Bar: Voice Call Connection & Round Tracker */}
      <div className="w-full flex items-center justify-between pb-1.5 border-b border-white/10 shrink-0">
        
        {/* Voice Platform Helper */}
        {room.voiceLink && (
          <a
            href={room.voiceLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-[#39FF14] text-[#1a0833] px-2.5 py-1 rounded-xl text-xs font-black border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] active:translate-y-0.5"
          >
            <Headphones size={13} />
            <span>تماس صوتی فعال</span>
            <ExternalLink size={11} />
          </a>
        )}

        {/* Round Badge */}
        <div className="flex items-center gap-1.5 bg-[#241442] text-[#FFE600] px-3 py-1 rounded-xl text-xs font-black border border-[#FFE600]/40">
          <Clock size={13} />
          <span>راند {room.currentRound} از {room.settings.roundsCount || 3}</span>
        </div>

        {/* Room Code */}
        <div className="bg-white/10 text-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-mono font-black">
          #{room.code}
        </div>
      </div>

      {/* Live Teams Scoreboard Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-1.5 shrink-0">
        {room.teams.map(t => {
          const cfg = COLORS_MAP[t.color] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };
          const isActive = t.id === activeTeam.id;

          return (
            <div
              key={t.id}
              className={`p-1.5 rounded-xl border-2 border-[#241442] flex items-center justify-between transition-all ${
                isActive ? 'ring-2 ring-[#FFE600] bg-white shadow-[2px_2px_0px_0px_#241442]' : 'bg-white/80 opacity-80'
              }`}
            >
              <div className="flex items-center gap-1">
                <TeamMascot color={t.color} size={18} animate={false} />
                <span className="text-[10px] font-black text-[#1a0833] truncate">
                  تیم {t.color === 'BLUE' ? 'آبی' : t.color === 'RED' ? 'قرمز' : t.color === 'GREEN' ? 'سبز' : 'زرد'}
                </span>
              </div>
              <span className="text-xs font-black px-1.5 py-0.5 bg-[#241442] text-[#39FF14] rounded-md font-mono">
                {t.score || 0} ⭐
              </span>
            </div>
          );
        })}
      </div>

      {/* GAME OVER SCREEN MODAL VIEW */}
      {room.status === 'game_over' ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 my-auto">
          <div className="p-4 bg-white rounded-3xl border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] w-full max-w-sm space-y-2.5">
            <Trophy size={48} className="text-[#FFE600] mx-auto drop-shadow-md" />
            <h2 className="text-xl font-black text-[#1a0833] font-display">
              پایان مسابقه آنلاین! 🏆
            </h2>
            <div className="p-2.5 bg-[#F8EFFF] rounded-xl border-2 border-[#241442]">
              <span className="text-xs font-black text-[#FF007F] block">تیم قهرمان:</span>
              <span className="text-sm font-black text-[#1a0833]">
                {winners.map(w => `تیم ${w.color === 'BLUE' ? 'آبی' : w.color === 'RED' ? 'قرمز' : w.color === 'GREEN' ? 'سبز' : 'زرد'}`).join(' و ')}
              </span>
            </div>

            {/* Open Share Scorecard Modal */}
            <button
              onClick={() => {
                sound.playClick();
                setIsShareModalOpen(true);
              }}
              className="pixel-btn pixel-btn-pink w-full py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5 text-white shadow-[2px_2px_0px_0px_#241442]"
            >
              <Share2 size={16} />
              <span>اشتراک‌گذاری کارنامه مسابقه 📤</span>
            </button>

            <button
              onClick={onExit}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#1a0833] rounded-xl font-black text-xs border border-[#241442]"
            >
              خروج به صفحه اصلی
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE TURN GAMEPLAY */
        <div className="flex-1 min-h-0 flex flex-col justify-between my-auto space-y-2">
          
          {/* Active Player & Turn Notification */}
          <div 
            className="p-2 rounded-2xl border-2 border-[#241442] flex items-center justify-between text-white shadow-[2px_2px_0px_0px_#241442] shrink-0"
            style={{ backgroundColor: teamConfig.hex }}
          >
            <div className="flex items-center gap-2">
              <TeamMascot color={activeTeam.color} size={28} />
              <div className="text-start">
                <span className="text-[10px] text-[#1a0833] font-black uppercase block">نوبت توضیح و حدس:</span>
                <span className="text-xs font-black text-[#1a0833]">{activePlayer?.name}</span>
              </div>
            </div>

            {/* Big Round Seconds Timer */}
            <div className="px-3 py-1 bg-[#241442] text-[#FFE600] rounded-xl font-mono text-lg font-black border border-[#FFE600]">
              {Math.ceil(room.roundTimer / 1000)}s
            </div>
          </div>

          {/* MAIN CARD VIEWPORT */}
          <div className="flex-1 flex flex-col justify-center">
            
            {/* 1. SCENARIO A: ACTIVE GUESSER SCREEN (CARD IS SECRET / BLINDFOLDED AS REQUESTED) */}
            {isMyTurnToGuess ? (
              <div className="pixel-card-shock bg-gradient-to-br from-[#241442] via-[#371661] to-[#4e1b8a] text-white p-5 rounded-3xl border-[3.5px] border-[#FFE600] shadow-[5px_5px_0px_0px_#241442] space-y-3">
                <div className="w-14 h-14 bg-[#FFE600] text-[#1a0833] rounded-2xl flex items-center justify-center mx-auto border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] animate-bounce">
                  <EyeOff size={28} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#FFE600] font-display">
                    🙈 نوبت حدس زدن شماست!
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed font-bold">
                    کارت از روی صفحه شما مخفی است تا بازی لو نرود.
                    به صدای هم‌تیمی‌هایتان در تماس صوتی (گوگل میت / دیسکورد) گوش دهید و کلمه هدف را حدس بزنید!
                  </p>
                </div>

                {/* Animated Audio Waves */}
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <span className="w-1.5 h-6 bg-[#39FF14] rounded-full animate-pulse" />
                  <span className="w-1.5 h-10 bg-[#00F0FF] rounded-full animate-pulse delay-75" />
                  <span className="w-1.5 h-4 bg-[#FF007F] rounded-full animate-pulse delay-150" />
                  <span className="w-1.5 h-8 bg-[#FFE600] rounded-full animate-pulse delay-200" />
                </div>

                <div className="text-[10px] text-[#00F0FF] font-black bg-[#170B2C]/80 px-3 py-1 rounded-xl border border-[#00F0FF]/30">
                  🎙️ در حال گوش دادن به هم‌تیمی‌ها...
                </div>
              </div>
            ) : (
              /* 2. SCENARIO B: DESCRIBER / SPECTATORS SEE THE CARD TO EXPLAIN */
              <div className="bg-white p-4 rounded-3xl border-[3.5px] border-[#241442] shadow-[5px_5px_0px_0px_#241442] text-start space-y-2.5 relative">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{langInfo?.flag}</span>
                    <span className="text-xs font-black text-[#1a0833]">{langInfo?.name}</span>
                    <span className="text-[9.5px] bg-[#F4E8FF] text-[#FF007F] px-1.5 py-0.5 rounded font-black border border-[#FF007F]/40">
                      {currentCard?.cefrLevel}
                    </span>
                  </div>

                  <span className="text-[10px] font-black bg-[#FFE600] text-[#1a0833] px-2 py-0.5 rounded-lg border border-[#241442]">
                    {(currentCard?.points || 1) * (currentCard?.isGolden ? 2 : 1)} امتیاز ⭐
                  </span>
                </div>

                {/* Target Word */}
                <div className="text-center py-2 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    این کلمه را برای {activePlayer?.name} توصیف کنید:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1a0833] font-display">
                      {currentCard?.targetText || 'Loading...'}
                    </h2>
                    {currentCard && (
                      <button
                        onClick={() => handlePronounce(currentCard.targetText, currentCard.targetLanguage)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-300 text-slate-700"
                        title="تلفظ صوتی"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Native Translation */}
                  <div className="inline-block px-3 py-1 bg-[#F8EFFF] rounded-xl border border-[#241442] text-xs font-black text-[#FF007F]">
                    {currentCard?.translation}
                  </div>
                </div>

                {/* Grammar / Hint Clue */}
                {currentCard?.grammarPoint && (
                  <div className="text-[11px] bg-[#F0FBFF] p-2 rounded-xl border border-[#00F0FF] text-slate-800">
                    <span className="font-black text-[#0088cc]">راهنمای گرامری: </span>
                    <span>{currentCard.grammarPoint}</span>
                  </div>
                )}

                {/* Controls for Describers & Host */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCorrect}
                    className="py-2.5 bg-[#39FF14] hover:bg-[#32e012] text-[#1a0833] font-black text-xs rounded-xl border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1"
                  >
                    <Check size={16} />
                    <span>درست حدس زد! (+امتیاز)</span>
                  </button>

                  <button
                    onClick={handlePass}
                    className="py-2.5 bg-[#FF1058] hover:bg-[#e00e4e] text-white font-black text-xs rounded-xl border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1"
                  >
                    <X size={16} />
                    <span>پاس / خطا</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Quick Real-Time Emoji Reaction Bar */}
          <div className="flex items-center justify-center gap-2 bg-[#241442]/90 p-1.5 rounded-2xl border border-white/10 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold ml-1">واکنش:</span>
            {['👏', '🔥', '😂', '💡', '⚡'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-125 transition-transform flex items-center justify-center text-lg"
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
