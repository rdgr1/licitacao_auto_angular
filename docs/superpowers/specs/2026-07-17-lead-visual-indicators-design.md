# Indicadores Visuais nos Cards de Lead (Score, Categoria, Status): Design Spec

**Data:** 2026-07-17
**Escopo:** Classificar todo lead (DODF, DOU e PNCP) na origem, expondo `leadScore` e `leadCategoriaPrincipal` no `Lead` (não só no `Edital`); corrigir e padronizar os indicadores visuais (borda de status, score, categoria) nos cards de `leads` e nos cards do kanban de `pipeline`; sempre exibir o paginator de leads.
**Fora de escopo:** Descarte automático de leads (categoria `DESCARTADO` vira só um alerta visual, não muda o status sozinha); modo escuro / remoção do background animado (spec separada); reclassificação em massa de leads já existentes (fica como follow-up manual, reaproveitando `reclassificarTodos`).
**Repos afetados:** `licitacao.automate` (backend) e `licitacao_auto_angular` (frontend).

---

## 1. Problema

Hoje `leadScore` e `leadCategoriaPrincipal` só existem na entidade `Edital` (`model/edital/Edital.java:134,138`), nunca em `Lead`. A classificação (`LeadClassificationService.classify()` → `ConfiguracaoAnaliseService.classify(Edital)`) só roda no fluxo do PNCP, logo após salvar o `Edital` (`PncpPersistService.salvarEditalComLead()`, linha 67). **Leads de DODF e DOU nunca são classificados** — são criados direto do texto da matéria, sem `Edital` (`DodfColetaController.toLead()`, `DouColetaController`).

Consequência no frontend: `Lead.leadScore` (`lead.model.ts:25`) nunca vem preenchido do `GET /leads`, então a condição `@if (lead.leadScore != null)` (`leads.component.html:481`) nunca é verdadeira — o donut de score nunca aparece. O mesmo vale pra qualquer indicador de categoria, que nem existe no modelo hoje.

Bugs adicionais já identificados no frontend, independentes do dado faltando:
- `leads.component.scss:439-443` usa nomes de status desatualizados (`NOVA`, `EM_TRIAGEM`, `VERIFICANDO_REQ`) que não batem com o enum atual (`NOVO`, `APROVACAO_PRESIDENCIA`, `ESTUDO_VIABILIDADE`, `SEGUNDA_APROVACAO_PRESIDENCIA`, `QUALIFICADO`, `DESCARTADO`) — 4 dos 6 status não têm cor de borda nenhuma.
- `pipeline.component.html:86` usa `(lead.leadScore ?? 0)`, que sempre cai no ramo "frio" (`var(--color-info)`) quando o score é nulo — pinta todo card como se tivesse score baixo, em vez de não aplicar cor nenhuma.
- `leads.component.html:529`: `[style.display]="totalElements() <= pageSize() ? 'none' : ''"` esconde o paginator sempre que a página atual cabe tudo — diferente do paginator de histórico (`historico-paginator`, sempre visível), gerando a sensação de que a paginação "sumiu".
- `ScoreBadgePipe` (`shared/pipes/score-badge.pipe.ts`) já existe com a lógica Quente/Morno/Frio, mas não é usado em lugar nenhum — a lógica está duplicada inline em `leads.component.html` e `pipeline.component.html`.

---

## 2. Backend (`licitacao.automate`)

### 2.1 Novo campo em `Lead`

`model/licitacao/Lead.java`: adicionar
```java
private Integer leadScore;
private String leadCategoriaPrincipal;
```
Sem migração necessária (`ddl-auto: update`, sem Flyway/Liquibase no projeto). Atualizar `Lead.toDto()` (linhas 80-98) para incluir os dois campos.

### 2.2 `LeadRecord` (DTO)

Adicionar `leadScore` (Integer) e `leadCategoriaPrincipal` (String) ao record.

### 2.3 Classificação central em `LeadServiceImpl.salvarSeNovo()`

