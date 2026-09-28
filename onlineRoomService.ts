import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  OnlineRoomState, 
  OnlinePlayer, 
  GameSettings, 
  TeamColor, 
  Team, 
  LanguageCard, 
  PlayedCardRecord, 
  RoomReaction 
} from './types';
import { buildSessionCardPool } from './cardsData';
import { getRandomCharacters } from './characters';

/**
 * Get or generate a persistent local device ID for the player
 */
export const getDeviceId = (): string => {
  let id = localStorage.getItem('dor_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('dor_device_id', id);
  }
  return id;
};

/**
 * Generate a memorable 4-6 char room code (e.g. DOUR-829 or 7421)
 */
export const generateRoomCode = (): string => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let code = '';
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
};

/**
 * Create a new multiplayer room hosted by the user
 */
export const createOnlineRoom = async (
  hostName: string, 
  settings: GameSettings,
  voiceProvider: 'meet' | 'discord' | 'jitsi' | 'custom' = 'jitsi',
  customVoiceLink?: string
): Promise<{ roomId: string; roomCode: string; playerId: number }> => {
  const roomCode = generateRoomCode();
  const roomId = `room_${roomCode.toLowerCase()}`;
  const deviceId = getDeviceId();

  const jitsiLink = `https://meet.jit.si/DourParty_${roomCode}`;
  const resolvedVoiceLink = customVoiceLink?.trim() 
    ? customVoiceLink.trim() 
    : voiceProvider === 'jitsi' 
      ? jitsiLink 
      : voiceProvider === 'meet' 
        ? 'https://meet.google.com/new' 
        : 'https://discord.com';

  const hostPlayer: OnlinePlayer = {
    id: 0,
    name: hostName.trim() || 'میزبان بازی',
    teamId: 0,
    teamColor: TeamColor.Blue,
    isHost: true,
    isReady: true,
    deviceId,
    joinedAt: Date.now()
  };

  const initialTeams: Team[] = [
    { id: 0, color: TeamColor.Blue, timeRemaining: settings.roundDuration * 1000, isEliminated: false, playerIds: [0], score: 0, comboStreak: 0 },
    { id: 1, color: TeamColor.Red, timeRemaining: settings.roundDuration * 1000, isEliminated: false, playerIds: [], score: 0, comboStreak: 0 }
  ];

  if (settings.playerCount >= 6) {
    initialTeams.push({ id: 2, color: TeamColor.Green, timeRemaining: settings.roundDuration * 1000, isEliminated: false, playerIds: [], score: 0, comboStreak: 0 });
  }
  if (settings.playerCount >= 8) {
    initialTeams.push({ id: 3, color: TeamColor.Yellow, timeRemaining: settings.roundDuration * 1000, isEliminated: false, playerIds: [], score: 0, comboStreak: 0 });
  }

  const roomState: OnlineRoomState = {
    id: roomId,
    code: roomCode,
    hostId: deviceId,
    hostName: hostPlayer.name,
    status: 'lobby',
    currentRound: 1,
    activePlayerIndex: 0,
    settings,
    teams: initialTeams,
    players: [hostPlayer],
    currentCard: null,
    roundTimer: settings.roundDuration * 1000,
    isTimerRunning: false,
    playedCards: [],
    voiceProvider,
    voiceLink: resolvedVoiceLink,
    reactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const roomRef = doc(db, 'rooms', roomId);
  await setDoc(roomRef, roomState);

  return { roomId, roomCode, playerId: 0 };
};

/**
 * Join an existing room with code
 */
export const joinOnlineRoom = async (
  roomCodeInput: string,
  playerNameInput: string
): Promise<{ roomId: string; room: OnlineRoomState; playerId: number }> => {
  const codeClean = roomCodeInput.trim().toUpperCase();
  const roomId = `room_${codeClean.toLowerCase()}`;
  const deviceId = getDeviceId();

  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('اتاق پیدا نشد! لطفا کد اتاق را بررسی کنید.');
  }

  const room = roomSnap.data() as OnlineRoomState;

  // Check if this device is already in the room
  const existingPlayerIndex = room.players.findIndex(p => p.deviceId === deviceId);
  if (existingPlayerIndex !== -1) {
    // Already joined, update name if changed
    const updatedPlayers = [...room.players];
    if (playerNameInput.trim()) {
      updatedPlayers[existingPlayerIndex].name = playerNameInput.trim();
      await updateDoc(roomRef, {
        players: updatedPlayers,
        updatedAt: new Date().toISOString()
      });
    }
    return { roomId, room, playerId: updatedPlayers[existingPlayerIndex].id };
  }

  // If game already finished or full
  if (room.status === 'game_over') {
    throw new Error('این بازی به پایان رسیده است.');
  }

  // Assign team with fewest players
  const teamColors = [TeamColor.Blue, TeamColor.Red, TeamColor.Green, TeamColor.Yellow];
  const maxTeams = Math.max(2, Math.floor(room.settings.playerCount / 2));
  
  // Count players per team
  const teamCounts = Array.from({ length: maxTeams }).map((_, idx) => {
    return room.players.filter(p => p.teamId === idx).length;
  });

  // Find index of min team
  let targetTeamId = 0;
  let minCount = Infinity;
  teamCounts.forEach((count, idx) => {
    if (count < minCount) {
      minCount = count;
      targetTeamId = idx;
    }
  });

  const nextId = room.players.length > 0 ? Math.max(...room.players.map(p => p.id)) + 1 : 0;
  const newPlayer: OnlinePlayer = {
    id: nextId,
    name: playerNameInput.trim() || `بازیکن ${nextId + 1}`,
    teamId: targetTeamId,
    teamColor: teamColors[targetTeamId],
    isHost: false,
    isReady: true,
    deviceId,
    joinedAt: Date.now()
  };

  // Update teams playerIds
  const updatedTeams = room.teams.map(t => {
    if (t.id === targetTeamId) {
      return { ...t, playerIds: [...(t.playerIds || []), nextId] };
    }
    return t;
  });

  const updatedPlayers = [...room.players, newPlayer];

  await updateDoc(roomRef, {
    players: updatedPlayers,
    teams: updatedTeams,
    updatedAt: new Date().toISOString()
  });

  return { roomId, room: { ...room, players: updatedPlayers, teams: updatedTeams }, playerId: nextId };
};

