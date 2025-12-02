export default function PreviewPage() {
  const fileKey = process.env.NEXT_PUBLIC_FIGMA_FILE_KEY || '';
  const hasEmbed = !!fileKey;
  const embedUrl = `https://www.figma.com/embed?embed_host=vercel&url=https://www.figma.com/design/${fileKey}`;
  const fallbackUrl = '/public/figma-interface-complete.html';
  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Figma Preview</h1>
      {hasEmbed ? (
        <iframe title="Figma" style={{ width: '100%', height: 600, border: 0 }} src={embedUrl} />
      ) : (
        <div>
          <p style={{ marginBottom: 8 }}>Embed não configurado. Abrir fallback:</p>
          <a href={fallbackUrl} style={{ color: '#3b82f6' }}>{fallbackUrl}</a>
        </div>
      )}
    </main>
  );
}

