export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#001F3F', color: '#FFFFFF' }}>
      <section style={{ padding: '48px 24px', display: 'grid', justifyItems: 'center' }}>
        <div style={{ maxWidth: 960, width: '100%' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>LIQUIDEZ SOB DEMANDA (ODL) PARA O COMÉRCIO GLOBAL.</h1>
          <p style={{ marginTop: 12, fontSize: 18, lineHeight: 1.5, opacity: 0.9 }}>O PAYHUB elimina o atraso D+60. Liquidação D+0 em RLUSD (Stablecoin), garantindo estabilidade e rentabilidade.</p>
          <p style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
            "O futuro da liquidez é instantâneo, previsível e sem atrito." (CEO Ripple)
          </p>
          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a href="/app/dashboard" style={{ backgroundColor: '#00FF84', color: '#001F3F', padding: '12px 16px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>ATIVAR TESOURARIA ODL D+0</a>
            <a href="/app/portal" style={{ backgroundColor: '#FFFFFF', color: '#001F3F', padding: '12px 16px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Área do Comerciante</a>
            <a href="#" style={{ backgroundColor: '#4DA6FF', color: '#001F3F', padding: '12px 16px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Export to Sheets</a>
          </div>
          <p style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>Não perca 20% da sua margem. Comece a gerar 5–8% APY hoje.</p>
        </div>
      </section>

      <section style={{ padding: '24px', display: 'grid', justifyItems: 'center' }}>
        <div style={{ maxWidth: 1080, width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: '#0A2A52', borderRadius: 12, padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>ODL/Settlement</h2>
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                <li>XRPL, Liquidação 3–5s</li>
                <li>D+0 Settlement</li>
                <li>Escrow com RLUSD</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#0A2A52', borderRadius: 12, padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tesouraria/Yield</h2>
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                <li>RLUSD, Yield Engine (5–8% APY)</li>
                <li>AMM Integration</li>
                <li>Alocação automática HUB AI</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#0A2A52', borderRadius: 12, padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Segurança/Compliance</h2>
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                <li>Defesa Ativa/Honeypot</li>
                <li>KMS Isolado</li>
                <li>Licença Trust Company</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '12px 24px', display: 'grid', justifyItems: 'center' }}>
        <div style={{ maxWidth: 960, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/app/dashboard" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>Acesso ao Cockpit de Validação E2E</a>
          <a href="/app/security" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>Monitor de Segurança</a>
        </div>
      </section>
    </main>
  );
}
