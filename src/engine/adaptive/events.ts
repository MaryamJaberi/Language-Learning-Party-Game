// src/engine/adaptive/events.ts — Local event logger for the adaptive engine (§10)
// Pure local storage, strictly decoupled from monetization and network tracking.

export interface CardAnsweredEvent {
  ts: number;
  player: string;
  lang: string;
  event: 'card_answered';
  item: string;
  type: string;
  bucket: string;
  mode: string;
  target: number;
  p_pred: number;
  correct: boolean;
  credit: number;
  ms?: number;
  hint: boolean;
  theta_after: number;
}

export interface AdaptiveGenericEvent {
  ts: number;
  player: string;
  lang: string;
  event:
    | 'mode_change'
    | 'fatigue'
    | 'level_suggestion'
    | 'catch_up_hint'
    | 'party_boost'
    | 'wildcard'
    | 'session_end';
  data?: Record<string, any>;
}

export type AdaptiveLogEvent = CardAnsweredEvent | AdaptiveGenericEvent;

const STORAGE_EVENT_LOGS = 'dor_adaptive_events_v1';
const MAX_LOCAL_EVENTS = 1000;

export function logAdaptiveEvent(event: Omit<AdaptiveLogEvent, 'ts'> & { ts?: number }): void {
  try {
    const fullEvent: AdaptiveLogEvent = {
      ts: event.ts || Date.now(),
      ...event
    } as AdaptiveLogEvent;

    if (typeof localStorage === 'undefined') return;

    const raw = localStorage.getItem(STORAGE_EVENT_LOGS);
    const list: AdaptiveLogEvent[] = raw ? JSON.parse(raw) : [];
    list.push(fullEvent);

    if (list.length > MAX_LOCAL_EVENTS) {
      list.splice(0, list.length - MAX_LOCAL_EVENTS);
    }

    localStorage.setItem(STORAGE_EVENT_LOGS, JSON.stringify(list));
  } catch (err) {
    // Fail silently without impacting game performance
  }
}

export function getAdaptiveEventLogs(limitCount = 100): AdaptiveLogEvent[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_EVENT_LOGS);
    if (!raw) return [];
    const list: AdaptiveLogEvent[] = JSON.parse(raw);
    return list.slice(-limitCount);
  } catch {
    return [];
  }
}

export function clearAdaptiveEventLogs(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_EVENT_LOGS);
    }
  } catch {}
}
