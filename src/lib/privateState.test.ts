import { beforeEach, describe, expect, it } from 'vitest';
import { loadPrivateBid, removePrivateBid, rotatePrivateBid, sealPrivateBid } from './privateState';

describe('private local state', () => {
  beforeEach(removePrivateBid);

  it('keeps the commitment in local storage and witness only in the current tab session', async () => {
    const bid = await sealPrivateBid('5250');
    expect(loadPrivateBid()).toEqual(bid);
    expect(localStorage.getItem('kora.private-bid.commitment.v2')).toBe(bid.commitment);
    expect(localStorage.getItem('kora.private-bid.witness.v2')).toBeNull();
    expect(sessionStorage.getItem('kora.private-bid.witness.v2')).toContain(bid.bidderSecret);
    expect(bid.bidderSecret).toMatch(/^(?:[\da-f]{2}){32}$/);
  });

  it('rotates the commitment and witness together', async () => {
    const first = await sealPrivateBid('5250');
    const next = await rotatePrivateBid('5500');
    expect(next.commitment).not.toBe(first.commitment);
    expect(next.bidderSecret).not.toBe(first.bidderSecret);
    expect(next.bidAmount).toBe('5500');
  });

  it('removes the commitment and session witness', async () => {
    await sealPrivateBid('5250');
    removePrivateBid();
    expect(loadPrivateBid()).toBeNull();
  });
});
