// Validador de workflows n8n (HubAI) — PAYHUB P4YHU3
// Segurança: não expõe segredos; verifica headers e estrutura.

const fs = require('fs');
const path = require('path');

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function hasSensitivePatterns(str) {
  if (typeof str !== 'string') return false;
  const patterns = [/\bsEd[0-9A-Za-z]{20,}\b/, /Bearer\s+[A-Za-z0-9\-_.]+/];
  return patterns.some((re) => re.test(str));
}

function validateWorkflow(filePath) {
  const wf = readJson(filePath);
  const res = { file: path.basename(filePath), ok: true, issues: [] };
  try {
    if (!wf.nodes || !wf.connections) {
      res.ok = false;
      res.issues.push('Estrutura inválida: nodes/connections ausentes');
    }
    // Verificar headers Authorization = {{$env.PAYHUB_JWT}}
    (wf.nodes || []).forEach((node) => {
      const opts = node.parameters && node.parameters.options;
      const headers = opts && opts.headerParameters ? opts.headerParameters : [];
      headers.forEach((h) => {
        if (h.name && h.name.toLowerCase() === 'authorization') {
          const v = String(h.value || '');
          if (!v.includes('{{$env.PAYHUB_JWT}}')) {
            res.ok = false;
            res.issues.push(`Header Authorization não usa {{$env.PAYHUB_JWT}} em node ${node.name}`);
          }
        }
        const vAll = String(h.value || '');
        if (hasSensitivePatterns(vAll)) {
          res.ok = false;
          res.issues.push(`Header contém padrão sensível em node ${node.name}`);
        }
      });
      // Scan parâmetros por segredos
      const paramsJson = node.parameters && (node.parameters.bodyParametersJson || node.parameters.queryParametersJson || '');
      if (hasSensitivePatterns(String(paramsJson))) {
        res.ok = false;
        res.issues.push(`Parâmetros JSON com padrão sensível em node ${node.name}`);
      }
    });
  } catch (err) {
    res.ok = false;
    res.issues.push(`Erro ao validar: ${err.message}`);
  }
  return res;
}

function main() {
  try {
    const dir = path.join(process.cwd(), 'n8n', 'workflows');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    const results = files.map((f) => validateWorkflow(path.join(dir, f)));
    const summary = {
      ok: results.every((r) => r.ok),
      results,
    };
    console.log(JSON.stringify(summary, null, 2));
    process.exit(summary.ok ? 0 : 1);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exit(2);
  }
}

main();