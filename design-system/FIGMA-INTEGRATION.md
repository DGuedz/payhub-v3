#  Integração com Figma - PAYHUB_V3

##  Como Trazer o Protótipo do Figma

### 1. Obter o File Key
Acesse seu arquivo no Figma e copie o **FILE_KEY** da URL:
```
https://www.figma.com/file/FILE_KEY/Nome-do-Projeto
```

### 2. Estrutura de Pastas Preparada
```
design-system/
├──  export/           → Assets exportados do Figma
├──  components/       → Componentes convertidos para código
├──  assets/           → Imagens e recursos
└──  FIGMA-INTEGRATION.md → Este guia
```

### 3. Componentes que Podemos Exportar
-  **Botões** (Primary, Secondary, Danger)
-  **Cards** (Transação, Saldo, Segurança)  
-  **Formulários** (Inputs, validações)
-  **Ícones** (SVG exportável)
-  **Cores** (Paleta completa)
-  **Tipografia** (Font scales)

### 4. Comandos para Exportação

#### Exportar Cores (Tokens)
```bash
# As cores serão extraídas como CSS variables
:root {
  --figma-primary: #2563EB;
  --figma-secondary: #10B981;
  --figma-success: #059669;
}
```

#### Exportar Ícones (SVG)
```bash
# Ícones serão salvos em /design-system/assets/icons/
- shield-icon.svg
- xrpl-icon.svg  
- security-icon.svg
```

#### Exportar Components (React/HTML)
```bash
# Componentes convertidos para código
- Button.jsx
- Card.jsx
- Input.jsx
```

##  Fluxo de Trabalho Recomendado

### Passo 1: Preparar no Figma
1. Organizar componentes em frames nomeados
2. Usar auto-layout para responsividade
3. Nomear cores e styles consistentemente

### Passo 2: Exportar Assets
1. Exportar ícones como SVG
2. Extrair paleta de cores  
3. Exportar componentes principais

### Passo 3: Integrar no Código
1. Criar CSS variables base
2. Implementar componentes React
3. Testar responsividade

##  O Que Conseguimos Exportar

### Design Tokens
```css
/* Cores do Figma */
--color-primary: #2563EB;
--color-primary-hover: #1D4ED8;
--color-success: #10B981;
--color-warning: #F59E0B;

/* Typography */
--font-heading: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--text-lg: 1.125rem;

/* Spacing */
--spacing-4: 1rem;
--spacing-8: 2rem;
--border-radius: 0.5rem;
```

### Componentes Exportáveis
```jsx
// Botão baseado no Figma
function FigmaButton({ variant = 'primary', children }) {
  return (
    <button className={`figma-btn figma-btn-${variant}`}>
      {children}
    </button>
  );
}

// Card de transação
function TransactionCard({ amount, to, status }) {
  return (
    <div className="figma-transaction-card">
      <div className="amount">{amount} XRP</div>
      <div className="to">Para: {to}</div>
      <div className={`status status-${status}`}>{status}</div>
    </div>
  );
}
```

##  Para Começar Agora

### 1. Me forneça o FILE_KEY do Figma
```
File Key: ________________
```

### 2. Ou exporte manualmente:
- Exporte ícones como SVG
- Anote os valores hex das cores principais
- Capture screenshots dos componentes principais

### 3. Posso criar componentes baseados nas descrições:
```bash
# Botão primário do PAYHUB
# Card de transação XRPL  
# Input seguro para valores
# Indicadores de segurança
```

##  Responsividade Garantida

Todos os componentes serão:
-  Mobile-first
-  Testados em 320px, 768px, 1024px  
-  Acessíveis (keyboard + screen readers)
-  Performance otimizada

## ️ Componentes de Segurança Visual

### Honeypot Indicator
```jsx
<SecurityBadge type="honeypot" active={true} />
```

### KMS Protection
```jsx
<SecurityBadge type="kms" active={true} />
```

### Transaction Security
```jsx
<TransactionSecurity 
  level="high" 
  features={['honeypot', 'kms', 'mfa']}
/>
```

##  Integração com Código Existente

### CSS Variables
```css
/* design-system/styles.css */
:root {
  --figma-primary: #2563EB;
  --figma-border-radius: 8px;
  --figma-spacing: 16px;
}

/* src/frontend/styles.css */
.btn-primary {
  background: var(--figma-primary);
  border-radius: var(--figma-border-radius);
  padding: var(--figma-spacing);
}
```

### React Components
```jsx
// Importando componentes do design system
import { Button, Card, Input } from '../design-system/components/';

function PaymentForm() {
  return (
    <Card>
      <Input type="amount" placeholder="0.00 XRP" />
      <Button variant="primary">Confirmar Pagamento</Button>
    </Card>
  );
}
```

##  Checklist de Integração

- [ ] Obter FILE_KEY do Figma
- [ ] Exportar cores principais
- [ ] Exportar ícones como SVG
- [ ] Implementar componentes base
- [ ] Testar responsividade
- [ ] Integrar com código existente
- [ ] Validar acessibilidade

---

** Pronto para transformar seu design Figma em código de produção!**

Forneça o FILE_KEY ou descreva os componentes que quer priorizar.