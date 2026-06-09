import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
})
export class PaginatorComponent {
  @Input() page = 0;            // 0-indexed
  @Input() totalPages = 1;
  @Input() totalElements?: number;
  @Input() pageSize?: number;

  @Output() pageChange = new EventEmitter<number>();

  prev(): void {
    if (this.page > 0) this.pageChange.emit(this.page - 1);
  }

  next(): void {
    if (this.page + 1 < this.totalPages) this.pageChange.emit(this.page + 1);
  }
}
