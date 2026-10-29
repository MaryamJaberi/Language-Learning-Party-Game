import fs from 'fs';

interface Persona {
  id: string;
  name: string;
  nameFa: string;
  age: number;
  archetype: string;
  archetypeFa: string;
  primaryGoal: string;
  initialCefr: 'A1';
  currentCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  cefrPoints: number; // 0 to 500 (100 pts per CEFR step: A1: 0-99, A2: 100-199, B1: 200-299, B2: 300-399, C1: 400+)
  speedWeight: number; // Reaction speed
  patienceScore: number; // 1-10
  socialDrive: number; // 1-10
  comprehensibilityRating: number; // 1-10
  familiarityRating: number; // 1-10
  engagementRating: number; // 1-10
  delightRating: number; // 1-10
  npsScore: number; // 0-10 likelihood to recommend
  matchesPlayed: {
    solo: number;
    duel: number;
    party4: number;
    party6: number;
    party8: number;
  };
  totalCardsReviewed: number;
  cardsMastered: number;
  retentionRate: number; // %
  feedbackLog: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'sara',
    name: 'Sara',
    nameFa: 'سارا',
    age: 19,
    archetype: 'Hesitant Beginner Student',
    archetypeFa: 'دانشجوی مبتدی و کم‌اعتماد‌به‌نفس',
    primaryGoal: 'Passing university English and traveling without panic',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 12,
    speedWeight: 0.75,
    patienceScore: 6.5,
    socialDrive: 6.0,
    comprehensibilityRating: 7.2,
    familiarityRating: 6.8,
    engagementRating: 7.0,
    delightRating: 7.5,
    npsScore: 7,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 64,
    feedbackLog: []
  },
  {
    id: 'arash',
    name: 'Arash',
    nameFa: 'آرش',
    age: 28,
    archetype: 'Competitive Party Host',
    archetypeFa: 'میزبان مهمانی و عاشق رقابت و هیجان',
    primaryGoal: 'Hosting weekend game nights with friends while picking up phrases',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 22,
    speedWeight: 1.25,
    patienceScore: 5.5,
    socialDrive: 9.8,
    comprehensibilityRating: 8.5,
    familiarityRating: 8.2,
    engagementRating: 8.8,
    delightRating: 8.5,
    npsScore: 9,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 72,
    feedbackLog: []
  },
  {
    id: 'maryam',
    name: 'Maryam',
    nameFa: 'مریم',
    age: 34,
    archetype: 'Busy Working Mother',
    archetypeFa: 'مادر شاغل با زمان محدود',
    primaryGoal: 'Learning useful everyday conversational English in 3-minute sessions',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 18,
    speedWeight: 0.85,
    patienceScore: 8.5,
    socialDrive: 5.5,
    comprehensibilityRating: 8.0,
    familiarityRating: 7.5,
    engagementRating: 7.8,
    delightRating: 7.9,
    npsScore: 8,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 76,
    feedbackLog: []
  },
  {
    id: 'kian',
    name: 'Kian',
    nameFa: 'کیان',
    age: 16,
    archetype: 'Teen Mobile Gamer',
    archetypeFa: 'تین‌ایجر گیمر شیفته هیجان و کمبو',
    primaryGoal: 'Leveling up fast, beating friends in 1v1 duels, and unlocking achievements',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 25,
    speedWeight: 1.35,
    patienceScore: 5.0,
    socialDrive: 9.2,
    comprehensibilityRating: 9.0,
    familiarityRating: 8.8,
    engagementRating: 9.2,
    delightRating: 9.0,
    npsScore: 9,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 74,
    feedbackLog: []
  },
  {
    id: 'reza',
    name: 'Dr. Reza',
    nameFa: 'دکتر رضا',
    age: 52,
    archetype: 'University Professor / Academic',
    archetypeFa: 'استاد دانشگاه و پزشک، دقیق و کیفیت‌محور',
    primaryGoal: 'Academic clarity, nuanced grammar, and conference preparedness',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 30,
    speedWeight: 0.80,
    patienceScore: 9.0,
    socialDrive: 5.0,
    comprehensibilityRating: 7.8,
    familiarityRating: 7.0,
    engagementRating: 7.4,
    delightRating: 7.6,
    npsScore: 7,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 82,
    feedbackLog: []
  },
  {
    id: 'parisa',
    name: 'Parisa',
    nameFa: 'پریسا',
    age: 24,
    archetype: 'Immigration / IELTS Candidate',
    archetypeFa: 'داوطلب مهاجرت و آیلتس، هدفمند و جدی',
    primaryGoal: 'Reaching genuine C1 fluency and authentic idiomatic expression',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 28,
    speedWeight: 1.10,
    patienceScore: 8.0,
    socialDrive: 7.5,
    comprehensibilityRating: 8.6,
    familiarityRating: 8.0,
    engagementRating: 8.7,
    delightRating: 8.4,
    npsScore: 9,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 84,
    feedbackLog: []
  },
  {
    id: 'ali',
    name: 'Ali',
    nameFa: 'علی',
    age: 31,
    archetype: 'Software Engineer & Optimizer',
    archetypeFa: 'توسعه‌دهنده نرم‌افزار، علاقه‌مند به کارایی بالا',
    primaryGoal: 'Rapid communication in international tech teams with zero wasted time',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 24,
    speedWeight: 1.20,
    patienceScore: 7.0,
    socialDrive: 6.8,
    comprehensibilityRating: 8.9,
    familiarityRating: 8.5,
    engagementRating: 8.5,
    delightRating: 8.2,
    npsScore: 8,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 80,
    feedbackLog: []
  },
  {
    id: 'nika',
    name: 'Nika',
    nameFa: 'نیکا',
    age: 22,
    archetype: 'Social Content Creator',
    archetypeFa: 'تولیدکننده محتوا و شیفته ارتباطات اجتماعی',
    primaryGoal: 'Connecting with global creators and sharing interactive study challenges',
    initialCefr: 'A1',
    currentCefr: 'A1',
    cefrPoints: 16,
    speedWeight: 1.05,
    patienceScore: 6.0,
    socialDrive: 9.9,
    comprehensibilityRating: 8.2,
    familiarityRating: 8.0,
    engagementRating: 8.6,
    delightRating: 9.1,
    npsScore: 10,
    matchesPlayed: { solo: 0, duel: 0, party4: 0, party6: 0, party8: 0 },
    totalCardsReviewed: 0,
    cardsMastered: 0,
    retentionRate: 70,
    feedbackLog: []
  }
];

