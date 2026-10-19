// Small helpers shared by the easter eggs.
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Double-clicking "Aki" / "Akshat" fires this; <EmojiBurst /> listens.
export const burst = () => window.dispatchEvent(new Event('aki-burst'))

// Glowing cursor trail: a timed reward for scoring well in commit.snake().
const TRAIL_KEY = 'aki-trail-until'
export const TRAIL_MINUTES = 5

export function trailRemainingMs() {
  try {
    return Math.max(0, Number(localStorage.getItem(TRAIL_KEY) || 0) - Date.now())
  } catch {
    return 0
  }
}

export function unlockTrail(minutes = TRAIL_MINUTES) {
  try {
    localStorage.setItem(TRAIL_KEY, String(Date.now() + minutes * 60000))
  } catch {
    /* storage unavailable: the trail just won't persist */
  }
  window.dispatchEvent(new Event('aki-trail'))
}
