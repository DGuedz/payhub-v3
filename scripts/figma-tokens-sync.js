#!/usr/bin/env node
/**
 * PAYHUB_V3 — Figma Design Tokens Sync (Fase 2)
 *
 * Lê estilos do Figma (cores, tipografia, efeitos) e gera:
 * - design-system/export/tokens.json
 * - design-system/export/tokens.css
 *
 * Uso:
 *   node scripts/figma-tokens-sync.js \
 *     --file-key UQwbW2cybw7SGzlBWHlgcr \
 *     --out-json design-system/export/tokens.json \
 *     --out-css design-system/export/tokens.css \
 *     [--node-id 0:1] [--dry-run]
 *
 * Requisitos:
 * - Token do Figma em figma-prototype/figma.config.json { "token": "..." }
 *   ou variável de ambiente FIGMA_TOKEN
 * - Node.js >= 18 (usa fetch nativo)
 */

import fs from 'fs';
import path from 'path';

function readToken() {
  const cfgPath = path.resolve('figma-prototype/figma.config.json');
  try {
    const raw = fs.readFileSync(cfgPath, 'utf-8');
    const json = JSON.parse(raw);
    if (json && typeof json.token === 'string' && json.token.length > 0) {
      return json.token;
    }
  } catch (e) {
    // ignore; fallback to env
  }
  return process.env.FIGMA_TOKEN || '';
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const p = argv[i];
    if (p.startsWith('--')) {
      const [k, v] = p.split('=');
      const key = k.replace(/^--/, '');
      if (typeof v !== 'undefined') args[key] = v;
      else args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return {
    fileKey: args['file-key'] || args.fileKey,
    nodeId: args['node-id'] || args.nodeId,
    outJson: args['out-json'] || args.outJson || 'design-system/export/tokens.json',
    outCss: args['out-css'] || args.outCss || 'design-system/export/tokens.css',
    dryRun: !!args['dry-run'] || !!args.dryRun,
  };
}

async function figmaGET(pathname, token, params = {}) {
  const url = new URL(`https://api.figma.com${pathname}`);
  Object.entries(params).forEach(([k, v]) => {
    if (typeof v !== 'undefined' && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.err || json?.message || text || `HTTP ${res.status}`;
    const error = new Error(`Figma API error: ${msg}`);
    error.status = res.status;
    error.payload = json;
    throw error;
  }
  return json;
}

function toCssVarName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

function floatTo255(f) { return Math.round((f || 0) * 255); }
function rgbaToHex({ r, g, b, a = 1 }) {
  const rr = floatTo255(r).toString(16).padStart(2, '0');
  const gg = floatTo255(g).toString(16).padStart(2, '0');
  const bb = floatTo255(b).toString(16).padStart(2, '0');
  if (a < 1) {
    const aa = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${rr}${gg}${bb}${aa}`;
  }
  return `#${rr}${gg}${bb}`;
}

function extractPaint(paints = []) {
  // Prefer SOLID paint
  const solid = paints.find(p => p.type === 'SOLID' && p.visible !== false);
  if (!solid || !solid.color) return null;
  // Figma stores alpha in blend? use solid.opacity if present, else 1
  const a = typeof solid.opacity === 'number' ? solid.opacity : 1;
  return rgbaToHex({ r: solid.color.r, g: solid.color.g, b: solid.color.b, a });
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  const { fileKey, nodeId, outJson, outCss, dryRun } = parseArgs(process.argv);
  if (!fileKey) {
    console.error('Erro: informe --file-key <alfa-numérico do Figma Design File>.');
    process.exit(1);
  }
  const token = readToken();
  if (!token) {
    console.error('Erro: FIGMA token não encontrado. Configure figma-prototype/figma.config.json ou FIGMA_TOKEN.');
    process.exit(1);
  }

  console.log(`→ Validando arquivo Figma: ${fileKey}`);
  let file;
  try {
    file = await figmaGET(`/v1/files/${fileKey}`, token);
  } catch (e) {
    console.error(`Falha ao acessar o arquivo: ${e.message}`);
    if (e.status === 400) {
      console.error('Possível causa: o fileKey pode ser de FigJam/Slides. Duplique para um “Figma Design File”.');
    }
    process.exit(2);
  }

  console.log('→ Buscando estilos do arquivo...');
  let stylesList;
  try {
    const stylesRes = await figmaGET(`/v1/files/${fileKey}/styles`, token);
    stylesList = stylesRes?.styles || stylesRes?.meta?.styles || [];
  } catch (e) {
    console.error(`Falha ao listar estilos: ${e.message}`);
    process.exit(3);
  }

  const tokens = { color: {}, typography: {}, effect: {} };
  let processed = 0;
  for (const s of stylesList) {
    const type = s?.style_type || s?.type;
    const key = s?.key;
    const name = s?.name || s?.style_name || s?.description || key;
    if (!key || !type) continue;
    let meta;
    try {
      const styleRes = await figmaGET(`/v1/styles/${key}`, token);
      meta = styleRes?.meta || {};
    } catch (e) {
      // continue if individual style fetch fails
      continue;
    }
    const nodeIdForStyle = meta?.node_id || s?.node_id;
    if (!nodeIdForStyle) continue;
    let nodesRes;
    try {
      nodesRes = await figmaGET(`/v1/files/${fileKey}/nodes`, token, { ids: nodeIdForStyle });
    } catch (e) { continue; }
    const node = nodesRes?.nodes?.[nodeIdForStyle]?.document;
    if (!node) continue;

    const varName = toCssVarName(name);
    if (type === 'FILL' || type === 'PAINT') {
      const hex = extractPaint(node.fills);
      if (hex) tokens.color[varName] = hex;
    } else if (type === 'TEXT') {
      const style = node.style || {};
      const t = {};
      if (style.fontFamily) t['font-family'] = style.fontFamily;
      if (style.fontSize) t['font-size'] = `${style.fontSize}px`;
      if (style.lineHeightPx) t['line-height'] = `${style.lineHeightPx}px`;
      if (style.letterSpacing) t['letter-spacing'] = `${style.letterSpacing}%`;
      tokens.typography[varName] = t;
    } else if (type === 'EFFECT') {
      const effects = node.effects || [];
      const shadow = effects.find(e => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW');
      if (shadow) {
        tokens.effect[varName] = {
          type: shadow.type,
          x: `${shadow.offset?.x || 0}px`,
          y: `${shadow.offset?.y || 0}px`,
          blur: `${shadow.radius || 0}px`,
          color: rgbaToHex({ r: shadow.color?.r || 0, g: shadow.color?.g || 0, b: shadow.color?.b || 0, a: shadow.color?.a ?? 1 }),
        };
      }
    }
    processed++;
  }

  console.log(`→ Estilos processados: ${processed}`);
  if (dryRun) {
    console.log('→ Dry-run concluído. Tokens detectados (parcial):');
    console.log(JSON.stringify(tokens, null, 2));
    process.exit(0);
  }

  ensureDir(outJson);
  ensureDir(outCss);
  fs.writeFileSync(outJson, JSON.stringify(tokens, null, 2));

  // Gerar CSS variables
  const lines = [':root {'];
  for (const [name, hex] of Object.entries(tokens.color)) {
    lines.push(`  --color-${name}: ${hex};`);
  }
  for (const [name, t] of Object.entries(tokens.typography)) {
    Object.entries(t).forEach(([k, v]) => {
      lines.push(`  --typography-${name}-${k}: ${v};`);
    });
  }
  for (const [name, e] of Object.entries(tokens.effect)) {
    lines.push(`  --effect-${name}-x: ${e.x};`);
    lines.push(`  --effect-${name}-y: ${e.y};`);
    lines.push(`  --effect-${name}-blur: ${e.blur};`);
    lines.push(`  --effect-${name}-color: ${e.color};`);
  }
  lines.push('}');
  fs.writeFileSync(outCss, lines.join('\n'));

  console.log(`→ Tokens salvos em:\n- ${outJson}\n- ${outCss}`);
}

main().catch(err => {
  console.error('Erro inesperado no sync de tokens:', err?.message || err);
  process.exit(10);
});