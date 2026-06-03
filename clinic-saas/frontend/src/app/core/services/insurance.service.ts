import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InsuranceClaim, InsurancePayer, InsurancePolicy } from '../models/insurance.model';

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private readonly BASE = '/api/v1/insurance';

  constructor(private http: HttpClient) {}

  getPayers(): Observable<InsurancePayer[]> {
    return this.http.get<InsurancePayer[]>(`${this.BASE}/payers`);
  }

  createPayer(data: Partial<InsurancePayer>): Observable<InsurancePayer> {
    return this.http.post<InsurancePayer>(`${this.BASE}/payers`, data);
  }

  getPoliciesByPatient(patientId: string): Observable<InsurancePolicy[]> {
    return this.http.get<InsurancePolicy[]>(`${this.BASE}/policies/patient/${patientId}`);
  }

  createPolicy(data: any): Observable<InsurancePolicy> {
    return this.http.post<InsurancePolicy>(`${this.BASE}/policies`, data);
  }

  deactivatePolicy(policyId: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/policies/${policyId}`);
  }

  getClaims(status?: string): Observable<InsuranceClaim[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<InsuranceClaim[]>(`${this.BASE}/claims`, { params });
  }

  getClaimByInvoice(invoiceId: string): Observable<InsuranceClaim | null> {
    return this.http.get<InsuranceClaim>(`${this.BASE}/claims/invoice/${invoiceId}`).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        throw err;
      })
    );
  }

  createClaim(invoiceId: string, insurancePolicyId: string): Observable<InsuranceClaim> {
    return this.http.post<InsuranceClaim>(`${this.BASE}/claims/invoice/${invoiceId}`, { insurancePolicyId });
  }

  submitClaim(claimId: string): Observable<InsuranceClaim> {
    return this.http.post<InsuranceClaim>(`${this.BASE}/claims/${claimId}/submit`, {});
  }

  processClaim(claimId: string, data: any): Observable<InsuranceClaim> {
    return this.http.post<InsuranceClaim>(`${this.BASE}/claims/${claimId}/process`, data);
  }

  resubmitClaim(claimId: string, notes: string): Observable<InsuranceClaim> {
    let params = new HttpParams();
    if (notes) {
      params = params.set('notes', notes);
    }
    return this.http.post<InsuranceClaim>(`${this.BASE}/claims/${claimId}/resubmit`, {}, { params });
  }
}
