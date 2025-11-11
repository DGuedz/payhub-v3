import './globals.css';
export const metadata = {
  title: 'PAYHUB Portal do Comerciante',
  description: 'Dashboard V2 — Ticketing e Orquestração',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="payhub-body">{children}</body>
    </html>
  );
}