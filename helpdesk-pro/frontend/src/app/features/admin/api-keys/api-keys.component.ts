import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { ApiKeyService, ApiKey, GeneratedApiKey } from '../../../core/services/api-key.service';

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
    InputTextModule, TagModule, ToastModule, DatePickerModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">API Keys</h1>
          <p class="text-sm text-slate-400 mt-0.5">Manage API keys for external integrations</p>
        </div>
        <button pButton (click)="openCreate()"
                class="!rounded-xl !font-semibold" style="height:40px">
          <i class="pi pi-plus mr-2"></i>Generate Key
        </button>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <p-table [value]="apiKeys()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Prefix</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-key>
            <tr>
              <td class="font-semibold text-gray-900">{{ key.name }}</td>
              <td><span class="font-mono text-sm text-slate-500">{{ key.keyPrefix }}...</span></td>
              <td class="text-sm text-slate-500">{{ key.createdAt | date:'MMM d, y' }}</td>
              <td class="text-sm text-slate-500">{{ key.lastUsedAt ? (key.lastUsedAt | date:'MMM d, y') : 'Never' }}</td>
              <td class="text-sm text-slate-500">{{ key.expiresAt ? (key.expiresAt | date:'MMM d, y') : 'Never' }}</td>
              <td>
                <span [class]="key.active ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'"
                      class="text-xs px-2 py-0.5 rounded-full font-medium border">
                  {{ key.active ? 'Active' : 'Revoked' }}
                </span>
              </td>
              <td>
                <button *ngIf="key.active" pButton severity="danger" size="small"
                        (click)="revokeKey(key)"
                        class="!rounded-lg" title="Revoke">
                  <i class="pi pi-ban mr-1"></i>Revoke
                </button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center py-12 text-slate-400">
                <i class="pi pi-key block mb-2" style="font-size:32px"></i>
                No API keys yet
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Generate Dialog -->
    <p-dialog [(visible)]="showCreateDialog" [modal]="true" header="Generate API Key"
              [style]="{width:'440px'}" [draggable]="false">
      <div class="space-y-4 pt-2">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
          <input pInputText [(ngModel)]="newKeyName" class="w-full" placeholder="e.g. My Integration" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Expires At (optional)</label>
          <p-datepicker [(ngModel)]="newKeyExpiry" [showIcon]="true" dateFormat="mm/dd/yy"
                        placeholder="Never" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton severity="secondary" (click)="showCreateDialog = false" class="!rounded-xl">Cancel</button>
        <button pButton (click)="generateKey()" [disabled]="generating() || !newKeyName" class="!rounded-xl !font-semibold">
          {{ generating() ? 'Generating...' : 'Generate Key' }}
        </button>
      </ng-template>
    </p-dialog>

    <!-- Show Key Dialog -->
    <p-dialog [(visible)]="showKeyDialog" [modal]="true" header="Your New API Key"
              [style]="{width:'520px'}" [draggable]="false" [closable]="false">
      <div class="space-y-4 pt-2">
        <div class="p-4 rounded-xl border" style="background:#FFF7ED;border-color:#FED7AA">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-exclamation-triangle" style="color:#EA580C;font-size:18px"></i>
            <span class="font-semibold text-orange-800 text-sm">Store this key securely</span>
          </div>
          <p class="text-orange-700 text-sm">This key will not be shown again. Copy it now.</p>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">API Key</label>
          <div class="flex gap-2">
            <input pInputText [value]="generatedKey()" readonly class="w-full font-mono text-sm" />
            <button pButton severity="secondary" (click)="copyKey()" class="!rounded-xl shrink-0">
              <i class="pi pi-copy mr-1"></i>Copy
            </button>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton (click)="showKeyDialog = false" class="!rounded-xl !font-semibold">
          I've Saved My Key
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class ApiKeysComponent implements OnInit {
  apiKeys = signal<ApiKey[]>([]);
  loading = signal(true);
  generating = signal(false);
  showCreateDialog = false;
  showKeyDialog = false;
  generatedKey = signal('');
  newKeyName = '';
  newKeyExpiry: Date | null = null;

  constructor(private apiKeyService: ApiKeyService, private msg: MessageService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.apiKeyService.getAll().subscribe({
      next: keys => { this.apiKeys.set(keys); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.newKeyName = '';
    this.newKeyExpiry = null;
    this.showCreateDialog = true;
  }

  generateKey() {
    if (!this.newKeyName) return;
    this.generating.set(true);
    const expiresAt = this.newKeyExpiry ? this.newKeyExpiry.toISOString() : undefined;
    this.apiKeyService.generate(this.newKeyName, expiresAt).subscribe({
      next: (result: GeneratedApiKey) => {
        this.generating.set(false);
        this.showCreateDialog = false;
        this.generatedKey.set(result.key);
        this.showKeyDialog = true;
        this.load();
      },
      error: () => {
        this.generating.set(false);
        this.msg.add({ severity: 'error', summary: 'Failed to generate key', life: 3000 });
      },
    });
  }

  copyKey() {
    navigator.clipboard.writeText(this.generatedKey()).then(() => {
      this.msg.add({ severity: 'success', summary: 'Copied to clipboard!', life: 2000 });
    });
  }

  revokeKey(key: ApiKey) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    this.apiKeyService.revoke(key.id).subscribe({
      next: () => {
        this.load();
        this.msg.add({ severity: 'success', summary: 'Key revoked', life: 3000 });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to revoke', life: 3000 }),
    });
  }
}
