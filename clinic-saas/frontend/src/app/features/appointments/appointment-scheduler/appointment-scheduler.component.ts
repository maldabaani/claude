import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin  from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Appointment } from '../../../core/models/appointment.model';
import { AppointmentService } from '../appointment.service';

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, DialogModule, ButtonModule, CardModule, TagModule],
  templateUrl: './appointment-scheduler.component.html'
})
export class AppointmentSchedulerComponent implements OnInit {
  selectedEvent = signal<Appointment | null>(null);
  dialogVisible  = signal(false);

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,timeGridDay'
    },
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    businessHours: { daysOfWeek: [0,1,2,3,4,5], startTime: '08:00', endTime: '18:00' },
    events: [],
    select:     (arg) => this.onDateSelect(arg),
    eventClick: (arg) => this.onEventClick(arg)
  };

  constructor(private svc: AppointmentService) {}

  ngOnInit() { this.loadThisWeek(); }

  private loadThisWeek() {
    const now  = new Date();
    const from = new Date(now); from.setDate(now.getDate() - now.getDay());
    const to   = new Date(from); to.setDate(from.getDate() + 6);
    const fmt  = (d: Date) => d.toISOString().split('T')[0];

    this.svc.getByRange(fmt(from), fmt(to)).subscribe(appts => {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: appts.map(a => ({
          id:    a.id,
          title: a.appointmentType ?? 'Appointment',
          start: a.scheduledAt,
          end:   new Date(new Date(a.scheduledAt).getTime() + a.durationMinutes * 60_000).toISOString(),
          color: this.statusColor(a.status),
          extendedProps: a
        }))
      };
    });
  }

  private onDateSelect(_arg: DateSelectArg) {
    // TODO: open create-appointment dialog pre-filled with selected slot
  }

  private onEventClick(arg: EventClickArg) {
    this.selectedEvent.set(arg.event.extendedProps as Appointment);
    this.dialogVisible.set(true);
  }

  private statusColor(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: '#3b82f6', CONFIRMED: '#10b981', IN_PROGRESS: '#f59e0b',
      COMPLETED: '#6b7280', CANCELLED: '#ef4444', NO_SHOW: '#6366f1'
    };
    return map[status] ?? '#3b82f6';
  }

  closeDialog() { this.dialogVisible.set(false); }
}
