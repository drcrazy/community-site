import { describe, expect, it } from "vitest";
import { applyCare, careCountToday, defaultBenbenState, utcDayKey } from "../src/lib/benben/state";

describe("benben care", () => {
  it("allows three cares then refuses the fourth", () => {
    let state = defaultBenbenState(new Date("2026-11-03T12:00:00Z"));
    for (let i = 0; i < 3; i++) {
      const result = applyCare(state, "m1", "feed", new Date("2026-11-03T12:00:00Z"));
      expect(result.ok).toBe(true);
      if (result.ok) state = result.state;
    }
    expect(careCountToday(state, "m1", new Date("2026-11-03T12:00:00Z"))).toBe(3);
    const fourth = applyCare(state, "m1", "polish", new Date("2026-11-03T12:00:00Z"));
    expect(fourth.ok).toBe(false);
    if (!fourth.ok) expect(fourth.reason).toBe("daily_limit");
  });

  it("resets on next UTC day", () => {
    let state = defaultBenbenState(new Date("2026-11-03T12:00:00Z"));
    for (let i = 0; i < 3; i++) {
      const result = applyCare(state, "m1", "rest", new Date("2026-11-03T12:00:00Z"));
      if (result.ok) state = result.state;
    }
    const nextDay = applyCare(state, "m1", "feed", new Date("2026-11-04T01:00:00Z"));
    expect(nextDay.ok).toBe(true);
    expect(utcDayKey(new Date("2026-11-04T01:00:00Z"))).toBe("2026-11-04");
  });
});
