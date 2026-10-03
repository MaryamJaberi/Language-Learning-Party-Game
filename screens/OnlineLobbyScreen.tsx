import React, { useState, useEffect, useRef } from 'react';
import { OnlineRoomState, OnlinePlayer, GameSettings, Language, TeamColor } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TRANSLATIONS, NATIVE_LANGUAGE_NAMES } from '../translations';
import { isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { 
  createOnlineRoom, 
  joinOnlineRoom, 
  subscribeToRoom, 
  switchPlayerTeam, 
  startOnlineGame, 
  getDeviceId 
} from '../onlineRoomService';
import { 
  Globe, 
  Users, 
  Zap, 
  Copy, 
  Check, 
  Share2, 
  Video, 
  Headphones, 
  Crown, 
  ArrowLeft, 
  Play, 
  Settings, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  PhoneCall,
  AlertCircle
} from 'lucide-react';

interface Props {
  language: Language;
  initialSettings: GameSettings;
  initialRoomCode?: string;
  onStartGame: (room: OnlineRoomState, myPlayerId: number) => void;
  onBack: () => void;
}

export const OnlineLobbyScreen: React.FC<Props> = ({
  language,
  initialSettings,
  initialRoomCode = '',
  onStartGame,
  onBack
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.fa;
  const isRTL = isRtlLang(language);
  const myDeviceId = getDeviceId();

  // Mode: 'select' | 'create' | 'join' | 'in_lobby'
  const [viewMode, setViewMode] = useState<'select' | 'create' | 'join' | 'in_lobby'>(
    initialRoomCode ? 'join' : 'select'
  );

  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState(
    localStorage.getItem('dor_player_name') || ''
  );
  const [voiceProvider, setVoiceProvider] = useState<'jitsi' | 'meet' | 'discord' | 'custom'>('jitsi');
  const [customVoiceLink, setCustomVoiceLink] = useState('');

  // Active room state
  const [currentRoom, setCurrentRoom] = useState<OnlineRoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-subscribe when in room
  const onStartGameRef = useRef(onStartGame);
  useEffect(() => {
    onStartGameRef.current = onStartGame;
  }, [onStartGame]);

  useEffect(() => {
    if (!currentRoom?.id) return;

    const unsubscribe = subscribeToRoom(
      currentRoom.id,
      (updatedRoom) => {
        if (!updatedRoom) {
          setErrorMessage(
            isRTL 
              ? 'اتاق بازی بسته شد یا وجود ندارد. راه‌حل: از دوستان خود کد جدیدی بگیرید یا با زدن دکمه «ساخت اتاق جدید» یک بازی تازه شروع کنید.'
              : 'Room was closed. Fix: Ask the host for a new code or create a new room.'
          );
          setViewMode('select');
          return;
        }

        setCurrentRoom(updatedRoom);

        // If host started the game, transition to gameplay
        if (updatedRoom.status === 'playing' || updatedRoom.status === 'round_ended') {
          onStartGameRef.current(updatedRoom, myPlayerId);
        }
      },
      (err) => {
        setErrorMessage(
          isRTL
            ? `خطا در همگام‌سازی اتاق: ${err.message}. راه‌حل: لطفاً وضعیت اتصال اینترنت خود را بررسی کنید.`
            : `Sync error: ${err.message}. Fix: Check your internet connection.`
        );
      }
    );

    return () => unsubscribe();
  }, [currentRoom?.id, myPlayerId]);

  // Handle Create Room
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setErrorMessage(
        isRTL 
          ? 'نام بازیکن وارد نشده است. راه‌حل: در کادر بالا یک نام یا لقب برای نمایش در بازی تایپ کنید و مجدداً دکمه ساخت را بزنید.'
          : 'Player name is empty. Fix: Type your name or nickname above and tap create again.'
      );
      return;
    }
    localStorage.setItem('dor_player_name', playerName.trim());
    setIsLoading(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const { roomId, roomCode, playerId } = await createOnlineRoom(
        playerName.trim(),
        initialSettings,
        voiceProvider,
        customVoiceLink
      );
      setMyPlayerId(playerId);
      setCurrentRoom({
        id: roomId,
        code: roomCode,
        hostId: myDeviceId,
        hostName: playerName.trim(),
        status: 'lobby',
        currentRound: 1,
        activePlayerIndex: 0,
        settings: initialSettings,
        teams: [
          { id: 0, color: TeamColor.Blue, timeRemaining: 60000, isEliminated: false, playerIds: [playerId], score: 0, comboStreak: 0 },
          { id: 1, color: TeamColor.Red, timeRemaining: 60000, isEliminated: false, playerIds: [], score: 0, comboStreak: 0 }
        ],
        players: [{
          id: playerId,
          name: playerName.trim(),
          teamId: 0,
          teamColor: TeamColor.Blue,
          isHost: true,
          isReady: true,
          deviceId: myDeviceId
        }],
        currentCard: null,
        roundTimer: 60000,
        isTimerRunning: false,
        playedCards: []
      });
      setViewMode('in_lobby');
    } catch (err: any) {
      setErrorMessage(
        isRTL 
          ? `خطا در ایجاد اتاق آنلاین: ${err.message || 'مشکل ارتباط با سرور'}. راه‌حل: فیلترشکن یا اتصال اینترنت خود را بررسی نموده و دوباره تلاش کنید.`
          : `Error creating room: ${err.message}. Fix: Check your internet connection and try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setErrorMessage(
        isRTL 
          ? 'کد اتاق وارد نشده است. راه‌حل: کد ۴ یا ۶ رقمی را که میزبان بازی برای شما ارسال کرده در کادر کد وارد نمایید.'
          : 'Room code is empty. Fix: Enter the room code sent to you by the host.'
      );
      return;
    }
    if (!playerName.trim()) {
      setErrorMessage(
        isRTL 
          ? 'نام بازیکن وارد نشده است. راه‌حل: در کادر بالا یک نام یا لقب برای نمایش در بازی تایپ کنید.'
          : 'Player name is empty. Fix: Type your name or nickname above.'
      );
      return;
    }
    localStorage.setItem('dor_player_name', playerName.trim());
    setIsLoading(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const { roomId, room, playerId } = await joinOnlineRoom(roomCodeInput.trim(), playerName.trim());
      setMyPlayerId(playerId);
      setCurrentRoom(room);
      setViewMode('in_lobby');
    } catch (err: any) {
      setErrorMessage(
        isRTL 
          ? `اتاقی با کد «${roomCodeInput.trim().toUpperCase()}» پیدا نشد. راه‌حل: از درستی حروف کد اطمینان حاصل کنید، از میزبان بخواهید کد را مجدداً چک کند یا خودتان یک اتاق تازه بسازید.`
          : `Room not found. Fix: Check the code spelling with the host or create a new room.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Room Link / Code
  const handleCopyCode = () => {
    if (!currentRoom) return;
    sound.playCorrect();
    navigator.clipboard.writeText(currentRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!currentRoom) return;
    sound.playCorrect();
    const link = `${window.location.origin}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!currentRoom) return;
    sound.playClick();
    const link = `${window.location.origin}?room=${currentRoom.code}`;
    const text = encodeURIComponent(
      language === 'fa'
        ? `🎮 بیا تو بازی دورهمی یادگیری زبان (دور)!\nکد اتاق: ${currentRoom.code}\nلینک ورود مستقیم:\n${link}`
        : `🎮 Join my Turn language party game!\nRoom Code: ${currentRoom.code}\nDirect link:\n${link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Switch Team
  const handleSwitchTeam = async (targetTeamId: number) => {
    if (!currentRoom) return;
    sound.playToggle();
    await switchPlayerTeam(currentRoom.id, myPlayerId, targetTeamId);
  };

  // Host Start Game
  const handleHostStart = async () => {
    if (!currentRoom) return;
    sound.playStartGame();
    setIsLoading(true);
    try {
      await startOnlineGame(currentRoom.id);
    } catch (err: any) {
      setErrorMessage(err.message || (isRTL ? 'خطا در شروع بازی' : 'Error starting game'));
      setIsLoading(false);
    }
  };

  const isHost = currentRoom?.hostId === myDeviceId;

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3 sm:p-4 text-center select-none overflow-y-auto overscroll-contain text-[var(--ink)] bg-[var(--bg)] font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-2 shrink-0 font-ui">
        <button
          onClick={() => {
            sound.playClick();
            if (viewMode === 'in_lobby') {
              setViewMode('select');
              setCurrentRoom(null);
            } else if (viewMode === 'create' || viewMode === 'join') {
              setViewMode('select');
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-1.5 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--line)] shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          <span>{language === 'fa' ? 'بازگشت' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5 bg-[var(--lapis-soft)] text-[var(--lapis)] px-3 py-1 rounded-xl font-bold text-xs">
          <Globe size={14} />
          <span>{language === 'fa' ? 'بازی آنلاین راه دور' : 'Remote Multiplayer'}</span>
        </div>
      </div>

      {/* Error Banner with Actionable Guidance */}
      {errorMessage && (
        <div className="w-full mb-3 p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-900/40 shadow-xs flex items-start gap-2 text-start leading-relaxed">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* 1. SELECTION MODE (Host vs Join) */}
      {viewMode === 'select' && (
        <div className="w-full max-w-sm sm:max-w-md my-auto space-y-3 font-ui">
          
          <div className="bg-[var(--panel)] text-[var(--ink)] p-5 rounded-[24px] border border-[var(--line)] shadow-xs">
            <div className="flex justify-center mb-2">
              <TeamMascot color="PARTY" size={70} />
            </div>
            <h1 className="text-2xl font-black font-display text-[var(--ink)] mb-1">
              {language === 'fa' ? 'دورهمی آنلاین با دوستان' : 'Online Party Room'}
            </h1>
            <p className="text-xs text-[var(--mute)] font-medium leading-relaxed">
              {language === 'fa' 
                ? 'همه با گوشی خود وارد شوند، کارت برای حدس‌زننده مخفی می‌ماند و در دیسکورد یا گوگل میت صحبت کنید!' 
                : 'Everyone joins on their own phone, cards are hidden from the active guesser, and speak on Discord or Meet!'}
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Create Room Button */}
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('create');
              }}
              className="w-full py-3.5 text-sm sm:text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Crown size={18} />
              <span>{language === 'fa' ? 'ایجاد اتاق جدید (میزبان)' : 'Host New Room'}</span>
              <Zap size={16} fill="currentColor" />
            </button>

            {/* Join Room Button */}
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('join');
              }}
              className="w-full py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Users size={18} />
              <span>{language === 'fa' ? 'ورود با کد اتاق (بازیکن)' : 'Join with Room Code'}</span>
            </button>
          </div>

          {/* Voice Helper Info Box */}
          <div className="bg-[var(--panel)] text-[var(--ink)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs text-start space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-[var(--turq)] font-bold">
              <Headphones size={14} />
              <span>{language === 'fa' ? 'نحوه ارتباط صوتی:' : 'Voice Chat Setup:'}</span>
            </div>
            <p className="text-[var(--mute)] font-medium leading-relaxed">
              {language === 'fa'
                ? 'می‌توانید به یک تماس صوتی در گوگل میت (Google Meet)، دیسکورد (Discord) یا اتاق صوتی رایگان درون بازی وصل شوید.'
                : 'Connect to a Discord call, Google Meet, or instant in-app voice room with your friends.'}
            </p>
          </div>

        </div>
      )}

      {/* 2. CREATE ROOM FORM */}
      {viewMode === 'create' && (
        <div className="w-full max-w-sm sm:max-w-md my-auto space-y-3 bg-[var(--panel)] p-4 sm:p-5 rounded-[24px] border border-[var(--line)] shadow-xs text-start font-ui">
          
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
            <Crown size={20} className="text-[var(--saffron)]" />
            <h2 className="text-base font-bold text-[var(--ink)]">
              {language === 'fa' ? 'تنظیمات اتاق آنلاین' : 'Host Room Setup'}
            </h2>
          </div>

          {/* Host Name Input */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              {language === 'fa' ? 'نام شما (میزبان):' : 'Your Name (Host):'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={language === 'fa' ? 'مثلا: سهراب، مریم...' : 'e.g. Alex'}
              className="w-full px-3 py-2 bg-[var(--bg)] rounded-xl border border-[var(--line)] text-sm font-bold text-[var(--ink)] focus:border-[var(--lapis)] focus:outline-hidden"
            />
          </div>

          {/* Voice Platform Selection */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5 flex items-center gap-1">
              <Headphones size={14} className="text-[var(--turq)]" />
              <span>{language === 'fa' ? 'پلتفرم مکالمه صوتی:' : 'Voice Platform:'}</span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setVoiceProvider('jitsi')}
                className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer active:scale-95 ${
                  voiceProvider === 'jitsi'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--mute)] border-[var(--line)] hover:bg-[var(--panel)]'
                }`}
              >
                <span>{language === 'fa' ? 'تلفن رایگان' : 'Free Voice'}</span>
                <span className="text-[9px] block opacity-80 font-normal">{language === 'fa' ? 'بدون نصب' : 'In-App'}</span>
              </button>

              <button
                type="button"
                onClick={() => setVoiceProvider('meet')}
                className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer active:scale-95 ${
                  voiceProvider === 'meet'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--mute)] border-[var(--line)] hover:bg-[var(--panel)]'
                }`}
              >
                <span>Google Meet</span>
                <span className="text-[9px] block opacity-80 font-normal">{language === 'fa' ? 'گوگل میت' : 'Video call'}</span>
              </button>

              <button
                type="button"
                onClick={() => setVoiceProvider('discord')}
                className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer active:scale-95 ${
                  voiceProvider === 'discord'
                    ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--mute)] border-[var(--line)] hover:bg-[var(--panel)]'
                }`}
              >
                <span>Discord</span>
                <span className="text-[9px] block opacity-80 font-normal">{language === 'fa' ? 'دیسکورد' : 'Voice server'}</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleCreateRoom}
            className="w-full py-3 text-sm font-extrabold uppercase flex items-center justify-center gap-2 mt-2 rounded-xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {isLoading ? (
              <span>{language === 'fa' ? 'در حال ایجاد اتاق...' : 'Creating room...'}</span>
            ) : (
              <>
                <Crown size={18} />
                <span>{language === 'fa' ? 'ساخت اتاق و دریافت کد ⚡' : 'Create Room & Get Code ⚡'}</span>
              </>
            )}
          </button>

        </div>
      )}

      {/* 3. JOIN ROOM FORM */}
      {viewMode === 'join' && (
        <div className="w-full max-w-sm sm:max-w-md my-auto space-y-3 bg-[var(--panel)] p-4 sm:p-5 rounded-[24px] border border-[var(--line)] shadow-xs text-start font-ui">
          
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
            <Users size={20} className="text-[var(--turq)]" />
            <h2 className="text-base font-bold text-[var(--ink)]">
              {language === 'fa' ? 'ورود به اتاق آنلاین' : 'Join Game Room'}
            </h2>
          </div>

          {/* Room Code Input */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              {language === 'fa' ? 'کد اتاق (Room Code):' : 'Room Code:'}
            </label>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder={language === 'fa' ? 'مثلا: AB123' : 'e.g. AB123'}
              className="w-full px-3 py-2.5 bg-[var(--bg)] rounded-xl border border-[var(--line)] text-center text-lg font-mono font-black text-[var(--lapis)] tracking-widest uppercase focus:border-[var(--lapis)] focus:outline-hidden"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              {language === 'fa' ? 'نام شما در بازی:' : 'Your Name:'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={language === 'fa' ? 'مثلا: نیما، پریا...' : 'e.g. Taylor'}
              className="w-full px-3 py-2 bg-[var(--bg)] rounded-xl border border-[var(--line)] text-sm font-bold text-[var(--ink)] focus:border-[var(--lapis)] focus:outline-hidden"
            />
          </div>

          {/* Join Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleJoinRoom}
            className="w-full py-3 text-sm font-extrabold uppercase flex items-center justify-center gap-2 mt-2 rounded-xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {isLoading ? (
              <span>{language === 'fa' ? 'در حال اتصال...' : 'Connecting...'}</span>
            ) : (
              <>
                <Users size={18} />
                <span>{language === 'fa' ? 'ورود به لابی اتاق 🚀' : 'Join Lobby 🚀'}</span>
              </>
            )}
          </button>

        </div>
      )}

      {/* 4. IN LOBBY (Real-Time Synchronized Player List & Teams) */}
      {viewMode === 'in_lobby' && currentRoom && (
        <div className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col justify-between space-y-2 font-ui">
          
          {/* Room PIN & Share Banner */}
          <div className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--mute)] uppercase">{language === 'fa' ? 'کد اتاق:' : 'Room Code:'}</span>
                <span className="px-3 py-1 bg-[var(--bg)] text-[var(--ink)] font-mono text-lg font-black rounded-xl border border-[var(--line)] tracking-widest">
                  {currentRoom.code}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-[var(--bg)] hover:bg-[var(--line)]/50 text-[var(--ink)] rounded-xl border border-[var(--line)] flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                  title={language === 'fa' ? 'کپی کد' : 'Copy Code'}
                >
                  {copiedCode ? <Check size={14} className="text-[var(--turq)]" /> : <Copy size={14} />}
                  <span>{copiedCode ? (language === 'fa' ? 'کپی شد' : 'Copied') : (language === 'fa' ? 'کپی کد' : 'Copy')}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-[var(--lapis-soft)] hover:bg-[var(--lapis-soft)]/80 text-[var(--lapis)] rounded-xl flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                  title={language === 'fa' ? 'کپی لینک مستقیم' : 'Copy Direct Link'}
                >
                  {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                  <span>{language === 'fa' ? 'لینک' : 'Link'}</span>
                </button>
              </div>
            </div>

            {/* Voice Platform Join Bar */}
            {currentRoom.voiceLink && (
              <div className="p-2.5 bg-[var(--bg)] rounded-xl border border-[var(--line)] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                  <PhoneCall size={14} className="text-[var(--turq)]" />
                  <span>
                    {currentRoom.voiceProvider === 'meet' 
                      ? (language === 'fa' ? 'تماس Google Meet' : 'Google Meet Call')
                      : currentRoom.voiceProvider === 'discord' 
                        ? (language === 'fa' ? 'اتاق Discord' : 'Discord Server')
                        : (language === 'fa' ? 'تلفن صوتی بازی' : 'In-Game Voice Room')}
                  </span>
                </div>

                <a
                  href={currentRoom.voiceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-[var(--turq)] text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-xs hover:brightness-105"
                >
                  <span>{language === 'fa' ? 'ورود به تماس' : 'Join Call'}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* Players List in Lobby & Team Breakdown */}
          <div className="flex-1 min-h-0 bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs flex flex-col overflow-y-auto space-y-2">
            
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Users size={14} className="text-[var(--lapis)]" />
                <span>{language === 'fa' ? `بازیکنان متصل (${currentRoom.players.length} نفر):` : `Connected Players (${currentRoom.players.length}):`}</span>
              </span>
              <span className="text-[10px] text-[var(--mute)] font-medium">
                {language === 'fa' ? 'روی نام تیم برای جابجایی کلیک کنید' : 'Click team to switch'}
              </span>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-2 gap-2">
              {currentRoom.teams.map((t) => {
                const teamPlayers = currentRoom.players.filter(p => p.teamId === t.id);
                const isMyTeam = currentRoom.players.find(p => p.id === myPlayerId)?.teamId === t.id;
                const teamName = language === 'fa' 
                  ? `تیم ${t.color === 'BLUE' ? 'آبی' : t.color === 'RED' ? 'قرمز' : t.color === 'GREEN' ? 'سبز' : 'زرد'}`
                  : `Team ${t.color === 'BLUE' ? 'Blue' : t.color === 'RED' ? 'Red' : t.color === 'GREEN' ? 'Green' : 'Yellow'}`;

                return (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-xl border text-start transition-all ${
                      isMyTeam 
                        ? 'border-[var(--lapis)] ring-2 ring-[var(--lapis)]/30 bg-[var(--lapis-soft)]/20' 
                        : 'bg-[var(--bg)] border-[var(--line)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--ink)]">
                        <TeamMascot color={t.color} size={18} />
                        <span>{teamName}</span>
                      </div>

                      {!isMyTeam && (
                        <button
                          onClick={() => handleSwitchTeam(t.id)}
                          className="text-[9px] font-bold bg-[var(--panel)] hover:bg-[var(--line)]/50 text-[var(--ink)] border border-[var(--line)] px-2 py-0.5 rounded-md shadow-xs cursor-pointer"
                        >
                          {language === 'fa' ? 'عضویت' : 'Join'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      {teamPlayers.length === 0 ? (
                        <span className="text-[10px] text-[var(--mute)] italic block">{language === 'fa' ? 'بدون بازیکن' : 'No players'}</span>
                      ) : (
                        teamPlayers.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-xs font-bold text-[var(--ink)] bg-[var(--panel)] p-1.5 rounded-lg border border-[var(--line)]">
                            <span className="truncate">{p.name} {p.isHost && '👑'}</span>
                            {p.deviceId === myDeviceId && (
                              <span className="text-[9px] bg-[var(--turq)] text-white px-1.5 py-0.2 rounded-sm font-bold">
                                {language === 'fa' ? 'من' : 'You'}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Game Rules / Target Languages Pill */}
            <div className="mt-auto pt-2 border-t border-[var(--line)] text-start text-[10.5px] text-[var(--mute)] space-y-0.5 font-ui">
              <div>
                <span className="font-bold text-[var(--ink)]">{language === 'fa' ? 'زبان‌های مسابقه: ' : 'Target Languages: '}</span>
                <span>{currentRoom.settings.targetLanguages?.map(l => NATIVE_LANGUAGE_NAMES[l] || l).join(' + ')}</span>
              </div>
              <div>
                <span className="font-bold text-[var(--ink)]">{language === 'fa' ? 'مدت هر راند: ' : 'Round Duration: '}</span>
                <span>{currentRoom.settings.roundDuration || 60} {language === 'fa' ? 'ثانیه' : 'seconds'}</span>
              </div>
            </div>

          </div>

          {/* Bottom Action (Host Starts or Waiting for Host) */}
          <div className="shrink-0 font-ui">
            {isHost ? (
              <button
                onClick={handleHostStart}
                disabled={isLoading || currentRoom.players.length < 2}
                className="w-full py-3.5 text-base font-extrabold uppercase flex items-center justify-center gap-2 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={20} fill="currentColor" />
                <span>{language === 'fa' ? 'شروع بازی آنلاین برای همه 🚀' : 'Start Remote Game 🚀'}</span>
              </button>
            ) : (
              <div className="p-3.5 bg-[var(--lapis-soft)] text-[var(--lapis)] rounded-2xl border border-[var(--lapis)]/20 font-bold text-xs flex items-center justify-center gap-2 shadow-xs animate-pulse">
                <Sparkles size={16} />
                <span>{language === 'fa' ? 'منتظر میزبان برای زدن دکمه شروع بازی...' : 'Waiting for host to start the game...'}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default OnlineLobbyScreen;
