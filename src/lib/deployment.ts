import type { ConnectedWallet, Network } from './wallet';

const STORAGE_KEY = 'kora.worker-contract-deployments.v1';

export type WorkerContractDeployment = {
  network: Network;
  walletAddress: string;
  contractAddress: string;
  transactionHash: string;
  deployedAt: string;
};

type DeployInput = { network: Network; walletAddress: string; wallet: ConnectedWallet['wallet'] };
type CompactRuntime = {
  supportedNetworks?: Network[];
  deployAuctionContract?: (input: DeployInput) => Promise<unknown>;
};

function safeRead(): WorkerContractDeployment[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is WorkerContractDeployment => isDeployment(item));
  } catch {
    return [];
  }
}

function isDeployment(value: unknown): value is WorkerContractDeployment {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (entry.network === 'preview' || entry.network === 'preprod')
    && typeof entry.walletAddress === 'string'
    && typeof entry.contractAddress === 'string'
    && typeof entry.transactionHash === 'string'
    && typeof entry.deployedAt === 'string';
}

export function loadWorkerDeployments(network: Network, walletAddress: string): WorkerContractDeployment[] {
  const normalizedAddress = walletAddress.toLowerCase();
  return safeRead()
    .filter((entry) => entry.network === network && entry.walletAddress.toLowerCase() === normalizedAddress)
    .sort((a, b) => b.deployedAt.localeCompare(a.deployedAt));
}

function saveDeployment(deployment: WorkerContractDeployment): void {
  const entries = safeRead();
  const exists = entries.some((entry) => entry.network === deployment.network
    && entry.walletAddress.toLowerCase() === deployment.walletAddress.toLowerCase()
    && entry.transactionHash.toLowerCase() === deployment.transactionHash.toLowerCase());
  if (!exists) entries.push(deployment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function deployAuctionForWorker(wallet: ConnectedWallet): Promise<WorkerContractDeployment> {
  const runtime = (window as Window & { koraCompact?: CompactRuntime }).koraCompact;
  if (typeof runtime?.deployAuctionContract !== 'function') {
    throw new Error('The KORA Compact browser runtime is not bundled. Add the compiled contract artifacts and deployment adapter to the frontend build; this cannot be fixed with a Netlify or Render environment variable.');
  }
  if (runtime.supportedNetworks && !runtime.supportedNetworks.includes(wallet.network)) {
    throw new Error(`The bundled KORA Compact artifacts do not support ${wallet.network}. Rebuild and bundle artifacts for that network.`);
  }

  const result: unknown = await runtime.deployAuctionContract({ network: wallet.network, walletAddress: wallet.address, wallet: wallet.wallet });
  if (!result || typeof result !== 'object') throw new Error('The deployment module returned no on-chain deployment receipt.');

  const receipt = result as Record<string, unknown>;
  const contractAddress = typeof receipt.contractAddress === 'string' ? receipt.contractAddress.trim() : '';
  const transactionHash = typeof receipt.transactionHash === 'string'
    ? receipt.transactionHash.trim()
    : typeof receipt.txHash === 'string' ? receipt.txHash.trim() : '';
  if (!contractAddress || !transactionHash) {
    throw new Error('The deployment module must return the real contractAddress and transactionHash from the network.');
  }

  const deployment: WorkerContractDeployment = {
    network: wallet.network,
    walletAddress: wallet.address,
    contractAddress,
    transactionHash,
    deployedAt: new Date().toISOString(),
  };
  saveDeployment(deployment);
  return deployment;
}
