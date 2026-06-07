import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketStatus } from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          [ngClass]="badgeClass">
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status!: TicketStatus;

  get label() {
    return this.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get badgeClass() {
    return `badge-${this.status.toLowerCase().replace('_', '-')}`;
  }

  get dotClass() {
    const map: Record<TicketStatus, string> = {
      NEW: 'bg-blue-500', OPEN: 'bg-indigo-500', PENDING: 'bg-yellow-500',
      ON_HOLD: 'bg-slate-400', RESOLVED: 'bg-green-500', CLOSED: 'bg-slate-500'
    };
    return map[this.status] || 'bg-gray-400';
  }
}
