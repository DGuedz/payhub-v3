'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

function useJwt() {
  const [jwt, setJwt] = useState<string>('');
  useEffect(() => {
    const t = localStorage.getItem('jwt_token') || '';
    if (t) setJwt(t);
  }, []);
  const save = (v: string) => {
    setJwt(v);
    localStorage.setItem('jwt_token', v);
  };
  return { jwt, save };
}

function useApi(baseOverride?: string) {
  const base = useMemo(() => baseOverride || process.env.NEXT_PUBLIC_API_BASE_URL || '', [baseOverride]);
  const call = async (path: string, method: string, body?: any, jwt?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
    const r = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const ct = r.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await r.json() : await r.text();
    return { status: r.status, data };
  };
  return { base, call };
}

function ExplorerLink({ hash }: { hash?: string }) {
  if (!hash) return null;
  const href = `https://testnet.xrpl.org/transactions/${hash}`;
  return <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline">Explorer</a>;
}

export const XRPLTestPanel: React.FC = () => {
  const { jwt, save } = useJwt();
  const { call } = useApi();
  const [trustLimit, setTrustLimit] = useState('1000');
  const [escrowValue, setEscrowValue] = useState('1000.00');
  const [owner, setOwner] = useState('');
  const [offerSequence, setOfferSequence] = useState<number | null>(null);
  const [evmAccount, setEvmAccount] = useState<string>('');
  const [policyRequireKyc, setPolicyRequireKyc] = useState(false);
  const [policyNftId, setPolicyNftId] = useState('');
  const [preimageHex, setPreimageHex] = useState('');
  const [fulfillmentHex, setFulfillmentHex] = useState('');
  const [xrpDest, setXrpDest] = useState('');
  const [xrpAmount, setXrpAmount] = useState('0.001');
  const [ccDest, setCcDest] = useState('');
  const [deliverCurrency, setDeliverCurrency] = useState('RLUSD');
  const [deliverIssuer, setDeliverIssuer] = useState('');
  const [deliverValue, setDeliverValue] = useState('1.00');
  const [sourceCurrency, setSourceCurrency] = useState('XRP');
  const [sourceIssuer, setSourceIssuer] = useState('rrrrrrrrrrrrrrrrrrrrrhoLvTp');
  const [sendMaxValue, setSendMaxValue] = useState('1.00');
  const [quotePathsCount, setQuotePathsCount] = useState<number | null>(null);
  const [poolCurrency, setPoolCurrency] = useState('RLUSD');
  const [poolIssuer, setPoolIssuer] = useState('');
  const [amountA, setAmountA] = useState('0');
  const [amountB, setAmountB] = useState('0');
  const [lpTokenAmount, setLpTokenAmount] = useState('0');
  const logRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<Array<any>>([]);

  const append = (e: any) => {
    setEntries((prev) => [...prev, e]);
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 0);
  };

  const runTrustline = async () => {
    const res = await call('/api/trustline-rlusd', 'POST', { limit: trustLimit }, jwt);
    append({ op: 'trustline-rlusd', res });
  };
  const runEscrowCreate = async () => {
    const policy = policyRequireKyc || policyNftId ? { requireKyc: policyRequireKyc, nftId: policyNftId, destination: owner || undefined, subject: owner || undefined } : undefined;
    const res = await call('/api/escrow-create', 'POST', { value: escrowValue, policy, preimageHex }, jwt);
    append({ op: 'escrow-create', res });
    const d = res && res.data ? res.data : {};
    if (d && d.offerSequence) setOfferSequence(Number(d.offerSequence));
    if (d && d.owner) setOwner(String(d.owner));
  };
  const runEscrowFinish = async () => {
    const policy = policyRequireKyc || policyNftId ? { requireKyc: policyRequireKyc, nftId: policyNftId, destination: owner || undefined, subject: owner || undefined } : undefined;
    const res = await call('/api/escrow-finish', 'POST', { owner, offerSequence, fulfillmentHex, policy }, jwt);
    append({ op: 'escrow-finish', res });
  };

  const connectMetaMask = async () => {
    try {
      // @ts-ignore
      if (!(window && window.ethereum)) {
        append({ op: 'metamask', res: { status: 0, data: 'MetaMask não detectado' } });
        return;
      }
      // @ts-ignore
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const acc = Array.isArray(accounts) ? accounts[0] : '';
      setEvmAccount(acc || '');
      append({ op: 'metamask', res: { status: 200, data: { account: acc } } });
    } catch (e: any) {
      append({ op: 'metamask', res: { status: 500, data: e && e.message ? e.message : String(e) } });
    }
  };

  const activateYield = async () => {
    const res = await call('/api/v1/merchant/yield/activate', 'POST', { merchantId: evmAccount || owner || 'merchant_test' }, jwt);
    append({ op: 'yield-activate', res });
  };

  const runXrpPayment = async () => {
    const res = await call('/api/xrp-payment', 'POST', { destination: xrpDest, amountXrp: xrpAmount }, jwt);
    append({ op: 'xrp-payment', res });
  };

  const runCrossCurrency = async () => {
    const res = await call('/api/cross-currency-payment', 'POST', {
      destination: ccDest,
      deliverCurrency,
      deliverIssuer,
      deliverValue,
      sourceCurrency,
      sourceIssuer,
      sendMaxValue,
    }, jwt);
    append({ op: 'cross-currency', res });
  };

  const runAmmQuote = async () => {
    const res = await call('/api/amm/quote', 'POST', {
      sourceAccount: owner || 'rTEST_SOURCE',
      destinationAccount: ccDest || 'rTEST_DEST',
      deliverCurrency,
      deliverIssuer,
      deliverValue,
      sendMaxCurrency: sourceCurrency,
      sendMaxIssuer: sourceIssuer,
      sendMaxValue,
    }, jwt);
    const d = res && res.data ? res.data : {};
    setQuotePathsCount(typeof d.pathsCount === 'number' ? d.pathsCount : null);
    append({ op: 'amm-quote', res });
  };

  const runAmmSwap = async () => {
    const res = await call('/api/amm/swap', 'POST', {
      destination: ccDest,
      deliverCurrency,
      deliverIssuer,
      deliverValue,
      sourceCurrency,
      sourceIssuer,
      sendMaxValue,
    }, jwt);
    append({ op: 'amm-swap', res });
  };

  const runAmmDeposit = async () => {
    const res = await call('/api/amm/deposit', 'POST', { poolCurrency, poolIssuer, amountA, amountB }, jwt);
    append({ op: 'amm-deposit', res });
  };

  const runAmmWithdraw = async () => {
    const res = await call('/api/amm/withdraw', 'POST', { poolCurrency, poolIssuer, lpTokenAmount }, jwt);
    append({ op: 'amm-withdraw', res });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Testes XRPL</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <input value={jwt} onChange={(e) => save(e.target.value)} placeholder="JWT" className="w-full border rounded px-3 py-2" />
        </div>
        <button onClick={() => save(jwt)} className="bg-blue-600 text-white rounded px-4 py-2">Salvar Token</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={trustLimit} onChange={(e) => setTrustLimit(e.target.value)} placeholder="Limite Trustline RLUSD" className="border rounded px-3 py-2" />
        <button onClick={runTrustline} className="bg-gray-900 text-blue-200 border border-blue-600 rounded px-4 py-2">Trustline</button>
        <div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={escrowValue} onChange={(e) => setEscrowValue(e.target.value)} placeholder="Valor Escrow RLUSD" className="border rounded px-3 py-2" />
        <button onClick={runEscrowCreate} className="bg-gray-900 text-blue-200 border border-blue-600 rounded px-4 py-2">EscrowCreate</button>
        <div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" className="border rounded px-3 py-2" />
        <input value={offerSequence ?? ''} onChange={(e) => setOfferSequence(Number(e.target.value || ''))} placeholder="OfferSequence" className="border rounded px-3 py-2" />
        <button onClick={runEscrowFinish} className="bg-gray-900 text-blue-200 border border-blue-600 rounded px-4 py-2">EscrowFinish</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <label className="flex items-center gap-2"><input type="checkbox" checked={policyRequireKyc} onChange={(e) => setPolicyRequireKyc(e.target.checked)} /> KYC requerido</label>
        <input value={policyNftId} onChange={(e) => setPolicyNftId(e.target.value)} placeholder="NFTokenID" className="border rounded px-3 py-2" />
        <div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={preimageHex} onChange={(e) => setPreimageHex(e.target.value)} placeholder="Preimage Hex (Condition)" className="border rounded px-3 py-2" />
        <input value={fulfillmentHex} onChange={(e) => setFulfillmentHex(e.target.value)} placeholder="Fulfillment Hex" className="border rounded px-3 py-2" />
        <div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <button onClick={connectMetaMask} className="bg-purple-700 text-white rounded px-4 py-2">Conectar MetaMask</button>
        <input value={evmAccount} onChange={(e) => setEvmAccount(e.target.value)} placeholder="Conta EVM (mXRP)" className="border rounded px-3 py-2" />
        <button onClick={activateYield} className="bg-green-700 text-white rounded px-4 py-2">Ativar Yield</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={xrpDest} onChange={(e) => setXrpDest(e.target.value)} placeholder="Destino XRP" className="border rounded px-3 py-2" />
        <input value={xrpAmount} onChange={(e) => setXrpAmount(e.target.value)} placeholder="Valor XRP" className="border rounded px-3 py-2" />
        <button onClick={runXrpPayment} className="bg-blue-700 text-white rounded px-4 py-2">Payment XRP</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <input value={ccDest} onChange={(e) => setCcDest(e.target.value)} placeholder="Destino CC" className="border rounded px-3 py-2" />
        <input value={deliverValue} onChange={(e) => setDeliverValue(e.target.value)} placeholder="Deliver Value" className="border rounded px-3 py-2" />
        <input value={sendMaxValue} onChange={(e) => setSendMaxValue(e.target.value)} placeholder="SendMax" className="border rounded px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={deliverCurrency} onChange={(e) => setDeliverCurrency(e.target.value)} placeholder="Deliver Currency" className="border rounded px-3 py-2" />
        <input value={deliverIssuer} onChange={(e) => setDeliverIssuer(e.target.value)} placeholder="Deliver Issuer" className="border rounded px-3 py-2" />
        <input value={sourceCurrency} onChange={(e) => setSourceCurrency(e.target.value)} placeholder="Source Currency" className="border rounded px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={sourceIssuer} onChange={(e) => setSourceIssuer(e.target.value)} placeholder="Source Issuer" className="border rounded px-3 py-2" />
        <div></div>
        <button onClick={runCrossCurrency} className="bg-indigo-700 text-white rounded px-4 py-2">Cross Currency</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <button onClick={runAmmQuote} className="bg-yellow-600 text-white rounded px-4 py-2">AMM Quote</button>
        <button onClick={runAmmSwap} className="bg-yellow-800 text-white rounded px-4 py-2">AMM Swap</button>
        <div className="text-sm text-gray-600">Paths: {quotePathsCount ?? '-'}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <input value={poolCurrency} onChange={(e) => setPoolCurrency(e.target.value)} placeholder="Pool Currency" className="border rounded px-3 py-2" />
        <input value={poolIssuer} onChange={(e) => setPoolIssuer(e.target.value)} placeholder="Pool Issuer" className="border rounded px-3 py-2" />
        <div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <input value={amountA} onChange={(e) => setAmountA(e.target.value)} placeholder="Amount A" className="border rounded px-3 py-2" />
        <input value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="Amount B" className="border rounded px-3 py-2" />
        <button onClick={runAmmDeposit} className="bg-teal-700 text-white rounded px-4 py-2">AMM Deposit</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input value={lpTokenAmount} onChange={(e) => setLpTokenAmount(e.target.value)} placeholder="LP Token Amount" className="border rounded px-3 py-2" />
        <div></div>
        <button onClick={runAmmWithdraw} className="bg-teal-900 text-white rounded px-4 py-2">AMM Withdraw</button>
      </div>
      <div ref={logRef} className="border rounded p-3 h-40 overflow-auto text-sm bg-gray-50">
        {entries.map((e, idx) => {
          const hash = e?.res?.data?.txHash;
          const seq = e?.res?.data?.sequence || e?.res?.data?.offerSequence;
          return (
            <div key={idx} className="mb-2">
              <div className="font-medium">{e.op} • {e?.res?.status}</div>
              <div className="text-gray-600">hash: {hash} {hash ? <ExplorerLink hash={hash} /> : null}</div>
              <div className="text-gray-600">sequence: {seq}</div>
              <div className="text-gray-500">{typeof e?.res?.data === 'string' ? e.res.data : JSON.stringify(e.res.data)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