`ConfiguracaoAnaliseService.classify(Edital edital)` é hoje fortemente acoplado a `Edital`. Extrair uma sobrecarga que recebe os campos crus já usados pelas regras de palavra-chave (`objeto/titulo`, `orgao`, `numero`/`tipo`):

```java
// assinatura nova
public Classificacao classify(String titulo, String orgao, String tipo, String numero);

// assinatura existente passa a delegar
public Classificacao classify(Edital edital) {
    return classify(edital.getObjeto(), edital.getOrgaoOrigem(), null, edital.getNumero());
}
```

Em `LeadServiceImpl.salvarSeNovo()` (linha 41, único ponto por onde passam leads de PNCP/DODF/DOU antes de serem persistidos): se o `Lead` recebido **ainda não tem** `leadScore` setado, chamar a nova sobrecarga com `titulo`, `orgao`, `tipo` do próprio lead e gravar `leadScore`/`leadCategoriaPrincipal` antes do `save()`.

O guard "se ainda não tem score" evita reclassificar o lead do PNCP: `PncpPersistService.criarLead()` (linha 123) já tem a classificação calculada (linha 67-70) ao criar o `Edital` — passa a copiar `leadScore`/`leadCategoriaPrincipal` do `Edital` recém-criado pro `Lead` antes de chamar `salvarSeNovo()`, que então pula a reclassificação.

DODF e DOU (`DodfColetaController.toLead()`, `DouColetaController`) não precisam de nenhuma mudança — o `Lead` que constroem chega em `salvarSeNovo()` sem score, e a classificação roda ali pela primeira vez.

### 2.4 Por que centralizar em `salvarSeNovo()` em vez de nos 3 controllers

Um único ponto de verdade evita divergência entre fontes (ex: alguém mexe na regra de classificação e esquece de atualizar um dos 3 lugares). `salvarSeNovo()` já é o choke point de persistência — é onde a regra de negócio "todo lead salvo tem uma classificação" faz mais sentido de viver.

---

## 3. Frontend (`licitacao_auto_angular`)

### 3.1 Modelo

`core/models/lead.model.ts`: `leadCategoriaPrincipal?: string` adicionado ao lado de `leadScore?: number` (já existe).

### 3.2 Reaproveitar `ScoreBadgePipe`

Trocar as ternárias inline em `leads.component.html:487-493` e `pipeline.component.html:86` por `{{ lead.leadScore | scoreBadge }}` (label + color já vem pronto do pipe). Import do pipe nos dois componentes standalone.

### 3.3 Corrigir bug de cor no pipeline (`pipeline.component.html:86`)

```html
[style.--score-color]="lead.leadScore != null ? (lead.leadScore | scoreBadge).color : null"
```
Quando `null`, a binding remove a custom property e o CSS já tem fallback pra cor da coluna (`border-left: 3px solid var(--score-color, var(--cc));`, `pipeline.component.scss:117`) — nenhuma mudança de CSS necessária aqui.

### 3.4 Corrigir CSS de status (`leads.component.scss:439-443`)

Atualizar os seletores para o enum atual, um por status:
```scss
&.status-border-NOVO                           { border-left: 3px solid #3B82F6; }
&.status-border-APROVACAO_PRESIDENCIA          { border-left: 3px solid #8B5CF6; }
&.status-border-ESTUDO_VIABILIDADE             { border-left: 3px solid var(--status-pendente); }
&.status-border-SEGUNDA_APROVACAO_PRESIDENCIA  { border-left: 3px solid #F97316; }
&.status-border-QUALIFICADO                    { border-left: 3px solid var(--brand-primary); }
&.status-border-DESCARTADO                     { border-left: 3px solid #CBD5E1; opacity: 0.7; }
```
Mesma correção de nomenclatura não é necessária no pipeline (cada coluna do kanban já representa um status, a cor vem de `col.color`/`col.accent`).

