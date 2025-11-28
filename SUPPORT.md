# Suporte Payhub — Triagem e Resolução

Esta branch adiciona documentação mínima para o time de suporte do Payhub e um fluxo padrão de triagem.

Objetivo
- Consolidar responsabilidades de suporte, checklist de triagem e comandos úteis para que o time possa agir rapidamente nas PRs/bugs abertos.

Fluxo inicial de triagem
1. Confirmar que a issue/PR descreve o problema com passos reprodutíveis e logs.
2. Verificar estado do CI (aba "Checks") e coletar os erros dos jobs.
3. Sincronizar a branch com main localmente e testar para reproduzir o erro:
   - git fetch origin
   - git checkout <branch>
   - git merge origin/main
4. Rodar linter e testes localmente:
   - npm ci
   - npm run lint
   - npm run typecheck
   - npm test
5. Rodar scanner de segredos se aplicável:
   - git-secrets --scan
   - trufflehog --repo-path .
6. Se for exposição de segredo, rotacionar imediatamente a chave e remover do histórico (usar git filter-repo ou BFG com cautela).
7. Abrir PRs de correção para cada problema identificado; preferir PRs pequenos e com escopo claro.

Checklist rápido (usar antes de fechar/mergear)
- [ ] Branch sincronizada com main e sem conflitos.
- [ ] Checks do CI verdes (lint, typecheck, build, tests).
- [ ] Nenhum segredo presente no repo (git-secrets OK).
- [ ] Testes unitários e integração cobrem o caso reproduzido.
- [ ] Logs sem PII e CSV de compliance contendo txHash/sequence.
- [ ] Revisores atribuídos (backend, segurança, QA).

Contato e responsabilidades
- Suporte técnico inicial: @DGuedz
- Segurança: equipe (tag: security)
- QA: equipe (tag: qa)

Notas
- Para problemas relacionados a XRPL_SEED, nunca commitar chaves; usar KMS/Secret Manager e configurar secrets no repo/CI.