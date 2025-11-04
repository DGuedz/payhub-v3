#!/usr/bin/env node
/**
 * PAYHUB_V3 – Figma Import CLI (no external deps)
 * - Reads token from figma-prototype/figma.config.json or FIGMA_ACCESS_TOKEN
 * - Fetches file and optional nodes from Figma API
 * - Downloads SVG/PNG images for selected node types
 * - Writes assets to design-system/assets and metadata to design-system/export
 */

const fs = require('fs');
const path = require('path');

// Use global fetch (Node >=18)
const hasGlobalFetch = typeof fetch === 'function';
if (!hasGlobalFetch) {
  console.error('Global fetch not available. Please use Node >=18.');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '').replace(/-/g, '_');
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

function readToken() {
  try {
    const cfgPath = path.join(process.cwd(), 'figma-prototype', 'figma.config.json');
    if (fs.existsSync(cfgPath)) {
      const raw = fs.readFileSync(cfgPath, 'utf-8');
      const json = JSON.parse(raw);
      if (json.accessToken) return json.accessToken;
    }
  } catch (e) {
    // ignore
  }
  if (process.env.FIGMA_ACCESS_TOKEN) return process.env.FIGMA_ACCESS_TOKEN;
  return null;
}

async function fetchJSON(url, token) {
  const res = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} – ${text}`);
  }
  return res.json();
}

async function downloadBinary(url, outFile) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image download failed: ${res.status} – ${text}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, buf);
}

function collectNodeIds(node, list, limit = 50) {
  if (!node || list.length >= limit) return;
  const allowed = new Set(['FRAME', 'COMPONENT', 'COMPONENT_SET', 'VECTOR', 'RECTANGLE', 'GROUP', 'INSTANCE']);
  if (node.id && node.type && allowed.has(node.type)) {
    list.push(node.id);
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (list.length >= limit) break;
      collectNodeIds(child, list, limit);
    }
  }
}

function sanitizeFileName(name) {
  return String(name || 'asset').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80);
}

async function main() {
  const args = parseArgs();
  const fileKey = args.file_key || args.fileKey;
  const nodeId = args.node_id || args.nodeId || null;
  const outputDir = args.output || 'design-system/export';
  const assetsDir = args.assets || 'design-system/assets';
  const includeImages = String(args.include_images || 'true') === 'true';
  const optimizeSvg = String(args.optimize_svg || 'true') === 'true';

  if (!fileKey || !/^[A-Za-z0-9]+$/.test(fileKey)) {
    console.error('Invalid or missing --file-key. It must be alphanumeric.');
    process.exit(1);
  }

  const token = readToken();
  if (!token) {
    console.error('Missing Figma token. Provide FIGMA_ACCESS_TOKEN env or figma-prototype/figma.config.json');
    process.exit(1);
  }

  console.log(`▶️ Importing Figma file: ${fileKey} ${nodeId ? `(node ${nodeId})` : ''}`);

  let fileData;
  try {
    if (nodeId) {
      const nodes = await fetchJSON(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token);
      fileData = nodes;
    } else {
      fileData = await fetchJSON(`https://api.figma.com/v1/files/${fileKey}`, token);
    }
  } catch (e) {
    console.error('❌ Failed to fetch file:', e.message);
    process.exit(1);
  }

  const exportRoot = path.resolve(process.cwd(), outputDir);
  const assetsRoot = path.resolve(process.cwd(), assetsDir);
  fs.mkdirSync(exportRoot, { recursive: true });
  fs.mkdirSync(assetsRoot, { recursive: true });

  let documentNode = null;
  if (fileData.document) {
    documentNode = fileData.document;
  } else if (fileData.nodes && Array.isArray(fileData.nodes)) {
    const first = fileData.nodes[0];
    documentNode = first && first.document ? first.document : null;
  } else if (fileData.nodes && typeof fileData.nodes === 'object') {
    const key = Object.keys(fileData.nodes)[0];
    const n = key ? fileData.nodes[key] : null;
    documentNode = n && n.document ? n.document : null;
  }

  if (!documentNode) {
    console.warn('⚠️ No document node found. The file may be inaccessible or empty.');
  }

  const nodeIds = [];
  if (documentNode) {
    collectNodeIds(documentNode, nodeIds, 80);
  }
  // Always include the provided nodeId
  if (nodeId) nodeIds.unshift(nodeId);

  const metaOut = path.join(exportRoot, 'meta.json');
  const meta = {
    fileKey,
    nodeId,
    nodeCount: nodeIds.length,
    nodes: nodeIds,
    fetchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaOut, JSON.stringify(meta, null, 2));
  console.log(`📝 Metadata written to ${metaOut}`);

  if (includeImages && nodeIds.length > 0) {
    console.log(`🖼️ Requesting images for ${nodeIds.length} nodes...`);
    // SVG
    let imagesSvg;
    try {
      imagesSvg = await fetchJSON(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeIds.join(','))}&format=svg`, token);
    } catch (e) {
      console.warn('⚠️ SVG images fetch failed:', e.message);
    }
    // PNG (2x)
    let imagesPng;
    try {
      imagesPng = await fetchJSON(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeIds.join(','))}&format=png&scale=2`, token);
    } catch (e) {
      console.warn('⚠️ PNG images fetch failed:', e.message);
    }

    const svgMap = (imagesSvg && imagesSvg.images) || {};
    const pngMap = (imagesPng && imagesPng.images) || {};

    const svgsDir = path.join(assetsRoot, 'svgs');
    const pngsDir = path.join(assetsRoot, 'pngs');
    fs.mkdirSync(svgsDir, { recursive: true });
    fs.mkdirSync(pngsDir, { recursive: true });

    let downloaded = 0;
    for (const id of nodeIds) {
      const svgUrl = svgMap[id];
      if (svgUrl) {
        const outFile = path.join(svgsDir, `${sanitizeFileName(id)}.svg`);
        try {
          await downloadBinary(svgUrl, outFile);
          if (optimizeSvg) {
            try {
              const raw = fs.readFileSync(outFile, 'utf-8');
              const optimized = raw.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
              fs.writeFileSync(outFile, optimized);
            } catch {}
          }
          downloaded++;
        } catch (e) {
          console.warn(`⚠️ Failed SVG ${id}:`, e.message);
        }
      }
      const pngUrl = pngMap[id];
      if (pngUrl) {
        const outFile = path.join(pngsDir, `${sanitizeFileName(id)}.png`);
        try {
          await downloadBinary(pngUrl, outFile);
          downloaded++;
        } catch (e) {
          console.warn(`⚠️ Failed PNG ${id}:`, e.message);
        }
      }
    }
    console.log(`✅ Downloaded ${downloaded} image files to ${assetsRoot}`);
  } else {
    console.log('ℹ️ Skipped image download (no nodes or includeImages=false).');
  }

  console.log('🎉 Figma import completed.');
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});