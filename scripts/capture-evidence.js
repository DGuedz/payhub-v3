const fs = require('fs')
const path = require('path')
const http = require('http')

function callApi(method, route, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null
    const req = http.request({
      hostname: 'localhost',
      port: Number(process.env.PORT || 3001),
      path: route,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev'
      }
    }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { resolve({}) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

function appendCsv(row) {
  const out = path.join(__dirname, '../docs/testnet-audit/transactions.csv')
  if (!fs.existsSync(out)) {
    fs.writeFileSync(out, 'operation,tx_hash,sequence,owner,offer_sequence,destination,amount_currency,amount_value,amount_issuer,status,timestamp,explorer_url\n')
  }
  fs.appendFileSync(out, row + '\n')
}

function explorerUrl(hash) {
  const base = process.env.XRPL_NETWORK === 'testnet' ? 'https://testnet.xrpl.org' : 'https://devnet.xrpl.org'
  return `${base}/transactions/${hash}`
}

(async () => {
  const trust = await callApi('POST', '/api/trustline-rlusd', {})
  if (trust && trust.txHash) appendCsv([
    'TRUSTLINE', trust.txHash, trust.sequence || '', '', '', '', 'RLUSD', '', trust.issuer || '', 'TRUSTLINE_OK', new Date().toISOString(), explorerUrl(trust.txHash)
  ].join(','))

  const escCreate = await callApi('POST', '/api/escrow-create', { valueRLUSD: '100.00' })
  if (escCreate && escCreate.txHash) appendCsv([
    'ESCROW_CREATE', escCreate.txHash, escCreate.sequence || '', escCreate.owner || '', escCreate.offerSequence || '', escCreate.destination || '', 'RLUSD', '100.00', escCreate.issuer || '', 'CREATED', new Date().toISOString(), explorerUrl(escCreate.txHash)
  ].join(','))

  const escFinish = await callApi('POST', '/api/escrow-finish', { owner: escCreate.owner, offerSequence: escCreate.offerSequence })
  if (escFinish && escFinish.txHash) appendCsv([
    'ESCROW_FINISH', escFinish.txHash, escFinish.sequence || '', escCreate.owner || '', escCreate.offerSequence || '', '', 'RLUSD', '0', escCreate.issuer || '', 'FINISHED', new Date().toISOString(), explorerUrl(escFinish.txHash)
  ].join(','))
  console.log('OK')
})().catch((e) => { console.error(e && e.message ? e.message : e) })
