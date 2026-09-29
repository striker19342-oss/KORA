import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicProofPlan } from './publicApi';
describe('public policy API', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('returns a safe fallback without an API URL', async () => expect((await getPublicProofPlan('reserve >= 5')).source).toBe('deterministic_fallback'));
});
