import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { Patient } from '../../../core/models/patient.model';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, InputTextModule, TagModule, CardModule
  ],
  templateUrl: './patient-list.component.html',
  styles: [`
    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .search-input-wrap {
      position: relative;
      flex: 1;
      max-width: 420px;
    }
    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 0.875rem;
      pointer-events: none;
      z-index: 1;
    }
    .search-input {
      width: 100%;
      padding-left: 2.5rem !important;
    }
    .mrn-badge {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6366f1;
      background: #eef2ff;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }
    .patient-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .patient-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .patient-name { font-weight: 600; color: #0f172a; font-size: 0.875rem; }
    .gender-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 20px;
      letter-spacing: 0.04em;
      &.gender-male   { background: #eff6ff; color: #3b82f6; }
      &.gender-female { background: #fdf2f8; color: #ec4899; }
      &.gender-other  { background: #f8fafc; color: #64748b; }
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
      gap: 0.5rem;
      .empty-icon { font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.5rem; }
      p { font-weight: 600; color: #334155; margin: 0; }
      span { font-size: 0.875rem; color: #94a3b8; }
    }
  `]
})
export class PatientListComponent implements OnInit {
  patients = signal<Patient[]>([]);
  total    = signal(0);
  loading  = signal(false);
  query    = '';

  constructor(private patientService: PatientService) {}

  ngOnInit() { this.load(); }

  load(page = 0) {
    this.loading.set(true);
    this.patientService.search(this.query, page).subscribe({
      next: res => {
        this.patients.set(res.content);
        this.total.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() { this.load(0); }

  onPage(event: { first: number; rows: number }) {
    this.load(event.first / event.rows);
  }
}
