"use client";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

export function InvestorDashboard() {
  const [paths, setPaths] = useState<number | null>(null);
  const [hash, setHash] = useState<string>("");
  async function callApi(path: string, init: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(path, { ...init, headers: { ...headers, ...(init.headers as any) } });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || res.statusText);
    return data;
  }
  async function quote() {
    try { const data = await callApi("/api/amm/quote", { method: "POST", body: JSON.stringify({}) }); setPaths(Number(data?.pathsCount || 0)); toast.success("Cotação obtida"); } catch (e: any) { toast.error(e?.message || "Falha"); }
  }
  async function swap() {
    try { const data = await callApi("/api/amm/swap", { method: "POST", body: JSON.stringify({}) }); setHash(String(data?.txHash || "")); toast.success("Swap iniciado"); } catch (e: any) { toast.error(e?.message || "Falha"); }
  }
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 800 }}>Cotação AMM</div>
          <button onClick={quote} style={{ marginTop: 12, background: "#FFFFFF", color: "#001F3F", padding: "10px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>Cotação</button>
          <div style={{ marginTop: 8 }}>{paths != null ? `pathsCount=${paths}` : "—"}</div>
        </div>
        <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 800 }}>Swap AMM</div>
          <button onClick={swap} style={{ marginTop: 12, background: "#00FF84", color: "#001F3F", padding: "10px 14px", borderRadius: 8, fontWeight: 800, border: "none", cursor: "pointer" }}>Swap</button>
          <div style={{ marginTop: 8, color: hash ? "#00FF84" : "#FFFFFF" }}>{hash ? `txHash=${hash}` : "—"}</div>
        </div>
      </div>
    </div>
  );
}

