import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="stats-card" (click)="cardClick.emit()">
      <mat-card-content>
        <div class="stats-icon" [style.color]="iconColor">
          <mat-icon>{{icon}}</mat-icon>
        </div>
        <div class="stats-content">
          <div class="stats-value">{{value | number}}</div>
          <div class="stats-label">{{label}}</div>
          @if (trend !== undefined) {
            <div class="stats-trend" [class.positive]="trend > 0" [class.negative]="trend < 0">
              <mat-icon>{{trend > 0 ? 'trending_up' : trend < 0 ? 'trending_down' : 'trending_flat'}}</mat-icon>
              <span>{{trend > 0 ? '+' : ''}}{{trend}}%</span>
            </div>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stats-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }
    }

    mat-card-content {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 24px !important;
    }

    .stats-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;

      mat-icon {
        font-size: inherit;
        width: inherit;
        height: inherit;
      }
    }

    .stats-content {
      flex: 1;
    }

    .stats-value {
      font-size: 32px;
      font-weight: 500;
      line-height: 1;
    }

    .stats-label {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .stats-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 12px;

      &.positive { color: var(--color-success); }
      &.negative { color: var(--color-error); }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
  `]
})
export class StatsCardComponent {
  @Input() icon = 'assessment';
  @Input() value: number | string = 0;
  @Input() label = '';
  @Input() trend?: number;
  @Input() iconColor = 'var(--mat-sys-primary)';
  @Output() cardClick = new EventEmitter<void>();
}
