import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (isLoading()) {
      <div class="loading-overlay" [class.fullscreen]="fullscreen">
        <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
        @if (message) {
          <p class="loading-message">{{message}}</p>
        }
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(2px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 1000;

      &.fullscreen {
        position: fixed;
        background: var(--mat-sys-surface);
      }
    }

    .loading-message {
      color: var(--mat-sys-on-surface);
      font-size: 14px;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() isLoading = signal(false);
  @Input() message = '';
  @Input() diameter = 50;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() fullscreen = false;
}
