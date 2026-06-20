import { Component, Input, computed, signal } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { hlm } from '../../utils/hlm';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700',
        critical: 'bg-red-100 text-red-700',
        high: 'bg-orange-100 text-orange-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-gray-100 text-gray-600',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Component({
  selector: 'hlm-badge',
  standalone: true,
  template: `<ng-content />`,
  host: {
    '[class]': '_class()',
  },
})
export class HlmBadgeComponent {
  private readonly _variant = signal<BadgeVariants['variant']>('default');
  private readonly _userClass = signal('');

  @Input() set variant(v: BadgeVariants['variant']) { this._variant.set(v); }
  @Input() set class(v: string) { this._userClass.set(v); }

  protected readonly _class = computed(() =>
    hlm(badgeVariants({ variant: this._variant() }), this._userClass()),
  );
}
