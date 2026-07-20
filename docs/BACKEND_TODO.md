# Pendências de backend (licitacao.automate)

Lista de trabalho que ainda depende do backend, mantida separada porque o repositório
`licitacao.automate` tem outra sessão com mudanças não commitadas em andamento — evita
mexer lá até essas pendências serem priorizadas.

## PENDENTE — Leads do PNCP com categoria DESCARTADO caem na coluna errada do Pipeline

Reportado pelo usuário: leads classificados como categoria "Descartado" pela IA aparecem na
coluna "Novos Leads" do Pipeline em vez da coluna "Descarte". Causa raiz confirmada lendo o
código (não é bug de frontend — `pipeline.component.ts` já distribui as colunas corretamente
com base em `lead.status`, mas o `status` persistido está errado pra essa origem de lead):

- `Lead.java:50` — o campo `status` tem default `StatusLead.NOVO` no nível da entidade JPA.
- `LeadServiceImpl.classificar()` (usado por `salvarSeNovo()`, caminho dos leads de DODF/DOU)
  sincroniza certo: `if ("DESCARTADO".equals(classification.categoriaPrincipal())) lead.setStatus(StatusLead.DESCARTADO);`
- `PncpPersistService.criarLead()` (caminho dos leads originados de editais do PNCP) copia
  `leadScore`/`leadCategoriaPrincipal` do edital já classificado (linhas 165-166), **mas nunca
  seta `status`** — então todo lead PNCP fica com `status = NOVO` (o default), mesmo quando
  `leadCategoriaPrincipal = "DESCARTADO"`.

Correção sugerida: em `PncpPersistService.criarLead()`, logo após
`lead.setLeadCategoriaPrincipal(edital.getLeadCategoriaPrincipal());`, adicionar a mesma
sincronização já usada em `LeadServiceImpl.classificar()`:
```java
if ("DESCARTADO".equals(edital.getLeadCategoriaPrincipal())) {
    lead.setStatus(StatusLead.DESCARTADO);
}
```

**Fora do escopo desse bug** (confirmado, não mexer): `EditalServiceImpl.promoverParaLead()`
também cria `Lead` sem setar `status` (fica `NOVO` por default), mas isso é **intencional** —
é o fluxo de promoção manual (item 14 do changelog, tela de Auditoria de Classificação), onde
o usuário está deliberadamente revertendo uma classificação de REJEITADO; não deve virar
DESCARTADO automaticamente.

**Pedido (usuário, 2026-07-20): resolver agora.** Precisa de duas partes:

1. **Correção de código** (já detalhada acima) — em `PncpPersistService.criarLead()`, sincronizar
   `status = DESCARTADO` quando `leadCategoriaPrincipal = "DESCARTADO"`, igual
   `LeadServiceImpl.classificar()` já faz pro caminho DODF/DOU.
2. **Backfill dos leads já persistidos** — a correção de código só previne leads *novos*; os que
   já estão no banco com `leadCategoriaPrincipal = 'DESCARTADO'` e `status != 'DESCARTADO'`
   continuam errados até alguém corrigir os dados existentes. Sugestão: uma rotina batch nos
   moldes de `LeadServiceImpl.reclassificarSemScore()` (mesmo padrão já existe no código), mas
   com escopo diferente — não é sobre `leadScore IS NULL`, é
   `WHERE lead_categoria_principal = 'DESCARTADO' AND status <> 'DESCARTADO'` — e a ação é só
   `setStatus(DESCARTADO)` direto (não precisa reclassificar, a categoria já está certa, só o
   status que nunca foi sincronizado). Pode ser um endpoint novo (`POST /leads/corrigir-status-descartado`
   ou similar) ou um script de migração one-off — o que for mais rápido de rodar uma vez.

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
  **Confirmado pelo backend (2026-07-20):** o endpoint já existe (`POST /leads/reclassificar`
  → `LeadServiceImpl.reclassificarSemScore()`) e já reusa `classificar()`, então também
  sincroniza `status = DESCARTADO` quando aplicável — só que o escopo é `leadScore IS NULL`,
  não cobre o bug do item acima (leads PNCP com score/categoria já setados, mas status errado).

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

**Atualização (2026-07-20) — descartado como causa de backend.** O backend investigou a fundo
e concluiu: 500 linhas é trivial pro Postgres processar/ordenar, com ou sem índice — nada no
caminho do backend (`/editais`, `/editais/stats`) explica um "travamento" nesse volume. Não é
esse repo que está causando. Próxima investigação precisa ser 100% no lado Angular:
`MatTableDataSource`, `MatPaginator`, change detection do `EditaisListComponent` — ver item 3
acima (`dataSource.filter` só filtra a página atual) como ponto de partida mais provável.

**Achado à parte, confirmado como real pelo backend: busca textual "cega" a acento.**
`searchByTexto` (`GET /editais/search`) só compara 2 campos (`numero`, `objeto`), `LIKE`
case-insensitive via `lower()`, mas **sem normalizar acento** — buscar "vigilancia" (sem
acento) não acha "Vigilância" no banco, porque `lower()` só troca caixa, não remove acentuação.
Precisa de correção no backend (ex: extensão `unaccent` do Postgres na query, ou normalizar
a string em Java antes de montar o `LIKE`) — não é algo que o frontend consiga contornar.

