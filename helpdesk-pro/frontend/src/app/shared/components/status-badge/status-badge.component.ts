import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketStatus } from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
          [ngClass]="badgeClass">
      <span class="w-1.5 h-1.5 rounded-full shrink-0" [ngClass]="dotClass"></span>
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status!: TicketStatus;

  get label(): string {
    return this.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  get badgeClass(): string {
    return `badge-${this.status.toLowerCase().replace('_', '-')}`;
  }

  get dotClass(): string {
    const map: Record<TicketStatus, string> = {
      NEW: 'bg-blue-500',
      OPEN: 'bg-indigo-500',
      PENDING: 'bg-amber-500',
      ON_HOLD: 'bg-slate-400',
      RESOLVED: 'bg-green-500',
      CLOSED: 'bg-slate-400',
      SNOOZED: 'bg-amber-300',
    };
    return map[this.status] || 'bg-gray-400';
  }
}
