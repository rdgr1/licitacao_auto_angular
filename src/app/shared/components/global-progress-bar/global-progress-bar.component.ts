import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';

@Component({
  selector: 'app-global-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasAnyActive()) {
      <div class="global-progress-bar">
        <div class="global-progress-bar-fill"></div>
      </div>
    }
  `,
  styles: [
    `
      .global-progress-bar {
        height: 3px;
        width: 100%;
        background: var(--border, #e2e8f0);
        overflow: hidden;
        flex-shrink: 0;
      }
      .global-progress-bar-fill {
        height: 100%;
        border-radius: 4px;
        background: linear-gradient(90deg, #11bf7f 0%, #3b82f6 50%, #11bf7f 100%);
        background-size: 200% 100%;
        animation: global-bar-shimmer 2s linear infinite;
      }
      @keyframes global-bar-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: 0 0;
        }
      }
    `,
  ],
})
export class GlobalProgressBarComponent {
  readonly tracker = inject(OperationTrackerService);
  readonly hasAnyActive = this.tracker.hasAnyActive();
}
