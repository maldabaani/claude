import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';
import { Appointment } from '../../../core/models/appointment.model';
import { AppointmentService } from '../appointment.service';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
            DialogModule, ButtonModule, TagModule,
            DropdownModule, InputTextModule, InputTextareaModule, ToastModule],
  providers: [MessageService],
  templateUrl: './appointment-scheduler.component.html',
  styleUrl: './appointment-scheduler.component.scss'
})
export class AppointmentSchedulerComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────────
  view         = signal<CalendarView>('week');
  anchor       = signal<Date>(new Date());
  appointments = signal<Appointment[]>([]);
  selectedAppt = signal<Appointment | null>(null);
  detailVisible  = signal(false);
  bookingVisible = signal(false);
  saving         = signal(false);

  doctors        = signal<any[]>([]);
  patientResults = signal<any[]>([]);
  patientQuery   = '';
  private search$ = new Subject<string>();

  bookingForm: FormGroup;

  readonly apptTypes = [
    { label: 'Consultation', value: 'CONSULTATION' },
    { label: 'Follow-Up',    value: 'FOLLOW_UP' },
    { label: 'Procedure',    value: 'PROCEDURE' },
    { label: 'Lab / Review', value: 'LAB_REVIEW' },
    { label: 'Teleconsult',  value: 'TELECONSULT' }
  ];

  readonly durations = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
    { label: '90 min', value: 90 }
  ];

  // 7 am → 7 pm time slots
  readonly hourSlots = Array.from({ length: 13 }, (_, i) => i + 7);

  readonly weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ── Computed ───────────────────────────────────────────────────────────────

  // Header label changes per view
  headerLabel = computed(() => {
    const a = this.anchor();
    const v = this.view();
    if (v === 'month')
      return a.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (v === 'week') {
      const days = this.weekDays();
      const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${days[0].toLocaleDateString('en-US', o)} – ${days[6].toLocaleDateString('en-US', o)}, ${days[0].getFullYear()}`;
    }
    return a.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  });

  // 7 days starting on Monday of the anchor's week
  weekDays = computed<Date[]>(() => {
    const mon = this.getMonday(this.anchor());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  });

  // 42-cell grid (6 rows × 7 cols, Mon-first) for month view
  monthGrid = computed<CalendarCell[][]>(() => {
    const a    = this.anchor();
    const appts = this.appointments();
    const year = a.getFullYear();
    const mon  = a.getMonth();
    const today = this.fmt(new Date());

    const firstDow = new Date(year, mon, 1).getDay();         // 0=Sun
    const padBefore = (firstDow + 6) % 7;                    // Mon-first padding
    const daysInMonth = new Date(year, mon + 1, 0).getDate();

    const cells: CalendarCell[] = [];

    for (let i = padBefore - 1; i >= 0; i--) {
      const d = new Date(year, mon, -i);
      cells.push({ date: d, inMonth: false, isToday: false, appointments: this.apptsForDate(appts, d) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, mon, d);
      cells.push({ date, inMonth: true, isToday: this.fmt(date) === today, appointments: this.apptsForDate(appts, date) });
    }
    let next = 1;
    while (cells.length < 42) {
      const d = new Date(year, mon + 1, next++);
      cells.push({ date: d, inMonth: false, isToday: false, appointments: this.apptsForDate(appts, d) });
    }

    const rows: CalendarCell[][] = [];
    for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
    return rows;
  });

  // ── Constructor ────────────────────────────────────────────────────────────
  constructor(
    private svc: AppointmentService,
    private http: HttpClient,
    private msg: MessageService,
    private fb:  FormBuilder
  ) {
    this.bookingForm = this.fb.group({
      patientId:       [null, Validators.required],
      doctorId:        [null, Validators.required],
      scheduledAt:     ['',   Validators.required],
      durationMinutes: [30,   Validators.required],
      appointmentType: ['CONSULTATION'],
      notes:           ['']
    });
  }

  ngOnInit() {
    this.loadRange();
    this.loadDoctors();
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length >= 2
        ? this.http.get<any>(`/api/v1/patients/search?query=${q}&page=0&size=20`).pipe(catchError(() => of({ content: [] })))
        : of({ content: [] })
      )
    ).subscribe(res => this.patientResults.set(res.content ?? []));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  setView(v: CalendarView) {
    this.view.set(v);
    this.loadRange();
  }

  navigate(dir: -1 | 1) {
    const d = new Date(this.anchor());
    switch (this.view()) {
      case 'month': d.setMonth(d.getMonth() + dir); break;
      case 'week':  d.setDate(d.getDate() + dir * 7); break;
      case 'day':   d.setDate(d.getDate() + dir); break;
    }
    this.anchor.set(d);
    this.loadRange();
  }

  goToday() {
    this.anchor.set(new Date());
    this.loadRange();
  }

  clickDay(date: Date) {
    this.anchor.set(date);
    this.view.set('day');
    this.loadRange();
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  loadRange() {
    const a = this.anchor();
    let from: Date, to: Date;
    switch (this.view()) {
      case 'month':
        from = new Date(a.getFullYear(), a.getMonth() - 1, 15);
        to   = new Date(a.getFullYear(), a.getMonth() + 2,  5);
        break;
      case 'week':
        from = this.getMonday(a);
        to   = new Date(from); to.setDate(from.getDate() + 6);
        break;
      default:
        from = new Date(a); to = new Date(a);
    }
    this.svc.getByRange(this.fmt(from), this.fmt(to))
      .subscribe(appts => this.appointments.set(appts));
  }

  loadDoctors() {
    this.http.get<any[]>('/api/v1/users').pipe(catchError(() => of([]))).subscribe(users => {
      this.doctors.set(
        (users as any[]).filter(u => u.role === 'DOCTOR' || u.role === 'ADMIN')
          .map(u => ({ label: `Dr. ${u.firstName} ${u.lastName}`, value: u.id }))
      );
    });
  }

  // ── Appointment helpers ────────────────────────────────────────────────────
  apptsForDate(appts: Appointment[], date: Date): Appointment[] {
    const key = this.fmt(date);
    return appts
      .filter(a => a.scheduledAt.startsWith(key))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  apptsForSlot(date: Date, hour: number): Appointment[] {
    return this.apptsForDate(this.appointments(), date)
      .filter(a => new Date(a.scheduledAt).getHours() === hour);
  }

  // ── Booking ────────────────────────────────────────────────────────────────
  openBooking() {
    this.bookingForm.reset({ durationMinutes: 30, appointmentType: 'CONSULTATION' });
    this.patientResults.set([]);
    this.patientQuery = '';
    this.bookingVisible.set(true);
  }

  openBookingAt(date: Date, hour: number) {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    const local = `${this.fmt(d)}T${String(hour).padStart(2, '0')}:00`;
    this.bookingForm.reset({ durationMinutes: 30, appointmentType: 'CONSULTATION', scheduledAt: local });
    this.patientResults.set([]);
    this.patientQuery = '';
    this.bookingVisible.set(true);
  }

  saveBooking() {
    if (this.bookingForm.invalid) return;
    this.saving.set(true);
    const val = this.bookingForm.value;
    const req = { ...val, scheduledAt: new Date(val.scheduledAt).toISOString() };
    this.svc.create(req).subscribe({
      next: appt => {
        this.appointments.update(list => [...list, appt]);
        this.msg.add({ severity: 'success', summary: 'Appointment booked' });
        this.bookingVisible.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Failed to book appointment' });
        this.saving.set(false);
      }
    });
  }

  openDetail(appt: Appointment) {
    this.selectedAppt.set(appt);
    this.detailVisible.set(true);
  }

  onPatientSearch(q: string) {
    this.patientQuery = q;
    this.search$.next(q);
  }

  get patientOptions() {
    return this.patientResults().map(p => ({
      label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber})`,
      value: p.id
    }));
  }

  // ── Display helpers ────────────────────────────────────────────────────────
  isToday(date: Date): boolean { return this.fmt(date) === this.fmt(new Date()); }

  formatHour(h: number): string {
    return h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
  }

  timeLabel(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  doctorName(doctorId: string): string {
    return this.doctors().find(d => d.value === doctorId)?.label ?? '—';
  }

  statusColor(status: string): string {
    const m: Record<string, string> = {
      SCHEDULED: '#3b82f6', CONFIRMED: '#10b981', IN_PROGRESS: '#f59e0b',
      COMPLETED: '#6b7280', CANCELLED: '#ef4444', NO_SHOW: '#6366f1'
    };
    return m[status] ?? '#3b82f6';
  }

  statusColorSoft(status: string): string {
    const m: Record<string, string> = {
      SCHEDULED: '#eff6ff', CONFIRMED: '#ecfdf5', IN_PROGRESS: '#fffbeb',
      COMPLETED: '#f9fafb', CANCELLED: '#fef2f2', NO_SHOW: '#f5f3ff'
    };
    return m[status] ?? '#eff6ff';
  }

  statusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const m: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      SCHEDULED: 'info', CONFIRMED: 'success', IN_PROGRESS: 'warning',
      COMPLETED: 'info', CANCELLED: 'danger', NO_SHOW: 'danger'
    };
    return m[status] ?? 'info';
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }
}
