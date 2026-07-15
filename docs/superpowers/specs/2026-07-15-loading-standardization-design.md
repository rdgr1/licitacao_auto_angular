# Padronização de Loading + Busca de Edital Assíncrona: Design Spec

**Data:** 2026-07-15
**Escopo:** Remover redundância de loading na coleta de leads, padronizar loading em dialogs/listas com resiliência a fechamento de dialog/navegação, e adaptar o frontend ao novo contrato assíncrono de `buscar-edital`.
**Fora de escopo:** SSE genérico para `BUSCA_EDITAL` (fica como otimização futura), padronização de loading de fetch inicial de listas (mantém `signal(true)` local como está).

---

## 1. Problema

Hoje cada dialog/lista tem seu próprio booleano de loading amarrado ao ciclo de vida do componente Angular. Quando o dialog fecha ou o usuário navega para outra rota, o componente é destruído — mas a requisição HTTP em voo **não é cancelada automaticamente** (Angular não faz isso sozinho). O resultado: a chamada continua rodando em segundo plano, mas ninguém mais está "escutando" — o usuário não vê o sucesso/erro, e a lista não é atualizada.

Casos concretos:
- **Coleta de leads**: `ColetaAndamentoService` mantém dois signals paralelos (`andamento` e `fontes`) atualizados em conjunto só por compatibilidade com o pill do topbar — redundância de estado para a mesma operação.
- **`LoadingService` + `loadingInterceptor` + `LoadingSpinnerComponent`**: infraestrutura global órfã, nunca lida em nenhum template, e o spinner quebra o layout quando ativado.
- **Dialogs de formulário** (`fornecedor-form-dialog`, `item-form-dialog`, `keyword-dialog`, `tipo-abertura-dialog`, `dou-item-dialog`, `itens-dialog`, `pncp-item-dialog`): a maioria não tem loading algum; os que têm (`lead-detalhe-dialog`, `processo-detalhe-dialog`) usam booleanos locais + `.subscribe()` cru sem nenhuma persistência de estado.
- **`buscarEdital`** (`lead-detalhe-dialog.component.ts:813-830`): hoje é uma chamada síncrona que espera o `Edital` completo na resposta. O backend (`licitacao.automate`, mudança em working tree) mudou para `202 Accepted` retornando um registro de busca (`BuscaEdital`), concluindo depois via polling ou SSE — o endpoint atual do frontend quebra com essa mudança.

---

## 2. Arquitetura

### 2.1 `OperationTrackerService` (novo — `core/services/operation-tracker.service.ts`)

Serviço root-provided, fonte única de verdade para o estado de qualquer operação assíncrona rastreada por chave (`key: string`).

```typescript
interface RunOptions<T> {
  successMessage?: string;
  errorMessage?: string | ((err: unknown) => string);
  onSuccess?: (result: T) => void;
  onError?: (err: unknown) => void;
}

class OperationTrackerService {
  isLoading(key: string): Signal<boolean>;
  hasAnyActive(): Signal<boolean>; // computed, para a barra global
  run<T>(key: string, source$: Observable<T>, opts?: RunOptions<T>): void;
}
```

- `run()` assina o `source$` **dentro do próprio serviço** (não no componente chamador) — por isso a operação sobrevive ao fechamento de dialog/navegação de rota.
- Loading da key liga antes de assinar, desliga em `finalize()` (sucesso ou erro), sempre.
- Erro: `catchError` interno garante que nunca escapa pro chamador; dispara `ToastService.error(errorMessage ?? mensagem genérica)` a menos que `errorMessage` seja passado como `null`; chama `onError` se fornecido, além do toast.
- Sucesso: dispara `ToastService.success(successMessage)` se fornecido, chama `onSuccess(result)`.
- `source$` pode ser tanto uma chamada HTTP única quanto um stream de polling que completa ao atingir um estado terminal (ver seção 4) — o serviço não distingue os dois casos, só assina até completar/errar.
- Se o componente que forneceu o `onSuccess`/`onError` já foi destruído, a chamada ao callback é inofensiva (apenas seta signals que nada mais renderiza) — sem necessidade de guard especial.

### 2.2 `ColetaAndamentoService` — refatoração (não recriação)

Colapsar os dois signals paralelos (`andamento`, `fontes`) em uma única fonte: `fontes` continua sendo o array mutável; `andamento` vira um `computed()` derivado dele, mantendo exatamente a mesma forma que os consumidores atuais (pill do topbar) já esperam. Nenhuma mudança de API pública — só remove a duplicação de mutação interna (`iniciarColeta`, `avancarEtapa`, `concluirFonte`, `erroFonte` deixam de escrever nos dois lugares).

