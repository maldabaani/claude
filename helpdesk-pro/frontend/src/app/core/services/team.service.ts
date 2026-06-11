import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  members?: any[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private base = `${environment.apiUrl}/teams`;

  constructor(private http: HttpClient) {}

  getTeams(): Observable<Team[]> {
    return this.http.get<ApiResponse<Team[]>>(this.base).pipe(map(r => r.data));
  }

  getTeam(id: string): Observable<Team> {
    return this.http.get<ApiResponse<Team>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  createTeam(data: Partial<Team>): Observable<Team> {
    return this.http.post<ApiResponse<Team>>(this.base, data).pipe(map(r => r.data));
  }

  updateTeam(id: string, data: Partial<Team>): Observable<Team> {
    return this.http.put<ApiResponse<Team>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getMembers(teamId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/${teamId}/members`).pipe(map(r => r.data));
  }

  addMember(teamId: string, userId: string): Observable<Team> {
    return this.http.post<ApiResponse<Team>>(`${this.base}/${teamId}/members`, { userId }).pipe(map(r => r.data));
  }

  removeMember(teamId: string, userId: string): Observable<Team> {
    return this.http.delete<ApiResponse<Team>>(`${this.base}/${teamId}/members/${userId}`).pipe(map(r => r.data));
  }

  assignTicketTeam(ticketId: string, teamId: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/tickets/${ticketId}/team`, { teamId }).pipe(map(r => r.data));
  }

  unassignTicketTeam(ticketId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/tickets/${ticketId}/team`).pipe(map(r => r.data));
  }
}
