import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {

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
    const base: MenuItem[] = [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard/home' }
    ];
    if (user?.userType === 'PLATFORM') {
      base.push({ label: 'Manage Clinics', icon: 'pi pi-building', routerLink: '/dashboard/platform/tenants' });
    } else {
      base.push(
        { label: 'Patients',     icon: 'pi pi-users',    routerLink: '/dashboard/patients' },
        { label: 'Appointments', icon: 'pi pi-calendar', routerLink: '/dashboard/appointments' },
        // { label: 'Visits',       icon: 'pi pi-heart',    routerLink: '/dashboard/visits' }
      );
      if (user?.role === 'ADMIN') {
        base.push({ label: 'Staff', icon: 'pi pi-id-card', routerLink: '/dashboard/staff' });
      }
    }
    return base;
  }

  constructor(public auth: AuthService) {}

  logout() { this.auth.logout(); }
}
