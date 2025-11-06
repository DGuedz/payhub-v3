import './globals.css';
export const metadata = {
  title: 'PAYHUB Portal do Comerciante',
  description: 'Dashboard V2 — Ticketing e Orquestração',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{ background: '#0b0f14', color: '#e5e7eb', minHeight: '100vh', margin: 0 }}>{children}</body>
    </html>
  );
}