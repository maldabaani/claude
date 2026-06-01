import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PlatformService, TenantResponse } from '../../../core/services/platform.service';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule, CardModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">
      <div class="flex align-items-center justify-content-between mb-4">
        <h2 class="card-title mb-0">Clinic Management</h2>
        <p-button label="Onboard New Clinic" icon="pi pi-plus"
                  routerLink="create" />
      </div>

      <p-card>
        <p-table [value]="tenants()" [loading]="loading()" [paginator]="true" [rows]="10"
                 styleClass="p-datatable-sm" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>Clinic Name</th>
              <th>Database</th>
              <th>Admin Email</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-t>
            <tr>
              <td><strong>{{ t.name }}</strong></td>
              <td><code>{{ t.dbName }}</code></td>
              <td>{{ t.adminEmail }}</td>
              <td>
                <p-tag [value]="t.active ? 'Active' : 'Inactive'"
                       [severity]="t.active ? 'success' : 'danger'" />
              </td>
              <td>{{ t.createdAt | date:'mediumDate' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5" class="text-center p-4">No clinics onboarded yet.</td></tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `
})
export class TenantListComponent implements OnInit {
  tenants = signal<TenantResponse[]>([]);
  loading = signal(true);

  constructor(private svc: PlatformService, private msg: MessageService) {}

  ngOnInit() {
    this.svc.listTenants().subscribe({
      next: data => { this.tenants.set(data); this.loading.set(false); },
      error: () => { this.msg.add({ severity: 'error', summary: 'Failed to load clinics' }); this.loading.set(false); }
    });
  }
}
