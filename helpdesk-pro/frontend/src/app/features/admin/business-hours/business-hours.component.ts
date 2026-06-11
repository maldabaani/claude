import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

interface DayHours {
  id?: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  timezone: string;
}

interface Holiday {
  id: string;
  holidayDate: string;
  name: string;
}

interface StatusResponse {
  isOpen: boolean;
  nextOpenAt: string | null;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
  selector: 'app-business-hours',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Business Hours</h1>
          <p class="text-slate-400 text-sm mt-0.5">Configure working hours and holidays for SLA timers</p>
        </div>
        <div class="flex items-center gap-3">
          <span *ngIf="status()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                [ngClass]="status()!.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="status()!.isOpen ? 'bg-green-500' : 'bg-red-500'"></span>
            {{ status()!.isOpen ? 'OPEN' : 'CLOSED' }}
          </span>
          <span *ngIf="status() && !status()!.isOpen && status()!.nextOpenAt" class="text-xs text-slate-400">
            Opens {{ status()!.nextOpenAt | date:'MMM d, h:mm a' }}
          </span>
        </div>
      </div>

      <!-- Weekly Schedule -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden" style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 class="font-bold text-gray-900 text-sm">Weekly Schedule</h2>
        </div>
        <div class="divide-y divide-gray-50">
          <div *ngFor="let day of schedule()" class="flex items-center gap-4 px-6 py-4">
            <div class="w-28 text-sm font-semibold text-gray-700">{{ dayName(day.dayOfWeek) }}</div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" [checked]="day.isOpen" (change)="day.isOpen = !day.isOpen">
              <div class="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              <span class="ml-2 text-xs font-medium" [ngClass]="day.isOpen ? 'text-indigo-600' : 'text-gray-400'">
                {{ day.isOpen ? 'Open' : 'Closed' }}
              </span>
            </label>
            <div *ngIf="day.isOpen" class="flex items-center gap-2 ml-4">
              <input type="time" [(ngModel)]="day.openTime" class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 text-gray-700">
              <span class="text-gray-400 text-sm">to</span>
              <input type="time" [(ngModel)]="day.closeTime" class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 text-gray-700">
            </div>
            <div *ngIf="!day.isOpen" class="ml-4 text-sm text-gray-400 italic">Not working</div>
            <div class="ml-auto">
              <select [(ngModel)]="day.timezone" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 text-gray-600 bg-white">
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
          <button (click)="saveSchedule()" [disabled]="saving()"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                  style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
            <i class="pi" [ngClass]="saving() ? 'pi-spin pi-spinner' : 'pi-check'" style="font-size:13px"></i>
            {{ saving() ? 'Saving...' : 'Save Schedule' }}
          </button>
        </div>
      </div>

      <!-- Holidays -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden" style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 class="font-bold text-gray-900 text-sm">Holidays</h2>
        </div>
        <div class="p-6">
          <!-- Add Holiday Form -->
          <div class="flex items-end gap-3 mb-6">
            <div class="flex-1">
              <label class="block text-xs font-semibold text-gray-500 mb-1">Date</label>
              <input type="date" [(ngModel)]="newHolidayDate" class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 text-gray-700">
            </div>
            <div class="flex-1">
              <label class="block text-xs font-semibold text-gray-500 mb-1">Holiday Name</label>
              <input type="text" [(ngModel)]="newHolidayName" placeholder="e.g. Christmas Day" class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 text-gray-700">
            </div>
            <button (click)="addHoliday()" [disabled]="!newHolidayDate || !newHolidayName"
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
              <i class="pi pi-plus" style="font-size:13px"></i>
              Add
            </button>
          </div>

          <!-- Holiday List -->
          <div *ngIf="holidays().length > 0" class="space-y-2">
            <div *ngFor="let h of holidays()" class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <i class="pi pi-calendar text-orange-500" style="font-size:14px"></i>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ h.name }}</p>
                  <p class="text-xs text-gray-400">{{ h.holidayDate | date:'MMMM d, y' }}</p>
                </div>
              </div>
              <button (click)="deleteHoliday(h.id)" class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <i class="pi pi-trash" style="font-size:13px"></i>
              </button>
            </div>
          </div>
          <div *ngIf="holidays().length === 0" class="text-center py-8">
            <i class="pi pi-calendar text-gray-200 mb-2" style="font-size:36px;display:block;margin:0 auto 8px"></i>
            <p class="text-sm text-gray-400">No holidays configured</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BusinessHoursComponent implements OnInit {
  private readonly base = `${environment.apiUrl}/business-hours`;

  schedule = signal<DayHours[]>([]);
  holidays = signal<Holiday[]>([]);
  status = signal<StatusResponse | null>(null);
  saving = signal(false);

  newHolidayDate = '';
  newHolidayName = '';

  constructor(private http: HttpClient, private msg: MessageService) {}

  ngOnInit() {
    this.load();
  }

  dayName(dow: number): string {
    return DAY_NAMES[dow] || `Day ${dow}`;
  }

  load() {
    this.http.get<any>(`${this.base}`).subscribe(r => {
      const data: DayHours[] = r.data ?? r;
      const sorted = [1,2,3,4,5,6,7].map(d => {
        const found = data.find(x => x.dayOfWeek === d);
        return found ?? { dayOfWeek: d, isOpen: false, openTime: null, closeTime: null, timezone: 'UTC' };
      });
      this.schedule.set(sorted);
    });

    this.http.get<any>(`${this.base}/holidays`).subscribe(r => {
      this.holidays.set(r.data ?? r);
    });

    this.http.get<any>(`${this.base}/status`).subscribe(r => {
      this.status.set(r.data ?? r);
    });
  }

  saveSchedule() {
    this.saving.set(true);
    const days = this.schedule();
    let remaining = days.length;
    let hadError = false;

    days.forEach(day => {
      const payload = {
        isOpen: day.isOpen,
        openTime: day.isOpen && day.openTime ? day.openTime : null,
        closeTime: day.isOpen && day.closeTime ? day.closeTime : null,
        timezone: day.timezone || 'UTC'
      };
      this.http.put(`${this.base}/${day.dayOfWeek}`, payload).subscribe({
        next: () => {
          remaining--;
          if (remaining === 0) {
            this.saving.set(false);
            if (!hadError) this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Business hours updated' });
            this.loadStatus();
          }
        },
        error: () => {
          hadError = true;
          remaining--;
          if (remaining === 0) {
            this.saving.set(false);
            this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to save some days' });
          }
        }
      });
    });
  }

  addHoliday() {
    if (!this.newHolidayDate || !this.newHolidayName) return;
    this.http.post<any>(`${this.base}/holidays`, { holidayDate: this.newHolidayDate, name: this.newHolidayName }).subscribe({
      next: r => {
        const h = r.data ?? r;
        this.holidays.update(list => [...list, h].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate)));
        this.newHolidayDate = '';
        this.newHolidayName = '';
        this.msg.add({ severity: 'success', summary: 'Added', detail: 'Holiday added' });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to add holiday' })
    });
  }

  deleteHoliday(id: string) {
    this.http.delete(`${this.base}/holidays/${id}`).subscribe({
      next: () => {
        this.holidays.update(list => list.filter(h => h.id !== id));
        this.msg.add({ severity: 'success', summary: 'Deleted', detail: 'Holiday removed' });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete holiday' })
    });
  }

  private loadStatus() {
    this.http.get<any>(`${this.base}/status`).subscribe(r => this.status.set(r.data ?? r));
  }
}
