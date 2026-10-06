// Feedback Director - Architecture based on Swink's Game Feel, Jonasson & Purho's Juice It or Lose It, and Nijman's Screenshake
// Enforces 3 decoupled layers of game feel:
// Layer 1: Instant Readability (<100ms): Floating score delta, short tick, pitch scaling
// Layer 2: Budgeted Excitement: 3-5 particles, 2px/6px screen shakes, stinger audio
// Layer 3: Non-Intrusive Fantasy Board Toasts (max 2 queued, 2.2s lifetime, 4s cooldown, zero modals)

import { sound } from './soundManager';

export type LeaderboardDeltaType = 
  | 'rank_up' 
  | 'rank_down' 
  | 'personal_best' 
  | 'threshold' 
  | 'passed' 
  | 'passed_by' 
  | 'top_3';

export interface FloatingScoreEvent {
  id: string;
  points: number;
  combo: number;
  x: number;
  y: number;
  label?: string;
  colorHex?: string;
}

export interface ParticleParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export interface FantasyToast {
  id: string;
  type: LeaderboardDeltaType;
  text: string;
  subText?: string;
  icon: string;
  color: string;
  createdAt: number;
}

type Listener = () => void;

class FeedbackDirector {
  // Layer 1 & 2 state
  public activeScores: FloatingScoreEvent[] = [];
  public activeParticles: ParticleParticle[] = [];
  public currentShake: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };

  // Layer 3 Fantasy Toast Queue
  public activeToasts: FantasyToast[] = [];
  private lastToastTime: number = 0;
  private minToastCooldownMs: number = 4000; // 4 seconds between non-critical board notifications

  private listeners: Set<Listener> = new Set();
  private shakeTimer: any = null;

  // Poetic fantasy text pool based on game-feel brief
  private FANTASY_MESSAGES: Record<LeaderboardDeltaType, string[]> = {
    threshold: [
      'یک خط نور توی دفترت نشست.',
      'جوهر زرین بر حاشیه کتابت تابید.',
      'آوایی نرم، عبور از مرز دانایی را گواهی داد.'
    ],
    personal_best: [
      'گردنبند یک لحظه گرم‌تر شد.',
      'صدای زنگوله‌ای کهن در تالار پیچید؛ رکوردی نو.',
      'شعلهٔ فانوس بالاتر کشید؛ اوج تازه‌ای شکوفا شد.'
    ],
    passed: [
      'مرغ کاغذی از کنار نامت گذشت و بالاتر نشست.',
      'نسیمی ورق را چرخاند و نامت یک پله اوج گرفت.',
      'قدمی به پیش، در تالار سخنوران پیش رفتی.'
    ],
    passed_by: [
      'سایه‌ای نرم از بالای جدول رد شد. جایت هنوز روشن است.',
      'فانوسی دیگر در دوردست روشن شد؛ جایت همچنان امن است.',
      'هوایی تازه در تالار دمید؛ مسابقه زنده‌تر شد.'
    ],
    top_3: [
      'میزِ مزه یک جا برایت باز گذاشته.',
      'جایگاه صدرنشینان دوباره به نامت سلام کرد.',
      'بر ایوان طلایی سه نام برتر نشستی.'
    ],
    rank_up: [
      'مرغ کاغذی از کنار نامت گذشت و بالاتر نشست.',
      'پله‌ای به سوی روشنایی برداشته شد.'
    ],
    rank_down: [
      'سایه‌ای نرم از بالای جدول رد شد. جایت هنوز روشن است.'
    ]
  };

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // ==========================================
  // LAYER 1 & 2: Score Gained & Budgeted Excitement
  // ==========================================
  public triggerScoreGained(params: {
    points: number;
    combo?: number;
    x?: number;
    y?: number;
    label?: string;
  }) {
    const points = Math.max(1, params.points);
    const combo = Math.max(1, params.combo || 1);

    // Audio: Organic pitch-scaled tick
    sound.playScoreTick(combo);

    // Coordinate resolution (default to center-ish if not provided)
    const posX = params.x !== undefined ? params.x : (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const posY = params.y !== undefined ? params.y : (typeof window !== 'undefined' ? window.innerHeight * 0.42 : 300);

    // Palette Colors: Coral/Saffron/Turquoise/Lapis
    const colors = ['#F5B52E', '#12B5A4', '#2347C5', '#E11D48'];
    const selectedColor = combo >= 3 ? '#F5B52E' : (combo === 2 ? '#12B5A4' : '#2347C5');

    const scoreEvent: FloatingScoreEvent = {
      id: `score-${Date.now()}-${Math.random()}`,
      points,
      combo,
      x: posX,
      y: posY,
      label: combo > 1 ? `+${points} ×${combo}` : `+${points} PTS`,
      colorHex: selectedColor
    };

    this.activeScores.push(scoreEvent);

    // Budgeted Particles: strictly 3 to 5 sparks
    const sparkCount = combo >= 3 ? 5 : 3;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() * 0.4 - 0.2);
      const speed = 40 + Math.random() * 35;
      this.activeParticles.push({
        id: `p-${Date.now()}-${Math.random()}`,
        x: posX,
        y: posY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }

    // Budgeted Screen Shake:
    // Regular score = 2px micro-jolt
    // Combo >= 3 = 5px
    // Climax = 8px
    const shakeIntensity = combo >= 4 ? 6 : (combo >= 2 ? 3 : 1.5);
    this.triggerScreenShake(shakeIntensity, 120);

    // Auto cleanup score after 800ms
    setTimeout(() => {
      this.activeScores = this.activeScores.filter(s => s.id !== scoreEvent.id);
      this.notify();
    }, 850);

    // Auto cleanup particles after 550ms
    setTimeout(() => {
      this.activeParticles = [];
      this.notify();
    }, 550);

    this.notify();
  }

  // Screen shake micro-jolt
  public triggerScreenShake(intensityPx: number = 2, durationMs: number = 120) {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // Respect reduced motion
    }

    if (this.shakeTimer) clearTimeout(this.shakeTimer);

    const angle = Math.random() * Math.PI * 2;
    this.currentShake = {
      x: Math.cos(angle) * intensityPx,
      y: Math.sin(angle) * intensityPx,
      active: true
    };
    this.notify();

    this.shakeTimer = setTimeout(() => {
      this.currentShake = { x: 0, y: 0, active: false };
      this.notify();
    }, durationMs);
  }

  // ==========================================
  // LAYER 3: Non-Intrusive Fantasy Board Toasts
  // ==========================================
  public triggerLeaderboardDelta(params: {
    type: LeaderboardDeltaType;
    customText?: string;
    subText?: string;
    bypassCooldown?: boolean;
  }) {
    const now = Date.now();
    const isCritical = params.type === 'personal_best' || params.bypassCooldown;

    // Strict Cooldown Rule: at least 4s between routine board notifications
    if (!isCritical && now - this.lastToastTime < this.minToastCooldownMs) {
      return; // Do not spam the player
    }

    this.lastToastTime = now;

    // Pick text from evocative fantasy pool
    const pool = this.FANTASY_MESSAGES[params.type] || this.FANTASY_MESSAGES.threshold;
    const text = params.customText || pool[Math.floor(Math.random() * pool.length)];

    const icons: Record<LeaderboardDeltaType, string> = {
      threshold: '✨',
      personal_best: '👑',
      passed: '🕊️',
      passed_by: '🌙',
      top_3: '🏛️',
      rank_up: '📈',
      rank_down: '🍃'
    };

    const colors: Record<LeaderboardDeltaType, string> = {
      threshold: 'var(--lapis)',
      personal_best: 'var(--saffron)',
      passed: 'var(--turq)',
      passed_by: 'var(--mute)',
      top_3: 'var(--saffron)',
      rank_up: 'var(--turq)',
      rank_down: 'var(--mute)'
    };

    const toast: FantasyToast = {
      id: `toast-${now}-${Math.random()}`,
      type: params.type,
      text,
      subText: params.subText,
      icon: icons[params.type] || '✨',
      color: colors[params.type] || 'var(--lapis)',
      createdAt: now
    };

    // Queue Rule: Max 2 messages. Third message replaces the older one.
    if (this.activeToasts.length >= 2) {
      this.activeToasts.shift();
    }
    this.activeToasts.push(toast);

    // Audio cue matching event tone
    if (params.type === 'personal_best' || params.type === 'top_3') {
      sound.playMilestoneGlow();
    } else if (params.type === 'passed' || params.type === 'rank_up') {
      sound.playRankUpStinger();
    } else if (params.type === 'passed_by' || params.type === 'rank_down') {
      sound.playRankDownSoftExhale();
    }

    // Lifetime Rule: 2.2 seconds (between 1.8s and 2.4s), auto dismiss
    setTimeout(() => {
      this.activeToasts = this.activeToasts.filter(t => t.id !== toast.id);
      this.notify();
    }, 2200);

    this.notify();
  }
}

export const feedbackDirector = new FeedbackDirector();
