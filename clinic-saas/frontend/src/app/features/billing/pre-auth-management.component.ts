import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { CalendarModule } from 'primeng/calendar';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-pre-auth-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule, DialogModule,
    InputTextModule, InputNumberModule, InputTextareaModule,
    DropdownModule, CardModule, ToastModule, SkeletonModule, CalendarModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-container">
      <!-- Page Header -->
      <div class="board-header">
        <div>
          <h2 class="board-title">Pre-Authorization Management</h2>
          <p class="board-sub">Manage insurance pre-authorizations</p>
        </div>
        <div class="board-actions">
          <p-dropdown
            [options]="statusOptions"
            [(ngModel)]="statusFilter"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            [showClear]="true"
            styleClass="w-12rem"
            (onChange)="onStatusChange()">
          </p-dropdown>
          <button pButton icon="pi pi-refresh" class="p-button-outlined p-button-sm"
                  [loading]="loading()" (click)="load()"></button>
          <button pButton label="New Pre-Auth" icon="pi pi-plus" class="p-button-sm"
                  (click)="openNew()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      @if (!loading()) {
        <div class="summary-cards mb-4">
          <div class="summary-card">
            <div class="summary-value">{{ preauths().length }}</div>
            <div class="summary-label">Total</div>
          </div>
          <div class="summary-card summary-card--warning">
            <div class="summary-value">{{ pendingCount() }}</div>
            <div class="summary-label">Pending</div>
          </div>
          <div class="summary-card summary-card--success">
            <div class="summary-value">{{ approvedCount() }}</div>
            <div class="summary-label">Approved</div>
          </div>
          <div class="summary-card summary-card--danger">
            <div class="summary-value">{{ rejectedCount() }}</div>
            <div class="summary-label">Rejected</div>
          </div>
        </div>
      } @else {
        <div class="summary-cards mb-4">
          @for (i of [1,2,3,4]; track i) {
            <p-skeleton height="72px" borderRadius="12px" />
          }
        </div>
      }

      <!-- Pre-Auth Table -->
      <p-table
        [value]="preauths()"
        [loading]="loading()"
        styleClass="p-datatable-sm p-datatable-striped"
        responsiveLayout="scroll"
        [rowHover]="true">

        <ng-template pTemplate="header">
          <tr>
            <th>PA Number</th>
            <th>Patient ID</th>
            <th>Service Description</th>
            <th>ICD Code</th>
            <th class="text-right">Est. Amount (AED)</th>
            <th>Status</th>
            <th>Submitted At</th>
            <th>Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-pa>
          <tr>
            <td><code class="text-sm">{{ pa.preauthNumber }}</code></td>
            <td><code class="text-sm">{{ (pa.patientId || '').substring(0, 8) }}</code></td>
            <td class="font-medium" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ pa.serviceDescription }}
            </td>
            <td><code class="text-sm">{{ pa.icdCode || '—' }}</code></td>
            <td class="text-right">{{ pa.estimatedAmount | number:'1.2-2' }}</td>
            <td>
              <p-tag [value]="paStatusLabel(pa.status)"
                     [severity]="paStatusSeverity(pa.status)" />
            </td>
            <td class="text-sm" style="color:var(--text-color-secondary)">
              {{ pa.submittedAt ? (pa.submittedAt | date:'dd MMM yyyy') : '—' }}
            </td>
            <td>
              <div class="flex gap-1 align-items-center">
                @if (pa.status === 'DRAFT') {
                  <button pButton label="Submit" icon="pi pi-send"
                          class="p-button-sm p-button-primary"
                          [loading]="processing()"
                          (click)="submitPreAuth(pa)"></button>
                }
                @if (pa.status === 'SUBMITTED') {
                  <button pButton label="Process" icon="pi pi-cog"
                          class="p-button-sm p-button-warning"
                          (click)="openProcess(pa)"></button>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="text-center py-5" style="color:var(--text-color-secondary)">
              No pre-authorizations found.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- New Pre-Auth Dialog -->
    <p-dialog header="New Pre-Authorization" [(visible)]="showNew" [modal]="true"
              [style]="{width:'min(92vw,520px)'}" [draggable]="false">
      <div class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Patient ID *</label>
          <input pInputText [(ngModel)]="newForm.patientId" class="w-full"
                 placeholder="Patient UUID" />
        </div>
        <div>
          <label class="block text-sm mb-1">Insurance Policy ID</label>
          <input pInputText [(ngModel)]="newForm.insurancePolicyId" class="w-full"
                 placeholder="Policy UUID" />
        </div>
        <div>
          <label class="block text-sm mb-1">Service Description *</label>
          <textarea pInputTextarea [(ngModel)]="newForm.serviceDescription" rows="3" class="w-full"
                    placeholder="Describe the service requiring pre-authorization..."></textarea>
        </div>
        <div>
          <label class="block text-sm mb-1">ICD Code</label>
          <input pInputText [(ngModel)]="newForm.icdCode" class="w-full"
                 placeholder="e.g. M54.5" />
        </div>
        <div>
          <label class="block text-sm mb-1">Estimated Amount (AED) *</label>
          <p-inputNumber [(ngModel)]="newForm.estimatedAmount" [min]="0" [minFractionDigits]="2"
                         styleClass="w-full" placeholder="0.00" />
        </div>
        <div>
          <label class="block text-sm mb-1">Notes</label>
          <textarea pInputTextarea [(ngModel)]="newForm.notes" rows="2" class="w-full"
                    placeholder="Optional notes..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showNew.set(false)"></button>
        <button pButton label="Create" icon="pi pi-check" class="p-button-primary"
                [loading]="processing()"
                [disabled]="!newForm.patientId.trim() || !newForm.serviceDescription.trim() || newForm.estimatedAmount == null"
                (click)="createPreAuth()"></button>
      </ng-template>
    </p-dialog>

    <!-- Process Dialog -->
    <p-dialog header="Process Pre-Authorization" [(visible)]="showProcess" [modal]="true"
              [style]="{width:'min(92vw,480px)'}" [draggable]="false">
      @if (selectedPA(); as pa) {
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">PA Number</span>
          <strong>{{ pa.preauthNumber }}</strong>
        </div>
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Service</span>
          <span>{{ pa.serviceDescription }}</span>
        </div>
      }
      <div class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Decision *</label>
          <p-dropdown
            [options]="processStatusOptions"
            [(ngModel)]="processForm.status"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full"
            placeholder="Select decision">
          </p-dropdown>
        </div>

        @if (processForm.status === 'APPROVED') {
          <div>
            <label class="block text-sm mb-1">Approval Number</label>
            <input pInputText [(ngModel)]="processForm.approvalNumber" class="w-full"
                   placeholder="e.g. APPR-2024-001" />
          </div>
          <div>
            <label class="block text-sm mb-1">Valid Until</label>
            <p-calendar [(ngModel)]="processForm.validUntil" dateFormat="dd/mm/yy"
                        styleClass="w-full" [showIcon]="true" />
          </div>
        }

        @if (processForm.status === 'REJECTED') {
          <div>
            <label class="block text-sm mb-1">Rejection Reason *</label>
            <textarea pInputTextarea [(ngModel)]="processForm.rejectionReason" rows="3" class="w-full"
                      placeholder="Enter reason for rejection..."></textarea>
          </div>
        }

        <div>
          <label class="block text-sm mb-1">Notes</label>
          <textarea pInputTextarea [(ngModel)]="processForm.notes" rows="2" class="w-full"
                    placeholder="Optional notes..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showProcess.set(false)"></button>
        <button pButton label="Submit Decision" icon="pi pi-check"
                [loading]="processing()"
                [disabled]="!processForm.status || (processForm.status === 'REJECTED' && !processForm.rejectionReason.trim())"
                (click)="submitProcess()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .board-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .board-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: #1e2a45;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .board-sub {
      font-size: 0.875rem;
      color: #8a94a6;
      margin: 0.25rem 0 0;
    }
    .board-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .summary-cards { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .summary-cards { grid-template-columns: 1fr; }
    }
    .summary-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.125rem 1.25rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      border-left: 4px solid #6366f1;
    }
    .summary-card--warning { border-left-color: #f59e0b; }
    .summary-card--success { border-left-color: #10b981; }
    .summary-card--danger  { border-left-color: #ef4444; }
    .summary-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e2a45;
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    .summary-label {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .text-right { text-align: right; }
  `]
})
export class PreAuthManagementComponent implements OnInit {
  preauths   = signal<any[]>([]);
  loading    = signal(false);
  processing = signal(false);
  statusFilter: string = '';

  selectedPA  = signal<any>(null);
  showNew     = signal(false);
  showProcess = signal(false);

  newForm = {
    patientId: '',
    insurancePolicyId: '',
    serviceDescription: '',
    icdCode: '',
    estimatedAmount: null as number | null,
    notes: ''
  };

  processForm = {
    status: '',
    approvalNumber: '',
    validUntil: null as Date | null,
    rejectionReason: '',
    notes: ''
  };

  pendingCount  = computed(() => this.preauths().filter(p => p.status === 'DRAFT' || p.status === 'SUBMITTED').length);
  approvedCount = computed(() => this.preauths().filter(p => p.status === 'APPROVED').length);
  rejectedCount = computed(() => this.preauths().filter(p => p.status === 'REJECTED').length);

  statusOptions = [
    { label: 'Draft',     value: 'DRAFT' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Approved',  value: 'APPROVED' },
    { label: 'Rejected',  value: 'REJECTED' },
    { label: 'Expired',   value: 'EXPIRED' }
  ];

  processStatusOptions = [
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' }
  ];

  constructor(
    private http: HttpClient,
    private msg: MessageService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const url = this.statusFilter
      ? `/api/v1/insurance/preauth?status=${this.statusFilter}`
      : '/api/v1/insurance/preauth';
    this.http.get<any[]>(url)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.preauths.set(data);
        this.loading.set(false);
      });
  }

  onStatusChange() {
    this.load();
  }

  openNew() {
    this.newForm = {
      patientId: '',
      insurancePolicyId: '',
      serviceDescription: '',
      icdCode: '',
      estimatedAmount: null,
      notes: ''
    };
    this.showNew.set(true);
  }

  createPreAuth() {
    this.processing.set(true);
    this.http.post<any>('/api/v1/insurance/preauth', {
      patientId: this.newForm.patientId,
      insurancePolicyId: this.newForm.insurancePolicyId || null,
      serviceDescription: this.newForm.serviceDescription,
      icdCode: this.newForm.icdCode || null,
      estimatedAmount: this.newForm.estimatedAmount,
      notes: this.newForm.notes || null
    }).pipe(catchError(() => {
      this.msg.add({ severity: 'error', summary: 'Failed to create pre-authorization' });
      this.processing.set(false);
      return of(null);
    })).subscribe(result => {
      if (result) {
        this.preauths.update(list => [result, ...list]);
        this.msg.add({ severity: 'success', summary: 'Pre-authorization created' });
        this.showNew.set(false);
      }
      this.processing.set(false);
    });
  }

  submitPreAuth(pa: any) {
    this.processing.set(true);
    this.http.post<any>(`/api/v1/insurance/preauth/${pa.id}/submit`, {})
      .pipe(catchError(() => {
        this.msg.add({ severity: 'error', summary: 'Failed to submit pre-authorization' });
        this.processing.set(false);
        return of(null);
      }))
      .subscribe(updated => {
        if (updated) {
          this.preauths.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.msg.add({ severity: 'success', summary: 'Pre-authorization submitted' });
        }
        this.processing.set(false);
      });
  }

  openProcess(pa: any) {
    this.selectedPA.set(pa);
    this.processForm = {
      status: '',
      approvalNumber: '',
      validUntil: null,
      rejectionReason: '',
      notes: ''
    };
    this.showProcess.set(true);
  }

  submitProcess() {
    const pa = this.selectedPA();
    if (!pa || !this.processForm.status) return;
    this.processing.set(true);

    const payload: any = {
      status: this.processForm.status,
      notes: this.processForm.notes || null
    };
    if (this.processForm.status === 'APPROVED') {
      payload.approvalNumber = this.processForm.approvalNumber || null;
      payload.validUntil = this.processForm.validUntil
        ? (this.processForm.validUntil instanceof Date
            ? this.processForm.validUntil.toISOString().split('T')[0]
            : this.processForm.validUntil)
        : null;
    }
    if (this.processForm.status === 'REJECTED') {
      payload.rejectionReason = this.processForm.rejectionReason;
    }

    this.http.post<any>(`/api/v1/insurance/preauth/${pa.id}/process`, payload)
      .pipe(catchError(() => {
        this.msg.add({ severity: 'error', summary: 'Failed to process pre-authorization' });
        this.processing.set(false);
        return of(null);
      }))
      .subscribe(updated => {
        if (updated) {
          this.preauths.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.msg.add({ severity: 'success', summary: 'Pre-authorization processed' });
          this.showProcess.set(false);
        }
        this.processing.set(false);
      });
  }

  paStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Draft', SUBMITTED: 'Submitted', APPROVED: 'Approved',
      REJECTED: 'Rejected', EXPIRED: 'Expired'
    };
    return labels[status] ?? status;
  }

  paStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<string, any> = {
      DRAFT: 'secondary', SUBMITTED: 'info', APPROVED: 'success',
      REJECTED: 'danger', EXPIRED: 'warning'
    };
    return map[status];
  }
}
