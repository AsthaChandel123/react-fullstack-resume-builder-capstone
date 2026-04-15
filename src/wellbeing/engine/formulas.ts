/**
 * Wellbeing sub-score formulas.
 * All return 0-100. Higher = better for candidate wellbeing.
 * Each formula cites research from spec section 4.3.
 */

/**
 * Commute score (non-linear decay).
 * Redmond & Mokhtarian 2001: optimal ~15 min.
 * Clark et al. 2020: 10 min extra = 19% pay cut equivalent.
 */
export function commuteScore(minutes: number): number {
  if (minutes <= 15) return 100;
  if (minutes <= 30) return Math.round(100 - (minutes - 15) * 2.0);
  if (minutes <= 45) return Math.round(70 - (minutes - 30) * 2.0);
  if (minutes <= 60) return Math.round(40 - (minutes - 45) * 1.33);
  if (minutes <= 90) return Math.round(20 - (minutes - 60) * 0.5);
  return 5;
}

/**
 * Work hours score.
 * WHO/ILO Pega et al. 2021: 55+ hrs/wk = 35% higher stroke risk.
 */
export function workHoursScore(hoursPerWeek: number): number {
  if (hoursPerWeek <= 40) return 100;
  if (hoursPerWeek <= 45) return 90;
  if (hoursPerWeek <= 50) return 70;
  if (hoursPerWeek <= 55) return 40;
  return 15;
}

export type WorkMode = 'hybrid' | 'remote' | 'onsite' | 'hybrid-1';

/**
 * Work mode score.
 * Bloom et al. 2024 (Nature): hybrid cuts quit rates 35%.
 */
export function workModeScore(mode: WorkMode): number {
  switch (mode) {
    case 'hybrid':
      return 100;
    case 'hybrid-1':
      return 85;
    case 'remote':
      return 70;
    case 'onsite':
      return 50;
    default:
      return 50;
  }
}

/**
 * Real salary score (adjusted for cost of living).
 * Gallup Five Elements: Financial wellbeing dimension.
 */
export function realSalaryScore(
  offeredAnnual: number,
  costOfLivingIndex: number,
  nationalMedian: number = 600000,
): number {
  const realSalary = offeredAnnual / costOfLivingIndex;
  return Math.min(100, Math.round((realSalary / nationalMedian) * 50));
}

/**
 * Air quality score (PM2.5 based).
 * WHO PM2.5 guidelines. Graff Zivin & Neidell (IZA).
 */
export function airQualityScore(pm25: number): number {
  if (pm25 <= 15) return 100;
  if (pm25 <= 25) return 80;
  if (pm25 <= 50) return 60;
  if (pm25 <= 100) return 30;
  return 10;
}

/**
 * Industry attrition score.
 * NASSCOM/Aon 2024 data.
 */
export function attritionScore(attritionPct: number): number {
  return Math.max(0, 100 - attritionPct * 3);
}

/**
 * Heat stress score (WBGT based).
 * Nature Scientific Reports 2026.
 */
export function heatStressScore(wbgtCelsius: number): number {
  if (wbgtCelsius <= 25) return 100;
  if (wbgtCelsius <= 30) return 70;
  if (wbgtCelsius <= 35) return 30;
  return 10;
}

/**
 * Commute cost score.
 * ORF India commute economics.
 */
export function commuteCostScore(
  monthlyCommuteCost: number,
  monthlySalary: number,
): number {
  if (monthlySalary <= 0) return 50;
  const costPct = (monthlyCommuteCost / monthlySalary) * 100;
  return Math.max(0, Math.round(100 - costPct * 10));
}
