const COMMITMENT_KEY = 'kora.private-bid.commitment.v2';
const SESSION_BID_KEY = 'kora.private-bid.witness.v2';

export type PrivateBid = {
  commitment: string;
  bidAmount: string;
  bidderSecret: string;
  createdAt: string;
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createPrivateBid(bidAmount: string): Promise<PrivateBid> {
  const secretBytes = crypto.getRandomValues(new Uint8Array(32));
  const digest = await crypto.subtle.digest('SHA-256', secretBytes);
  return {
    commitment: toHex(new Uint8Array(digest)),
    bidAmount,
    bidderSecret: toHex(secretBytes),
    createdAt: new Date().toISOString(),
  };
}

export function loadPrivateBid(): PrivateBid | null {
  try {
    const commitment = localStorage.getItem(COMMITMENT_KEY);
    const rawWitness = sessionStorage.getItem(SESSION_BID_KEY);
    if (!commitment || !rawWitness) return null;
    const witness: unknown = JSON.parse(rawWitness);
    if (!witness || typeof witness !== 'object') return null;
    const value = witness as Record<string, unknown>;
    if (typeof value.bidAmount !== 'string' || typeof value.bidderSecret !== 'string' || typeof value.createdAt !== 'string') return null;
    return { commitment, bidAmount: value.bidAmount, bidderSecret: value.bidderSecret, createdAt: value.createdAt };
  } catch {
    return null;
  }
}

export async function sealPrivateBid(bidAmount: string): Promise<PrivateBid> {
  const bid = await createPrivateBid(bidAmount);
  localStorage.setItem(COMMITMENT_KEY, bid.commitment);
  sessionStorage.setItem(SESSION_BID_KEY, JSON.stringify({ bidAmount: bid.bidAmount, bidderSecret: bid.bidderSecret, createdAt: bid.createdAt }));
  return bid;
}

export async function rotatePrivateBid(bidAmount: string): Promise<PrivateBid> {
  return sealPrivateBid(bidAmount);
}

export function removePrivateBid() {
  localStorage.removeItem(COMMITMENT_KEY);
  sessionStorage.removeItem(SESSION_BID_KEY);
}
