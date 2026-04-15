/**
 * Industry attrition rates (% annual).
 * Source: NASSCOM/Aon India Attrition Report 2024, BusinessToday.
 * Update: annually.
 */
export const INDUSTRY_ATTRITION: Record<string, number> = {
  'it services': 21,
  'it': 21,
  'software': 21,
  'technology': 21,
  'bpo': 35,
  'ites': 35,
  'e-commerce': 28,
  'ecommerce': 28,
  'retail': 25,
  'banking': 18,
  'bfsi': 18,
  'finance': 18,
  'consulting': 22,
  'manufacturing': 12,
  'pharma': 15,
  'healthcare': 16,
  'telecom': 20,
  'media': 24,
  'education': 14,
  'automotive': 13,
  'fmcg': 16,
  'startups': 30,
  'startup': 30,
  'government': 5,
  'psu': 5,
};

export function getAttritionRate(industry: string): number {
  const normalized = industry.toLowerCase().trim();
  for (const [key, value] of Object.entries(INDUSTRY_ATTRITION)) {
    if (normalized.includes(key)) return value;
  }
  return 20; // moderate default
}
