import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VisitResponse {
  id: string;
  patientId: string;
  doctorId: string;
  visitType: string;
  status: string;
  chiefComplaint: string;
  clinicalNotes: string;
  checkedInAt: string;
  checkedOutAt: string;
  createdAt: string;
}

export interface LabOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  clinicalIndication: string;
  sampleCollectedAt: string;
  resultedAt: string;
  createdAt: string;
  items: LabOrderItemResponse[];
}

export interface LabOrderItemResponse {
  id: string;
  labTestId: string;
  labTestName: string;
  status: string;
  resultValue: number;
  resultText: string;
  resultUnit: string;
  normalRangeSnapshot: string;
  abnormal: boolean;
  critical: boolean;
  resultedAt: string;
}

export interface PrescriptionResponse {
  id: string;
  prescriptionNumber: string;
  status: string;
  validUntil: string;
  notes: string;
  createdAt: string;
  items: PrescriptionItemResponse[];
}

export interface PrescriptionItemResponse {
  id: string;
  medicationNameSnapshot: string;
  dosage: string;
  frequency: string;
  route: string;
  durationDays: number;
  quantity: number;
  instructions: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  createdAt: string;
  items: any[];
  payments: any[];
}

export interface RadiologyOrderResponse {
  id: string;
  orderNumber: string;
  modality: string;
  bodyPart: string;
  status: string;
  priority: string;
  clinicalIndication: string;
  performedAt: string;
  createdAt: string;
  report?: { findings: string; impression: string; status: string };
}

@Injectable({ providedIn: 'root' })
export class VisitService {
  constructor(private http: HttpClient) {}

  getVisitsByPatient(patientId: string, page = 0, size = 20): Observable<any> {
    return this.http.get<any>(`/api/v1/visits?patientId=${patientId}&page=${page}&size=${size}`);
  }

  getLabOrdersByPatient(patientId: string): Observable<LabOrderResponse[]> {
    return this.http.get<LabOrderResponse[]>(`/api/v1/lab-orders?patientId=${patientId}`);
  }

  getPrescriptionsByPatient(patientId: string): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(`/api/v1/prescriptions?patientId=${patientId}`);
  }

  getInvoicesByPatient(patientId: string): Observable<any> {
    return this.http.get<any>(`/api/v1/invoices?patientId=${patientId}`);
  }

  getRadiologyByPatient(patientId: string): Observable<RadiologyOrderResponse[]> {
    return this.http.get<RadiologyOrderResponse[]>(`/api/v1/radiology-orders?patientId=${patientId}`);
  }
}
