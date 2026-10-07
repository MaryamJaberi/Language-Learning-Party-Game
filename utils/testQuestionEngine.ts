import phrasesData from '../phrases.json';
import { LanguageCard, Language } from '../types';
import { UNIVERSAL_CONCEPTS } from '../multiLangDictionary';
import { CURATED_LANGUAGE_CARDS } from '../cardsData';

interface BankPhrase {
  id: string;
  level: string;
  type: string;
  difficulty: string;
  topic: string;
  texts: Record<string, string>;
}

const PHRASES = phrasesData as BankPhrase[];

/**
 * Intelligent Test Design Skill Engine
 * ----------------------------------------------------
 * Designs pedagogically rigorous, structurally parallel, and challenging
 * multiple-choice options for language reflex duels and tests.
 * 
 * Rules:
 * 1. Parallel Grammar: Questions match Questions, Sentences match Sentences,
 *    Phrases match Phrases, single Words match single Words.
 * 2. Parallel Length & Shape: No single option stands out merely by word count.
 * 3. Semantic Plausibility: Distractors come from the same or adjacent topic domain
 *    (e.g., ordering food, asking directions, schedule/time, greetings).
 * 4. Foil Synthesis: If dataset is sparse, synthesizes grammatically valid foils.
 */

// Heuristic to detect if a text is a full question
export function isQuestionText(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.endsWith('?')) return true;
  return /^(wat|waar|hoe|wanneer|wie|welke|waarom|is|kan|mag|heeft|ben|what|where|how|when|who|which|why|is|can|may|do|does|did|que|donde|como|cuand|por que|pourquoi|ou|quand|comment|est-ce|wo|warum|wann|wie|ist|kann|darf|können|کجا|چه|کی|چگونه|چرا|آیا|nerede|ne|nasıl|ne zaman|kim|neden|اين|ماذا|كيف|متى|هل)\b/i.test(t);
}

// Normalize text for comparison
function cleanText(t: string): string {
  return t.trim().toLowerCase().replace(/[.,!?;:]/g, '');
}

/**
 * Synthesizes plausible near-miss distractors for sentences or phrases
 * when the local bank doesn't have enough matching grammatical frames.
 */
function synthesizeParallelFoils(correct: string, lang: Language | string): string[] {
  const isQ = isQuestionText(correct);
  const words = correct.trim().split(/\s+/);
  const synthesized: string[] = [];

  // Dutch (nl) Foil Generation
  if (lang === 'nl') {
    if (isQ) {
      if (/hoe laat/i.test(correct)) {
        synthesized.push('Hoe laat sluit het?');
        synthesized.push('Hoe laat begint de film?');
        synthesized.push('Wanneer is het open?');
      } else if (/waar is/i.test(correct)) {
        synthesized.push('Waar is de ingang?');
        synthesized.push('Waar is de bushalte?');
        synthesized.push('Hoe kom ik bij het station?');
      } else if (/mag ik/i.test(correct)) {
        synthesized.push('Mag ik de menukaart zien?');
        synthesized.push('Mag ik hier zitten?');
        synthesized.push('Kan ik met pin betalen?');
      } else if (/hoeveel kost/i.test(correct) || /wat kost/i.test(correct)) {
        synthesized.push('Hoeveel kost een kaartje?');
        synthesized.push('Wat is de totale prijs?');
        synthesized.push('Is dit met korting?');
      } else {
        synthesized.push('Wanneer begint het?');
        synthesized.push('Kunt u dat herhalen?');
        synthesized.push('Is dit de juiste richting?');
      }
    } else if (words.length >= 4) {
      synthesized.push('Ik wil graag wat bestellen.');
      synthesized.push('Ik ga morgen naar kantoor.');
      synthesized.push('Het duurt ongeveer een uur.');
    } else if (words.length >= 2) {
      synthesized.push('Tot morgenochtend');
      synthesized.push('Een fijne dag nog');
      synthesized.push('Met veel plezier');
    }
  }

  // English (en, en-US) Foil Generation
  if (lang === 'en' || lang === 'en-US') {
    if (isQ) {
      if (/what time/i.test(correct)) {
        synthesized.push('What time does it close?');
        synthesized.push('What time does it begin?');
        synthesized.push('When is it open?');
      } else if (/where is/i.test(correct)) {
        synthesized.push('Where is the entrance?');
        synthesized.push('Where is the bus stop?');
        synthesized.push('How do I get there?');
      } else if (/can i|may i|could i/i.test(correct)) {
        synthesized.push('May I see the menu?');
        synthesized.push('Could you help me please?');
        synthesized.push('Can I pay by card?');
      } else {
        synthesized.push('Could you repeat that?');
        synthesized.push('When does it start?');
        synthesized.push('Is this the right way?');
      }
    } else if (words.length >= 4) {
      synthesized.push('I would like to order now.');
      synthesized.push('I am going there tomorrow morning.');
      synthesized.push('It takes about half an hour.');
    } else if (words.length >= 2) {
      synthesized.push('See you tomorrow morning');
      synthesized.push('Have a wonderful day');
      synthesized.push('With great pleasure');
    }
  }

  // German (de) Foil Generation
  if (lang === 'de') {
    if (isQ) {
      synthesized.push('Um wie viel Uhr schließt es?');
      synthesized.push('Wo ist die nächste Haltestelle?');
      synthesized.push('Kann ich mit Karte zahlen?');
    } else if (words.length >= 3) {
      synthesized.push('Ich möchte bitte bezahlen.');
      synthesized.push('Wir sehen uns morgen wieder.');
      synthesized.push('Das ist eine gute Idee.');
    }
  }

  // French (fr) Foil Generation
  if (lang === 'fr') {
    if (isQ) {
      synthesized.push('À quelle heure est-ce que ça ferme ?');
      synthesized.push('Où se trouve la station ?');
      synthesized.push('Puis-je payer par carte ?');
    } else if (words.length >= 3) {
      synthesized.push("Je voudrais régler l'addition.");
      synthesized.push('On se voit demain matin.');
      synthesized.push("C'est une très bonne idée.");
    }
  }

  // Spanish (es) Foil Generation
  if (lang === 'es') {
    if (isQ) {
      synthesized.push('¿A qué hora cierra?');
      synthesized.push('¿Dónde está la estación?');
      synthesized.push('¿Puedo pagar con tarjeta?');
    } else if (words.length >= 3) {
      synthesized.push('Me gustaría pedir la cuenta.');
      synthesized.push('Nos vemos mañana por la mañana.');
      synthesized.push('Es una excelente idea.');
    }
  }

  return synthesized;
}

