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
 *
 * The sub-line is further personalized by the day of week (weekend, Monday,
 * Friday) and by late-night / early-morning hours, so the greeting reads as
 * intentional whenever the sample is opened for a demo.
 */
export const getGreeting = (date: Date = new Date()): IGreeting => {
  const hour = date.getHours();
  const day = date.getDay(); // 0 = Sunday … 6 = Saturday
  const isWeekend = day === 0 || day === 6;
  const isFriday = day === 5;
  const isMonday = day === 1;

  // Late evening (after ~10pm): still "evening", but acknowledge the late hour.
  if (hour >= 22) {
    return {
      timeOfDay: 'night',
      text: 'Good evening',
      subtext: isWeekend ? 'Winding down the weekend.' : 'Working late? Here’s where things stand.'
    };
  }

  // Early morning (before 5am): greet as morning but note the early start.
  if (hour < 5) {
    return {
      timeOfDay: 'night',
      text: 'Good morning',
      subtext: 'You’re up early — here’s your day.'
    };
  }

  if (hour < 12) {
    return {
      timeOfDay: 'morning',
      text: 'Good morning',
      subtext: isWeekend
        ? 'Enjoy your weekend!'
        : isMonday
          ? 'A fresh week begins.'
          : isFriday
            ? 'Almost the weekend!'
            : 'Have a productive day!'
    };
  }

  if (hour < 17) {
    return {
      timeOfDay: 'afternoon',
      text: 'Good afternoon',
      subtext: isWeekend
        ? 'Making the most of your weekend.'
        : isFriday
          ? 'The weekend’s almost here.'
          : 'Hope your day is going well.'
    };
  }

  // Evening (17:00–22:00)
  return {
    timeOfDay: 'evening',
    text: 'Good evening',
    subtext: isWeekend
      ? 'Enjoy your evening.'
      : isFriday
        ? 'Time to unwind — happy Friday!'
        : 'Here’s what’s left for today.'
  };
};
