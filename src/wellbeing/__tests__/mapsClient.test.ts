import { describe, it, expect, vi } from 'vitest';
import { getCommuteData } from '../engine/mapsClient';

describe('mapsClient', () => {
  it('returns null without API key', async () => {
    const result = await getCommuteData('', 'Solan', 'Bangalore');
    expect(result).toBeNull();
  });

  it('returns null for empty origins/destinations', async () => {
    const result = await getCommuteData('test-key', '', 'Bangalore');
    expect(result).toBeNull();
  });

  it('returns mock data structure on network failure', async () => {
    // fetch will fail in test environment
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
    const result = await getCommuteData('fake-key', 'Solan', 'Bangalore');
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });
});
