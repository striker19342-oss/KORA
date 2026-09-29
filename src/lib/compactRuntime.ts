import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { CostModel, Transaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { fromHex, toHex, validatePassword } from '@midnight-ntwrk/midnight-js-utils';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { Contract as GeneratedContract, type Witnesses } from '../../managed/kora/contract/index.js';
import type { ConnectedWallet, Network } from './wallet';

type KoraPrivateState = { bidAmount: bigint; bidderSecret: Uint8Array };
const PRIVATE_STATE_ID = 'koraPrivateState';
const CONTRACT_NAME = 'kora';
const RESERVE = 5_000n;
const DURATION_SECONDS = 4 * 60 * 60;
const ARTIFACTS_URL = new URL('/contract/compiled/kora', window.location.origin).toString();

const witnesses: Witnesses<KoraPrivateState> = {
  getBidderSecret: ({ privateState }) => [privateState, privateState.bidderSecret],
  getBidAmount: ({ privateState }) => [privateState, privateState.bidAmount],
};

const compiledContract = CompiledContract.withCompiledFileAssets(
  CompiledContract.withWitnesses(
    CompiledContract.make(CONTRACT_NAME, GeneratedContract as never),
    witnesses as never,
  ) as never,
  ARTIFACTS_URL as never,
);

const privateStateProviders = new Map<string, ReturnType<typeof levelPrivateStateProvider>>();

function randomPrivateState(): KoraPrivateState {
  const bidderSecret = crypto.getRandomValues(new Uint8Array(32));
  return { bidAmount: 0n, bidderSecret };
}

function privateStoragePassword(wallet: ConnectedWallet): string {
  const key = `kora.midnight.private-state-password.v1:${wallet.network}:${wallet.address.toLowerCase()}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  // Keep the encryption password in this browser tab's session, not in app storage or source.
  // Users who close the browser tab should treat local contract-maintenance keys as ephemeral.
  for (;;) {
    const password = `Kora!${toHex(crypto.getRandomValues(new Uint8Array(32)))}`;
    try {
      validatePassword(password);
      sessionStorage.setItem(key, password);
      return password;
    } catch {
      // Rare random sequences can trigger the password validator; generate a fresh one.
    }
  }
}

function getPrivateStateProvider(wallet: ConnectedWallet) {
  const key = `${wallet.network}:${wallet.address.toLowerCase()}`;
  let provider = privateStateProviders.get(key);
  if (!provider) {
    provider = levelPrivateStateProvider({
      privateStateStoreName: 'kora-private-state',
      signingKeyStoreName: 'kora-signing-keys',
      accountId: wallet.address,
      privateStoragePasswordProvider: () => privateStoragePassword(wallet),
    });
    privateStateProviders.set(key, provider);
  }
  return provider;
}

async function createProviders(wallet: ConnectedWallet) {
  setNetworkId(wallet.network);
  const [addresses, configuration] = await Promise.all([
    wallet.wallet.getShieldedAddresses(),
    wallet.wallet.getConfiguration(),
  ]);
  if (configuration.networkId !== wallet.network) {
    throw new Error(`1AM is connected to ${configuration.networkId}, not ${wallet.network}. Reconnect to the selected network.`);
  }

  const privateStateProvider = getPrivateStateProvider(wallet);
  const zkConfigProvider = new FetchZkConfigProvider(ARTIFACTS_URL);
  const proofProvider = await dappConnectorProofProvider(
    wallet.wallet,
    zkConfigProvider,
    CostModel.initialCostModel(),
  );
  const publicDataProvider = indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri,
    WebSocket,
  );

  const providers: MidnightProviders = {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey: () => addresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => addresses.shieldedEncryptionPublicKey,
      async balanceTx(tx) {
        const balanced = await wallet.wallet.balanceUnsealedTransaction(toHex(tx.serialize()));
        return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
      },
    },
    midnightProvider: {
      async submitTx(tx) {
        await wallet.wallet.submitTransaction(toHex(tx.serialize()));
        return tx.transactionHash().toString();
      },
    },
  };

  return { providers, privateStateProvider };
}

export async function deployKoraContract(wallet: ConnectedWallet) {
  const { providers } = await createProviders(wallet);
  const state = randomPrivateState();
  const deadline = BigInt(Math.floor(Date.now() / 1000) + DURATION_SECONDS);
  const deployed = await deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: state,
    args: [RESERVE, deadline],
  } as never);

  return {
    contractAddress: deployed.deployTxData.public.contractAddress,
    transactionHash: deployed.deployTxData.public.txId,
  };
}

export async function submitKoraBid(
  wallet: ConnectedWallet,
  contractAddress: string,
  bidAmount: string,
  bidderSecretHex: string,
) {
  if (!/^\d+$/.test(bidAmount)) throw new Error('Enter a whole-number bid amount in tDUST.');
  const amount = BigInt(bidAmount);
  if (amount < RESERVE) throw new Error(`Your private bid must be at least ${RESERVE.toLocaleString()} tDUST.`);
  if (amount % 250n !== 0n) throw new Error('Your private bid must use 250 tDUST increments.');
  if (!/^(?:[0-9a-f]{2}){32}$/i.test(bidderSecretHex)) throw new Error('The private bid witness is invalid. Seal a new bid and retry.');

  const { providers, privateStateProvider } = await createProviders(wallet);
  const initialPrivateState = randomPrivateState();
  privateStateProvider.setContractAddress(contractAddress);
  await privateStateProvider.set(PRIVATE_STATE_ID, {
    bidAmount: amount,
    bidderSecret: fromHex(bidderSecretHex),
  });

  const deployed = await findDeployedContract(providers, {
    compiledContract,
    contractAddress,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  } as never);
  const result = await deployed.callTx.submit_sealed_bid();
  return { transactionId: result.public.txId };
}

export const compactSupportedNetworks: readonly Network[] = ['preview', 'preprod'];
