"use client";
import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";

function useJwt() {
  const dev = process.env.NEXT_PUBLIC_DEV_JWT || "";
  const [manual, setManual] = useState("");
  const token = (manual || "").trim() || dev || (typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "");
  return { token, setManual };
}

type TxLog = { id: string; type: string; amount?: string; currency?: string; txHash?: string; timestamp: string };

export default function MerchantPage() {
  const COLORS = {
    BACKGROUND: "#001F3F",
    CARD_BG: "#0A2A52",
    ACCENT_GREEN: "#00FF84",
    ACCENT_RED: "#FF1744",
    TEXT_LIGHT: "#FFFFFF",
    TEXT_DARK: "#001F3F",
  };

  const { token, setManual } = useJwt();
  const [tab, setTab] = useState<"pos" | "treasury">("pos");
  const [method, setMethod] = useState<"PIX" | "Cartão" | "QR Cripto">("PIX");
  const [valor, setValor] = useState<string>("1000.00");
  const [loading, setLoading] = useState(false);
  const [balanceRlusd, setBalanceRlusd] = useState<string>("12500.00");
  const [apyLabel] = useState<string>("5–8% APY");
  const [profit] = useState<string>("1.25");
  const [logs, setLogs] = useState<TxLog[]>([]);
  const [issuer, setIssuer] = useState(process.env.NEXT_PUBLIC_RLUSD_ISSUER || "rRLUSDIssuer...");
  const [owner, setOwner] = useState(process.env.NEXT_PUBLIC_ESCROW_OWNER_ADDRESS || "rVaultAddress...");
  const simulateEscrow = (process.env.NEXT_PUBLIC_DEV_ESCROW_SIMULATE || "1") === "1";

  async function callApi(path: string, init: RequestInit = {}) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(path, { ...init, headers: { ...headers, ...(init.headers as any) } });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) throw new Error("401: Acesso negado. Insira o JWT de Produção.");
      if (res.status === 429) throw new Error("429: Sobrecarga. Tente novamente em 30s.");
      throw new Error(data?.error || res.statusText);
    }
    return data;
  }

  async function onReceberPagamento() {
    try {
      setLoading(true);
      if (!token) throw new Error("Autenticação necessária (JWT)");
      if (simulateEscrow) {
        const sim = await callApi('/api/simulate/escrow-e2e', { method: 'POST', body: JSON.stringify({ value: valor, merchantWallet: owner }) });
        const art = sim?.artifacts || {};
        if (art.trustline) pushLog({ type: "Trustline OK", txHash: String(art.trustline.txHash || "") });
        if (art.escrowCreate) pushLog({ type: "Escrow Criado", amount: valor, currency: "RLUSD", txHash: String(art.escrowCreate.txHash || "") });
        if (art.escrowFinish) pushLog({ type: "Liquidação D+0", txHash: String(art.escrowFinish.txHash || "") });
      } else {
        const trust = await callApi("/api/odl/trustline-rlusd", { method: "POST", body: JSON.stringify({ limit: "1000000" }) });
        pushLog({ type: "Trustline OK", txHash: String(trust?.txHash || "") });
        const created = await callApi("/api/escrow/create", { method: "POST", body: JSON.stringify({ value: valor }) });
        const seq = Number(created?.offerSequence);
        const ownerResp = String(created?.owner || owner);
        pushLog({ type: "Escrow Criado", amount: valor, currency: "RLUSD", txHash: String(created?.txHash || "") });
        const finished = await callApi("/api/escrow/finish", { method: "POST", body: JSON.stringify({ owner: ownerResp, offerSequence: seq }) });
        pushLog({ type: "Liquidação D+0", txHash: String(finished?.txHash || "") });
      }
      toast.success("Pagamento Aprovado. Liquidez em RLUSD recebida em 3s.");
      const valorNumerico = Number(valor.replace(",", ".")) || 0;
      const novoSaldo = Number(balanceRlusd.replace(",", ".")) + valorNumerico;
      setBalanceRlusd(novoSaldo.toFixed(2).replace(".", ","));
    } catch (e: any) {
      toast.error(e?.message || "Falha ao liquidar. Verifique o JWT e as ENV.");
    } finally {
      setLoading(false);
    }
  }

  function pushLog(partial: Partial<TxLog>) {
    const entry: TxLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: String(partial.type || "Evento"),
      amount: partial.amount,
      currency: partial.currency,
      txHash: partial.txHash,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [entry, ...prev].slice(0, 50));
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: COLORS.BACKGROUND, color: COLORS.TEXT_LIGHT, paddingBottom: 24, padding: 16 }}>
      <Toaster position="top-right" />
      <header style={{ paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.CARD_BG}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, background: token ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED, borderRadius: 999 }} />
          <span style={{ fontWeight: 700 }}>Segurança Nível Bancário</span>
        </div>
        <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Autenticação</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                placeholder="Informe seu JWT para ativar segurança nível bancário"
                value={token}
                onChange={(e) => { setManual(e.target.value); if (typeof window !== "undefined") { try { localStorage.setItem("jwt_token", e.target.value); } catch {} } }}
                style={{ padding: "8px 10px", borderRadius: 8, border: "none", backgroundColor: COLORS.CARD_BG, color: COLORS.TEXT_LIGHT, minWidth: 280 }}
              />
              <button
                onClick={() => { if (typeof window !== "undefined") { try { localStorage.setItem("jwt_token", token); } catch {} } toast.success("Autenticação ativada"); }}
                style={{ background: COLORS.ACCENT_GREEN, color: COLORS.TEXT_DARK, padding: "8px 12px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}
              >Ativar</button>
            </div>
          </div>
          <button onClick={() => setTab("pos")} style={{ background: tab === "pos" ? COLORS.ACCENT_GREEN : COLORS.CARD_BG, color: tab === "pos" ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT, padding: "8px 12px", borderRadius: 10, fontWeight: 700, border: "none", cursor: "pointer" }}>Liquidação Rápida</button>
          <button onClick={() => setTab("treasury")} style={{ background: tab === "treasury" ? COLORS.ACCENT_GREEN : COLORS.CARD_BG, color: tab === "treasury" ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT, padding: "8px 12px", borderRadius: 10, fontWeight: 700, border: "none", cursor: "pointer" }}>Tesouraria Ativa</button>
        </nav>
      </header>

      {tab === "pos" && (
        <section style={{ padding: 24 }}>
          <div style={{ maxWidth: 640, margin: "0 auto", background: COLORS.CARD_BG, borderRadius: 16, padding: 24 }}>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: COLORS.ACCENT_GREEN }}>Terminal Soft-POS (D+0)</h1>
            <p style={{ opacity: 0.8, marginTop: 8 }}>O seu caixa, sem a espera e as taxas do banco.</p>
            <div style={{ marginTop: 24 }}>
              <label style={{ opacity: 0.9, textAlign: 'center', display: 'block' }}>Valor da Venda</label>
              <input type="text" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="R$ 1000.00" style={{ marginTop: 6, width: "100%", padding: 20, borderRadius: 10, border: "none", backgroundColor: COLORS.BACKGROUND, color: COLORS.TEXT_LIGHT, fontSize: 36, textAlign: 'center' }} />
            </div>
            <div style={{ marginTop: 20 }}>
              <label style={{ opacity: 0.9 }}>Método do Cliente</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {["PIX", "Cartão", "QR Cripto"].map((m) => (
                  <button key={m} onClick={() => setMethod(m as any)} style={{ background: method === m ? COLORS.ACCENT_GREEN : COLORS.BACKGROUND, color: method === m ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT, padding: "10px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>{m}</button>
                ))}
              </div>
            </div>
            <details style={{ marginTop: 20, padding: 10, border: `1px solid ${COLORS.BACKGROUND}`, borderRadius: 8 }}>
              <summary style={{ fontWeight: 700, cursor: "pointer" }}>️ Configuração de Teste (Júri/Dev)</summary>
              <div style={{ marginTop: 10 }}>
                <label style={{ opacity: 0.9 }}>JWT Token</label>
                <input value={token} onChange={(e) => setManual(e.target.value)} placeholder="Bearer token (para Testes)" style={{ marginTop: 6, width: "100%", padding: 10, borderRadius: 8, backgroundColor: COLORS.BACKGROUND, color: COLORS.TEXT_LIGHT }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ opacity: 0.9 }}>RLUSD Issuer</label>
                <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="rISSUER_ADDRESS" style={{ marginTop: 6, width: "100%", padding: 10, borderRadius: 8, backgroundColor: COLORS.BACKGROUND, color: COLORS.TEXT_LIGHT }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ opacity: 0.9 }}>Escrow Owner Vault</label>
                <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="rOWNER_ADDRESS (Tesouraria)" style={{ marginTop: 6, width: "100%", padding: 10, borderRadius: 8, backgroundColor: COLORS.BACKGROUND, color: COLORS.TEXT_LIGHT }} />
              </div>
            </details>
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <button disabled={loading || !token || !issuer || !owner} onClick={onReceberPagamento} style={{ background: COLORS.ACCENT_GREEN, color: COLORS.TEXT_DARK, padding: "20px 24px", borderRadius: 12, fontWeight: 800, fontSize: 20, border: "none", cursor: "pointer", width: "100%" }}>{loading ? "PROCESSANDO LIQUIDEZ..." : "RECEBER PAGAMENTO E LIQUIDAR D+0"}</button>
              {!token && <p style={{ color: COLORS.ACCENT_RED, marginTop: 10 }}>JWT ausente. Necessário para transações seguras.</p>}
            </div>
          </div>
        </section>
      )}

      {tab === "treasury" && (
        <section style={{ padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: COLORS.ACCENT_GREEN }}>Tesouraria Ativa</h1>
          <p style={{ opacity: 0.8, marginTop: 8 }}>Gestão da liquidez e rendimento em tempo real.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24, marginTop: 24 }}>
            <div style={{ background: COLORS.CARD_BG, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.BACKGROUND}` }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Saldo em RLUSD (Stablecoin)</h2>
              <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800, color: COLORS.TEXT_LIGHT }}>$ {balanceRlusd}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>Liquidez para liquidação D+0.</div>
            </div>
            <div style={{ background: COLORS.CARD_BG, borderRadius: 16, padding: 24, border: `2px solid ${COLORS.ACCENT_GREEN}` }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Lucro em APY</h2>
              <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800, color: COLORS.ACCENT_GREEN }}>+ $ {profit}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>{apyLabel} gerado pelo HUB AI.</div>
              <div style={{ marginTop: 6, opacity: 0.6 }}>Performance Fee de 10% sobre o lucro.</div>
            </div>
            <div style={{ background: COLORS.CARD_BG, borderRadius: 16, padding: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Controles da Tesouraria</h2>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const result = await callApi('/api/v1/merchant/yield/activate', { method: 'POST', body: JSON.stringify({ merchantId: 'merchant-dev' }) });
                      toast.success(result.message || 'Rendimento ativado com sucesso!');
                    } catch (e: any) {
                      toast.error(e?.message || 'Falha ao ativar o rendimento.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  style={{ background: COLORS.ACCENT_GREEN, color: COLORS.TEXT_DARK, padding: '12px 16px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  {loading ? 'Processando...' : 'Ativar Yield Automático'}
                </button>
                <button
                  onClick={() => {
                    // Acessa a URL do endpoint para iniciar o download
                    window.location.href = '/api/v1/compliance/report';
                    toast.success('Seu relatório de compliance está sendo gerado.');
                  }}
                  style={{ background: '#4DA6FF', color: COLORS.TEXT_DARK, padding: '12px 16px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Gerar Relatório de Compliance
                </button>
              </div>
            </div>
            <div style={{ background: COLORS.CARD_BG, borderRadius: 16, padding: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Infraestrutura Institucional</h2>
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ background: COLORS.BACKGROUND, padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 700 }}>Segurança SOC 2</span>
                <span style={{ background: COLORS.BACKGROUND, padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 700 }}>Custódia Metaco</span>
                <span style={{ background: COLORS.BACKGROUND, padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 700 }}>Liquidez HiddenRoad</span>
                <span style={{ background: COLORS.BACKGROUND, padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 700 }}>Compliance KMS</span>
                <span style={{ background: COLORS.BACKGROUND, padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 700 }}>Defesa Ativa</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 30, background: COLORS.CARD_BG, borderRadius: 16, padding: 24 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Histórico de Liquidez (Logs Abstratos)</h2>
            <div style={{ marginTop: 15, display: "grid", gap: 10 }}>
              {logs.length === 0 && <div style={{ opacity: 0.8 }}>Sem registros recentes de transação.</div>}
              {logs.map((l) => (
                <div key={l.id} style={{ background: COLORS.BACKGROUND, borderRadius: 10, padding: 12, borderLeft: `3px solid ${l.type.includes("Liquidação") ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED}` }}>
                  <div style={{ fontWeight: 700 }}>{l.type} - {l.amount ? `${l.amount} RLUSD` : "Evento"}</div>
                  <div style={{ opacity: 0.8 }}>Status: {l.txHash ? `Hash on-chain` : "Local"}</div>
                  <div style={{ opacity: 0.6 }}>{new Date(l.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
