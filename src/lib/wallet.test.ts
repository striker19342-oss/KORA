import { describe, expect, it } from 'vitest';
import { connectPreferredWallet, discoverWallets, messageForWalletError, validateWalletSession } from './wallet';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

function mockWallet(overrides: Partial<ConnectedAPI> = {}) {
  return {
    getConnectionStatus: async () => ({ status: 'connected' as const, networkId: 'preview' }),
    getUnshieldedAddress: async () => ({ unshieldedAddress: 'mn_addr_test' }),
    getConfiguration: async () => ({ networkId: 'preview', indexerUri: '', indexerWsUri: '', substrateNodeUri: '' }),
    ...overrides,
  } as ConnectedAPI;
}

describe('wallet helpers', () => {
  it('discovers no wallet safely', () => { Object.defineProperty(window, 'midnight', { value: undefined, writable: true }); expect(discoverWallets()).toEqual([]); });
  it('prefers 1AM', () => { Object.defineProperty(window, 'midnight', { value: { z: { name: 'Other', apiVersion: '4.0.1' }, a: { name: '1AM Wallet', apiVersion: '4.0.1' } }, writable: true }); expect(discoverWallets()[0].id).toBe('a'); });
  it('explains dust error', () => { expect(messageForWalletError(new Error('DUST balance'))).toMatch(/DUST/); });
  it('only accepts a live connection on the requested network', async () => {
    const wallet = mockWallet();
    const provider = { name: '1AM Wallet', apiVersion: '4.0.1', connect: async () => wallet } as unknown as InitialAPI;
    Object.defineProperty(window, 'midnight', { value: { oneAm: provider }, writable: true });
    await expect(connectPreferredWallet('preview')).resolves.toMatchObject({ address: 'mn_addr_test', network: 'preview' });
    await expect(connectPreferredWallet('preprod')).rejects.toThrow(/connected to preview/);
  });
  it('detects disconnected or changed accounts before a wallet action', async () => {
    const disconnected = mockWallet({ getConnectionStatus: async () => ({ status: 'disconnected' }) });
    await expect(validateWalletSession({ providerId: '1am', name: '1AM', network: 'preview', address: 'mn_addr_test', wallet: disconnected })).rejects.toThrow(/connection was lost/);
    const changed = mockWallet({ getUnshieldedAddress: async () => ({ unshieldedAddress: 'mn_addr_other' }) });
    await expect(validateWalletSession({ providerId: '1am', name: '1AM', network: 'preview', address: 'mn_addr_test', wallet: changed })).rejects.toThrow(/account changed/);
  });
  it('surfaces proof artifact lookup failures with deployment guidance', () => {
    expect(messageForWalletError(new Error('ZKConfigurationReadError: Failed to read verifier key for kora#submit_sealed_bid'))).toMatch(/compiled proof keys/);
  });
});
