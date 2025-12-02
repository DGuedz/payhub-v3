"use client";
import React, { useState } from "react";

export default function SecurityPage() {
  const [alert, setAlert] = useState(false);
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#001F3F", color: "#ffffff", padding: 24 }}>
      <h1 style={{ margin: 0 }}>Monitor de Segurança</h1>
      <p style={{ marginTop: 8, opacity: 0.9 }}>Defesa Ativa / Honeypot — simulação de alerta e invalidação de sessões</p>
      <button onClick={() => setAlert(true)} style={{ marginTop: 12, background: "#ff3355", color: "#ffffff", padding: "10px 12px", borderRadius: 8, fontWeight: 700 }}>Simular Alerta de Intrusão</button>
      {alert && (
        <div style={{ marginTop: 16, background: "#ff3355", color: "#ffffff", padding: 16, borderRadius: 12, fontWeight: 700 }}>
          INTRUSÃO DETECTADA / Sessões Invalidadas
        </div>
      )}
      <div style={{ marginTop: 20, background: "#0a2a52", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div>Status KMS: Operacional</div>
          <div>Proteção de Chaves: Ativa</div>
          <div>Auditoria de Transações: Registrando hashes e sequences</div>
        </div>
      </div>
    </main>
  );
}
