import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TabViewModule, InputTextModule, InputNumberModule, DropdownModule,
    ButtonModule, ToastModule, SkeletonModule, ToggleButtonModule,
    PasswordModule, CheckboxModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-container">
      <div class="board-header">
        <div>
          <h2 class="board-title">Clinic Settings</h2>
          <p class="board-sub">Manage clinic configuration and preferences</p>
        </div>
      </div>

      @if (loading()) {
        <p-skeleton height="400px" />
      } @else {
        <p-tabView>

          <!-- GENERAL TAB -->
          <p-tabPanel header="General">
            <div class="settings-form">
              <div class="settings-section-title">Clinic Information</div>
              <div class="settings-grid">
                <div class="settings-field">
                  <label class="block text-sm mb-1">Clinic Name</label>
                  <input pInputText [(ngModel)]="general.clinic_name" class="w-full"
                         placeholder="e.g. Al Shifa Medical Centre" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">Phone</label>
                  <input pInputText [(ngModel)]="general.clinic_phone" class="w-full"
                         placeholder="+971-4-000-0000" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">Email</label>
                  <input pInputText [(ngModel)]="general.clinic_email" class="w-full"
                         placeholder="clinic@example.com" type="email" />
                </div>
                <div class="settings-field settings-field--full">
                  <label class="block text-sm mb-1">Address</label>
                  <input pInputText [(ngModel)]="general.clinic_address" class="w-full"
                         placeholder="Street, City, Country" />
                </div>
                <div class="settings-field settings-field--full">
                  <label class="block text-sm mb-1">Logo URL</label>
                  <input pInputText [(ngModel)]="general.clinic_logo_url" class="w-full"
                         placeholder="https://..." />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">Timezone</label>
                  <p-dropdown [(ngModel)]="general.timezone" [options]="timezoneOptions"
                              optionLabel="label" optionValue="value"
                              styleClass="w-full" placeholder="Select timezone" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">Currency</label>
                  <p-dropdown [(ngModel)]="general.currency" [options]="currencyOptions"
                              optionLabel="label" optionValue="value"
                              styleClass="w-full" placeholder="Select currency" />
                </div>
              </div>
              <div class="settings-footer">
                <button pButton label="Save General Settings" icon="pi pi-check"
                        [loading]="saving()" (click)="saveGeneral()"></button>
              </div>
            </div>
          </p-tabPanel>

          <!-- WORKING HOURS TAB -->
          <p-tabPanel header="Working Hours">
            <div class="settings-form">
              <div class="settings-section-title">Schedule Configuration</div>
              <div class="settings-grid">
                <div class="settings-field">
                  <label class="block text-sm mb-1">Opening Time (HH:mm)</label>
                  <input pInputText [(ngModel)]="hours.working_hours_start" class="w-full"
                         placeholder="08:00" pattern="[0-2][0-9]:[0-5][0-9]" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">Closing Time (HH:mm)</label>
                  <input pInputText [(ngModel)]="hours.working_hours_end" class="w-full"
                         placeholder="18:00" pattern="[0-2][0-9]:[0-5][0-9]" />
                </div>
                <div class="settings-field settings-field--full">
                  <label class="block text-sm mb-1">Working Days (comma-separated)</label>
                  <input pInputText [(ngModel)]="hours.working_days" class="w-full"
                         placeholder="MON,TUE,WED,THU,FRI" />
                  <span class="text-xs" style="color:var(--text-color-secondary)">
                    Use: MON, TUE, WED, THU, FRI, SAT, SUN
                  </span>
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">Appointment Slot (minutes)</label>
                  <p-dropdown [(ngModel)]="hours.appointment_slot_minutes" [options]="slotOptions"
                              optionLabel="label" optionValue="value"
                              styleClass="w-full" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">Consultation Fee (AED)</label>
                  <p-inputNumber [(ngModel)]="hours.consultation_fee" [min]="0" [minFractionDigits]="2"
                                 styleClass="w-full" />
                </div>
              </div>
              <div class="settings-footer">
                <button pButton label="Save Working Hours" icon="pi pi-check"
                        [loading]="saving()" (click)="saveHours()"></button>
              </div>
            </div>
          </p-tabPanel>

          <!-- NOTIFICATIONS TAB -->
          <p-tabPanel header="Notifications">
            <div class="settings-form">
              <div class="settings-section-title">Email Notification Settings</div>
              <div class="settings-grid">
                <div class="settings-field settings-field--full">
                  <div class="flex align-items-center gap-3">
                    <p-checkbox [(ngModel)]="notif.notifications_email_enabled"
                                [binary]="true" inputId="emailEnabled" />
                    <label for="emailEnabled" class="text-sm font-medium" style="cursor:pointer">
                      Enable Email Notifications
                    </label>
                  </div>
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">SMTP Host</label>
                  <input pInputText [(ngModel)]="notif.notifications_smtp_host" class="w-full"
                         placeholder="smtp.example.com" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">SMTP Port</label>
                  <input pInputText [(ngModel)]="notif.notifications_smtp_port" class="w-full"
                         placeholder="587" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">SMTP Username</label>
                  <input pInputText [(ngModel)]="notif.notifications_smtp_user" class="w-full"
                         placeholder="user@example.com" />
                </div>
                <div class="settings-field">
                  <label class="block text-sm mb-1">SMTP Password</label>
                  <p-password [(ngModel)]="notif.notifications_smtp_pass"
                              styleClass="w-full" [feedback]="false" [toggleMask]="true" />
                </div>
                <div class="settings-field settings-field--full">
                  <label class="block text-sm mb-1">From Email Address</label>
                  <input pInputText [(ngModel)]="notif.notifications_from_email" class="w-full"
                         placeholder="noreply@clinic.com" type="email" />
                </div>
              </div>
              <div class="settings-footer">
                <button pButton label="Save Notification Settings" icon="pi pi-check"
                        [loading]="saving()" (click)="saveNotifications()"></button>
              </div>
            </div>
          </p-tabPanel>

        </p-tabView>
      }
    </div>
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
    .settings-form {
      padding: 0.5rem 0;
    }
    .settings-section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 640px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
    .settings-field { display: flex; flex-direction: column; gap: 0.25rem; }
    .settings-field--full { grid-column: 1 / -1; }
    .settings-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }
  `]
})
export class SettingsComponent implements OnInit {
  loading = signal(true);
  saving  = signal(false);

  general: any = {
    clinic_name: '', clinic_phone: '', clinic_email: '',
    clinic_address: '', clinic_logo_url: '',
    timezone: 'Asia/Dubai', currency: 'AED'
  };

  hours: any = {
    working_hours_start: '08:00', working_hours_end: '18:00',
    working_days: 'MON,TUE,WED,THU,FRI',
    appointment_slot_minutes: 30, consultation_fee: null
  };

  notif: any = {
    notifications_email_enabled: false,
    notifications_smtp_host: '', notifications_smtp_port: '',
    notifications_smtp_user: '', notifications_smtp_pass: '',
    notifications_from_email: ''
  };

  timezoneOptions = [
    { label: 'Asia/Dubai',        value: 'Asia/Dubai' },
    { label: 'Asia/Riyadh',       value: 'Asia/Riyadh' },
    { label: 'Africa/Cairo',       value: 'Africa/Cairo' },
    { label: 'Europe/London',      value: 'Europe/London' },
    { label: 'America/New_York',   value: 'America/New_York' }
  ];

  currencyOptions = [
    { label: 'AED – UAE Dirham',     value: 'AED' },
    { label: 'SAR – Saudi Riyal',    value: 'SAR' },
    { label: 'USD – US Dollar',      value: 'USD' },
    { label: 'EUR – Euro',           value: 'EUR' },
    { label: 'GBP – British Pound',  value: 'GBP' }
  ];

  slotOptions = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 }
  ];

  constructor(
    private http: HttpClient,
    private msg: MessageService
  ) {}

  ngOnInit() {
    this.http.get<Record<string, any>>('/api/v1/settings')
      .pipe(catchError(() => of({})))
      .subscribe(data => {
        this.populateFromSettings(data);
        this.loading.set(false);
      });
  }

  private populateFromSettings(data: Record<string, any>) {
    const generalKeys = ['clinic_name', 'clinic_phone', 'clinic_email', 'clinic_address', 'clinic_logo_url', 'timezone', 'currency'];
    const hoursKeys   = ['working_hours_start', 'working_hours_end', 'working_days', 'appointment_slot_minutes', 'consultation_fee'];
    const notifKeys   = ['notifications_email_enabled', 'notifications_smtp_host', 'notifications_smtp_port',
                         'notifications_smtp_user', 'notifications_smtp_pass', 'notifications_from_email'];

    for (const k of generalKeys) {
      if (data[k] !== undefined) this.general[k] = data[k];
    }
    for (const k of hoursKeys) {
      if (data[k] !== undefined) this.hours[k] = data[k];
    }
    for (const k of notifKeys) {
      if (data[k] !== undefined) this.notif[k] = data[k];
    }
  }

  saveGeneral() {
    this.save(this.general);
  }

  saveHours() {
    this.save(this.hours);
  }

  saveNotifications() {
    this.save(this.notif);
  }

  private save(payload: Record<string, any>) {
    this.saving.set(true);
    this.http.put('/api/v1/settings', payload)
      .pipe(catchError(() => {
        this.msg.add({ severity: 'error', summary: 'Failed to save settings' });
        this.saving.set(false);
        return of(null);
      }))
      .subscribe(result => {
        if (result !== null) {
          this.msg.add({ severity: 'success', summary: 'Settings saved successfully' });
        }
        this.saving.set(false);
      });
  }
}
