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
      <div>
        <h1 class="font-heading text-2xl font-bold text-gray-900">Settings</h1>
        <p class="text-sm text-gray-500 mt-0.5">Configure system preferences and notifications</p>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <mat-tab-group class="settings-tabs">
          <mat-tab label="General">
            <div class="p-8 max-w-lg space-y-6">
              <div>
                <h3 class="font-heading font-semibold text-gray-900 mb-1">System Settings</h3>
                <p class="text-sm text-gray-500">Configure your helpdesk identity and contact info.</p>
              </div>
              <div class="space-y-4">
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Company Name</mat-label>
                  <input matInput value="HelpDesk Pro">
                  <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px">business</mat-icon>
                </mat-form-field>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Support Email</mat-label>
                  <input matInput value="support&#64;helpdesk.com">
                  <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px">alternate_email</mat-icon>
                </mat-form-field>
              </div>
              <button mat-raised-button color="primary" class="!rounded-lg !font-semibold !px-6">
                <mat-icon style="font-size:18px;width:18px;height:18px">save</mat-icon>
                Save changes
              </button>
            </div>
          </mat-tab>

          <mat-tab label="Email Templates">
            <div class="p-8">
              <div class="mb-6">
                <h3 class="font-heading font-semibold text-gray-900 mb-1">Email Notifications</h3>
                <p class="text-sm text-gray-500">Control which automated emails are sent to users.</p>
              </div>
              <div class="space-y-3 max-w-2xl">
                <div *ngFor="let tpl of emailTemplates"
                     class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <mat-icon class="text-gray-400" style="font-size:16px;width:16px;height:16px">mail_outline</mat-icon>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 text-sm">{{ tpl.name }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">{{ tpl.trigger }}</p>
                    </div>
                  </div>
                  <mat-slide-toggle [checked]="tpl.enabled" color="primary" />
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
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
