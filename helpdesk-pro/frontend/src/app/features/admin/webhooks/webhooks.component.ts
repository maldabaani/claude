import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { WebhookService, Webhook, WebhookRequest } from '../../../core/services/webhook.service';

@Component({
  selector: 'app-webhooks',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
    InputTextModule, ToggleSwitchModule, CheckboxModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Webhooks</h1>
          <p class="text-sm text-slate-400 mt-0.5">Send HTTP notifications to external services on ticket events</p>
        </div>
        <button pButton (click)="openCreate()"
                class="!rounded-xl !font-semibold" style="height:40px">
          <i class="pi pi-plus mr-2"></i>Add Webhook
        </button>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <p-table [value]="webhooks()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Events</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-wh>
            <tr>
              <td class="font-semibold text-gray-900">{{ wh.name }}</td>
              <td>
                <span class="text-sm text-slate-500 font-mono">{{ truncate(wh.url) }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let ev of wh.events.split(',')"
                        class="text-xs px-2 py-0.5 rounded-full font-medium"
                        style="background:#EEF2FF;color:#4338CA">{{ ev.trim() }}</span>
                </div>
              </td>
              <td>
                <p-toggle-switch [(ngModel)]="wh.active" (onChange)="toggleActive(wh)" />
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <button pButton severity="secondary" size="small"
                          (click)="testWebhook(wh)"
                          class="!rounded-lg" title="Send test event">
                    <i class="pi pi-send"></i>
                  </button>
                  <button pButton severity="danger" size="small"
                          (click)="deleteWebhook(wh)"
                          class="!rounded-lg" title="Delete">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center py-12 text-slate-400">
                <i class="pi pi-link block mb-2" style="font-size:32px"></i>
                No webhooks configured yet
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <p-dialog [(visible)]="showDialog" [modal]="true" header="Add Webhook"
              [style]="{width:'520px'}" [draggable]="false">
      <div class="space-y-4 pt-2">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="My Webhook" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">URL *</label>
          <input pInputText [(ngModel)]="form.url" class="w-full" placeholder="https://example.com/webhook" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Secret (optional)</label>
          <input pInputText [(ngModel)]="form.secret" class="w-full" placeholder="Signing secret" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Events</label>
          <div class="space-y-2">
            <div *ngFor="let ev of availableEvents" class="flex items-center gap-2">
              <p-checkbox [inputId]="'ev-' + ev.value" [value]="ev.value"
                          [(ngModel)]="selectedEvents" />
              <label [for]="'ev-' + ev.value" class="text-sm text-gray-700 cursor-pointer">{{ ev.label }}</label>
            </div>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton severity="secondary" (click)="showDialog = false" class="!rounded-xl">Cancel</button>
        <button pButton (click)="save()" [disabled]="saving()" class="!rounded-xl !font-semibold">
          {{ saving() ? 'Saving...' : 'Save Webhook' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class WebhooksComponent implements OnInit {
  webhooks = signal<Webhook[]>([]);
  loading = signal(true);
  saving = signal(false);
  showDialog = false;

  form: { name: string; url: string; secret: string } = { name: '', url: '', secret: '' };
  selectedEvents: string[] = ['ticket.created', 'ticket.updated', 'comment.added'];

  availableEvents = [
    { value: 'ticket.created', label: 'Ticket Created' },
    { value: 'ticket.updated', label: 'Ticket Updated' },
    { value: 'comment.added', label: 'Comment Added' },
  ];

  constructor(private webhookService: WebhookService, private msg: MessageService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.webhookService.getAll().subscribe({
      next: wh => { this.webhooks.set(wh); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.form = { name: '', url: '', secret: '' };
    this.selectedEvents = ['ticket.created', 'ticket.updated', 'comment.added'];
    this.showDialog = true;
  }

  save() {
    if (!this.form.name || !this.form.url) return;
    this.saving.set(true);
    const req: WebhookRequest = {
      name: this.form.name,
      url: this.form.url,
      secret: this.form.secret || undefined,
      events: this.selectedEvents.join(','),
      active: true,
    };
    this.webhookService.create(req).subscribe({
      next: wh => {
        this.webhooks.update(list => [...list, wh]);
        this.saving.set(false);
        this.showDialog = false;
        this.msg.add({ severity: 'success', summary: 'Webhook created', life: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.msg.add({ severity: 'error', summary: 'Failed to create webhook', life: 3000 });
      },
    });
  }

  toggleActive(wh: Webhook) {
    this.webhookService.update(wh.id, {
      name: wh.name, url: wh.url, events: wh.events, active: wh.active
    }).subscribe({
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to update', life: 3000 }),
    });
  }

  testWebhook(wh: Webhook) {
    this.webhookService.test(wh.id).subscribe({
      next: () => this.msg.add({ severity: 'success', summary: 'Test event sent!', life: 3000 }),
      error: () => this.msg.add({ severity: 'error', summary: 'Test failed', life: 3000 }),
    });
  }

  deleteWebhook(wh: Webhook) {
    if (!confirm('Delete this webhook?')) return;
    this.webhookService.delete(wh.id).subscribe({
      next: () => {
        this.webhooks.update(list => list.filter(w => w.id !== wh.id));
        this.msg.add({ severity: 'success', summary: 'Deleted', life: 3000 });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to delete', life: 3000 }),
    });
  }

  truncate(url: string) {
    return url.length > 50 ? url.substring(0, 50) + '...' : url;
  }
}
