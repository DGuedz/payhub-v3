#!/usr/bin/env node
/*
 * Sincroniza metadados de estilos do Figma para tokens locais.
 * Usa Node 18+ (global fetch) e requer FIGMA_TOKEN/FIGMA_FILE_KEY.
 * Saída: design-system/tokens.json (metadados dos estilos)
 */

const fs = require('fs');
const path = require('path');

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN) {
  console.error('Erro: FIGMA_TOKEN não definido');
  process.exit(1);
}
if (!FIGMA_FILE_KEY) {
  console.error('Erro: FIGMA_FILE_KEY não definido');
  process.exit(1);
}

async function fetchFile(key) {
  const resp = await fetch(`https://api.figma.com/v1/files/${key}`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Figma GET /files falhou: ${resp.status} ${resp.statusText} - ${text}`);
  }
  return resp.json();
}

function normalizeName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

(async () => {
  console.log('[tokens-sync] Baixando arquivo do Figma...');
  const file = await fetchFile(FIGMA_FILE_KEY);

  const styles = file.styles || {}; // objeto {key: {name,type,description}} em arquivos modernos
  const tokens = { $schema: 'https://json.schemastore.org/design-tokens', source: 'figma', generatedAt: new Date().toISOString(), items: [] };

  for (const [styleId, meta] of Object.entries(styles)) {
    const tokenName = normalizeName(meta.name);
    tokens.items.push({
      id: styleId,
      name: meta.name,
      name_kebab: tokenName,
      type: meta.type,
      description: meta.description || null
      // Observação: valores (cores, tipografia) exigem parse do documento/nodes.
      // Este passo inicial captura metadados para rastreabilidade.
    });
  }

  const outDir = path.join(process.cwd(), 'design-system');
  await fs.promises.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'tokens.json');
  await fs.promises.writeFile(outFile, JSON.stringify(tokens, null, 2), 'utf8');
  console.log(`[tokens-sync] Gravado ${outFile} com ${tokens.items.length} tokens.`);
})();
