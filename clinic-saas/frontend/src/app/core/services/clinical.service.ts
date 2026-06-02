import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VisitType } from '../models/visit.model';

export interface CreateVisitRequest {
  patientId: string;
  visitType: VisitType;
  appointmentId?: string;
  chiefComplaint?: string;
}

export interface UpdateVitalsRequest {
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weightKg?: number;
  heightCm?: number;
  bloodGlucose?: number;
  notes?: string;
}

export interface CreateDiagnosisRequest {
  visitId: string;
  patientId: string;
  diagnosisType: 'PRIMARY' | 'SECONDARY' | 'COMORBIDITY' | 'DIFFERENTIAL';
  icdCode?: string;
  icdDescription?: string;
  clinicalDescription?: string;
  chronic?: boolean;
}

export interface CreateLabOrderRequest {
  visitId: string;
  labTestIds: string[];
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  clinicalIndication?: string;
}

export interface CreatePrescriptionRequest {
  visitId: string;
  validUntil?: string;
  notes?: string;
  items: PrescriptionItemRequest[];
}

export interface PrescriptionItemRequest {
  medicationId?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route?: string;
  durationDays?: number;
  quantity?: number;
  instructions?: string;
}

export interface CreateRadiologyOrderRequest {
  visitId: string;
  modality: string;
  bodyPart?: string;
  laterality?: string;
  clinicalIndication?: string;
  priority?: string;
}

export interface AddRadiologyReportRequest {
  findings: string;
  impression: string;
  recommendation?: string;
  status?: string;
}

export interface AddLabResultRequest {
  resultValue?: number | null;
  resultText?: string | null;
  unit?: string | null;
  abnormal: boolean;
  critical: boolean;
  notes?: string | null;
}

export interface InvoiceItemRequest {
  serviceType: string;
  description: string;
  referenceId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface CreateInvoiceRequest {
  patientId: string;
  visitId?: string;
  dueDate?: string;
  notes?: string;
  items: InvoiceItemRequest[];
}

export interface AddPaymentRequest {
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
}

export interface LabTestItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
  normalRangeText?: string;
}

export interface MedicationItem {
  id: string;
  genericName: string;
  brandName?: string;
  drugClass?: string;
  form?: string;
  strength?: string;
}

export interface DiagnosisResponse {
  id: string;
  visitId: string;
  diagnosisType: string;
  icdCode?: string;
  icdDescription?: string;
  clinicalDescription?: string;
  chronic: boolean;
  createdAt: string;
}

export interface CreateAllergyRequest {
  patientId: string;
  allergenType: string;
  allergenName: string;
  reaction?: string;
  severity?: string;
  notes?: string;
}

export interface CreateMedicalHistoryRequest {
  patientId: string;
  historyType: string;
  conditionName: string;
  icdCode?: string;
  status?: string;
  onsetDate?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class ClinicalService {
  constructor(private http: HttpClient) {}

  // Visits
  createVisit(req: CreateVisitRequest): Observable<any> {
    return this.http.post<any>('/api/v1/visits', req);
  }
  getVisit(id: string): Observable<any> {
    return this.http.get<any>(`/api/v1/visits/${id}`);
  }
  recordVitals(visitId: string, req: UpdateVitalsRequest): Observable<void> {
    return this.http.post<void>(`/api/v1/visits/${visitId}/vitals`, req);
  }
  checkoutVisit(visitId: string): Observable<any> {
    return this.http.put<any>(`/api/v1/visits/${visitId}/checkout`, {});
  }

  // Diagnoses
  addDiagnosis(req: CreateDiagnosisRequest): Observable<DiagnosisResponse> {
    return this.http.post<DiagnosisResponse>('/api/v1/diagnoses', req);
  }
  getDiagnosesByVisit(visitId: string): Observable<DiagnosisResponse[]> {
    return this.http.get<DiagnosisResponse[]>(`/api/v1/diagnoses?visitId=${visitId}`);
  }
  deleteDiagnosis(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/diagnoses/${id}`);
  }

  // Lab catalog + orders
  getLabTests(): Observable<LabTestItem[]> {
    return this.http.get<LabTestItem[]>('/api/v1/lab-orders/tests');
  }
  createLabOrder(req: CreateLabOrderRequest): Observable<any> {
    return this.http.post<any>('/api/v1/lab-orders', req);
  }
  getLabOrdersByVisit(visitId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/lab-orders?visitId=${visitId}`);
  }

  // Medications + prescriptions
  getMedications(): Observable<MedicationItem[]> {
    return this.http.get<MedicationItem[]>('/api/v1/medications');
  }
  createPrescription(req: CreatePrescriptionRequest): Observable<any> {
    return this.http.post<any>('/api/v1/prescriptions', req);
  }
  getPrescriptionsByVisit(visitId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/prescriptions?visitId=${visitId}`);
  }

  // Radiology
  createRadiologyOrder(req: CreateRadiologyOrderRequest): Observable<any> {
    return this.http.post<any>('/api/v1/radiology-orders', req);
  }
  getRadiologyByVisit(visitId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/radiology-orders?visitId=${visitId}`);
  }

  // Allergies
  addAllergy(req: CreateAllergyRequest): Observable<any> {
    return this.http.post<any>('/api/v1/allergies', req);
  }
  getAllergies(patientId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/allergies?patientId=${patientId}`);
  }
  removeAllergy(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/allergies/${id}`);
  }

  // Medical History
  addMedicalHistory(req: CreateMedicalHistoryRequest): Observable<any> {
    return this.http.post<any>('/api/v1/medical-history', req);
  }
  getMedicalHistory(patientId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/medical-history?patientId=${patientId}`);
  }

  // Lab results
  addLabResult(itemId: string, req: AddLabResultRequest): Observable<void> {
    return this.http.put<void>(`/api/v1/lab-orders/items/${itemId}/result`, req);
  }

  // Radiology report
  addRadiologyReport(orderId: string, req: AddRadiologyReportRequest): Observable<any> {
    return this.http.post<any>(`/api/v1/radiology-orders/${orderId}/report`, req);
  }

  // Invoices
  createInvoice(req: CreateInvoiceRequest): Observable<any> {
    return this.http.post<any>('/api/v1/invoices', req);
  }
  addPayment(invoiceId: string, req: AddPaymentRequest): Observable<any> {
    return this.http.post<any>(`/api/v1/invoices/${invoiceId}/payments`, req);
  }
}
