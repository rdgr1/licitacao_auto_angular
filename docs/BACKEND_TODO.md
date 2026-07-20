# Pendências de backend (licitacao.automate)

Lista de trabalho que ainda depende do backend, mantida separada porque o repositório
`licitacao.automate` tem outra sessão com mudanças não commitadas em andamento — evita
mexer lá até essas pendências serem priorizadas.

## Indicadores visuais de leads (score/categoria) — `2026-07-17-lead-visual-indicators-plan.md`

Status: **as 3 tasks de backend já foram implementadas e commitadas** (`89a79ab`, `c866c74`, `54e95da`
em `licitacao.automate`, branch `main`). Todo lead novo (DODF/DOU/PNCP) já sai classificado.

Pendência restante (não crítica, documentada como follow-up no próprio spec):

- **Reclassificar leads já existentes no banco** — os leads criados antes desta mudança
  ficam sem `leadScore`/`leadCategoriaPrincipal` (`null`). Existe um endpoint/rotina
  batch similar (`EditalServiceImpl.reclassificarTodos()`) que pode servir de referência
  para um equivalente em `Lead`. Sem isso, leads antigos simplesmente não mostram o
  score/categoria nos cards (o frontend já trata `null` graciosamente — não quebra nada,
  só fica sem o indicador).

## Modo escuro / remoção do background — `2026-07-17-dark-mode-and-background-removal-plan.md`

Nenhuma pendência de backend — é 100% frontend.

## Filtro de fonte em Leads (bug reportado direto, fora do spec escrito)

Nenhuma pendência de backend — `GET /leads` já aceita `fonte` como query param
(`LeadController`, `LeadServiceImpl.listarPorFonte`); o frontend só não estava usando.

## PENDENTE — Paginator de editais trava/buga com 500+ registros

Reportado pelo usuário: ao abrir a lista de Editais (`editais-list.component`), com o
banco tendo mais de ~500 editais, o paginator "buga e trava". Investigação parada por
custo de sessão antes de confirmar a causa — próxima sessão deve:

1. Checar `EditalController.java:129` (`GET /editais/stats`, chamado junto com
   `GET /editais` toda vez que a lista abre, em `editais-list.component.ts:110-120`) —
   ver se essa query de estatísticas faz agregação/scan sem índice adequado sobre a
   tabela `editais`, ficando lenta o suficiente pra parecer "travado" com volume alto.
2. Confirmar se o problema é ainda perceptível mesmo depois do fix do
   `pageNormalizeInterceptor` (commit `f0baef8`, licitacao_auto_angular) — esse fix já
   resolveu o "0 de 0" genérico, mas o usuário relatou isso *depois* desse commit, então
   pode ser um problema diferente (performance, não formato de resposta).
3. `dataSource.filter` (busca client-side, `editais-list.component.ts:148-163`) só filtra
   a página atual (~25-100 itens) — não é a causa do travamento com 500+, mas é uma
   inconsistência relacionada (paginator mostra total do servidor, tabela mostra menos
   linhas se a busca estiver ativa) que também vale revisar na mesma passada.

## PENDENTE — Endpoint `/users/me/preferences` não existe no backend

Reportado pelo usuário: log do backend mostrando
`NoResourceFoundException: No static resource users/me/preferences`. Confirmado no código:
não existe nenhum `@RequestMapping` sob `/users` em `licitacao.automate` (levantei todos os
controllers — auth, leads, editais, dodf, dou, pncp, cotacao, fornecedores, processos — nenhum
cobre `/users`).

O frontend (`user-preferences.service.ts:24,32`) chama `GET`/`PATCH /users/me/preferences`
toda vez que `configuracoes.component.ts` carrega (linha 422) ou salva (linha 467)
preferências. Como o `catchError` de ambos os métodos cai silenciosamente pro
`localStorage` (chave `lf_user_prefs`), não há erro visível pro usuário — mas:

- Preferências nunca são persistidas no servidor, só no navegador local (perdidas ao trocar
  de máquina/navegador ou limpar storage).
- Todo acesso à tela de Configurações gera um `NoResourceFoundException` no log do backend.

Precisa: criar `UserController` (ou equivalente) com `GET /users/me/preferences` e
`PATCH /users/me/preferences`, persistindo o shape de `UserPreferences`
(`user-preferences.model.ts`): `notifNovoLead: boolean`, `notifBuscaConcluida: boolean`,
`notifScoreMinimo: number`, `buscaFontesDefault: string[]`,
`buscaModoDataDefault: 'single' | 'range'`, `buscaPeriodoDias: number`.
