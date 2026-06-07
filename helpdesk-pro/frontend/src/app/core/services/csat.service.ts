import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface CsatRatingData { id: string; ticketId: string; rating: number; comment: string; createdAt: string; }
export interface CsatStats { avgRating: number; totalRatings: number; distribution: Record<number, number>; }

@Injectable({ providedIn: 'root' })
export class CsatService {
  private base = `${environment.apiUrl}/csat`;
  constructor(private http: HttpClient) {}

  submitRating(ticketId: string, rating: number, comment: string): Observable<CsatRatingData> {
    return this.http.post<ApiResponse<CsatRatingData>>(`${this.base}/tickets/${ticketId}/rating`, { rating, comment }).pipe(map(r => r.data));
  }

  getRating(ticketId: string): Observable<CsatRatingData | null> {
    return this.http.get<ApiResponse<CsatRatingData>>(`${this.base}/tickets/${ticketId}/rating`).pipe(map(r => r.data));
  }

  getStats(): Observable<CsatStats> {
    return this.http.get<ApiResponse<CsatStats>>(`${this.base}/stats`).pipe(map(r => r.data));
  }
}
