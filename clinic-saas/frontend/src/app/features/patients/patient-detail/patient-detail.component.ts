import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  VisitService, VisitResponse, LabOrderResponse,
  PrescriptionResponse, InvoiceResponse, RadiologyOrderResponse
} from '../../../core/services/visit.service';

interface PatientDetail {
  id: string; medicalRecordNumber: string; firstName: string; lastName: string;
  dateOfBirth: string; gender: string; bloodType: string; phone: string;
  email: string; addressLine1: string; city: string; country: string;
  emergencyContactName: string; emergencyContactPhone: string;
  allergies: string; active: boolean; createdAt: string;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TabViewModule, CardModule, ButtonModule,
            TagModule, TableModule, SkeletonModule, TimelineModule],
  templateUrl: './patient-detail.component.html'
})
export class PatientDetailComponent implements OnInit {
  patient = signal<PatientDetail | null>(null);
  visits = signal<VisitResponse[]>([]);
  labOrders = signal<LabOrderResponse[]>([]);
  prescriptions = signal<PrescriptionResponse[]>([]);
  invoices = signal<InvoiceResponse[]>([]);
  radiology = signal<RadiologyOrderResponse[]>([]);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private visitSvc: VisitService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      patient: this.http.get<PatientDetail>(`/api/v1/patients/${id}`),
      visits:  this.visitSvc.getVisitsByPatient(id).pipe(catchError(() => of({ content: [] }))),
      labs:    this.visitSvc.getLabOrdersByPatient(id).pipe(catchError(() => of([]))),
      rxs:     this.visitSvc.getPrescriptionsByPatient(id).pipe(catchError(() => of([]))),
      inv:     this.visitSvc.getInvoicesByPatient(id).pipe(catchError(() => of({ content: [] }))),
      rad:     this.visitSvc.getRadiologyByPatient(id).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ patient, visits, labs, rxs, inv, rad }) => {
        this.patient.set(patient);
        this.visits.set((visits as any).content ?? visits);
        this.labOrders.set(labs as LabOrderResponse[]);
        this.prescriptions.set(rxs as PrescriptionResponse[]);
        this.invoices.set((inv as any).content ?? inv);
        this.radiology.set(rad as RadiologyOrderResponse[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  get fullName(): string {
    const p = this.patient();
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  age(dob: string): number {
    const d = new Date(dob);
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  statusSev(status: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const m: Record<string, any> = {
      ACTIVE: 'success', COMPLETED: 'success', PAID: 'success', FINAL: 'success',
      WAITING: 'info', ORDERED: 'info', SCHEDULED: 'info',
      IN_PROGRESS: 'warning', RESULTED: 'warning', PARTIALLY_PAID: 'warning',
      CANCELLED: 'danger', OVERDUE: 'danger', CRITICAL: 'danger'
    };
    return m[status] ?? 'info';
  }

  labFlag(item: any): string {
    if (item.critical) return '🔴';
    if (item.abnormal) return '⚠️';
    return '✓';
  }
}
