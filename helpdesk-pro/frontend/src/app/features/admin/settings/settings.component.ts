import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,
    TabsModule, InputTextModule, ButtonModule, ToggleSwitchModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Settings</h1>
        <p class="text-sm text-slate-400 mt-0.5">Configure system preferences and notifications</p>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden" style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">General</p-tab>
            <p-tab value="1">Email Notifications</p-tab>
          </p-tablist>
          <p-tabpanels>

            <!-- General tab -->
            <p-tabpanel value="0">
              <form [formGroup]="generalForm" (ngSubmit)="saveGeneral()" class="p-8 max-w-lg space-y-6">
                <div>
                  <h3 class="font-bold text-gray-900 mb-1">System Identity</h3>
                  <p class="text-sm text-slate-400">Configure your helpdesk name and contact info.</p>
                </div>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                    <input pInputText formControlName="companyName" class="w-full" placeholder="Company Name" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Support Email</label>
                    <input pInputText formControlName="supportEmail" type="email" class="w-full" placeholder="support@company.com" />
                  </div>
                </div>

                <div *ngIf="generalSaved()"
                     class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                     style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0">
                  <i class="pi pi-check-circle" style="font-size:16px"></i>
                  Settings saved successfully
                </div>

                <button pButton type="submit"
                        [disabled]="saving()"
                        styleClass="!rounded-lg !font-semibold !px-6">
                  <i class="pi pi-save mr-2" style="font-size:18px"></i>
                  {{ saving() ? 'Saving...' : 'Save Changes' }}
                </button>
              </form>
            </p-tabpanel>

            <!-- Email Notifications tab -->
            <p-tabpanel value="1">
              <div class="p-8">
                <div class="mb-6">
                  <h3 class="font-bold text-gray-900 mb-1">Email Notifications</h3>
                  <p class="text-sm text-slate-400">Control which automated emails are sent to users.</p>
                </div>

                <div class="space-y-3 max-w-2xl">
                  <div *ngFor="let tpl of emailTemplates()"
                       class="flex items-center justify-between p-4 rounded-xl border transition-colors"
                       style="background:#F8FAFC;border-color:#F1F5F9">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <i class="pi pi-envelope text-slate-400" style="font-size:17px"></i>
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900 text-sm">{{ tpl.name }}</p>
                        <p class="text-xs text-slate-400 mt-0.5">{{ tpl.trigger }}</p>
                      </div>
                    </div>
                    <p-toggle-switch
                      [(ngModel)]="tpl.enabled"
                      (onChange)="toggleNotification(tpl.key, $event.checked)" />
                  </div>
                </div>

                <div *ngIf="notifSaved()"
                     class="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium max-w-2xl"
                     style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0">
                  <i class="pi pi-check-circle" style="font-size:16px"></i>
                  Notification preferences saved
                </div>
              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  generalForm = this.fb.group({
    companyName: [''],
    supportEmail: [''],
  });

  emailTemplates = signal<{ key: string; name: string; trigger: string; enabled: boolean }[]>([]);
  saving = signal(false);
  generalSaved = signal(false);
  notifSaved = signal(false);

  constructor(private fb: FormBuilder, private settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.getSettings().subscribe(s => {
      this.generalForm.patchValue({ companyName: s.companyName, supportEmail: s.supportEmail });
      this.emailTemplates.set([
        { key: 'notifyTicketCreated',  name: 'Ticket Created',  trigger: 'On ticket submission',          enabled: s.notifyTicketCreated },
        { key: 'notifyCommentAdded',   name: 'Comment Added',   trigger: 'On new reply or internal note', enabled: s.notifyCommentAdded },
        { key: 'notifyStatusChanged',  name: 'Status Changed',  trigger: 'On ticket status update',       enabled: s.notifyStatusChanged },
        { key: 'notifyTicketAssigned', name: 'Ticket Assigned', trigger: 'On agent assignment',           enabled: s.notifyTicketAssigned },
        { key: 'notifySlaBreached',    name: 'SLA Breached',    trigger: 'When SLA deadline is missed',   enabled: s.notifySlaBreached },
      ]);
    });
  }

  saveGeneral() {
    this.saving.set(true);
    this.settingsService.updateSettings(this.generalForm.value as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.generalSaved.set(true);
        setTimeout(() => this.generalSaved.set(false), 3000);
      },
      error: () => this.saving.set(false),
    });
  }

  toggleNotification(key: string, enabled: boolean) {
    this.settingsService.updateSettings({ [key]: enabled } as any).subscribe(() => {
      this.notifSaved.set(true);
      setTimeout(() => this.notifSaved.set(false), 3000);
    });
  }
}
