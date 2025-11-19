/**
 * normalize-and-enrich.js
 * - Normaliza figmaStyleId -> style.key (quando possível)
 * - Tenta resolver node_id (via style or file styles list) e extrair SOLID fills
 * - Atualiza design-system/tokens.json com value: "#RRGGBB" quando encontrado
 *
 * Risco baixo: só altera tokens.colors que contenham figmaStyleId e não possuam value.
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
  if(!res.ok){
    const txt = await res.text().catch(()=>res.statusText);
    throw new Error(`Figma API ${res.status} ${txt}`);
  }
  return res.json();
}

function rgbaToHex(c, opacity=1){
  const toHex=(v)=> Math.round(v*255).toString(16).padStart(2,'0');
  const a = (opacity===1 || opacity===undefined) ? '' : toHex(opacity);
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}${a}`.toUpperCase();
}

async function tryResolveStyleKey(styleId, fileKey, token){
  // 1) GET /styles/{styleId}
  let styleObj = null;
  try {
    styleObj = await fetchFigma(`styles/${encodeURIComponent(styleId)}`, token);
  } catch(e){
    // ignore, fallback later
  }
  // styleObj may be direct style object or wrapper
  const style = styleObj?.style || styleObj;
  const key = style?.key || style?.style?.key || style?.meta?.key;
  const node_id = style?.node_id || style?.style?.node_id || style?.meta?.node_id;
  return { key, node_id, raw: style };
}

async function findStyleInFileByKey(styleKey, fileKey, token){
  // GET /files/:key/styles returns { meta:..., styles: [...] }
  try {
    const list = await fetchFigma(`files/${fileKey}/styles`, token);
    const styles = list.styles || list.meta?.styles || [];
    const found = (styles || []).find(s => s.key === styleKey || s.id === styleKey);
    // found may include node_id
    return found || null;
  } catch(e){
    return null;
  }
}

async function getNodeFills(fileKey, nodeId, token){
  try {
    const nodesResp = await fetchFigma(`files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token);
    // choose first node key match
    const key = Object.keys(nodesResp.nodes || {})[0];
    const node = nodesResp.nodes?.[key] || nodesResp.nodes?.[nodeId];
    const doc = node?.document || node;
    // prefer direct fills
    const fills = node?.fills || doc?.fills || (doc?.children && doc.children[0]?.fills);
    return fills || null;
  } catch(e){
    return null;
  }
}

async function main(){
  try {
    const { token } = await readCfg();
    const fileKey = process.env.FIGMA_FILE_KEY;
    if(!fileKey) throw new Error('Export FIGMA_FILE_KEY first');

    const raw = await fs.readFile(TOKENS,'utf8');
    const tokens = JSON.parse(raw);
    const colors = tokens.colors || {};
    const keys = Object.keys(colors);

    const summary = { normalized:0, resolved:0, skipped:0, failed:0 };

    for (const k of keys){
      const entry = colors[k];
      // only operate when figmaStyleId exists and no value set
      if (!entry || typeof entry !== 'object') { summary.skipped++; continue; }
      if (entry.value || entry.hex) { summary.skipped++; continue; }
      if (!entry.figmaStyleId) { summary.skipped++; continue; }

      const origId = entry.figmaStyleId;
      // 1) try normalize to style.key
      let { key: styleKey, node_id } = await tryResolveStyleKey(origId, fileKey, token).catch(()=>({}));
      if (styleKey){
        // persist normalized key
        tokens.colors[k].figmaStyleId = styleKey;
        summary.normalized++;
      }

      // 2) try to find node_id: prefer style response, else search in file styles list
      if (!node_id && styleKey){
        const found = await findStyleInFileByKey(styleKey, fileKey, token);
        node_id = found?.node_id || found?.nodeId || found?.node_id;
      }

      // 3) fallback: if still no node_id, try to interpret originalId as node_id
      if (!node_id && origId && origId.includes(':')) {
        node_id = origId;
      }

      // 4) if node_id present, fetch fills and extract SOLID color
      if (node_id){
        const fills = await getNodeFills(fileKey, node_id, token);
        if (fills && Array.isArray(fills) && fills.length){
          const solid = fills.find(p=>p.type==='SOLID') || fills[0];
          if (solid && solid.color){
            const opacity = (solid.opacity === 0) ? 0 : (solid.opacity ?? 1);
            const hex = rgbaToHex(solid.color, opacity);
            tokens.colors[k].value = hex;
            summary.resolved++;
            continue;
          }
        }
      }

      // not resolved
      summary.failed++;
    }

    // backup + write only if changed
    await fs.copyFile(TOKENS, TOKENS + '.bak').catch(()=>null);
    await fs.writeFile(TOKENS, JSON.stringify(tokens, null, 2), 'utf8');

    console.log('Done', summary);
    process.exit(0);
  } catch(err){
    console.error('ERROR:', err.message || err);
    process.exit(2);
  }
}

main();
