import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JustificativaDialogComponent } from './justificativa-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

const dialogRefStub = { close: vi.fn() };

describe('JustificativaDialogComponent', () => {
  let component: JustificativaDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JustificativaDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: { titulo: 'Mover para Novos Leads' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(JustificativaDialogComponent);
    component = fixture.componentInstance;
    dialogRefStub.close.mockClear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('valido is false when texto has less than 10 chars', () => {
    component.texto = 'curto';
    expect(component.valido).toBeFalsy();
  });

  it('valido is false when texto is empty', () => {
    component.texto = '';
    expect(component.valido).toBeFalsy();
  });

  it('valido is true when texto has exactly 10 chars', () => {
    component.texto = '1234567890';
    expect(component.valido).toBeTruthy();
  });

  it('confirmar does nothing when invalido', () => {
    component.texto = 'curto';
    component.confirmar();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('confirmar closes with trimmed text when valido', () => {
    component.texto = '  justificativa valida aqui  ';
    component.confirmar();
    expect(dialogRefStub.close).toHaveBeenCalledWith('justificativa valida aqui');
  });

  it('cancelar closes with undefined', () => {
    component.cancelar();
    expect(dialogRefStub.close).toHaveBeenCalledWith(undefined);
  });
});
