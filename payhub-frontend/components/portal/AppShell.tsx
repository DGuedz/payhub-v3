"use client";
import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import { SplashScreen } from "./SplashScreen";
import { OnboardingXRPL } from "./OnboardingXRPL";
import { SoftPOSXRPL } from "./SoftPOSXRPL";
import { DashboardXRPL } from "./DashboardXRPL";
import { EscrowMonitorXRPL } from "./EscrowMonitorXRPL";



export function AppShell() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!isAuthenticated) return <OnboardingXRPL onAuthenticate={() => setIsAuthenticated(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#001F3F", color: "#FFFFFF" }}>
      <Toaster position="top-right" />
      <main style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Portal do Comerciante (Testnet)</h1>
        <DashboardXRPL />
        <SoftPOSXRPL />
        <EscrowMonitorXRPL />
      </main>
    </div>
  );
}

