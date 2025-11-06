import React, { useState } from 'react';

type SuccessData = {
  status: string;
  operationId: string;
  txHash: string;
};

export function LiquidarParceladoForm({ onSuccess, onError }: { onSuccess?: (data: SuccessData) => void; onError?: (message: string) => void }) {
  const [valorBrl, setValorBrl] = useState<string>('1000.00');
  const [parcelas, setParcelas] = useState<string>('10');
  const [wallet, setWallet] = useState<string>('');
  const [provaId, setProvaId] = useState<string>('');
  const [jwtInput, setJwtInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const envJwt = process.env.NEXT_PUBLIC_DEV_JWT || '';
      const jwt = (jwtInput || '').trim() || envJwt;
      if (!jwt) {
        setError('JWT não informado. Cole manualmente ou defina NEXT_PUBLIC_DEV_JWT em .env.local.');
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
        const msg = data?.error || `Erro HTTP ${resp.status}`;
        setError(msg);
        if (onError) onError(msg);
        return;
      }
      setSuccess(data as SuccessData);
      if (onSuccess) onSuccess(data as SuccessData);
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
        {!process.env.NEXT_PUBLIC_DEV_JWT && !jwtInput && (
          <span style={{ color: '#fca5a5' }}>
            Cole um JWT acima ou configure NEXT_PUBLIC_DEV_JWT em .env.local (não versionado).
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
    </section>
  );
}