import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{icon}}</mat-icon>
      <h3>{{title}}</h3>
      <p>{{message}}</p>
      @if (actionText) {
        <button mat-flat-button color="primary" (click)="action.emit()">
          {{actionText}}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--text-muted, #64748B);
      opacity: 0.4;
    }

    h3 {
      margin: 16px 0 8px;
      color: var(--text-primary, #0D1526);
    }

    p {
      margin: 0 0 24px;
      color: var(--text-muted, #64748B);
      max-width: 400px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nenhum item encontrado';
  @Input() message = 'Não há dados para exibir no momento.';
  @Input() actionText = '';
  @Output() action = new EventEmitter<void>();
}
