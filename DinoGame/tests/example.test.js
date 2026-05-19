import { describe, expect, it } from "vitest";
import {
  boxesOverlap,
  formatScore,
  getScrollSpeed,
  getSpawnInterval,
  getSpawnJitterMultiplier,
  pickObstacleType,
} from "../js/gameUtils.js";

describe("formatScore", () => {
  it("formats seconds with one decimal and suffix", () => {
    expect(formatScore(0)).toBe("0.0s");
    expect(formatScore(12.34)).toBe("12.3s");
    expect(formatScore(-5)).toBe("0.0s");
  });
});

describe("boxesOverlap", () => {
  it("detects overlapping boxes", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(boxesOverlap(a, b)).toBe(true);
  });

  it("returns false when boxes do not overlap", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(boxesOverlap(a, b)).toBe(false);
  });

  it("returns false for touching edges only", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(boxesOverlap(a, b)).toBe(false);
  });
});

describe("getScrollSpeed", () => {
  it("starts at base speed and ramps every 5 seconds", () => {
    expect(getScrollSpeed(0)).toBe(300);
    expect(getScrollSpeed(4.9)).toBe(300);
    expect(getScrollSpeed(5)).toBe(310);
    expect(getScrollSpeed(250)).toBe(800);
  });
});

describe("getSpawnInterval", () => {
  it("decreases on 6s tiers and respects minimum", () => {
    expect(getSpawnInterval(0)).toBe(1800);
    expect(getSpawnInterval(5)).toBe(1800);
    expect(getSpawnInterval(6)).toBe(1690);
    expect(getSpawnInterval(30)).toBe(1250);
    expect(getSpawnInterval(60)).toBe(700);
    expect(getSpawnInterval(200)).toBe(700);
  });
});

describe("getSpawnJitterMultiplier", () => {
  it("uses a higher floor during the 20–40s mid-game window", () => {
    expect(getSpawnJitterMultiplier(10, 0)).toBe(0.7);
    expect(getSpawnJitterMultiplier(25, 0)).toBe(0.8);
    expect(getSpawnJitterMultiplier(25, 1)).toBe(1.3);
    expect(getSpawnJitterMultiplier(40, 0)).toBe(0.7);
  });
});

describe("pickObstacleType", () => {
  it("returns ground for low random values", () => {
    expect(pickObstacleType(0)).toBe("ground");
    expect(pickObstacleType(0.59)).toBe("ground");
  });

  it("returns air for high random values", () => {
    expect(pickObstacleType(0.6)).toBe("air");
    expect(pickObstacleType(0.99)).toBe("air");
  });
});
