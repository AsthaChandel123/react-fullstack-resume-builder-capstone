/**
 * Annual average PM2.5 in ug/m3 for Indian cities.
 * Source: CPCB Annual Report 2025, IQAir World Air Quality Report.
 * Update: annually.
 */
export const CITY_AQI: Record<string, number> = {
  'delhi': 120,
  'noida': 115,
  'gurgaon': 110,
  'gurugram': 110,
  'lucknow': 95,
  'patna': 100,
  'kolkata': 70,
  'mumbai': 45,
  'pune': 38,
  'bangalore': 35,
  'bengaluru': 35,
  'hyderabad': 42,
  'chennai': 30,
  'jaipur': 65,
  'ahmedabad': 55,
  'chandigarh': 60,
  'kochi': 25,
  'thiruvananthapuram': 22,
  'trivandrum': 22,
  'coimbatore': 28,
  'mysore': 30,
  'mysuru': 30,
  'bhopal': 50,
  'indore': 45,
  'surat': 48,
  'visakhapatnam': 35,
  'bhubaneswar': 40,
  'dehradun': 55,
  'shimla': 20,
  'solan': 22,
  'mangalore': 28,
  'guwahati': 45,
  'ranchi': 48,
  'nagpur': 50,
  'vadodara': 52,
};

export function getCityPM25(city: string): number {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_AQI)) {
    if (normalized.includes(key)) return value;
  }
  return 50; // moderate default
}
