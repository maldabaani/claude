import { Component, Input, computed, signal } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { hlm } from '../../utils/hlm';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ' +
    'transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        outline: 'border border-gray-200 bg-white text-gray-900 hover:bg-surface-2',
        ghost: 'text-gray-600 hover:bg-surface-2 hover:text-gray-900',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-xs',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Component({
  selector: 'hlm-button, [hlmButton]',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[class]': '_class()',
  },
})
export class HlmButtonComponent {
  private readonly _variant = signal<ButtonVariants['variant']>('default');
  private readonly _size = signal<ButtonVariants['size']>('default');
  private readonly _userClass = signal('');

  @Input() set variant(v: ButtonVariants['variant']) { this._variant.set(v); }
  @Input() set size(v: ButtonVariants['size']) { this._size.set(v); }
  @Input() set class(v: string) { this._userClass.set(v); }

  protected readonly _class = computed(() =>
    hlm(buttonVariants({ variant: this._variant(), size: this._size() }), this._userClass()),
  );
}
