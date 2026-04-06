/**
 * Monthly transit pass costs and per-km fuel costs for Indian cities.
 * Source: Manual research from metro/bus websites, 2025.
 * Update: quarterly.
 */
export interface TransitCost {
  monthlyPass: number; // INR
  perKmFuel: number; // INR per km (petrol car, ~15 km/L)
}

export const CITY_TRANSIT: Record<string, TransitCost> = {
  'delhi': { monthlyPass: 1500, perKmFuel: 7.2 },
  'mumbai': { monthlyPass: 1800, perKmFuel: 7.5 },
  'bangalore': { monthlyPass: 1600, perKmFuel: 7.3 },
  'bengaluru': { monthlyPass: 1600, perKmFuel: 7.3 },
  'hyderabad': { monthlyPass: 1400, perKmFuel: 7.1 },
  'chennai': { monthlyPass: 1300, perKmFuel: 7.0 },
  'kolkata': { monthlyPass: 1200, perKmFuel: 7.2 },
  'pune': { monthlyPass: 1400, perKmFuel: 7.1 },
  'ahmedabad': { monthlyPass: 1100, perKmFuel: 7.0 },
  'jaipur': { monthlyPass: 1000, perKmFuel: 6.8 },
  'lucknow': { monthlyPass: 900, perKmFuel: 6.8 },
  'chandigarh': { monthlyPass: 1000, perKmFuel: 7.0 },
  'noida': { monthlyPass: 1500, perKmFuel: 7.2 },
  'gurgaon': { monthlyPass: 1500, perKmFuel: 7.2 },
  'gurugram': { monthlyPass: 1500, perKmFuel: 7.2 },
  'kochi': { monthlyPass: 1200, perKmFuel: 7.1 },
  'indore': { monthlyPass: 800, perKmFuel: 6.7 },
};

export function getTransitCost(city: string): TransitCost {
  const normalized = city.toLowerCase().trim();
  for (const [key, value] of Object.entries(CITY_TRANSIT)) {
    if (normalized.includes(key)) return value;
  }
  return { monthlyPass: 1200, perKmFuel: 7.0 }; // default
}
