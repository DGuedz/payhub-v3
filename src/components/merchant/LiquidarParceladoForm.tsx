import React, { useState } from 'react';

type EscrowCreateResp = { ok: boolean; txHash: string; offerSequence: number };
type AnteciparResp = { ok: boolean; txHash: string; sequence: number; financedAmount: string };

export function LiquidarParceladoForm({ onSuccess, onError }: { onSuccess?: (data: { txHash: string; offerSequence: number }) => void; onError?: (message: string) => void }) {
  const [valorBrl, setValorBrl] = useState<string>('1000.00');
  const [parcelas, setParcelas] = useState<string>('10');
  const [merchantWallet, setMerchantWallet] = useState<string>('');
  const [provaId, setProvaId] = useState<string>('');
  const [jwtInput, setJwtInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [escrowInfo, setEscrowInfo] = useState<{ txHash: string; offerSequence: number } | null>(null);
  const [colateralDisponivel, setColateralDisponivel] = useState<number>(0);
  const [liquidezAtiva, setLiquidezAtiva] = useState<number>(0);
  const [antecipacaoMsg, setAntecipacaoMsg] = useState<string>('');

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    setEscrowInfo(null);
    try {
      const envJwt = process.env.NEXT_PUBLIC_DEV_JWT || '';
      const jwt = (jwtInput || '').trim() || envJwt;
      if (!jwt) {
        setError('JWT não informado. Cole manualmente ou defina NEXT_PUBLIC_DEV_JWT em .env.local.');
        return;
      }
      // V2: Criação de Evento chama EscrowCreate (destino: vault do financiador)
      const valueRlUsd = Number(valorBrl).toFixed(2);
      const resp = await fetch('http://localhost:3000/api/escrow-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ value: valueRlUsd, finishAfterUnix: null })
      });
      const data: EscrowCreateResp = await resp.json();
      if (!resp.ok || !data.ok) {
        const msg = (data as any)?.error || `Erro HTTP ${resp.status}`;
        setError(msg);
        if (onError) onError(msg);
        return;
      }
      setEscrowInfo({ txHash: data.txHash, offerSequence: data.offerSequence });
      setColateralDisponivel(Number(valueRlUsd));
      if (onSuccess) onSuccess({ txHash: data.txHash, offerSequence: data.offerSequence });
    } catch (e: any) {
      setError(e?.message || 'Falha de rede');
    } finally {
      setLoading(false);
    }
  }

  async function onAnteciparAgora() {
    setLoading(true);
    setError(null);
    try {
      const envJwt = process.env.NEXT_PUBLIC_DEV_JWT || '';
      const jwt = (jwtInput || '').trim() || envJwt;
      if (!jwt) {
        setError('JWT não informado. Cole manualmente ou defina NEXT_PUBLIC_DEV_JWT em .env.local.');
        return;
      }
      if (!escrowInfo) {
        setError('Nenhum Escrow ativo encontrado para antecipação.');
        return;
      }
      const valueRlUsd = Number(valorBrl).toFixed(2);
      const body = {
        merchantWallet: merchantWallet.trim(),
        value: valueRlUsd,
        offerSequence: escrowInfo.offerSequence,
      };
      const resp = await fetch('http://localhost:3000/api/v1/sdk_p4yhu3/antecipar-escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify(body)
      });
      const data: AnteciparResp = await resp.json();
      if (!resp.ok || !data.ok) {
        const msg = (data as any)?.error || `Erro HTTP ${resp.status}`;
        setError(msg);
        if (onError) onError(msg);
        return;
      }
      const financed = Number(data.financedAmount || '0');
      setLiquidezAtiva((prev) => Number((prev + financed).toFixed(2)));
      setAntecipacaoMsg(`Sucesso! RLUSD ${financed.toFixed(2)} (95%) foram transferidos para sua Liquidez Ativa.`);
    } catch (e: any) {
      setError(e?.message || 'Falha de rede');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ margin: 0 }}>Dashboard V2 — Ticketing & Capital</h2>
      <p style={{ marginTop: 8, color: '#9ca3af' }}>V2: Escrow como colateral (protege o Fã) + Antecipação 95% (Payment) para Liquidez D+0</p>
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
          <label htmlFor="merchantWallet">Wallet do Comerciante (para 95%)</label>
          <input id="merchantWallet" type="text" placeholder="rMERCHANT_WALLET_ADDRESS" value={merchantWallet} onChange={(e) => setMerchantWallet(e.target.value)} />
        </div>
        <div>
          <label htmlFor="prova">Prova Serviço ID (hash do ticket)</label>
          <input id="prova" type="text" placeholder="NFTICKET_HASH_001" value={provaId} onChange={(e) => setProvaId(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Gerando Escrow…' : 'Criar Evento (gera Escrow colateral)'}
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
      {antecipacaoMsg && (
        <div className="toast success" role="status" style={{ marginTop: 12 }}>
          {antecipacaoMsg}
        </div>
      )}
      <div className="result" style={{ marginTop: 12 }}>
        <div className="metric">
          <div className="label">Contratos Escrow Ativos (Colateral)</div>
          <div className="value">RLUSD {colateralDisponivel.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="label">Liquidez Ativa (RLUSD)</div>
          <div className="value">RLUSD {liquidezAtiva.toFixed(2)}</div>
        </div>
      </div>
      {escrowInfo && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onAnteciparAgora} disabled={loading || !merchantWallet}>
            {loading ? 'Antecipando…' : 'Antecipar 95% Agora'}
          </button>
          <span style={{ color: '#9ca3af' }}>Escrow CPF (offerSequence): {escrowInfo.offerSequence}</span>
        </div>
      )}
    </section>
  );
}