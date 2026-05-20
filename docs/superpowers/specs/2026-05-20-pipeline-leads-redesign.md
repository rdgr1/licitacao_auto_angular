# Pipeline de Leads — Redesign

**Data:** 2026-05-20
**Status:** Aprovado

---

## Contexto

A pipeline de qualificação de leads passa por uma reestruturação para refletir o processo real de negócio da Brasfort. O fluxo agora começa com a coleta automática de editais classificados por critério, passa por duas aprovações da presidência com uma etapa de estudo e viabilidade no meio, e termina criando um processo licitatório quando aprovado.

---

## Novo Fluxo de Colunas

```
Coleta automática
       │
       ├── não bateu critério → DESCARTADO (coluna "Descarte")
       └── bateu critério     → NOVO       (coluna "Novos Leads")
                                    │
                              analista move
                                    ↓
                         APROVACAO_PRESIDENCIA
                         (coluna "Aprov. Presidência")
                                    │
                              1ª aprovação
                                    ↓
                          ESTUDO_VIABILIDADE
                         (coluna "Estudo e Viabilidade")
                                    │
                         cotações + impugnações
                                    ↓
                    SEGUNDA_APROVACAO_PRESIDENCIA
                    (coluna "2ª Aprov. Presidência")
                                    │
                              2ª aprovação
                                    ↓
                             QUALIFICADO  →  cria ProcessoLicitatorio
                          (sai da pipeline de qualificação)
```

---

## Status

### Novos (frontend + backend)

| Status | Label na UI | Descrição |
|--------|------------|-----------|
| `DESCARTADO` | Descarte | Já existia; agora é a primeira coluna |
| `NOVO` | Novos Leads | Já existia; agora é a segunda coluna |
| `APROVACAO_PRESIDENCIA` | Aprov. Presidência | **Novo** |
| `ESTUDO_VIABILIDADE` | Estudo e Viabilidade | **Novo** |
| `SEGUNDA_APROVACAO_PRESIDENCIA` | 2ª Aprov. Presidência | **Novo** |
| `QUALIFICADO` | — | Mantido; gatilho de criação de processo; não exibido como coluna |

### Removidos

- `EM_TRIAGEM`
- `VERIFICANDO_REQ`

---

## Componentes Modificados

### `lead.model.ts`

```typescript
export type LeadStatus =
  | 'DESCARTADO'
  | 'NOVO'
  | 'APROVACAO_PRESIDENCIA'
  | 'ESTUDO_VIABILIDADE'
  | 'SEGUNDA_APROVACAO_PRESIDENCIA'
  | 'QUALIFICADO';

export interface AtualizarStatusRequest {
  status: LeadStatus;
  revisadoPor: string;
  observacao: string; // obrigatório (era opcional)
}
```

### `pipeline.component.ts`

Colunas da pipeline de qualificação (`qualColumns`):

```
1. DESCARTADO          — "Descarte"              — icon: block
2. NOVO                — "Novos Leads"           — icon: inbox
3. APROVACAO_PRESIDENCIA — "Aprov. Presidência"  — icon: how_to_reg
4. ESTUDO_VIABILIDADE  — "Estudo e Viabilidade"  — icon: science
5. SEGUNDA_APROVACAO_PRESIDENCIA — "2ª Aprov. Presidência" — icon: verified_user
```

**Drag-and-drop com justificativa obrigatória:**
- Ao soltar um card em coluna diferente, o item retorna à posição original visualmente
- Abre `JustificativaDialogComponent` com o nome da coluna destino
- Confirmado → chama API → aplica transferência visual
- Cancelado → nenhuma ação

### `JustificativaDialogComponent` (novo)

Componente standalone `MatDialog` reutilizável:

**Input data:**
```typescript
interface JustificativaDialogData {
  titulo: string;       // "Mover para Aprov. Presidência"
  placeholder?: string; // texto de ajuda no textarea
}
```

**Output:** `string` (justificativa) ou `undefined` (cancelado)

**UI:**
- Título dinâmico
- Textarea obrigatória, mínimo 10 caracteres
- Contador de caracteres visível
- Botões: "Cancelar" (mat-button) / "Confirmar" (mat-flat-button, cor primária)
- Botão Confirmar desabilitado se campo inválido

### `lead-detalhe-dialog.component.ts`

Ações por status:

| Status | Botões |
|--------|--------|
| `DESCARTADO` | Mover para Novos Leads |
| `NOVO` | Mover para Aprov. Presidência · Descartar |
| `APROVACAO_PRESIDENCIA` | Mover para Estudo e Viabilidade · Descartar |
| `ESTUDO_VIABILIDADE` | Impugnar · Cotação · Mover para 2ª Aprovação · Descartar |
| `SEGUNDA_APROVACAO_PRESIDENCIA` | Aprovar (→ cria processo) · Descartar |

Cada ação abre `JustificativaDialogComponent` antes de chamar a API.
O botão "Aprovar" na 2ª Aprovação seta status `QUALIFICADO`, que dispara a criação do processo no backend.
Os botões Impugnar e Cotação navegam para `/impugnacao` e `/cotacao/itens` respectivamente (mesmo comportamento do dialog de processo).

---

## Mudanças Necessárias no Backend

> Este arquivo deve ser compartilhado com o time de backend.

### 1. Enum `LeadStatus`

Adicionar os novos valores:
```
APROVACAO_PRESIDENCIA
ESTUDO_VIABILIDADE
SEGUNDA_APROVACAO_PRESIDENCIA
```

Remover (ou deprecar — verificar se há dados históricos):
```
EM_TRIAGEM
VERIFICANDO_REQ
```

### 2. Serviço de Coleta

A classificação inicial ao salvar um lead novo deve usar:
- `NOVO` — quando o lead bate as keywords/modalidades configuradas
- `DESCARTADO` — quando não bate

O status `EM_TRIAGEM` não deve mais ser usado como status inicial.

### 3. Trigger de Criação de Processo

Não muda. O `ProcessoLicitatorio` continua sendo criado quando `status = QUALIFICADO`.
O frontend setará `QUALIFICADO` quando o usuário aprovar na etapa `SEGUNDA_APROVACAO_PRESIDENCIA`.

### 4. `AtualizarStatusRequest` — campo `observacao`

Recomendado tornar `observacao` obrigatório (`@NotBlank`) no backend também, já que o frontend sempre enviará o campo preenchido a partir desta versão.

Endpoint afetado: `PATCH /leads/{uuid}/status`

### 5. Migrações de Dados

Se houver leads com status `EM_TRIAGEM` ou `VERIFICANDO_REQ` em produção, definir estratégia de migração:
- Sugestão: `EM_TRIAGEM` → `NOVO`, `VERIFICANDO_REQ` → `APROVACAO_PRESIDENCIA`

---

## Fora do Escopo (esta versão)

- Histórico de transições (`LeadHistorico`) — previsto para versão futura
- Notificações por e-mail nas aprovações
- Permissões por role (quem pode aprovar)
