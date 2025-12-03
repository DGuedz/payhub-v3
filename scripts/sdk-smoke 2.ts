import { createSDK } from '../sdk/payhub';
import fs from 'fs';
import jwt from 'jsonwebtoken';

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const secret = process.env.JWT_SECRET || 'dev-secret-123';
  const token = jwt.sign({ sub: 'merchant_test', iat: Math.floor(Date.now() / 1000) }, secret, { expiresIn: '10m' });
  const sdk = createSDK({ baseUrl, token });

  let issuer = '';
  let src = '';
  let dst = '';
  try {
    const raw = fs.readFileSync('docs/ARTIFACTS_DEVNET_REAL.json', 'utf8');
    const data = JSON.parse(raw);
    issuer = data.artifacts?.rlusdIssuer || '';
    src = data.artifacts?.merchantAccount || '';
    dst = data.artifacts?.treasuryVault || '';
  } catch {}

  const RLUSD_HEX = sdk.currencyHex('RLUSD');
  const amm = await sdk.amm.quote({ sourceAccount: src, destinationAccount: dst, deliverCurrency: RLUSD_HEX, deliverIssuer: issuer, deliverValue: '1' });
  const csv = await sdk.compliance.exportCSV();
  const alerts = await sdk.security.alerts();

  process.stdout.write(JSON.stringify({ ok: true, amm, csvLength: csv.length, alertsCount: alerts?.alerts?.length || 0 }));
}

main().catch((e) => { process.stderr.write(String(e && e.message ? e.message : e)); process.exit(1); });

