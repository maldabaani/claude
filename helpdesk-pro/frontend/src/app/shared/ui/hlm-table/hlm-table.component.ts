import { Component, Input, computed, signal } from '@angular/core';
import { hlm } from '../../utils/hlm';

@Component({
  selector: 'hlm-table',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'block w-full' },
})
export class HlmTableComponent {}

@Component({
  selector: 'hlm-trow, [hlmTrow]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[class]': '_class()',
  },
})
export class HlmTrowComponent {
  private readonly _userClass = signal('');
  @Input() set class(v: string) { this._userClass.set(v); }
  protected readonly _class = computed(() =>
    hlm('grid items-center gap-4 transition-colors duration-150', this._userClass()),
  );
}

@Component({
  selector: 'hlm-th',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'text-xs font-bold text-slate-400 uppercase tracking-wider' },
})
export class HlmThComponent {}

@Component({
  selector: 'hlm-td',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'text-sm text-gray-900' },
})
export class HlmTdComponent {}
