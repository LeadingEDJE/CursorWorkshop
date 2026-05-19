/**
 * Pure helpers for game logic — easy to unit test without canvas/DOM.
 */

export const COLORS = {
  bgDeep: "#0d0221",
  bgNavy: "#1a1a2e",
  neonPink: "#ff2975",
  neonCyan: "#00fff9",
  neonPurple: "#b537f2",
  neonYellow: "#ffd319",
};

/** Format elapsed seconds for display (one decimal place). */
export function formatScore(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  return `${s.toFixed(1)}s`;
}

/** Axis-aligned bounding box overlap test. */
export function boxesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Scroll speed ramps up over time. */
export function getScrollSpeed(elapsedSeconds, baseSpeed = 300, cap = 800) {
  const t = Math.max(0, Number(elapsedSeconds) || 0);
  const bonus = Math.floor(t / 5) * 10;
  return Math.min(cap, baseSpeed + bonus);
}

/** Spawn interval shrinks as survival time increases (ms). Uses 6s tiers (desynced from 5s scroll ramp). */
export function getSpawnInterval(elapsedSeconds, baseInterval = 1800, minInterval = 700) {
  const t = Math.max(0, Number(elapsedSeconds) || 0);
  const reduction = Math.floor(t / 6) * 110;
  return Math.max(minInterval, baseInterval - reduction);
}

/** Per-spawn interval jitter; tighter floor during mid-game spike window (20–40s). */
export function getSpawnJitterMultiplier(elapsedSeconds, random = Math.random()) {
  const t = Math.max(0, Number(elapsedSeconds) || 0);
  if (t >= 20 && t < 40) {
    return 0.8 + random * 0.5;
  }
  return 0.7 + random * 0.6;
}

/** Random choice: ground vs air obstacle (roughly 60/40 ground). */
export function pickObstacleType(random = Math.random()) {
  return random < 0.6 ? "ground" : "air";
}
