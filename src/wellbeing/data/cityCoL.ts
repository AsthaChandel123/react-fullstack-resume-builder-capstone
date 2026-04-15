/**
 * India city cost-of-living index (national median = 1.0).
 * Source: Numbeo India 2025, RBI CPIIW basket weights.
 * Update: quarterly.
 */
export const CITY_COL: Record<string, number> = {
  'mumbai': 1.52,
  'delhi': 1.38,
  'bangalore': 1.46,
  'bengaluru': 1.46,
  'hyderabad': 1.22,
  'chennai': 1.28,
  'pune': 1.30,
  'kolkata': 1.10,
  'ahmedabad': 1.08,
  'jaipur': 1.02,
  'lucknow': 0.92,
  'chandigarh': 1.15,
  'noida': 1.32,
  'gurgaon': 1.42,
  'gurugram': 1.42,
  'kochi': 1.12,
  'thiruvananthapuram': 1.05,
  'indore': 0.95,
  'bhopal': 0.90,
  'nagpur': 0.92,
  'coimbatore': 1.05,
  'visakhapatnam': 0.98,
  'surat': 1.02,
  'vadodara': 0.98,
  'patna': 0.88,
  'ranchi': 0.85,
  'bhubaneswar': 0.90,
  'dehradun': 1.00,
  'shimla': 1.05,
  'solan': 0.88,
  'mangalore': 1.00,
  'mysore': 0.95,
  'mysuru': 0.95,
  'trivandrum': 1.05,
  'guwahati': 0.92,
};

export const NATIONAL_MEDIAN_SALARY_ANNUAL = 600000; // INR 6L national median for tech freshers

export function getCityCoL(city: string): number {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_COL)) {
    if (normalized.includes(key)) return value;
  }
  return 1.0; // default to national median
}
