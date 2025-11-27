"use client";
import React, { useMemo, useState, useEffect } from "react";
import { createSDK } from "../../../sdk/payhub";
import { Toaster, toast } from "react-hot-toast";

function useJwt() {
  const dev = useMemo(() => {
    const a: any = import.meta as any;
    return a?.env?.NEXT_PUBLIC_DEV_JWT || a?.env?.VITE_DEV_JWT || "";
  }, []);
  const [manual, setManual] = useState("");
  const token = (manual || "").trim() || dev || (typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "");
  return { token, manual, setManual };
}

export default function DashboardPage() {
  const { token, manual, setManual } = useJwt();

  const [trustlineHash, setTrustlineHash] = useState<string>("");
  const [createHash, setCreateHash] = useState<string>("");
  const [offerSequence, setOfferSequence] = useState<number | null>(null);
  const [finishHash, setFinishHash] = useState<string>("");
  const [ammPaths, setAmmPaths] = useState<number | null>(null);
  const [ammSwapHash, setAmmSwapHash] = useState<string>("");
  const [owner, setOwner] = useState<string>(process.env.NEXT_PUBLIC_ESCROW_OWNER_ADDRESS || "");
  const [rlusdValue, setRlusdValue] = useState<string>("100.00");
  const [rlusdIssuer, setRlusdIssuer] = useState<string>("");
  const [sourceAccount, setSourceAccount] = useState<string>("");
  const [destinationAccount, setDestinationAccount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string>("");
  const [cookieVisible, setCookieVisible] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") return !localStorage.getItem("cookie_consent");
    } catch {}
    return true;
  });
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(false);
  const [pixAmountBRL, setPixAmountBRL] = useState<string>("250.00");
  const [pixId, setPixId] = useState<string>("");
  const [pixQrBase64, setPixQrBase64] = useState<string>("");
  const [pixStatus, setPixStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [autoFinishEnabled, setAutoFinishEnabled] = useState<boolean>(true);

  async function callApi(path: string, init: RequestInit = {}) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(path, { ...init, headers: { ...headers, ...(init.headers as any) } });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || res.statusText);
    return data;
  }

  function apiBase() {
    try {
      if (typeof window !== "undefined" && window.location && window.location.origin) return window.location.origin;
    } catch {}
    return "http://localhost:3000";
  }

  async function onTrustline() {
    try {
      setLoading(true);
      setGlobalError("");
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.trustline.create("1000");
      setTrustlineHash(String(data?.txHash || ""));
      toast.success(`Trustline criada: ${String(data?.txHash || "")}`);
    } catch (e: any) {
      setGlobalError(e?.message || "Falha na trustline");
      toast.error(e?.message || "Falha na trustline");
    } finally {
      setLoading(false);
    }
  }

  async function onEscrowCreate() {
    try {
      setLoading(true);
      setGlobalError("");
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.escrow.create(rlusdValue);
      setCreateHash(String(data?.txHash || ""));
      const seq = Number(data?.offerSequence);
      if (!Number.isNaN(seq)) setOfferSequence(seq);
      toast.success(`Escrow criado: seq=${seq} hash=${String(data?.txHash || "")}`);
    } catch (e: any) {
      setGlobalError(e?.message || "Falha ao criar escrow");
      toast.error(e?.message || "Falha ao criar escrow");
    } finally {
      setLoading(false);
    }
  }

  async function onEscrowFinish() {
    try {
      setLoading(true);
      setGlobalError("");
      const seq = offerSequence;
      if (!owner || seq == null) throw new Error("Defina owner e offerSequence");
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.escrow.finish(owner, seq);
      setFinishHash(String(data?.txHash || ""));
      toast.success("Liquidação concluída em 3-5s");
    } catch (e: any) {
      setGlobalError(e?.message || "Falha ao finalizar escrow");
      toast.error(e?.message || "Falha ao finalizar escrow");
    } finally {
      setLoading(false);
    }
  }

  async function onAmmQuote() {
    try {
      setLoading(true);
      setGlobalError("");
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const hex = sdk.currencyHex("RLUSD");
      const data = await sdk.amm.quote({ sourceAccount, destinationAccount, deliverCurrency: hex, deliverIssuer: rlusdIssuer, deliverValue: "1" });
      setAmmPaths(Number(data?.pathsCount || 0));
      toast.success(`Rotas encontradas: ${Number(data?.pathsCount || 0)}`);
    } catch (e: any) {
      setGlobalError(e?.message || "Falha na cotação AMM");
      toast.error(e?.message || "Falha na cotação AMM");
    } finally {
      setLoading(false);
    }
  }

  async function onAmmSwap() {
    try {
      setLoading(true);
      setGlobalError("");
      const data = await callApi("/api/amm/swap", { method: "POST", body: JSON.stringify({}) });
      setAmmSwapHash(String(data?.txHash || ""));
      toast.success("Swap iniciado — Yield ativo");
    } catch (e: any) {
      setGlobalError(e?.message || "Falha no swap AMM");
      toast.error(e?.message || "Falha no swap AMM");
    } finally {
      setLoading(false);
    }
  }

  async function onPixGenerate() {
    try {
      setLoading(true);
      setGlobalError("");
      setPixStatus("processing");
      const data = await callApi("/api/payment/pix", { method: "POST", body: JSON.stringify({ valueBRL: pixAmountBRL }) });
      setPixId(String(data?.pixId || ""));
      setPixQrBase64(String(data?.qrCodeBase64 || ""));
      toast.success("QR PIX gerado");
      setPixStatus("idle");
    } catch (e: any) {
      setPixStatus("error");
      setGlobalError(e?.message || "Falha ao gerar QR PIX");
      toast.error(e?.message || "Falha ao gerar QR PIX");
    } finally {
      setLoading(false);
    }
  }

  async function onPixSimulateCallback() {
    try {
      setLoading(true);
      setGlobalError("");
      setPixStatus("processing");
      const data = await callApi("/api/payment/pix/callback", { method: "POST", body: JSON.stringify({ pixId, valueBRL: pixAmountBRL }) });
      if (data?.createHash) setCreateHash(String(data.createHash));
      if (data?.offerSequence != null) setOfferSequence(Number(data.offerSequence));
      if (data?.owner) setOwner(String(data.owner));
      if (data?.finishHash) setFinishHash(String(data.finishHash));
      toast.success("Pagamento PIX confirmado e liquidação concluída");
      setPixStatus("success");
    } catch (e: any) {
      setPixStatus("error");
      setGlobalError(e?.message || "Falha no callback PIX");
      toast.error(e?.message || "Falha no callback PIX");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoFinishEnabled && pixId && pixStatus === "idle") {
      onPixSimulateCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFinishEnabled, pixId]);

  async function onShareReceipt() {
    try {
      const rlusd = (Number(pixAmountBRL) / 5.0).toFixed(2);
      const payload = {
        pixId,
        brl: pixAmountBRL,
        rlusd,
        createHash,
        offerSequence,
        owner,
        finishHash,
      };
      const text = JSON.stringify(payload, null, 2);
      const canShare = typeof navigator !== "undefined" && (navigator as any).share;
      if (canShare) {
        await (navigator as any).share({ title: "Recibo PAYHUB", text });
        toast.success("Recibo compartilhado");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("Recibo copiado");
      } else {
        toast.error("Compartilhamento indisponível");
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao compartilhar recibo");
    }
  }

  async function refreshEscrows() {
    try {
      setGlobalError("");
      const res = await fetch(`/api/escrow/list${owner ? `?owner=${encodeURIComponent(owner)}` : ""}`);
      const data = await res.json();
      const first = Array.isArray(data?.escrows) ? data.escrows[0] : null;
      const seq = first?.offerSequence;
      if (seq) setOfferSequence(Number(seq));
      toast.success("Lista de escrows atualizada");
    } catch {}
  }

  async function onActivateYield() {
    try {
      setLoading(true);
      setGlobalError("");
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.yield.activate();
      toast.success(String(data?.status || "Rendimento ativado"));
    } catch (e: any) {
      setGlobalError(e?.message || "Falha ao ativar rendimento");
      toast.error(e?.message || "Falha ao ativar rendimento");
    } finally {
      setLoading(false);
    }
  }

  async function onDownloadComplianceReport() {
    try {
      setLoading(true);
      setGlobalError("");
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const csv = await sdk.compliance.exportCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compliance_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download do relatório iniciado.");
    } catch (e: any) {
      setGlobalError(e?.message || "Falha ao baixar o relatório");
      toast.error(e?.message || "Falha ao baixar o relatório");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#001F3F", color: "#ffffff", padding: 24 }}>
      <Toaster position="top-right" />
      {cookieVisible && (
        <div style={{ background: "#0a2a52", border: "1px solid #3a4a6a", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600 }}>Cookies</div>
            <div style={{ opacity: 0.9, marginTop: 4 }}>Para melhorar sua experiência e prover serviços personalizados, utilizamos cookies.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { try { if (typeof window !== "undefined") localStorage.setItem("cookie_consent", "accepted_all"); } catch {}; setCookieVisible(false); setAnalyticsEnabled(true); }} style={{ background: "#00ff84", color: "#001F3F", padding: "8px 10px", borderRadius: 8, fontWeight: 600 }}>Aceitar todos</button>
            <button onClick={() => { try { if (typeof window !== "undefined") localStorage.setItem("cookie_consent", "rejected"); } catch {}; setCookieVisible(false); setAnalyticsEnabled(false); }} style={{ background: "#ffffff", color: "#001F3F", padding: "8px 10px", borderRadius: 8 }}>Rejeitar cookies</button>
            <button onClick={() => setAnalyticsEnabled((v) => !v)} style={{ background: "#34517d", color: "#fff", padding: "8px 10px", borderRadius: 8 }}>{analyticsEnabled ? "Analytics ativado" : "Gerenciar cookies"}</button>
          </div>
        </div>
      )}
      <h1 style={{ margin: 0 }}>Cockpit de Testes</h1>
      <p style={{ marginTop: 8, opacity: 0.9 }}>Valide o fluxo E2E: Trustline, Escrow e AMM</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 16 }}>
        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>PIX Dinâmico</h2>
          <input placeholder="Valor em R$" value={pixAmountBRL} onChange={(e) => setPixAmountBRL(e.target.value)} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={onPixGenerate} style={{ background: "#ffffff", color: "#001F3F", padding: "8px 10px", borderRadius: 8 }}>Gerar QR PIX</button>
            <button onClick={onPixSimulateCallback} style={{ background: "#00ff84", color: "#001F3F", padding: "8px 10px", borderRadius: 8, fontWeight: 600 }} disabled={!pixId}>Simular Callback</button>
            <button onClick={() => setAutoFinishEnabled((v) => !v)} style={{ background: autoFinishEnabled ? "#34517d" : "#8aa0c4", color: "#fff", padding: "8px 10px", borderRadius: 8 }}>{autoFinishEnabled ? "Finalizar automático ON" : "Finalizar automático OFF"}</button>
          </div>
          <div style={{ marginTop: 8 }}>pixId={pixId || ""}</div>
          {pixQrBase64 && (
            <div style={{ marginTop: 8, background: "#001a33", borderRadius: 12, padding: 12 }}>
              <div style={{ opacity: 0.8 }}>QR (base64 payload):</div>
              <div style={{ wordBreak: "break-all", fontFamily: "monospace", marginTop: 4 }}>{pixQrBase64}</div>
            </div>
          )}
          <div style={{ marginTop: 8 }}>status={pixStatus}</div>
          {(finishHash || createHash) && (
            <div style={{ marginTop: 8, background: "#001a33", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>Recibo</div>
              <div style={{ marginTop: 6, fontFamily: "monospace" }}>BRL={pixAmountBRL} RLUSD={(Number(pixAmountBRL)/5.0).toFixed(2)}</div>
              <div style={{ marginTop: 4, fontFamily: "monospace" }}>createHash={createHash || ""}</div>
              <div style={{ marginTop: 4, fontFamily: "monospace" }}>offerSequence={offerSequence ?? ""}</div>
              <div style={{ marginTop: 4, fontFamily: "monospace" }}>owner={owner || ""}</div>
              <div style={{ marginTop: 4, fontFamily: "monospace" }}>finishHash={finishHash || ""}</div>
              <button onClick={onShareReceipt} style={{ marginTop: 8, background: "#00ff84", color: "#001F3F", padding: "8px 10px", borderRadius: 8, fontWeight: 600 }}>Compartilhar Recibo</button>
            </div>
          )}
        </div>
        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Configuração & Segurança</h2>
          <input placeholder="JWT_TOKEN" value={manual} onChange={(e) => setManual(e.target.value)} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8 }} />
          <button onClick={onTrustline} style={{ marginTop: 12, background: "#00ff84", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 600 }}>Criar Trustline RLUSD</button>
          <div style={{ marginTop: 8, color: trustlineHash ? "#00ff84" : "#ff3355" }}>{trustlineHash ? `txHash=${trustlineHash}` : "Sem txHash"}</div>
        </div>

        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Liquidez ODL — Escrow</h2>
          {globalError && <div style={{ marginTop: 8, background: "#ff3355", color: "#fff", padding: 10, borderRadius: 8 }}>{globalError}</div>}
          <input placeholder="Issuer RLUSD" value={rlusdIssuer} onChange={(e) => setRlusdIssuer(e.target.value)} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8 }} />
          <input placeholder="Valor RLUSD" value={rlusdValue} onChange={(e) => setRlusdValue(e.target.value)} style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 8 }} />
          <button onClick={onEscrowCreate} style={{ marginTop: 12, background: "#00ff84", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 600 }}>2A. Criar Escrow</button>
          <div style={{ marginTop: 8, color: createHash ? "#00ff84" : "#ff3355" }}>{createHash ? `txHash=${createHash}` : "Sem txHash"}</div>
          <input placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8 }} />
          <div style={{ marginTop: 8 }}>offerSequence={offerSequence ?? ""}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={refreshEscrows} style={{ background: "#ffffff", color: "#001F3F", padding: "8px 10px", borderRadius: 8 }}>Atualizar Escrows</button>
            <button onClick={onEscrowFinish} style={{ background: "#00ff84", color: "#001F3F", padding: "8px 10px", borderRadius: 8, fontWeight: 600 }}>2B. Finalizar Liquidez</button>
          </div>
          <div style={{ marginTop: 8, color: finishHash ? "#00ff84" : "#ff3355" }}>{finishHash ? `txHash=${finishHash}` : "Sem txHash"}</div>
        </div>

        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Rendimento Ativo — AMM</h2>
          <input placeholder="Source Account" value={sourceAccount} onChange={(e) => setSourceAccount(e.target.value)} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8 }} />
          <input placeholder="Destination Account" value={destinationAccount} onChange={(e) => setDestinationAccount(e.target.value)} style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 8 }} />
          <button onClick={onAmmQuote} style={{ marginTop: 12, background: "#ffffff", color: "#001F3F", padding: "10px 12px", borderRadius: 8 }}>3A. Cotação AMM</button>
          <div style={{ marginTop: 8 }}>{ammPaths != null ? `pathsCount=${ammPaths}` : "Sem cotação"}</div>
          <button onClick={onAmmSwap} style={{ marginTop: 12, background: "#00ff84", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 600 }}>3B. Executar Swap</button>
          <div style={{ marginTop: 8, color: ammSwapHash ? "#00ff84" : "#ff3355" }}>{ammSwapHash ? `txHash=${ammSwapHash}` : "Sem txHash"}</div>
        </div>

        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>HUB AI — Tesouraria & RegTech</h2>
          <button onClick={onActivateYield} style={{ marginTop: 12, background: "#00ff84", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 600 }}>Ativar Rendimento Ativo</button>
          <button onClick={onDownloadComplianceReport} style={{ marginTop: 12, marginLeft: 8, background: "#ffffff", color: "#001F3F", padding: "10px 12px", borderRadius: 8 }}>Baixar Relatório CSV</button>
        </div>

        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Monitor — Escrows</h2>
          <p style={{ marginTop: 8, opacity: 0.9 }}>Use "Atualizar Escrows" para capturar o offerSequence mais recente.</p>
          <p style={{ marginTop: 8, opacity: 0.9 }}>Owner público: {owner || "defina acima"}</p>
        </div>
      </section>
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#001F3F", color: "#fff", padding: 16, borderRadius: 12 }}>Processando…</div>
        </div>
      )}
    </main>
  );
}