/**
 * Main Test Design function to generate 4 challenging options
 */
export function generateChallengingReflexOptions(
  currentCard: LanguageCard,
  sessionPool: LanguageCard[] = [],
  targetLangOverride?: Language
): string[] {
  if (!currentCard || !currentCard.targetText) return [];

  const correct = currentCard.targetText.trim();
  const lang = targetLangOverride || currentCard.targetLanguage || 'nl';
  const isQ = isQuestionText(correct);
  const correctWordsCount = correct.split(/\s+/).length;
  const correctCharLen = correct.length;
  const cleanCorrect = cleanText(correct);

  // Score candidate texts
  interface Candidate {
    text: string;
    score: number;
  }

  const candidateMap = new Map<string, number>();

  const evaluateAndAdd = (text: string, topic?: string, level?: string) => {
    if (!text) return;
    const t = text.trim();
    if (!t) return;
    const cleanT = cleanText(t);
    if (cleanT === cleanCorrect) return; // Ignore identical

    const candIsQ = isQuestionText(t);
    const candWordsCount = t.split(/\s+/).length;
    const candCharLen = t.length;

    // RULE 1: STRICT QUESTION PARITY
    // If correct is a question, distractor MUST be a question
    if (isQ && !candIsQ) return;
    if (!isQ && candIsQ) return;

    // RULE 2: WORD COUNT PARITY
    // If correct is a single word, distractor MUST be a single word (or at most 2 short words)
    if (correctWordsCount === 1 && candWordsCount > 2) return;
    // If correct is a long sentence (>= 4 words), distractor MUST NOT be a single word!
    if (correctWordsCount >= 4 && candWordsCount <= 1) return;
    if (correctWordsCount >= 3 && candWordsCount <= 1) return;

    // Base score
    let score = 50;

    // Topic affinity bonus
    if (topic && currentCard.topic && topic === currentCard.topic) {
      score += 40;
    }

    // Length proximity bonus
    const ratio = candCharLen / Math.max(1, correctCharLen);
    if (ratio >= 0.7 && ratio <= 1.4) {
      score += 35;
    } else if (ratio >= 0.5 && ratio <= 1.8) {
      score += 15;
    }

    // Word count proximity bonus
    const wordDiff = Math.abs(candWordsCount - correctWordsCount);
    if (wordDiff === 0) score += 25;
    else if (wordDiff === 1) score += 15;

    // CEFR level affinity bonus
    if (level && currentCard.cefrLevel && level === currentCard.cefrLevel) {
      score += 10;
    }

    // Initial letter similarity (subtle cognitive trap)
    if (cleanT[0] && cleanCorrect[0] && cleanT[0] === cleanCorrect[0]) {
      score += 10;
    }

    const currentScore = candidateMap.get(t) || 0;
    if (score > currentScore) {
      candidateMap.set(t, score);
    }
  };

  // 1. Search phrases.json master corpus
  for (const p of PHRASES) {
    const rawTxt = p.texts?.[lang];
    if (rawTxt) {
      evaluateAndAdd(rawTxt, p.topic, p.level);
    }
  }

  // 2. Search curated language cards for same language
  for (const card of CURATED_LANGUAGE_CARDS) {
    if (card.targetLanguage === lang && card.targetText) {
      evaluateAndAdd(card.targetText, card.topic, card.cefrLevel);
    }
  }

  // 3. Search Universal Multi-Lingual Concepts (Word Bank for 38 languages)
  for (const concept of UNIVERSAL_CONCEPTS) {
    const conceptWord = concept.words?.[lang];
    if (conceptWord) {
      // If the current card is a short word / phrase, this gives authentic, category-matched distractors
      evaluateAndAdd(conceptWord, concept.topic, concept.level);
    }
  }

  // 4. Search session pool cards
  for (const c of sessionPool) {
    if (c.targetText && c.targetLanguage === lang) {
      evaluateAndAdd(c.targetText, c.topic, c.cefrLevel);
    }
  }

  // Sort candidates by descending pedagogical quality score
  const sortedCandidates = Array.from(candidateMap.entries())
    .map(([text, score]) => ({ text, score }))
    .sort((a, b) => b.score - a.score);

  // Pick top plausible distractors
  const chosenDistractors: string[] = [];

  for (const c of sortedCandidates) {
    // Avoid near-duplicate candidates (e.g. slight punctuation diffs)
    const cleanCand = cleanText(c.text);
    if (chosenDistractors.some(d => cleanText(d) === cleanCand)) continue;

    chosenDistractors.push(c.text);
    if (chosenDistractors.length === 3) break;
  }

  // If we still have fewer than 3 distractors, supplement with synthesized foils
  if (chosenDistractors.length < 3) {
    const synth = synthesizeParallelFoils(correct, lang);
    for (const s of synth) {
      const cleanS = cleanText(s);
      if (cleanS !== cleanCorrect && !chosenDistractors.some(d => cleanText(d) === cleanS)) {
        chosenDistractors.push(s);
        if (chosenDistractors.length === 3) break;
      }
    }
  }

  // Smart contextual mutation fallback: produce a high-confusion foil by swapping words
  if (chosenDistractors.length < 3 && correctWordsCount >= 3) {
    const words = correct.split(/\s+/);
    // Subtle mutation 1: swap last word or punctuation
    if (isQ && (words[0].toLowerCase() === 'where' || words[0].toLowerCase() === 'waar' || words[0].toLowerCase() === 'wo')) {
      const mutated = correct.replace(/^(Where|Waar|Wo|Où|Dónde)\b/i, (m) => {
        if (/where/i.test(m)) return 'When';
        if (/waar/i.test(m)) return 'Wanneer';
        if (/wo/i.test(m)) return 'Wann';
        if (/où/i.test(m)) return 'Quand';
        return 'Cuándo';
      });
      if (mutated !== correct && !chosenDistractors.includes(mutated)) {
        chosenDistractors.push(mutated);
      }
    }
  }

  // If still fewer than 3, fallback to best remaining from pool without breaking length rule
  if (chosenDistractors.length < 3) {
    for (const c of sessionPool) {
      if (c.targetText && c.targetText !== correct && !chosenDistractors.includes(c.targetText)) {
        // Enforce basic sentence vs word rule
        const candWords = c.targetText.split(/\s+/).length;
        if (correctWordsCount >= 3 && candWords < 2) continue;
        if (correctWordsCount === 1 && candWords > 2) continue;
        chosenDistractors.push(c.targetText);
        if (chosenDistractors.length === 3) break;
      }
    }
  }

  // Combine correct and 3 distractors, then shuffle
  const finalChoices = [correct, ...chosenDistractors.slice(0, 3)];

  // Deterministic shuffle with random seed
  return finalChoices.sort(() => Math.random() - 0.5);
}
