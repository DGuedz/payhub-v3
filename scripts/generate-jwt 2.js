// Gera um JWT de curta duração usando JWT_SECRET do ambiente
// Uso: NODE_ENV=development JWT_SECRET=... node scripts/generate-jwt.js

const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('Missing JWT_SECRET env');
  process.exit(1);
}

const payload = { sub: 'merchant_test' };
const token = jwt.sign(payload, secret, { expiresIn: '5m' });
console.log(token);