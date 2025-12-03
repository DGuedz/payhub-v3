"use client";
import React, { useMemo, useState } from "react";

type ApiStatus = "idle" | "loading" | "success" | "error";

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString();
}

export default function APITestPanel() {
  const [baseUrl, setBaseUrl] = useState<string>(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000");
  const [token, setToken] = useState<string>(typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "");
  const devJwt = useMemo(() => process.env.NEXT_PUBLIC_DEV_JWT || "", []);

  const [jwtStatus, setJwtStatus] = useState<ApiStatus>("idle");
  const [jwtOutput, setJwtOutput] = useState<string>("");

  const [escrowStatus, setEscrowStatus] = useState<ApiStatus>("idle");
  const [escrowOutput, setEscrowOutput] = useState<string>("");

  const [yieldStatus, setYieldStatus] = useState<ApiStatus>("idle");
  const [yieldOutput, setYieldOutput] = useState<string>("");

  const [complianceStatus, setComplianceStatus] = useState<ApiStatus>("idle");
  const [complianceOutput, setComplianceOutput] = useState<string>("");

  function headers() {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if ((token || "").trim()) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  async function testJwt() {
    setJwtStatus("loading");
    setJwtOutput("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/compliance/report`, { method: "GET", headers: headers() });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setJwtStatus("success");
      setJwtOutput(JSON.stringify({ ok: true, at: nowLabel(), sample: data?.format || "json" }, null, 2));
    } catch (e: any) {
      setJwtStatus("error");
      setJwtOutput(e?.message || "Falha no JWT");
    }
  }

  async function testEscrow() {
    setEscrowStatus("loading");
    setEscrowOutput("");
    try {
      const createRes = await fetch(`${baseUrl}/api/escrow-create`, { method: "POST", headers: headers(), body: JSON.stringify({ value: "100.00" }) });
      const created = await createRes.json().catch(() => null);
      if (!createRes.ok) throw new Error(created?.error || "ESCROW_CREATE_FAILED");
      const owner = String(created?.owner || "");
      const offerSequence = Number(created?.offerSequence || 0);
      await new Promise((r) => setTimeout(r, 600));
      const finishRes = await fetch(`${baseUrl}/api/escrow-finish`, { method: "POST", headers: headers(), body: JSON.stringify({ owner, offerSequence }) });
      const finished = await finishRes.json().catch(() => null);
      if (!finishRes.ok) throw new Error(finished?.error || "ESCROW_FINISH_FAILED");
      setEscrowStatus("success");
      setEscrowOutput(JSON.stringify({ at: nowLabel(), offerSequence, txHash: finished?.txHash || "" }, null, 2));
    } catch (e: any) {
      setEscrowStatus("error");
      setEscrowOutput(e?.message || "Falha no Escrow");
    }
  }

  async function testYield() {
    setYieldStatus("loading");
    setYieldOutput("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/merchant/yield/activate`, { method: "POST", headers: headers(), body: JSON.stringify({ merchantId: "merchant-dev" }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setYieldStatus("success");
      setYieldOutput(JSON.stringify({ at: nowLabel(), status: data?.status || "OK", id: data?.activationId || "" }, null, 2));
    } catch (e: any) {
      setYieldStatus("error");
      setYieldOutput(e?.message || "Falha ao ativar yield");
    }
  }

  async function testCompliance() {
    setComplianceStatus("loading");
    setComplianceOutput("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/compliance/report`, { method: "GET", headers: headers() });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || res.statusText);
      const lines = String(data?.content || "").split("\n");
      setComplianceStatus("success");
      setComplianceOutput(JSON.stringify({ at: nowLabel(), lines: lines.slice(0, 2) }, null, 2));
    } catch (e: any) {
      setComplianceStatus("error");
      setComplianceOutput(e?.message || "Falha no relatório");
    }
  }

  async function runAll() {
    await testJwt();
    await new Promise((r) => setTimeout(r, 400));
    await testEscrow();
    await new Promise((r) => setTimeout(r, 400));
    await testYield();
    await new Promise((r) => setTimeout(r, 400));
    await testCompliance();
  }

  function resetAll() {
    setJwtStatus("idle"); setJwtOutput("");
    setEscrowStatus("idle"); setEscrowOutput("");
    setYieldStatus("idle"); setYieldOutput("");
    setComplianceStatus("idle"); setComplianceOutput("");
  }

  function chip(status: ApiStatus) {
    const color = status === "success" ? "#00FF84" : status === "error" ? "#FF3355" : status === "loading" ? "#FFD84D" : "#4DA6FF";
    const label = status === "success" ? "Sucesso" : status === "error" ? "Erro" : status === "loading" ? "Carregando" : "Pronto";
    return <span style={{ background: color, color: "#001F3F", padding: "4px 8px", borderRadius: 999, fontWeight: 800 }}>{label}</span>;
  }

  return (
    <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24 }}>
      <div style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#00FF84" }}>Testes de API E2E</div>
      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8, background: "#001F3F", borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 800 }}>Configuração do Backend</div>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://localhost:3000" style={{ padding: 10, borderRadius: 8, border: "none", background: "#0A2A52", color: "#FFFFFF" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" value={token} onChange={(e) => { setToken(e.target.value); if (typeof window !== "undefined") { try { localStorage.setItem("jwt_token", e.target.value); } catch {} } }} placeholder="Token JWT" style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#0A2A52", color: "#FFFFFF" }} />
            <button onClick={() => { const t = (devJwt || "").trim(); setToken(t); if (typeof window !== "undefined") { try { localStorage.setItem("jwt_token", t); } catch {} } }} style={{ background: "#00FF84", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 800, border: "none", cursor: "pointer" }}>Usar Token Dev</button>
          </div>
        </div>

        <div style={{ background: "#001F3F", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>1. Autenticação JWT</div>
            {chip(jwtStatus)}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={testJwt} style={{ background: "#4DA6FF", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 800, border: "none", cursor: "pointer" }}>Testar JWT</button>
          </div>
          {jwtOutput && <pre style={{ marginTop: 8, background: "#0A2A52", color: "#FFFFFF", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>{jwtOutput}</pre>}
        </div>

        <div style={{ background: "#001F3F", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>2. Liquidação D+0 (Escrow)</div>
            {chip(escrowStatus)}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={testEscrow} style={{ background: "#FFD84D", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 800, border: "none", cursor: "pointer" }}>Testar Escrow</button>
          </div>
          {escrowOutput && <pre style={{ marginTop: 8, background: "#0A2A52", color: "#FFFFFF", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>{escrowOutput}</pre>}
        </div>

        <div style={{ background: "#001F3F", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>3. Yield Automático</div>
            {chip(yieldStatus)}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={testYield} style={{ background: "#00FF84", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 800, border: "none", cursor: "pointer" }}>Testar Yield</button>
          </div>
          {yieldOutput && <pre style={{ marginTop: 8, background: "#0A2A52", color: "#FFFFFF", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>{yieldOutput}</pre>}
        </div>

        <div style={{ background: "#001F3F", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>4. Relatório de Compliance</div>
            {chip(complianceStatus)}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={testCompliance} style={{ background: "#4DA6FF", color: "#001F3F", padding: "10px 12px", borderRadius: 8, fontWeight: 800, border: "none", cursor: "pointer" }}>Testar Relatório</button>
          </div>
          {complianceOutput && <pre style={{ marginTop: 8, background: "#0A2A52", color: "#FFFFFF", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>{complianceOutput}</pre>}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={runAll} style={{ background: "#00E676", color: "#001F3F", padding: "12px 16px", borderRadius: 10, fontWeight: 800, border: "none", cursor: "pointer" }}>Executar Todos</button>
          <button onClick={resetAll} style={{ background: "#FF3355", color: "#FFFFFF", padding: "12px 16px", borderRadius: 10, fontWeight: 800, border: "none", cursor: "pointer" }}>Resetar</button>
        </div>

        {jwtStatus === "success" && escrowStatus === "success" && yieldStatus === "success" && complianceStatus === "success" && (
          <div style={{ marginTop: 12, background: "#00FF84", color: "#001F3F", padding: 16, borderRadius: 12, fontWeight: 800 }}>Todos os Testes Passaram! Pronto para deploy.</div>
        )}
      </div>
    </div>
  );
}
