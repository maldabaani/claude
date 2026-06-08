import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface TicketTask {
  id: string;
  ticketId: string;
  title: string;
  completed: boolean;
  assignedToId: string | null;
  assignedToName: string | null;
  dueDate: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private base = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getTasks(ticketId: string): Observable<TicketTask[]> {
    return this.http.get<ApiResponse<TicketTask[]>>(`${this.base}/${ticketId}/tasks`).pipe(map(r => r.data));
  }

  createTask(ticketId: string, title: string): Observable<TicketTask> {
    return this.http.post<ApiResponse<TicketTask>>(`${this.base}/${ticketId}/tasks`, { title }).pipe(map(r => r.data));
  }

  toggleTask(ticketId: string, taskId: string): Observable<TicketTask> {
    return this.http.patch<ApiResponse<TicketTask>>(`${this.base}/${ticketId}/tasks/${taskId}`, {}).pipe(map(r => r.data));
  }

  deleteTask(ticketId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${ticketId}/tasks/${taskId}`);
  }
}
