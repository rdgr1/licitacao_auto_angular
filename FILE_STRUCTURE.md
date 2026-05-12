# 📁 Estrutura de Arquivos Completa

## Visual Tree

```
licitacao_auto_angular/
│
├── 📚 Documentação
│   ├── QUICK_START.md                    ← Comece aqui (5 minutos)
│   ├── TESTING_GUIDE.md                  ← Guia completo de testes
│   ├── API_INTEGRATION_GUIDE.md           ← Integração com backend
│   ├── IMPLEMENTATION_SUMMARY.md          ← Resumo executivo
│   ├── FILE_STRUCTURE.md                  ← Este arquivo
│   └── README.md                          ← Padrão Angular
│
├── src/
│   │
│   ├── 🎨 Global Styles
│   │   └── styles.scss                   ← Material 3 theme + custom styles
│   │
│   ├── 📍 App Root
│   │   ├── app.ts                        ← Componente raiz
│   │   ├── app.html                      ← Template raiz (router-outlet)
│   │   ├── app.scss                      ← Estilos app
│   │   ├── app.routes.ts                 ← Configuração de rotas
│   │   ├── app.config.ts                 ← Providers e configurações
│   │   └── app.spec.ts                   ← Testes
│   │
│   ├── 🌍 Environments
│   │   ├── environment.ts                ← Config desenvolvimento
│   │   └── environment.prod.ts           ← Config produção
│   │
│   ├── 📦 App Folder
│   │   │
│   │   ├── 🔷 core/
│   │   │   │
│   │   │   ├── 📋 models/
│   │   │   │   └── edital.model.ts       ← Enums: EditalStatus, Modalidade
│   │   │   │                             ← Interfaces: EditalResponse, LeadResponse, EstatisticasDTO
│   │   │   │
│   │   │   ├── 🔧 services/
│   │   │   │   ├── editais.service.ts    ← API real (GET, POST, DELETE)
│   │   │   │   ├── editais.mock.ts       ← API mock com dados de teste
│   │   │   │   ├── notification.service.ts ← Toast notifications
│   │   │   │   └── loading.service.ts    ← Estado global de loading
│   │   │   │
│   │   │   └── 🌐 interceptors/
│   │   │       ├── http-error.interceptor.ts  ← Trata erros HTTP
│   │   │       ├── loading.interceptor.ts     ← Mostra/esconde spinner
│   │   │       └── mock.interceptor.ts        ← Ativa/desativa mock data
│   │   │
│   │   ├── 🎯 features/
│   │   │   │
│   │   │   ├── 🏗️ layout/
│   │   │   │   └── main-layout/
│   │   │   │       └── main-layout.component.ts  ← Sidebar + Toolbar
│   │   │   │
│   │   │   ├── 📊 dashboard/
│   │   │   │   ├── dashboard.component.ts        ← Logic (stats, charts)
│   │   │   │   ├── dashboard.component.html      ← 4 Stats Cards + Pie Chart
│   │   │   │   └── dashboard.component.scss      ← Estilos dashboard
│   │   │   │
│   │   │   ├── 🚀 pipeline/
│   │   │   │   ├── pipeline.component.ts         ← Logic (drag & drop)
│   │   │   │   ├── pipeline.component.html       ← 3 Colunas Kanban
│   │   │   │   └── pipeline.component.scss       ← Estilos pipeline
│   │   │   │
│   │   │   └── 📄 editais/
│   │   │       │
│   │   │       ├── editais-list/
│   │   │       │   ├── editais-list.component.ts      ← Logic (DataTable)
│   │   │       │   ├── editais-list.component.html    ← Tabela, busca, ações
│   │   │       │   └── editais-list.component.scss    ← Estilos lista
│   │   │       │
│   │   │       └── edital-details/
│   │   │           ├── edital-details.component.ts    ← Logic (tabs, navegação)
│   │   │           ├── edital-details.component.html  ← 3 Tabs + Botões
│   │   │           └── edital-details.component.scss  ← Estilos detalhes
│   │   │
│   │   └── 🎁 shared/
│   │       │
│   │       ├── 🔄 components/
│   │       │   ├── loading-spinner/
│   │       │   │   └── loading-spinner.component.ts   ← Spinner com overlay
│   │       │   │
│   │       │   ├── confirm-dialog/
│   │       │   │   └── confirm-dialog.component.ts    ← Diálogo confirmação
│   │       │   │
│   │       │   ├── empty-state/
│   │       │   │   └── empty-state.component.ts       ← Mensagem "sem dados"
│   │       │   │
│   │       │   └── stats-card/
│   │       │       └── stats-card.component.ts        ← Card com ícone e valor
│   │       │
│   │       └── 🔀 pipes/
│   │           ├── currency-br.pipe.ts                ← R$ 0,00
│   │           ├── date-br.pipe.ts                    ← DD/MM/YYYY
│   │           ├── truncate.pipe.ts                   ← "texto..."
│   │           └── score-badge.pipe.ts                ← Quente/Morno/Frio
│   │
│   ├── index.html                        ← HTML raiz
│   └── main.ts                           ← Entry point
│
├── 📦 package.json
├── 📋 tsconfig.json                      ← TypeScript config
├── ⚙️ angular.json                       ← Angular config
└── 🔧 Arquivos de configuração

```

