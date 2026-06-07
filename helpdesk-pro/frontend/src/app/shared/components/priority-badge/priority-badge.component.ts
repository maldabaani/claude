import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Priority } from '../../../core/models';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide whitespace-nowrap"
          [ngClass]="badgeClass">
      <mat-icon [ngClass]="iconClass" style="font-size:11px;width:11px;height:11px">{{ icon }}</mat-icon>
      {{ priority }}
    </span>
  `,
})
export class PriorityBadgeComponent {
  @Input() priority!: Priority;

  get badgeClass(): string {
    return `badge-${this.priority.toLowerCase()}`;
  }

  get icon(): string {
    const map: Record<Priority, string> = {
      LOW: 'arrow_downward',
      MEDIUM: 'remove',
      HIGH: 'arrow_upward',
      CRITICAL: 'priority_high',
    };
    return map[this.priority] || 'remove';
  }

  get iconClass(): string {
    const map: Record<Priority, string> = {
      LOW: 'text-slate-400',
      MEDIUM: 'text-blue-600',
      HIGH: 'text-orange-600',
      CRITICAL: 'text-red-700',
    };
    return map[this.priority] || 'text-gray-400';
  }
}
