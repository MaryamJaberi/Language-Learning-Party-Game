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
  RoomReaction,
  OnlineDuelRoom,
  OnlineDuelPlayer,
  Language,
  CEFRLevel
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

// ========================================================
// 1v1 REAL-TIME ONLINE DUEL ACROSS 2 SEPARATE PHONES
// ========================================================

/**
 * Host creates a 1v1 Duel Room for play across 2 separate phones
 */
export const createOnlineDuelRoom = async (
  hostName: string,
  hostAvatar: string,
  targetLanguage: Language,
  nativeLanguage: Language,
  cefrLevel: CEFRLevel,
  winningScore: number,
  cards: LanguageCard[],
  sabotageEnabled: boolean = true
): Promise<OnlineDuelRoom> => {
  const roomId = 'duel_' + Math.random().toString(36).substring(2, 9);
  const roomCode = generateRoomCode();
  const hostId = getDeviceId();

  const duelRoom: OnlineDuelRoom = {
    roomId,
    roomCode,
    status: 'waiting',
    targetLanguage,
    nativeLanguage,
    cefrLevel,
    winningScore,
    sabotageEnabled,
    player1: {
      id: hostId,
      name: hostName || 'Player 1',
      avatar: hostAvatar || '🦊',
      score: 0,
      streak: 0,
      sabotageUsed: false,
      isLocked: false
    },
    cards,
    cardIndex: 0,
    roundWinner: null,
    reactionDiffMs: null,
    matchWinner: null,
    sabotageTarget: null,
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'rooms', roomId), duelRoom);
  return duelRoom;
};

/**
 * Guest joins the 1v1 Duel Room from their phone using the 4-6 char code
 */
export const joinOnlineDuelRoom = async (
  roomCode: string,
  guestName: string,
  guestAvatar: string
): Promise<{ room: OnlineDuelRoom; myPlayerRole: 'p1' | 'p2' } | { error: string }> => {
  const cleanCode = roomCode.trim().toUpperCase();
  const q = query(collection(db, 'rooms'), where('roomCode', '==', cleanCode));
  const snap = await getDocs(q);

  if (snap.empty) {
    return { error: 'اتاقی با این کد یافت نشد. لطفاً کد را بررسی کنید.' };
  }

  const roomDoc = snap.docs[0];
  const room = roomDoc.data() as OnlineDuelRoom;
  const myId = getDeviceId();

  if (room.player1.id === myId) {
    return { room, myPlayerRole: 'p1' };
  }

  if (room.player2 && room.player2.id === myId) {
    return { room, myPlayerRole: 'p2' };
  }

  if (room.player2 && room.player2.id !== myId) {
    return { error: 'این اتاق تکمیل شده است (ظرفیت دوئل ۲ نفر است).' };
  }

  const player2: OnlineDuelPlayer = {
    id: myId,
    name: guestName || 'Player 2',
    avatar: guestAvatar || '🦁',
    score: 0,
    streak: 0,
    sabotageUsed: false,
    isLocked: false
  };

  const updatedRoom: OnlineDuelRoom = {
    ...room,
    player2,
    status: 'playing',
    updatedAt: new Date().toISOString()
  };

  await updateDoc(doc(db, 'rooms', room.roomId), {
    player2,
    status: 'playing',
    updatedAt: new Date().toISOString()
  });

  return { room: updatedRoom, myPlayerRole: 'p2' };
};

/**
 * Submit an answer in real-time in the Online Duel
 */