---

## 📊 Contagem de Arquivos por Camada

### Core Layer
```
Models:                    1 arquivo
  └── edital.model.ts

Services:                  4 arquivos
  ├── editais.service.ts         (API real)
  ├── editais.mock.ts            (API mock)
  ├── notification.service.ts
  └── loading.service.ts

Interceptors:              3 arquivos
  ├── http-error.interceptor.ts
  ├── loading.interceptor.ts
  └── mock.interceptor.ts

Total Core: 8 arquivos
```

### Shared Layer
```
Pipes:                     4 arquivos
  ├── currency-br.pipe.ts
  ├── date-br.pipe.ts
  ├── truncate.pipe.ts
  └── score-badge.pipe.ts

Components:                4 arquivos
  ├── loading-spinner.component.ts
  ├── confirm-dialog.component.ts
  ├── empty-state.component.ts
  └── stats-card.component.ts

Total Shared: 8 arquivos
```

### Features Layer
```
Layout:                    1 arquivo
  └── main-layout.component.ts

Dashboard:                 3 arquivos
  ├── dashboard.component.ts
  ├── dashboard.component.html
  └── dashboard.component.scss

Pipeline:                  3 arquivos
  ├── pipeline.component.ts
  ├── pipeline.component.html
  └── pipeline.component.scss

Editais List:              3 arquivos
  ├── editais-list.component.ts
  ├── editais-list.component.html
  └── editais-list.component.scss

Edital Details:            3 arquivos
  ├── edital-details.component.ts
  ├── edital-details.component.html
  └── edital-details.component.scss

Total Features: 13 arquivos
```

### Configuration & Documentation
```
Environments:              2 arquivos
  ├── environment.ts
  └── environment.prod.ts

App Root:                  5 arquivos
  ├── app.ts
  ├── app.html
  ├── app.scss
  ├── app.routes.ts
  └── app.config.ts

Documentation:             4 arquivos
  ├── QUICK_START.md
  ├── TESTING_GUIDE.md
  ├── API_INTEGRATION_GUIDE.md
  └── IMPLEMENTATION_SUMMARY.md

Other:                     2 arquivos
  ├── styles.scss
  └── FILE_STRUCTURE.md (este)

Total Config & Docs: 13 arquivos
```

### GRAND TOTAL
```
Total: 42 arquivos criados/modificados
  - Core:           8 arquivos
  - Shared:         8 arquivos
  - Features:      13 arquivos
  - Config & Docs:  4 + documentação
```

---

## 🔗 Dependências entre Arquivos

### Diagrama de Imports

```
app.ts
  ├── app.routes.ts
  └── app.config.ts
         ├── http-error.interceptor.ts
         │   └── notification.service.ts
         ├── loading.interceptor.ts
         │   └── loading.service.ts
         └── Material providers

main-layout.component.ts
  ├── Material: Toolbar, Sidenav, List, Icon, Button
  ├── Router: RouterOutlet, RouterLink, RouterLinkActive
  └── Layout (breakpoint responsive)

dashboard.component.ts
  ├── editais.service.ts (getStats)
  ├── Chart.js (ArcElement, Tooltip, Legend)
  ├── StatsCardComponent
  └── LoadingSpinnerComponent

pipeline.component.ts
  ├── editais.service.ts (getLeads)
  ├── CDK DragDrop
  ├── Pipes: CurrencyBrPipe, DateBrPipe, TruncatePipe
  └── Components: LoadingSpinner, EmptyState

editais-list.component.ts
  ├── editais.service.ts (getAll, delete, reprocessar)
  ├── Material DataTable, Paginator, Sort
  ├── Pipes: CurrencyBrPipe, DateBrPipe, TruncatePipe
  └── Components: LoadingSpinner, EmptyState

edital-details.component.ts
  ├── editais.service.ts (getById, delete)
  ├── ActivatedRoute, Router
  ├── Material Tabs
  └── Pipes: CurrencyBrPipe, DateBrPipe
```

---

## 📝 Tipos de Arquivo

