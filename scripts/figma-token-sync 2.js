#!/usr/bin/env node
/**
 * figma-token-sync.js (Fase 2)
 * - Lê token em figma-prototype/figma.config.json
 * - Chama Figma API para obter styles
 * - Gera design-system/tokens.json com colors/typography/effects (referências)
 * - Exit code 0 em sucesso
 */
import fs from 'fs/promises';
import path from 'path';

const cfgPath = path.resolve('figma-prototype/figma.config.json');
const outPath = path.resolve('design-system/tokens.json');

async function readToken() {
  try {
    const raw = await fs.readFile(cfgPath, 'utf8');
    const { token } = JSON.parse(raw);
    if (!token) throw new Error('Token não encontrado em figma-prototype/figma.config.json');
    return token;
  } catch (e) {
    throw new Error('Erro ao ler token: ' + (e?.message || e));
  }
}

async function fetchFigma(endpoint, token) {
  const url = `https://api.figma.com/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': token }
  });
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
  if (!res.ok) {
    const msg = json?.err || json?.message || txt || `HTTP ${res.status}`;
    throw new Error(`Figma API error (${res.status}): ${msg}`);
  }
  return json;
}

function keyFromName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\/\\]/g, '-')
    .toLowerCase();
}

async function main(){
  try {
    const token = await readToken();
    const fileKey = process.env.FIGMA_FILE_KEY;
    if (!fileKey) throw new Error('FIGMA_FILE_KEY não definido (export FIGMA_FILE_KEY=...)');

    // 1) pegar estilos do arquivo
    const stylesRes = await fetchFigma(`files/${fileKey}/styles`, token);
    const styles = stylesRes.styles || stylesRes.meta?.styles || [];

    const tokenOutput = { colors: {}, typography: {}, effects: {} };
    for (const s of styles) {
      const name = s.name || s.style_name || s.description || s.key;
      const styleType = s.style_type || s.type;
      const key = keyFromName(name);
      const id = s.node_id || s.key || s.id;
      if (!key || !id || !styleType) continue;
      if (styleType === 'FILL' || styleType === 'COLOR' || styleType === 'PAINT') {
        tokenOutput.colors[key] = { figmaStyleId: id };
      } else if (styleType === 'TEXT') {
        tokenOutput.typography[key] = { figmaStyleId: id };
      } else if (styleType === 'EFFECT') {
        tokenOutput.effects[key] = { figmaStyleId: id };
      }
    }

    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(tokenOutput, null, 2), 'utf8');
    console.log('Tokens gerados em:', outPath);
    process.exit(0);
  } catch (err) {
    console.error('ERRO:', err.message || err);
    process.exit(2);
  }
}

main();