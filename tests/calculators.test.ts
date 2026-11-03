import { describe, expect, it } from "vitest";
import { calculateMaterials, GODDESS_MATERIALS, RED_CARPET_MATERIALS } from "../src/lib/calculators/event-materials";
import { calculateGoddessXp } from "../src/lib/calculators/goddess-xp";
import { buildUpgradePlan, CITIES, requiredGroupLevel, upgradeCost } from "../src/lib/calculators/city-upgrades";
import { calculateSignetRingCost, MAXIMUM_SIGNET_LEVEL } from "../src/lib/calculators/signet-ring-cost";
import { calculateRoute, formatDuration, ROUTE_CITIES } from "../src/lib/calculators/grand-voyage-route";
import costs from "../src/lib/calculators/signet-ring-costs.json";

describe("materials", () => {
  it("calculates Goddess material points", () => {
    const result = calculateMaterials(GODDESS_MATERIALS.map((item, index) => ({ ...item, quantity: index + 1 })));
    expect(result.total).toBe(37);
  });

  it("calculates Red Carpet material points", () => {
    const result = calculateMaterials(RED_CARPET_MATERIALS.map((item) => ({ ...item, quantity: 2 })));
    expect(result.total).toBe(1600);
  });
});

describe("goddess xp", () => {
  it("sums across level boundaries", () => {
    expect(calculateGoddessXp(1, 2)).toBe(7);
    expect(calculateGoddessXp(1, 12)).toBe(229);
    expect(() => calculateGoddessXp(12, 12)).toThrow(/higher/);
  });
});

describe("city upgrades", () => {
  it("preserves city data and milestone rules", () => {
    expect(CITIES.length).toBe(33);
    expect(requiredGroupLevel(1)).toBe(0);
    expect(requiredGroupLevel(25)).toBe(20);
    const gibraltar = CITIES.find((city) => city.name === "Gibraltar");
    expect(gibraltar).toBeTruthy();
    expect(upgradeCost(gibraltar!, 18, 19)).toBe(1_450_000);
  });

  it("includes required peer upgrades", () => {
    const plan = buildUpgradePlan("London", 19, 25, { Hamburg: 19, Amsterdam: 20, Plymouth: 5, Dublin: 30 });
    expect(plan.prerequisites.map((item) => item.city.name)).toEqual(["Hamburg", "Plymouth"]);
    expect(plan.totalCost).toBe(31_628_800);
  });
});

describe("signet rings", () => {
  it("keeps the versioned schedule", () => {
    expect(MAXIMUM_SIGNET_LEVEL).toBe(500);
    expect(costs.levelCosts.length).toBe(500);
  });

  it("charges rings only past milestones", () => {
    expect(calculateSignetRingCost(20, 21).signetRings).toBe(1);
    expect(calculateSignetRingCost(19, 20).signetRings).toBe(0);
  });
});

describe("grand voyage route", () => {
  it("preserves known route values", () => {
    expect(ROUTE_CITIES.length).toBe(33);
    const result = calculateRoute(["Gibraltar", "Lisbon"]);
    expect(result.totalProfit).toBe(747_100);
    expect(formatDuration(2.01)).toBe("2h 01m");
  });
});
