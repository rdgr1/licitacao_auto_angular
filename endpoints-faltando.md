# Endpoints — frontend consome mas backend ainda não implementou

Mapeamento em 2026-05-13. Compara `/core/services/*.ts` contra os controllers Java.

## Faltando no backend (EditaisService)

| Método | Path | Serviço | Observação |
|--------|------|---------|------------|
| `GET`  | `/editais/search?q=` | `EditaisService` | Busca textual — usar `EditalSpec` já existente |
| `POST` | `/editais/processar` | `EditaisService` | Aciona scraping manual — expor via `EditalScraperScheduler` |
| `GET`  | `/editais/processar/status` | `EditaisService` | Status do scraping — expor `ScraperStatusHolder` |
| `POST` | `/editais/{id}/reprocessar` | `EditaisService` | Reprocessar um edital específico |
| `POST` | `/editais/reclassificar` | `EditaisService` | Recalcular scores com as regras atuais via `ConfiguracaoAnaliseService` |

## Mismatches corrigidos no frontend

| Serviço | Antes (errado) | Depois (correto) |
|---------|---------------|-----------------|
| `CotacaoService.listarFornecedores` | `/cotacao/fornecedores` | `/fornecedores` |
| `CotacaoService.criarFornecedor` | `/cotacao/fornecedores` | `/fornecedores` |
| `CotacaoService.listarItens` | `/cotacao/itens` | `/cotacao/catalogo` |
| `CotacaoService.criarItem` | `/cotacao/itens` | `/cotacao/catalogo` |

## Endpoints existentes no backend ainda não consumidos pelo frontend

| Método | Path | Observação |
|--------|------|------------|
| `POST` | `/cotacao/solicitacoes` | Criar solicitação de cotação |
| `GET`  | `/cotacao/solicitacoes` | Listar solicitações |
| `GET`  | `/cotacao/solicitacoes/{id}` | Detalhe da solicitação |
| `POST` | `/cotacao/solicitacoes/{id}/fontes` | Adicionar fonte (fornecedor) à solicitação |
| `GET`  | `/cotacao/solicitacoes/{id}/comparativo` | Comparativo de preços entre fontes |
| `GET`  | `/cotacao/responder/{token}` | Formulário público de resposta do fornecedor |
| `POST` | `/cotacao/responder/{token}` | Salvar resposta do fornecedor |
| `GET`  | `/cotacao/responder/{token}/planilha` | Download da planilha Excel |
| `POST` | `/editais-arquivo/upload` | Upload manual de edital PDF |
