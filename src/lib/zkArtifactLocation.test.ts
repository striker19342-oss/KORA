import { describe, expect, it } from 'vitest';
import { circuitIdFromKeyLocation } from './zkArtifactLocation';

describe('circuitIdFromKeyLocation', () => {
  it('removes the contract tag from a wallet-qualified key location', () => {
    expect(circuitIdFromKeyLocation('kora#submit_sealed_bid')).toBe('submit_sealed_bid');
  });

  it('leaves an unqualified Compact circuit filename unchanged', () => {
    expect(circuitIdFromKeyLocation('verify_eligibility')).toBe('verify_eligibility');
  });
});
