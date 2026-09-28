export enum TeamColor {
  Blue = 'BLUE',
  Red = 'RED',
  Green = 'GREEN',
  Yellow = 'YELLOW'
}

export type Language = 
  | 'fa' | 'en' | 'en-US' | 'nl' | 'de' | 'fr' | 'es' | 'it' | 'ar' | 'tr'
  | 'ru' | 'zh' | 'ja' | 'ko' | 'hi' | 'pt' | 'pl' | 'uk' | 'sv' | 'no'
  | 'da' | 'fi' | 'el' | 'cs' | 'ro' | 'hu' | 'id' | 'vi' | 'th' | 'ur'
  | 'ku' | 'he' | 'ms' | 'tl' | 'hy' | 'ka' | 'az' | 'bn';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';

export type ContentType = 
  | 'Vocabulary' 
  | 'Phrase' 
  | 'Sentence' 
  | 'Situation' 
  | 'Question' 
  | 'Response' 
  | 'FillInTheBlank';

export type LearningMode = 
  | 'Explain' 
  | 'Translate' 
  | 'Speak' 
  | 'Complete' 
  | 'Situation' 
  | 'Reverse';

export type CardGameMode = 'mixed' | 'reverse' | 'standard';

export type PowerCardType = 'time_boost' | 'hint_clue' | 'mirror_challenge';

export interface LanguageCard {
  id: string;
  nativeLanguage?: Language;
  targetLanguage: Language;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  contentType: ContentType;
  learningMode: LearningMode;
  prompt: string; // The instruction or context for the active player
  targetText: string; // The target word/phrase/sentence the partner must say
  translation: string; // Native language translation
  hint?: string; // Optional clue/hint
  grammarPoint?: string; // Grammar pattern or rule (e.g. "Mag ik...?", "Present Perfect")
  pronunciation?: string; // Phonetic transcription or pronunciation guide
  difficulty: 'easy' | 'medium' | 'hard';
  points: number; // 1, 2, 3, or 4
  isGolden?: boolean; // Golden card (2x points bonus!)
  isReverse?: boolean; // Reverse translation flag
}

export interface Player {
  id: number;
  name: string;
  avatar?: string;
  teamId: number;
  teamColor: TeamColor;
}

