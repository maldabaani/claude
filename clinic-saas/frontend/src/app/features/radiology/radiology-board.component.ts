import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-radiology-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, TagModule, TableModule, DropdownModule, DialogModule,
    InputTextareaModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <div class="board-header">
        <div>
          <h2 class="board-title">Radiology Board</h2>
          <p class="board-sub">{{ orders().length }} order(s) — click an order to write a report</p>
        </div>
        <div class="board-actions">
          <p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus"
            optionLabel="label" optionValue="value"
            placeholder="All statuses" [showClear]="true" styleClass="w-10rem"
            (onChange)="load()">
          </p-dropdown>
          <button pButton icon="pi pi-refresh" class="p-button-outlined p-button-sm" (click)="load()"></button>
        </div>
      </div>

      <p-table [value]="orders()" [loading]="loading()"
               styleClass="p-datatable-sm p-datatable-striped"
               responsiveLayout="scroll" [rowHover]="true">
        <ng-template pTemplate="header">
          <tr>
            <th>Order #</th>
            <th>Patient</th>
            <th>Modality</th>
            <th>Body Part</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Report</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-order>
          <tr>
            <td><code class="text-sm">{{ order.orderNumber }}</code></td>
            <td class="font-medium">{{ order.patientName ?? '—' }}</td>
            <td><p-tag [value]="order.modality" severity="info" /></td>
            <td>{{ order.bodyPart ?? '—' }} {{ order.laterality ? '(' + order.laterality + ')' : '' }}</td>
            <td><p-tag [value]="order.priority" [severity]="prioritySev(order.priority)" /></td>
            <td><p-tag [value]="order.status" [severity]="statusSev(order.status)" /></td>
            <td class="text-sm" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ order.report?.impression ?? '—' }}
            </td>
            <td>
              <button pButton [icon]="order.report ? 'pi pi-eye' : 'pi pi-plus'"
                      [label]="order.report ? 'Edit Report' : 'Write Report'"
                      class="p-button-text p-button-info p-button-sm"
                      (click)="openReport(order)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" class="text-center py-4" style="color:var(--text-color-secondary)">
            No radiology orders found.
          </td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Report Dialog -->
    <p-dialog header="Radiology Report" [(visible)]="showDialog" [modal]="true"
              [style]="{width:'min(95vw,600px)'}" [draggable]="false">
      @if (selected(); as order) {
        <div class="flex align-items-center gap-2 mb-3">
          <code>{{ order.orderNumber }}</code>
          <p-tag [value]="order.modality" severity="info" />
          @if (order.bodyPart) { <span class="text-sm">{{ order.bodyPart }}</span> }
        </div>
      }
      <form [formGroup]="reportForm" class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Findings *</label>
          <textarea pInputTextarea formControlName="findings" rows="4" class="w-full"
                    placeholder="Describe the imaging findings..."></textarea>
        </div>
        <div>
          <label class="block text-sm mb-1">Impression *</label>
          <textarea pInputTextarea formControlName="impression" rows="3" class="w-full"
                    placeholder="Clinical impression..."></textarea>
        </div>
        <div>
          <label class="block text-sm mb-1">Recommendation</label>
          <textarea pInputTextarea formControlName="recommendation" rows="2" class="w-full"
                    placeholder="Follow-up recommendations..."></textarea>
        </div>
        <div>
          <label class="block text-sm mb-1">Status</label>
          <p-dropdown formControlName="status" [options]="reportStatuses"
                      optionLabel="label" optionValue="value" styleClass="w-full" />
        </div>
      </form>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showDialog.set(false)"></button>
        <button pButton label="Save Report" icon="pi pi-check"
                [loading]="saving()" [disabled]="reportForm.invalid"
                (click)="saveReport()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .board-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .board-title  { font-size:1.375rem; font-weight:800; color:#1e2a45; letter-spacing:-.03em; margin:0; }
    .board-sub    { font-size:.875rem; color:#8a94a6; margin:.25rem 0 0; }
    .board-actions{ display:flex; align-items:center; gap:.75rem; }
  `]
})
export class RadiologyBoardComponent implements OnInit {
  orders     = signal<any[]>([]);
  loading    = signal(true);
  selected   = signal<any>(null);
  showDialog = signal(false);
  saving     = signal(false);
  selectedStatus: string | null = null;

  reportForm: FormGroup;

  statusOptions = [
    { label: 'Ordered',     value: 'ORDERED' },
    { label: 'Scheduled',   value: 'SCHEDULED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed',   value: 'COMPLETED' },
    { label: 'Cancelled',   value: 'CANCELLED' }
  ];

  reportStatuses = [
    { label: 'Final',        value: 'FINAL' },
    { label: 'Preliminary',  value: 'PRELIMINARY' },
    { label: 'Amended',      value: 'AMENDED' }
  ];

  constructor(private http: HttpClient, private msg: MessageService, private fb: FormBuilder) {
    this.reportForm = this.fb.group({
      findings:       ['', Validators.required],
      impression:     ['', Validators.required],
      recommendation: [''],
      status:         ['FINAL']
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params = this.selectedStatus ? `?status=${this.selectedStatus}` : '';
    this.http.get<any[]>(`/api/v1/radiology-orders/all${params}`)
      .pipe(catchError(() => of([])))
      .subscribe(data => { this.orders.set(data); this.loading.set(false); });
  }

  openReport(order: any) {
    this.selected.set(order);
    this.reportForm.reset({ status: 'FINAL' });
    if (order.report) { this.reportForm.patchValue(order.report); }
    this.showDialog.set(true);
  }

  saveReport() {
    if (this.reportForm.invalid) return;
    const order = this.selected();
    if (!order) return;
    this.saving.set(true);
    this.http.post(`/api/v1/radiology-orders/${order.id}/report`, this.reportForm.value)
      .pipe(catchError(() => { this.saving.set(false); this.msg.add({ severity:'error', summary:'Failed to save report' }); return of(null); }))
      .subscribe(res => {
        if (res !== null) {
          this.saving.set(false);
          this.orders.update(list => list.map(o => o.id === order.id ? { ...o, report: this.reportForm.value } : o));
          this.msg.add({ severity:'success', summary:'Report saved' });
          this.showDialog.set(false);
        }
      });
  }

  statusSev(s: string): any {
    const m: Record<string,any> = { COMPLETED:'success', ORDERED:'info', SCHEDULED:'warning', IN_PROGRESS:'warning', CANCELLED:'danger' };
    return m[s] ?? 'info';
  }

  prioritySev(p: string): any {
    return p === 'STAT' ? 'danger' : p === 'URGENT' ? 'warning' : 'info';
  }
}