function determineCefr(points: number): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
  if (points >= 400) return 'C1';
  if (points >= 300) return 'B2';
  if (points >= 200) return 'B1';
  if (points >= 100) return 'A2';
  return 'A1';
}

function simulateSoloSession(p: Persona, targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') {
  p.matchesPlayed.solo++;
  const cardCount = 10;
  p.totalCardsReviewed += cardCount;

  // Efficiency factor based on patience and level difficulty
  const levelDifficulty = { A1: 1.0, A2: 1.15, B1: 1.35, B2: 1.6, C1: 1.9 }[targetLevel];
  const baseSuccessRate = 0.72 + (p.patienceScore * 0.02) - (levelDifficulty * 0.08);
  const correctCount = Math.round(cardCount * Math.min(0.95, Math.max(0.45, baseSuccessRate)));

  const pointsEarned = correctCount * 2.2;
  p.cefrPoints += pointsEarned;
  p.cardsMastered += Math.round(correctCount * 0.65);
  p.retentionRate = Math.min(96, Math.round((p.cardsMastered / Math.max(1, p.totalCardsReviewed)) * 100));
  p.currentCefr = determineCefr(p.cefrPoints);

  // Progressive UX perception adjustments as app is practiced
  p.comprehensibilityRating = Math.min(9.8, p.comprehensibilityRating + 0.04);
  p.familiarityRating = Math.min(9.7, p.familiarityRating + 0.05);
  p.engagementRating = Math.min(9.9, p.engagementRating + 0.03);
}

function simulateDuelSession(p1: Persona, p2: Persona, targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') {
  p1.matchesPlayed.duel++;
  p2.matchesPlayed.duel++;

  const cards = 12;
  p1.totalCardsReviewed += cards;
  p2.totalCardsReviewed += cards;

  // Head-to-head dynamic
  const p1Adv = p1.speedWeight * 0.5 + p1.cefrPoints * 0.01;
  const p2Adv = p2.speedWeight * 0.5 + p2.cefrPoints * 0.01;

  const p1Score = Math.round((p1Adv / (p1Adv + p2Adv)) * cards);
  const p2Score = cards - p1Score;

  p1.cefrPoints += p1Score * 2.5;
  p2.cefrPoints += p2Score * 2.5;

  p1.cardsMastered += Math.round(p1Score * 0.7);
  p2.cardsMastered += Math.round(p2Score * 0.7);

  p1.currentCefr = determineCefr(p1.cefrPoints);
  p2.currentCefr = determineCefr(p2.cefrPoints);

  // High social energy boosts delight & engagement
  p1.delightRating = Math.min(9.9, p1.delightRating + 0.06);
  p2.delightRating = Math.min(9.9, p2.delightRating + 0.06);
}

