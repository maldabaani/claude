import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HlmButtonComponent } from '../hlm-button/hlm-button.component';

export interface HlmPageEvent {
  page: number;
  rows: number;
}

@Component({
  selector: 'hlm-pagination',
  standalone: true,
  imports: [CommonModule, HlmButtonComponent],
  template: `
    <div class="flex items-center justify-between gap-4 px-2 py-3 text-sm text-gray-500">
      <span>{{ rangeLabel() }}</span>
      <div class="flex items-center gap-1">
        <button hlmButton variant="outline" size="sm" [disabled]="page === 0" (click)="goTo(page - 1)">
          <i class="pi pi-chevron-left text-xs"></i>
        </button>
        <span class="px-2 text-gray-700">{{ page + 1 }} / {{ totalPages() }}</span>
        <button hlmButton variant="outline" size="sm" [disabled]="page >= totalPages() - 1" (click)="goTo(page + 1)">
          <i class="pi pi-chevron-right text-xs"></i>
        </button>
      </div>
    </div>
  `,
})
export class HlmPaginationComponent {
  @Input() page = 0;
  @Input() rows = 10;
  @Input() totalRecords = 0;
  @Output() pageChange = new EventEmitter<HlmPageEvent>();

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / Math.max(1, this.rows)));
  }

  rangeLabel(): string {
    if (this.totalRecords === 0) return '0 results';
    const start = this.page * this.rows + 1;
    const end = Math.min(this.totalRecords, (this.page + 1) * this.rows);
    return `${start}-${end} of ${this.totalRecords}`;
  }

  goTo(page: number) {
    if (page < 0 || page > this.totalPages() - 1) return;
    this.pageChange.emit({ page, rows: this.rows });
  }
}
