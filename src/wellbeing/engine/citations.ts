export interface Citation {
  id: string;
  short: string;
  full: string;
  insight: string;
}

export const CITATIONS: Record<string, Citation> = {
  commute_stutzer: {
    id: 'commute_stutzer',
    short: 'Stutzer & Frey 2008',
    full: 'Stutzer, A. & Frey, B.S. (2008). "Stress That Doesn\'t Pay." Scand. J. Economics 110(2):339-366.',
    insight: 'Longer commutes reduce life satisfaction with no compensating benefit from higher pay.',
  },
  commute_clark: {
    id: 'commute_clark',
    short: 'Clark et al. 2020',
    full: 'Clark, B. et al. (2020). "How commuting affects subjective wellbeing." Transportation 47:2783-2805.',
    insight: 'Each extra 10 minutes of commute feels like a 19% pay cut in wellbeing terms.',
  },
  commute_redmond: {
    id: 'commute_redmond',
    short: 'Redmond & Mokhtarian 2001',
    full: 'Redmond, L.S. & Mokhtarian, P.L. (2001). "Positive utility of the commute." Transportation 28(2):139-160.',
    insight: 'Optimal commute is about 15 minutes. Below or above reduces satisfaction.',
  },
  hours_who: {
    id: 'hours_who',
    short: 'WHO/ILO Pega et al. 2021',
    full: 'Pega, F. et al. / WHO/ILO (2021). "Long working hours and mortality." Environment International 194.',
    insight: 'Working 55+ hours per week increases stroke risk by 35% and heart disease risk by 17%.',
  },
  hybrid_bloom: {
    id: 'hybrid_bloom',
    short: 'Bloom et al. 2024',
    full: 'Bloom, N. et al. (2024). "Hybrid work study." Nature.',
    insight: 'Hybrid work (2-3 office days) cuts quit rates by 35% with equal productivity.',
  },
  remote_gajendran: {
    id: 'remote_gajendran',
    short: 'Gajendran & Harrison 2007',
    full: 'Gajendran, R.S. & Harrison, D.A. (2007). "Remote work meta-analysis." 108 studies, 45K participants.',
    insight: 'Remote work boosts job satisfaction and reduces role stress and turnover intent.',
  },
  air_graff: {
    id: 'air_graff',
    short: 'Graff Zivin & Neidell',
    full: 'Graff Zivin, J. & Neidell, M. "Air pollution and productivity." IZA World of Labour.',
    insight: 'A 10-unit AQI increase corresponds to 0.35% productivity loss.',
  },
  heat_nature: {
    id: 'heat_nature',
    short: 'Nature Sci. Reports 2026',
    full: 'Nature Scientific Reports (2026). "Heat stress on labour productivity, Southern India."',
    insight: 'WBGT above 30C critically reduces outdoor and semi-outdoor labour productivity.',
  },
  gallup_wellbeing: {
    id: 'gallup_wellbeing',
    short: 'Gallup Five Elements',
    full: 'Rath, T. & Harter, J. / Gallup (2010). Wellbeing: Five Essential Elements.',
    insight: 'Career, Social, Financial, Community, and Physical wellbeing are interconnected.',
  },
  commute_murphy: {
    id: 'commute_murphy',
    short: 'Murphy et al. 2023',
    full: 'Murphy, K. et al. (2023). "Commuting demands meta-analysis." Work & Stress.',
    insight: '39-study meta-analysis confirming commute stress impacts health and job performance.',
  },
};

export function getCitation(id: string): Citation | null {
  return CITATIONS[id] ?? null;
}

export function getInsight(id: string): string {
  return CITATIONS[id]?.insight ?? '';
}
