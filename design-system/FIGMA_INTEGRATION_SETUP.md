# 🎨 Integração Figma → Trae IDE - Setup Completo

## Objetivo
Integrar o ambiente Trae IDE ao projeto de design do PAYHUB no Figma, criando os documentos necessários e configurando o token de acesso para importar dados e assets.

---

## Documentos Criados

1) FIGMA_INTEGRATION_SETUP.md
- Guia de integração completo:
  - Token configurado
  - Como localizar o File Key
  - Permissões e importação
  - Troubleshooting
  - Checklist final

2) PITCH_DECK_FIGMA_BRIEF.md
- Brief UI/UX detalhado:
  - Paleta HEX + tipografia
  - Elementos visuais (logo, ícones, moedas 3D, globo)
  - Estrutura de 12 slides (Pitch PAYHUB)
  - Sugestões de animações
  - Checklist de entrega

---

## Token de Acesso (Configuração)

- Status: ✅ PRONTO
- Token: `<FIGMA_TOKEN>` (placeholder; não incluir token real no repositório)
- Validade: conforme sua conta Figma
- Uso: mantenha o token fora do controle de versão

Armazenamento local do token:
- Arquivo: `figma-prototype/figma.config.json`
- Formato (exemplo):
```json
{
  "token": "<FIGMA_TOKEN>",
  "updatedAt": "2025-11-04T00:00:00.000Z"
}
```

Recomendação de segurança:
- Não commitar este arquivo em repositórios públicos.
- Alternativa: armazenar em `.env.local` como `FIGMA_TOKEN` e carregar via ambiente.

---

## Como localizar o File Key

Abra seu projeto no Figma e copie o trecho alfanumérico da URL:

```
https://www.figma.com/file/ABC123DEF456/Nome-do-Projeto
```

Onde `ABC123DEF456` é o **File Key**. Para nós, você já forneceu:
- File Key (provido): `UQwbW2cybw7SGzlBWHlgcr`
- Node ID (exemplo da URL): `0:1`

---

## Permissões necessárias no Figma

- O arquivo deve estar com compartilhamento que permita leitura pela API:
  - Preferencial: "Anyone with the link can view"
  - Ou equipe/usuário com acesso concedido ao token utilizado

---

## Importação (Fluxo)

1) Validar token e permissões
2) Fornecer `fileKey` alfanumérico
3) Opcional: fornecer `nodeId` específico (ex.: `0:1`)
4) Importar dados do arquivo (estrutura, cores, componentes)
5) Baixar imagens e ícones como SVG/PNG
6) Salvar em `design-system/export/` e `design-system/assets/`

---

## Troubleshooting

- Erro 400 (Bad Request):
  - Verifique se o `fileKey` é apenas alfanumérico
  - Confirme que o arquivo está compartilhado para leitura por API
  - Garanta que o token tem escopo e está ativo

- Erro 403 (Forbidden):
  - O token não tem permissão para este arquivo
  - Ajuste compartilhamento ou use um token com acesso correto

- Erro 404 (Not Found):
  - O file key não existe ou foi removido
  - Confirme a URL e o workspace

---

## Checklist Final

- [ ] Token armazenado localmente com segurança
- [ ] File Key alfanumérico confirmado
- [ ] Permissões de leitura habilitadas
- [ ] Importação de dados (nodes, cores, styles)
- [ ] Download de assets (SVG/PNG) concluído
- [ ] Integração com `design-system/` pronta

---

```
✅ Figma Integration Environment Initialized.
📂 Files: FIGMA_INTEGRATION_SETUP.md + PITCH_DECK_FIGMA_BRIEF.md
🚀 Aguardando File Key (e permissões) para disparar importação.
```