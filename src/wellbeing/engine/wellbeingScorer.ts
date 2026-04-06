import {
  commuteScore,
  workHoursScore,
  workModeScore,
  realSalaryScore,
  airQualityScore,
  attritionScore,
  heatStressScore,
  commuteCostScore,
  type WorkMode,
} from './formulas';
import { getCityCoL, NATIONAL_MEDIAN_SALARY_ANNUAL } from '../data/cityCoL';
import { getCityPM25 } from '../data/cityAQI';
import { getCityWBGT } from '../data/cityWBGT';
import { getAttritionRate } from '../data/attritionRates';
import { getTransitCost } from '../data/transitCosts';
import { FUEL_COST_PER_KM, WORKDAYS_PER_MONTH } from '../data/fuelRate';
import { CITATIONS } from './citations';

export interface WellbeingInput {
  commuteMinutes: number;
  workHoursPerWeek: number;
  workMode: WorkMode;
  offeredSalaryAnnual: number;
  officeCity: string;
  candidateCity: string;
  industry: string;
  commuteMode: 'driving' | 'transit' | 'walking' | 'cycling';
  isRelocation: boolean;
  /** Optional: actual driving distance in km (from Maps API) */
  commuteDistanceKm?: number;
}

export interface SubScore {
  score: number;
  label: string;
  detail: string;
  citations: string[];
  weight: number;
}

export interface WellbeingResult {
  composite: number;
  subscores: {
    commute: SubScore;
    workHours: SubScore;
    workMode: SubScore;
    realSalary: SubScore;
    airQuality: SubScore;
    attrition: SubScore;
    heatStress: SubScore;
    commuteCost: SubScore;
  };
  classification: ScoreClassification;
}

export interface ScoreClassification {
  level: 'thriving' | 'comfortable' | 'strained' | 'at-risk' | 'concerning';
  message: string;
  color: string;
}

export function classifyScore(score: number): ScoreClassification {
  if (score >= 80)
    return {
      level: 'thriving',
      message: 'This role fits your life well.',
      color: 'var(--saathi-success-text)',
    };
  if (score >= 60)
    return {
      level: 'comfortable',
      message: 'Good match with a few things to consider.',
      color: 'var(--saathi-warning)',
    };
  if (score >= 40)
    return {
      level: 'strained',
      message: 'Your commute may feel like a 30% pay cut (Clark et al. 2020).',
      color: '#f97316',
    };
  if (score >= 20)
    return {
      level: 'at-risk',
      message: 'Research shows this combination impacts health significantly.',
      color: 'var(--saathi-concern)',
    };
  return {
    level: 'concerning',
    message: 'We want to be honest: this setup is associated with burnout risk.',
    color: '#dc2626',
  };
}

export function computeWellbeing(input: WellbeingInput): WellbeingResult {
  const effectiveCity = input.isRelocation ? input.officeCity : input.candidateCity;
  const col = getCityCoL(input.officeCity);
  const pm25 = getCityPM25(input.officeCity);
  const wbgt = getCityWBGT(input.officeCity);
  const attrition = getAttritionRate(input.industry);
  const transit = getTransitCost(effectiveCity);
  const monthlySalary = input.offeredSalaryAnnual / 12;

  // Commute cost calculation
  let monthlyCommuteCost = 0;
  if (input.workMode === 'remote') {
    monthlyCommuteCost = 0;
  } else if (input.commuteMode === 'transit') {
    monthlyCommuteCost = transit.monthlyPass;
  } else if (input.commuteMode === 'driving') {
    const distanceKm = input.commuteDistanceKm ?? input.commuteMinutes * 0.6; // rough estimate: 36 km/h avg
    monthlyCommuteCost = distanceKm * 2 * FUEL_COST_PER_KM * WORKDAYS_PER_MONTH;
  }

  const effectiveCommuteMinutes =
    input.workMode === 'remote' ? 0 : input.commuteMinutes;

  // Adjust heat stress for AC commute
  const adjustedWBGT =
    input.commuteMode === 'transit' || input.commuteMode === 'driving'
      ? wbgt * 0.85 // AC reduces effective WBGT
      : wbgt;

  const subscores = {
    commute: {
      score: commuteScore(effectiveCommuteMinutes),
      label: 'Commute',
      detail: `${effectiveCommuteMinutes} min one-way`,
      citations: [
        CITATIONS.commute_clark.short,
        CITATIONS.commute_stutzer.short,
        CITATIONS.commute_redmond.short,
      ],
      weight: 0.25,
    },
    workHours: {
      score: workHoursScore(input.workHoursPerWeek),
      label: 'Work Hours',
      detail: `${input.workHoursPerWeek} hrs/week`,
      citations: [CITATIONS.hours_who.short],
      weight: 0.20,
    },
    workMode: {
      score: workModeScore(input.workMode),
      label: 'Work Mode',
      detail: input.workMode,
      citations: [CITATIONS.hybrid_bloom.short],
      weight: 0.15,
    },
    realSalary: {
      score: realSalaryScore(input.offeredSalaryAnnual, col, NATIONAL_MEDIAN_SALARY_ANNUAL),
      label: 'Real Salary',
      detail: `Adjusted for ${input.officeCity} CoL (${col}x)`,
      citations: [CITATIONS.gallup_wellbeing.short],
      weight: 0.15,
    },
    airQuality: {
      score: airQualityScore(pm25),
      label: 'Air Quality',
      detail: `PM2.5: ${pm25} ug/m3`,
      citations: [CITATIONS.air_graff.short],
      weight: 0.10,
    },
    attrition: {
      score: attritionScore(attrition),
      label: 'Industry Stability',
      detail: `${attrition}% annual attrition`,
      citations: ['NASSCOM/Aon 2024'],
      weight: 0.05,
    },
    heatStress: {
      score: heatStressScore(adjustedWBGT),
      label: 'Heat Stress',
      detail: `WBGT ${Math.round(adjustedWBGT)}C`,
      citations: [CITATIONS.heat_nature.short],
      weight: 0.05,
    },
    commuteCost: {
      score: commuteCostScore(monthlyCommuteCost, monthlySalary),
      label: 'Commute Cost',
      detail: `~INR ${Math.round(monthlyCommuteCost).toLocaleString('en-IN')}/month`,
      citations: ['ORF India commute economics'],
      weight: 0.05,
    },
  };

  let composite =
    subscores.commute.score * subscores.commute.weight +
    subscores.workHours.score * subscores.workHours.weight +
    subscores.workMode.score * subscores.workMode.weight +
    subscores.realSalary.score * subscores.realSalary.weight +
    subscores.airQuality.score * subscores.airQuality.weight +
    subscores.attrition.score * subscores.attrition.weight +
    subscores.heatStress.score * subscores.heatStress.weight +
    subscores.commuteCost.score * subscores.commuteCost.weight;

  // Relocation penalty: -10 points (Gallup community wellbeing)
  if (input.isRelocation) {
    composite = Math.max(0, composite - 10);
  }

  composite = Math.round(composite);

  return {
    composite,
    subscores,
    classification: classifyScore(composite),
  };
}