### TypeScript (.ts)
```
23 arquivos .ts
  ├── Components:     13 (features + shared + layout)
  ├── Services:        4 (core)
  ├── Pipes:           4 (shared)
  ├── Interceptors:    3 (core)
  ├── Models:          1 (core)
  └── Configuration:   5 (app root)
```

### HTML Templates (.html)
```
9 arquivos .html
  ├── Features:    6 (dashboard, pipeline, editais list/details)
  ├── App Root:    1 (app.html)
  └── Utils:       2 (index.html, etc)
```

### SCSS Styles (.scss)
```
11 arquivos .scss
  ├── Features:     6 (dashboard, pipeline, editais)
  ├── Global:       1 (styles.scss)
  ├── App Root:     1 (app.scss)
  └── Utils:        3 (environment-specific)
```

### Documentation (.md)
```
4 arquivos .md
  ├── QUICK_START.md
  ├── TESTING_GUIDE.md
  ├── API_INTEGRATION_GUIDE.md
  └── IMPLEMENTATION_SUMMARY.md
```

---

## 🔀 Data Flow

```
User Action (Navigate)
        ↓
Router → Feature Component
        ↓
Service (Real or Mock)
        ↓
HTTP Interceptors
  ├── loadingInterceptor    (Mostra spinner)
  ├── mockInterceptor       (Se USE_MOCK_DATA = true)
  └── httpErrorInterceptor  (Trata erros)
        ↓
Response
        ↓
Signal atualizado
        ↓
Template renderiza
```

---

## 🎯 Como Navegar no Projeto

### Para adicionar uma nova página/feature:
1. Crie componente em `src/app/features/sua-feature/`
2. Adicione rota em `src/app/app.routes.ts`
3. Use serviços em `src/app/core/services/`
4. Reutilize components em `src/app/shared/`
5. Use pipes para formatação

### Para adicionar um novo serviço:
1. Crie em `src/app/core/services/`
2. Marque como `@Injectable({ providedIn: 'root' })`
3. Injete com `inject()` nos componentes

### Para adicionar um novo componente compartilhado:
1. Crie em `src/app/shared/components/seu-component/`
2. Exporte como `standalone: true`
3. Importe em qualquer lugar do projeto

### Para adicionar um novo pipe:
1. Crie em `src/app/shared/pipes/`
2. Implemente `PipeTransform`
3. Marque como `standalone: true`
4. Use em templates com `| nomePipe`

---

## 📦 Convenções de Nomenclatura

```
Componentes:           *.component.ts        (kebab-case em pasta)
                       *.component.html
                       *.component.scss

Serviços:              *.service.ts          (kebab-case)
                       *.mock.ts             (para mocks)

Pipes:                 *.pipe.ts             (kebab-case)

Interceptors:          *.interceptor.ts      (kebab-case)

Models/Interfaces:     *.model.ts            (kebab-case)
                       Interfaces: PascalCase
                       Enums: PascalCase

Pastas:                kebab-case
Classes:               PascalCase
Functions/Methods:     camelCase
Variables:             camelCase
Constants:             UPPER_SNAKE_CASE
```

---

## 🚀 Build Output

Após `npm run build`, você terá:

```
dist/licitacao_auto_angular/
  ├── index.html                (HTML de entrada)
  ├── main-HASH.js              (Bundle principal ~130 KB)
  ├── styles-HASH.css           (Estilos ~11 KB)
  ├── chunk-HASH.js × 7         (Chunks compartilhados)
  │
  └── chunk-NAME.js × 4         (Lazy chunks)
      ├── dashboard-component.js        (53 KB)
      ├── editais-list-component.js     (31 KB)
      ├── pipeline-component.js         (15 KB)
      └── edital-details-component.js   (11 KB)
```

---

## 💡 Dicas de Navegação

### Via IDE
- Use "Go to Definition" (Ctrl+Click) para navegar
- Use "Find References" (Shift+F12) para encontrar usages
- Use "Outline" para ver estrutura de arquivo

### Via Terminal
```bash
# Procurar por uma string
grep -r "nomeFuncao" src/

# Encontrar arquivo
find src/ -name "*component.ts"

# Ver estrutura
tree src/app/
```

### Via CLI Angular
```bash
# Gerar novo componente
ng generate component features/meu-componente

# Gerar novo serviço
ng generate service core/services/meu-servico

# Gerar novo pipe
ng generate pipe shared/pipes/meu-pipe
```

---

## ✅ Verificação Rápida

Para verificar se o projeto está OK:

```bash
# Build completo
npm run build
# Deve completar sem erros

# Listar arquivos
find src/app -type f | wc -l
# Deve ter ~40+ arquivos
```

---

**Última atualização:** 2024-02-06
**Estrutura estável:** ✅ Pronta para desenvolvimento
