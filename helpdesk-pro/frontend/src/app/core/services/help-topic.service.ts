import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface HelpTopic {
  id: string;
  name: string;
  description: string;
  departmentId: string | null;
  defaultPriority: string;
  autoAssignTeamLead: boolean;
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class HelpTopicService {
  private base = `${environment.apiUrl}/help-topics`;

  constructor(private http: HttpClient) {}

  getActiveTopics(): Observable<HelpTopic[]> {
    return this.http.get<ApiResponse<HelpTopic[]>>(this.base).pipe(map(r => r.data));
  }

  getAllTopics(): Observable<HelpTopic[]> {
    return this.http.get<ApiResponse<HelpTopic[]>>(`${this.base}/all`).pipe(map(r => r.data));
  }

  create(data: Partial<HelpTopic>): Observable<HelpTopic> {
    return this.http.post<ApiResponse<HelpTopic>>(this.base, data).pipe(map(r => r.data));
  }

  update(id: string, data: Partial<HelpTopic>): Observable<HelpTopic> {
    return this.http.put<ApiResponse<HelpTopic>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
