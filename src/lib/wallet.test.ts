import { describe, expect, it } from 'vitest';
import { discoverWallets, messageForWalletError } from './wallet';
describe('wallet helpers', () => {
  it('discovers no wallet safely', () => { Object.defineProperty(window, 'midnight', { value: undefined, writable: true }); expect(discoverWallets()).toEqual([]); });
  it('prefers 1AM', () => { Object.defineProperty(window, 'midnight', { value: { z: { name: 'Other', apiVersion: '4.0.1' }, a: { name: '1AM Wallet', apiVersion: '4.0.1' } }, writable: true }); expect(discoverWallets()[0].id).toBe('a'); });
  it('explains dust error', () => { expect(messageForWalletError(new Error('DUST balance'))).toMatch(/DUST/); });
});
