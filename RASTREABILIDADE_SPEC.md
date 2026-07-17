# Spec — Rastreabilidade de Coletas (Backend)

## Contexto

O frontend já exibe uma seção "Rastreabilidade de Coletas" calculada a partir dos
leads salvos. O que falta no backend é **persistir cada sessão de coleta** para que
o frontend receba também `totalMaterias`, `duplicados` e `erros` — dados que hoje
existem apenas na resposta pontual e nunca são gravados.

---

## 1. Entidade `ColetaLog`

```java
@Entity
@Table(name = "coleta_logs")
public class ColetaLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String fonte;                  // "DODF" | "DOU" | "PNCP"

    @Column(nullable = false)
    private LocalDate data;                // data pesquisada

    @Column(nullable = false)
    private LocalDateTime iniciadoEm;

    @Column
    private LocalDateTime encerradoEm;

    @Column(nullable = false)
    private int totalMaterias;             // encontradas antes do filtro

    @Column(nullable = false)
    private int salvos;                    // novos leads gravados

    @Column(nullable = false)
    private int duplicados;                // já existiam

    @Column(nullable = false)
    private int erros;                     // exceções durante coleta

    @Column(length = 2000)
    private String detalhe;               // stack trace resumido se erros > 0
}
```

### Índice sugerido
```sql
CREATE INDEX idx_coleta_logs_fonte_data ON coleta_logs(fonte, data);
```

---

## 2. Repository

```java
public interface ColetaLogRepository extends JpaRepository<ColetaLog, Long> {

    Page<ColetaLog> findAllByOrderByIniciadoEmDesc(Pageable pageable);

    Page<ColetaLog> findByFonteOrderByIniciadoEmDesc(String fonte, Pageable pageable);

    List<ColetaLog> findByDataBetweenOrderByDataDesc(LocalDate de, LocalDate ate);
}
```

---

## 3. Integração com o serviço de coleta existente

Em `DodfService`, `DouService` e `PncpColetaService` (onde hoje há o método que
dispara a coleta e retorna `ColetaResultado`), **salvar um `ColetaLog` ao final**:

```java
// Antes de retornar ColetaResultado:
ColetaLog log = new ColetaLog();
log.setFonte(fonte);
log.setData(data);
log.setIniciadoEm(inicio);
log.setEncerradoEm(LocalDateTime.now());
log.setTotalMaterias(resultado.getTotalMaterias());
log.setSalvos(resultado.getSalvos());
log.setDuplicados(resultado.getDuplicados());
log.setErros(0);
coletaLogRepository.save(log);
```

Se houver exceção, gravar o `ColetaLog` com `erros = 1` e `detalhe` com a mensagem.

---

## 4. DTO de resposta

```java
public record ColetaLogResponse(
    Long id,
    String fonte,
    String data,           // "YYYY-MM-DD"
    String iniciadoEm,     // ISO-8601
    String encerradoEm,
    int totalMaterias,
    int salvos,
    int duplicados,
    int erros
) {}
```

---

## 5. Endpoints

### `GET /api/coleta/historico`

Lista todas as sessões de coleta (paginado, mais recente primeiro).

**Params:** `page` (default 0), `size` (default 50), `fonte` (opcional: filtra por fonte).

**Response:**
```json
{
  "content": [
    {
      "id": 42,
      "fonte": "DODF",
      "data": "2026-06-07",
      "iniciadoEm": "2026-06-07T10:31:00",
      "encerradoEm": "2026-06-07T10:31:03",
      "totalMaterias": 148,
      "salvos": 12,
      "duplicados": 3,
      "erros": 0
    }
  ],
  "totalElements": 87,
  "totalPages": 2
}
```

### `GET /api/coleta/historico/resumo`

Retorna totais agregados (para o painel de resumo do frontend).

```json
{
  "totalSessoes": 87,
  "totalMaterias": 12450,
  "totalSalvos": 340,
  "totalDuplicados": 89,
  "totalErros": 2
}
```

---

## 6. Controller

```java
@RestController
@RequestMapping("/api/coleta")
@RequiredArgsConstructor
public class ColetaLogController {

    private final ColetaLogService coletaLogService;

    @GetMapping("/historico")
    public Page<ColetaLogResponse> listar(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false)    String fonte) {
        return coletaLogService.listar(fonte, PageRequest.of(page, size));
    }

    @GetMapping("/historico/resumo")
    public ColetaResumoResponse resumo() {
        return coletaLogService.resumo();
    }
}
```

---

## 7. Integração no frontend (após implementar backend)

Em `lead.service.ts` (ou novo `coleta-log.service.ts`):

```typescript
getHistorico(params: { page?: number; size?: number; fonte?: string }): Observable<Page<ColetaLog>> {
  let p = new HttpParams()
    .set('page', params.page ?? 0)
    .set('size', params.size ?? 50);
  if (params.fonte) p = p.set('fonte', params.fonte);
  return this.http.get<Page<ColetaLog>>(`${environment.apiUrl}/coleta/historico`, { params: p });
}
```

No `leads.component.ts`, substituir `carregarHistorico()` para chamar esse endpoint
em vez de `leadService.listar({ size: 1000 })`. O `historicoEntradas` computed
precisará ser reescrito para usar `ColetaLog[]` em vez de `Lead[]` (cada entrada já
vem agregada com `totalMaterias`, `salvos`, `duplicados`). Os **leads descartados**
continuarão sendo buscados via `leadService.listar({ status: 'DESCARTADO', size: 100 })`
filtrados por data quando o usuário expandir a linha.

---

## 8. Prioridade de implementação

1. `ColetaLog` entity + migration Flyway (`V<next>__add_coleta_logs.sql`)
2. Salvar o log ao final de cada coleta (DODF e DOU primeiro, PNCP depois)
3. `GET /coleta/historico` — necessário para o frontend mostrar `totalMaterias`
4. `GET /coleta/historico/resumo` — opcional, o frontend já calcula isso localmente
