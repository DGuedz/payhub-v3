export default function MainPage() {
  const figmaUrl = '/public/figma-preview.html';
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#001F3F', color: '#FFFFFF' }}>
      <section style={{ padding: '32px 20px', display: 'grid', justifyItems: 'center' }}>
        <div style={{ maxWidth: 1080, width: '100%' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>Payhub v3 — Página Principal</h1>
          <p style={{ marginTop: 10, fontSize: 16, opacity: 0.9 }}>Build ativo. Acesse o portal do comerciante e as visualizações.</p>
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <a href="/app/portal" style={{ backgroundColor: '#00FF84', color: '#001F3F', padding: '10px 14px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Abrir Portal do Comerciante</a>
            <a href="/app/merchant" style={{ backgroundColor: '#FFFFFF', color: '#001F3F', padding: '10px 14px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Abrir DApp Clássico</a>
            <a href="/preview" style={{ backgroundColor: '#4DA6FF', color: '#001F3F', padding: '10px 14px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Figma Preview</a>
            <a href="/app/test" style={{ backgroundColor: '#00E676', color: '#001F3F', padding: '10px 14px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Ambiente de Teste</a>
            <a href="https://github.com/DGuedz/payhub-v3/blob/docs/vega-xrpl-progress-week1/docs/ROADMAP_PAYHUB_Q4_2025_Q2_2026.md" target="_blank" rel="noreferrer" style={{ backgroundColor: '#FFD84D', color: '#001F3F', padding: '10px 14px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Roadmap</a>
          </div>
        </div>
      </section>
      <section style={{ padding: '0 20px 24px', display: 'grid', justifyItems: 'center' }}>
        <div style={{ maxWidth: 1080, width: '100%' }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #0A2A52' }}>
            <iframe title="PAYHUB Portal" src="/app/portal" style={{ width: '100%', height: 640, border: 0, background: '#001F3F' }} />
          </div>
          <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid #0A2A52' }}>
            <iframe title="Figma" src={figmaUrl} style={{ width: '100%', height: 560, border: 0, background: '#001F3F' }} />
          </div>
        </div>
      </section>
    </main>
  );
}
