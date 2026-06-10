import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guard';
import { CustomerShellComponent } from './layout/customer-shell/customer-shell.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'customer',
    canActivate: [authGuard, roleGuard('CUSTOMER', 'AGENT', 'TEAM_LEAD', 'ADMIN')],
    loadComponent: () => import('./layout/customer-shell/customer-shell.component').then(m => m.CustomerShellComponent),
    children: [
      { path: '', loadComponent: () => import('./features/customer/portal/portal.component').then(m => m.PortalComponent) },
      { path: 'submit', loadComponent: () => import('./features/customer/submit-ticket/submit-ticket.component').then(m => m.SubmitTicketComponent) },
      { path: 'tickets', loadComponent: () => import('./features/customer/my-tickets/my-tickets.component').then(m => m.MyTicketsComponent) },
      { path: 'tickets/:id', loadComponent: () => import('./features/customer/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent) },
      { path: 'kb', loadComponent: () => import('./features/customer/knowledge-base/knowledge-base.component').then(m => m.KnowledgeBaseComponent) },
    ],
  },
  {
    path: 'agent',
    canActivate: [authGuard, roleGuard('AGENT', 'TEAM_LEAD', 'ADMIN')],
    loadComponent: () => import('./layout/agent-shell/agent-shell.component').then(m => m.AgentShellComponent),
    children: [
      { path: '', loadComponent: () => import('./features/agent/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'queue', loadComponent: () => import('./features/agent/ticket-queue/ticket-queue.component').then(m => m.TicketQueueComponent) },
      { path: 'tickets/:id', loadComponent: () => import('./features/agent/ticket-detail/ticket-detail.component').then(m => m.AgentTicketDetailComponent) },
      { path: 'customers/:id', loadComponent: () => import('./features/shared/customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () => import('./layout/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', loadComponent: () => import('./features/admin/overview/overview.component').then(m => m.OverviewComponent) },
      { path: 'tickets', loadComponent: () => import('./features/admin/tickets/tickets.component').then(m => m.AdminTicketsComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent) },
      { path: 'departments', loadComponent: () => import('./features/admin/departments/departments.component').then(m => m.DepartmentsComponent) },
      { path: 'sla', loadComponent: () => import('./features/admin/sla/sla.component').then(m => m.SlaComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'canned', loadComponent: () => import('./features/admin/canned-responses/canned-responses.component').then(m => m.CannedResponsesComponent) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'kb', loadComponent: () => import('./features/admin/knowledge-base/knowledge-base.component').then(m => m.AdminKbComponent) },
      { path: 'audit', loadComponent: () => import('./features/admin/audit-log/audit-log.component').then(m => m.AuditLogComponent) },
      { path: 'custom-fields', loadComponent: () => import('./features/admin/custom-fields/custom-fields.component').then(m => m.CustomFieldsComponent) },
      { path: 'sla-rules', loadComponent: () => import('./features/admin/sla-rules/sla-rules.component').then(m => m.SlaRulesComponent) },
      { path: 'templates', loadComponent: () => import('./features/admin/templates/templates.component').then(m => m.TemplatesComponent) },
      { path: 'webhooks', loadComponent: () => import('./features/admin/webhooks/webhooks.component').then(m => m.WebhooksComponent) },
      { path: 'api-keys', loadComponent: () => import('./features/admin/api-keys/api-keys.component').then(m => m.ApiKeysComponent) },
      { path: 'help-topics', loadComponent: () => import('./features/admin/help-topics/help-topics.component').then(m => m.HelpTopicsComponent) },
      { path: 'email-inboxes', loadComponent: () => import('./features/admin/email-inboxes/email-inboxes.component').then(m => m.EmailInboxesComponent) },
      { path: 'organizations', loadComponent: () => import('./features/admin/organizations/organizations.component').then(m => m.OrganizationsComponent) },
      { path: 'issues', loadComponent: () => import('./features/admin/issues/issues.component').then(m => m.IssuesComponent) },
      { path: 'customers/:id', loadComponent: () => import('./features/shared/customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
    ],
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/customer-shell/customer-shell.component').then(m => m.CustomerShellComponent),
    children: [
      { path: '', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
    ],
  },
  {
    path: 'rate/:ticketId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/csat/csat-rating.component').then(m => m.CsatRatingComponent),
  },
  { path: '**', redirectTo: '/login' },
];