## RESOLVIDO — Endpoint `/users/me/preferences` não existia no backend

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

**Atualização (2026-07-20, via `docs/frontend-changelog.md` item 20):** o próprio agente de
backend confirmou que já existem `BuscaPrefs` e `NotificaoPrefs` no código, ligados 1:1 em
`UserModel` — só nunca foram expostos via HTTP. Ou seja, o formato real do backend não é um
endpoint único (`/users/me/preferences`) como o frontend assumiu, e sim **dois recursos
separados**: `BuscaPrefs` (fontes padrão de busca, data única vs período, período em dias) e
`NotificaoPrefs` (`novoLead`, `buscaConcluida`, `score`). O backend sugeriu
`GET`/`PUT` em `/auth/me/busca-prefs` e `/auth/me/notificacao-prefs`.

Decisão (usuário, 2026-07-20): pedir pro backend implementar esses dois endpoints antes de
qualquer mudança no frontend — `user-preferences.service.ts` continua como está (fallback
`localStorage`) até isso existir. Quando implementado, o frontend provavelmente precisa
dividir `UserPreferences` (hoje um objeto único) em duas chamadas/modelos espelhando
`BuscaPrefs`/`NotificaoPrefs`, em vez de só trocar a URL.

**Resolvido (2026-07-20):** backend implementou `GET`/`PUT /auth/me/busca-prefs`
(`BuscaPrefsDto`) e `GET`/`PUT /auth/me/notificacao-prefs` (`NotificaoPrefsDto`), sempre
escopados ao usuário logado via JWT. `GET` sem prefs salvas devolve os defaults da entidade,
sem persistir nada (só grava no primeiro `PUT`, que é substituição completa). Frontend
integrado: `user-preferences.model.ts`, `user-preferences.service.ts` (agora dois recursos
`busca`/`notificacao`, não mais um objeto único) e `configuracoes.component.ts` (abas
Notificações/Busca) atualizados para os dois endpoints reais.

Atenção — `fontesPadrao`/`dataBuscaPadrao`/`periodoDias` (`BuscaPrefs`) ainda não são lidos
por nenhum fluxo de coleta real (só preferência salva), e `NotificaoPrefs.buscaConcluida`
ainda não dispara notificação nenhuma (só `novoLead`+`score` estão de fato ligados, ver item
19 do changelog). A UI já deixa isso avisado (`.not-wired`/`.not-wired-banner` em
`configuracoes.component.ts`) — não prometer esse comportamento até o backend religar.

## RESOLVIDO — `/users/me` e `/users/me/password` também não existiam no backend

Descoberto ao integrar o item acima e confirmado por log real do usuário
(`NoResourceFoundException: No static resource users/me`): `configuracoes.component.ts` e
`tour.service.ts` tinham 4 chamadas para endpoints que nunca existiram no `AuthController`
real (que só tem `/auth/me`, `/auth/{userId}/update-password`, `/auth/{userId}/update-dados`
— sem nenhum mapeamento sob `/users`):

- `salvarPerfil()` → `PATCH /users/me` com `{name, funcao, company}`
- `trocarSenha()` → `PATCH /users/me/password` com `{currentPassword, newPassword}`
- `reiniciarTour()` → `PATCH /users/me` com `{tourCompleted: false}`
- `TourService.encerrar()` → `PATCH /users/me` com `{tourCompleted: true}`

**Corrigido (2026-07-20):**
- `salvarPerfil()` agora chama `PUT /auth/{userId}/update-dados` com
  `{username, funcao, empresa}` (view `UserPut` de `UserRecordDto` — nomes de campo reais,
  diferentes do que o frontend enviava antes). Sucesso agora também atualiza o cache local do
  usuário (`AuthService.updateCachedProfile()`, novo método) para refletir nome/função sem
  precisar relogar.
- `trocarSenha()` agora chama `PUT /auth/{userId}/update-password` com
  `{password: senhaNova, oldpassword: senhaAtual}` (view `PasswordPut`). Confirmado no
  `UserServiceImpl.updatePassword()`: `oldpassword` é validado contra a senha atual, `password`
  vira a nova senha; erro de senha atual incorreta continua 400 (`IllegalArgumentException` →
  `GlobalExceptionHandler`), o tratamento existente no front já cobria isso certo.
- `reiniciarTour()` e `TourService.encerrar()` — `tourCompleted` não existe em nenhum DTO do
  backend (nem em `UserRecordDto`, nem em nenhum outro). O controle sempre foi 100% via
  `localStorage` (`lf_tour_done`, lido em `TourService.deveMostrar()`) — removi as duas
  chamadas HTTP mortas em vez de inventar um endpoint que não tem contrapartida no domínio.