### 3.5 Chip de categoria

Novo pipe `shared/pipes/lead-categoria.pipe.ts`, no mesmo formato do `ScoreBadgePipe`:
```typescript
export interface CategoriaBadge { label: string; color: string; hidden: boolean; }

const MAP: Record<string, { label: string; color: string }> = {
  VIGILANCIA:    { label: 'Vigilância',   color: '#8B5CF6' },
  LIMPEZA:       { label: 'Limpeza',      color: '#0EA5E9' },
  COPEIRAGEM:    { label: 'Copeiragem',   color: '#F59E0B' },
  MAO_DE_OBRA:   { label: 'Mão de Obra',  color: '#14B8A6' },
  BRIGADA:       { label: 'Brigada',      color: '#EF4444' },
  DESCARTADO:    { label: 'Sugestão: descartar', color: '#94A3B8' },
};
// SEM_CATEGORIA e valores desconhecidos → hidden: true (nenhum chip mostrado)
```
Chip renderizado em `.lc-meta` (leads) e `.kcard-meta` (pipeline), ao lado do badge de fonte — some quando `hidden`. Quando a categoria é `DESCARTADO`, o chip usa cor neutra (cinza) e é só informativo: **não altera `lead.status`** — o lead continua em qualquer status até o analista descartar manualmente pelo botão já existente (`atualizarStatus`).

### 3.6 Paginator sempre visível

`leads.component.html:529`: remover o binding `[style.display]`, deixando o `<mat-paginator>` sempre renderizado (igual ao `historico-paginator`).

---

## 4. Fluxo de dados (exemplo: lead novo do DODF)

1. `DodfColetaController` monta um `Lead` a partir da matéria coletada (sem `Edital`, sem score).
2. `LeadServiceImpl.salvarSeNovo()` recebe o lead, vê `leadScore == null`, chama `configuracaoAnaliseService.classify(titulo, orgao, tipo, null)`.
3. Resultado (`score`, `categoriaPrincipal`) é gravado no `Lead` antes do `save()`.
4. `GET /leads` retorna o `LeadRecord` já com `leadScore` e `leadCategoriaPrincipal` preenchidos.
5. `leads.component.html` renderiza o donut (via `ScoreBadgePipe`) e o chip de categoria; se `categoriaPrincipal === 'DESCARTADO'`, mostra o chip cinza "Sugestão: descartar" sem tocar no `status`.

---

## 5. Testes

- Backend: unitário de `ConfiguracaoAnaliseService.classify(String, String, String, String)` cobrindo os mesmos casos já testados pra `classify(Edital)` (reaproveitar fixtures existentes).
- Backend: unitário de `LeadServiceImpl.salvarSeNovo()` — lead sem score chega classificado; lead que já chega com score (caso PNCP) não é reclassificado (spy/verify no `classify()`).
- Backend: smoke test manual — coletar um DODF e um DOU, conferir via `GET /leads` que `leadScore`/`leadCategoriaPrincipal` vêm preenchidos.
- Frontend: unitário do `LeadCategoriaPipe` — mapeamento correto, `SEM_CATEGORIA`/valor desconhecido → `hidden: true`.
- Frontend: snapshot/smoke do card de lead e do `kcard` do pipeline com `leadScore` presente, ausente, e `leadCategoriaPrincipal = 'DESCARTADO'`.
- Manual: cada uma das 6 abas de status em `leads.component` mostra uma cor de borda distinta; paginator visível mesmo com poucos leads.

---

## 6. Fora de escopo / follow-ups

- Reclassificar leads já existentes no banco (endpoint/rotina batch separada, reaproveitando o padrão de `reclassificarTodos`).
- Automatizar descarte quando `categoriaPrincipal === 'DESCARTADO'` (decisão explícita do usuário: manter humano no loop por enquanto).
- Exibir score/categoria em outras telas (dashboard, editais) — fora do pedido atual (cards de leads e pipeline).
