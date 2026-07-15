import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { GlobalProgressBarComponent } from './global-progress-bar.component';
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';

describe('GlobalProgressBarComponent', () => {
  let fixture: ComponentFixture<GlobalProgressBarComponent>;
  let tracker: OperationTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GlobalProgressBarComponent] });
    fixture = TestBed.createComponent(GlobalProgressBarComponent);
    tracker = TestBed.inject(OperationTrackerService);
  });

  it('não deve renderizar a barra quando nenhuma operação estiver ativa', () => {
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.global-progress-bar');
    expect(bar).toBeNull();
  });

  it('deve renderizar a barra quando o tracker tiver uma operação ativa', () => {
    const pending = new Subject<void>();
    tracker.run('y', pending.asObservable());
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.global-progress-bar');
    expect(bar).not.toBeNull();
  });
});
