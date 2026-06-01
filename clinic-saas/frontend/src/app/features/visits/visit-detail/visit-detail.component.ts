import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { ClinicalService, LabTestItem, MedicationItem, DiagnosisResponse } from '../../../core/services/clinical.service';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, TagModule, InputTextModule, InputTextareaModule,
    DropdownModule, InputNumberModule, MultiSelectModule, TableModule,
    DialogModule, ToastModule, DividerModule
  ],
  providers: [MessageService],
  templateUrl: './visit-detail.component.html'
})
export class VisitDetailComponent implements OnInit {
  visit = signal<any>(null);
  diagnoses = signal<DiagnosisResponse[]>([]);
  labOrders = signal<any[]>([]);
  prescriptions = signal<any[]>([]);
  radiologyOrders = signal<any[]>([]);
  labTests = signal<LabTestItem[]>([]);
  medications = signal<MedicationItem[]>([]);
  loading = signal(true);

  // forms
  vitalsForm: FormGroup;
  diagnosisForm: FormGroup;
  labOrderForm: FormGroup;
  prescriptionForm: FormGroup;
  radiologyForm: FormGroup;

  // dialog visibility
  showVitals = signal(false);
  showDiagnosis = signal(false);
  showLab = signal(false);
  showPrescription = signal(false);
  showRadiology = signal(false);

  savingVitals = signal(false);
  savingDiagnosis = signal(false);
  savingLab = signal(false);
  savingPrescription = signal(false);
  savingRadiology = signal(false);
  checkingOut = signal(false);

  diagnosisTypes = [
    { label: 'Primary', value: 'PRIMARY' },
    { label: 'Secondary', value: 'SECONDARY' },
    { label: 'Comorbidity', value: 'COMORBIDITY' },
    { label: 'Differential', value: 'DIFFERENTIAL' }
  ];

  priorities = [
    { label: 'Routine', value: 'ROUTINE' },
    { label: 'Urgent', value: 'URGENT' },
    { label: 'STAT', value: 'STAT' }
  ];

  modalities = [
    { label: 'X-Ray', value: 'XRAY' },
    { label: 'CT Scan', value: 'CT_SCAN' },
    { label: 'MRI', value: 'MRI' },
    { label: 'Ultrasound', value: 'ULTRASOUND' },
    { label: 'Mammography', value: 'MAMMOGRAPHY' }
  ];

  routes = [
    { label: 'Oral', value: 'ORAL' },
    { label: 'IV', value: 'INTRAVENOUS' },
    { label: 'IM', value: 'INTRAMUSCULAR' },
    { label: 'Topical', value: 'TOPICAL' },
    { label: 'Inhalation', value: 'INHALATION' }
  ];

