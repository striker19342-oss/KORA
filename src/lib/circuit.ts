import type { ConnectedWallet, Network } from './wallet';

export type CircuitSubmission = { kind: 'submitted' | 'unavailable'; transactionId?: string; reason?: string };

type CompactRuntime = {
  supportedNetworks?: Network[];
  submitSealedBid?: (input: { commitment: string; address: string; network: Network }) => Promise<unknown>;
};

/** Calls the generated Compact binding when configured. No identifier is fabricated on unavailable environments. */
export async function submitSealedBid(wallet: ConnectedWallet, commitment: string): Promise<CircuitSubmission> {
  const runtime = (window as Window & { koraCompact?: CompactRuntime }).koraCompact;
  if (!runtime) {
    return {
      kind: 'unavailable',
      reason: 'The KORA Compact browser runtime is not bundled. Add the compiled contract artifacts and network adapter to the frontend build; this cannot be fixed with a Netlify or Render environment variable.',
    };
  }
  if (typeof runtime.submitSealedBid !== 'function') {
    return { kind: 'unavailable', reason: 'The bundled KORA Compact runtime does not expose the submitSealedBid circuit.' };
  }
  if (runtime.supportedNetworks && !runtime.supportedNetworks.includes(wallet.network)) {
    return {
      kind: 'unavailable',
      reason: `The bundled KORA Compact artifacts do not support ${wallet.network}. Rebuild and bundle artifacts for that network.`,
    };
  }

  const result = await runtime.submitSealedBid({ commitment, address: wallet.address, network: wallet.network });
  const transactionId = typeof result === 'object' && result && 'transactionId' in result ? String((result as { transactionId: unknown }).transactionId) : undefined;
  return transactionId ? { kind: 'submitted', transactionId } : { kind: 'unavailable', reason: 'The circuit returned no transaction identifier.' };
}
