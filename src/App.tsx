import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, ChevronDown, Copy, Cpu, Fingerprint, LockKeyhole, Network as NetworkIcon, Radio, ReceiptText, Rocket, ShieldCheck, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { submitSealedBid } from './lib/circuit';
import { deployAuctionForWorker, loadWorkerDeployments, type WorkerContractDeployment } from './lib/deployment';
import { PolicyLens } from './PolicyLens';
import { loadPrivateBid, rotatePrivateBid, sealPrivateBid, type PrivateBid } from './lib/privateState';
import { connectPreferredWallet, validateWalletSession, type ConnectedWallet, type Network as AuctionNetwork, messageForWalletError } from './lib/wallet';
import { Marketing } from './Marketing';

type Stage = 1 | 2 | 3 | 4;
const short = (value: string) => `${value.slice(0, 8)}…${value.slice(-5)}`;
const steps = ['Public requirement', 'Local bid', 'Disclosure review', 'Proof & submit'];

export function App() {
  const [view, setView] = useState(window.location.pathname === '/auction' ? 'auction' : 'home');
  useEffect(() => { const sync = () => setView(window.location.pathname === '/auction' ? 'auction' : 'home'); window.addEventListener('popstate', sync); window.addEventListener('kora:navigate', sync); return () => { window.removeEventListener('popstate', sync); window.removeEventListener('kora:navigate', sync); }; }, []);
  return view === 'auction' ? <AuctionConsole /> : <Marketing />;
}

