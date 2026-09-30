import { describe, expect, it, vi } from 'vitest';
import type { ProverKey, VerifierKey, ZKIR } from '@midnight-ntwrk/midnight-js-types';
import type { ZkConfigSource } from './walletZkConfigProvider';
import { WalletZkConfigProvider } from './walletZkConfigProvider';

describe('WalletZkConfigProvider', () => {
  it('normalizes qualified circuit IDs for every artifact read path', async () => {
    const source: ZkConfigSource = {
      getProverKey: vi.fn(async () => new Uint8Array([1]) as ProverKey),
      getVerifierKey: vi.fn(async () => new Uint8Array([2]) as VerifierKey),
      getZKIR: vi.fn(async () => new Uint8Array([3]) as ZKIR),
    };
    const provider = new WalletZkConfigProvider(source);

    await expect(provider.getVerifierKeys(['kora#submit_sealed_bid', 'kora#verify_eligibility']))
      .resolves.toEqual([
        ['kora#submit_sealed_bid', new Uint8Array([2])],
        ['kora#verify_eligibility', new Uint8Array([2])],
      ]);
    await expect(provider.getProverKey('kora#submit_sealed_bid')).resolves.toEqual(new Uint8Array([1]));
    await expect(provider.getZKIR('kora#verify_eligibility')).resolves.toEqual(new Uint8Array([3]));

    expect(source.getVerifierKey).toHaveBeenNthCalledWith(1, 'submit_sealed_bid');
    expect(source.getVerifierKey).toHaveBeenNthCalledWith(2, 'verify_eligibility');
    expect(source.getProverKey).toHaveBeenCalledWith('submit_sealed_bid');
    expect(source.getZKIR).toHaveBeenCalledWith('verify_eligibility');
  });
});
