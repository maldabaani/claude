import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Priority } from '../../../core/models';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
          [ngClass]="badgeClass">
      {{ priority }}
    </span>
  `,
})
export class PriorityBadgeComponent {
  @Input() priority!: Priority;

  get badgeClass() {
    return `badge-${this.priority.toLowerCase()}`;
  }
}
