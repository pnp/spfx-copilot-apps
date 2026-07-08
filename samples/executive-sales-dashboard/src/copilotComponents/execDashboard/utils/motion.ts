/**
 * Shared entrance-motion keyframes for the dashboard.
 *
 * Use with Griffel `makeStyles` via `animationName`. Every consumer MUST pair
 * these with a `@media (prefers-reduced-motion: reduce)` guard that disables the
 * animation, per the accessibility rules.
 */

/** Fade in while translating up slightly. */
export const fadeInUp = {
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' }
};

/** Simple fade in. */
export const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 }
};
