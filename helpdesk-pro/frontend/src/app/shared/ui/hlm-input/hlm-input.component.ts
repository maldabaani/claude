import { Directive, Input, computed, signal } from '@angular/core';
import { hlm } from '../../utils/hlm';

@Directive({
  selector: 'input[hlmInput], textarea[hlmInput]',
  standalone: true,
  host: {
    '[class]': '_class()',
  },
})
export class HlmInputDirective {
  private readonly _userClass = signal<string>('');
  @Input('class') set class(value: string) {
    this._userClass.set(value ?? '');
  }

  protected readonly _class = computed(() =>
    hlm(
      'flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
      this._userClass(),
    ),
  );
}
