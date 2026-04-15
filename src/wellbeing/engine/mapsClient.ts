export interface CommuteData {
  distanceKm: number;
  drivingMinutes: number;
  transitMinutes: number | null;
  origin: string;
  destination: string;
}

/**
 * Query Google Maps Distance Matrix API for commute data.
 * Returns driving and transit durations.
 */
export async function getCommuteData(
  apiKey: string,
  origin: string,
  destination: string,
): Promise<CommuteData | null> {
  if (!apiKey || !origin.trim() || !destination.trim()) return null;

  const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  try {
    // Fetch driving and transit in parallel
    const [drivingRes, transitRes] = await Promise.allSettled([
      fetch(
        `${baseUrl}?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&key=${apiKey}`,
      ),
      fetch(
        `${baseUrl}?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=transit&key=${apiKey}`,
      ),
    ]);

    let distanceKm = 0;
    let drivingMinutes = 0;
    let transitMinutes: number | null = null;

    if (drivingRes.status === 'fulfilled') {
      const data = await drivingRes.value.json();
      const element = data?.rows?.[0]?.elements?.[0];
      if (element?.status === 'OK') {
        distanceKm = (element.distance?.value ?? 0) / 1000;
        drivingMinutes = (element.duration?.value ?? 0) / 60;
      }
    }

    if (transitRes.status === 'fulfilled') {
      const data = await transitRes.value.json();
      const element = data?.rows?.[0]?.elements?.[0];
      if (element?.status === 'OK') {
        transitMinutes = (element.duration?.value ?? 0) / 60;
      }
    }

    if (distanceKm === 0 && drivingMinutes === 0) return null;

    return {
      distanceKm,
      drivingMinutes,
      transitMinutes,
      origin,
      destination,
    };
  } catch {
    return null;
  }
}
