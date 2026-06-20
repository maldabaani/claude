import { Component, Input, computed, signal } from '@angular/core';
import { hlm } from '../../utils/hlm';

@Component({
  selector: 'hlm-card',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[class]': '_class()',
  },
})
export class HlmCardComponent {
  private readonly _userClass = signal('');
  @Input() set class(v: string) { this._userClass.set(v); }

  protected readonly _class = computed(() =>
    hlm('block rounded-xl border border-gray-100 bg-white shadow-sm', this._userClass()),
  );
}

@Component({
  selector: 'hlm-card-header',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'flex flex-col gap-1 p-5 pb-3' },
})
export class HlmCardHeaderComponent {}

@Component({
  selector: 'hlm-card-title',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'text-sm font-bold text-gray-900' },
})
export class HlmCardTitleComponent {}

@Component({
  selector: 'hlm-card-content',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'block p-5 pt-0' },
})
export class HlmCardContentComponent {}
