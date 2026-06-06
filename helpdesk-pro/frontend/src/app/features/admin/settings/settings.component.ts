import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTabsModule,
    MatInputModule, MatButtonModule, MatSlideToggleModule],
  template: `
    <div class="space-y-6">
      <h1 class="font-heading text-2xl font-bold text-gray-900">Settings</h1>

      <mat-card class="!rounded-xl !shadow-sm">
        <mat-card-content class="!p-0">
          <mat-tab-group class="settings-tabs">
            <mat-tab label="General">
              <div class="p-6 space-y-4 max-w-lg">
                <h3 class="font-semibold text-gray-900">System Settings</h3>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Company Name</mat-label>
                  <input matInput value="HelpDesk Pro">
                </mat-form-field>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Support Email</mat-label>
                  <input matInput value="support@helpdesk.com">
                </mat-form-field>
                <button mat-raised-button color="primary" class="!rounded-xl !font-semibold">Save Changes</button>
              </div>
            </mat-tab>

            <mat-tab label="Email Templates">
              <div class="p-6 space-y-4">
                <p class="text-gray-500 text-sm">Configure outbound email notification templates.</p>
                <div *ngFor="let tpl of emailTemplates" class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p class="font-medium text-gray-900 text-sm">{{ tpl.name }}</p>
                    <p class="text-xs text-gray-400">{{ tpl.trigger }}</p>
                  </div>
                  <mat-slide-toggle [checked]="tpl.enabled" color="primary" />
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class SettingsComponent {
  emailTemplates = [
    { name: 'Ticket Created', trigger: 'On ticket submission', enabled: true },
    { name: 'Comment Added', trigger: 'On new reply or internal note', enabled: true },
    { name: 'Status Changed', trigger: 'On ticket status update', enabled: true },
    { name: 'Ticket Assigned', trigger: 'On agent assignment', enabled: true },
    { name: 'SLA Breached', trigger: 'When SLA deadline is missed', enabled: true },
  ];
}
