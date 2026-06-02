import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, of, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface QueueItem {
  id: string;
  patientFirstName: string;
  patientLastName: string;
  patientMrn: string;
  patientId: string;
  doctorId: string;
  visitType: string;
  status: 'WAITING' | 'TRIAGE' | 'IN_PROGRESS';
  chiefComplaint: string;
  checkedInAt: string;
  createdAt: string;
}

@Component({
  selector: 'app-queue-board',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-container">

      <div class="queue-header">
        <div>
          <h2 class="page-title">Waiting Room</h2>
          <p class="page-sub">Live queue — {{ totalCount() }} patient{{ totalCount() !== 1 ? 's' : '' }} active</p>
        </div>
        <div class="queue-header-right">
          <span class="last-refresh">Updated {{ lastRefresh() }}</span>
          <button class="refresh-btn" (click)="load()" title="Refresh">
            <i class="pi pi-refresh"></i>
          </button>
        </div>
      </div>

      <div class="queue-columns">

        <!-- WAITING -->
        <div class="q-col">
          <div class="q-col-head waiting">
            <div class="q-dot"></div>
            <span>Waiting</span>
            <span class="q-count">{{ waiting().length }}</span>
          </div>
          <div class="q-cards">
            @for (item of waiting(); track item.id) {
              <div class="q-card">
                <div class="q-card-top">
                  <div class="q-avatar">{{ item.patientFirstName[0] }}{{ item.patientLastName[0] }}</div>
                  <div class="q-patient">
                    <span class="q-name">{{ item.patientFirstName }} {{ item.patientLastName }}</span>
                    <span class="q-mrn">{{ item.patientMrn }}</span>
                  </div>
                  <span class="q-wait">{{ waitTime(item.checkedInAt || item.createdAt) }}</span>
                </div>
                @if (item.chiefComplaint) {
                  <p class="q-complaint">"{{ item.chiefComplaint }}"</p>
                }
                <div class="q-actions">
                  <button class="q-btn q-btn-primary" (click)="updateStatus(item.id, 'TRIAGE')">
                    <i class="pi pi-arrow-right"></i> Triage
                  </button>
                  <a class="q-btn q-btn-ghost" [routerLink]="['/dashboard/visits', item.id]">
                    <i class="pi pi-external-link"></i> View
                  </a>
                </div>
              </div>
            }
            @if (waiting().length === 0) {
              <div class="q-empty"><i class="pi pi-check-circle"></i><span>No patients waiting</span></div>
            }
          </div>
        </div>

        <!-- TRIAGE -->
        <div class="q-col">
          <div class="q-col-head triage">
            <div class="q-dot"></div>
            <span>Triage</span>
            <span class="q-count">{{ triage().length }}</span>
          </div>
          <div class="q-cards">
            @for (item of triage(); track item.id) {
              <div class="q-card">
                <div class="q-card-top">
                  <div class="q-avatar amber">{{ item.patientFirstName[0] }}{{ item.patientLastName[0] }}</div>
                  <div class="q-patient">
                    <span class="q-name">{{ item.patientFirstName }} {{ item.patientLastName }}</span>
                    <span class="q-mrn">{{ item.patientMrn }}</span>
                  </div>
                  <span class="q-wait">{{ waitTime(item.checkedInAt || item.createdAt) }}</span>
                </div>
                @if (item.chiefComplaint) {
                  <p class="q-complaint">"{{ item.chiefComplaint }}"</p>
                }
                <div class="q-actions">
                  <button class="q-btn q-btn-green" (click)="updateStatus(item.id, 'IN_PROGRESS')">
                    <i class="pi pi-play"></i> Start
                  </button>
                  <a class="q-btn q-btn-ghost" [routerLink]="['/dashboard/visits', item.id]">
                    <i class="pi pi-external-link"></i> View
                  </a>
                </div>
              </div>
            }
            @if (triage().length === 0) {
              <div class="q-empty"><i class="pi pi-inbox"></i><span>No patients in triage</span></div>
            }
          </div>
        </div>

        <!-- IN PROGRESS -->
        <div class="q-col">
          <div class="q-col-head inprogress">
            <div class="q-dot"></div>
            <span>In Progress</span>
            <span class="q-count">{{ inProgress().length }}</span>
          </div>
          <div class="q-cards">
            @for (item of inProgress(); track item.id) {
              <div class="q-card">
                <div class="q-card-top">
                  <div class="q-avatar green">{{ item.patientFirstName[0] }}{{ item.patientLastName[0] }}</div>
                  <div class="q-patient">
                    <span class="q-name">{{ item.patientFirstName }} {{ item.patientLastName }}</span>
                    <span class="q-mrn">{{ item.patientMrn }}</span>
                  </div>
                  <span class="q-wait">{{ waitTime(item.checkedInAt || item.createdAt) }}</span>
                </div>
                @if (item.chiefComplaint) {
                  <p class="q-complaint">"{{ item.chiefComplaint }}"</p>
                }
                <div class="q-actions">
                  <button class="q-btn q-btn-outline-red" (click)="updateStatus(item.id, 'COMPLETED')">
                    <i class="pi pi-check"></i> Complete
                  </button>
                  <a class="q-btn q-btn-ghost" [routerLink]="['/dashboard/visits', item.id]">
                    <i class="pi pi-external-link"></i> View
                  </a>
                </div>
              </div>
            }
            @if (inProgress().length === 0) {
              <div class="q-empty"><i class="pi pi-user-minus"></i><span>No active consultations</span></div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .queue-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .page-title { font-size: 1.375rem; font-weight: 800; color: #1e2a45; letter-spacing:-0.03em; margin:0; }
    .page-sub   { font-size: 0.875rem; color: #8a94a6; margin:0.25rem 0 0; }
    .queue-header-right { display:flex; align-items:center; gap:0.75rem; }
    .last-refresh { font-size:0.75rem; color:#8a94a6; }
    .refresh-btn { background:none; border:1px solid #e5e7eb; border-radius:8px; padding:6px 10px; cursor:pointer; color:#64748b; transition:all .15s; &:hover{background:#f1f5f9;} i{font-size:.875rem;} }

    .queue-columns { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; align-items:start; @media(max-width:900px){grid-template-columns:1fr;} }

    .q-col { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.06); }

    .q-col-head {
      display:flex; align-items:center; gap:0.5rem; padding:.875rem 1rem;
      font-size:.8125rem; font-weight:700; letter-spacing:.01em;
      border-bottom:1px solid #f1f5f9;
      .q-dot { width:8px; height:8px; border-radius:50%; }
      .q-count { margin-left:auto; background:rgba(0,0,0,.06); border-radius:20px; padding:2px 8px; font-size:.7rem; }
      &.waiting   { color:#2563eb; .q-dot{background:#3b82f6;} }
      &.triage    { color:#d97706; .q-dot{background:#f59e0b;} }
      &.inprogress{ color:#059669; .q-dot{background:#10b981;} }
    }

    .q-cards { padding:.75rem; display:flex; flex-direction:column; gap:.5rem; min-height:120px; }

    .q-card {
      background:#f8faff; border:1px solid #e9ecf3; border-radius:10px;
      padding:.75rem; transition:box-shadow .15s;
      &:hover { box-shadow:0 2px 8px rgba(0,0,0,.08); }
    }

    .q-card-top { display:flex; align-items:center; gap:.625rem; margin-bottom:.375rem; }

    .q-avatar {
      width:34px; height:34px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#4f8ef7,#7c5cf6);
      display:flex; align-items:center; justify-content:center;
      font-size:.75rem; font-weight:700; color:#fff; text-transform:uppercase;
      &.amber { background:linear-gradient(135deg,#f59e0b,#d97706); }
      &.green { background:linear-gradient(135deg,#10b981,#059669); }
    }

    .q-patient { flex:1; min-width:0;
      .q-name { display:block; font-size:.8125rem; font-weight:600; color:#1e2a45; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .q-mrn  { font-size:.7rem; color:#8a94a6; font-family:monospace; }
    }

    .q-wait { font-size:.7rem; color:#8a94a6; font-weight:600; white-space:nowrap; flex-shrink:0; }

    .q-complaint { font-size:.75rem; color:#64748b; font-style:italic; margin:.125rem 0 .5rem; padding-left:.375rem; border-left:2px solid #e5e7eb; line-height:1.4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .q-actions { display:flex; gap:.375rem; }

    .q-btn {
      border:none; border-radius:7px; padding:.35rem .7rem; font-size:.75rem; font-weight:600;
      cursor:pointer; display:flex; align-items:center; gap:.3rem; font-family:inherit;
      text-decoration:none; transition:all .15s;
      i { font-size:.7rem; }
      &.q-btn-primary { background:#3b82f6; color:#fff; &:hover{background:#2563eb;} }
      &.q-btn-green   { background:#10b981; color:#fff; &:hover{background:#059669;} }
      &.q-btn-outline-red { background:none; border:1px solid #fca5a5; color:#dc2626; &:hover{background:#fef2f2;} }
      &.q-btn-ghost   { background:none; border:1px solid #e5e7eb; color:#64748b; &:hover{background:#f1f5f9;} }
    }

    .q-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:1.5rem; color:#c4c9d4; font-size:.8125rem; i{font-size:1.5rem;} }
  `]
})
export class QueueBoardComponent implements OnInit {

  queue      = signal<QueueItem[]>([]);
  lastRefresh = signal('—');

  waiting   = computed(() => this.queue().filter(i => i.status === 'WAITING'));
  triage    = computed(() => this.queue().filter(i => i.status === 'TRIAGE'));
  inProgress= computed(() => this.queue().filter(i => i.status === 'IN_PROGRESS'));
  totalCount= computed(() => this.queue().length);

  constructor(private http: HttpClient, private msg: MessageService) {
    // auto-refresh every 30 seconds
    interval(30_000).pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  ngOnInit() { this.load(); }

  load() {
    this.http.get<QueueItem[]>('/api/v1/visits/queue')
      .pipe(catchError(() => of([])))
      .subscribe(items => {
        this.queue.set(items);
        this.lastRefresh.set(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      });
  }

  updateStatus(visitId: string, status: string) {
    this.http.patch(`/api/v1/visits/${visitId}/status`, null, { params: { status } })
      .pipe(catchError(() => {
        this.msg.add({ severity: 'error', summary: 'Failed to update status' });
        return of(null);
      }))
      .subscribe(res => {
        if (res === null) return;
        if (status === 'COMPLETED') {
          this.queue.update(q => q.filter(i => i.id !== visitId));
        } else {
          this.queue.update(q => q.map(i => i.id === visitId ? { ...i, status: status as QueueItem['status'] } : i));
        }
        this.msg.add({ severity: 'success', summary: `Visit moved to ${status.toLowerCase().replace('_', ' ')}` });
      });
  }

  waitTime(iso: string): string {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
}
