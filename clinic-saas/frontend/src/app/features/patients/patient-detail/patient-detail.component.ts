import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  VisitService, VisitResponse, LabOrderResponse,
  PrescriptionResponse, InvoiceResponse, RadiologyOrderResponse
} from '../../../core/services/visit.service';
import { ClinicalService } from '../../../core/services/clinical.service';

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
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
            TabViewModule, CardModule, ButtonModule, TagModule, TableModule,
            SkeletonModule, TimelineModule, DialogModule, DropdownModule,
            InputTextModule, InputTextareaModule, ToastModule],
  providers: [MessageService],
  templateUrl: './patient-detail.component.html'
})
export class PatientDetailComponent implements OnInit {
  patient        = signal<PatientDetail | null>(null);
  visits         = signal<VisitResponse[]>([]);
  labOrders      = signal<LabOrderResponse[]>([]);
  prescriptions  = signal<PrescriptionResponse[]>([]);
  invoices       = signal<InvoiceResponse[]>([]);
  radiology      = signal<RadiologyOrderResponse[]>([]);
  allergiesList  = signal<any[]>([]);
  medHistory     = signal<any[]>([]);
  loading        = signal(true);

  showStartVisit = signal(false);
  showAllergy    = signal(false);
  showMedHistory = signal(false);
  startingVisit  = signal(false);
  savingAllergy  = signal(false);
  savingMedHist  = signal(false);

  visitTypes = [
    { label: 'Walk-In',    value: 'WALK_IN' },
    { label: 'Scheduled',  value: 'SCHEDULED' },
    { label: 'Emergency',  value: 'EMERGENCY' },
    { label: 'Follow-Up',  value: 'FOLLOW_UP' },
    { label: 'Teleconsult',value: 'TELECONSULT' }
  ];

  allergenTypes = [
    { label: 'Medication',   value: 'MEDICATION' },
    { label: 'Food',         value: 'FOOD' },
    { label: 'Environmental',value: 'ENVIRONMENTAL' },
    { label: 'Latex',        value: 'LATEX' },
    { label: 'Insect',       value: 'INSECT' },
    { label: 'Other',        value: 'OTHER' }
  ];

  allergySeverities = [
    { label: 'Mild',            value: 'MILD' },
    { label: 'Moderate',        value: 'MODERATE' },
    { label: 'Severe',          value: 'SEVERE' },
    { label: 'Life Threatening',value: 'LIFE_THREATENING' }
  ];

  historyTypes = [
    { label: 'Chronic Disease',   value: 'CHRONIC_DISEASE' },
    { label: 'Surgical History',  value: 'SURGICAL_HISTORY' },
    { label: 'Hospitalization',   value: 'HOSPITALIZATION' },
    { label: 'Family History',    value: 'FAMILY_HISTORY' },
    { label: 'Social History',    value: 'SOCIAL_HISTORY' },
    { label: 'Immunization',      value: 'IMMUNIZATION' },
    { label: 'Other',             value: 'OTHER' }
  ];

  historyStatuses = [
    { label: 'Active',       value: 'ACTIVE' },
    { label: 'Resolved',     value: 'RESOLVED' },
    { label: 'In Remission', value: 'IN_REMISSION' },
    { label: 'Unknown',      value: 'UNKNOWN' }
  ];

  startVisitForm: FormGroup;
  allergyForm:    FormGroup;
  medHistForm:    FormGroup;

