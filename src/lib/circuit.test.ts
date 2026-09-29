import { describe, expect, it, vi } from 'vitest';
import type { ConnectedWallet } from './wallet';
import { submitSealedBid } from './circuit';

const wallet = (network: ConnectedWallet['network'] = 'preview') => ({
  address: 'midnight1bidder',
  network,
}) as ConnectedWallet;

function setRuntime(runtime: unknown) {
  Object.defineProperty(window, 'koraCompact', { value: runtime, configurable: true, writable: true });
}

describe('Compact circuit runtime', () => {
  it('explains that the generated runtime is missing rather than reporting a network mismatch', async () => {
    setRuntime(undefined);

    const result = await submitSealedBid(wallet(), 'private-commitment');

    expect(result.kind).toBe('unavailable');
    expect(result.reason).toMatch(/runtime is not bundled/i);
    expect(result.reason).toMatch(/environment variable/i);
  });

  it('reports when bundled artifacts do not support the selected network', async () => {
    setRuntime({ supportedNetworks: ['preprod'], submitSealedBid: vi.fn() });

    const result = await submitSealedBid(wallet('preview'), 'private-commitment');

    expect(result.kind).toBe('unavailable');
    expect(result.reason).toMatch(/do not support preview/i);
  });

  it('passes the selected network to the generated circuit adapter and returns its real receipt', async () => {
    const submit = vi.fn().mockResolvedValue({ transactionId: 'network-tx-123' });
    setRuntime({ supportedNetworks: ['preview'], submitSealedBid: submit });

    const result = await submitSealedBid(wallet('preview'), 'private-commitment');

    expect(submit).toHaveBeenCalledWith({
      commitment: 'private-commitment',
      address: 'midnight1bidder',
      network: 'preview',
    });
    expect(result).toEqual({ kind: 'submitted', transactionId: 'network-tx-123' });
  });
});
