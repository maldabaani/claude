import { Directive, Input, computed, signal } from '@angular/core';
import { hlm } from '../../utils/hlm';

@Directive({
  selector: 'select[hlmSelect]',
  standalone: true,
  host: {
    '[class]': '_class()',
  },
})
export class HlmSelectDirective {
  private readonly _userClass = signal<string>('');
  @Input('class') set class(value: string) {
    this._userClass.set(value ?? '');
  }

  protected readonly _class = computed(() =>
    hlm(
      'h-9 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
      this._userClass(),
    ),
  );
}