### 2.3 Remoção do trio órfão

Remover: `core/services/loading.service.ts`, `core/interceptors/loading.interceptor.ts` (desregistrar do `app.config.ts`), `shared/components/loading-spinner/loading-spinner.component.ts`. Nenhum consumidor existe hoje — remoção sem impacto funcional.

### 2.4 `GlobalProgressBarComponent` (novo — `shared/components/global-progress-bar/`)

Barra fina e estática no topo do `main-layout` (mesma linguagem visual da `.andamento-bar` já usada em Rastreabilidade — trilha + preenchimento, sem overlay/spinner flutuante). Visibilidade controlada por `operationTracker.hasAnyActive()`. Montada uma vez em `main-layout.component.html`.

### 2.5 Dialogs migrados

Cada dialog troca seu booleano ad-hoc + `.subscribe()` cru por uma chamada a `tracker.run(key, source$, opts)`. O botão de ação só reflete `[disabled]="tracker.isLoading(key)"` — **sem spinner próprio no dialog**; o feedback visual concentra-se na barra global (2.4) + toast. Isso evita ter "um monte de loading espalhado" — um único lugar visual, não um por dialog.

Dialogs afetados: `fornecedor-form-dialog`, `item-form-dialog`, `keyword-dialog`, `tipo-abertura-dialog`, `dou-item-dialog`, `itens-dialog`, `pncp-item-dialog`, `processo-detalhe-dialog`, e `lead-detalhe-dialog` (que além do save genérico, ganha o novo fluxo de `buscarEdital` — seção 4).

Listas (`leads`, `itens`, `fornecedores`, `dashboard`) mantêm o fetch inicial como está (signal local simples); passam a observar `tracker.isLoading(key)` apenas quando precisam refletir uma operação disparada por um dialog que já fechou (ex: lista de fornecedores sabendo que um save ainda está em voo).

---

## 3. Fluxo de dados (exemplo: salvar fornecedor)

1. Usuário clica "Salvar" no `fornecedor-form-dialog`.
2. Dialog chama `operationTracker.run('save-fornecedor-' + id, fornecedorService.salvar(dto), { successMessage: 'Fornecedor salvo', errorMessage: 'Erro ao salvar fornecedor', onSuccess: () => fornecedoresListComponent.refresh() })`.
3. Botão fica desabilitado enquanto `tracker.isLoading(key)` for true; barra global acende.
4. Se o usuário fechar o dialog antes da resposta, a subscription (dona: o serviço) continua.
5. Ao concluir: toast dispara independente do dialog estar aberto; se a lista-pai ainda existir, atualiza; barra global apaga quando não sobra key ativa.
6. Erro de validação inline (ex: 409 duplicado) usa `onError` além/no lugar do toast (`errorMessage: null` quando o erro já aparece no formulário).

---

## 4. Fluxo assíncrono de `buscarEdital`

### 4.1 Contrato do backend (confirmado no código-fonte, `licitacao.automate`, mudança em working tree)

- `POST /leads/{id}/buscar-edital` → **202 Accepted**, corpo `BuscaEdital`.
- `GET /leads/{id}/buscar-edital/status` → **200 OK**, corpo `BuscaEdital` (registro mais recente do lead).
- `BuscaEdital`: `{ uuid, leadId, status, mensagem, editalId?, createdAt, lastModified, createdBy }`.
- `StatusBuscaEdital` = `'EM_ANDAMENTO' | 'CONCLUIDA' | 'NAO_ENCONTRADO' | 'ERRO'`.
- Evento SSE `BUSCA_EDITAL` (fora de escopo consumir agora): `{ buscaId, leadId, editalId?, status, mensagem, solicitadoPor?, timestamp }` — shape diferente do `BuscaEdital` acima, não reaproveitável 1:1.

### 4.2 Modelos novos (frontend)

Novo arquivo `core/models/busca-edital.model.ts`:
```typescript
export type StatusBuscaEdital = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'NAO_ENCONTRADO' | 'ERRO';

export interface BuscaEdital {
  uuid: string;
  leadId: string;
  status: StatusBuscaEdital;
  mensagem: string;
  editalId?: string;
  createdAt: string;
  lastModified: string;
  createdBy: string;
}
```

### 4.3 `lead.service.ts`

- `buscarEdital(uuid): Observable<BuscaEdital>` — troca o tipo de retorno de `EditalResponse` para `BuscaEdital` (o POST agora é 202, corpo é o registro, não o edital).
- Novo: `statusBuscaEdital(uuid): Observable<BuscaEdital>` → `GET ${base}/${uuid}/buscar-edital/status`.

