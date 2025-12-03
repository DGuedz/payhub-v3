"use client";
import React, { useEffect, useMemo, useState } from "react";

type Escrow = { offerSequence: number; amount: string; currency: string; txHash?: string };

export function EscrowMonitorXRPL() {
  const [items, setItems] = useState<Escrow[]>([]);
  const owner = useMemo(() => process.env.NEXT_PUBLIC_ESCROW_OWNER_ADDRESS || "", []);
  const net = useMemo(() => (process.env.NEXT_PUBLIC_XRPL_NETWORK || "devnet").toLowerCase(), []);
  const base = net === "mainnet" ? "https://livenet.xrpl.org/transactions/" : net === "testnet" ? "https://testnet.xrpl.org/transactions/" : "https://devnet.xrpl.org/transactions/";
  useEffect(() => {
    let aborted = false;
    async function run() {
      try {
        const q = owner ? `?owner=${encodeURIComponent(owner)}` : "";
        const res = await fetch(`/api/escrow/list${q}`);
        const data = await res.json();
        if (aborted) return;
        const arr = Array.isArray(data?.escrows) ? data.escrows : [];
        setItems(arr.map((x: any) => ({ offerSequence: Number(x.offerSequence), amount: String(x.amount), currency: String(x.currency), txHash: x.txHash })));
      } catch {}
    }
    run();
    return () => { aborted = true; };
  }, [owner]);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Escrows Pendentes</div>
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {items.length === 0 && <div style={{ background: "#0A2A52", borderRadius: 12, padding: 12 }}>Sem escrows</div>}
        {items.map((e) => (
          <div key={e.offerSequence} style={{ background: "#0A2A52", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{`seq=${e.offerSequence}`}</div>
            <div style={{ opacity: 0.8 }}>{`${e.amount} ${e.currency}`}</div>
            {e.txHash && <a href={`${base}${e.txHash}`} target="_blank" rel="noreferrer" style={{ color: "#4DA6FF", textDecoration: "underline" }}>txHash</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

