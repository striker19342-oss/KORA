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
  const provider = discoverWallets().find(({ api }) => /1am/i.test(api.name)) ?? discoverWallets()[0];
  if (!provider) throw new Error('No Midnight wallet found. Install and unlock 1AM, then try again.');

  const wallet = await provider.api.connect(network);
  const [account, configuration] = await Promise.all([wallet.getUnshieldedAddress(), wallet.getConfiguration()]);
  const connectedNetwork = String(configuration.networkId).toLowerCase();
  if (connectedNetwork !== network) throw new Error(`1AM connected to ${connectedNetwork}, but KORA is set to ${network}. Reconnect on the selected network.`);
  if (!account.unshieldedAddress) throw new Error('1AM did not return an unshielded account address.');
  return { providerId: provider.id, name: provider.api.name, address: account.unshieldedAddress, network, wallet };
}

export function messageForWalletError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/dust|balance/i.test(message)) return 'Insufficient DUST to balance and prove this transaction.';
  if (/reject|declin|cancel/i.test(message)) return 'The wallet request was rejected. Your local bid remains private.';
  if (/prover|proof/i.test(message)) return 'The proving service is unavailable. Wait a moment, then retry safely.';
  if (/indexer/i.test(message)) return 'The indexer is catching up. No transaction was submitted; retry after it recovers.';
  return message;
}
