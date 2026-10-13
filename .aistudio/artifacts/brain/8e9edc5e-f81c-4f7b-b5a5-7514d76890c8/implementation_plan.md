# Comprehensive Quality Audit, Usability Verification & Refactoring Plan

A comprehensive architectural consolidation, quality assurance audit, usability verification, and automated test matrix covering every requirement delivered from project inception to the present update.

## User Review & Critical Decisions

> [!IMPORTANT]
> The priorities and verification methodologies confirmed for this plan:
> - **Top Focus**: Comprehensive quality audit, usability verification, and high-coverage test verification across all game modes.
> - **Verification Method**: Dual verification consisting of an automated Vitest regression test matrix plus an interactive end-to-end usability verification checklist.
> - **Core Requirement Preservation**: Strictly preserves 1 guide language + 1 learning language tag with instant select and removal cross (no confirm button), player avatars and clean names across all screens, proportional viewport containment, and the 3-option exit confirmation flow.

- **Confirmed Decision 1**: Apply automated testing alongside manual scenario checklists for Solo, Duel, and Multiplayer modes.
- **Confirmed Decision 2**: Ensure zero viewport clipping or awkward vertical scrolling on mobile touch screens (`100dvh` containment).
- **Confirmed Decision 3**: Maintain the unified single-select language picker across Solo, Duel, and Party modes.

---

## 1. Overview & Core Concept

### What It Delivers
A unified, production-grade language learning party and training platform supporting:
1. **Party Hot-Seat Mode (دور)**: 4 to 8 players in 2, 3, or 4 teams passing the device clockwise, with responsive table seating, player avatars, clean names, and 3-way exit modal (`صفحه اول`, `تنظیمات`, `انصراف و ادامه`).
2. **1v1 Speed Duel Mode (دوئل سرعتی)**: Shared screen face-to-face (180° rotation) or side-by-side, plus real-time online 2-device duel with sabotage shocks and reflex testing.
3. **Solo Challenge & Leitner Review**: Voice challenge with Web Speech API recognition, flashcards, spaced repetition Leitner review, and mistake retry sessions.
4. **Pedagogical Balance**: Strict 70% core target words + 30% challenge bonus phrases adhering to CEFR levels (A1 to C2).
5. **Unified Language Selector**: Exactly 1 native/guide language + 1 learning language selected immediately on tap, rendered as a removable tag with `×`, without confirmation buttons.
6. **Mobile Touch Ergonomics & PWA**: Offline caching, install tab in profile modal, and thumb-zone reachability.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                             INTRO SCREEN                               │
│      [Logo: دور]   [UI Lang: Fa/En]   [Profile & PWA]   [Sound/Help]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  SOLO CHALLENGE  │      │  1v1 SPEED DUEL  │      │ PARTY HOT-SEAT   │
│  Single setup    │      │  Local / Online  │      │ Setup: Lang/CEFR │
│  Speech / Cards  │      │  Reflex options  │      │ Player count 4/6/8│
│  Leitner review  │      │  Shock power-up  │      │ Table Seating    │
└─────────┬────────┘      └─────────┬────────┘      └─────────┬────────┘
          │                         │                         │
          ▼                         ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        3-WAY EXIT CONFIRMATION                         │
│  [× / پشیمان شدم (انصراف)]  [برگشت به تنظیمات]  [برگشت به صفحه اول]    │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme
- **Theme**: Retro Arcade Neon meets Persian Editorial elegance.
- **Color Palette (60-30-10)**:
  - 60% Dominant Neutral: Crisp dark/light panel backdrop (`var(--bg)`, `var(--panel)`).
  - 30% Structural: Deep navy slate (`#15204A`), lapis blue (`#2347C5`), subtle hairlines (`var(--line)`).
  - 10% High-Intent Accents: Turquoise (`#12B5A4`), saffron gold (`#FFE600`), ruby red (`#FF1058`).
- **Typography**:
  - Persian: `Vazirmatn` font family with high legibility.
  - Numbers: `font-timer tabular-nums` for timers and scores.
  - English: `Plus Jakarta Sans` / `Inter` fallback.
