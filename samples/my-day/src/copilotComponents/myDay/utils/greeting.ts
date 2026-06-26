/** Time-of-day greeting buckets, derived from the client clock. */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface IGreeting {
  timeOfDay: TimeOfDay;
  /** Localizable greeting text, e.g. "Good morning". */
  text: string;
  /** Short encouraging sub-line. */
  subtext: string;
}

/**
 * Compute the time-of-day bucket and greeting text from a Date. Pure function so
 * it is trivially testable and renders deterministically from the passed clock.
 */
export const getGreeting = (date: Date = new Date()): IGreeting => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return { timeOfDay: 'morning', text: 'Good morning', subtext: 'Have a productive day!' };
  }
  if (hour >= 12 && hour < 17) {
    return { timeOfDay: 'afternoon', text: 'Good afternoon', subtext: 'Hope your day is going well.' };
  }
  if (hour >= 17 && hour < 22) {
    return { timeOfDay: 'evening', text: 'Good evening', subtext: 'Here’s what’s left for today.' };
  }
  return { timeOfDay: 'night', text: 'Good evening', subtext: 'Wrapping up for the day.' };
};
