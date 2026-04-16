import { describe, it, expect } from 'vitest';
import {
  computeWellbeing,
  classifyScore,
  type WellbeingInput,
} from '../engine/wellbeingScorer';

describe('wellbeingScorer', () => {
  function goodInput(): WellbeingInput {
    return {
      commuteMinutes: 15,
      workHoursPerWeek: 40,
      workMode: 'hybrid',
      offeredSalaryAnnual: 1200000,
      officeCity: 'Bangalore',
      candidateCity: 'Bangalore',
      industry: 'technology',
      commuteMode: 'transit',
      isRelocation: false,
    };
  }

  it('returns a composite score between 0-100', () => {
    const result = computeWellbeing(goodInput());
    expect(result.composite).toBeGreaterThanOrEqual(0);
    expect(result.composite).toBeLessThanOrEqual(100);
  });

  it('returns all 8 sub-scores', () => {
    const result = computeWellbeing(goodInput());
    expect(result.subscores.commute).toBeDefined();
    expect(result.subscores.workHours).toBeDefined();
    expect(result.subscores.workMode).toBeDefined();
    expect(result.subscores.realSalary).toBeDefined();
    expect(result.subscores.airQuality).toBeDefined();
    expect(result.subscores.attrition).toBeDefined();
    expect(result.subscores.heatStress).toBeDefined();
    expect(result.subscores.commuteCost).toBeDefined();
  });

  it('scores good conditions high', () => {
    const result = computeWellbeing(goodInput());
    expect(result.composite).toBeGreaterThan(70);
  });

  it('scores bad conditions low', () => {
    const result = computeWellbeing({
      commuteMinutes: 90,
      workHoursPerWeek: 60,
      workMode: 'onsite',
      offeredSalaryAnnual: 300000,
      officeCity: 'Delhi',
      candidateCity: 'Delhi',
      industry: 'bpo',
      commuteMode: 'driving',
      isRelocation: false,
    });
    expect(result.composite).toBeLessThan(40);
  });

  it('applies relocation penalty', () => {
    const without = computeWellbeing(goodInput());
    const withReloc = computeWellbeing({ ...goodInput(), isRelocation: true });
    expect(withReloc.composite).toBeLessThan(without.composite);
  });

  it('classifies scores correctly', () => {
    expect(classifyScore(90).level).toBe('thriving');
    expect(classifyScore(65).level).toBe('comfortable');
    expect(classifyScore(45).level).toBe('strained');
    expect(classifyScore(30).level).toBe('at-risk');
    expect(classifyScore(10).level).toBe('concerning');
  });

  it('provides citations for each sub-score', () => {
    const result = computeWellbeing(goodInput());
    expect(result.subscores.commute.citations.length).toBeGreaterThan(0);
    expect(result.subscores.workHours.citations.length).toBeGreaterThan(0);
  });

  it('handles remote work mode with commute = 100', () => {
    const result = computeWellbeing({
      ...goodInput(),
      workMode: 'remote',
      commuteMinutes: 0,
    });
    expect(result.subscores.commute.score).toBe(100);
  });
});
