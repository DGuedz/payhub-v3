"use client";
import React from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#001F3F", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 720 }}>
        <div style={{ fontSize: 40, fontWeight: 800 }}>PAYHUB Portal</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>Liquidez Sob Demanda, D+0 em RLUSD</div>
        <button onClick={onComplete} style={{ marginTop: 24, background: "#00FF84", color: "#001F3F", padding: "14px 18px", borderRadius: 12, fontWeight: 800, border: "none", cursor: "pointer" }}>Entrar no Portal</button>
      </div>
    </div>
  );
}

