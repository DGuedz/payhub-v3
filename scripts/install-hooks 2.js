const fs = require('fs')
const path = require('path')

function main() {
  try {
    const gitDir = path.join(process.cwd(), '.git')
    const hooksDir = path.join(gitDir, 'hooks')
    if (!fs.existsSync(gitDir)) return
    if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true })
    const precommitPath = path.join(hooksDir, 'pre-commit')
    const script = ['#!/bin/sh', 'node scripts/remove-emojis.js', 'git add -A', 'exit 0'].join('\n')
    fs.writeFileSync(precommitPath, script)
    fs.chmodSync(precommitPath, 0o755)
    process.stdout.write('pre-commit installed\n')
  } catch {}
}

main()
