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
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-inventory-board',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule, DialogModule,
    InputTextModule, InputNumberModule, InputTextareaModule,
    DropdownModule, ToastModule, SkeletonModule, ToggleButtonModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-container">
      <!-- Page Header -->
      <div class="board-header">
        <div>
          <h2 class="board-title">Inventory Management</h2>
          <p class="board-sub">Track supplies, medications, and equipment</p>
        </div>
        <div class="board-actions">
          <p-toggleButton
            [(ngModel)]="showLowStockOnly"
            onLabel="Low Stock Only"
            offLabel="All Items"
            onIcon="pi pi-exclamation-triangle"
            offIcon="pi pi-list"
            styleClass="p-button-sm p-button-outlined"
            (onChange)="onLowStockToggle()">
          </p-toggleButton>
          <button pButton icon="pi pi-refresh" class="p-button-outlined p-button-sm"
                  [loading]="loading()" (click)="load()"></button>
          <button pButton label="Add Item" icon="pi pi-plus" class="p-button-sm"
                  (click)="openAddItem()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      @if (!loading()) {
        <div class="summary-cards mb-4">
          <div class="summary-card">
            <div class="summary-value">{{ items().length }}</div>
            <div class="summary-label">Total Items</div>
          </div>
          <div class="summary-card summary-card--warning">
            <div class="summary-value">{{ lowStockCount() }}</div>
            <div class="summary-label">Low Stock</div>
          </div>
          <div class="summary-card summary-card--info">
            <div class="summary-value">{{ categoriesCount() }}</div>
            <div class="summary-label">Categories</div>
          </div>
        </div>
      } @else {
        <div class="summary-cards mb-4">
          @for (i of [1,2,3]; track i) {
            <p-skeleton height="72px" borderRadius="12px" />
          }
        </div>
      }

      <!-- Inventory Table -->
      <p-table
        [value]="filteredItems()"
        [loading]="loading()"
        styleClass="p-datatable-sm p-datatable-striped"
        responsiveLayout="scroll"
        [rowHover]="true">

        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>SKU</th>
            <th>Unit</th>
            <th class="text-right">Current Stock</th>
            <th class="text-right">Min Stock</th>
            <th class="text-right">Unit Cost (AED)</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-item>
          <tr [class.low-stock-row]="isLowStock(item)">
            <td class="font-medium">{{ item.name }}</td>
            <td>
              <p-tag [value]="item.category" [severity]="categorySeverity(item.category)" />
            </td>
            <td><code class="text-sm">{{ item.sku || '—' }}</code></td>
            <td>{{ item.unit || '—' }}</td>
            <td class="text-right" [class.text-red-600]="isLowStock(item)" [class.font-bold]="isLowStock(item)">
              {{ item.currentStock | number:'1.0-0' }}
              @if (isLowStock(item)) {
                <i class="pi pi-exclamation-triangle ml-1 text-xs"></i>
              }
            </td>
            <td class="text-right">{{ item.minimumStock | number:'1.0-0' }}</td>
            <td class="text-right">{{ item.unitCost | number:'1.2-2' }}</td>
            <td class="text-sm" style="color:var(--text-color-secondary)">{{ item.supplier || '—' }}</td>
            <td>
              <p-tag [value]="item.active ? 'Active' : 'Inactive'"
                     [severity]="item.active ? 'success' : 'danger'" />
            </td>
            <td>
              <div class="flex gap-1 align-items-center">
                <button pButton label="Add Stock" icon="pi pi-plus-circle"
                        class="p-button-sm p-button-success p-button-outlined"
                        (click)="openTransaction(item, 'IN')"></button>
                <button pButton label="Use" icon="pi pi-minus-circle"
                        class="p-button-sm p-button-warning p-button-outlined"
                        (click)="openTransaction(item, 'OUT')"></button>
                @if (item.active) {
                  <button pButton label="Deactivate" icon="pi pi-ban"
                          class="p-button-sm p-button-danger p-button-text"
                          (click)="deactivateItem(item)"></button>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="10" class="text-center py-5" style="color:var(--text-color-secondary)">
              No inventory items found.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Add Item Dialog -->
    <p-dialog header="Add Inventory Item" [(visible)]="showAddItem" [modal]="true"
              [style]="{width:'min(92vw,560px)'}" [draggable]="false">
      <div class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Item Name *</label>
          <input pInputText [(ngModel)]="itemForm.name" class="w-full"
                 placeholder="e.g. Paracetamol 500mg" />
        </div>
        <div>
          <label class="block text-sm mb-1">Category *</label>
          <p-dropdown [(ngModel)]="itemForm.category" [options]="categoryOptions"
                      optionLabel="label" optionValue="value"
                      styleClass="w-full" placeholder="Select category" />
        </div>
        <div class="grid-2">
          <div>
            <label class="block text-sm mb-1">SKU</label>
            <input pInputText [(ngModel)]="itemForm.sku" class="w-full"
                   placeholder="e.g. MED-001" />
          </div>
          <div>
            <label class="block text-sm mb-1">Unit</label>
            <input pInputText [(ngModel)]="itemForm.unit" class="w-full"
                   placeholder="e.g. Box, Bottle, Piece" />
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label class="block text-sm mb-1">Minimum Stock *</label>
            <p-inputNumber [(ngModel)]="itemForm.minimumStock" [min]="0"
                           styleClass="w-full" />
          </div>
          <div>
            <label class="block text-sm mb-1">Unit Cost (AED)</label>
            <p-inputNumber [(ngModel)]="itemForm.unitCost" [min]="0" [minFractionDigits]="2"
                           styleClass="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm mb-1">Supplier</label>
          <input pInputText [(ngModel)]="itemForm.supplier" class="w-full"
                 placeholder="Supplier name" />
        </div>
        <div>
          <label class="block text-sm mb-1">Notes</label>
          <textarea pInputTextarea [(ngModel)]="itemForm.notes" rows="2" class="w-full"
                    placeholder="Optional notes..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showAddItem.set(false)"></button>
        <button pButton label="Add Item" icon="pi pi-check"
                [loading]="processing()"
                [disabled]="!itemForm.name.trim() || !itemForm.category || itemForm.minimumStock == null"
                (click)="createItem()"></button>
      </ng-template>
    </p-dialog>

    <!-- Transaction Dialog -->
    <p-dialog [header]="transactionType() === 'IN' ? 'Add Stock' : 'Record Usage'"
              [(visible)]="showTransaction" [modal]="true"
              [style]="{width:'min(92vw,420px)'}" [draggable]="false">
      @if (selectedItem(); as item) {
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Item</span>
          <strong>{{ item.name }}</strong>
        </div>
        <div class="flex justify-content-between mb-3 text-sm">
          <span style="color:var(--text-color-secondary)">Current Stock</span>
          <strong [class.text-red-600]="isLowStock(item)">{{ item.currentStock }}</strong>
        </div>
      }
      <div class="flex flex-column gap-3">
        <div>
          <label class="block text-sm mb-1">Quantity *</label>
          <p-inputNumber [(ngModel)]="txForm.quantity" [min]="1"
                         styleClass="w-full" placeholder="Enter quantity" />
        </div>
        <div>
          <label class="block text-sm mb-1">Notes</label>
          <textarea pInputTextarea [(ngModel)]="txForm.notes" rows="2" class="w-full"
                    placeholder="Optional notes..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="showTransaction.set(false)"></button>
        <button pButton [label]="transactionType() === 'IN' ? 'Add Stock' : 'Record Usage'"
                [icon]="transactionType() === 'IN' ? 'pi pi-plus' : 'pi pi-minus'"
                [class]="transactionType() === 'IN' ? 'p-button-success' : 'p-button-warning'"
                [loading]="processing()"
                [disabled]="txForm.quantity == null || txForm.quantity < 1"
                (click)="submitTransaction()"></button>
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
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    @media (max-width: 640px) {
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
    .summary-card--info    { border-left-color: #3b82f6; }
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
    .low-stock-row { background-color: #fff7ed !important; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
  `]
})
export class InventoryBoardComponent implements OnInit {
  items      = signal<any[]>([]);
  loading    = signal(false);
  processing = signal(false);
  showLowStockOnly = false;

  selectedItem   = signal<any>(null);
  showAddItem    = signal(false);
  showTransaction = signal(false);
  transactionType = signal<'IN' | 'OUT'>('IN');

  itemForm = {
    name: '', category: '', sku: '', unit: '',
    minimumStock: null as number | null,
    unitCost: null as number | null,
    supplier: '', notes: ''
  };

  txForm = {
    quantity: null as number | null,
    notes: ''
  };

  lowStockCount  = computed(() => this.items().filter(i => this.isLowStock(i)).length);
  categoriesCount = computed(() => {
    const cats = new Set(this.items().map(i => i.category).filter(Boolean));
    return cats.size;
  });
  filteredItems = computed(() =>
    this.showLowStockOnly ? this.items().filter(i => this.isLowStock(i)) : this.items()
  );

  categoryOptions = [
    { label: 'Medication',   value: 'MEDICATION' },
    { label: 'Consumable',   value: 'CONSUMABLE' },
    { label: 'Equipment',    value: 'EQUIPMENT' },
    { label: 'Laboratory',   value: 'LABORATORY' },
    { label: 'Other',        value: 'OTHER' }
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
    this.http.get<any[]>('/api/v1/inventory')
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.items.set(data);
        this.loading.set(false);
      });
  }

  onLowStockToggle() {
    // filteredItems computed signal handles filtering reactively
  }

  isLowStock(item: any): boolean {
    return item.currentStock != null && item.minimumStock != null
      && item.currentStock <= item.minimumStock;
  }

  openAddItem() {
    this.itemForm = {
      name: '', category: '', sku: '', unit: '',
      minimumStock: null, unitCost: null,
      supplier: '', notes: ''
    };
    this.showAddItem.set(true);
  }

  createItem() {
    this.processing.set(true);
    this.http.post<any>('/api/v1/inventory', {
      name: this.itemForm.name,
      category: this.itemForm.category,
      sku: this.itemForm.sku || null,
      unit: this.itemForm.unit || null,
      minimumStock: this.itemForm.minimumStock,
      unitCost: this.itemForm.unitCost ?? null,
      supplier: this.itemForm.supplier || null,
      notes: this.itemForm.notes || null
    }).pipe(catchError(() => {
      this.msg.add({ severity: 'error', summary: 'Failed to add inventory item' });
      this.processing.set(false);
      return of(null);
    })).subscribe(result => {
      if (result) {
        this.items.update(list => [result, ...list]);
        this.msg.add({ severity: 'success', summary: 'Inventory item added' });
        this.showAddItem.set(false);
      }
      this.processing.set(false);
    });
  }

  openTransaction(item: any, type: 'IN' | 'OUT') {
    this.selectedItem.set(item);
    this.transactionType.set(type);
    this.txForm = { quantity: null, notes: '' };
    this.showTransaction.set(true);
  }

  submitTransaction() {
    const item = this.selectedItem();
    if (!item || !this.txForm.quantity) return;
    this.processing.set(true);
    this.http.post<any>(`/api/v1/inventory/${item.id}/transaction`, {
      transactionType: this.transactionType(),
      quantity: this.txForm.quantity,
      notes: this.txForm.notes || null
    }).pipe(catchError(() => {
      this.msg.add({ severity: 'error', summary: 'Failed to record transaction' });
      this.processing.set(false);
      return of(null);
    })).subscribe(updated => {
      if (updated) {
        this.items.update(list => list.map(i => i.id === updated.id ? updated : i));
        this.msg.add({
          severity: 'success',
          summary: this.transactionType() === 'IN' ? 'Stock added' : 'Usage recorded'
        });
        this.showTransaction.set(false);
      }
      this.processing.set(false);
    });
  }

  deactivateItem(item: any) {
    this.http.patch<any>(`/api/v1/inventory/${item.id}`, { active: false })
      .pipe(catchError(() => {
        this.msg.add({ severity: 'error', summary: 'Failed to deactivate item' });
        return of(null);
      }))
      .subscribe(updated => {
        if (updated) {
          this.items.update(list => list.map(i => i.id === updated.id ? updated : i));
          this.msg.add({ severity: 'warn', summary: 'Item deactivated' });
        }
      });
  }

  categorySeverity(category: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<string, any> = {
      MEDICATION: 'danger', CONSUMABLE: 'warning', EQUIPMENT: 'info',
      LABORATORY: 'success', OTHER: 'secondary'
    };
    return map[category];
  }
}
