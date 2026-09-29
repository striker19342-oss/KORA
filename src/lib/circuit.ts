import type { ConnectedWallet } from './wallet';
export type CircuitSubmission = { kind: 'submitted' | 'unavailable'; transactionId?: string; reason?: string };
/** Calls the generated Compact binding when configured. No identifier is fabricated on unavailable environments. */
export async function submitSealedBid(wallet: ConnectedWallet, commitment: string): Promise<CircuitSubmission> {
  const binding = (window as Window & { koraCompact?: { submitSealedBid: (input: { commitment: string; address: string }) => Promise<unknown> } }).koraCompact;
  if (!binding) return { kind: 'unavailable', reason: 'Generated Compact browser artifacts are not configured for this network.' };
  const result = await binding.submitSealedBid({ commitment, address: wallet.address });
  const transactionId = typeof result === 'object' && result && 'transactionId' in result ? String((result as { transactionId: unknown }).transactionId) : undefined;
  return transactionId ? { kind: 'submitted', transactionId } : { kind: 'unavailable', reason: 'The circuit returned no transaction identifier.' };
}
