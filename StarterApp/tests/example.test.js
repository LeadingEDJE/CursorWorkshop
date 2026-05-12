import { describe, expect, it } from "vitest";
import { createCounter, formatGreeting } from "../js/appState.js";

describe("formatGreeting", () => {
  it("returns a friendly default when the name is empty", () => {
    expect(formatGreeting("")).toBe("Hello, builder.");
    expect(formatGreeting("   ")).toBe("Hello, builder.");
  });

  it("greets a trimmed name", () => {
    expect(formatGreeting("  Ada  ")).toBe("Hello, Ada.");
  });
});

describe("createCounter", () => {
  it("increments, then resets", () => {
    const counter = createCounter(0);
    expect(counter.value).toBe(0);

    counter.increment(2);
    expect(counter.value).toBe(2);

    counter.reset(10);
    expect(counter.value).toBe(10);
  });
});
