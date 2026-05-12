/**
 * Small, testable helpers. Extend or replace as your workshop app grows.
 */

export function formatGreeting(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) {
    return "Hello, builder.";
  }
  return `Hello, ${trimmed}.`;
}

export function createCounter(initial = 0) {
  let value = Number.isFinite(initial) ? initial : 0;
  return {
    get value() {
      return value;
    },
    increment(step = 1) {
      const n = Number(step);
      value += Number.isFinite(n) ? n : 1;
      return value;
    },
    reset(next = 0) {
      value = Number.isFinite(next) ? next : 0;
      return value;
    },
  };
}
