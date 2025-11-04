/**
 * token-to-css.js
 * - Lê design-system/tokens.json
 * - Gera design-system/export/tokens.css com :root { --token: value; }
 * - Suporta:
 *   - token: "hex" (string)
 *   - token: { "value": "hex" }
 *   - token: { "figmaStyleId": "..." } -> gera placeholder comment
 */
import fs from 'fs/promises';
import path from 'path';

const inPath = path.resolve('design-system/tokens.json');
const outDir = path.resolve('design-system/export');
const outPath = path.join(outDir, 'tokens.css');

function normalizeKey(k){
  return k.replace(/\s+/g,'-').replace(/[\/\\]/g,'-').replace(/[^a-z0-9\-\_]/gi,'').toLowerCase();
}

function extractValue(v){
  if(!v && v !== 0) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return v.toString();
  if (typeof v === 'object'){
    if (v.value) return v.value;
    if (v.hex) return v.hex;
    if (v.rgba) return v.rgba;
    if (v.figmaStyleId) return null; // placeholder, need enrichment
  }
  return null;
}

async function main(){
  try{
    await fs.mkdir(outDir, { recursive: true });
    const raw = await fs.readFile(inPath, 'utf8');
    const tokens = JSON.parse(raw);

    const lines = [];
    lines.push('/* Auto-generated: design-system/export/tokens.css */');
    lines.push(':root {');

    // colors
    if (tokens.colors){
      lines.push('  /* Colors */');
      for (const [k, v] of Object.entries(tokens.colors)){
        const key = normalizeKey(k);
        const val = extractValue(v);
        if (val){
          lines.push(`  --color-${key}: ${val};`);
        } else {
          const fig = (typeof v === 'object' && v.figmaStyleId) ? ` /* figmaStyleId: ${v.figmaStyleId} */` : ' /* placeholder - add real value */';
          lines.push(`  --color-${key}: #000000;${fig}`);
        }
      }
    }

    // typography
    if (tokens.typography){
      lines.push('');
      lines.push('  /* Typography */');
      for (const [k, v] of Object.entries(tokens.typography)){
        const key = normalizeKey(k);
        const val = extractValue(v);
        if (val){
          lines.push(`  --type-${key}: ${val};`);
        } else {
          const fig = (typeof v === 'object' && v.figmaStyleId) ? ` /* figmaStyleId: ${v.figmaStyleId} */` : ' /* placeholder - add real value */';
          lines.push(`  --type-${key}: 1rem;${fig}`);
        }
      }
    }

    // effects (se existirem no tokens.json)
    if (tokens.effects){
      lines.push('');
      lines.push('  /* Effects */');
      for (const [k, v] of Object.entries(tokens.effects)){
        const key = normalizeKey(k);
        const val = extractValue(v);
        if (val){
          lines.push(`  --effect-${key}: ${val};`);
        } else {
          const fig = (typeof v === 'object' && v.figmaStyleId) ? ` /* figmaStyleId: ${v.figmaStyleId} */` : ' /* placeholder - add real value */';
          lines.push(`  --effect-${key}: 0px;${fig}`);
        }
      }
    }

    lines.push('}');

    await fs.writeFile(outPath, lines.join('\n') + '\n', 'utf8');
    console.log('tokens.css generated at:', outPath);
    process.exit(0);
  } catch(err){
    console.error('Error generating tokens.css:', err);
    process.exit(2);
  }
}

main();