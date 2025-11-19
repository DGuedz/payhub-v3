"use client";
import React, { useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";

export function DashboardXRPL() {
  const [balanceRLUSD, setBalanceRLUSD] = useState<string>("—");
  const [apy, setApy] = useState<string>("5–8% APY");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : ""), []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function run() {
      setIsLoading(true);
      setHasError(false);
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/merchant/info?id=merchant_demo`, { headers, signal });
        
        if (!res.ok) {
          throw new Error(`API retornou status ${res.status}`);
        }
        
        const data = await res.json();
        setBalanceRLUSD(String(data?.balanceRLUSD || "—"));
        setApy(String(data?.yieldRate || "5–8% APY"));
        setIsLoading(false);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          logger.info('Fetch abortado: o componente foi desmontado.');
        } else {
          logger.error('Erro no fetch do dashboard:', { error });
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      controller.abort();
    };
  }, [token]);

  if (hasError) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24, borderLeft: "5px solid #ff6b6b" }}>
            <div style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#ff6b6b" }}>⚠️ Serviço Indisponível</div>
            <div style={{ marginTop: 10, fontSize: 16, opacity: 0.8 }}>Não foi possível carregar os dados do dashboard.</div>
            <div style={{ marginTop: 6, fontSize: 14, opacity: 0.6 }}>Tente novamente em alguns instantes.</div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24 }}>
            <div style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Carregando...</div>
            <div style={{ marginTop: 10, fontSize: 32, fontWeight: 800, opacity: 0.5 }}>—</div>
            <div style={{ marginTop: 6, opacity: 0.8 }}>Liquidez D+0</div>
          </div>
          <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24, borderLeft: "5px solid #00FF84" }}>
            <div style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Ganhos Ativos</div>
            <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800, color: "#00FF84", opacity: 0.5 }}>—</div>
            <div style={{ marginTop: 6, opacity: 0.8 }}>Rendimento automático</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24 }}>
          <div style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Saldo RLUSD</div>
          <div style={{ marginTop: 10, fontSize: 32, fontWeight: 800 }}>$ {balanceRLUSD}</div>
          <div style={{ marginTop: 6, opacity: 0.8 }}>Liquidez D+0</div>
        </div>
        <div style={{ background: "#0A2A52", borderRadius: 16, padding: 24, borderLeft: "5px solid #00FF84" }}>
          <div style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Ganhos Ativos</div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800, color: "#00FF84" }}>{apy}</div>
          <div style={{ marginTop: 6, opacity: 0.8 }}>Rendimento automático</div>
        </div>
      </div>
    </div>
  );
}