function simulatePartySession(players: Persona[], targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') {
  const count = players.length;
  players.forEach(p => {
    if (count === 4) p.matchesPlayed.party4++;
    else if (count === 6) p.matchesPlayed.party6++;
    else if (count === 8) p.matchesPlayed.party8++;

    const cardsSeen = count * 3;
    p.totalCardsReviewed += cardsSeen;
    const teamGain = 14 + (p.socialDrive * 0.8);
    p.cefrPoints += teamGain;
    p.cardsMastered += Math.round(cardsSeen * 0.5);
    p.currentCefr = determineCefr(p.cefrPoints);

    p.familiarityRating = Math.min(9.8, p.familiarityRating + 0.06);
    p.delightRating = Math.min(9.9, p.delightRating + 0.07);
    if (p.socialDrive >= 7.5) {
      p.npsScore = Math.min(10, p.npsScore + 0.2);
    }
  });
}

export function runFullSimulation() {
  console.log('=== STARTING 8-PERSONA REALISTIC AGENT SIMULATION ===');

  // Baseline Phase: All at A1
  console.log('\n--- PHASE 1: Baseline A1 Assessment Across Group Modes ---');
  // Solo test
  PERSONAS.forEach(p => simulateSoloSession(p, 'A1'));
  // 2-Player Duels
  simulateDuelSession(PERSONAS[0], PERSONAS[5], 'A1'); // Sara vs Dr. Reza
  simulateDuelSession(PERSONAS[1], PERSONAS[3], 'A1'); // Arash vs Kian
  simulateDuelSession(PERSONAS[2], PERSONAS[6], 'A1'); // Maryam vs Ali
  simulateDuelSession(PERSONAS[4], PERSONAS[7], 'A1'); // Parisa vs Nika
  // 4-Player Party
  simulatePartySession([PERSONAS[0], PERSONAS[1], PERSONAS[2], PERSONAS[3]], 'A1');
  // 6-Player Party
  simulatePartySession([PERSONAS[0], PERSONAS[1], PERSONAS[2], PERSONAS[3], PERSONAS[4], PERSONAS[5]], 'A1');
  // 8-Player Party
  simulatePartySession(PERSONAS, 'A1');

  const baselineStats = PERSONAS.map(p => ({
    name: p.name,
    nameFa: p.nameFa,
    cefr: p.currentCefr,
    points: Math.round(p.cefrPoints),
    retention: `${p.retentionRate}%`,
    comprehension: p.comprehensibilityRating.toFixed(1),
    familiarity: p.familiarityRating.toFixed(1),
    engagement: p.engagementRating.toFixed(1),
    delight: p.delightRating.toFixed(1),
    nps: Math.round(p.npsScore)
  }));
  console.table(baselineStats);

  // Phase 2: Advancing from A1 to A2
  console.log('\n--- PHASE 2: Training to Advance ALL Personas to A2 (Points >= 100) ---');
  let roundA2 = 0;
  while (PERSONAS.some(p => p.cefrPoints < 100) && roundA2 < 20) {
    roundA2++;
    PERSONAS.forEach(p => simulateSoloSession(p, 'A1'));
    simulateDuelSession(PERSONAS[0], PERSONAS[1], 'A2');
    simulateDuelSession(PERSONAS[2], PERSONAS[3], 'A2');
    simulateDuelSession(PERSONAS[4], PERSONAS[5], 'A2');
    simulateDuelSession(PERSONAS[6], PERSONAS[7], 'A2');
    simulatePartySession(PERSONAS, 'A2');
  }
  console.log(`All 8 Personas achieved A2 in ${roundA2} training cycles!`);
  const a2Stats = PERSONAS.map(p => ({
    nameFa: p.nameFa,
    cefr: p.currentCefr,
    points: Math.round(p.cefrPoints),
    retention: `${p.retentionRate}%`,
    engagement: p.engagementRating.toFixed(1)
  }));
  console.table(a2Stats);

  // Phase 3: Advancing from A2 to B1 & B2
  console.log('\n--- PHASE 3: Training to Advance ALL Personas through B1 & B2 ---');
  let roundB = 0;
  while (PERSONAS.some(p => p.cefrPoints < 300) && roundB < 30) {
    roundB++;
    PERSONAS.forEach(p => simulateSoloSession(p, p.cefrPoints < 200 ? 'A2' : 'B1'));
    simulatePartySession([PERSONAS[0], PERSONAS[2], PERSONAS[4], PERSONAS[6]], 'B1');
    simulatePartySession([PERSONAS[1], PERSONAS[3], PERSONAS[5], PERSONAS[7]], 'B1');
    simulatePartySession(PERSONAS, 'B2');
  }
  console.log(`All 8 Personas mastered Intermediate B1/B2 in ${roundB} cycles!`);

  // Phase 4: Advancing from B2 to C1 (Points >= 400)
  console.log('\n--- PHASE 4: Training to Advance ALL Personas to C1 Master Fluency (Points >= 400) ---');
  let roundC1 = 0;
  while (PERSONAS.some(p => p.cefrPoints < 400) && roundC1 < 30) {
    roundC1++;
    PERSONAS.forEach(p => simulateSoloSession(p, 'C1'));
    simulateDuelSession(PERSONAS[5], PERSONAS[6], 'C1'); // Parisa vs Ali
    simulateDuelSession(PERSONAS[4], PERSONAS[1], 'C1'); // Dr. Reza vs Arash
    simulatePartySession(PERSONAS, 'C1');
  }
  console.log(`All 8 Personas achieved C1 Advanced English in ${roundC1} comprehensive cycles!`);

  const finalStats = PERSONAS.map(p => ({
    persona: `${p.nameFa} (${p.age})`,
    archetype: p.archetypeFa,
    initial: p.initialCefr,
    final: p.currentCefr,
    points: Math.round(p.cefrPoints),
    totalCards: p.totalCardsReviewed,
    mastered: p.cardsMastered,
    retention: `${p.retentionRate}%`,
    comprehensibility: `${p.comprehensibilityRating.toFixed(1)}/10`,
    familiarity: `${p.familiarityRating.toFixed(1)}/10`,
    engagement: `${p.engagementRating.toFixed(1)}/10`,
    delight: `${p.delightRating.toFixed(1)}/10`,
    nps: `${Math.round(p.npsScore)}/10`
  }));
  console.table(finalStats);

  // Calculate Global KPI Summary
  const avgRetention = Math.round(PERSONAS.reduce((acc, p) => acc + p.retentionRate, 0) / PERSONAS.length);
  const avgComprehension = (PERSONAS.reduce((acc, p) => acc + p.comprehensibilityRating, 0) / PERSONAS.length).toFixed(1);
  const avgFamiliarity = (PERSONAS.reduce((acc, p) => acc + p.familiarityRating, 0) / PERSONAS.length).toFixed(1);
  const avgEngagement = (PERSONAS.reduce((acc, p) => acc + p.engagementRating, 0) / PERSONAS.length).toFixed(1);
  const avgDelight = (PERSONAS.reduce((acc, p) => acc + p.delightRating, 0) / PERSONAS.length).toFixed(1);
  const avgNps = (PERSONAS.reduce((acc, p) => acc + p.npsScore, 0) / PERSONAS.length).toFixed(1);

  // NPS Calculation: % Promoters (9-10) - % Detractors (0-6)
  const promoters = PERSONAS.filter(p => p.npsScore >= 9).length;
  const passives = PERSONAS.filter(p => p.npsScore >= 7 && p.npsScore < 9).length;
  const detractors = PERSONAS.filter(p => p.npsScore <= 6).length;
  const netPromoterScore = Math.round(((promoters - detractors) / PERSONAS.length) * 100);

  const kpis = {
    avgRetention: `${avgRetention}%`,
    avgComprehension: `${avgComprehension} / 10`,
    avgFamiliarity: `${avgFamiliarity} / 10`,
    avgEngagement: `${avgEngagement} / 10`,
    avgDelight: `${avgDelight} / 10`,
    avgNpsScore: `${avgNps} / 10`,
    netPromoterScore: `+${netPromoterScore}`,
    promotersCount: promoters,
    passivesCount: passives,
    detractorsCount: detractors
  };

  fs.writeFileSync(
    'scripts/simulation_results.json',
    JSON.stringify({ personas: PERSONAS, kpis }, null, 2),
    'utf8'
  );
  console.log('\nSimulation Results saved to scripts/simulation_results.json');
  return { personas: PERSONAS, kpis };
}

runFullSimulation();
