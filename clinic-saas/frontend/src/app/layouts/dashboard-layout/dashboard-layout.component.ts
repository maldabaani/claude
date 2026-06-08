import { Component, signal, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';

interface PatientHit {
  id: string;
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent implements OnInit {

  // ── Mobile sidebar ─────────────────────────────────────────
  sidebarOpen = signal(false);

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.sidebarOpen.set(false);
    this.searchOpen.set(false);
  }

  // ── Global patient search ──────────────────────────────────
  searchOpen    = signal(false);
  searchQuery   = '';
  searchResults = signal<PatientHit[]>([]);
  searching     = signal(false);
  private search$ = new Subject<string>();

  openSearch()  { this.searchOpen.set(true); this.searchQuery = ''; this.searchResults.set([]); }
  closeSearch() { this.searchOpen.set(false); this.searchQuery = ''; this.searchResults.set([]); }

  onSearchInput(q: string) {
    this.searchQuery = q;
    this.search$.next(q);
  }

  goToPatient(patient: PatientHit) {
    this.closeSearch();
    this.closeSidebar();
    this.router.navigate(['/dashboard/patients', patient.id]);
  }

  // ── Date / user helpers ────────────────────────────────────
  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  get clinicName(): string {
    const user = this.auth.getCurrentUser();
    return user?.userType === 'PLATFORM' ? 'Platform Admin' : 'Medical Clinic Management';
  }

  get userEmail(): string { return this.auth.getCurrentUser()?.email ?? ''; }

  get userRole(): string {
    const role = this.auth.getCurrentUser()?.role ?? '';
    return role.replace(/_/g, ' ').toLowerCase();
  }

  get userInitial(): string {
    return this.userEmail ? this.userEmail[0].toUpperCase() : 'U';
  }

  get navItems(): MenuItem[] {
    const user = this.auth.getCurrentUser();
    const has = (p: any) => this.auth.hasPermission(p);
    const base: MenuItem[] = [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard/home' }
    ];
    if (user?.userType === 'PLATFORM') {
      base.push({ label: 'Manage Clinics', icon: 'pi pi-building', routerLink: '/dashboard/platform/tenants' });
    } else {
      // Clinical screens — only shown to roles that actually use them
      if (has('PATIENT_READ'))        base.push({ label: 'Patients',      icon: 'pi pi-users',       routerLink: '/dashboard/patients' });
      if (has('APPOINTMENT_READ'))    base.push({ label: 'Appointments',  icon: 'pi pi-calendar',    routerLink: '/dashboard/appointments' });
      if (has('VISIT_READ'))          base.push({ label: 'Queue',         icon: 'pi pi-list',         routerLink: '/dashboard/queue' });
      // Specialist boards — each role sees only their own board
      if (has('LAB_READ'))            base.push({ label: 'Lab Board',     icon: 'pi pi-flask',        routerLink: '/dashboard/lab' });
      if (has('RADIOLOGY_READ'))      base.push({ label: 'Radiology',     icon: 'pi pi-image',        routerLink: '/dashboard/radiology' });
      if (has('PRESCRIPTION_READ'))   base.push({ label: 'Pharmacy',      icon: 'pi pi-tablet',       routerLink: '/dashboard/pharmacy' });
      if (has('BILLING_READ'))        base.push({ label: 'Billing',       icon: 'pi pi-credit-card',  routerLink: '/dashboard/billing' });
      // Admin-only
      if (has('REPORTS_READ'))        base.push({ label: 'Reports',       icon: 'pi pi-chart-bar',    routerLink: '/dashboard/reports' });
      if (has('STAFF_READ'))          base.push({ label: 'Staff',         icon: 'pi pi-id-card',      routerLink: '/dashboard/staff' });
      if (has('SETTINGS_READ') || has('SETTINGS_WRITE')) base.push({ label: 'Inventory', icon: 'pi pi-box',      routerLink: '/dashboard/inventory' });
      if (has('SETTINGS_WRITE'))      base.push({ label: 'Settings',      icon: 'pi pi-cog',          routerLink: '/dashboard/settings' });
    }
    return base;
  }

  constructor(
    public auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.search$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) { this.searchResults.set([]); return of(null); }
        this.searching.set(true);
        return this.http.get<any>(`/api/v1/patients/search?query=${encodeURIComponent(q)}&page=0&size=8`)
          .pipe(catchError(() => of({ content: [] })));
      })
    ).subscribe(res => {
      this.searching.set(false);
      if (res) this.searchResults.set(res.content ?? []);
    });
  }

  logout() { this.auth.logout(); }
}