- **Viewport Presence**: Every active gaming screen enforces `max-h-[100dvh]` and `overflow-hidden` so that cards, avatars, timers, and answer buttons fit naturally on mobile screens without scroll jitter.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Single Target Language with Inline Removable Chip**
  - *Chosen*: Selecting a language immediately assigns it as the single active learning language, displaying it as an inline tag with an `×` delete cross. Clicking `×` removes it and immediately reopens the picker.
  - *Rationale*: Eliminates confusing multi-language mixtures and removes tedious "تایید و بستن" confirmation clicks.
- **Decision 2: Player Avatars & Natural Names**
  - *Chosen*: Every player displays a prominent avatar icon (`🦊`, `🦁`, `🐼`, `🐨`...) on the table seating circle, in the teams roster, in the active player badge, and on the phone pass modal. Natural Persian names (`سارا`, `علی`, `مریم`...) replace awkward cartoon slices, with instant tap-to-edit and a 1-click randomize button.
  - *Rationale*: Solves user confusion ("اسمشون چرا اینطوریه") and builds personal connection.
- **Decision 3: Three-Way Exit Confirmation Across All Modes**
  - *Chosen*: Uniform `ExitConfirmModal` on Solo, Duel, and Party modes containing:
    1. `برگشت به صفحه اول` (Return to Home Screen)
    2. `برگشت به صفحه تنظیمات` (Return to Game Settings)
    3. `پشیمان شدم (ادامه بازی 🎮)` and top-corner `×` (Dismiss and continue playing)
  - *Rationale*: Matches the exact requested user flow when leaving a match.

---

## 4. Technical Architecture & Quality Assurance Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CORE APP CONTROLLER                            │
│                               (App.tsx)                                │
│   - Global Settings & Sound State      - Unified Navigation Handlers   │
│   - Session Card Pool Builder          - Online Firebase Sync          │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │                                        │
                ▼                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│     GAMEPLAY CONTROLLERS      │        │       UTILITY ENGINES         │
│  - GameplayScreen.tsx         │        │  - contentEngine.ts           │
│  - DuelScreen.tsx             │        │  - mistakeReviewService.ts    │
│  - SinglePlayerScreen.tsx     │        │  - soundManager.ts            │
│  - SeatingConfirmScreen.tsx   │        │  - pronunciationService.ts    │
│  - ExitConfirmModal.tsx       │        │  - testQuestionEngine.ts      │
└───────────────────────────────┘        └───────────────────────────────┘
```

### Comprehensive Test & Usability Matrix

| Test Suite / Area | Focus & Validation Criteria | Target Game Mode |
| :--- | :--- | :--- |
| **1. Language Selector UX** | Single learning language tag, immediate select on tap, `×` removal, outside click close, 0 confirm buttons | Solo, Duel, Party |
| **2. Table Seating & Avatars** | Responsive SVG scaling, avatar emoji rendering on seats, full names, tap-to-edit modal, randomize button | Party Mode |
| **3. In-Game 3-Way Exit** | Header exit button & pause modal trigger `ExitConfirmModal`; options 1, 2, and 3 operate reliably | Solo, Duel, Party |
| **4. Viewport Ergonomics** | Zero vertical scrolling in active gameplay (`max-h-[100dvh]`), touch hitboxes $\ge 44\text{px}$ | All screens |
| **5. 1v1 Duel Reflex & Shocks** | Local face-to-face rotation, 1.4s penalty freeze on error, sabotage shock blur, score tug-of-war | Duel Mode |
| **6. Solo Voice & Leitner** | Web Speech recognition fallback, Leitner box promotion/demotion, mistake review session | Solo Mode |
| **7. PWA & Offline Support** | Inline tab in profile modal, service worker cache, offline banner detection | Global |
| **8. Multi-Language Card Balance** | CEFR A1–C2 levels, 70/30 core vs challenge distribution, reverse translation prompt | Gameplay |

### Quality Audit Execution Steps
1. Run full automated Vitest test suite (`15 test files`, `134+ test cases`).
2. Verify TypeScript strict compilation via `compile_applet`.
3. Check responsive styling across mobile ($375\text{px}$–$430\text{px}$) and desktop ($1440\text{px}$) viewports.
4. Verify accessibility: touch target heights, ARIA roles, and RTL layout parity.