/**
 * Subscribe in real-time to room state changes
 */
export const subscribeToRoom = (
  roomId: string,
  onUpdate: (room: OnlineRoomState | null) => void,
  onError?: (err: Error) => void
) => {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as OnlineRoomState);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Room snapshot error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Switch team in lobby
 */
export const switchPlayerTeam = async (
  roomId: string, 
  playerId: number, 
  newTeamId: number
) => {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as OnlineRoomState;
  const teamColors = [TeamColor.Blue, TeamColor.Red, TeamColor.Green, TeamColor.Yellow];

  const updatedPlayers = room.players.map(p => {
    if (p.id === playerId) {
      return { ...p, teamId: newTeamId, teamColor: teamColors[newTeamId] || TeamColor.Blue };
    }
    return p;
  });

  const updatedTeams = room.teams.map(t => {
    const pIds = updatedPlayers.filter(p => p.teamId === t.id).map(p => p.id);
    return { ...t, playerIds: pIds };
  });

  await updateDoc(roomRef, {
    players: updatedPlayers,
    teams: updatedTeams,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Host starts the online game
 */
export const startOnlineGame = async (roomId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as OnlineRoomState;

  // Build full card pool
  const pool = buildSessionCardPool(
    room.settings.targetLanguages || ['en-US', 'nl'],
    room.settings.selectedCategories,
    room.settings.cefrLevel || 'all',
    room.settings.nativeLanguage || room.settings.language || 'fa',
    room.settings.cardGameMode || 'mixed'
  );

  const firstCard = pool.length > 0 ? pool[0] : null;

  // Set initial team durations
  const initialRoundMs = (room.settings.roundDuration || 60) * 1000;
  const initializedTeams = room.teams.map(t => ({
    ...t,
    timeRemaining: initialRoundMs,
    score: 0,
    comboStreak: 0,
    isEliminated: false
  }));

  await updateDoc(roomRef, {
    status: 'playing',
    currentRound: 1,
    activePlayerIndex: 0,
    cardPool: pool,
    cardPoolIndex: 1,
    currentCard: firstCard,
    roundTimer: initialRoundMs,
    isTimerRunning: true,
    teams: initializedTeams,
    playedCards: [],
    updatedAt: new Date().toISOString()
  });
};

/**
 * Process a correct guess or pass in remote gameplay
 */
export const recordOnlineCardAction = async (
  roomId: string,
  isCorrect: boolean,
  card: LanguageCard,
  answeringPlayerName: string,
  answeringTeamColor: TeamColor,
  timeSpentSeconds: number
) => {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as OnlineRoomState;
  const pool = room.cardPool || [];
  const nextIdx = (room.cardPoolIndex || 1);
  const nextCard = nextIdx < pool.length ? pool[nextIdx] : null;

  const pointsEarned = isCorrect ? (card.points || 1) * (card.isGolden ? 2 : 1) : 0;

  const record: PlayedCardRecord = {
    card,
    guessedCorrectly: isCorrect,
    answeringPlayerName,
    answeringTeamColor,
    timeSpentSeconds,
    wasSpeedBonus: timeSpentSeconds < 10,
    pointsEarned,
    usedHint: false
  };

  // Update team score & combo
  const updatedTeams = room.teams.map(t => {
    if (t.color === answeringTeamColor) {
      const newScore = (t.score || 0) + pointsEarned;
      const newCombo = isCorrect ? (t.comboStreak || 0) + 1 : 0;
      return { ...t, score: newScore, comboStreak: newCombo };
    }
    return t;
  });

  const updatedPlayedCards = [...(room.playedCards || []), record];

  await updateDoc(roomRef, {
    currentCard: nextCard,
    cardPoolIndex: nextIdx + 1,
    teams: updatedTeams,
    playedCards: updatedPlayedCards,
    updatedAt: new Date().toISOString()
  });
};

/**
 * End turn or advance round
 */
export const advanceOnlineTurn = async (
  roomId: string,
  nextPlayerIdx: number,
  nextRound: number,
  isGameOver: boolean = false
) => {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as OnlineRoomState;
  const roundMs = (room.settings.roundDuration || 60) * 1000;

  if (isGameOver) {
    await updateDoc(roomRef, {
      status: 'game_over',
      isTimerRunning: false,
      updatedAt: new Date().toISOString()
    });
    return;
  }

  const pool = room.cardPool || [];
  const nextIdx = room.cardPoolIndex || 0;
  const nextCard = nextIdx < pool.length ? pool[nextIdx] : null;

  await updateDoc(roomRef, {
    status: 'playing',
    currentRound: nextRound,
    activePlayerIndex: nextPlayerIdx,
    roundTimer: roundMs,
    isTimerRunning: true,
    currentCard: nextCard,
    cardPoolIndex: nextIdx + 1,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Send real-time emoji reaction to room
 */
export const sendReactionToRoom = async (
  roomId: string,
  sender: string,
  emoji: string
) => {
  const roomRef = doc(db, 'rooms', roomId);
  const reaction: RoomReaction = {
    id: Math.random().toString(36).substring(2, 9),
    sender,
    emoji,
    timestamp: Date.now()
  };

  await updateDoc(roomRef, {
    reactions: arrayUnion(reaction),
    updatedAt: new Date().toISOString()
  });
};

/**
 * Sync timer from host
 */
export const syncRoomTimer = async (
  roomId: string,
  roundTimer: number,
  teams: Team[]
) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    roundTimer,
    teams,
    updatedAt: new Date().toISOString()
  });
};
