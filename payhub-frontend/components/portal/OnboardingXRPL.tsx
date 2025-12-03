"use client";
import React, { useMemo, useState } from "react";

export function OnboardingXRPL({ onAuthenticate }: { onAuthenticate: () => void }) {
  const dev = useMemo(() => process.env.NEXT_PUBLIC_DEV_JWT || "", []);
  const [jwt, setJwt] = useState(dev);
  const ready = (jwt || "").trim().length > 0;
  function submit() {
    if (!ready) return;
    try { if (typeof window !== "undefined") localStorage.setItem("jwt_token", jwt.trim()); } catch {}
    onAuthenticate();
  }
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#001F3F", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24, width: "100%", maxWidth: 560 }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>Autenticação</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>Informe seu JWT para ativar segurança nível bancário</div>
        {!dev && <div style={{ marginTop: 8, padding: 12, background: '#330000', color: '#FF8484', borderRadius: 8, fontSize: 14 }}><b>Atenção:</b> A variável de ambiente <code>NEXT_PUBLIC_DEV_JWT</code> não está definida. Crie um arquivo <code>.env.local</code> e adicione a variável para facilitar os testes.</div>}
        <input value={jwt} onChange={(e) => setJwt(e.target.value)} placeholder="Bearer JWT" style={{ marginTop: 12, width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#001F3F", color: "#FFFFFF" }} />
        <button disabled={!ready} onClick={submit} style={{ marginTop: 16, width: "100%", background: ready ? "#00FF84" : "#0A2A52", color: "#001F3F", padding: "12px 16px", borderRadius: 12, fontWeight: 800, border: "none", cursor: ready ? "pointer" : "not-allowed" }}>Ativar</button>
      </div>
    </div>
  );
}

