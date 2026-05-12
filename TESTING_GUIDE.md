# Guia de Testes e Consumo da API

## 🚀 Como Rodar a Aplicação

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Setup

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm start

# A aplicação será disponibilizada em http://localhost:4200
```

## 🧪 Testando com Dados Mock (Sem Backend)

A aplicação inclui um serviço de mock completo para testes sem precisar de um backend real.

### Ativar Modo Mock

1. Abra o arquivo: `src/app/core/interceptors/mock.interceptor.ts`
2. Altere a linha 7 de:
   ```typescript
   export const USE_MOCK_DATA = false;
   ```
   para:
   ```typescript
   export const USE_MOCK_DATA = true;
   ```
3. Recarregue a aplicação no navegador

### Dados Mock Disponíveis

O serviço de mock fornece:

#### Editais
- 4 editais de exemplo com diferentes status (PROCESSADO, PENDENTE, ERRO)
- Valores estimados entre R$ 30.000 e R$ 150.000
- Diferentes modalidades (PREGÃO, CONCORRÊNCIA, etc.)

#### Leads
- 4 leads com scores variando de 35 a 85
- Categorias: Limpeza, Tecnologia, Segurança, Manutenção
- Valores estimados variados

#### Estatísticas
- Total: 4 editais
- Processados: 2
- Pendentes: 1
- Erros: 1
- Valor Total: R$ 305.000

### Endpoints Mockados

Todos os endpoints em `/api/editais` são interceptados:

```
GET    /api/editais           - Lista todos os editais
GET    /api/editais/:id       - Detalhes de um edital
GET    /api/editais/stats     - Estatísticas
GET    /api/editais/leads     - Lista de leads
GET    /api/editais/erros     - Lista de editais com erro
POST   /api/editais/processar - Simula processamento
DELETE /api/editais/:id       - Exclui um edital
```

## 🔌 Testando com Backend Real

Para usar a API real, certifique-se de:

1. **Backend rodando em `http://localhost:8080`**

2. **Modo mock desativado** (`USE_MOCK_DATA = false`)

3. **Estrutura de API esperada:**

```
GET /api/editais
- Response: EditalResponse[]

GET /api/editais/:id
- Response: EditalResponse

GET /api/editais/stats
- Response: {
    total: number,
    processados: number,
    pendentes: number,
    erros: number,
    valorTotal: number,
    ultimaExecucao?: string,
    proximaExecucao?: string
  }

GET /api/editais/leads?scoreMinimo=0
- Response: LeadResponse[]

POST /api/editais/processar
POST /api/editais/:id/reprocessar
POST /api/editais/reclassificar
DELETE /api/editais/:id
```

## 📊 Testando Cada Feature

### 1. Dashboard
- URL: `http://localhost:4200/dashboard`
- Verifica carregamento de estatísticas
- Exibe gráfico pizza com distribuição de status
- Cards com métricas principais

**Teste:**
1. Veja se os stats cards mostram números
2. Verifique se o gráfico renderiza corretamente
3. Clique no botão refresh para recarregar dados

### 2. Pipeline (Kanban)
- URL: `http://localhost:4200/pipeline`
- Displays leads em 3 colunas (Frio, Morno, Quente)
- Permite drag & drop entre colunas

**Teste:**
1. Veja os leads divididos por temperatura
2. Tente arrastar um card de uma coluna para outra
3. Observe a contagem de leads em cada coluna

### 3. Lista de Editais
- URL: `http://localhost:4200/editais`
- DataTable com sorting, filtro e paginação

**Teste:**
1. Digite na caixa de busca para filtrar
2. Clique nas colunas para ordenar
3. Navegue pelas páginas usando o paginador
4. Clique em uma linha para ver detalhes
5. Use o menu de ações (3 pontos) para reprocessar/excluir

### 4. Detalhes do Edital
- URL: `http://localhost:4200/editais/:id`
- Exibe informações em abas

**Teste:**
1. Volte para a lista
2. Clique no botão "Ver detalhes"
3. Verifique cada aba (Informações, Exigências, Histórico)
4. Teste os botões PDF, Fonte e Excluir

## 🔍 Verificando Requisições HTTP

### Usando DevTools do Navegador

1. Abra F12 (DevTools)
2. Vá para aba "Network"
3. Recarregue a página (Ctrl+Shift+R)
4. Filtre por "editais" para ver as chamadas HTTP

Você verá:
- `GET /api/editais` - Carregamento da lista
- `GET /api/editais/stats` - Carregamento das estatísticas
- `GET /api/editais/leads` - Carregamento dos leads

### Verificando Respostas

1. Clique em uma requisição
2. Vá para aba "Response"
3. Veja o JSON retornado

## 📈 Logs e Debug

### Console.log

Para adicionar debug na dashboard, por exemplo:

```typescript
loadDashboard() {
  this.loading.set(true);
  console.log('Carregando dashboard...');

  this.editaisService.getStats().subscribe({
    next: (stats) => {
      console.log('Stats recebidas:', stats);
      this.stats.set(stats);
      this.loading.set(false);
    },
    error: (err) => {
      console.error('Erro ao carregar stats:', err);
      this.loading.set(false);
    }
  });
}
```

### Network Errors

Se receber erro de conexão (ERR_CONNECTION_REFUSED):
- Backend não está rodando
- URL está incorreta (verifique `environment.ts`)
- Ativar modo mock para testes

## ✅ Checklist de Testes

- [ ] Dashboard carrega e exibe stats
- [ ] Gráfico pizza renderiza sem erros
- [ ] Pipeline exibe leads em 3 colunas
- [ ] Drag & drop funciona no pipeline
- [ ] Lista de editais carrega com paginação
- [ ] Filtro de busca funciona
- [ ] Ordenação por coluna funciona
- [ ] Clique na linha abre detalhes
- [ ] Menu de ações (3 pontos) funciona
- [ ] Aba de detalhes exibe informações corretas
- [ ] Botões PDF e Fonte funcionam
- [ ] Responsividade funciona em mobile
- [ ] Notificações (toast) aparecem em ações

## 🐛 Troubleshooting

### Erro: "pie" is not a registered controller
**Solução:** Já foi corrigido! O Chart.js agora registra o controlador de pie chart automaticamente.

### Erro: Cannot connect to localhost:8080
**Solução:** Ativar modo mock em `mock.interceptor.ts` ou iniciar o backend

### CSS não está carregando
**Solução:** Limpar cache (Ctrl+Shift+Del) ou fazer rebuild (`npm run build`)

### Aplicação travada ou lenta
**Solução:** Abrir DevTools (F12) e ver se há erros no console

## 📚 Estrutura de Pastas para Referência

```
src/app/
├── core/
│   ├── models/edital.model.ts
│   ├── services/
│   │   ├── editais.service.ts (API real)
│   │   ├── editais.mock.ts (Mock)
│   │   ├── notification.service.ts
│   │   └── loading.service.ts
│   └── interceptors/
│       ├── http-error.interceptor.ts
│       ├── loading.interceptor.ts
│       └── mock.interceptor.ts
├── features/
│   ├── dashboard/
│   ├── pipeline/
│   └── editais/
└── shared/
    ├── components/
    └── pipes/
```

## 🎯 Próximos Passos

1. **Conectar Backend Real**: Implemente os endpoints esperados
2. **Adicionar Autenticação**: JWT ou sessão
3. **Adicionar Mais Testes**: Unit tests com Vitest
4. **Melhorar UX**: Adicionar mais gráficos e filtros avançados
5. **Deploy**: Preparar para produção (CORS, headers, etc.)
