#!/usr/bin/env node
// Build estático simples: copia public/ e index-lite.html para dist/
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');
const pub = path.join(root, 'public');
const indexLite = path.join(root, 'index-lite.html');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist);

  // Copiar public/
  copyDir(pub, dist);

  // Copiar index-lite.html como index.html
  if (fs.existsSync(indexLite)) {
    fs.copyFileSync(indexLite, path.join(dist, 'index.html'));
  } else {
    console.warn('index-lite.html não encontrado; usando public/index.html se existir');
    const publicIndex = path.join(pub, 'index.html');
    if (fs.existsSync(publicIndex)) {
      fs.copyFileSync(publicIndex, path.join(dist, 'index.html'));
    }
  }

  console.log('[static-build] dist gerado com sucesso em ./dist');
}

main();