**Atualização (2026-07-20) — risco encontrado pelo backend (CodeRabbit) nesse mesmo caminho:**
`alterarDadosPessoais()` (usado por `salvarPerfil()`) chama `.isBlank()` em
`username`/`funcao`/`empresa` sem checar `null` antes — se o frontend mandar `null` em vez de
string vazia em qualquer um desses 3 campos, quebra com NPE → 500 (não é um erro tratável, tipo
400). Mitigado no frontend por ora: `salvarPerfil()` agora manda `?? ''` nos 3 campos
(`configuracoes.component.ts`). **Ainda precisa do fix no backend** (checar null antes do
`.isBlank()`, ou trocar por `StringUtils.hasText()`/equivalente) — o mitigation do frontend é
defesa em profundidade, não substitui a correção real.

## RESOLVIDO — Autorização por role (ADMIN) não existia em lugar nenhum do backend

A tela de Auditoria de Classificação (`GET /editais/classificacoes`, `POST /editais/{id}/promover`)
virou uma aba restrita a admin no frontend (`configuracoes.component.ts`, `@if (auth.isAdmin())`
escondendo a aba pra quem não é admin), mas o backend não enforçava nada — qualquer usuário
autenticado conseguia chamar os 2 endpoints direto (curl/devtools).

**Corrigido (2026-07-20):** confirmado que não havia mecanismo de autorização por role em lugar
nenhum (`@EnableWebSecurity` sozinho, sem `@EnableMethodSecurity` — `@PreAuthorize` seria
ignorado em silêncio se só fosse anotado sem isso). Adicionado `@EnableMethodSecurity` +
`MethodSecurityExpressionHandler` (usando o `RoleHierarchy` já existente, pra `@PreAuthorize`
respeitar a mesma hierarquia `ADMIN implies USER,EMPLOYEE,PRESIDENT` já configurada) em
`SecurityConfig`, e `@PreAuthorize("hasRole('ADMIN')")` em `GET /editais/classificacoes` e
`POST /editais/{id}/promover` (`EditalController`). Chamada de não-admin agora recebe **403**
de verdade, não só esconde a aba na UI.

## RESOLVIDO — Coleta PNCP manual por lead não aparecia na Rastreabilidade (histórico de coleta)

O botão "Atualizar editais" no detalhe do lead (`POST /leads/{id}/coletar-pncp`, item 21 do
changelog) não gravava nada em `TB_COLETA_LOG`, então não aparecia na seção "Rastreabilidade"
da tela de Leads, diferente das coletas agendadas de DODF/DOU/PNCP.

**Corrigido (2026-07-20):** `PncpColetaPorLeadWorker.executar()` agora chama
`ColetaLogService.registrarSucesso("PNCP-LEAD", dataPublicacaoLead, inicio, totalBrutos, salvos, duplicados)`
ao concluir, ou `registrarErro("PNCP-LEAD", dataPublicacaoLead, inicio, mensagemErro)` em caso de
falha — mesmo padrão já usado por `DodfColetaController`/`DouColetaController`. `fonte =
"PNCP-LEAD"` (9 chars, cabe no `@Column(length = 10)`) pra distinguir de coleta agendada
("PNCP") na tabela de histórico.

## RESOLVIDO — Busca textual de editais era cega a acento

`SpecificationTemplate.textContains` só fazia `lower()`, sem remover diacríticos — buscar
"vigilancia" não achava "Vigilância" no banco.

**Corrigido (2026-07-20):** normaliza o termo buscado em Java (mesmo padrão `Normalizer` NFD +
remoção de diacríticos já usado pelos matchers de keyword DODF/DOU/PNCP) e usa `unaccent()` do
Postgres nos dois campos (`numero`, `objeto`) pra normalizar também o valor armazenado, na
própria query. A extensão `unaccent` não estava habilitada no banco de dev — foi criada
(`CREATE EXTENSION IF NOT EXISTS unaccent;`, operação aditiva/reversível, sem tocar em tabela ou
dado nenhum). Testado com TDD (teste falhando confirmado antes do fix, passando depois).

## RESOLVIDO — Vínculo Lead↔Edital (PNCP) super-casava nomes genéricos de órgão

`PncpLeadVinculadorService.radicaisDoOrgao` expandia sinônimos curados (`SecretariaDF`/
`MinisterioFederal.fromTextoExtenso`) sobre qualquer nome de órgão em texto livre, mesmo sem
qualificador de DF/federal — um lead com órgão "Secretaria de Saúde" (poderia ser de qualquer
município) arriscava casar com um edital de outro ente qualquer via o sinônimo curado
"saude"→"hospital", gerando vínculo errado (falso positivo).

**Corrigido (2026-07-20):** a expansão de sinônimos por nome completo só é tentada quando o
texto do órgão tem um qualificador inequívoco de DF ("distrito federal", "gdf", "governo do
distrito federal") ou federal ("ministerio", "presidencia da republica", "uniao", "republica
federativa"). Sem qualificador, cai pro heurístico de token já existente (substring literal, sem
expansão de sinônimo) — matching por sigla reconhecida continua igual, não foi tocado. Testado
com TDD: caso de falso positivo (sem qualificador) confirmado corrigido, caso legítimo (com
qualificador DF) confirmado que continua casando certo.
