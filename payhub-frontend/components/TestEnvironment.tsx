"use client";
import React, { useState } from "react";
import APITestPanel from "./APITestPanel";
import { SoftPOSXRPL } from "./portal/SoftPOSXRPL";

export default function TestEnvironment() {
  const [tab, setTab] = useState<"sim" | "api">("sim");
  const COLORS = { BG: "#001F3F", CARD: "#0A2A52", GREEN: "#00FF84", BLUE: "#4DA6FF", DARK: "#001F3F", LIGHT: "#FFFFFF" };
  return (
    <main style={{ minHeight: "100vh", backgroundColor: COLORS.BG, color: COLORS.LIGHT, padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Ambiente de Teste</h1>
        <nav style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("sim")} style={{ background: tab === "sim" ? COLORS.BLUE : COLORS.CARD, color: tab === "sim" ? COLORS.DARK : COLORS.LIGHT, padding: "10px 14px", borderRadius: 10, fontWeight: 800, border: "none", cursor: "pointer" }}>📱 Simulador Soft-POS</button>
          <button onClick={() => setTab("api")} style={{ background: tab === "api" ? COLORS.GREEN : COLORS.CARD, color: tab === "api" ? COLORS.DARK : COLORS.LIGHT, padding: "10px 14px", borderRadius: 10, fontWeight: 800, border: "none", cursor: "pointer" }}>💻 Testes de API</button>
        </nav>
      </header>
      <section style={{ marginTop: 24 }}>
        {tab === "sim" && (
          <div>
            <SoftPOSXRPL />
          </div>
        )}
        {tab === "api" && (
          <div style={{ display: "grid", gap: 16 }}>
            <APITestPanel />
          </div>
        )}
      </section>
    </main>
  );
}
