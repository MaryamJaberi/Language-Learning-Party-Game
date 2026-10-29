import { describe, test, expect } from 'vitest';
import { buildSessionCardPool } from '../cardsData';
import { GameSettings, Team, Player, TeamColor, GameStatus, PlayedCardRecord, Language, CEFRLevel, CardGameMode } from '../types';
import { getRandomCharacters } from '../characters';

describe('10 Full Simulated Games with Diverse Settings', () => {

  interface SimulationConfig {
    testName: string;
    playerCount: 4 | 6 | 8;
    roundsCount: number;
    roundDuration: number;
    targetLanguages: Language[];
    nativeLanguage: 'fa' | 'en';
    cardGameMode: CardGameMode;
    cefrLevel: CEFRLevel;
  }

  const configurations: SimulationConfig[] = [
    {
      testName: 'Game 1: 4 Players, 3 Rounds, Mixed Mode, Dutch & English',
      playerCount: 4,
      roundsCount: 3,
      roundDuration: 60,
      targetLanguages: ['nl', 'en-US'],
      nativeLanguage: 'fa',
      cardGameMode: 'mixed',
      cefrLevel: 'all'
    },
    {
      testName: 'Game 2: 4 Players, 5 Rounds, A1 Beginner, English (US)',
      playerCount: 4,
      roundsCount: 5,
      roundDuration: 45,
      targetLanguages: ['en-US'],
      nativeLanguage: 'fa',
      cardGameMode: 'standard',
      cefrLevel: 'A1'
    },
    {
      testName: 'Game 3: 6 Players, 3 Teams, 3 Rounds, German & French',
      playerCount: 6,
      roundsCount: 3,
      roundDuration: 60,
      targetLanguages: ['de', 'fr'],
      nativeLanguage: 'fa',
      cardGameMode: 'mixed',
      cefrLevel: 'all'
    },
    {
      testName: 'Game 4: 8 Players, 4 Teams, 4 Rounds, Turkish & Arabic',
      playerCount: 8,
      roundsCount: 4,
      roundDuration: 90,
      targetLanguages: ['tr', 'ar'],
      nativeLanguage: 'fa',
      cardGameMode: 'standard',
      cefrLevel: 'all'
    },
    {
      testName: 'Game 5: 4 Players, 2 Rounds, Pure Reverse Mode (Target -> Native)',
      playerCount: 4,
      roundsCount: 2,
      roundDuration: 30,
      targetLanguages: ['nl'],
      nativeLanguage: 'fa',
      cardGameMode: 'reverse',
      cefrLevel: 'B1'
    },
    {
      testName: 'Game 6: 6 Players, 2 Rounds, Polish & Ukrainian, High-Speed Turns',
      playerCount: 6,
      roundsCount: 2,
      roundDuration: 45,
      targetLanguages: ['pl', 'uk'],
      nativeLanguage: 'fa',
      cardGameMode: 'mixed',
      cefrLevel: 'all'
    },
    {
      testName: 'Game 7: 4 Players, 3 Rounds, Spanish & Italian, English Native',
      playerCount: 4,
      roundsCount: 3,
      roundDuration: 60,
      targetLanguages: ['es', 'it'],
      nativeLanguage: 'en',
      cardGameMode: 'mixed',
      cefrLevel: 'A2'
    },
    {
      testName: 'Game 8: 8 Players, 4 Teams, 2 Rounds, Extended Vocabulary',
      playerCount: 8,
      roundsCount: 2,
      roundDuration: 60,
      targetLanguages: ['nl', 'de', 'en-US'],
      nativeLanguage: 'fa',
      cardGameMode: 'mixed',
      cefrLevel: 'all'
    },
    {
      testName: 'Game 9: 4 Players, 4 Rounds, Intense Blitz (30s rounds)',
      playerCount: 4,
      roundsCount: 4,
      roundDuration: 30,
      targetLanguages: ['en-US'],
      nativeLanguage: 'fa',
      cardGameMode: 'standard',
      cefrLevel: 'B2'
    },
    {
      testName: 'Game 10: 6 Players, 3 Teams, 5 Rounds Championship',
      playerCount: 6,
      roundsCount: 5,
      roundDuration: 60,
      targetLanguages: ['nl', 'en-US', 'de'],
      nativeLanguage: 'fa',
      cardGameMode: 'mixed',
      cefrLevel: 'all'
    }
  ];

  configurations.forEach((cfg, gameIdx) => {
    test(`Simulate ${cfg.testName}`, () => {
      // 1. Build session card pool
      const pool = buildSessionCardPool(
        cfg.targetLanguages,
        ["CAT_EVERYDAY", "CAT_RESTAURANT", "CAT_FOOD", "CAT_TRAVEL", "CAT_SHOPPING", "CAT_WORK", "CAT_SMALLTALK"],
        cfg.cefrLevel,
        cfg.nativeLanguage,
        cfg.cardGameMode
      );
      expect(pool.length).toBeGreaterThan(10);

      // Verify card attributes
      pool.forEach(card => {
        expect(card.targetText).toBeTruthy();
        expect(card.translation).toBeTruthy();
        expect(cfg.targetLanguages).toContain(card.targetLanguage);
        if (cfg.cardGameMode === 'reverse') {
          expect(card.isReverse).toBe(true);
        }
      });

      // 2. Setup Teams and Players
      const teamColors = [TeamColor.Blue, TeamColor.Red, TeamColor.Green, TeamColor.Yellow];
      const teamCount = cfg.playerCount / 2;
      const cartoonNames = getRandomCharacters(cfg.nativeLanguage, cfg.playerCount);

      const teams: Team[] = Array.from({ length: teamCount }).map((_, i) => ({
        id: i,
        color: teamColors[i],
        timeRemaining: cfg.roundDuration * 1000,
        isEliminated: false,
        playerIds: [i, i + teamCount],
        score: 0,
        comboStreak: 0
      }));

      const players: Player[] = Array.from({ length: cfg.playerCount }).map((_, i) => ({
        id: i,
        name: cartoonNames[i] || `Player ${i + 1}`,
        teamId: i % teamCount,
        teamColor: teamColors[i % teamCount]
      }));

      expect(teams.length).toBe(teamCount);
      expect(players.length).toBe(cfg.playerCount);

      // 3. Simulate rounds progression
      let activePlayerIdx = 0;
      let poolPointer = 0;
      const playedHistory: PlayedCardRecord[] = [];

      for (let round = 1; round <= cfg.roundsCount; round++) {
        // Reset round timer for round
        let roundTimer = cfg.roundDuration * 1000;
        teams.forEach(t => {
          t.timeRemaining = cfg.roundDuration * 1000;
          t.isEliminated = false;
        });

        // Play turns until round timer expires
        let turnInRound = 0;
        while (roundTimer > 0) {
          turnInRound++;
          const card = pool[poolPointer % pool.length];
          poolPointer++;

          const activePlayer = players[activePlayerIdx];
          const activeTeam = teams.find(t => t.id === activePlayer.teamId)!;

          // Simulate guessing: 80% chance correct, 20% pass/skip
          const isCorrect = (turnInRound % 5 !== 0);
          const turnTimeSeconds = Math.min(5, Math.max(1, Math.ceil(roundTimer / 1000)));
          const turnTimeMs = turnTimeSeconds * 1000;

          roundTimer = Math.max(0, roundTimer - turnTimeMs);
          activeTeam.timeRemaining = Math.max(0, activeTeam.timeRemaining - turnTimeMs);

          if (isCorrect) {
            let pts = card.points || 1;
            if (card.isGolden) pts *= 2;
            if (turnTimeSeconds < 4) pts += 1; // Speed bonus

            activeTeam.score = (activeTeam.score || 0) + pts;
            activeTeam.comboStreak = (activeTeam.comboStreak || 0) + 1;

            playedHistory.push({
              card,
              guessedCorrectly: true,
              answeringPlayerName: activePlayer.name,
              answeringTeamColor: activePlayer.teamColor,
              timeSpentSeconds: turnTimeSeconds,
              wasSpeedBonus: turnTimeSeconds < 4,
              pointsEarned: pts,
              usedHint: false
            });
          } else {
            activeTeam.comboStreak = 0;
          }

          // Advance clockwise
          activePlayerIdx = (activePlayerIdx + 1) % players.length;
        }

        // Round ended successfully
        expect(roundTimer).toBeLessThanOrEqual(0);
      }

      // 4. Validate Game End and Winner Determination
      expect(playedHistory.length).toBeGreaterThan(0);
      
      const maxScore = Math.max(...teams.map(t => t.score || 0));
      expect(maxScore).toBeGreaterThan(0);

      const winningTeams = teams.filter(t => (t.score || 0) === maxScore);
      expect(winningTeams.length).toBeGreaterThanOrEqual(1);

      // Validate that no team was improperly eliminated mid-game
      teams.forEach(t => {
        expect(t.isEliminated).toBe(false);
      });
    });
  });
});
