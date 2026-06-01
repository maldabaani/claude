import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';
import { Appointment } from '../../../core/models/appointment.model';
import { AppointmentService } from '../appointment.service';

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
            DialogModule, ButtonModule, CardModule, TagModule,
            DropdownModule, InputTextModule, InputTextareaModule,
            InputNumberModule, ToastModule],
  providers: [MessageService],
  templateUrl: './appointment-scheduler.component.html',
  styleUrl: './appointment-scheduler.component.scss'
})
export class AppointmentSchedulerComponent implements OnInit {

  appointments    = signal<Appointment[]>([]);
  selectedAppt    = signal<Appointment | null>(null);
  detailVisible   = signal(false);
  bookingVisible  = signal(false);
  weekStart       = signal<Date>(this.getMonday(new Date()));
  saving          = signal(false);

  doctors         = signal<any[]>([]);
  patientResults  = signal<any[]>([]);
  patientQuery    = '';
  private search$ = new Subject<string>();

  bookingForm: FormGroup;

  apptTypes = [
    { label: 'Consultation',     value: 'CONSULTATION' },
    { label: 'Follow-Up',        value: 'FOLLOW_UP' },
    { label: 'Procedure',        value: 'PROCEDURE' },
    { label: 'Lab / Review',     value: 'LAB_REVIEW' },
    { label: 'Teleconsult',      value: 'TELECONSULT' }
  ];

  durations = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
    { label: '90 min', value: 90 }
  ];

  weekDays = computed(() => {
    const days: Date[] = [];
    const start = this.weekStart();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  });

  weekRangeLabel = computed(() => {
    const days = this.weekDays();
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${days[0].toLocaleDateString('en-US', opts)} – ${days[6].toLocaleDateString('en-US', opts)}, ${days[0].getFullYear()}`;
  });

  private apptsByDay = computed(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of this.appointments()) {
      const key = appt.scheduledAt.split('T')[0];
      const list = map.get(key) ?? [];
      list.push(appt);
      map.set(key, list);
    }
    return map;
  });

  constructor(
    private svc: AppointmentService,
    private http: HttpClient,
    private msg: MessageService,
    private fb: FormBuilder
  ) {
    this.bookingForm = this.fb.group({
      patientId:       [null, Validators.required],
      doctorId:        [null, Validators.required],
      scheduledAt:     ['', Validators.required],
      durationMinutes: [30,  Validators.required],
      appointmentType: ['CONSULTATION'],
      notes:           ['']
    });
  }

  ngOnInit() {
    this.loadWeek();
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

  loadDoctors() {
    this.http.get<any[]>('/api/v1/users').pipe(catchError(() => of([]))).subscribe(users => {
      this.doctors.set(
        (users as any[]).filter(u => u.role === 'DOCTOR' || u.role === 'ADMIN')
          .map(u => ({ label: `Dr. ${u.firstName} ${u.lastName}`, value: u.id }))
      );
    });
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

  loadWeek() {
    const start = this.weekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    this.svc.getByRange(this.fmt(start), this.fmt(end))
      .subscribe(appts => this.appointments.set(appts));
  }

  prevWeek() {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() - 7);
    this.weekStart.set(d);
    this.loadWeek();
  }

  nextWeek() {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + 7);
    this.weekStart.set(d);
    this.loadWeek();
  }

  goToday() {
    this.weekStart.set(this.getMonday(new Date()));
    this.loadWeek();
  }

  apptsByDate(date: Date): Appointment[] {
    return this.apptsByDay().get(this.fmt(date)) ?? [];
  }

  openDetail(appt: Appointment) {
    this.selectedAppt.set(appt);
    this.detailVisible.set(true);
  }

  openBooking() {
    this.bookingForm.reset({ durationMinutes: 30, appointmentType: 'CONSULTATION' });
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
      next: (appt) => {
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

  isToday(date: Date): boolean {
    return this.fmt(date) === this.fmt(new Date());
  }

  dayLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  }

  timeLabel(isoStr: string): string {
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  statusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      SCHEDULED: 'info', CONFIRMED: 'success', IN_PROGRESS: 'warning',
      COMPLETED: 'info', CANCELLED: 'danger', NO_SHOW: 'danger'
    };
    return map[status] ?? 'info';
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: '#3b82f6', CONFIRMED: '#10b981', IN_PROGRESS: '#f59e0b',
      COMPLETED: '#6b7280', CANCELLED: '#ef4444', NO_SHOW: '#6366f1'
    };
    return map[status] ?? '#3b82f6';
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
