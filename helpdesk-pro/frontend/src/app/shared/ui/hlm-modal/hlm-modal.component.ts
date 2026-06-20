import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'hlm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 hlm-dialog-backdrop" (click)="closable && close()"></div>
      <div class="relative hlm-dialog-panel flex flex-col" [style.width]="width" style="max-height:calc(100vh - 4rem)">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 class="font-bold text-gray-900 text-sm">{{ header }}</h3>
          <button type="button" class="text-gray-400 hover:text-gray-600 transition-colors" (click)="close()" *ngIf="closable">
            <i class="pi pi-times" style="font-size:14px"></i>
          </button>
        </div>
        <div class="overflow-y-auto">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class HlmModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() header = '';
  @Input() width = '420px';
  @Input() closable = true;

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