  frequencies = [
    { label: 'Once daily', value: 'ONCE_DAILY' },
    { label: 'Twice daily', value: 'TWICE_DAILY' },
    { label: 'Three times daily', value: 'THREE_TIMES_DAILY' },
    { label: 'Four times daily', value: 'FOUR_TIMES_DAILY' },
    { label: 'Every 8 hours', value: 'EVERY_8_HOURS' },
    { label: 'Every 12 hours', value: 'EVERY_12_HOURS' },
    { label: 'As needed', value: 'AS_NEEDED' },
    { label: 'Weekly', value: 'WEEKLY' }
  ];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    private svc: ClinicalService,
    private msg: MessageService
  ) {
    this.vitalsForm = this.fb.group({
      bpSystolic: [null], bpDiastolic: [null], heartRate: [null],
      respiratoryRate: [null], temperature: [null], oxygenSaturation: [null],
      weightKg: [null], heightCm: [null], bloodGlucose: [null], notes: ['']
    });

    this.diagnosisForm = this.fb.group({
      diagnosisType: ['PRIMARY', Validators.required],
      icdCode: [''], icdDescription: ['', Validators.required],
      clinicalDescription: [''], chronic: [false]
    });

    this.labOrderForm = this.fb.group({
      labTestIds: [[], Validators.required],
      priority: ['ROUTINE'],
      clinicalIndication: ['']
    });

    this.prescriptionForm = this.fb.group({
      notes: [''],
      items: this.fb.array([this.newRxItem()])
    });

    this.radiologyForm = this.fb.group({
      modality: ['XRAY', Validators.required],
      bodyPart: [''], laterality: [''],
      clinicalIndication: [''], priority: ['ROUTINE']
    });
  }

  get rxItems(): FormArray { return this.prescriptionForm.get('items') as FormArray; }

  newRxItem(): FormGroup {
    return this.fb.group({
      medicationId: [null],
      medicationName: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['ONCE_DAILY', Validators.required],
      route: ['ORAL'],
      durationDays: [null],
      quantity: [null],
      instructions: ['']
    });
  }

  addRxItem() { this.rxItems.push(this.newRxItem()); }
  removeRxItem(i: number) { if (this.rxItems.length > 1) this.rxItems.removeAt(i); }

  onMedSelect(item: FormGroup, medId: string) {
    const med = this.medications().find(m => m.id === medId);
    if (med) item.patchValue({ medicationName: med.genericName });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      visit: this.http.get<any>(`/api/v1/visits/${id}`),
      diagnoses: this.svc.getDiagnosesByVisit(id).pipe(catchError(() => of([]))),
      labs: this.svc.getLabOrdersByVisit(id).pipe(catchError(() => of([]))),
      rxs: this.svc.getPrescriptionsByVisit(id).pipe(catchError(() => of([]))),
      rad: this.svc.getRadiologyByVisit(id).pipe(catchError(() => of([]))),
      labTests: this.svc.getLabTests().pipe(catchError(() => of([]))),
      medications: this.svc.getMedications().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ visit, diagnoses, labs, rxs, rad, labTests, medications }) => {
        this.visit.set(visit);
        this.diagnoses.set(diagnoses as DiagnosisResponse[]);
        this.labOrders.set(labs as any[]);
        this.prescriptions.set(rxs as any[]);
        this.radiologyOrders.set(rad as any[]);
        this.labTests.set(labTests as LabTestItem[]);
        this.medications.set(medications as MedicationItem[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveVitals() {
    this.savingVitals.set(true);
    this.svc.recordVitals(this.visit().id, this.vitalsForm.value).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Vitals recorded' });
        this.showVitals.set(false);
        this.savingVitals.set(false);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Failed to save vitals' }); this.savingVitals.set(false); }
    });
  }

  saveDiagnosis() {
    if (this.diagnosisForm.invalid) return;
    this.savingDiagnosis.set(true);
    const req = { ...this.diagnosisForm.value, visitId: this.visit().id, patientId: this.visit().patientId };
    this.svc.addDiagnosis(req).subscribe({
      next: (d) => {
        this.diagnoses.update(list => [...list, d]);
        this.diagnosisForm.reset({ diagnosisType: 'PRIMARY', chronic: false });
        this.msg.add({ severity: 'success', summary: 'Diagnosis added' });
        this.showDiagnosis.set(false);
        this.savingDiagnosis.set(false);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Failed to add diagnosis' }); this.savingDiagnosis.set(false); }
    });
  }

  saveLabOrder() {
    if (this.labOrderForm.invalid) return;
    this.savingLab.set(true);
    const req = { ...this.labOrderForm.value, visitId: this.visit().id };
    this.svc.createLabOrder(req).subscribe({
      next: (order) => {
        this.labOrders.update(list => [...list, order]);
        this.labOrderForm.reset({ priority: 'ROUTINE', labTestIds: [] });
        this.msg.add({ severity: 'success', summary: 'Lab order created' });
        this.showLab.set(false);
        this.savingLab.set(false);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Failed to create lab order' }); this.savingLab.set(false); }
    });
  }

  savePrescription() {
    if (this.prescriptionForm.invalid) return;
    this.savingPrescription.set(true);
    const req = { ...this.prescriptionForm.value, visitId: this.visit().id };
    this.svc.createPrescription(req).subscribe({
      next: (rx) => {
        this.prescriptions.update(list => [...list, rx]);
        this.prescriptionForm.reset({ items: [] });
        this.rxItems.clear();
        this.rxItems.push(this.newRxItem());
        this.msg.add({ severity: 'success', summary: 'Prescription created' });
        this.showPrescription.set(false);
        this.savingPrescription.set(false);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Failed to create prescription' }); this.savingPrescription.set(false); }
    });
  }

  saveRadiology() {
    if (this.radiologyForm.invalid) return;
    this.savingRadiology.set(true);
    const req = { ...this.radiologyForm.value, visitId: this.visit().id };
    this.svc.createRadiologyOrder(req).subscribe({
      next: (order) => {
        this.radiologyOrders.update(list => [...list, order]);
        this.radiologyForm.reset({ modality: 'XRAY', priority: 'ROUTINE' });
        this.msg.add({ severity: 'success', summary: 'Radiology order created' });
        this.showRadiology.set(false);
        this.savingRadiology.set(false);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Failed to create order' }); this.savingRadiology.set(false); }
    });
  }

  checkout() {
    this.checkingOut.set(true);
    this.svc.checkoutVisit(this.visit().id).subscribe({
      next: (v) => {
        this.visit.set(v);
        this.msg.add({ severity: 'success', summary: 'Patient checked out' });
        this.checkingOut.set(false);
      },
      error: () => { this.msg.add({ severity: 'error', summary: 'Checkout failed' }); this.checkingOut.set(false); }
    });
  }

  removeDiagnosis(id: string) {
    this.svc.deleteDiagnosis(id).subscribe({
      next: () => this.diagnoses.update(list => list.filter(d => d.id !== id)),
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to remove diagnosis' })
    });
  }

  statusSev(s: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const m: Record<string, any> = { COMPLETED: 'success', RESULTED: 'success', ACTIVE: 'success', FINAL: 'success', WAITING: 'info', ORDERED: 'info', IN_PROGRESS: 'warning', CANCELLED: 'danger' };
    return m[s] ?? 'info';
  }

  labTestOptions() {
    return this.labTests().map(t => ({ label: `${t.name} (${t.code})`, value: t.id }));
  }

  medicationOptions() {
    return this.medications().map(m => ({ label: `${m.genericName}${m.brandName ? ' / ' + m.brandName : ''} ${m.strength ?? ''}`, value: m.id }));
  }

  isCompleted(): boolean {
    return this.visit()?.status === 'COMPLETED';
  }
}
