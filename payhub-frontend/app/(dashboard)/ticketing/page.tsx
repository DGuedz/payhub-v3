"use client";
import { Toaster, toast } from "react-hot-toast";
import { LiquidarParceladoForm } from "../../../../src/components/merchant/LiquidarParceladoForm";

export default function TicketingPage() {
  return (
    <main style={{ padding: 20 }}>
      <Toaster position="top-right" />
      <LiquidarParceladoForm
        onSuccess={(data) => toast.success(`Sucesso: operationId=${data.operationId} txHash=${data.txHash}`)}
        onError={(msg) => toast.error(`Falha: ${msg}`)}
      />
    </main>
  );
}