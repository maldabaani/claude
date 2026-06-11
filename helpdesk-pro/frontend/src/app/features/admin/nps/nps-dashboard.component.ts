import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../../environments/environment';

interface NpsScore {
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}

interface NpsResponseItem {
  id: string;
  ticketId: string;
  score: number;
  comment: string;
  submittedAt: string;
}

@Component({
  selector: 'app-nps-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectButtonModule, TableModule, TagModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">NPS Dashboard</h1>
          <p class="text-gray-500 text-sm mt-1">Net Promoter Score — customer loyalty metric</p>
        </div>
        <p-selectButton [options]="ranges" [(ngModel)]="selectedRange" optionLabel="label" optionValue="value" (onChange)="load()"/>
      </div>

      <!-- NPS Score Card -->
      @if (score()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-xl border p-6 flex flex-col items-center justify-center md:col-span-1">
            <div class="text-6xl font-black" [class]="scoreColor()">{{ score()!.npsScore }}</div>
            <div class="text-gray-500 text-sm mt-2">NPS Score</div>
            <div class="text-gray-400 text-xs mt-1">{{ score()!.total }} responses</div>
          </div>
          <div class="bg-white rounded-xl border p-6 md:col-span-3">
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-green-600 font-medium">Promoters (9–10)</span>
                  <span>{{ score()!.promoters }} ({{ score()!.promoterPct | number:'1.0-0' }}%)</span>
                </div>
                <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full transition-all" [style.width.%]="score()!.promoterPct"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-yellow-600 font-medium">Passives (7–8)</span>
                  <span>{{ score()!.passives }} ({{ score()!.passivePct | number:'1.0-0' }}%)</span>
                </div>
                <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-yellow-400 rounded-full transition-all" [style.width.%]="score()!.passivePct"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-red-600 font-medium">Detractors (0–6)</span>
                  <span>{{ score()!.detractors }} ({{ score()!.detractorPct | number:'1.0-0' }}%)</span>
                </div>
                <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-red-400 rounded-full transition-all" [style.width.%]="score()!.detractorPct"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Responses Table -->
      <div class="bg-white rounded-xl border p-4">
        <h2 class="font-semibold mb-4">Recent Responses</h2>
        <p-table [value]="responses()" [loading]="loading()" [paginator]="true" [rows]="20" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Score</th>
              <th>Category</th>
              <th>Comment</th>
              <th>Date</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr>
              <td><span class="font-bold text-lg">{{ r.score }}</span><span class="text-gray-400">/10</span></td>
              <td>
                <p-tag [value]="category(r.score)" [severity]="severity(r.score)"/>
              </td>
              <td class="text-gray-600 max-w-xs truncate">{{ r.comment || '—' }}</td>
              <td class="text-gray-500 text-sm">{{ r.submittedAt | date:'mediumDate' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="4" class="text-center py-8 text-gray-400">No responses yet in this period.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `
})
export class NpsDashboardComponent implements OnInit {
  score = signal<NpsScore | null>(null);
  responses = signal<NpsResponseItem[]>([]);
  loading = signal(true);
  selectedRange = 30;

  ranges = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const from = new Date(Date.now() - this.selectedRange * 86400000).toISOString();
    const to = new Date().toISOString();
    const params = `from=${from}&to=${to}`;

    Promise.all([
      this.http.get<any>(`${environment.apiUrl}/nps/score?${params}`).pipe(map(r => r.data)).toPromise(),
      this.http.get<any>(`${environment.apiUrl}/nps/responses?${params}`).pipe(map(r => r.data)).toPromise(),
    ]).then(([s, r]) => {
      this.score.set(s);
      this.responses.set(r || []);
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }

  scoreColor() {
    const s = this.score()?.npsScore ?? 0;
    if (s >= 50) return 'text-green-600';
    if (s >= 0) return 'text-yellow-500';
    return 'text-red-500';
  }

  category(score: number): string {
    if (score >= 9) return 'Promoter';
    if (score >= 7) return 'Passive';
    return 'Detractor';
  }

  severity(score: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    if (score >= 9) return 'success';
    if (score >= 7) return 'warn';
    return 'danger';
  }
}
