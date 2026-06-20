import { Directive, Input, computed, signal } from '@angular/core';
import { hlm } from '../../utils/hlm';

@Directive({
  selector: 'input[type=checkbox][hlmCheckbox]',
  standalone: true,
  host: {
    '[class]': '_class()',
  },
})
export class HlmCheckboxDirective {
  private readonly _userClass = signal<string>('');
  @Input('class') set class(value: string) {
    this._userClass.set(value ?? '');
  }

  protected readonly _class = computed(() =>
    hlm(
      'h-4 w-4 rounded border-gray-300 text-primary-600 shadow-sm focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer',
      this._userClass(),
    ),
  );
}
