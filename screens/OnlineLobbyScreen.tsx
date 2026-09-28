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
  PhoneCall
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
          setErrorMessage('اتاق بسته شد یا وجود ندارد.');
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
        setErrorMessage(err.message);
      }
    );

    return () => unsubscribe();
  }, [currentRoom?.id, myPlayerId]);

  // Handle Create Room
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setErrorMessage(language === 'fa' ? 'لطفا نام خود را وارد کنید' : 'Please enter your name');
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
      setErrorMessage(err.message || 'خطا در ایجاد اتاق');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setErrorMessage(language === 'fa' ? 'لطفا کد اتاق را وارد کنید' : 'Please enter room code');
      return;
    }
    if (!playerName.trim()) {
      setErrorMessage(language === 'fa' ? 'لطفا نام خود را وارد کنید' : 'Please enter your name');
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
      setErrorMessage(err.message || 'اتاق پیدا نشد');
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
      `🎮 بیا تو بازی دورهمی یادگیری زبان (دور)!\nکد اتاق: ${currentRoom.code}\nلینک ورود مستقیم:\n${link}`
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
      setErrorMessage(err.message || 'خطا در شروع بازی');
      setIsLoading(false);
    }
  };

  const isHost = currentRoom?.hostId === myDeviceId;

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3.5 sm:p-4 text-center select-none overflow-y-auto overscroll-contain text-[#1E1B2E] font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
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
          className="flex items-center gap-1 bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] px-3 py-1.5 rounded-[12px] text-xs font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]"
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          <span>{language === 'fa' ? 'بازگشت' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5 bg-[#F2B63D] text-[#1E1B2E] px-3 py-1 rounded-[12px] font-bold text-xs border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
          <Globe size={14} className="text-[#E0603F]" />
          <span>{language === 'fa' ? 'بازی آنلاین راه دور' : 'Remote Multiplayer'}</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="w-full mb-2 p-2 bg-[#fee2e2] text-[#b91c1c] rounded-[14px] text-xs font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] animate-shake">
          {errorMessage}
        </div>
      )}

      {/* 1. SELECTION MODE (Host vs Join) */}
      {viewMode === 'select' && (
        <div className="w-full max-w-sm my-auto space-y-3 font-ui">
          
          <div className="bg-[#FFFBF4] text-[#1E1B2E] p-4 rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E]">
            <div className="flex justify-center mb-2">
              <TeamMascot color="PARTY" size={70} />
            </div>
            <h1 className="text-2xl font-bold font-display text-[#1E1B2E] mb-1">
              {language === 'fa' ? 'دورهمی آنلاین با دوستان' : 'Online Party Room'}
            </h1>
            <p className="text-xs text-[#1E9E93] font-bold leading-relaxed">
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
              className="pixel-btn pixel-btn-orange w-full py-3.5 text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[16px]"
            >
              <Crown size={20} />
              <span>{language === 'fa' ? 'ایجاد اتاق جدید (میزبان)' : 'Host New Room'}</span>
              <Zap size={18} color="#F2B63D" fill="#F2B63D" />
            </button>

            {/* Join Room Button */}
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('join');
              }}
              className="pixel-btn pixel-btn-teal w-full py-3.5 text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[16px]"
            >
              <Users size={20} />
              <span>{language === 'fa' ? 'ورود با کد اتاق (بازیکن)' : 'Join with Room Code'}</span>
            </button>
          </div>

          {/* Voice Helper Info Box */}
          <div className="bg-[#FFFBF4] text-[#1E1B2E] p-3 rounded-[16px] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] text-start space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-[#1E9E93] font-bold">
              <Headphones size={14} />
              <span>{language === 'fa' ? 'نحوه ارتباط صوتی:' : 'Voice Chat Setup:'}</span>
            </div>
            <p className="text-[#1E1B2E]/70 font-medium">
              {language === 'fa'
                ? 'می‌توانید به یک تماس صوتی در گوگل میت (Google Meet)، دیسکورد (Discord) یا اتاق صوتی رایگان درون بازی وصل شوید.'
                : 'Connect to a Discord call, Google Meet, or instant in-app voice room with your friends.'}
            </p>
          </div>

        </div>
      )}

      {/* 2. CREATE ROOM FORM */}
      {viewMode === 'create' && (
        <div className="w-full max-w-sm my-auto space-y-3 bg-[#FFFBF4] p-4 rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] text-start font-ui">
          
          <div className="flex items-center gap-2 border-b-2 pb-2 border-[#1E1B2E]/20">
            <Crown size={20} className="text-[#E0603F]" />
            <h2 className="text-base font-bold text-[#1E1B2E]">
              {language === 'fa' ? 'تنظیمات اتاق آنلاین' : 'Host Room Setup'}
            </h2>
          </div>

          {/* Host Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#1E1B2E] mb-1">
              {language === 'fa' ? 'نام شما (میزبان):' : 'Your Name (Host):'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={language === 'fa' ? 'مثلا: سهراب، مریم...' : 'e.g. Alex'}
              className="w-full px-3 py-2 bg-[#F4EDE1] rounded-[12px] border-2 border-[#1E1B2E] text-sm font-bold text-[#1E1B2E] focus:outline-none"
            />
          </div>

          {/* Voice Platform Selection */}
          <div>
            <label className="block text-xs font-bold text-[#1E1B2E] mb-1.5 flex items-center gap-1">
              <Headphones size={14} className="text-[#E0603F]" />
              <span>{language === 'fa' ? 'پلتفرم مکالمه صوتی:' : 'Voice Platform:'}</span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setVoiceProvider('jitsi')}
                className={`p-2 rounded-[12px] border-2 border-[#1E1B2E] text-center font-bold text-[11px] transition-all ${
                  voiceProvider === 'jitsi'
                    ? 'bg-[#1E9E93] text-white shadow-[2px_2px_0px_0px_#1E1B2E]'
                    : 'bg-[#F4EDE1] text-[#1E1B2E]/70'
                }`}
              >
                <span>تلفن رایگان</span>
                <span className="text-[9px] block opacity-80 font-normal">بدون نصب</span>
              </button>

              <button
                type="button"
                onClick={() => setVoiceProvider('meet')}
                className={`p-2 rounded-[12px] border-2 border-[#1E1B2E] text-center font-bold text-[11px] transition-all ${
                  voiceProvider === 'meet'
                    ? 'bg-[#F2B63D] text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                    : 'bg-[#F4EDE1] text-[#1E1B2E]/70'
                }`}
              >
                <span>Google Meet</span>
                <span className="text-[9px] block opacity-80 font-normal">گوگل میت</span>
              </button>

              <button
                type="button"
                onClick={() => setVoiceProvider('discord')}
                className={`p-2 rounded-[12px] border-2 border-[#1E1B2E] text-center font-bold text-[11px] transition-all ${
                  voiceProvider === 'discord'
                    ? 'bg-[#E0603F] text-white shadow-[2px_2px_0px_0px_#1E1B2E]'
                    : 'bg-[#F4EDE1] text-[#1E1B2E]/70'
                }`}
              >
                <span>Discord</span>
                <span className="text-[9px] block opacity-80 font-normal">دیسکورد</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleCreateRoom}
            className="pixel-btn pixel-btn-orange w-full py-3 text-sm font-bold uppercase flex items-center justify-center gap-2 mt-2 rounded-[14px]"
          >
            {isLoading ? (
              <span>در حال ایجاد اتاق...</span>
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
        <div className="w-full max-w-sm my-auto space-y-3 bg-[#FFFBF4] p-4 rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] text-start font-ui">
          
          <div className="flex items-center gap-2 border-b-2 pb-2 border-[#1E1B2E]/20">
            <Users size={20} className="text-[#1E9E93]" />
            <h2 className="text-base font-bold text-[#1E1B2E]">
              {language === 'fa' ? 'ورود به اتاق آنلاین' : 'Join Game Room'}
            </h2>
          </div>

          {/* Room Code Input */}
          <div>
            <label className="block text-xs font-bold text-[#1E1B2E] mb-1">
              {language === 'fa' ? 'کد اتاق (Room Code):' : 'Room Code:'}
            </label>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="مثلا: AB123"
              className="w-full px-3 py-2 bg-[#F4EDE1] rounded-[12px] border-2 border-[#1E1B2E] text-center text-lg font-mono font-bold text-[#E0603F] tracking-widest uppercase focus:outline-none"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold text-[#1E1B2E] mb-1">
              {language === 'fa' ? 'نام شما در بازی:' : 'Your Name:'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={language === 'fa' ? 'مثلا: نیما، پریا...' : 'e.g. Taylor'}
              className="w-full px-3 py-2 bg-[#F4EDE1] rounded-[12px] border-2 border-[#1E1B2E] text-sm font-bold text-[#1E1B2E] focus:outline-none"
            />
          </div>

          {/* Join Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleJoinRoom}
            className="pixel-btn pixel-btn-teal w-full py-3 text-sm font-bold uppercase flex items-center justify-center gap-2 mt-2 rounded-[14px]"
          >
            {isLoading ? (
              <span>در حال اتصال...</span>
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
        <div className="w-full max-w-sm flex-1 flex flex-col justify-between space-y-2 font-ui">
          
          {/* Room PIN & Share Banner */}
          <div className="bg-[#FFFBF4] p-3 rounded-[20px] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1E1B2E]/70 uppercase">کد اتاق:</span>
                <span className="px-3 py-1 bg-[#F4EDE1] text-[#1E1B2E] font-mono text-lg font-bold rounded-[12px] border-2 border-[#1E1B2E] tracking-widest">
                  {currentRoom.code}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] rounded-[10px] border-2 border-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E] flex items-center gap-1 text-xs font-bold"
                  title="کپی کد"
                >
                  {copiedCode ? <Check size={14} className="text-[#1E9E93]" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'کپی شد' : 'کپی کد'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] rounded-[10px] border-2 border-[#1E1B2E] flex items-center gap-1 text-xs font-bold shadow-[1px_1px_0px_0px_#1E1B2E]"
                  title="کپی لینک مستقیم"
                >
                  {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                  <span>لینک</span>
                </button>
              </div>
            </div>

            {/* Voice Platform Join Bar */}
            {currentRoom.voiceLink && (
              <div className="p-2 bg-[#F4EDE1] rounded-[12px] border border-[#1E1B2E] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1B2E]">
                  <PhoneCall size={14} className="text-[#E0603F]" />
                  <span>
                    {currentRoom.voiceProvider === 'meet' ? 'تماس Google Meet' : currentRoom.voiceProvider === 'discord' ? 'اتاق Discord' : 'تلفن صوتی بازی'}
                  </span>
                </div>

                <a
                  href={currentRoom.voiceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-[#1E9E93] text-white font-bold text-[11px] rounded-[8px] border border-[#1E1B2E] flex items-center gap-1 shadow-[1px_1px_0px_0px_#1E1B2E]"
                >
                  <span>ورود به تماس</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* Players List in Lobby & Team Breakdown */}
          <div className="flex-1 min-h-0 bg-[#FFFBF4] p-3 rounded-[20px] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] flex flex-col overflow-y-auto space-y-2">
            
            <div className="flex items-center justify-between border-b-2 pb-1.5 border-[#1E1B2E]/20">
              <span className="text-xs font-bold text-[#1E1B2E] flex items-center gap-1.5">
                <Users size={14} className="text-[#E0603F]" />
                <span>بازیکنان متصل ({currentRoom.players.length} نفر):</span>
              </span>
              <span className="text-[10px] text-[#1E1B2E]/70 font-bold">
                روی نام تیم برای جابجایی کلیک کنید
              </span>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-2 gap-2">
              {currentRoom.teams.map((t) => {
                const config = COLORS_MAP[t.color] || { bg: 'bg-[#1E9E93]', text: 'text-[#1E1B2E]', hex: '#1E9E93' };
                const teamPlayers = currentRoom.players.filter(p => p.teamId === t.id);
                const isMyTeam = currentRoom.players.find(p => p.id === myPlayerId)?.teamId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`p-2 rounded-[14px] border-2 border-[#1E1B2E] text-start transition-all ${
                      isMyTeam ? 'ring-2 ring-[#E0603F] bg-[#FFF8FD]' : 'bg-[#F4EDE1]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#1E1B2E]">
                        <TeamMascot color={t.color} size={18} />
                        <span>تیم {t.color === 'BLUE' ? 'آبی' : t.color === 'RED' ? 'قرمز' : t.color === 'GREEN' ? 'سبز' : 'زرد'}</span>
                      </div>

                      {!isMyTeam && (
                        <button
                          onClick={() => handleSwitchTeam(t.id)}
                          className="text-[9px] font-bold bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] border border-[#1E1B2E] px-1.5 py-0.5 rounded-[6px] shadow-[1px_1px_0px_0px_#1E1B2E]"
                        >
                          عضویت
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      {teamPlayers.length === 0 ? (
                        <span className="text-[10px] text-[#1E1B2E]/50 italic block">بدون بازیکن</span>
                      ) : (
                        teamPlayers.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-xs font-bold text-[#1E1B2E] bg-[#FFFBF4] p-1 rounded-[8px] border border-[#1E1B2E]">
                            <span className="truncate">{p.name} {p.isHost && '👑'}</span>
                            {p.deviceId === myDeviceId && (
                              <span className="text-[9px] bg-[#1E9E93] text-white px-1 rounded font-bold">
                                من
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
            <div className="mt-auto pt-2 border-t-2 border-[#1E1B2E]/20 text-start text-[10.5px] text-[#1E1B2E]/70 space-y-0.5 font-ui">
              <div>
                <span className="font-bold text-[#1E1B2E]">زبان‌های مسابقه: </span>
                <span>{currentRoom.settings.targetLanguages?.map(l => NATIVE_LANGUAGE_NAMES[l] || l).join(' + ')}</span>
              </div>
              <div>
                <span className="font-bold text-[#1E1B2E]">مدت هر راند: </span>
                <span>{currentRoom.settings.roundDuration || 60} ثانیه</span>
              </div>
            </div>

          </div>

          {/* Bottom Action (Host Starts or Waiting for Host) */}
          <div className="shrink-0 font-ui">
            {isHost ? (
              <button
                onClick={handleHostStart}
                disabled={isLoading || currentRoom.players.length < 2}
                className="pixel-btn pixel-btn-orange w-full py-3.5 text-base font-bold uppercase flex items-center justify-center gap-2 rounded-[16px]"
              >
                <Play size={20} />
                <span>{language === 'fa' ? 'شروع بازی آنلاین برای همه 🚀' : 'Start Remote Game 🚀'}</span>
              </button>
            ) : (
              <div className="p-3 bg-[#F2B63D] text-[#1E1B2E] rounded-[16px] border-2 border-[#1E1B2E] font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#1E1B2E] animate-pulse">
                <Sparkles size={16} />
                <span>منتظر میزبان برای زدن دکمه شروع بازی...</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default OnlineLobbyScreen;
