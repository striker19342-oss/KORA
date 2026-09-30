import { ZKConfigProvider, type ProverKey, type VerifierKey, type ZKIR } from '@midnight-ntwrk/midnight-js-types';
import { circuitIdFromKeyLocation } from './zkArtifactLocation';

export type ZkConfigSource = {
  getProverKey(circuitId: string): Promise<ProverKey>;
  getVerifierKey(circuitId: string): Promise<VerifierKey>;
  getZKIR(circuitId: string): Promise<ZKIR>;
};

/** Adapts Midnight.js `contract#circuit` locations to Compact artifact filenames. */
export class WalletZkConfigProvider extends ZKConfigProvider<string> {
  constructor(private readonly source: ZkConfigSource) {
    super();
  }

  getProverKey(keyLocation: string) {
    return this.source.getProverKey(circuitIdFromKeyLocation(keyLocation));
  }

  getVerifierKey(keyLocation: string) {
    return this.source.getVerifierKey(circuitIdFromKeyLocation(keyLocation));
  }

  getZKIR(keyLocation: string) {
    return this.source.getZKIR(circuitIdFromKeyLocation(keyLocation));
  }
}
