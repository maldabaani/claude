import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { map } from 'rxjs/operators';

interface CustomerStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgCsat: number | null;
  totalTimeLoggedMinutes: number;
}

interface CustomerNote {
  id: string;
  customerId: string;
  agentId: string;
  agentName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerProfile {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
    organizationId?: string;
  };
  stats: CustomerStats;
  recentTickets: any[];
  notes: CustomerNote[];
}

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule, StatusBadgeComponent],
  template: `
    <div *ngIf="loading()" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>

    <div *ngIf="!loading() && profile()" class="max-w-5xl mx-auto space-y-6 p-6">

      <!-- Header card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
               style="background: linear-gradient(135deg, #6366F1, #4F46E5)">
            {{ initials() }}
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-bold text-gray-900">{{ profile()!.user.fullName }}</h1>
            <p class="text-sm text-slate-500">{{ profile()!.user.email }}</p>
            <div class="flex items-center gap-3 mt-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-indigo-100 text-indigo-700': profile()!.user.role === 'CUSTOMER',
                      'bg-blue-100 text-blue-700': profile()!.user.role === 'AGENT',
                      'bg-purple-100 text-purple-700': profile()!.user.role === 'ADMIN',
                      'bg-teal-100 text-teal-700': profile()!.user.role === 'TEAM_LEAD'
                    }">
                {{ profile()!.user.role }}
              </span>
              <span class="text-xs text-slate-400">Member since {{ profile()!.user.createdAt | date:'MMM d, yyyy' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ profile()!.stats.totalTickets }}</p>
          <p class="text-xs text-slate-500 mt-1">Total Tickets</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-2xl font-bold text-amber-600">{{ profile()!.stats.openTickets }}</p>
          <p class="text-xs text-slate-500 mt-1">Open</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ profile()!.stats.resolvedTickets }}</p>
          <p class="text-xs text-slate-500 mt-1">Resolved</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-2xl font-bold text-indigo-600">
            {{ profile()!.stats.avgCsat != null ? (profile()!.stats.avgCsat! | number:'1.1-1') : '—' }}
          </p>
          <p class="text-xs text-slate-500 mt-1">Avg CSAT</p>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Left: Ticket history -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Tickets</h2>
          <div *ngIf="profile()!.recentTickets.length === 0" class="text-sm text-slate-400 text-center py-6">
            No tickets yet
          </div>
          <ul class="space-y-3">
            <li *ngFor="let t of profile()!.recentTickets"
                class="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                [routerLink]="['/agent/tickets', t.id]">
              <div class="min-w-0">
                <p class="text-xs text-slate-400 font-mono">#{{ t.ticketNumber }}</p>
                <p class="text-sm font-medium text-gray-900 truncate">{{ t.title }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ t.createdAt | date:'MMM d, yyyy' }}</p>
              </div>
              <app-status-badge [status]="t.status" />
            </li>
          </ul>
        </div>

        <!-- Right: Agent Notes -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Agent Notes</h2>
          <div class="flex-1 space-y-3 max-h-80 overflow-y-auto">
            <div *ngIf="profile()!.notes.length === 0" class="text-sm text-slate-400 text-center py-6">
              No notes yet
            </div>
            <div *ngFor="let note of profile()!.notes"
                 class="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p class="text-sm text-gray-800">{{ note.content }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ note.agentName }} &middot; {{ note.createdAt | date:'MMM d, yyyy' }}</p>
            </div>
          </div>
          <!-- Add note -->
          <div class="border-t border-gray-100 pt-3">
            <textarea [(ngModel)]="newNoteContent"
                      rows="3"
                      placeholder="Add a private note about this customer..."
                      class="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"></textarea>
            <button (click)="addNote()"
                    [disabled]="!newNoteContent.trim() || savingNote()"
                    class="mt-2 w-full py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                    style="background:#6366F1">
              {{ savingNote() ? 'Saving...' : 'Add Note' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <div *ngIf="!loading() && !profile()" class="text-center py-20 text-slate-400">
      Customer not found.
    </div>
  `,
})
export class CustomerProfileComponent implements OnInit {
  loading = signal(true);
  profile = signal<CustomerProfile | null>(null);
  savingNote = signal(false);
  newNoteContent = '';

  private customerId!: string;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get('id')!;
    this.loadProfile();
  }

  initials(): string {
    const name = this.profile()?.user?.fullName || '';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'C';
  }

  loadProfile() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/users/${this.customerId}/profile`).subscribe({
      next: res => {
        this.profile.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  addNote() {
    if (!this.newNoteContent.trim()) return;
    this.savingNote.set(true);
    this.http.post<any>(`${environment.apiUrl}/users/${this.customerId}/notes`, { content: this.newNoteContent.trim() }).subscribe({
      next: res => {
        const p = this.profile()!;
        this.profile.set({ ...p, notes: [res.data, ...p.notes] });
        this.newNoteContent = '';
        this.savingNote.set(false);
      },
      error: () => this.savingNote.set(false)
    });
  }
}
