import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
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
import { PdfService } from '../../../core/services/pdf.service';
import { ChartModule } from 'primeng/chart';
import { InsuranceService } from '../../../core/services/insurance.service';
import { InsurancePayer, InsurancePolicy } from '../../../core/models/insurance.model';

interface PatientDetail {
  id: string; medicalRecordNumber: string; firstName: string; lastName: string;
  dateOfBirth: string; gender: string; bloodType?: string | null; phone?: string | null;
  email?: string | null; addressLine1?: string | null; city?: string | null; country?: string | null;
  emergencyContactName?: string | null; emergencyContactPhone?: string | null;
  allergies?: string | null; active: boolean; createdAt: string;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
            TabViewModule, CardModule, ButtonModule, TagModule, TableModule,
            SkeletonModule, TimelineModule, DialogModule, DropdownModule,
            InputTextModule, InputTextareaModule, InputNumberModule, CalendarModule,
            ToastModule, ChartModule],
  providers: [MessageService],
  templateUrl: './patient-detail.component.html',
  styles: [`
    .detail-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
    }
    .detail-header-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .detail-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }
    .detail-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.375rem;
      font-size: 0.8125rem;
      color: #64748b;
    }
    .mrn-chip {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.72rem;
      font-weight: 600;
      color: #6366f1;
      background: #eef2ff;
      padding: 0.15rem 0.5rem;
      border-radius: 5px;
    }
    .blood-chip {
      font-size: 0.72rem;
      font-weight: 700;
      color: #ef4444;
      background: #fef2f2;
      padding: 0.15rem 0.5rem;
      border-radius: 5px;
    }
    .meta-sep::before { content: '·'; margin-right: 0.5rem; color: #cbd5e1; }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    @media (max-width: 768px) { .demo-grid { grid-template-columns: 1fr; } }
    .demo-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.125rem 1.25rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .demo-card-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      i { font-size: 0.75rem; }
    }
    .demo-card-rows {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.875rem;
      color: #334155;
    }
    .vitals-charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .vitals-chart-card {
      background: #f8faff;
      border: 1px solid #e9ecf3;
      border-radius: 10px;
      padding: 0.875rem;
    }
    .vitals-chart-title {
      font-size: 0.8rem; font-weight: 700; color: #374151;
      margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.375rem;
    }
    .vitals-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      &.bp { background: #ef4444; }
      &.hr { background: #f59e0b; }
      &.wt { background: #10b981; }
      &.bg { background: #8b5cf6; }
    }
    @media (max-width: 700px) { .vitals-charts-grid { grid-template-columns: 1fr; } }
  `]
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
  vitalsHistory  = signal<any[]>([]);
  loading        = signal(true);

  // ── Vitals chart config ────────────────────────────────────
  vitalsChartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }
    },
    elements: { line: { tension: 0.4 }, point: { radius: 4 } }
  };

  private vitalLabels() {
    return this.vitalsHistory().map(v =>
      new Date(v.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
  }

  bpChartData() {
    const labels = this.vitalLabels();
    return {
      labels,
      datasets: [
        { label: 'Systolic',  data: this.vitalsHistory().map(v => v.bpSystolic),  borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)',  fill: true },
        { label: 'Diastolic', data: this.vitalsHistory().map(v => v.bpDiastolic), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true }
      ]
    };
  }

  hrChartData() {
    return {
      labels: this.vitalLabels(),
      datasets: [{ label: 'Heart Rate', data: this.vitalsHistory().map(v => v.heartRate), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', fill: true }]
    };
  }

  weightChartData() {
    return {
      labels: this.vitalLabels(),
      datasets: [{ label: 'Weight kg', data: this.vitalsHistory().map(v => v.weightKg), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true }]
    };
  }

  glucoseChartData() {
    return {
      labels: this.vitalLabels(),
      datasets: [{ label: 'Glucose', data: this.vitalsHistory().map(v => v.bloodGlucose), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.08)', fill: true }]
    };
  }

  showStartVisit = signal(false);
  showAllergy    = signal(false);
  showMedHistory = signal(false);
  showInvoice    = signal(false);
  showPayment    = signal(false);
  startingVisit  = signal(false);
  savingAllergy  = signal(false);
  savingMedHist  = signal(false);
  savingInvoice  = signal(false);
  savingPayment  = signal(false);
  selectedInvoice = signal<any>(null);

  // ── Insurance state ────────────────────────────────────────
  policies         = signal<InsurancePolicy[]>([]);
  payers           = signal<InsurancePayer[]>([]);
  loadingPolicies  = signal(false);
  showAddPolicy    = signal(false);
  savingPolicy     = signal(false);

  policyForm!: FormGroup;

  coverageTypes = [
    { label: 'Basic',         value: 'BASIC' },
    { label: 'Standard',      value: 'STANDARD' },
    { label: 'Comprehensive', value: 'COMPREHENSIVE' },
    { label: 'Family',        value: 'FAMILY' },
    { label: 'Individual',    value: 'INDIVIDUAL' }
  ];

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
  invoiceForm:    FormGroup;
  paymentForm:    FormGroup;

  serviceTypes = [
    { label: 'Consultation',  value: 'CONSULTATION' },
    { label: 'Lab Test',      value: 'LAB_TEST' },
    { label: 'Radiology',     value: 'RADIOLOGY' },
    { label: 'Medication',    value: 'MEDICATION' },
    { label: 'Procedure',     value: 'PROCEDURE' },
    { label: 'Nursing',       value: 'NURSING' },
    { label: 'Room Charge',   value: 'ROOM_CHARGE' },
    { label: 'Other',         value: 'OTHER' }
  ];

  paymentMethods = [
    { label: 'Cash',           value: 'CASH' },
    { label: 'Debit Card',     value: 'DEBIT_CARD' },
    { label: 'Credit Card',    value: 'CREDIT_CARD' },
    { label: 'Insurance',      value: 'INSURANCE' },
    { label: 'Bank Transfer',  value: 'BANK_TRANSFER' },
    { label: 'Mobile Payment', value: 'MOBILE_PAYMENT' },
    { label: 'Cheque',         value: 'CHEQUE' }
  ];

  constructor(
    private route:    ActivatedRoute,
    private router:   Router,
    private http:     HttpClient,
    private visitSvc: VisitService,
    private svc:      ClinicalService,
    private msg:      MessageService,
    private fb:       FormBuilder,
    private pdf:      PdfService,
    private insuranceSvc: InsuranceService
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

    this.invoiceForm = this.fb.group({
      dueDate: [''],
      notes:   [''],
      items:   this.fb.array([this.newInvoiceItem()])
    });

    this.paymentForm = this.fb.group({
      amount:               [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod:        ['CASH', Validators.required],
      transactionReference: [''],
      notes:                ['']
    });

    this.policyForm = this.fb.group({
      payerId:            ['', Validators.required],
      policyNumber:       ['', Validators.required],
      memberNumber:       [''],
      coverageType:       [''],
      validFrom:          [null],
      validTo:            [null],
      copayAmount:        [null],
      deductibleAmount:   [null],
      coveragePercentage: [null],
      notes:              ['']
    });
  }

  get invoiceItems(): FormArray { return this.invoiceForm.get('items') as FormArray; }

  newInvoiceItem(): FormGroup {
    return this.fb.group({
      serviceType:    ['CONSULTATION', Validators.required],
      description:    ['', Validators.required],
      quantity:       [1,    [Validators.required, Validators.min(1)]],
      unitPrice:      [null, [Validators.required, Validators.min(0)]],
      discountAmount: [0]
    });
  }

  addInvoiceItem()         { this.invoiceItems.push(this.newInvoiceItem()); }
  removeInvoiceItem(i: number) { if (this.invoiceItems.length > 1) this.invoiceItems.removeAt(i); }

  invoiceTotal(): number {
    return this.invoiceItems.controls.reduce((sum, ctrl) => {
      const v = ctrl.value;
      return sum + ((v.quantity ?? 0) * (v.unitPrice ?? 0)) - (v.discountAmount ?? 0);
    }, 0);
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
      history:   this.svc.getMedicalHistory(id).pipe(catchError(() => of([]))),
      vitals:    this.visitSvc.getVitalsByPatient(id).pipe(catchError(() => of([]))),
      policies:  this.insuranceSvc.getPoliciesByPatient(id).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ patient, visits, labs, rxs, inv, rad, allergies, history, vitals, policies }) => {
        this.patient.set(patient);
        this.visits.set((visits as any).content ?? visits);
        this.labOrders.set(labs as LabOrderResponse[]);
        this.prescriptions.set(rxs as PrescriptionResponse[]);
        this.invoices.set((inv as any).content ?? inv);
        this.radiology.set(rad as RadiologyOrderResponse[]);
        this.allergiesList.set(allergies as any[]);
        this.medHistory.set(history as any[]);
        this.vitalsHistory.set(vitals as any[]);
        this.policies.set(policies as InsurancePolicy[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPolicies() {
    const patientId = this.patient()?.id;
    if (!patientId) return;
    this.loadingPolicies.set(true);
    this.insuranceSvc.getPoliciesByPatient(patientId)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.policies.set(data as InsurancePolicy[]);
        this.loadingPolicies.set(false);
      });
  }

  openAddPolicy() {
    this.insuranceSvc.getPayers()
      .pipe(catchError(() => of([])))
      .subscribe(data => this.payers.set(data as InsurancePayer[]));
    this.policyForm.reset();
    this.showAddPolicy.set(true);
  }

  savePolicy() {
    if (this.policyForm.invalid) return;
    const patientId = this.patient()?.id;
    if (!patientId) return;
    this.savingPolicy.set(true);
    const val = this.policyForm.value;
    const payload: any = {
      patientId,
      payerId:            val.payerId,
      policyNumber:       val.policyNumber,
      memberNumber:       val.memberNumber || null,
      coverageType:       val.coverageType || null,
      validFrom:          val.validFrom ? (val.validFrom instanceof Date ? val.validFrom.toISOString().split('T')[0] : val.validFrom) : null,
      validTo:            val.validTo ? (val.validTo instanceof Date ? val.validTo.toISOString().split('T')[0] : val.validTo) : null,
      copayAmount:        val.copayAmount ?? null,
      deductibleAmount:   val.deductibleAmount ?? null,
      coveragePercentage: val.coveragePercentage ?? null,
      notes:              val.notes || null
    };
    this.insuranceSvc.createPolicy(payload).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Insurance policy added' });
        this.showAddPolicy.set(false);
        this.savingPolicy.set(false);
        this.loadPolicies();
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Failed to add policy' });
        this.savingPolicy.set(false);
      }
    });
  }

  deactivatePolicy(policyId: string) {
    this.insuranceSvc.deactivatePolicy(policyId).subscribe({
      next: () => {
        this.policies.update(list => list.map(p => p.id === policyId ? { ...p, active: false } : p));
        this.msg.add({ severity: 'success', summary: 'Policy deactivated' });
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to deactivate policy' })
    });
  }

  policySeverity(active: boolean): 'success' | 'danger' {
    return active ? 'success' : 'danger';
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

  saveInvoice() {
    if (this.invoiceForm.invalid) return;
    const patientId = this.patient()?.id;
    if (!patientId) return;
    this.savingInvoice.set(true);
    this.svc.createInvoice({ patientId, ...this.invoiceForm.value }).subscribe({
      next: (inv) => {
        this.invoices.update(list => [...list, inv]);
        this.invoiceForm.reset({ dueDate: '', notes: '' });
        this.invoiceItems.clear();
        this.invoiceItems.push(this.newInvoiceItem());
        this.msg.add({ severity: 'success', summary: 'Invoice created' });
        this.showInvoice.set(false);
        this.savingInvoice.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Failed to create invoice' });
        this.savingInvoice.set(false);
      }
    });
  }

  openPayment(invoice: any) {
    this.selectedInvoice.set(invoice);
    this.paymentForm.reset({ paymentMethod: 'CASH' });
    this.showPayment.set(true);
  }

  savePayment() {
    if (this.paymentForm.invalid) return;
    this.savingPayment.set(true);
    this.svc.addPayment(this.selectedInvoice()!.id, this.paymentForm.value).subscribe({
      next: (inv) => {
        this.invoices.update(list => list.map(i => i.id === inv.id ? inv : i));
        this.msg.add({ severity: 'success', summary: 'Payment recorded' });
        this.showPayment.set(false);
        this.savingPayment.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Failed to record payment' });
        this.savingPayment.set(false);
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

  downloadInvoice(inv: InvoiceResponse) {
    const p = this.patient();
    if (!p) return;
    this.pdf.printInvoice(inv, { firstName: p.firstName, lastName: p.lastName, medicalRecordNumber: p.medicalRecordNumber });
  }

  downloadPrescription(rx: PrescriptionResponse) {
    const p = this.patient();
    if (!p) return;
    this.pdf.printPrescription(rx, { firstName: p.firstName, lastName: p.lastName, medicalRecordNumber: p.medicalRecordNumber, dateOfBirth: p.dateOfBirth });
  }
}
