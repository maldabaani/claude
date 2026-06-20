import { Component } from '@angular/core';

@Component({
  selector: 'hlm-dialog-header',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'flex items-center justify-between px-6 py-4 border-b border-gray-100' },
})
export class HlmDialogHeaderComponent {}

@Component({
  selector: 'hlm-dialog-title',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'text-base font-bold text-gray-900' },
})
export class HlmDialogTitleComponent {}

@Component({
  selector: 'hlm-dialog-content',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'block p-6' },
})
export class HlmDialogContentComponent {}
