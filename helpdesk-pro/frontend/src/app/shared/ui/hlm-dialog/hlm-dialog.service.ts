import { Injectable, Type } from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import gsap from 'gsap';

@Injectable({ providedIn: 'root' })
export class HlmDialogService {
  constructor(private dialog: Dialog) {}

  /**
   * Opens a CDK dialog with a GSAP scale+fade transition instead of the
   * browser default. Animates the panel in on open and out before close.
   */
  open<T>(component: ComponentType<T> | Type<T>, options?: { data?: unknown }): DialogRef<unknown, T> {
    const ref: DialogRef<unknown, T> = this.dialog.open(component as ComponentType<T>, {
      panelClass: 'hlm-dialog-panel',
      backdropClass: 'hlm-dialog-backdrop',
      data: options?.data,
    });

    queueMicrotask(() => {
      const panel = document.querySelector('.hlm-dialog-panel') as HTMLElement | null;
      const backdrop = document.querySelector('.hlm-dialog-backdrop') as HTMLElement | null;
      if (panel) {
        gsap.fromTo(
          panel,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' },
        );
      }
      if (backdrop) {
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
      }
    });

    const originalClose = ref.close.bind(ref);
    ref.close = ((result?: unknown) => {
      const panel = document.querySelector('.hlm-dialog-panel') as HTMLElement | null;
      const backdrop = document.querySelector('.hlm-dialog-backdrop') as HTMLElement | null;
      if (panel) {
        gsap.to(panel, { opacity: 0, scale: 0.96, duration: 0.15, ease: 'power2.in' });
      }
      if (backdrop) {
        gsap.to(backdrop, { opacity: 0, duration: 0.15, ease: 'power2.in' });
      }
      setTimeout(() => originalClose(result), 150);
    }) as typeof ref.close;

    return ref;
  }
}