  constructor(
    private route:    ActivatedRoute,
    private router:   Router,
    private http:     HttpClient,
    private visitSvc: VisitService,
    private svc:      ClinicalService,
    private msg:      MessageService,
    private fb:       FormBuilder
  ) {
    this.startVisitForm = this.fb.group({
      visitType:      ['WALK_IN', Validators.required],
      chiefComplaint: ['']
    });

    this.allergyForm = this.fb.group({
      allergenType: ['MEDICATION', Validators.required],
      allergenName: ['', Validators.required],
      reaction:     [''],
      severity:     ['MODERATE'],
      notes:        ['']
    });

    this.medHistForm = this.fb.group({
      historyType:   ['CHRONIC_DISEASE', Validators.required],
      conditionName: ['', Validators.required],
      icdCode:       [''],
      status:        ['ACTIVE'],
      onsetDate:     [''],
      notes:         ['']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      patient:   this.http.get<PatientDetail>(`/api/v1/patients/${id}`),
      visits:    this.visitSvc.getVisitsByPatient(id).pipe(catchError(() => of({ content: [] }))),
      labs:      this.visitSvc.getLabOrdersByPatient(id).pipe(catchError(() => of([]))),
      rxs:       this.visitSvc.getPrescriptionsByPatient(id).pipe(catchError(() => of([]))),
      inv:       this.visitSvc.getInvoicesByPatient(id).pipe(catchError(() => of({ content: [] }))),
      rad:       this.visitSvc.getRadiologyByPatient(id).pipe(catchError(() => of([]))),
      allergies: this.svc.getAllergies(id).pipe(catchError(() => of([]))),
      history:   this.svc.getMedicalHistory(id).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ patient, visits, labs, rxs, inv, rad, allergies, history }) => {
        this.patient.set(patient);
        this.visits.set((visits as any).content ?? visits);
        this.labOrders.set(labs as LabOrderResponse[]);
        this.prescriptions.set(rxs as PrescriptionResponse[]);
        this.invoices.set((inv as any).content ?? inv);
        this.radiology.set(rad as RadiologyOrderResponse[]);
        this.allergiesList.set(allergies as any[]);
        this.medHistory.set(history as any[]);
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
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  startVisit() {
    if (this.startVisitForm.invalid) return;
    const patientId = this.patient()?.id;
    if (!patientId) return;
    this.startingVisit.set(true);
    this.svc.createVisit({ patientId, ...this.startVisitForm.value }).subscribe({
      next: (visit) => {
        this.startingVisit.set(false);
        this.showStartVisit.set(false);
        this.router.navigate(['/dashboard/visits', visit.id]);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Failed to start visit' });
        this.startingVisit.set(false);
      }
    });
  }

  saveAllergy() {
    if (this.allergyForm.invalid) return;
    const patientId = this.patient()?.id;
    if (!patientId) return;
    this.savingAllergy.set(true);
    this.svc.addAllergy({ patientId, ...this.allergyForm.value }).subscribe({
      next: (a) => {
        this.allergiesList.update(list => [...list, a]);
        this.allergyForm.reset({ allergenType: 'MEDICATION', severity: 'MODERATE' });
        this.msg.add({ severity: 'success', summary: 'Allergy recorded' });
        this.showAllergy.set(false);
        this.savingAllergy.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Failed to save allergy' });
        this.savingAllergy.set(false);
      }
    });
  }

  deleteAllergy(id: string) {
    this.svc.removeAllergy(id).subscribe({
      next: () => this.allergiesList.update(list => list.filter(a => a.id !== id)),
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to remove allergy' })
    });
  }

  saveMedHistory() {
    if (this.medHistForm.invalid) return;
    const patientId = this.patient()?.id;
    if (!patientId) return;
    this.savingMedHist.set(true);
    this.svc.addMedicalHistory({ patientId, ...this.medHistForm.value }).subscribe({
      next: (h) => {
        this.medHistory.update(list => [...list, h]);
        this.medHistForm.reset({ historyType: 'CHRONIC_DISEASE', status: 'ACTIVE' });
        this.msg.add({ severity: 'success', summary: 'History entry added' });
        this.showMedHistory.set(false);
        this.savingMedHist.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Failed to save history' });
        this.savingMedHist.set(false);
      }
    });
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

  allergySev(severity: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const m: Record<string, any> = {
      MILD: 'info', MODERATE: 'warning', SEVERE: 'danger', LIFE_THREATENING: 'danger'
    };
    return m[severity] ?? 'info';
  }

  labFlag(item: any): string {
    if (item.critical) return '🔴';
    if (item.abnormal) return '⚠️';
    return '✓';
  }
}
