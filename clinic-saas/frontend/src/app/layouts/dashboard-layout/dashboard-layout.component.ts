import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    SidebarModule, ButtonModule, MenuModule, AvatarModule
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  sidebarVisible = signal(false);

  navItems: MenuItem[] = [
    { label: 'Dashboard',    icon: 'pi pi-home',         routerLink: '/dashboard/home' },
    { label: 'Patients',     icon: 'pi pi-users',        routerLink: '/dashboard/patients' },
    { label: 'Appointments', icon: 'pi pi-calendar',     routerLink: '/dashboard/appointments' }
  ];

  constructor(public auth: AuthService) {}

  logout() { this.auth.logout(); }
}
