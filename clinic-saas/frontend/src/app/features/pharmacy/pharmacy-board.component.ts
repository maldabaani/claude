import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-pharmacy-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, TableModule, DropdownModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <div class="board-header">
        <div>
          <h2 class="board-title">Pharmacy Board</h2>
          <p class="board-sub">{{ prescriptions().length }} prescription(s)</p>
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

      @for (rx of prescriptions(); track rx.id) {
        <div class="rx-card">
          <div class="rx-header">
            <div class="flex align-items-center gap-2">
              <code class="text-sm">{{ rx.prescriptionNumber }}</code>
              <p-tag [value]="rx.status" [severity]="statusSev(rx.status)" />
            </div>
            <div class="flex align-items-center gap-2">
              <span class="text-sm" style="color:var(--text-color-secondary)">{{ rx.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
              @if (rx.status === 'ACTIVE') {
                <button pButton label="Mark Dispensed" icon="pi pi-check"
                        class="p-button-success p-button-sm p-button-outlined"
                        (click)="markDispensed(rx)"></button>
              }
            </div>
          </div>
          <p-table [value]="rx.items" styleClass="p-datatable-sm" responsiveLayout="scroll">
            <ng-template pTemplate="header">
              <tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Route</th><th>Days</th><th>Qty</th><th>Instructions</th></tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td class="font-medium">{{ item.medicationNameSnapshot }}</td>
                <td>{{ item.dosage }}</td>
                <td>{{ item.frequency?.replace('_',' ') }}</td>
                <td>{{ item.route ?? '—' }}</td>
                <td>{{ item.durationDays ?? '—' }}</td>
                <td>{{ item.quantity ?? '—' }}</td>
                <td class="text-sm">{{ item.instructions ?? '—' }}</td>
              </tr>
            </ng-template>
          </p-table>
          @if (rx.notes) {
            <p class="rx-notes">Note: {{ rx.notes }}</p>
          }
        </div>
      }

      @if (prescriptions().length === 0 && !loading()) {
        <div class="text-center py-6" style="color:var(--text-color-secondary)">No prescriptions found.</div>
      }
    </div>
  `,
  styles: [`
    .board-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .board-title  { font-size:1.375rem; font-weight:800; color:#1e2a45; letter-spacing:-.03em; margin:0; }
    .board-sub    { font-size:.875rem; color:#8a94a6; margin:.25rem 0 0; }
    .board-actions{ display:flex; align-items:center; gap:.75rem; }
    .rx-card      { background:#fff; border:1px solid #e9ecf3; border-radius:12px; padding:1rem; margin-bottom:1rem; }
    .rx-header    { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; flex-wrap:wrap; gap:.5rem; }
    .rx-notes     { font-size:.8125rem; color:#64748b; font-style:italic; margin:.5rem 0 0; padding:.5rem; background:#f8faff; border-radius:6px; }
  `]
})
export class PharmacyBoardComponent implements OnInit {
  prescriptions = signal<any[]>([]);
  loading       = signal(true);
  selectedStatus: string | null = null;

  statusOptions = [
    { label: 'Active',      value: 'ACTIVE' },
    { label: 'Dispensed',   value: 'DISPENSED' },
    { label: 'Cancelled',   value: 'CANCELLED' },
    { label: 'Expired',     value: 'EXPIRED' }
  ];

  constructor(private http: HttpClient, private msg: MessageService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params = this.selectedStatus ? `?status=${this.selectedStatus}` : '';
    this.http.get<any[]>(`/api/v1/prescriptions/all${params}`)
      .pipe(catchError(() => of([])))
      .subscribe(data => { this.prescriptions.set(data); this.loading.set(false); });
  }

  markDispensed(rx: any) {
    // PATCH status or a dedicated dispense endpoint — for now update locally
    this.msg.add({ severity: 'info', summary: 'Dispensed status coming soon' });
  }

  statusSev(s: string): any {
    const m: Record<string,any> = { ACTIVE:'success', DISPENSED:'info', CANCELLED:'danger', EXPIRED:'warning' };
    return m[s] ?? 'info';
  }
}
