import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    InputTextModule, CalendarModule, DropdownModule, ButtonModule, CardModule, MessageModule
  ],
  templateUrl: './patient-create.component.html'
})
export class PatientCreateComponent {
  form: FormGroup;
  loading = false;
  errorMsg = signal('');

  genderOptions = [
    { label: 'Male',   value: 'MALE'   },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other',  value: 'OTHER'  }
  ];

  bloodTypeOptions = [
    'A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE',
    'AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'
  ].map(v => ({ label: v.replace('_', ' '), value: v }));

  constructor(private fb: FormBuilder, private svc: PatientService, private router: Router) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      dateOfBirth: [null, Validators.required],
      gender:    [null, Validators.required],
      phone:     [''],
      email:     ['', Validators.email],
      city:      [''],
      country:   [''],
      bloodType: [null],
      allergies: ['']
    });
  }

  field(name: string) { return this.form.get(name); }
  invalid(name: string) { const f = this.field(name); return f?.invalid && f?.touched; }

  submit() {
    this.errorMsg.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const raw = { ...this.form.value };
    const dob: Date = raw.dateOfBirth;
    if (dob instanceof Date) {
      const y = dob.getFullYear();
      const m = String(dob.getMonth() + 1).padStart(2, '0');
      const d = String(dob.getDate()).padStart(2, '0');
      raw.dateOfBirth = `${y}-${m}-${d}`;
    }
    this.svc.create(raw).subscribe({
      next: () => this.router.navigate(['/dashboard/patients']),
      error: (err) => {
        this.loading = false;
        const detail = err?.error?.detail ?? err?.error?.message ?? err?.message;
        this.errorMsg.set(detail || 'Failed to register patient. Please try again.');
      }
    });
  }
}
