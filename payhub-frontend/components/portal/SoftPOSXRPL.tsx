"use client";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export function SoftPOSXRPL() {
  const [valor, setValor] = useState("1000.00");
  const [method, setMethod] = useState<"PIX" | "Cartão" | "QR Cripto">("PIX");
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<"unknown" | "ok" | "degraded" | "down">("unknown");
  const issuer = useMemo(() => process.env.NEXT_PUBLIC_RLUSD_ISSUER || "", []);
  const owner = useMemo(() => process.env.NEXT_PUBLIC_ESCROW_OWNER_ADDRESS || "", []);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : ""), []);
  const [trustTx, setTrustTx] = useState<string>("");
  const [createdSeq, setCreatedSeq] = useState<number | null>(null);
  const [createdHash, setCreatedHash] = useState<string>("");
  const [finishedHash, setFinishedHash] = useState<string>("");
  const [testLoading, setTestLoading] = useState(false);

  async function callApi(path: string, init: RequestInit = {}) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(path, { ...init, headers: { ...headers, ...(init.headers as any) } });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) throw new Error("401: Acesso negado. Insira o JWT.");
      if (res.status === 429) throw new Error("429: Sobrecarga. Tente novamente.");
      throw new Error(data?.error || res.statusText);
    }
    return data;
  }

  async function onPay() {
    try {
      setLoading(true);
      if (!token) throw new Error("Autenticação necessária");
      if (!issuer || !owner) throw new Error("Configuração ausente");
      await callApi("/api/odl/trustline-rlusd", { method: "POST", body: JSON.stringify({ limit: "1000000" }) });
      const created = await callApi("/api/escrow/create", { method: "POST", body: JSON.stringify({ value: valor }) });
      const seq = Number(created?.offerSequence);
      await callApi("/api/escrow/finish", { method: "POST", body: JSON.stringify({ owner, offerSequence: seq }) });
      toast.success("Pagamento Aprovado. Liquidez em RLUSD recebida em 3s.");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao liquidar");
    } finally {
      setLoading(false);
    }
  }

  async function onTestTrustline() {
    try {
      setTestLoading(true);
      if (!token) throw new Error("Autenticação necessária");
      if (!issuer) throw new Error("Issuer ausente");
      const res = await callApi("/api/odl/trustline-rlusd", { method: "POST", body: JSON.stringify({ limit: "1000000" }) });
      setTrustTx(String(res?.txHash || ""));
      toast.success("Trustline RLUSD configurada");
    } catch (e: any) {
      toast.error(e?.message || "Erro na trustline");
    } finally {
      setTestLoading(false);
    }
  }

  async function onTestCreate() {
    try {
      setTestLoading(true);
      if (!token) throw new Error("Autenticação necessária");
      if (!issuer) throw new Error("Issuer ausente");
      const res = await callApi("/api/escrow/create", { method: "POST", body: JSON.stringify({ value: valor }) });
      const seq = Number(res?.offerSequence);
      setCreatedSeq(!Number.isNaN(seq) ? seq : null);
      setCreatedHash(String(res?.txHash || ""));
      toast.success("Escrow RLUSD criado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar escrow");
    } finally {
      setTestLoading(false);
    }
  }

  async function onTestFinish() {
    try {
      setTestLoading(true);
      if (!token) throw new Error("Autenticação necessária");
      if (!owner) throw new Error("Owner ausente");
      const seq = createdSeq;
      if (seq == null) throw new Error("Sequence ausente");
      const res = await callApi("/api/escrow/finish", { method: "POST", body: JSON.stringify({ owner, offerSequence: seq }) });
      setFinishedHash(String(res?.txHash || ""));
      toast.success("Escrow finalizado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao finalizar escrow");
    } finally {
      setTestLoading(false);
    }
  }

  useEffect(() => {
    let aborted = false;
    async function check() {
      setBootLoading(true);
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 6000);
        const res = await fetch("/api/health", { signal: controller.signal }).catch(() => null);
        clearTimeout(t);
        if (aborted) return;
        if (res && res.ok) setServiceStatus("ok"); else setServiceStatus("down");
      } catch { setServiceStatus("down"); }
      finally { if (!aborted) setBootLoading(false); }
    }
    check();
    return () => { aborted = true; };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      {bootLoading && (
        <div style={{ maxWidth: 560, margin: "0 auto", background: "#0A2A52", borderRadius: 16, padding: 16 }}>
          <div style={{ height: 16, background: "#001F3F", borderRadius: 8 }} />
          <div style={{ height: 12, marginTop: 8, background: "#001F3F", borderRadius: 8 }} />
          <div style={{ height: 100, marginTop: 12, background: "#001F3F", borderRadius: 12 }} />
        </div>
      )}
      {!bootLoading && serviceStatus === "down" && (
        <div style={{ maxWidth: 560, margin: "0 auto", background: "#FF3355", borderRadius: 16, padding: 16, color: "#FFFFFF", fontWeight: 800 }}>Serviços Temporariamente Indisponíveis</div>
      )}
      {!bootLoading && serviceStatus !== "down" && (
        <div style={{ maxWidth: 640, margin: "0 auto", background: "#0A2A52", borderRadius: 16, padding: 24 }}>
          <div style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#00FF84" }}>Terminal Soft-POS (D+0)</div>
          <div style={{ opacity: 0.8, marginTop: 8 }}>O seu caixa, sem banco.</div>
          <div style={{ marginTop: 24 }}>
            <label style={{ opacity: 0.9 }}>Valor</label>
            <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="R$ 1000.00" style={{ marginTop: 6, width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#001F3F", color: "#FFFFFF", fontSize: 20 }} />
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={{ opacity: 0.9 }}>Método</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {["PIX", "Cartão", "QR Cripto"].map((m) => (
                <button key={m} onClick={() => setMethod(m as any)} style={{ background: method === m ? "#00FF84" : "#001F3F", color: method === m ? "#001F3F" : "#FFFFFF", padding: "10px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button disabled={loading} onClick={onPay} style={{ background: "#00FF84", color: "#001F3F", padding: "16px 24px", borderRadius: 12, fontWeight: 800, fontSize: 18, border: "none", cursor: "pointer", width: "100%" }}>{loading ? "PROCESSANDO LIQUIDEZ..." : "RECEBER PAGAMENTO E LIQUIDAR D+0"}</button>
            {loading && <div aria-label="carregando" style={{ width: 20, height: 20, borderRadius: 999, border: "2px solid #00FF84", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "12px auto 0" }} />}
          </div>
          <div style={{ marginTop: 24, background: "#001F3F", borderRadius: 12, padding: 16 }}>
            <div style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Painel de Testes</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
              <button disabled={testLoading} onClick={onTestTrustline} style={{ background: "#4DA6FF", color: "#001F3F", padding: "12px 14px", borderRadius: 10, fontWeight: 700, border: "none", cursor: "pointer" }}>Trustline RLUSD</button>
              <button disabled={testLoading} onClick={onTestCreate} style={{ background: "#FFD84D", color: "#001F3F", padding: "12px 14px", borderRadius: 10, fontWeight: 700, border: "none", cursor: "pointer" }}>Criar Escrow RLUSD</button>
              <button disabled={testLoading || createdSeq == null} onClick={onTestFinish} style={{ background: "#00FF84", color: "#001F3F", padding: "12px 14px", borderRadius: 10, fontWeight: 800, border: "none", cursor: createdSeq == null ? "not-allowed" : "pointer" }}>Finalizar Escrow</button>
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <div style={{ background: "#0A2A52", borderRadius: 8, padding: 10, color: trustTx ? "#00FF84" : "#FFFFFF" }}>{trustTx ? `trustTx=${trustTx}` : "Trustline pendente"}</div>
              <div style={{ background: "#0A2A52", borderRadius: 8, padding: 10, color: createdHash ? "#FFD84D" : "#FFFFFF" }}>{createdSeq != null ? `seq=${createdSeq} hash=${createdHash}` : "Escrow não criado"}</div>
              <div style={{ background: "#0A2A52", borderRadius: 8, padding: 10, color: finishedHash ? "#00FF84" : "#FFFFFF" }}>{finishedHash ? `finishHash=${finishedHash}` : "Escrow não finalizado"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
