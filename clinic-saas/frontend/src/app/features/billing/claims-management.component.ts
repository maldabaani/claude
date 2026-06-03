import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MessageService } from 'primeng/api';
import { InsuranceService } from '../../core/services/insurance.service';
import { InsuranceClaim, ClaimStatus } from '../../core/models/insurance.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-claims-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule, DialogModule,
    InputTextModule, InputNumberModule, InputTextareaModule,
    DropdownModule, CardModule, ToastModule, SkeletonModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-container">
      <!-- Page Header -->
      <div class="board-header">
        <div>
          <h2 class="board-title">Claims Management</h2>
          <p class="board-sub">Manage insurance claims across all patients</p>
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
        </div>
      </div>

      <!-- Summary Cards -->
      @if (!loading()) {
        <div class="summary-cards mb-4">
          <div class="summary-card">
            <div class="summary-value">{{ claims().length }}</div>
            <div class="summary-label">Total Claims</div>
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

      <!-- Claims Table -->
      <p-table
        [value]="claims()"
        [loading]="loading()"
        styleClass="p-datatable-sm p-datatable-striped"
        responsiveLayout="scroll"
        [rowHover]="true"
        [lazy]="false">

        <ng-template pTemplate="header">
          <tr>
            <th>Claim #</th>
            <th>Payer</th>
            <th>Policy #</th>
            <th>Invoice #</th>
            <th class="text-right">Claimed (AED)</th>
            <th class="text-right">Approved (AED)</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-claim>
          <tr>
            <td><code class="text-sm">{{ claim.claimNumber }}</code></td>
            <td class="font-medium">{{ claim.payerName }}</td>
            <td><code class="text-sm">{{ claim.policyNumber }}</code></td>
            <td><code class="text-sm">{{ claim.invoiceNumber }}</code></td>
            <td class="text-right">{{ claim.claimedAmount | number:'1.2-2' }}</td>
            <td class="text-right">
              @if (claim.approvedAmount != null) {
                <span [class.text-green-600]="claim.approvedAmount > 0">
                  {{ claim.approvedAmount | number:'1.2-2' }}
                </span>
              } @else {
                <span style="color:var(--text-color-secondary)">—</span>
              }
            </td>
            <td>
              <p-tag [value]="claimStatusLabel(claim.status)"
                     [severity]="claimStatusSeverity(claim.status)" />
            </td>
            <td class="text-sm" style="color:var(--text-color-secondary)">
              {{ claim.submittedAt ? (claim.submittedAt | date:'dd MMM yyyy') : '—' }}
            </td>
            <td>
              <div class="flex gap-1 align-items-center">
                @if (claim.status === 'DRAFT') {
                  <button pButton label="Submit" icon="pi pi-send"
                          class="p-button-sm p-button-primary"
                          (click)="confirmSubmit(claim)"></button>
                }
                @if (claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW') {
                  <button pButton label="Approve" icon="pi pi-check"
                          class="p-button-sm p-button-success"
                          (click)="openApprove(claim)"></button>
                  <button pButton label="Reject" icon="pi pi-times"
                          class="p-button-sm p-button-danger"
                          (click)="openReject(claim)"></button>
                }
                @if (claim.status === 'REJECTED' || claim.status === 'APPEALED') {
                  <button pButton label="Re-submit" icon="pi pi-refresh"
                          class="p-button-sm p-button-warning"
                          (click)="openResubmit(claim)"></button>
                }
                @if (claim.status === 'APPROVED' || claim.status === 'PARTIALLY_APPROVED') {
                  <span class="text-green-600 font-medium text-sm">
                    <i class="pi pi-check-circle mr-1"></i>Done
                  </span>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center py-5" style="color:var(--text-color-secondary)">
              No claims found.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Approve Dialog -->
    <p-dialog header="Approve Claim" [(visible)]="showApprove" [modal]="true"
              [style]="{width:'min(92vw,440px)'}" [draggable]="false">
      @if (selectedClaim(); as claim) {
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Claim</span>
          <strong>{{ claim.claimNumber }}</strong>
        </div>
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Claimed Amount</span>
          <strong>AED {{ claim.claimedAmount | number:'1.2-2' }}</strong>
        </div>
      }
      <div class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Approved Amount (AED) *</label>
          <p-inputNumber [(ngModel)]="approveAmount" [min]="0" [minFractionDigits]="2"
                         styleClass="w-full" placeholder="Enter approved amount" />
        </div>
        <div>
          <label class="block text-sm mb-1">Notes</label>
          <textarea pInputTextarea [(ngModel)]="approveNotes" rows="3" class="w-full"
                    placeholder="Optional notes..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showApprove.set(false)"></button>
        <button pButton label="Approve" icon="pi pi-check" class="p-button-success"
                [loading]="processing()" [disabled]="approveAmount == null"
                (click)="submitApprove()"></button>
      </ng-template>
    </p-dialog>

    <!-- Reject Dialog -->
    <p-dialog header="Reject Claim" [(visible)]="showReject" [modal]="true"
              [style]="{width:'min(92vw,440px)'}" [draggable]="false">
      @if (selectedClaim(); as claim) {
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Claim</span>
          <strong>{{ claim.claimNumber }}</strong>
        </div>
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Claimed Amount</span>
          <strong>AED {{ claim.claimedAmount | number:'1.2-2' }}</strong>
        </div>
      }
      <div class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Rejection Reason *</label>
          <input pInputText [(ngModel)]="rejectReason" class="w-full"
                 placeholder="Enter rejection reason" />
        </div>
        <div>
          <label class="block text-sm mb-1">Rejected Amount (AED)</label>
          <p-inputNumber [(ngModel)]="rejectAmount" [min]="0" [minFractionDigits]="2"
                         styleClass="w-full" placeholder="Optional" />
        </div>
        <div>
          <label class="block text-sm mb-1">Notes</label>
          <textarea pInputTextarea [(ngModel)]="rejectNotes" rows="3" class="w-full"
                    placeholder="Optional notes..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showReject.set(false)"></button>
        <button pButton label="Reject" icon="pi pi-times" class="p-button-danger"
                [loading]="processing()" [disabled]="!rejectReason.trim()"
                (click)="submitReject()"></button>
      </ng-template>
    </p-dialog>

    <!-- Re-submit Dialog -->
    <p-dialog header="Re-submit Claim" [(visible)]="showResubmit" [modal]="true"
              [style]="{width:'min(92vw,440px)'}" [draggable]="false">
      @if (selectedClaim(); as claim) {
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Claim</span>
          <strong>{{ claim.claimNumber }}</strong>
        </div>
        @if (claim.rejectionReason) {
          <div class="mb-3 p-3 border-round" style="background:#fef2f2;border:1px solid #fecaca">
            <span class="text-sm font-medium text-red-700">Rejection Reason: </span>
            <span class="text-sm text-red-600">{{ claim.rejectionReason }}</span>
          </div>
        }
      }
      <div class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Notes</label>
          <textarea pInputTextarea [(ngModel)]="resubmitNotes" rows="3" class="w-full"
                    placeholder="Notes about the re-submission..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showResubmit.set(false)"></button>
        <button pButton label="Re-submit" icon="pi pi-refresh" class="p-button-warning"
                [loading]="processing()"
                (click)="submitResubmit()"></button>
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
export class ClaimsManagementComponent implements OnInit {
  claims    = signal<InsuranceClaim[]>([]);
  loading   = signal(false);
  processing = signal(false);
  statusFilter: string = '';

  selectedClaim = signal<InsuranceClaim | null>(null);
  showApprove   = signal(false);
  showReject    = signal(false);
  showResubmit  = signal(false);

  // Approve dialog fields
  approveAmount: number | null = null;
  approveNotes: string = '';

  // Reject dialog fields
  rejectReason: string = '';
  rejectAmount: number | null = null;
  rejectNotes: string = '';

  // Re-submit dialog fields
  resubmitNotes: string = '';

  pendingCount  = computed(() => this.claims().filter(c => c.status === 'DRAFT' || c.status === 'SUBMITTED').length);
  approvedCount = computed(() => this.claims().filter(c => c.status === 'APPROVED' || c.status === 'PARTIALLY_APPROVED').length);
  rejectedCount = computed(() => this.claims().filter(c => c.status === 'REJECTED').length);

  statusOptions = [
    { label: 'Draft',              value: 'DRAFT' },
    { label: 'Submitted',          value: 'SUBMITTED' },
    { label: 'Under Review',       value: 'UNDER_REVIEW' },
    { label: 'Approved',           value: 'APPROVED' },
    { label: 'Partially Approved', value: 'PARTIALLY_APPROVED' },
    { label: 'Rejected',           value: 'REJECTED' },
    { label: 'Appealed',           value: 'APPEALED' }
  ];

  constructor(
    private insuranceService: InsuranceService,
    private msg: MessageService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.insuranceService.getClaims(this.statusFilter || undefined)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.claims.set(data);
        this.loading.set(false);
      });
  }

  onStatusChange() {
    this.load();
  }

  claimStatusLabel(status: ClaimStatus): string {
    const labels: Record<ClaimStatus, string> = {
      DRAFT:              'Draft',
      SUBMITTED:          'Submitted',
      UNDER_REVIEW:       'Under Review',
      APPROVED:           'Approved',
      PARTIALLY_APPROVED: 'Partially Approved',
      REJECTED:           'Rejected',
      APPEALED:           'Appealed'
    };
    return labels[status] ?? status;
  }

  claimStatusSeverity(status: ClaimStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<ClaimStatus, any> = {
      DRAFT:              'secondary',
      SUBMITTED:          'info',
      UNDER_REVIEW:       'warning',
      APPROVED:           'success',
      PARTIALLY_APPROVED: 'warning',
      REJECTED:           'danger',
      APPEALED:           'info'
    };
    return map[status];
  }

  confirmSubmit(claim: InsuranceClaim) {
    this.processing.set(true);
    this.insuranceService.submitClaim(claim.id)
      .pipe(catchError(() => {
        this.msg.add({ severity: 'error', summary: 'Failed to submit claim' });
        this.processing.set(false);
        return of(null);
      }))
      .subscribe(updated => {
        if (updated) {
          this.claims.update(list => list.map(c => c.id === updated.id ? updated : c));
          this.msg.add({ severity: 'success', summary: 'Claim submitted successfully' });
        }
        this.processing.set(false);
      });
  }

  openApprove(claim: InsuranceClaim) {
    this.selectedClaim.set(claim);
    this.approveAmount = claim.claimedAmount;
    this.approveNotes = '';
    this.showApprove.set(true);
  }

  submitApprove() {
    const claim = this.selectedClaim();
    if (!claim || this.approveAmount == null) return;
    this.processing.set(true);
    this.insuranceService.processClaim(claim.id, {
      status: 'APPROVED',
      approvedAmount: this.approveAmount,
      notes: this.approveNotes || null
    }).pipe(catchError(() => {
      this.msg.add({ severity: 'error', summary: 'Failed to approve claim' });
      this.processing.set(false);
      return of(null);
    })).subscribe(updated => {
      if (updated) {
        this.claims.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.msg.add({ severity: 'success', summary: 'Claim approved' });
        this.showApprove.set(false);
      }
      this.processing.set(false);
    });
  }

  openReject(claim: InsuranceClaim) {
    this.selectedClaim.set(claim);
    this.rejectReason = '';
    this.rejectAmount = null;
    this.rejectNotes = '';
    this.showReject.set(true);
  }

  submitReject() {
    const claim = this.selectedClaim();
    if (!claim || !this.rejectReason.trim()) return;
    this.processing.set(true);
    this.insuranceService.processClaim(claim.id, {
      status: 'REJECTED',
      rejectionReason: this.rejectReason,
      rejectedAmount: this.rejectAmount ?? null,
      notes: this.rejectNotes || null
    }).pipe(catchError(() => {
      this.msg.add({ severity: 'error', summary: 'Failed to reject claim' });
      this.processing.set(false);
      return of(null);
    })).subscribe(updated => {
      if (updated) {
        this.claims.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.msg.add({ severity: 'warn', summary: 'Claim rejected' });
        this.showReject.set(false);
      }
      this.processing.set(false);
    });
  }

  openResubmit(claim: InsuranceClaim) {
    this.selectedClaim.set(claim);
    this.resubmitNotes = '';
    this.showResubmit.set(true);
  }

  submitResubmit() {
    const claim = this.selectedClaim();
    if (!claim) return;
    this.processing.set(true);
    this.insuranceService.resubmitClaim(claim.id, this.resubmitNotes)
      .pipe(catchError(() => {
        this.msg.add({ severity: 'error', summary: 'Failed to re-submit claim' });
        this.processing.set(false);
        return of(null);
      }))
      .subscribe(updated => {
        if (updated) {
          this.claims.update(list => list.map(c => c.id === updated.id ? updated : c));
          this.msg.add({ severity: 'success', summary: 'Claim re-submitted' });
          this.showResubmit.set(false);
        }
        this.processing.set(false);
      });
  }
}
