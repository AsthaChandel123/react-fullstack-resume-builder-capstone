import { describe, it, expect } from 'vitest';
import {
  commuteScore,
  workHoursScore,
  workModeScore,
  realSalaryScore,
  airQualityScore,
  attritionScore,
  heatStressScore,
  commuteCostScore,
} from '../engine/formulas';

describe('wellbeing formulas', () => {
  describe('commuteScore', () => {
    it('returns 100 for 0-15 min commute', () => {
      expect(commuteScore(0)).toBe(100);
      expect(commuteScore(10)).toBe(100);
      expect(commuteScore(15)).toBe(100);
    });
    it('decays to ~70 at 30 min', () => {
      expect(commuteScore(30)).toBe(70);
    });
    it('decays to ~40 at 45 min', () => {
      expect(commuteScore(45)).toBe(40);
    });
    it('decays to ~20 at 60 min', () => {
      expect(commuteScore(60)).toBeCloseTo(20, 0);
    });
    it('bottoms at 5 for 90+ min', () => {
      expect(commuteScore(90)).toBe(5);
      expect(commuteScore(120)).toBe(5);
    });
  });

  describe('workHoursScore', () => {
    it('returns 100 for 40 or fewer hours', () => {
      expect(workHoursScore(35)).toBe(100);
      expect(workHoursScore(40)).toBe(100);
    });
    it('returns 90 for 41-45', () => {
      expect(workHoursScore(42)).toBe(90);
    });
    it('returns 70 for 46-50', () => {
      expect(workHoursScore(48)).toBe(70);
    });
    it('returns 40 for 51-55', () => {
      expect(workHoursScore(53)).toBe(40);
    });
    it('returns 15 for 60+ hours', () => {
      expect(workHoursScore(60)).toBe(15);
    });
  });

  describe('workModeScore', () => {
    it('returns 100 for hybrid 2-3 days', () => {
      expect(workModeScore('hybrid')).toBe(100);
    });
    it('returns 50 for fully onsite', () => {
      expect(workModeScore('onsite')).toBe(50);
    });
    it('returns 70 for fully remote', () => {
      expect(workModeScore('remote')).toBe(70);
    });
  });

  describe('realSalaryScore', () => {
    it('scores based on adjusted salary vs national median', () => {
      // 12L salary in city with 1.46 CoL = 8.2L real
      const score = realSalaryScore(1200000, 1.46);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
    it('caps at 100', () => {
      expect(realSalaryScore(3000000, 1.0)).toBe(100);
    });
  });

  describe('airQualityScore', () => {
    it('returns 100 for clean air', () => {
      expect(airQualityScore(10)).toBe(100);
    });
    it('returns 30 for heavy pollution', () => {
      expect(airQualityScore(80)).toBe(30);
    });
    it('returns 10 for severe pollution', () => {
      expect(airQualityScore(150)).toBe(10);
    });
  });

  describe('attritionScore', () => {
    it('returns high score for low attrition', () => {
      expect(attritionScore(5)).toBe(85);
    });
    it('returns low score for high attrition', () => {
      expect(attritionScore(35)).toBe(0);
    });
  });

  describe('heatStressScore', () => {
    it('returns 100 for cool climate', () => {
      expect(heatStressScore(22)).toBe(100);
    });
    it('returns 30 for extreme heat', () => {
      expect(heatStressScore(35)).toBe(30);
    });
    it('returns 10 for dangerous heat', () => {
      expect(heatStressScore(38)).toBe(10);
    });
  });

  describe('commuteCostScore', () => {
    it('returns 100 for zero cost', () => {
      expect(commuteCostScore(0, 50000)).toBe(100);
    });
    it('penalizes high cost ratio', () => {
      // 5000/50000 = 10% -> score = 0
      expect(commuteCostScore(5000, 50000)).toBe(0);
    });
    it('returns moderate score for moderate cost', () => {
      // 2000/50000 = 4% -> score = 60
      expect(commuteCostScore(2000, 50000)).toBe(60);
    });
  });
});