function AuctionConsole() {
  const reduce = useReducedMotion(); const [stage, setStage] = useState<Stage>(1); const [bid, setBid] = useState<PrivateBid | null>(null);
  const [network, setNetwork] = useState<AuctionNetwork>('preview'); const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [tx, setTx] = useState<string | null>(null); const [notice, setNotice] = useState(''); const [deployments, setDeployments] = useState<WorkerContractDeployment[]>([]);
  useEffect(() => setBid(loadPrivateBid()), []);
  useEffect(() => setDeployments(wallet ? loadWorkerDeployments(network, wallet.address) : []), [wallet, network]);
  useEffect(() => {
    if (!wallet) return;
    let active = true;
    let checking = false;
    const check = async () => {
      if (!active || checking || document.visibilityState === 'hidden') return;
      checking = true;
      try { await validateWalletSession(wallet); }
      catch (cause) {
        if (active) {
          setWallet(null);
          setDeployments([]);
          setError(messageForWalletError(cause));
          setNotice('');
        }
      } finally { checking = false; }
    };
    const timer = window.setInterval(() => void check(), 5_000);
    window.addEventListener('focus', check);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', check); };
  }, [wallet]);
  async function seal(amount: string) { setError(''); setBusy(true); try { const next = await sealPrivateBid(amount); setBid(next); setStage(3); setNotice('The bid amount and witness are kept in this tab; only the eligibility proof and one-time nullifier are submitted.'); } catch (cause) { setError(messageForWalletError(cause)); } finally { setBusy(false); } }
  async function rotateBid(amount: string) { setError(''); setBusy(true); try { const next = await rotatePrivateBid(amount); setBid(next); setNotice('Replaced the private bid witness in this tab. The earlier value was overwritten.'); } catch (cause) { setError(messageForWalletError(cause)); } finally { setBusy(false); } }
  async function connect() { setError(''); setBusy(true); try { setWallet(await connectPreferredWallet(network)); setNotice('Wallet connected for this session only.'); } catch (cause) { setError(messageForWalletError(cause)); } finally { setBusy(false); } }
  function reportWalletFailure(cause: unknown) {
    const message = messageForWalletError(cause);
    setError(message);
    if (/connection was lost|switched to|account changed/i.test(message)) { setWallet(null); setDeployments([]); }
  }
  async function submit() { if (!wallet || !bid) return; const deployment = deployments[0]; if (!deployment) { setError('Deploy your worker auction contract first.'); return; } setError(''); setBusy(true); try { await validateWalletSession(wallet); const result = await submitSealedBid(wallet, deployment.contractAddress, bid.bidAmount, bid.bidderSecret); setTx(result.transactionId); setNotice('Submitted to the selected Midnight network. Awaiting ledger finalization.'); } catch (cause) { reportWalletFailure(cause); } finally { setBusy(false); } }
  async function deployContract() { if (!wallet) return; setError(''); setBusy(true); try { await validateWalletSession(wallet); const deployment = await deployAuctionForWorker(wallet); setDeployments(loadWorkerDeployments(network, wallet.address)); setNotice(`Auction contract deployed: ${short(deployment.contractAddress)} · ${short(deployment.transactionHash)}.`); } catch (cause) { reportWalletFailure(cause); } finally { setBusy(false); } }
  function switchNetwork(next: AuctionNetwork) { setNetwork(next); setWallet(null); setTx(null); setDeployments([]); setNotice(`Switched to ${next}; the wallet session was reset.`); }
  const show = { initial: reduce ? false : { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24 } };
  return <main className="app-shell">
    <aside className="side"><div className="brand"><span className="brand-mark">K</span><span>KORA</span></div><p className="eyebrow">Private auction exchange</p>
      <div className="auction-pill"><span className="pulse"/>Sankofa 01<ChevronDown size={15}/></div>
      <nav>{steps.map((label, index) => <button key={label} className={stage === index + 1 ? 'nav-step current' : 'nav-step'} onClick={() => setStage((index + 1) as Stage)}><b>0{index + 1}</b>{label}</button>)}</nav>
      <div className="side-bottom"><label className="select-label">Network</label><div className="network-toggle"><button className={network === 'preview' ? 'selected' : ''} onClick={() => switchNetwork('preview')}>Preview</button><button className={network === 'preprod' ? 'selected' : ''} onClick={() => switchNetwork('preprod')}>Preprod</button></div>
      {wallet ? <button className="wallet connected" onClick={() => { setWallet(null); setNotice('KORA forgot this wallet session. To revoke site access, use 1AM wallet settings.'); }}><WalletCards size={17}/><span>{short(wallet.address)}</span><small>Forget</small></button> : <button className="wallet" onClick={connect} disabled={busy}><WalletCards size={17}/>{busy ? 'Connecting…' : 'Connect 1AM'}</button>}</div>
    </aside>
    <section className="workspace"><header><div><p className="eyebrow">Sealed-bid auction</p><h1>Sankofa <em>01</em></h1></div><div className="close"><span>Closes in</span><strong>03:18:42</strong><span className="ledger"><Radio size={13}/> ledger open</span></div></header>
      <div className="stage-progress">{steps.map((label, index) => <button key={label} className={stage >= index + 1 ? 'done' : ''} onClick={() => setStage((index + 1) as Stage)}><i>{stage > index + 1 ? <Check size={12}/> : index + 1}</i><span>{label}</span></button>)}</div>
      <AnimatePresence mode="wait"><motion.section key={stage} {...show} className="stage-card">
        {stage === 1 && <Requirement onContinue={() => setStage(2)}/>}
        {stage === 2 && <LocalBid bid={bid} busy={busy} onSeal={seal} onRotate={rotateBid}/>}
        {stage === 3 && <Disclosure onBack={() => setStage(2)} onContinue={() => setStage(4)}/>}
        {stage === 4 && <Proof wallet={wallet} bid={bid} busy={busy} hasDeployment={deployments.length > 0} transactionId={tx} onConnect={connect} onDeploy={deployContract} onSubmit={submit}/>} 
      </motion.section></AnimatePresence>
      <AnimatePresence>{(notice || error) && <motion.div className={error ? 'toast error' : 'toast'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span>{error ? <AlertTriangle size={17}/> : <Check size={17}/>}</span>{error || notice}<button onClick={() => { setError(''); setNotice(''); }}>×</button></motion.div>}</AnimatePresence>
    </section>
    <aside className="insight"><div className="auction-id"><span>PUBLIC AUCTION ID</span><code>kora:sa01:7af2</code></div><PrivacyBoundary/><PolicyLens/><DeploymentPanel network={network} wallet={wallet} deployments={deployments} busy={busy} onConnect={connect} onDeploy={deployContract}/><section className="receipt"><div className="card-title"><ReceiptText size={17}/><span>Public receipt</span></div>{tx ? <><span className="verified"><Check size={14}/> Submitted</span><code>{tx}</code><p>Finalization is verified from the network; KORA never invents receipts.</p></> : <><span className="muted">No public receipt yet</span><p>A receipt appears only after a real circuit submission returns its network transaction identifier.</p></>}</section><p className="privacy-note"><LockKeyhole size={14}/> Private state stays in your browser. Disconnecting never deletes it.</p></aside>
  </main>;
}
function Requirement({ onContinue }: { onContinue: () => void }) { return <><div className="stage-heading"><span className="num">01</span><div><p className="eyebrow">Start with what is public</p><h2>Read the auction rule.</h2><p>The verifier needs a valid bid above the public reserve before the auction closes.</p></div></div><div className="rule-grid"><Metric label="Reserve requirement" value="≥ 5,000 tDUST"/><Metric label="Bid increment" value="250 tDUST"/><Metric label="Disclosure scope" value="Eligibility only"/></div><div className="callout"><ShieldCheck size={20}/><div><b>Your amount is not part of this requirement.</b><span>The proof compares it locally against the reserve and publishes only the pass/fail outcome.</span></div></div><Action label="I understand the rule" onClick={onContinue}/></> }
function validBidAmount(value: string) { if (!/^\d+$/.test(value)) return false; const amount = BigInt(value); return amount >= 5000n && amount % 250n === 0n; }
function LocalBid({ bid, busy, onSeal, onRotate }: { bid: PrivateBid | null; busy: boolean; onSeal: (amount: string) => void; onRotate: (amount: string) => void }) { const [amount, setAmount] = useState(bid?.bidAmount ?? '5000'); return <><div className="stage-heading"><span className="num">02</span><div><p className="eyebrow">Your device only</p><h2>Seal a private bid.</h2><p>Your amount is checked locally against the reserve. The amount stays in this browser tab; only a proof is sent to Midnight.</p></div></div><label className="bid-amount-field">Private bid amount <span>tDUST</span><input aria-label="Private bid amount in tDUST" type="number" min="5000" step="250" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy}/></label><div className={bid ? 'capsule sealed' : 'capsule'}><Fingerprint size={29}/><div><b>{bid ? 'Private bid capsule ready' : 'No private bid loaded'}</b><span>{bid ? `Commitment ${short(bid.commitment)}` : 'Your amount and witness remain in this tab.'}</span></div>{bid && <span className="device-tag">LOCAL</span>}</div>{bid ? <button className="secondary" disabled={busy || !validBidAmount(amount)} onClick={() => { onRotate(amount); }}>Replace local bid</button> : <Action label={busy ? 'Sealing locally…' : 'Seal private bid'} disabled={busy || !validBidAmount(amount)} onClick={() => onSeal(amount)}/>}<p className="fine-print">Minimum 5,000 tDUST; increments of 250. Your private witness is cleared when this browser tab session ends.</p></> }
function Disclosure({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) { return <><div className="stage-heading"><span className="num">03</span><div><p className="eyebrow">Make disclosure explicit</p><h2>Review the proof boundary.</h2><p>There is no “trust us” moment: every visible ledger fact is named before you connect.</p></div></div><PrivacyBoundary large/><div className="actions"><button className="secondary" onClick={onBack}>Back</button><Action label="Continue to proof" onClick={onContinue}/></div></> }
function Proof({ wallet, bid, busy, hasDeployment, transactionId, onConnect, onDeploy, onSubmit }: { wallet: ConnectedWallet | null; bid: PrivateBid | null; busy: boolean; hasDeployment: boolean; transactionId: string | null; onConnect: () => void; onDeploy: () => void; onSubmit: () => void }) { const ready = !!wallet && !!bid && hasDeployment; return <><div className="stage-heading"><span className="num">04</span><div><p className="eyebrow">Midnight proof</p><h2>{transactionId ? 'Submission recorded.' : 'Generate, then submit.'}</h2><p>{transactionId ? 'Keep this receipt for public verification.' : 'Your wallet balances, proves, and submits only after you approve.'}</p></div></div><div className="proof-flow"><div className={bid ? 'proof-node live' : 'proof-node'}><Cpu size={20}/><span>Private witness</span><small>{bid ? 'loaded locally' : 'required'}</small></div><i/><div className={ready ? 'proof-node live' : 'proof-node'}><NetworkIcon size={20}/><span>ZK circuit</span><small>{ready ? 'ready to prove' : 'wallet / contract required'}</small></div><i/><div className="proof-node"><ReceiptText size={20}/><span>Public receipt</span><small>{transactionId ? 'submitted' : 'not created'}</small></div></div>{!wallet ? <Action label="Connect 1AM to continue" onClick={onConnect} disabled={busy}/> : !hasDeployment ? <Action label={busy ? 'Deploying…' : 'Deploy my auction contract'} onClick={onDeploy} disabled={busy}/> : !bid ? <p className="empty">Return to Local bid to create your browser-only commitment.</p> : transactionId ? <div className="success"><Check size={18}/> Submitted: <code>{transactionId}</code></div> : <Action label={busy ? 'Generating proof…' : 'Generate proof & submit'} onClick={onSubmit} disabled={busy}/>}<p className="fine-print">The generated contract and ZK artifacts are bundled with this frontend. Your wallet handles proofs, DUST balancing, and transaction authorization.</p></> }
function DeploymentPanel({ network, wallet, deployments, busy, onConnect, onDeploy }: { network: AuctionNetwork; wallet: ConnectedWallet | null; deployments: WorkerContractDeployment[]; busy: boolean; onConnect: () => void; onDeploy: () => void }) { return <section className="deployment-card"><div className="card-title"><Rocket size={17}/><span>Worker contract</span><span className="deployment-network">{network}</span></div>{!wallet ? <><p className="deployment-copy">Connect 1AM to deploy an auction contract from this browser under your own wallet.</p><button className="secondary deployment-action" onClick={onConnect} disabled={busy}><WalletCards size={15}/>Connect 1AM</button></> : <><p className="deployment-copy">Deployment is signed by <code>{short(wallet.address)}</code> on {network}. The address and transaction hash are saved in this browser for this wallet and network.</p>{deployments.length > 0 && <div className="deployment-list">{deployments.slice(0, 3).map((deployment) => <article className="deployment-record" key={`${deployment.network}:${deployment.transactionHash}`}><span className="deployment-label">CONTRACT ADDRESS</span><code title={deployment.contractAddress}>{deployment.contractAddress}</code><span className="deployment-label">DEPLOYMENT TX</span><code title={deployment.transactionHash}>{deployment.transactionHash}</code><time dateTime={deployment.deployedAt}>{new Date(deployment.deployedAt).toLocaleString()}</time><button className="copy-deployment" onClick={() => void navigator.clipboard?.writeText(deployment.contractAddress)} aria-label="Copy contract address"><Copy size={13}/> Copy address</button></article>)}</div>}<button className="primary action deployment-action" onClick={onDeploy} disabled={busy}>{busy ? 'Waiting for 1AM…' : deployments.length ? 'Deploy another auction' : 'Deploy my auction contract'}<ArrowRight size={16}/></button>{deployments.length === 0 && <p className="deployment-hint">1AM will ask you to approve the deployment. You will need DUST for network fees.</p>}</>}</section> }
function PrivacyBoundary({ large = false }: { large?: boolean }) { return <section className={`boundary ${large ? 'large' : ''}`}><div className="boundary-title"><LockKeyhole size={16}/><span>Privacy boundary</span></div><div className="boundary-columns"><div><p>KEPT PRIVATE</p><span>Bid amount</span><span>Bidder identity</span><span>Local witness & secret</span></div><div><p>PUBLIC LEDGER</p><span>Eligible: yes / no</span><span>Nullifier (one bid)</span><span>Finalized transaction ID</span></div></div></section> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div> }
function Action({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) { return <button className="primary action" onClick={onClick} disabled={disabled}>{label}<ArrowRight size={17}/></button> }
