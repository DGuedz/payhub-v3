const fs = require('fs')
const path = require('path')

const allowedExt = new Set(['.md', '.html', '.ts', '.tsx', '.js', '.jsx', '.json', '.txt'])
const ignoreDirs = new Set(['node_modules', '.next', 'dist', 'build', '.git'])
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu

function shouldIgnore(p) {
  const parts = p.split(path.sep)
  return parts.some((seg) => ignoreDirs.has(seg))
}

function walk(dir, out = []) {
  if (shouldIgnore(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (shouldIgnore(full)) continue
    if (e.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function stripEmojis(file) {
  const ext = path.extname(file)
  if (!allowedExt.has(ext)) return false
  const data = fs.readFileSync(file, 'utf8')
  if (!emojiRegex.test(data)) return false
  const cleaned = data.replace(emojiRegex, '')
  fs.writeFileSync(file, cleaned)
  return true
}

function main() {
  const root = process.cwd()
  const files = walk(root)
  let changed = 0
  for (const f of files) {
    try { if (stripEmojis(f)) changed++ } catch {}
  }
  process.stdout.write(JSON.stringify({ ok: true, changed }) + '\n')
}

main()
