"use client";
import React, { useMemo, useState } from "react";
import { createSDK } from "../../../../sdk/payhub";
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
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.trustline.create("1000");
      setTrustlineHash(String(data?.txHash || ""));
      toast.success(`Trustline criada: ${String(data?.txHash || "")}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha na trustline");
    }
  }

  async function onEscrowCreate() {
    try {
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.escrow.create(rlusdValue);
      setCreateHash(String(data?.txHash || ""));
      const seq = Number(data?.offerSequence);
      if (!Number.isNaN(seq)) setOfferSequence(seq);
      toast.success(`Escrow criado: seq=${seq} hash=${String(data?.txHash || "")}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao criar escrow");
    }
  }

  async function onEscrowFinish() {
    try {
      const seq = offerSequence;
      if (!owner || seq == null) throw new Error("Defina owner e offerSequence");
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.escrow.finish(owner, seq);
      setFinishHash(String(data?.txHash || ""));
      toast.success("Liquidação concluída em 3-5s");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao finalizar escrow");
    }
  }

  async function onAmmQuote() {
    try {
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const hex = sdk.currencyHex("RLUSD");
      const data = await sdk.amm.quote({ sourceAccount, destinationAccount, deliverCurrency: hex, deliverIssuer: rlusdIssuer, deliverValue: "1" });
      setAmmPaths(Number(data?.pathsCount || 0));
      toast.success(`Rotas encontradas: ${Number(data?.pathsCount || 0)}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha na cotação AMM");
    }
  }

  async function onAmmSwap() {
    try {
      const data = await callApi("/api/amm/swap", { method: "POST", body: JSON.stringify({}) });
      setAmmSwapHash(String(data?.txHash || ""));
      toast.success("Swap iniciado — Yield ativo");
    } catch (e: any) {
      toast.error(e?.message || "Falha no swap AMM");
    }
  }

  async function onActivateYield() {
    try {
      const sdk = createSDK({ baseUrl: apiBase(), token });
      const data = await sdk.yield.activate();
      toast.success(String(data?.status || "Motor de rendimento ativado"));
    } catch (e: any) {
      toast.error(e?.message || "Falha ao ativar o rendimento");
    }
  }

  async function onDownloadComplianceReport() {
    try {
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
      toast.error(e?.message || "Falha ao baixar o relatório");
    }
  }

    async function onActivateYield() {
    try {
      const data = await callApi("/api/v1/merchant/yield/activate", { method: "POST" });
      toast.success(data.message || "Motor de rendimento ativado!");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao ativar o rendimento");
    }
  }

  async function onDownloadComplianceReport() {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/v1/compliance/report", { headers });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || res.statusText);
      }

      const blob = await res.blob();
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
      toast.error(e?.message || "Falha ao baixar o relatório");
    }
  }

  async function refreshEscrows() {
    try {
      const res = await fetch(`/api/escrow/list${owner ? `?owner=${encodeURIComponent(owner)}` : ""}`);
      const data = await res.json();
      const first = Array.isArray(data?.escrows) ? data.escrows[0] : null;
      const seq = first?.offerSequence;
      if (seq) setOfferSequence(Number(seq));
      toast.success("Lista de escrows atualizada");
    } catch {}
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#001F3F", color: "#ffffff", padding: 24 }}>
      <Toaster position="top-right" />
      <h1 style={{ margin: 0 }}>Cockpit de Testes</h1>
      <p style={{ marginTop: 8, opacity: 0.9 }}>Valide o fluxo E2E: Trustline, Escrow e AMM</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 16 }}>
        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Configuração & Segurança</h2>
          <input placeholder="JWT_TOKEN" value={manual} onChange={(e) => setManual(e.target.value)} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8 }} />
          <button onClick={onTrustline} style={{ marginTop: 12, background: "#00ff84", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 600 }}>Criar Trustline RLUSD</button>
          <div style={{ marginTop: 8, color: trustlineHash ? "#00ff84" : "#ff3355" }}>{trustlineHash ? `txHash=${trustlineHash}` : "Sem txHash"}</div>
        </div>

        <div style={{ background: "#0a2a52", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0 }}>Liquidez ODL — Escrow</h2>
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
    </main>
  );
}
