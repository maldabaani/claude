import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="type === 'table'">
      <div *ngFor="let i of rows" class="flex gap-4 py-3 border-b border-gray-100">
        <div class="skeleton h-4 w-24"></div>
        <div class="skeleton h-4 flex-1"></div>
        <div class="skeleton h-4 w-20"></div>
        <div class="skeleton h-4 w-16"></div>
      </div>
    </div>
    <div *ngIf="type === 'card'" class="p-6 space-y-3">
      <div class="skeleton h-5 w-1/3"></div>
      <div class="skeleton h-4 w-2/3"></div>
      <div class="skeleton h-4 w-1/2"></div>
    </div>
    <div *ngIf="type === 'text'" class="space-y-2">
      <div class="skeleton h-4 w-full"></div>
      <div class="skeleton h-4 w-5/6"></div>
      <div class="skeleton h-4 w-4/6"></div>
    </div>
  `,
})
export class SkeletonLoaderComponent {
  @Input() type: 'table' | 'card' | 'text' = 'table';
  @Input() count = 5;
  get rows() { return Array(this.count); }
}
