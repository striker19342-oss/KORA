import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { getPublicProofPlan, type ProofPlan } from './lib/publicApi';
export function PolicyLens() {
  const [plan, setPlan] = useState<ProofPlan | null>(null); const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  async function explain() { setState('loading'); try { setPlan(await getPublicProofPlan('A bid must satisfy the public reserve before the deadline.')); setState('idle'); } catch { setState('error'); } }
  return <section className="assistant-card"><div className="card-title"><Sparkles size={17}/><span>Policy lens</span><small>Public-only AI</small></div><p>{plan?.summary ?? 'Read the public proof rule before your wallet is asked to do anything.'}</p>{plan ? <div className="assistant-answer"><Check size={15}/><span>Discloses: {plan.disclosures.join(' · ')}</span></div> : <div className="assistant-answer"><Check size={15}/><span>Public auction rules only. No bid or wallet data leaves your device.</span></div>}<button onClick={explain} disabled={state === 'loading'}>{state === 'loading' ? 'Preparing guidance…' : state === 'error' ? 'Try policy guidance again' : 'Explain the disclosure choice'}</button></section>;
}