export const submitOnlineDuelAnswer = async (
  roomId: string,
  playerRole: 'p1' | 'p2',
  isCorrect: boolean,
  reactionMs: number
) => {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as OnlineDuelRoom;
  if (room.status !== 'playing' || room.roundWinner || room.matchWinner) return;

  const now = Date.now();

  if (!isCorrect) {
    // Lock out the failing player for 1400ms
    const updatePayload: any = { updatedAt: new Date().toISOString() };
    if (playerRole === 'p1') {
      updatePayload['player1.isLocked'] = true;
    } else {
      updatePayload['player2.isLocked'] = true;
    }
    await updateDoc(roomRef, updatePayload);
    setTimeout(async () => {
      try {
        const unlockPayload: any = { updatedAt: new Date().toISOString() };
        if (playerRole === 'p1') unlockPayload['player1.isLocked'] = false;
        else unlockPayload['player2.isLocked'] = false;
        await updateDoc(roomRef, unlockPayload);
      } catch (e) {}
    }, 1400);
    return;
  }

  // CORRECT ANSWER!
  const isP1 = playerRole === 'p1';
  const player = isP1 ? room.player1 : room.player2;
  if (!player) return;

  const newStreak = player.streak + 1;
  const addedPoints = newStreak >= 2 ? 2 : 1;
  const newScore = player.score + addedPoints;
  const isMatchWon = newScore >= room.winningScore;

  const updatePayload: any = {
    roundWinner: playerRole,
    reactionDiffMs: reactionMs,
    matchWinner: isMatchWon ? playerRole : null,
    status: isMatchWon ? 'finished' : 'playing',
    updatedAt: new Date().toISOString()
  };

  if (isP1) {
    updatePayload['player1.score'] = newScore;
    updatePayload['player1.streak'] = newStreak;
    if (room.player2) updatePayload['player2.streak'] = 0;
  } else {
    updatePayload['player2.score'] = newScore;
    updatePayload['player2.streak'] = newStreak;
    updatePayload['player1.streak'] = 0;
  }

  await updateDoc(roomRef, updatePayload);

  // Advance to next card after 1.3s if match not over
  if (!isMatchWon) {
    setTimeout(async () => {
      try {
        const latestSnap = await getDoc(roomRef);
        if (latestSnap.exists()) {
          const latest = latestSnap.data() as OnlineDuelRoom;
          if (latest.status === 'playing') {
            await updateDoc(roomRef, {
              cardIndex: latest.cardIndex + 1,
              roundWinner: null,
              reactionDiffMs: null,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (e) {}
    }, 1300);
  }
};

/**
 * Trigger online sabotage shock against opponent
 */
export const triggerOnlineDuelSabotage = async (
  roomId: string,
  byPlayerRole: 'p1' | 'p2'
) => {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as OnlineDuelRoom;
  if (!room.sabotageEnabled) return;

  const targetRole = byPlayerRole === 'p1' ? 'p2' : 'p1';
  const updatePayload: any = {
    sabotageTarget: targetRole,
    updatedAt: new Date().toISOString()
  };

  if (byPlayerRole === 'p1') {
    if (room.player1.sabotageUsed) return;
    updatePayload['player1.sabotageUsed'] = true;
  } else {
    if (room.player2?.sabotageUsed) return;
    updatePayload['player2.sabotageUsed'] = true;
  }

  await updateDoc(roomRef, updatePayload);

  // Clear dizzy shock after 1200ms
  setTimeout(async () => {
    try {
      await updateDoc(roomRef, {
        sabotageTarget: null,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {}
  }, 1200);
};

/**
 * Rematch an online duel
 */
export const rematchOnlineDuel = async (roomId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  await updateDoc(roomRef, {
    status: 'playing',
    'player1.score': 0,
    'player1.streak': 0,
    'player1.sabotageUsed': false,
    'player1.isLocked': false,
    'player2.score': 0,
    'player2.streak': 0,
    'player2.sabotageUsed': false,
    'player2.isLocked': false,
    cardIndex: 0,
    roundWinner: null,
    matchWinner: null,
    reactionDiffMs: null,
    sabotageTarget: null,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Subscribe in real-time to a 1v1 Online Duel Room
 */
export const subscribeToOnlineDuelRoom = (
  roomId: string,
  onUpdate: (room: OnlineDuelRoom | null) => void,
  onError?: (err: Error) => void
) => {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as OnlineDuelRoom);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      onError?.(error);
    }
  );
};

