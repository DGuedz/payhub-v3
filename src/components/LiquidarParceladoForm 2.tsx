import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

type SuccessData = {
  status: string;
  operationId: string;
  txHash: string;
};

export function LiquidarParceladoForm() {
  const [valorBrl, setValorBrl] = useState<string>('1000.00');
  const [parcelas, setParcelas] = useState<string>('10');
  const [wallet, setWallet] = useState<string>('');
  const [provaId, setProvaId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [jwtInput, setJwtInput] = useState<string>('');

  const devJwt = useMemo(() => {
    // Suporta convenções Next.js (NEXT_PUBLIC_) e Vite (VITE_)
    const fromNext = (import.meta as any).env?.NEXT_PUBLIC_DEV_JWT as string | undefined;
    const fromVite = (import.meta as any).env?.VITE_DEV_JWT as string | undefined;
    return fromNext || fromVite || '';
  }, []);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const jwt = (jwtInput || '').trim() || devJwt;
      if (!jwt) {
        setError('JWT não informado. Cole manualmente ou defina em .env.local.');
        return;
      }
      const body = {
        valor_brl: Number(valorBrl),
        parcelas: Number(parcelas),
        recebedor_wallet: wallet.trim(),
        prova_servico_id: provaId.trim(),
      };
      const resp = await fetch('http://localhost:3000/api/v1/sdk_p4yhu3/liquidar-parcelado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || `Erro HTTP ${resp.status}`);
        return;
      }
      setSuccess(data as SuccessData);
      try {
        const s = data as SuccessData;
        if (s && s.operationId && s.txHash) {
          toast.success(`Sucesso: operationId=${s.operationId} txHash=${s.txHash}`);
        }
      } catch {}
    } catch (e: any) {
      setError(e?.message || 'Falha de rede');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ margin: 0 }}>Criação de Eventos/Ticketing — Liquidar Parcelado</h2>
      <p style={{ marginTop: 8, color: '#9ca3af' }}>Orquestração (Capital → Assurance → Rails → Reporting)</p>
      <form onSubmit={onSubmit} className="grid" style={{ marginTop: 12 }}>
        <div>
          <label htmlFor="jwt">JWT (Bearer)</label>
          <input id="jwt" type="text" placeholder="cole seu JWT aqui (opcional)" value={jwtInput} onChange={(e) => setJwtInput(e.target.value)} />
        </div>
        <div>
          <label htmlFor="valor">Valor BRL</label>
          <input id="valor" type="number" step="0.01" value={valorBrl} onChange={(e) => setValorBrl(e.target.value)} />
        </div>
        <div>
          <label htmlFor="parcelas">Parcelas</label>
          <input id="parcelas" type="number" value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
        </div>
        <div>
          <label htmlFor="wallet">Recebedor Wallet</label>
          <input id="wallet" type="text" placeholder="rMERCHANT_WALLET_ADDRESS" value={wallet} onChange={(e) => setWallet(e.target.value)} />
        </div>
        <div>
          <label htmlFor="prova">Prova Serviço ID (hash do ticket)</label>
          <input id="prova" type="text" placeholder="NFTICKET_HASH_001" value={provaId} onChange={(e) => setProvaId(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Processando…' : 'Disparar Orquestração'}
          </button>
          {loading && <span className="spinner" aria-label="carregando" />}
        </div>
      </form>
      <div className="status" aria-live="polite" style={{ marginTop: 8 }}>
        {!devJwt && !jwtInput && (
          <span style={{ color: '#fca5a5' }}>
            Cole um JWT acima ou configure NEXT_PUBLIC_DEV_JWT/VITE_DEV_JWT em .env.local (não versionado).
          </span>
        )}
      </div>
      {error && (
        <div className="toast error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="result" style={{ marginTop: 12 }}>
          <div className="metric">
            <div className="label">Operation ID</div>
            <div className="value">{success.operationId}</div>
          </div>
          <div className="metric">
            <div className="label">Tx Hash</div>
            <div className="value">{success.txHash}</div>
          </div>
        </div>
      )}
      <style>{`
        .card { background:#0e131a; border:1px solid #1f2937; border-radius:12px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.25); }
        .grid { display:grid; grid-template-columns:1fr; gap:12px; }
        label { font-size:13px; color:#9ca3af; }
        input { width:100%; color:#e5e7eb; background:#0b0f14; border:1px solid #1f2937; border-radius:8px; padding:10px; font-size:14px; }
        input:focus { outline:2px solid #2563eb; border-color:#2563eb; }
        button { appearance:none; border:1px solid #2563eb; background:#1f2937; color:#bfdbfe; padding:10px 14px; border-radius:8px; font-weight:600; cursor:pointer; }
        button:hover { background:#0b1220; }
        button[disabled] { opacity:0.55; cursor:not-allowed; }
        .spinner { width:16px; height:16px; border-radius:999px; border:2px solid #93c5fd; border-top-color:transparent; display:inline-block; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .toast { background:#111827; border-left:4px solid #ef4444; padding:10px 12px; border-radius:8px; color:#fecaca; }
        .result { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .metric { background:#0b0f14; border:1px solid #1f2937; border-radius:8px; padding:10px; }
        .label { font-size:12px; color:#9ca3af; }
        .value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#93c5fd; margin-top:4px; font-size:12px; }
      `}</style>
    </section>
  );
}