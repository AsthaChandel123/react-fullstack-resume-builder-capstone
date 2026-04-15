/**
 * Current petrol rate per litre and average fuel efficiency.
 * Source: IOCL published rates, April 2026.
 * Update: monthly.
 */
export const PETROL_RATE_PER_LITRE = 108; // INR
export const AVG_KM_PER_LITRE = 15;
export const FUEL_COST_PER_KM = PETROL_RATE_PER_LITRE / AVG_KM_PER_LITRE; // ~7.2 INR/km
export const WORKDAYS_PER_MONTH = 22;
