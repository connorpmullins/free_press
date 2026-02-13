import { describe, it, expect } from "vitest";
import { calculateGiniCoefficient } from "./revenue";

describe("Revenue Service", () => {
  // ============================================================
  // calculateGiniCoefficient (pure function, no mocks needed)
  // ============================================================

  describe("calculateGiniCoefficient", () => {
    it("returns 0 for empty array", () => {
      expect(calculateGiniCoefficient([])).toBe(0);
    });

    it("returns 0 for single element", () => {
      expect(calculateGiniCoefficient([100])).toBe(0);
    });

    it("returns 0 for perfectly equal distribution", () => {
      const gini = calculateGiniCoefficient([50, 50, 50, 50]);
      expect(gini).toBe(0);
    });

    it("returns value close to 1 for perfectly unequal distribution", () => {
      // One person has everything, rest have nothing
      const gini = calculateGiniCoefficient([0, 0, 0, 1000]);
      // Gini for [0,0,0,X] = (4*X + 2*X + 0*X) / (2 * 4 * 4 * 250) = not exactly 1
      // but should be quite high
      expect(gini).toBeGreaterThan(0.5);
    });

    it("returns 0 for all zeros", () => {
      expect(calculateGiniCoefficient([0, 0, 0, 0])).toBe(0);
    });

    it("returns moderate value for moderate inequality", () => {
      const gini = calculateGiniCoefficient([10, 20, 30, 40]);
      expect(gini).toBeGreaterThan(0);
      expect(gini).toBeLessThan(0.5);
    });

    it("is symmetric - order doesn't matter", () => {
      const gini1 = calculateGiniCoefficient([10, 30, 50, 70, 90]);
      const gini2 = calculateGiniCoefficient([90, 10, 70, 30, 50]);
      expect(gini1).toBeCloseTo(gini2, 10);
    });
  });
});
