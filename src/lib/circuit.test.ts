import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectedWallet } from './wallet';

const { submitKoraBid } = vi.hoisted(() => ({ submitKoraBid: vi.fn() }));
vi.mock('./compactRuntime', () => ({ submitKoraBid }));

import { submitSealedBid } from './circuit';

const wallet = { address: 'midnight1bidder', network: 'preview' } as ConnectedWallet;

describe('Compact circuit submission', () => {
  beforeEach(() => submitKoraBid.mockReset());

  it('submits the selected deployment and private witness through the real adapter', async () => {
    submitKoraBid.mockResolvedValue({ transactionId: 'midnight-network-tx' });

    const result = await submitSealedBid(wallet, 'contract-address', '5250', 'ab'.repeat(32));

    expect(submitKoraBid).toHaveBeenCalledWith(wallet, 'contract-address', '5250', 'ab'.repeat(32));
    expect(result).toEqual({ kind: 'submitted', transactionId: 'midnight-network-tx' });
  });

  it('never reports submission when the network provides no transaction identifier', async () => {
    submitKoraBid.mockResolvedValue({ transactionId: '' });

    await expect(submitSealedBid(wallet, 'contract-address', '5250', 'ab'.repeat(32)))
      .rejects.toThrow(/no transaction identifier/i);
  });
});
