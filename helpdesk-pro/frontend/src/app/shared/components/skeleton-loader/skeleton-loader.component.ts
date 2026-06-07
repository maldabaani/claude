import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="type === 'table'" class="px-2">
      <div *ngFor="let i of rows" class="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0">
        <div class="skeleton h-4 rounded-md w-24 shrink-0"></div>
        <div class="skeleton h-4 rounded-md flex-1"></div>
        <div class="skeleton h-5 rounded-full w-20 shrink-0"></div>
        <div class="skeleton h-5 rounded-full w-16 shrink-0"></div>
        <div class="skeleton h-4 rounded-md w-14 shrink-0"></div>
      </div>
    </div>
    <div *ngIf="type === 'card'" class="p-6 space-y-3">
      <div class="skeleton h-5 rounded-md w-1/3"></div>
      <div class="skeleton h-4 rounded-md w-2/3"></div>
      <div class="skeleton h-4 rounded-md w-1/2"></div>
    </div>
    <div *ngIf="type === 'text'" class="space-y-2.5">
      <div class="skeleton h-4 rounded-md w-full"></div>
      <div class="skeleton h-4 rounded-md w-5/6"></div>
      <div class="skeleton h-4 rounded-md w-4/6"></div>
    </div>
  `,
})
export class SkeletonLoaderComponent {
  @Input() type: 'table' | 'card' | 'text' = 'table';
  @Input() count = 5;
  get rows() { return Array(this.count); }
}
