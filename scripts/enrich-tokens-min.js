/**
 * enrich-tokens-min.js
 * - Versão enxuta: resolve apenas cores SOLID a partir de figmaStyleId
 * - Requisitos: export FIGMA_FILE_KEY, figma-prototype/figma.config.json com token
 * - Processo:
 *    1) lê design-system/tokens.json
 *    2) para cada token.colors com figmaStyleId, tenta resolver hex de SOLID fill
 *    3) grava tokens.json (bak) e retorna resumo
 */
import fs from 'fs/promises';
import path from 'path';

const CFG = path.resolve('figma-prototype/figma.config.json');
const TOKENS = path.resolve('design-system/tokens.json');

async function readCfg(){
  const raw = await fs.readFile(CFG,'utf8');
  return JSON.parse(raw);
}

async function fetchFigma(endpoint, token){
  const url = `https://api.figma.com/v1/${endpoint}`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token }});
  if(!res.ok) throw new Error(`Figma ${res.status}`);
  return res.json();
}

function rgbaToHex(c, opacity=1){
  const toHex=(v)=>Math.round(v*255).toString(16).padStart(2,'0');
  const a = opacity===1 ? '' : toHex(opacity);
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}${a}`.toUpperCase();
}

async function resolveColor(styleId, fileKey, token){
  try{
    // GET style info (styleId deve ser a "key" do estilo)
    const style = await fetchFigma(`styles/${styleId}`, token).catch(()=>null);
    const nodeId = style?.node_id || style?.nodeId || style?.meta?.node_id || style?.style?.node_id;
    if(!nodeId) return null;
    // GET node paints
    const nodes = await fetchFigma(`files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token).catch(()=>null);
    const nodeObj = nodes?.nodes?.[nodeId] || nodes?.nodes?.[Object.keys(nodes?.nodes||{})[0]];
    const fills = nodeObj?.document?.fills || nodeObj?.fills || nodeObj?.document?.children?.[0]?.fills;
    if(!fills || !Array.isArray(fills)) return null;
    const solid = fills.find(p=>p.type==='SOLID') || fills[0];
    if(!solid || !solid.color) return null;
    const opacity = solid.opacity ?? (solid.opacity === 0 ? 0 : 1);
    return rgbaToHex(solid.color, opacity);
  }catch(e){
    return null;
  }
}

async function main(){
  if(!process.env.FIGMA_FILE_KEY) { console.error('Export FIGMA_FILE_KEY'); process.exit(2); }
  const fileKey = process.env.FIGMA_FILE_KEY;
  const { token } = await readCfg();
  const raw = await fs.readFile(TOKENS,'utf8');
  const tokens = JSON.parse(raw);
  const colors = tokens.colors || {};
  const keys = Object.keys(colors);
  const summary = { resolved:0, skipped:0, failed:0 };

  // concurrency control
  const concurrency = 5;
  for(let i=0;i<keys.length;i+=concurrency){
    const batch = keys.slice(i,i+concurrency);
    const promises = batch.map(async k=>{
      const v = colors[k];
      if(v && typeof v === 'object' && v.figmaStyleId && !v.value && !v.hex){
        const hex = await resolveColor(v.figmaStyleId, fileKey, token);
        if(hex){ tokens.colors[k].value = hex; summary.resolved++; }
        else { summary.failed++; }
      } else { summary.skipped++; }
    });
    await Promise.all(promises);
  }

  // backup + write
  await fs.copyFile(TOKENS, TOKENS + '.bak').catch(()=>null);
  await fs.writeFile(TOKENS, JSON.stringify(tokens, null, 2), 'utf8');
  console.log('Done', summary);
}
main();