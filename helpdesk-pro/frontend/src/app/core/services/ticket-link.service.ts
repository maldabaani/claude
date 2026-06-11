import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export type LinkType = 'RELATED_TO' | 'BLOCKS' | 'IS_BLOCKED_BY' | 'DUPLICATES' | 'IS_DUPLICATED_BY';

export interface TicketLink {
  id: string;
  linkedTicketId: string;
  linkedTicketNumber: string;
  linkedTicketSubject: string;
  linkedTicketStatus: string;
  linkType: LinkType;
  direction: string;
}

@Injectable({ providedIn: 'root' })
export class TicketLinkService {
  private base = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getLinks(ticketId: string): Observable<TicketLink[]> {
    return this.http.get<ApiResponse<TicketLink[]>>(`${this.base}/${ticketId}/links`).pipe(map(r => r.data));
  }

  addLink(ticketId: string, targetTicketId: string, linkType: LinkType): Observable<TicketLink[]> {
    return this.http.post<ApiResponse<TicketLink[]>>(`${this.base}/${ticketId}/links`, { targetTicketId, linkType }).pipe(map(r => r.data));
  }

  removeLink(ticketId: string, linkId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${ticketId}/links/${linkId}`);
  }
}