export interface Team {
  id: number;
  color: TeamColor;
  timeRemaining: number;
  isEliminated: boolean;
  playerIds: number[];
  score?: number; // Total points earned
  comboStreak?: number; // Current streak of consecutive correct answers
  powerCards?: PowerCardType[];
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'all';

export interface GameSettings {
  playerCount: 4 | 6 | 8;
  roundsCount: number;
  roundDuration: number;
  difficulty?: DifficultyLevel;
  cefrLevel?: CEFRLevel;
  selectedCategories: string[];
  playerNames: string[];
  playerAvatars?: string[];
  language: Language; // App UI language / Native reference language
  nativeLanguage?: Language; // Native / support language
  targetLanguages: Language[]; // Array of selected target languages (e.g. ['nl', 'en-US', 'de'])
  soundEnabled?: boolean;
  autoPronounceOnCorrect?: boolean; // Hear native speech pronunciation when answered correctly
  cardGameMode?: CardGameMode; // 'mixed' | 'reverse' | 'standard'
  passPhoneScreenEnabled?: boolean;
  powerCardsEnabled?: boolean;
  coachModeEnabled?: boolean;
}

export interface PlayedCardRecord {
  card: LanguageCard;
  guessedCorrectly: boolean;
  answeringPlayerName: string;
  answeringTeamColor: TeamColor;
  timeSpentSeconds: number;
  wasSpeedBonus: boolean;
  pointsEarned: number;
  usedHint: boolean;
}

export interface LearningStats {
  totalCards: number;
  correctCards: number;
  accuracyPercent: number;
  totalPoints: number;
  byLanguage: Record<string, { total: number; correct: number }>;
  byTopic: Record<string, { total: number; correct: number }>;
  byLevel: Record<string, { total: number; correct: number }>;
  missedCards: LanguageCard[];
}

export interface GameHistoryEntry {
  id: string;
  date: string;
  players: string[];
  winnerColor: TeamColor | 'TIE';
  winnerNames: string[];
  language: Language;
  targetLanguages?: Language[];
  cefrLevel?: CEFRLevel;
  totalScore?: number;
  playedCardsCount?: number;
  accuracy?: number;
}

export enum GameStatus {
  Splash = 'SPLASH',
  LanguageSelect = 'LANGUAGE_SELECT',
  Setup = 'SETUP',
  Categories = 'CATEGORIES',
  Players = 'PLAYERS',
  SeatingConfirm = 'SEATING_CONFIRM',
  ActiveTurn = 'ACTIVE_TURN',
  PassPhone = 'PASS_PHONE',
  Paused = 'PAUSED',
  RoundEnded = 'ROUND_ENDED',
  TeamEliminated = 'TEAM_ELIMINATED',
  WordExhaustion = 'WORD_EXHAUSTION',
  GameEnded = 'GAME_ENDED',
  WinnerScreen = 'WINNER_SCREEN',
  // Backward-compatibility aliases
  RoundStarting = 'PASS_PHONE',
  Playing = 'ACTIVE_TURN',
  RoundFinished = 'ROUND_ENDED',
  GameOver = 'WINNER_SCREEN',
  Help = 'PAUSED'
}

export interface OnlinePlayer {
  id: number;
  name: string;
  teamId: number;
  teamColor: TeamColor;
  isHost: boolean;
  isReady: boolean;
  deviceId: string;
  avatar?: string;
  joinedAt?: number;
}

export interface RoomReaction {
  id: string;
  sender: string;
  emoji: string;
  timestamp: number;
}

export interface OnlineRoomState {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  status: 'lobby' | 'seating' | 'playing' | 'round_ended' | 'game_over';
  currentRound: number;
  activePlayerIndex: number;
  settings: GameSettings;
  teams: Team[];
  players: OnlinePlayer[];
  currentCard: LanguageCard | null;
  cardPool?: LanguageCard[];
  cardPoolIndex?: number;
  roundTimer: number;
  isTimerRunning: boolean;
  playedCards: PlayedCardRecord[];
  voiceProvider?: 'meet' | 'discord' | 'jitsi' | 'custom';
  voiceLink?: string;
  reactions?: RoomReaction[];
  createdAt?: string;
  updatedAt?: string;
}

export type SinglePlayerDisplayMode = 
  | 'text_and_audio' 
  | 'translate_to_target' 
  | 'translate_to_native' 
  | 'audio_only';

export interface SinglePlayerSettings {
  targetLanguage: Language;
  nativeLanguage: Language;
  cefrLevel: CEFRLevel;
  displayMode: SinglePlayerDisplayMode;
  questionCount: number;
  timeLimitSeconds: number; // 0 = unlimited
  autoPlayAudio: boolean;
  selectedCategories: string[];
}

export interface SinglePlayerCardResult {
  card: LanguageCard;
  userAnswer: string;
  isCorrect: boolean;
  attempts: number;
  timeSpentSeconds: number;
  pointsEarned: number;
  similarityScore: number;
  aiFeedback?: string;
}

export interface SinglePlayerSessionReport {
  id: string;
  timestamp: string;
  settings: SinglePlayerSettings;
  results: SinglePlayerCardResult[];
  totalScore: number;
  totalCards: number;
  correctFirstTry: number;
  correctedCount: number;
  failedCount: number;
  accuracy: number;
  bestStreak: number;
  weakCards: LanguageCard[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  accuracy: number;
  totalCards: number;
  targetLanguage: Language;
  cefrLevel: CEFRLevel;
  date: string;
}

export interface WeakCardItem {
  cardId: string;
  card: LanguageCard;
  mistakeCount: number;
  lastPracticed: string;
}

export interface PersonalRecords {
  highestScore: number;
  highestAccuracy: number;
  longestStreak: number;
  fastestAnswerSeconds: number;
  totalCardsLearned: number;
  totalRoundsCompleted: number;
  lastUpdated: string;
}
