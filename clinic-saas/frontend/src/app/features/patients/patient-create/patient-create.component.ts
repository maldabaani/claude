import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PatientService } from '../patient.service';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    InputTextModule, CalendarModule, DropdownModule, ButtonModule, CardModule
  ],
  templateUrl: './patient-create.component.html'
})
export class PatientCreateComponent {
  form: FormGroup;
  loading = false;
  saved   = false;

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

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.svc.create(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard/patients']),
      error: () => { this.loading = false; }
    });
  }
}
