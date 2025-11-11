"use client";
import { Toaster } from "react-hot-toast";
import { LiquidarParceladoForm } from "../../../components/LiquidarParceladoForm";

export default function TicketingPage() {
  return (
    <main style={{ padding: 20 }}>
      <Toaster position="top-right" />
      <LiquidarParceladoForm />
    </main>
  );
}