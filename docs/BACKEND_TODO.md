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
