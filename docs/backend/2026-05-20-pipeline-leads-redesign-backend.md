# Pipeline de Leads — Redesign: Mudanças Backend

**Data:** 2026-05-20
**Referência:** `docs/superpowers/specs/2026-05-20-pipeline-leads-redesign.md`

---

## Contexto

O frontend foi redesenhado para refletir o novo fluxo de qualificação de leads da Brasfort. O pipeline agora tem 5 etapas explícitas antes da criação do processo licitatório. As mudanças abaixo são necessárias para que o frontend funcione corretamente.

---

## 1. Enum `LeadStatus`

### Adicionar

```
APROVACAO_PRESIDENCIA
ESTUDO_VIABILIDADE
SEGUNDA_APROVACAO_PRESIDENCIA
```

### Remover (ou deprecar — verificar dados históricos)

```
EM_TRIAGEM
VERIFICANDO_REQ
```

> **Migração sugerida:** `EM_TRIAGEM` → `NOVO`, `VERIFICANDO_REQ` → `APROVACAO_PRESIDENCIA`

---

## 2. Serviço de Coleta — Status Inicial

Ao salvar um novo lead, usar:

- `NOVO` — quando bate keywords/modalidades configuradas
- `DESCARTADO` — quando não bate

O status `EM_TRIAGEM` **não deve mais ser usado** como status inicial.

---

## 3. Campo `observacao` em `AtualizarStatusRequest`

Tornar `observacao` **obrigatório** (`@NotBlank`) no endpoint:

```
PATCH /leads/{uuid}/status
```

O frontend sempre enviará o campo preenchido (mínimo 10 caracteres) a partir desta versão.

---

## 4. Trigger de Criação de Processo

**Sem alteração.** O `ProcessoLicitatorio` continua sendo criado quando `status = QUALIFICADO`.

O frontend setará `QUALIFICADO` quando o usuário aprovar na etapa `SEGUNDA_APROVACAO_PRESIDENCIA`.

---

## Novo Fluxo de Status

```
Coleta automática
       │
       ├── não bateu critério → DESCARTADO
       └── bateu critério     → NOVO
                                    │
                              analista move
                                    ↓
                         APROVACAO_PRESIDENCIA
                                    │
                              1ª aprovação
                                    ↓
                          ESTUDO_VIABILIDADE
                                    │
                         cotações + impugnações
                                    ↓
                    SEGUNDA_APROVACAO_PRESIDENCIA
                                    │
                              2ª aprovação
                                    ↓
                             QUALIFICADO → cria ProcessoLicitatorio
```
