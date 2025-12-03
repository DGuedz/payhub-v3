"use client";
import React from "react";

export function Navigation({ currentView, onViewChange }: { currentView: "pos" | "dashboard" | "escrow" | "investor"; onViewChange: (v: "pos" | "dashboard" | "escrow" | "investor") => void }) {
  const tabs: Array<{ key: "pos" | "dashboard" | "escrow" | "investor"; label: string }> = [
    { key: "pos", label: "POS" },
    { key: "dashboard", label: "Dashboard" },
    { key: "escrow", label: "Escrow" },
    { key: "investor", label: "Investor" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A2A52", display: "flex", justifyContent: "space-around", padding: 12 }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onViewChange(t.key)} style={{ background: currentView === t.key ? "#00FF84" : "#001F3F", color: currentView === t.key ? "#001F3F" : "#FFFFFF", padding: "8px 12px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>{t.label}</button>
      ))}
    </div>
  );
}

