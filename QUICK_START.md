# Quick Start Guide - Sistema CRM de Licitações

## ⚡ Começar em 5 Minutos

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Ativar Modo Mock (Sem Backend)

Abra `src/app/core/interceptors/mock.interceptor.ts` e altere:

```typescript
// De:
export const USE_MOCK_DATA = false;

// Para:
export const USE_MOCK_DATA = true;
```

### 3️⃣ Rodar a Aplicação
```bash
npm start
```

A aplicação abrirá em `http://localhost:4200`

### 4️⃣ Explorar Features

| Feature | URL | Descrição |
|---------|-----|-----------|
| **Dashboard** | `/dashboard` | KPIs e gráficos |
| **Pipeline** | `/pipeline` | Kanban com leads |
| **Editais** | `/editais` | DataTable com busca |
| **Detalhes** | `/editais/:id` | Informações completas |

---

## 📋 Dados Mock Inclusos

### Estatísticas
```
Total: 4 editais
✅ Processados: 2
⏳ Pendentes: 1
❌ Erros: 1
Valor Total: R$ 305.000,00
```

### Exemplo de Edital
```json
{
  "numero": "2024/001",
  "objeto": "Fornecimento de material de limpeza",
  "modalidade": "PREGÃO ELETRÔNICO",
  "valorEstimado": 50000,
  "dataAbertura": "2024-02-01",
  "status": "PROCESSADO"
}
```

---

## 🔗 Conectar com Backend Real

1. **Desativar Mock**: Volte `USE_MOCK_DATA = false` em `mock.interceptor.ts`

2. **Verificar URL API**: Abra `src/environments/environment.ts`
   ```typescript
   apiUrl: 'http://localhost:8080/api'  // Ajuste conforme necessário
   ```

3. **Iniciar Backend**: Certifique-se que está rodando em `http://localhost:8080`

---

## 📱 Funcionalidades Implementadas

✅ **Dashboard**
- Stats cards com métricas
- Gráfico pizza (Chart.js)
- Responsivo em mobile

✅ **Pipeline Kanban**
- 3 colunas (Frio/Morno/Quente)
- Drag & drop entre colunas
- Contadores por coluna

✅ **Lista de Editais**
- DataTable Material
- Filtro por texto
- Ordenação por coluna
- Paginação (10/25/50/100 itens)
- Menu de ações

✅ **Detalhes do Edital**
- 3 abas (Info, Exigências, Histórico)
- Botões para PDF e fonte
- Ação de exclusão

---

## 🛠️ Tecnologias

| Tech | Versão | Propósito |
|------|--------|----------|
| Angular | 21.1 | Framework |
| Material Design | 21.1 | UI Components |
| Chart.js | 4.5 | Gráficos |
| RxJS | 7.8 | Reatividade |
| TypeScript | 5.9 | Tipagem |

---

## 🎨 Design System

**Cores:**
- 🔵 Primária: Azure
- 🟦 Terciária: Blue
- 🟢 Sucesso: #4caf50
- 🟠 Aviso: #ff9800
- 🔴 Erro: #f44336

**Responsividade:**
- Desktop: 1200px+
- Tablet: 600px-1200px
- Mobile: <600px

---

## 🐛 Se Houver Erros

### Erro no Console: "pie is not a registered controller"
✅ **Já foi corrigido!** Chart.js está configurado corretamente.

### Erro: "Cannot connect to localhost:8080"
👉 Ative o modo mock em `mock.interceptor.ts`

### Aplicação não carrega
1. Limpe o cache: `Ctrl+Shift+Del`
2. Recarregue: `Ctrl+Shift+R`
3. Veja console (F12) para erros

---

## 📚 Próximas Etapas

1. ✅ Setup concluído
2. 🧪 Teste as features com dados mock
3. 🔌 Implemente seu backend
4. 🔐 Adicione autenticação
5. 📝 Customize conforme necessário

---

## 📞 Suporte

Consulte [TESTING_GUIDE.md](./TESTING_GUIDE.md) para:
- Testes detalhados de cada feature
- Verificação de requisições HTTP
- Troubleshooting avançado
- Estrutura de arquivos

---

**Pronto para começar? Execute:** `npm start`
