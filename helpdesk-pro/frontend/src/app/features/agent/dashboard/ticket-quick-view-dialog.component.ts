import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Ticket } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HlmBadgeComponent } from '../../../shared/ui/hlm-badge/hlm-badge.component';
import { HlmButtonComponent } from '../../../shared/ui/hlm-button/hlm-button.component';
import { HlmDialogContentComponent, HlmDialogHeaderComponent, HlmDialogTitleComponent } from '../../../shared/ui/hlm-dialog/hlm-dialog.component';

@Component({
  selector: 'app-ticket-quick-view-dialog',
  standalone: true,
  imports: [
    CommonModule, RouterLink, StatusBadgeComponent, HlmBadgeComponent, HlmButtonComponent,
    HlmDialogHeaderComponent, HlmDialogTitleComponent, HlmDialogContentComponent,
  ],
  template: `
    <hlm-dialog-header>
      <hlm-dialog-title>{{ ticket.ticketNumber }}</hlm-dialog-title>
      <button hlmButton variant="ghost" size="icon" (click)="close()">
        <i class="pi pi-times"></i>
      </button>
    </hlm-dialog-header>
    <hlm-dialog-content class="space-y-4">
      <div>
        <h3 class="text-lg font-bold text-gray-900">{{ ticket.title }}</h3>
        <p class="text-sm text-slate-500 mt-1 line-clamp-3">{{ ticket.description }}</p>
      </div>
      <div class="flex items-center gap-2">
        <hlm-badge variant="default">{{ ticket.priority }}</hlm-badge>
        <app-status-badge [status]="ticket.status" />
      </div>
      <a hlmButton [routerLink]="['/agent/tickets', ticket.id]" (click)="close()" class="w-full justify-center">
        Open Full Ticket
      </a>
    </hlm-dialog-content>
  `,
})
export class TicketQuickViewDialogComponent {
  ticket: Ticket;

  constructor(
    @Inject(DIALOG_DATA) data: { ticket: Ticket },
    private dialogRef: DialogRef,
  ) {
    this.ticket = data.ticket;
  }

  close() {
    this.dialogRef.close();
  }
}
