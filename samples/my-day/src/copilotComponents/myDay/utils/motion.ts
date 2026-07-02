/**
 * Small, shared motion primitives for the My Day views.
 *
 * Keyframes are plain objects consumed by Fluent v9 `makeStyles`
 * (`animationName`). All callers pair these with a
 * `@media (prefers-reduced-motion: reduce)` guard that disables the animation,
 * so motion is purely decorative and never required to read the UI.
 */

/** Gentle opacity fade — used for view/container transitions. */
export const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 }
} as const;

/** Fade + subtle rise — used for staggered "alive" entrances. */
export const fadeInUp = {
  from: { opacity: 0, transform: 'translateY(10px)' },
  to: { opacity: 1, transform: 'translateY(0)' }
} as const;
