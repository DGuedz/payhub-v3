# Script de Auditoria (Trae) — PAYHUB V3

Passos (estimado 45 min):
1) Validar variáveis de ambiente sem segredos no frontend.
2) Rodar backend de testnet e mockar JWT curto.
3) Executar Trustline RLUSD.
4) Executar EscrowCreate (IOU) e capturar owner/offerSequence.
5) Executar EscrowFinish via backend seguro; registrar txHash/sequence.
6) Simular gatilho Honeypot (carteira isca) e verificar invalidação de sessão.
7) Exportar logs para auditoria.