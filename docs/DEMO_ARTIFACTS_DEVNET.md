# PAYHUB V3 — Artefatos Devnet/Testnet (XRPL)

Objetivo: registrar evidências técnicas das transações XRPL em ambientes `devnet/testnet` sem expor segredos, garantindo rastreabilidade e auditoria mínima.

## O que registrar
- `network`: `devnet` ou `testnet` (definido por `XRPL_NETWORK` ou ambiente).
- Trustline RLUSD: `txHash`, `sequence`.
- EscrowCreate (IOU RLUSD): `txHash`, `offerSequence`, `destination`.
- EscrowFinish: `txHash`, `sequence`, `owner`.
- Metadados: `generatedAt`, `baseUrl`.

## Como gerar automaticamente (Smoke Demo)
Pré-requisitos:
- Backend ativo: `node server.js` (porta 3000 por padrão).
- JWT curto: `TOKEN` via `node scripts/generate-jwt.js` ou `JWT_SECRET` para geração automática.
- Endereços: `DESTINATION_ADDRESS` (carteira do recebedor) e `OWNER_ADDRESS` do Escrow. Alternativamente, defina `XRPL_SEED` no backend para derivar `OWNER_ADDRESS` (somente env, nunca em arquivos).

Comando (exemplo):
```bash
# Exemplo em dev local (ajuste variáveis conforme seu ambiente)
BASE_URL=http://localhost:3000 \
TOKEN="<JWT_CURTO>" \
DESTINATION_ADDRESS="<ADDRESS_COMERCIANTE>" \
OWNER_ADDRESS="<ADDRESS_OWNER>" \
OUTPUT_FILE=docs/ARTIFACTS_DEVNET.json \
node scripts/xrpl-smoke-demo.js
```

Resultado:
- Cria/atualiza `docs/ARTIFACTS_DEVNET.json` com estrutura:
```json
{
  "generatedAt": "2025-11-10T12:34:56.789Z",
  "baseUrl": "http://localhost:3000",
  "steps": {
    "trustline": { "txHash": "...", "sequence": 123 },
    "escrowCreate": { "txHash": "...", "offerSequence": 456, "destination": "r..." },
    "advancePayment": { "txHash": "...", "sequence": 678, "financedAmount": "950.00" },
    "escrowFinish": { "txHash": "...", "sequence": 789, "owner": "r..." }
  }
}
```

## Verificar no Explorer
- Testnet: `https://testnet.xrpl.org/transactions/<txHash>`
- Devnet: `https://devnet.xrpl.org/transactions/<txHash>`

## Segurança e Compliance
- Nunca incluir `XRPL_SEED`, `JWT_SECRET` ou tokens em arquivos — usar apenas variáveis de ambiente.
- Assinaturas ocorrem exclusivamente no backend; auditoria de transações registra `txHash`/`sequence` sem segredos (`api/_logger.js`).
- Os workflows n8n utilizam `{{$env.PAYHUB_JWT}}` e `{{$env.BASE_URL}}`; sem hardcode de tokens/URLs.

## Comando npm (atalho)
Após definir as variáveis necessárias (`TOKEN`, `DESTINATION_ADDRESS`, `OWNER_ADDRESS`), execute:
```bash
npm run demo:artifacts
```
Ele gera `docs/ARTIFACTS_DEVNET.json` com os artefatos da execução.

---
Notas:
- Em produção, preferir KMS (AWS KMS/Vault) para criptografia em repouso da `XRPL_SEED` e descriptografia efêmera no backend.
- Em `devnet/testnet`, manter registros de `txHash` facilita auditoria e confirmação de fluxo end-to-end.