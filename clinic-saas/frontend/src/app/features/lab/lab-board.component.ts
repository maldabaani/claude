import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';

interface ResultEdit {
  resultValue: string;
  resultText: string;
  unit: string;
  abnormal: boolean;
  critical: boolean;
  saving: boolean;
  saved: boolean;
}

@Component({
  selector: 'app-lab-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    ButtonModule, TagModule, TableModule, DropdownModule, DialogModule,
    InputTextModule, CheckboxModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <div class="board-header">
        <div>
          <h2 class="board-title">Lab Orders Board</h2>
          <p class="board-sub">{{ orders().length }} order(s) — click an order to enter results</p>
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
            <th>Tests</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Ordered</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-order>
          <tr>
            <td><code class="text-sm">{{ order.orderNumber }}</code></td>
            <td class="font-medium">{{ order.patientName ?? '—' }}</td>
            <td class="text-sm">{{ order.items?.length ?? 0 }} test(s)</td>
            <td><p-tag [value]="order.priority" [severity]="prioritySev(order.priority)" /></td>
            <td><p-tag [value]="order.status" [severity]="statusSev(order.status)" /></td>
            <td class="text-sm">{{ order.createdAt | date:'dd MMM, HH:mm' }}</td>
            <td>
              <button pButton label="Enter Results" icon="pi pi-pencil"
                      class="p-button-text p-button-info p-button-sm"
                      (click)="openResults(order)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" class="text-center py-4" style="color:var(--text-color-secondary)">
            No lab orders found.
          </td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Results Dialog -->
    <p-dialog header="Enter Lab Results" [(visible)]="showDialog" [modal]="true"
              [style]="{width:'min(95vw,760px)'}" [draggable]="false">
      @if (selected(); as order) {
        <div class="flex align-items-center gap-2 mb-3">
          <code>{{ order.orderNumber }}</code>
          <p-tag [value]="order.priority" [severity]="prioritySev(order.priority)" />
          @if (order.clinicalIndication) {
            <span class="text-sm" style="color:var(--text-color-secondary)">{{ order.clinicalIndication }}</span>
          }
        </div>
        <p-table [value]="order.items ?? []" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:180px">Test</th>
              <th style="width:110px">Value</th>
              <th style="width:110px">Text</th>
              <th style="width:80px">Unit</th>
              <th style="width:90px">Ref Range</th>
              <th style="width:70px">Flags</th>
              <th style="width:80px"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr [class.surface-ground]="resultEdits[item.id]?.saved">
              <td class="font-medium text-sm">{{ item.labTestName }}</td>
              <td><input pInputText [(ngModel)]="resultEdits[item.id].resultValue"
                    class="w-full p-inputtext-sm" placeholder="Numeric" /></td>
              <td><input pInputText [(ngModel)]="resultEdits[item.id].resultText"
                    class="w-full p-inputtext-sm" placeholder="or text" /></td>
              <td><input pInputText [(ngModel)]="resultEdits[item.id].unit"
                    class="w-full p-inputtext-sm" placeholder="unit" /></td>
              <td class="text-xs" style="color:var(--text-color-secondary)">
                {{ item.normalRangeSnapshot ?? '—' }}
              </td>
              <td>
                <div class="flex gap-1">
                  <p-checkbox [(ngModel)]="resultEdits[item.id].abnormal" [binary]="true" title="Abnormal" />
                  <p-checkbox [(ngModel)]="resultEdits[item.id].critical" [binary]="true" title="Critical" />
                </div>
              </td>
              <td>
                <button pButton label="Save" icon="pi pi-check"
                        class="p-button-text p-button-sm"
                        [class.p-button-success]="resultEdits[item.id]?.saved"
                        [loading]="resultEdits[item.id]?.saving ?? false"
                        (click)="saveResult(item)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
      <ng-template pTemplate="footer">
        <button pButton label="Close" class="p-button-text" (click)="showDialog.set(false)"></button>
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
export class LabBoardComponent implements OnInit {
  orders  = signal<any[]>([]);
  loading = signal(true);
  selected = signal<any>(null);
  showDialog = signal(false);
  resultEdits: Record<string, ResultEdit> = {};
  selectedStatus: string | null = null;

  statusOptions = [
    { label: 'Ordered',     value: 'ORDERED' },
    { label: 'Collected',   value: 'COLLECTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resulted',    value: 'RESULTED' },
    { label: 'Cancelled',   value: 'CANCELLED' }
  ];

  constructor(private http: HttpClient, private msg: MessageService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params = this.selectedStatus ? `?status=${this.selectedStatus}` : '';
    this.http.get<any[]>(`/api/v1/lab-orders/all${params}`)
      .pipe(catchError(() => of([])))
      .subscribe(data => { this.orders.set(data); this.loading.set(false); });
  }

  openResults(order: any) {
    this.selected.set(order);
    this.resultEdits = {};
    for (const item of order.items ?? []) {
      this.resultEdits[item.id] = {
        resultValue: item.resultValue?.toString() ?? '',
        resultText:  item.resultText ?? '',
        unit:        item.resultUnit ?? '',
        abnormal:    item.abnormal ?? false,
        critical:    item.critical ?? false,
        saving:      false,
        saved:       !!item.resultedAt
      };
    }
    this.showDialog.set(true);
  }

  saveResult(item: any) {
    const edit = this.resultEdits[item.id];
    if (!edit) return;
    edit.saving = true;
    const req = {
      resultValue: edit.resultValue !== '' ? parseFloat(edit.resultValue) : null,
      resultText:  edit.resultText || null,
      unit:        edit.unit || null,
      abnormal:    edit.abnormal,
      critical:    edit.critical,
      notes:       null
    };
    this.http.put(`/api/v1/lab-orders/items/${item.id}/result`, req)
      .pipe(catchError(() => { edit.saving = false; this.msg.add({ severity:'error', summary:`Failed: ${item.labTestName}` }); return of(null); }))
      .subscribe(res => {
        if (res !== null) {
          edit.saving = false; edit.saved = true;
          this.msg.add({ severity:'success', summary:`Saved: ${item.labTestName}` });
        }
      });
  }

  statusSev(s: string): any {
    const m: Record<string,any> = { RESULTED:'success', ORDERED:'info', COLLECTED:'warning', IN_PROGRESS:'warning', CANCELLED:'danger' };
    return m[s] ?? 'info';
  }

  prioritySev(p: string): any {
    return p === 'STAT' ? 'danger' : p === 'URGENT' ? 'warning' : 'info';
  }
}
