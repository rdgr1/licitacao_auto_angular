# Lead Visual Indicators (Score, Categoria, Status) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every lead (DODF, DOU, PNCP) gets a `leadScore`/`leadCategoriaPrincipal` computed at save time and exposed via `GET /leads`, and the frontend renders score, categoria, and status correctly and consistently on the `leads` grid and the `pipeline` kanban.

**Architecture:** Backend: add `leadScore`/`leadCategoriaPrincipal` columns to `Lead` (mirroring `Edital`'s existing fields), classify DODF/DOU leads centrally in `LeadServiceImpl.salvarSeNovo()` by building a **transient `Edital`** (never persisted) from the lead's `titulo`/`orgao` and reusing the existing `LeadClassificationService.classify(Edital)` unchanged — this avoids touching the classification rule engine at all, since `FAIXA_VALOR`/`PRAZO_MIN_MAX`/`MODALIDADE_PERMITIDA`/`KEYWORD_ITEM` rule types already no-op safely when their inputs (`valorEstimado`, `prazoExecucaoDias`, `modalidade`, `itens`) are null/empty. PNCP already computes classification on the real `Edital` before creating the `Lead`, so it just copies the two fields over — no reclassification, no guard needed (PNCP's `criarLead()` never goes through `salvarSeNovo()`). Frontend: fix two pre-existing bugs (stale status CSS, pipeline score-color defaulting to "cold" on null) and add a `LeadCategoriaPipe` alongside the already-unused `ScoreBadgePipe`.

**Tech Stack:** Spring Boot / JPA / Mockito+JUnit5+AssertJ (backend), Angular 21 standalone components / signals / Vitest (frontend).

## Global Constraints

- No DB migration files exist in this project (`ddl-auto: update`) — new `Lead` columns need no migration, only new `@Column` fields.
- Categoria `DESCARTADO` is informational only on the card — it must never mutate `lead.status`. The analyst still discards manually via the existing `atualizarStatus`/"Descartar" button.
- Reuse `ScoreBadgePipe` (`shared/pipes/score-badge.pipe.ts`, already exists, currently unused anywhere) instead of duplicating hot/warm/cold color logic.
- Backend and frontend changes live in two different repos: `licitacao.automate` (backend, absolute path `/Users/rrxx/rdPersonal/Trabalho/licitacao.automate`) and `licitacao_auto_angular` (frontend, absolute path `/Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular`). All file paths below are relative to the repo named at the start of the task unless stated otherwise.

---

### Task 1: Backend — `leadScore`/`leadCategoriaPrincipal` fields on `Lead` + DTO

**Files:**
- Modify: `licitacao.automate/src/main/java/org/brasfort/licitacao/automate/model/licitacao/Lead.java:36-98`
- Modify: `licitacao.automate/src/main/java/org/brasfort/licitacao/automate/dto/LeadRecord.java`
- Test: `licitacao.automate/src/test/java/org/brasfort/licitacao/automate/model/licitacao/LeadTest.java` (new)

**Interfaces:**
- Produces: `Lead.getLeadScore(): Integer`, `Lead.setLeadScore(Integer)`, `Lead.getLeadCategoriaPrincipal(): String`, `Lead.setLeadCategoriaPrincipal(String)` (Lombok `@Data` generates these automatically from the new fields); `LeadRecord` gains two trailing components `leadScore` (Integer) and `leadCategoriaPrincipal` (String); `Lead.toDto(Lead)` includes both.

- [ ] **Step 1: Write the failing test**

Create `licitacao.automate/src/test/java/org/brasfort/licitacao/automate/model/licitacao/LeadTest.java`:
```java
package org.brasfort.licitacao.automate.model.licitacao;

import org.brasfort.licitacao.automate.dto.LeadRecord;
import org.brasfort.licitacao.automate.enums.StatusLead;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class LeadTest {

    @Test
    void toDtoDeveIncluirScoreECategoria() {
        Lead lead = new Lead();
        lead.setFonte("DODF");
        lead.setIdOrigem("123");
        lead.setDataPublicacao(LocalDate.of(2026, 1, 1));
        lead.setTitulo("Contratação de vigilância armada");
        lead.setTexto("texto");
        lead.setTipo("OUTRO");
        lead.setOrgao("SEAP");
        lead.setStatus(StatusLead.NOVO);
        lead.setDetectadoEm(Instant.now());
        lead.setLeadScore(65);
        lead.setLeadCategoriaPrincipal("VIGILÂNCIA");

        LeadRecord dto = Lead.toDto(lead);

        assertThat(dto.leadScore()).isEqualTo(65);
        assertThat(dto.leadCategoriaPrincipal()).isEqualTo("VIGILÂNCIA");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate && ./mvnw test -Dtest=LeadTest`
Expected: compile error — `LeadRecord` has no `leadScore()`/`leadCategoriaPrincipal()` accessors and `Lead` has no `setLeadScore`/`setLeadCategoriaPrincipal`.

- [ ] **Step 3: Add the fields**

In `Lead.java`, add after the `edital` field (after line 67, before the `@PrePersist` block):
```java
    @Column(name = "lead_score")
    private Integer leadScore;

    @Column(name = "lead_categoria_principal", length = 50)
    private String leadCategoriaPrincipal;
```

Update `Lead.toDto()` (replace lines 80-98):
```java
    public static LeadRecord toDto(Lead lead) {
        return new LeadRecord(
                lead.getUuid(),
                lead.getFonte(),
                lead.getIdOrigem(),
                lead.getDataPublicacao(),
                lead.getTitulo(),
                lead.getTexto(),
                lead.getTipo(),
                lead.getCoDemandante(),
                lead.getOrgao(),
                lead.getStatus(),
                lead.getDetectadoEm(),
                lead.getRevisadoEm(),
                lead.getRevisadoPor(),
                lead.getObservacao(),
                lead.getEdital() != null ? lead.getEdital().getId() : null,
                lead.getLeadScore(),
                lead.getLeadCategoriaPrincipal()
        );
    }
```

In `LeadRecord.java`, add two components right before the closing `)` (after `editalId` at line 59):
```java
        @JsonView(LeadSpec.View.class)
        UUID editalId,

        @JsonView(LeadSpec.View.class)
        Integer leadScore,

        @JsonView(LeadSpec.View.class)
        String leadCategoriaPrincipal
) {
```
(Replaces the existing `UUID editalId\n) {` at lines 58-60.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate && ./mvnw test -Dtest=LeadTest`
Expected: PASS, 1 test run, 0 failures.

- [ ] **Step 5: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate
git add src/main/java/org/brasfort/licitacao/automate/model/licitacao/Lead.java \
        src/main/java/org/brasfort/licitacao/automate/dto/LeadRecord.java \
        src/test/java/org/brasfort/licitacao/automate/model/licitacao/LeadTest.java
git commit -m "feat: adiciona leadScore e leadCategoriaPrincipal ao Lead e LeadRecord"
```

---

### Task 2: Backend — classificar DODF/DOU centralmente em `salvarSeNovo()`

**Files:**
- Modify: `licitacao.automate/src/main/java/org/brasfort/licitacao/automate/service/impl/LeadServiceImpl.java`
- Test: `licitacao.automate/src/test/java/org/brasfort/licitacao/automate/service/impl/LeadServiceImplTest.java` (new)

**Interfaces:**
- Consumes: `Lead.getLeadScore()/setLeadScore(Integer)`, `Lead.getLeadCategoriaPrincipal()/setLeadCategoriaPrincipal(String)` (Task 1); `LeadClassificationService.classify(Edital): LeadClassificationService.LeadClassification` (existing, unchanged) with `LeadClassification.score(): int` and `.categoriaPrincipal(): String`; `Edital` no-arg constructor + `setObjeto(String)`/`setOrgaoOrigem(String)` (existing, unchanged).
- Produces: `LeadServiceImpl` constructor now also requires a `LeadClassificationService` (Spring `@RequiredArgsConstructor` wires it automatically — no manual bean wiring needed elsewhere).

- [ ] **Step 1: Write the failing test**

Create `licitacao.automate/src/test/java/org/brasfort/licitacao/automate/service/impl/LeadServiceImplTest.java`:
```java
package org.brasfort.licitacao.automate.service.impl;

import org.brasfort.licitacao.automate.event.NovoLeadEvent;
import org.brasfort.licitacao.automate.model.licitacao.Lead;
import org.brasfort.licitacao.automate.repository.licitacao.LeadRepo;
import org.brasfort.licitacao.automate.service.ai.LeadClassificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadServiceImplTest {

    @Mock LeadRepo leadRepo;
    @Mock ApplicationEventPublisher eventPublisher;
    @Mock LeadClassificationService classificationService;

    private LeadServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new LeadServiceImpl(leadRepo, eventPublisher, classificationService);
    }

    private Lead leadDodfFake() {
        Lead lead = new Lead();
        lead.setFonte("DODF");
        lead.setIdOrigem("dodf-123");
        lead.setTitulo("Contratação de vigilância armada");
        lead.setOrgao("SEAP");
        lead.setTipo("MATERIA");
        return lead;
    }

    @Test
    void deveClassificarLeadSemScoreAoSalvar() {
        Lead lead = leadDodfFake();
        when(leadRepo.existsByIdOrigem("dodf-123")).thenReturn(false);
        when(leadRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(classificationService.classify(any())).thenReturn(
                new LeadClassificationService.LeadClassification(50, List.of("VIGILÂNCIA"), "VIGILÂNCIA"));

        Lead salvo = service.salvarSeNovo(lead);

        assertThat(salvo.getLeadScore()).isEqualTo(50);
        assertThat(salvo.getLeadCategoriaPrincipal()).isEqualTo("VIGILÂNCIA");
    }

    @Test
    void naoDeveReclassificarLeadQueJaTemScore() {
        Lead lead = leadDodfFake();
        lead.setLeadScore(80);
        lead.setLeadCategoriaPrincipal("BRIGADA");
        when(leadRepo.existsByIdOrigem("dodf-123")).thenReturn(false);
        when(leadRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Lead salvo = service.salvarSeNovo(lead);

        verify(classificationService, never()).classify(any());
        assertThat(salvo.getLeadScore()).isEqualTo(80);
        assertThat(salvo.getLeadCategoriaPrincipal()).isEqualTo("BRIGADA");
    }

    @Test
    void naoDeveClassificarLeadDuplicado() {
        Lead lead = leadDodfFake();
        when(leadRepo.existsByIdOrigem("dodf-123")).thenReturn(true);

        Lead resultado = service.salvarSeNovo(lead);

        assertThat(resultado).isNull();
        verify(classificationService, never()).classify(any());
        verify(leadRepo, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any(NovoLeadEvent.class));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate && ./mvnw test -Dtest=LeadServiceImplTest`
Expected: compile error — `LeadServiceImpl`'s constructor doesn't accept a third `LeadClassificationService` argument yet.

- [ ] **Step 3: Implement classification in `salvarSeNovo()`**

Replace the full contents of `LeadServiceImpl.java` with:
```java
package org.brasfort.licitacao.automate.service.impl;

import lombok.RequiredArgsConstructor;
import org.brasfort.licitacao.automate.enums.StatusLead;
import org.brasfort.licitacao.automate.event.NovoLeadEvent;
import org.brasfort.licitacao.automate.model.edital.Edital;
import org.brasfort.licitacao.automate.model.licitacao.Lead;
import org.brasfort.licitacao.automate.repository.licitacao.LeadRepo;
import org.brasfort.licitacao.automate.service.ai.LeadClassificationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeadServiceImpl {

    private final LeadRepo leadRepo;
    private final ApplicationEventPublisher eventPublisher;
    private final LeadClassificationService classificationService;

    public Lead findById(UUID uuid) {
        return leadRepo.findById(uuid).orElseThrow(
                () -> new IllegalArgumentException("Error: Lead Not found.")
        );
    }

    public Page<Lead> listar(Pageable pageable) {
        return leadRepo.findAll(pageable);
    }

    public Page<Lead> listarPorStatus(StatusLead status, Pageable pageable) {
        return leadRepo.findByStatus(status, pageable);
    }

    public Page<Lead> listarPorFonte(String fonte, Pageable pageable) {
        return leadRepo.findByFonte(fonte, pageable);
    }

    public Lead salvarSeNovo(Lead lead) {
        if (leadRepo.existsByIdOrigem(lead.getIdOrigem())) {
            return null;  // já existe, não duplica
        }
        if (lead.getLeadScore() == null) {
            classificar(lead);
        }
        Lead salvo = leadRepo.save(lead);
        // publicado no event bus; o listener assíncrono persiste a notificação
        eventPublisher.publishEvent(NovoLeadEvent.deLead(salvo, "COLETA_" + salvo.getFonte()));
        return salvo;
    }

    /**
     * Reaproveita o motor de classificação (regras de negócio vivem em Edital)
     * montando um Edital transiente — nunca persistido — a partir dos campos
     * do próprio lead. Regras que dependem de valor/prazo/modalidade/itens
     * simplesmente não contribuem (dado ainda não existe antes do Edital).
     */
    private void classificar(Lead lead) {
        Edital editalTransiente = new Edital();
        editalTransiente.setObjeto(lead.getTitulo());
        editalTransiente.setOrgaoOrigem(lead.getOrgao());
        var classification = classificationService.classify(editalTransiente);
        lead.setLeadScore(classification.score());
        lead.setLeadCategoriaPrincipal(classification.categoriaPrincipal());
    }

    public Lead atualizarStatus(UUID uuid, StatusLead novoStatus, String revisadoPor, String observacao) {
        Lead existente = findById(uuid);
        existente.setStatus(novoStatus);
        existente.setRevisadoPor(revisadoPor);
        existente.setObservacao(observacao);
        existente.setRevisadoEm(Instant.now());
        return leadRepo.save(existente);
    }

    public void deletar(UUID uuid) {
        Lead existing = findById(uuid);
        leadRepo.delete(existing);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate && ./mvnw test -Dtest=LeadServiceImplTest`
Expected: PASS, 3 tests run, 0 failures.

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate && ./mvnw test`
Expected: PASS (no other class constructs `LeadServiceImpl` directly with the old 2-arg constructor outside of Spring's DI, which now auto-wires the third dependency).

- [ ] **Step 6: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate
git add src/main/java/org/brasfort/licitacao/automate/service/impl/LeadServiceImpl.java \
        src/test/java/org/brasfort/licitacao/automate/service/impl/LeadServiceImplTest.java
git commit -m "feat: classifica leads DODF/DOU na origem via LeadServiceImpl.salvarSeNovo"
```

---

### Task 3: Backend — copiar score/categoria do Edital pro Lead do PNCP

**Files:**
- Modify: `licitacao.automate/src/main/java/org/brasfort/licitacao/automate/service/scraper/pncp/PncpPersistService.java:123-143`
- Modify: `licitacao.automate/src/test/java/org/brasfort/licitacao/automate/pncp/PncpPersistServiceTest.java:113-131`

**Interfaces:**
- Consumes: `Lead.setLeadScore(Integer)`, `Lead.setLeadCategoriaPrincipal(String)` (Task 1); `Edital.getLeadScore(): Integer`, `Edital.getLeadCategoriaPrincipal(): String` (existing, already set at `PncpPersistService.java:68-69` before `criarLead()` is called at line 75).

- [ ] **Step 1: Update the existing test to assert the new fields (failing)**

In `PncpPersistServiceTest.java`, replace the `deveCriarLeadQuandoScorePositivo` test (lines 113-131) with:
```java
    @Test
    void deveCriarLeadQuandoScorePositivo() {
        PncpEdital p = editalFake("12345-1-90009-2026", "Contratação de vigilância armada");
        stubClassification(50);
        when(editalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(leadRepo.existsByIdOrigem("12345-1-90009-2026")).thenReturn(false);

        service.salvarEditalComLead(p, List.of());

        ArgumentCaptor<Lead> captor = ArgumentCaptor.forClass(Lead.class);
        verify(leadRepo).save(captor.capture());
        Lead lead = captor.getValue();
        assertThat(lead.getFonte()).isEqualTo("PNCP");
        assertThat(lead.getIdOrigem()).isEqualTo("12345-1-90009-2026");
        assertThat(lead.getOrgao()).isEqualTo("INSS");
        assertThat(lead.getTipo()).isEqualTo("PREGAO_ELETRONICO");
        assertThat(lead.getTexto()).contains("vigilância armada");
        assertThat(lead.getEdital()).isNotNull();
        assertThat(lead.getLeadScore()).isEqualTo(50);
        assertThat(lead.getLeadCategoriaPrincipal()).isEqualTo("VIGILÂNCIA");
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate && ./mvnw test -Dtest=PncpPersistServiceTest#deveCriarLeadQuandoScorePositivo`
Expected: FAIL — `lead.getLeadScore()` is `null`, not `50` (field not yet copied).

- [ ] **Step 3: Copy the fields in `criarLead()`**

In `PncpPersistService.java`, in `criarLead()` (lines 123-143), add two lines right before `leadRepo.save(lead);` (line 138):
```java
        lead.setLeadScore(edital.getLeadScore());
        lead.setLeadCategoriaPrincipal(edital.getLeadCategoriaPrincipal());

        leadRepo.save(lead);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate && ./mvnw test -Dtest=PncpPersistServiceTest`
Expected: PASS, all tests in the class pass (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao.automate
git add src/main/java/org/brasfort/licitacao/automate/service/scraper/pncp/PncpPersistService.java \
        src/test/java/org/brasfort/licitacao/automate/pncp/PncpPersistServiceTest.java
git commit -m "feat: copia leadScore/leadCategoriaPrincipal do Edital pro Lead no fluxo PNCP"
```

---

### Task 4: Frontend — modelo + `LeadCategoriaPipe`

**Files:**
- Modify: `licitacao_auto_angular/src/app/core/models/lead.model.ts:25`
- Create: `licitacao_auto_angular/src/app/shared/pipes/lead-categoria.pipe.ts`
- Test: `licitacao_auto_angular/src/app/shared/pipes/lead-categoria.pipe.spec.ts` (new)

**Interfaces:**
- Produces: `Lead.leadCategoriaPrincipal?: string`; `LeadCategoriaPipe` (standalone, name `leadCategoria`) transforming `string | undefined | null` into `{ label: string; color: string; hidden: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `lead-categoria.pipe.spec.ts`:
```typescript
import { LeadCategoriaPipe } from './lead-categoria.pipe';

describe('LeadCategoriaPipe', () => {
  const pipe = new LeadCategoriaPipe();

  it('mapeia VIGILÂNCIA com label e cor', () => {
    const result = pipe.transform('VIGILÂNCIA');
    expect(result.label).toBe('Vigilância');
    expect(result.hidden).toBe(false);
  });

  it('mapeia DESCARTADO como sugestão neutra', () => {
    const result = pipe.transform('DESCARTADO');
    expect(result.label).toBe('Sugestão: descartar');
    expect(result.hidden).toBe(false);
  });

  it('esconde SEM_CATEGORIA', () => {
    expect(pipe.transform('SEM_CATEGORIA').hidden).toBe(true);
  });

  it('esconde valores nulos, indefinidos ou desconhecidos', () => {
    expect(pipe.transform(null).hidden).toBe(true);
    expect(pipe.transform(undefined).hidden).toBe(true);
    expect(pipe.transform('ALGO_NAO_MAPEADO').hidden).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npx ng test --include='**/lead-categoria.pipe.spec.ts' --watch=false`
Expected: FAIL — `./lead-categoria.pipe` does not exist yet.

- [ ] **Step 3: Add the model field**

In `lead.model.ts`, after line 25 (`leadScore?: number;`):
```typescript
  leadCategoriaPrincipal?: string;
```

- [ ] **Step 4: Implement the pipe**

Create `lead-categoria.pipe.ts`:
```typescript
import { Pipe, PipeTransform } from '@angular/core';

export interface CategoriaBadge {
  label: string;
  color: string;
  hidden: boolean;
}

const MAP: Record<string, { label: string; color: string }> = {
  VIGILÂNCIA: { label: 'Vigilância', color: '#8B5CF6' },
  LIMPEZA: { label: 'Limpeza', color: '#0EA5E9' },
  COPEIRAGEM: { label: 'Copeiragem', color: '#F59E0B' },
  MÃO_DE_OBRA: { label: 'Mão de Obra', color: '#14B8A6' },
  BRIGADA: { label: 'Brigada', color: '#EF4444' },
  DESCARTADO: { label: 'Sugestão: descartar', color: '#94A3B8' },
};

@Pipe({
  name: 'leadCategoria',
  standalone: true,
})
export class LeadCategoriaPipe implements PipeTransform {
  transform(categoria: string | null | undefined): CategoriaBadge {
    const entry = categoria ? MAP[categoria] : undefined;
    if (!entry) {
      return { label: '', color: '', hidden: true };
    }
    return { ...entry, hidden: false };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npx ng test --include='**/lead-categoria.pipe.spec.ts' --watch=false`
Expected: PASS, 4 tests passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
git add src/app/core/models/lead.model.ts \
        src/app/shared/pipes/lead-categoria.pipe.ts \
        src/app/shared/pipes/lead-categoria.pipe.spec.ts
git commit -m "feat: adiciona leadCategoriaPrincipal ao modelo Lead e cria LeadCategoriaPipe"
```

---

### Task 5: Frontend — `leads.component`: status CSS, score via pipe, chip de categoria, paginator sempre visível

**Files:**
- Modify: `licitacao_auto_angular/src/app/features/leads/leads.component.ts`
- Modify: `licitacao_auto_angular/src/app/features/leads/leads.component.html:452-530`
- Modify: `licitacao_auto_angular/src/app/features/leads/leads.component.scss:439-443`

**Interfaces:**
- Consumes: `ScoreBadgePipe` (`shared/pipes/score-badge.pipe.ts`, existing, `transform(score: number): { label, range, color }`), `LeadCategoriaPipe` (Task 4, `transform(categoria): { label, color, hidden }`).

- [ ] **Step 1: Import the pipes in the standalone component**

In `leads.component.ts`, add imports near the other pipe import (after `import { TruncatePipe } from '../../shared/pipes/truncate.pipe';`):
```typescript
import { ScoreBadgePipe } from '../../shared/pipes/score-badge.pipe';
import { LeadCategoriaPipe } from '../../shared/pipes/lead-categoria.pipe';
```
Add both to the `imports: [...]` array of the `@Component` decorator, alongside `TruncatePipe`.

- [ ] **Step 2: Fix the status-border CSS to match the current `LeadStatus` enum**

In `leads.component.scss`, replace lines 439-443:
```scss
  /* Left accent by status */
  &.status-border-NOVA           { border-left: 3px solid #3B82F6; }
  &.status-border-EM_TRIAGEM     { border-left: 3px solid #8B5CF6; }
  &.status-border-VERIFICANDO_REQ{ border-left: 3px solid var(--status-pendente); }
  &.status-border-QUALIFICADO    { border-left: 3px solid var(--brand-primary); }
  &.status-border-DESCARTADO     { border-left: 3px solid #CBD5E1; opacity: 0.7; }
```
with:
```scss
  /* Left accent by status */
  &.status-border-NOVO                          { border-left: 3px solid #3B82F6; }
  &.status-border-APROVACAO_PRESIDENCIA         { border-left: 3px solid #8B5CF6; }
  &.status-border-ESTUDO_VIABILIDADE            { border-left: 3px solid var(--status-pendente); }
  &.status-border-SEGUNDA_APROVACAO_PRESIDENCIA { border-left: 3px solid #F97316; }
  &.status-border-QUALIFICADO                   { border-left: 3px solid var(--brand-primary); }
  &.status-border-DESCARTADO                    { border-left: 3px solid #CBD5E1; opacity: 0.7; }
```

- [ ] **Step 3: Add the categoria chip next to the fonte badge**

In `leads.component.html`, replace the meta row (lines 455-461):
```html
          <!-- Meta row -->
          <div class="lc-meta">
            <span class="edital-link-dot" [class.linked]="lead.editalId"
                  [matTooltip]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"
                  [attr.aria-label]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"></span>
            <span class="lc-fonte fonte-{{ lead.fonte?.toLowerCase() }}">{{ lead.fonte }}</span>
            <span class="lc-tipo">{{ lead.tipo }}</span>
          </div>
```
with:
```html
          <!-- Meta row -->
          <div class="lc-meta">
            <span class="edital-link-dot" [class.linked]="lead.editalId"
                  [matTooltip]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"
                  [attr.aria-label]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"></span>
            <span class="lc-fonte fonte-{{ lead.fonte?.toLowerCase() }}">{{ lead.fonte }}</span>
            <span class="lc-tipo">{{ lead.tipo }}</span>
            @if (!(lead.leadCategoriaPrincipal | leadCategoria).hidden) {
              <span class="lc-categoria"
                    [style.background]="(lead.leadCategoriaPrincipal | leadCategoria).color + '1A'"
                    [style.color]="(lead.leadCategoriaPrincipal | leadCategoria).color">
                {{ (lead.leadCategoriaPrincipal | leadCategoria).label }}
              </span>
            }
          </div>
```

- [ ] **Step 4: Replace the score donut's inline ternaries with `ScoreBadgePipe`**

In `leads.component.html`, replace the score donut block (lines 481-498):
```html
            @if (lead.leadScore != null) {
              <svg class="score-donut" width="44" height="44" viewBox="0 0 44 44"
                   [attr.aria-label]="'Score ' + lead.leadScore">
                <circle cx="22" cy="22" r="16" fill="none"
                        stroke="rgba(255,255,255,0.08)" stroke-width="3.5"/>
                <circle cx="22" cy="22" r="16" fill="none"
                  [attr.stroke]="lead.leadScore >= 70 ? 'var(--score-hot)' : lead.leadScore >= 40 ? 'var(--status-pendente)' : 'var(--color-info)'"
                  stroke-width="3.5" stroke-linecap="round"
                  [attr.stroke-dasharray]="(lead.leadScore / 100 * 100.53) + ' 100.53'"
                  stroke-dashoffset="25.13"
                  transform="rotate(-90 22 22)"/>
                <text x="22" y="27" text-anchor="middle"
                  [attr.fill]="lead.leadScore >= 70 ? 'var(--score-hot)' : lead.leadScore >= 40 ? 'var(--status-pendente)' : 'var(--color-info)'"
                  font-size="11" font-weight="700" font-family="inherit">
                  {{ lead.leadScore }}
                </text>
              </svg>
            }
```
with:
```html
            @if (lead.leadScore != null) {
              <svg class="score-donut" width="44" height="44" viewBox="0 0 44 44"
                   [attr.aria-label]="'Score ' + lead.leadScore + ' — ' + (lead.leadScore | scoreBadge).label">
                <circle cx="22" cy="22" r="16" fill="none"
                        stroke="rgba(255,255,255,0.08)" stroke-width="3.5"/>
                <circle cx="22" cy="22" r="16" fill="none"
                  [attr.stroke]="(lead.leadScore | scoreBadge).color"
                  stroke-width="3.5" stroke-linecap="round"
                  [attr.stroke-dasharray]="(lead.leadScore / 100 * 100.53) + ' 100.53'"
                  stroke-dashoffset="25.13"
                  transform="rotate(-90 22 22)"/>
                <text x="22" y="27" text-anchor="middle"
                  [attr.fill]="(lead.leadScore | scoreBadge).color"
                  font-size="11" font-weight="700" font-family="inherit">
                  {{ lead.leadScore }}
                </text>
              </svg>
            }
```

- [ ] **Step 5: Always show the leads paginator**

In `leads.component.html`, replace the paginator (lines 521-530):
```html
    <!-- Paginação -->
    <mat-paginator
      [length]="totalElements()"
      [pageSize]="pageSize()"
      [pageIndex]="currentPage()"
      [pageSizeOptions]="[12, 24, 48]"
      [showFirstLastButtons]="true"
      (page)="onPageChange($event)"
      [style.display]="totalElements() <= pageSize() ? 'none' : ''">
    </mat-paginator>
```
with:
```html
    <!-- Paginação -->
    <mat-paginator
      [length]="totalElements()"
      [pageSize]="pageSize()"
      [pageIndex]="currentPage()"
      [pageSizeOptions]="[12, 24, 48]"
      [showFirstLastButtons]="true"
      (page)="onPageChange($event)">
    </mat-paginator>
```

- [ ] **Step 6: Add the `.lc-categoria` chip style**

In `leads.component.scss`, add right after the `.lc-tipo` rule (after line 462, i.e. after the closing `}` of `.lc-tipo`):
```scss
.lc-categoria {
  font-size: 9px; font-weight: 800; border-radius: 4px; padding: 1px 6px;
  text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap;
}
```

- [ ] **Step 7: Manual verification**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npm start`
Open `/leads` in the browser. Expected: each of the 6 status tabs shows cards with a distinct left-border color; leads that have a `leadCategoriaPrincipal` show a colored chip in the meta row; the paginator is visible even when there are fewer leads than the page size; leads with `leadScore` show the donut with the correct color for their score range.

- [ ] **Step 8: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
git add src/app/features/leads/leads.component.ts \
        src/app/features/leads/leads.component.html \
        src/app/features/leads/leads.component.scss
git commit -m "fix: corrige CSS de status, reusa ScoreBadgePipe, adiciona chip de categoria e paginator sempre visivel em leads"
```

---

### Task 6: Frontend — `pipeline.component`: corrige bug de score nulo, adiciona chip de categoria

**Files:**
- Modify: `licitacao_auto_angular/src/app/features/pipeline/pipeline.component.ts`
- Modify: `licitacao_auto_angular/src/app/features/pipeline/pipeline.component.html:82-101`
- Modify: `licitacao_auto_angular/src/app/features/pipeline/pipeline.component.scss` (add `.kcard-categoria`, after `.src` rule)

**Interfaces:**
- Consumes: `ScoreBadgePipe`, `LeadCategoriaPipe` (same as Task 5).

- [ ] **Step 1: Import the pipes**

In `pipeline.component.ts`, add after `import { TruncatePipe } from '../../shared/pipes/truncate.pipe';` (line 23):
```typescript
import { ScoreBadgePipe } from '../../shared/pipes/score-badge.pipe';
import { LeadCategoriaPipe } from '../../shared/pipes/lead-categoria.pipe';
```
Add both to the `imports: [...]` array of the `@Component` decorator.

- [ ] **Step 2: Fix the null-score bug and add the categoria chip**

In `pipeline.component.html`, replace lines 82-101:
```html
              @for (lead of col.leads; track lead.uuid) {
                <div class="kcard" cdkDrag [cdkDragData]="lead"
                     role="button" tabindex="0"
                     [attr.aria-label]="'Ver detalhes do lead: ' + lead.titulo"
                     [class.just-dropped]="justDroppedId() === lead.uuid"
                     [style.--score-color]="(lead.leadScore ?? 0) >= 70 ? 'var(--score-hot)' : (lead.leadScore ?? 0) >= 40 ? 'var(--status-pendente)' : 'var(--color-info)'"
                     (click)="openLeadDetalhe(lead)"
                     (keydown.enter)="openLeadDetalhe(lead)"
                     (keydown.space)="openLeadDetalhe(lead)">
                  <div class="kcard-placeholder" *cdkDragPlaceholder></div>

                  <!-- Edital link + source + date + drag -->
                  <div class="kcard-meta">
                    <span class="edital-link-dot" [class.linked]="lead.editalId"
                          [matTooltip]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"
                          [attr.aria-label]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"></span>
                    <span class="src src-{{ lead.fonte?.toLowerCase() }}"
                          aria-hidden="true">{{ lead.fonte }}</span>
                    <span class="kcard-date" aria-hidden="true">{{ formatDate(lead.dataPublicacao) }}</span>
                    <mat-icon class="kcard-drag" aria-hidden="true" aria-label="">drag_indicator</mat-icon>
                  </div>
```
with:
```html
              @for (lead of col.leads; track lead.uuid) {
                <div class="kcard" cdkDrag [cdkDragData]="lead"
                     role="button" tabindex="0"
                     [attr.aria-label]="'Ver detalhes do lead: ' + lead.titulo"
                     [class.just-dropped]="justDroppedId() === lead.uuid"
                     [style.--score-color]="lead.leadScore != null ? (lead.leadScore | scoreBadge).color : null"
                     (click)="openLeadDetalhe(lead)"
                     (keydown.enter)="openLeadDetalhe(lead)"
                     (keydown.space)="openLeadDetalhe(lead)">
                  <div class="kcard-placeholder" *cdkDragPlaceholder></div>

                  <!-- Edital link + source + date + drag -->
                  <div class="kcard-meta">
                    <span class="edital-link-dot" [class.linked]="lead.editalId"
                          [matTooltip]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"
                          [attr.aria-label]="lead.editalId ? 'Edital vinculado com sucesso' : 'Edital ainda não vinculado'"></span>
                    <span class="src src-{{ lead.fonte?.toLowerCase() }}"
                          aria-hidden="true">{{ lead.fonte }}</span>
                    @if (!(lead.leadCategoriaPrincipal | leadCategoria).hidden) {
                      <span class="kcard-categoria"
                            [style.background]="(lead.leadCategoriaPrincipal | leadCategoria).color + '1A'"
                            [style.color]="(lead.leadCategoriaPrincipal | leadCategoria).color">
                        {{ (lead.leadCategoriaPrincipal | leadCategoria).label }}
                      </span>
                    }
                    <span class="kcard-date" aria-hidden="true">{{ formatDate(lead.dataPublicacao) }}</span>
                    <mat-icon class="kcard-drag" aria-hidden="true" aria-label="">drag_indicator</mat-icon>
                  </div>
```

- [ ] **Step 3: Add the `.kcard-categoria` chip style**

In `pipeline.component.scss`, add right after the `.src { ... }` block (after line 176):
```scss
.kcard-categoria {
  font-size: 9px; font-weight: 800; border-radius: 4px;
  padding: 1px 6px; text-transform: uppercase; letter-spacing: 0.07em;
  white-space: nowrap;
}
```

- [ ] **Step 4: Manual verification**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npm start`
Open `/pipeline`, tab "Qualificação". Expected: cards with `leadScore == null` show the column's default border color (not blue/"cold"); cards with a `leadScore` show the correct hot/warm/cold border color; cards with `leadCategoriaPrincipal` show the categoria chip in the meta row.

- [ ] **Step 5: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
git add src/app/features/pipeline/pipeline.component.ts \
        src/app/features/pipeline/pipeline.component.html \
        src/app/features/pipeline/pipeline.component.scss
git commit -m "fix: corrige cor de score nula e adiciona chip de categoria no kanban do pipeline"
```

---

## Self-Review

**Spec coverage:** Task 1-3 cover backend §2.1-2.3 (fields, central classification, PNCP copy). Task 4 covers frontend §3.1 (model) and the `ScoreBadgePipe` reuse groundwork. Task 5 covers §3.4 (status CSS), §3.5 (categoria chip), §3.6 (paginator), and part of §3.2. Task 6 covers §3.2/3.3 (pipeline score bug + chip). All spec sections have a corresponding task.

**Deviation from spec, called out explicitly:** the spec (`2026-07-17-lead-visual-indicators-design.md`, §2.3) proposed a new `classify(String titulo, String orgao, String tipo, String numero)` overload on `ConfiguracaoAnaliseService`. Reading the actual implementation showed `tipo`/`numero` aren't used by any rule evaluation, and rule types `FAIXA_VALOR`/`PRAZO_MIN_MAX`/`MODALIDADE_PERMITIDA`/`KEYWORD_ITEM` need `Edital`-only fields (`valorEstimado`, `prazoExecucaoDias`, `modalidade`, `itens`) that reading them from a raw-args overload would just hardcode to null anyway. Building a **transient `Edital`** and calling the existing `classify(Edital)` unchanged achieves the identical behavior (those rule types no-op safely on null/empty fields, verified by reading `ConfiguracaoAnaliseService.valorNaFaixa/prazoNaFaixa/modalidadePermitida/avaliarKeywordItem`) with zero changes to the classification engine. This plan implements the transient-`Edital` approach instead of the spec's overload.

**Placeholder scan:** no TBD/TODO; every step has complete, runnable code.

**Type consistency:** `Lead.leadScore`/`leadCategoriaPrincipal` (Task 1) match the names used in `LeadServiceImpl.classificar()` (Task 2), `PncpPersistService.criarLead()` (Task 3), and the frontend `Lead` model (Task 4). `ScoreBadgePipe`/`LeadCategoriaPipe` names and `transform()` return shapes are identical across Task 5 and Task 6.
