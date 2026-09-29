const STORAGE_KEY = 'kora.private-bid.v1';
export type PrivateBid = { commitment: string; createdAt: string };
export function createPrivateBid(): PrivateBid {
  const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
  return { commitment: Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''), createdAt: new Date().toISOString() };
}
export function loadPrivateBid(): PrivateBid | null { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as PrivateBid : null; }
export function sealPrivateBid(): PrivateBid { const bid = createPrivateBid(); localStorage.setItem(STORAGE_KEY, JSON.stringify(bid)); return bid; }
export function rotatePrivateBid(): PrivateBid { return sealPrivateBid(); }
export function removePrivateBid() { localStorage.removeItem(STORAGE_KEY); }
