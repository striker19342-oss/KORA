export type ProofPlan = { summary: string; disclosures: string[]; private_values: string[]; source: 'gemini' | 'deterministic_fallback'; gemini_observes: string };
const fallback: ProofPlan = { summary: 'Prove the public eligibility rule without revealing the bid.', disclosures: ['Eligibility outcome', 'One-time nullifier'], private_values: ['Bid amount', 'Holder secret'], source: 'deterministic_fallback', gemini_observes: 'Public policy text only' };
// Netlify serves only the static SPA. The public API is the separately deployed Render service.
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export async function getPublicProofPlan(requirement: string): Promise<ProofPlan> {
  if (!baseUrl) return fallback;
  const response = await fetch(`${baseUrl}/gemini/proof-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requirement }), signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`The policy service is unavailable (${response.status}).`);
  const value: unknown = await response.json();
  if (!value || typeof value !== 'object' || !('summary' in value) || !Array.isArray((value as ProofPlan).disclosures)) throw new Error('The policy service returned an invalid response.');
  return value as ProofPlan;
}
