import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,
    TabsModule, InputTextModule, ButtonModule, ToggleSwitchModule, CheckboxModule, SelectModule],
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
            <p-tab value="2">Business Hours</p-tab>
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

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Auto-assign New Tickets</label>
                    <div class="flex items-center gap-3 mt-1">
                      <p-toggle-switch [(ngModel)]="autoAssignTickets" (onChange)="saveAutoAssign($event.checked)" />
                      <span class="text-sm text-slate-500">Automatically assign tickets to the agent with fewest open tickets</span>
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

            <!-- Business Hours tab -->
            <p-tabpanel value="2">
              <div class="p-8 max-w-lg space-y-6">
                <div>
                  <h3 class="font-bold text-gray-900 mb-1">Business Hours</h3>
                  <p class="text-sm text-slate-400">Configure working hours for SLA calculations.</p>
                </div>

                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-1.5">Start Time</label>
                      <p-select [options]="hourOptions" [(ngModel)]="bhStart" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-1.5">End Time</label>
                      <p-select [options]="hourOptions" [(ngModel)]="bhEnd" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Business Days</label>
                    <div class="flex flex-wrap gap-3">
                      <div *ngFor="let day of weekDays" class="flex items-center gap-1.5">
                        <p-checkbox [inputId]="'day-' + day.value" [value]="day.value"
                                    [(ngModel)]="selectedDays" />
                        <label [for]="'day-' + day.value" class="text-sm text-gray-700 cursor-pointer">{{ day.label }}</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Timezone</label>
                    <input pInputText [(ngModel)]="bhTimezone" class="w-full" placeholder="UTC" />
                  </div>
                </div>

                <div *ngIf="bhSaved()"
                     class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                     style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0">
                  <i class="pi pi-check-circle" style="font-size:16px"></i>
                  Business hours saved successfully
                </div>

                <button pButton type="button" (click)="saveBusinessHours()"
                        [disabled]="bhSaving()"
                        styleClass="!rounded-lg !font-semibold !px-6">
                  <i class="pi pi-save mr-2" style="font-size:18px"></i>
                  {{ bhSaving() ? 'Saving...' : 'Save Business Hours' }}
                </button>
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
  autoAssignTickets = false;

  // Business hours
  bhStart = '09:00';
  bhEnd = '17:00';
  bhTimezone = 'UTC';
  selectedDays: string[] = ['1','2','3','4','5'];
  bhSaving = signal(false);
  bhSaved = signal(false);

  hourOptions = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return { label: `${h}:00`, value: `${h}:00` };
  });

  weekDays = [
    { label: 'Mon', value: '1' },
    { label: 'Tue', value: '2' },
    { label: 'Wed', value: '3' },
    { label: 'Thu', value: '4' },
    { label: 'Fri', value: '5' },
    { label: 'Sat', value: '6' },
    { label: 'Sun', value: '7' },
  ];

  constructor(private fb: FormBuilder, private settingsService: SettingsService) {}

  ngOnInit() {
    this.settingsService.getSettings().subscribe(s => {
      this.generalForm.patchValue({ companyName: s.companyName, supportEmail: s.supportEmail });
      this.autoAssignTickets = s.autoAssignTickets || false;
      if (s.businessHoursStart) this.bhStart = s.businessHoursStart;
      if (s.businessHoursEnd) this.bhEnd = s.businessHoursEnd;
      if (s.businessTimezone) this.bhTimezone = s.businessTimezone;
      if (s.businessDays) this.selectedDays = s.businessDays.split(',').map((d: string) => d.trim());
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

  saveBusinessHours() {
    this.bhSaving.set(true);
    this.settingsService.updateSettings({
      businessHoursStart: this.bhStart,
      businessHoursEnd: this.bhEnd,
      businessDays: this.selectedDays.join(','),
      businessTimezone: this.bhTimezone,
    }).subscribe({
      next: () => {
        this.bhSaving.set(false);
        this.bhSaved.set(true);
        setTimeout(() => this.bhSaved.set(false), 3000);
      },
      error: () => this.bhSaving.set(false),
    });
  }

  saveAutoAssign(enabled: boolean) {
    this.settingsService.updateSettings({ autoAssignTickets: enabled } as any).subscribe(() => {
      this.generalSaved.set(true);
      setTimeout(() => this.generalSaved.set(false), 3000);
    });
  }

  toggleNotification(key: string, enabled: boolean) {
    this.settingsService.updateSettings({ [key]: enabled } as any).subscribe(() => {
      this.notifSaved.set(true);
      setTimeout(() => this.notifSaved.set(false), 3000);
    });
  }
}