### 4.4 `lead-detalhe-dialog.component.ts`

Substitui o método atual (linhas 813-830) por uma versão que usa o tracker com uma fonte de polling:

```typescript
buscarEdital(): void {
  const key = `busca-edital-${this.data.uuid}`;

  const inicia$ = this.leadService.buscarEdital(this.data.uuid).pipe(
    switchMap((registro) =>
      registro.status === 'EM_ANDAMENTO'
        ? interval(2000).pipe(
            switchMap(() => this.leadService.statusBuscaEdital(this.data.uuid)),
            first((r) => r.status !== 'EM_ANDAMENTO'),
          )
        : of(registro)
    )
  );

  this.editalError.set(null);
  this.operationTracker.run(key, inicia$, {
    errorMessage: 'Erro ao buscar edital. Tente novamente.',
    onSuccess: (registro) => {
      if (registro.status === 'CONCLUIDA' && registro.editalId) {
        this.editaisService.getById(registro.editalId).subscribe((e) => this.edital.set(e));
      } else if (registro.status === 'NAO_ENCONTRADO') {
        this.editalError.set('Nenhum edital encontrado no PNCP para este lead.');
      } else {
        this.editalError.set(registro.mensagem || 'Erro ao buscar edital. Tente novamente.');
      }
    },
  });
}
```

Template (linhas 137-190): troca `loadingEdital()` local por `operationTracker.isLoading('busca-edital-' + data.uuid)()` — o texto "Buscando no PNCP..." permanece, mas some se o dialog reabrir enquanto o polling ainda está ativo em segundo plano (o botão fica desabilitado e o texto de "buscando" reaparece automaticamente, já que a key ainda está `true`).

### 4.5 Por que polling e não SSE agora

O `notificacoes.service.ts` só trata `NOVO_LEAD`/`ACAO_PIPELINE` roteados para um contador de não-lidas — não expõe uma API genérica de "assine por tipo de evento com payload tipado". Estender isso pra um payload por-lead exigiria generalizar um serviço com responsabilidade hoje bem mais estreita (contador de notificações). Polling a cada 2s até status terminal é simples, autocontido, e se encaixa 1:1 no `OperationTrackerService` sem trabalho extra. Consumir o evento SSE `BUSCA_EDITAL` fica como otimização futura (eliminaria o polling, resposta mais imediata) sem exigir mudança de contrato.

---

## 5. Tratamento de erro

- `run()` do tracker nunca deixa erro escapar — sempre finaliza a key de loading, sucesso ou erro.
- Erro padrão vira toast; dialogs que precisam de erro inline (validação, 409) usam `onError` e opcionalmente suprimem o toast (`errorMessage: null`).
- No polling de `buscarEdital`, erro de rede durante o poll (não status de negócio) cai no `catchError` do tracker normalmente — mostra toast genérico e a key some; usuário pode clicar "Tentar novamente".

---

## 6. Testes

- Unitário `OperationTrackerService`: `run()` liga/desliga loading em sucesso e erro; múltiplas keys concorrentes independentes; toast chamado com a mensagem certa; callback `onSuccess`/`onError` ausente não quebra.
- Unitário `ColetaAndamentoService` refatorado: `andamento` computed mantém o mesmo shape usado hoje pelo topbar (regressão).
- Unitário do polling de `buscarEdital`: usar `fakeAsync`/`TestScheduler` para simular sequência `EM_ANDAMENTO → EM_ANDAMENTO → CONCLUIDA`, confirmar que o poll para no terminal e que `editaisService.getById` é chamado só quando `CONCLUIDA` + `editalId` presente; simular `NAO_ENCONTRADO` e `ERRO` também.
- Smoke test em 2-3 dialogs migrados (ex: `fornecedor-form-dialog`): salvar funciona, fechar o dialog logo após clicar salvar ainda resulta em toast + lista atualizada.
- Manual: abrir `lead-detalhe-dialog`, clicar "Buscar no PNCP", fechar o dialog antes de concluir, reabrir — confirmar que o polling continuou e o resultado aparece; confirmar que a barra global acende/apaga sem deslocar layout; confirmar que o pill/rastreabilidade da coleta se comporta igual após o refactor do `ColetaAndamentoService`.

---

## 7. Fora de escopo / follow-ups

- Consumir SSE `BUSCA_EDITAL` no lugar do polling.
- Padronizar loading de fetch inicial de listas (mantém padrão atual).
- Cancelamento explícito de operações pelo usuário (hoje só fecham o dialog; a operação continua rodando por design).
