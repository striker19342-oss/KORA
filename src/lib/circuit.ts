import type { ConnectedWallet } from './wallet';

export type CircuitSubmission = { kind: 'submitted'; transactionId: string };

/** Proves and submits the bid through the compiled KORA contract and connected 1AM wallet. */
export async function submitSealedBid(
  wallet: ConnectedWallet,
  contractAddress: string,
  bidAmount: string,
  bidderSecretHex: string,
): Promise<CircuitSubmission> {
  const { submitKoraBid } = await import('./compactRuntime');
  const result = await submitKoraBid(wallet, contractAddress, bidAmount, bidderSecretHex);
  if (!result.transactionId) throw new Error('The network returned no transaction identifier.');
  return { kind: 'submitted', transactionId: result.transactionId };
}
