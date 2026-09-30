import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

export type Network = 'preview' | 'preprod';

export type ConnectedWallet = {
  providerId: string;
  name: string;
  address: string;
  network: Network;
  wallet: ConnectedAPI;
};

export function discoverWallets(): Array<{ id: string; api: InitialAPI }> {
  return Object.entries(window.midnight ?? {})
    .map(([id, api]) => ({ id, api }))
    .filter(({ api }) => /^4\./.test(api.apiVersion))
    .sort((a, b) => Number(!/1am/i.test(a.api.name)) - Number(!/1am/i.test(b.api.name)));
}

export async function connectPreferredWallet(network: Network = 'preview'): Promise<ConnectedWallet> {
  const wallets = discoverWallets();
  const provider = wallets.find(({ api }) => /1am/i.test(`${api.name} ${api.rdns}`));
  if (!provider) throw new Error('No compatible 1AM wallet was found. Install/unlock 1AM, then refresh this page and connect again.');

  const wallet = await provider.api.connect(network);
  const status = await wallet.getConnectionStatus();
  if (status.status !== 'connected') throw new Error('1AM did not establish a wallet connection. Unlock 1AM and connect again.');
  const connectedNetwork = String(status.networkId).toLowerCase();
  if (connectedNetwork !== network) throw new Error(`1AM connected to ${connectedNetwork}, but KORA is set to ${network}. Reconnect on the selected network.`);
  const account = await wallet.getUnshieldedAddress();
  if (!account.unshieldedAddress) throw new Error('1AM did not return an unshielded account address.');
  const connected: ConnectedWallet = { providerId: provider.id, name: provider.api.name, address: account.unshieldedAddress, network, wallet };
  await validateWalletSession(connected);
  return connected;
}

/** Check that the connector still represents the same account on the selected network. */
export async function validateWalletSession(connected: ConnectedWallet): Promise<void> {
  const status = await connected.wallet.getConnectionStatus();
  if (status.status !== 'connected') throw new Error('The 1AM wallet connection was lost. Reconnect before continuing.');
  if (String(status.networkId).toLowerCase() !== connected.network) {
    throw new Error(`1AM switched to ${status.networkId}. KORA is set to ${connected.network}; reconnect before continuing.`);
  }
  const account = await connected.wallet.getUnshieldedAddress();
  if (!account.unshieldedAddress || account.unshieldedAddress.toLowerCase() !== connected.address.toLowerCase()) {
    throw new Error('The active 1AM account changed. Reconnect to continue with the selected account.');
  }
}

export function messageForWalletError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/ZKConfigurationReadError|verifier key|prover key|ZKIR|key material/i.test(message)) {
    return `KORA could not load the compiled proof keys for this circuit. Confirm the latest frontend build includes the Preview/Preprod Compact artifacts, then redeploy Netlify. Details: ${message}`;
  }
  if (/dust|balance/i.test(message)) return 'Insufficient DUST to balance and prove this transaction.';
  if (/reject|declin|cancel/i.test(message)) return 'The wallet request was rejected. Your local bid remains private.';
  if (/prover|proof/i.test(message)) return 'The proving service is unavailable. Wait a moment, then retry safely.';
  if (/indexer/i.test(message)) return 'The indexer is catching up. No transaction was submitted; retry after it recovers.';
  return message;
}
