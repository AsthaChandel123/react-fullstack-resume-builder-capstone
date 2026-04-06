/**
 * Peak summer Wet Bulb Globe Temperature (WBGT) in Celsius.
 * Source: IMD Heatwave Reports 2025, Nature Scientific Reports 2026.
 * Update: annually.
 */
export const CITY_WBGT: Record<string, number> = {
  'delhi': 34,
  'noida': 34,
  'gurgaon': 33,
  'gurugram': 33,
  'mumbai': 32,
  'chennai': 33,
  'hyderabad': 32,
  'bangalore': 27,
  'bengaluru': 27,
  'kolkata': 34,
  'pune': 30,
  'ahmedabad': 36,
  'jaipur': 35,
  'lucknow': 34,
  'patna': 35,
  'chandigarh': 32,
  'kochi': 31,
  'thiruvananthapuram': 31,
  'trivandrum': 31,
  'coimbatore': 29,
  'bhopal': 33,
  'indore': 32,
  'nagpur': 36,
  'surat': 33,
  'visakhapatnam': 32,
  'bhubaneswar': 34,
  'dehradun': 29,
  'shimla': 22,
  'solan': 24,
  'mysore': 27,
  'mysuru': 27,
  'mangalore': 30,
  'guwahati': 32,
  'ranchi': 31,
  'vadodara': 35,
};

export function getCityWBGT(city: string): number {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_WBGT)) {
    if (normalized.includes(key)) return value;
  }
  return 30; // moderate default
}
