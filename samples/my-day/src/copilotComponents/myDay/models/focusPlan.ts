import type { Importance } from './myDay';

/** Where a focus recommendation originates. */
export type FocusSource = 'meeting' | 'task' | 'mail' | 'news' | 'focus';

/** A single prioritized recommendation in the focus plan. */
export interface IFocusItem {
  id: string;
  title: string;
  /** One-line rationale for why this matters now. */
  reason: string;
  /** Suggested time / slot, when relevant (e.g. "10:00 – 10:30"). */
  suggestedTime?: string;
  source: FocusSource;
  importance: Importance;
}

/** Read-only focus briefing produced by the "Plan my day" assistant. */
export interface IFocusPlan {
  /** One-paragraph summary of the day. */
  headline: string;
  /** Prioritized recommendations (typically 3–5). */
  items: IFocusItem[];
}
