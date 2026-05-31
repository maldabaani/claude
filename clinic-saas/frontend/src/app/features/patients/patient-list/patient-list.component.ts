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
  templateUrl: './patient-list.component.html'
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
