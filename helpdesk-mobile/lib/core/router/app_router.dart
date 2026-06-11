import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/auth_provider.dart';
import '../auth/auth_state.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/auth/two_fa_screen.dart';
import '../../features/customer/home/customer_home_screen.dart';
import '../../features/customer/tickets/my_tickets_screen.dart';
import '../../features/customer/tickets/ticket_detail_screen.dart';
import '../../features/customer/submit/submit_ticket_screen.dart';
import '../../features/customer/kb/knowledge_base_screen.dart';
import '../../features/customer/csat/csat_rating_screen.dart';
import '../../features/agent/dashboard/agent_dashboard_screen.dart';
import '../../features/agent/queue/ticket_queue_screen.dart';
import '../../features/agent/tickets/agent_ticket_detail_screen.dart';
import '../../features/agent/saved_views/saved_views_screen.dart';
import '../../features/admin/overview/admin_overview_screen.dart';
import '../../features/admin/users/users_screen.dart';
import '../../features/admin/analytics/analytics_screen.dart';
import '../../features/admin/settings/settings_screen.dart';
import '../../features/admin/departments/departments_screen.dart';
import '../../features/admin/sla/sla_policies_screen.dart';
import '../../features/admin/canned_responses/canned_responses_screen.dart';
import '../../features/admin/templates/templates_screen.dart';
import '../../features/admin/kb/admin_kb_screen.dart';
import '../../features/admin/custom_fields/custom_fields_screen.dart';
import '../../features/admin/webhooks/webhooks_screen.dart';
import '../../features/admin/macros/macros_screen.dart';
import '../../features/admin/api_keys/api_keys_screen.dart';
import '../../features/admin/help_topics/help_topics_screen.dart';
import '../../features/admin/email_inboxes/email_inboxes_screen.dart';
import '../../features/admin/organizations/organizations_screen.dart';
import '../../features/admin/issues/issues_screen.dart';
import '../../features/admin/tags/tags_screen.dart';
import '../../features/admin/business_hours/business_hours_screen.dart';
import '../../features/admin/round_robin/round_robin_screen.dart';
import '../../features/admin/teams/teams_screen.dart';
import '../../features/admin/nps/nps_screen.dart';
import '../../features/admin/audit_log/audit_log_screen.dart';
import '../../features/admin/sla_rules/sla_rules_screen.dart';
import '../../features/admin/tickets/admin_tickets_screen.dart';
import '../../features/shared/profile/profile_screen.dart';
import '../../features/shared/customer_profile/customer_profile_screen.dart';
import '../../features/shared/notifications/notifications_screen.dart';
import '../../features/customer/shell/customer_shell.dart';
import '../../features/agent/shell/agent_shell.dart';
import '../../features/admin/shell/admin_shell.dart';
import '../../features/admin/agent_performance/agent_performance_screen.dart';
import '../../features/admin/automation_rules/automation_rules_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuth = authState.status == AuthStatus.authenticated;
      final isUnknown = authState.status == AuthStatus.unknown;
      final location = state.uri.toString();

      if (isUnknown) return null;

      final authRoutes = ['/login', '/register', '/2fa'];
      final isAuthRoute = authRoutes.any((r) => location.startsWith(r));

      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) {
        if (authState.isAdmin) return '/admin';
        if (authState.isAgent) return '/agent';
        return '/customer';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', redirect: (_, __) => '/login'),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/2fa', builder: (_, s) => TwoFaScreen(
        tempToken: s.uri.queryParameters['tempToken'] ?? '',
      )),

      // Top-level CSAT route (no shell)
      GoRoute(path: '/rate/:ticketId', builder: (_, s) => CsatRatingScreen(ticketId: s.pathParameters['ticketId']!)),

      // Customer
      ShellRoute(
        builder: (_, __, child) => CustomerShell(child: child),
        routes: [
          GoRoute(path: '/customer', builder: (_, __) => const CustomerHomeScreen()),
          GoRoute(path: '/customer/tickets', builder: (_, __) => const MyTicketsScreen()),
          GoRoute(path: '/customer/tickets/:id', builder: (_, s) => TicketDetailScreen(ticketId: s.pathParameters['id']!)),
          GoRoute(path: '/customer/submit', builder: (_, __) => const SubmitTicketScreen()),
          GoRoute(path: '/customer/kb', builder: (_, __) => const KnowledgeBaseScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        ],
      ),

      // Agent
      ShellRoute(
        builder: (_, __, child) => AgentShell(child: child),
        routes: [
          GoRoute(path: '/agent', builder: (_, __) => const AgentDashboardScreen()),
          GoRoute(path: '/agent/queue', builder: (_, __) => const TicketQueueScreen()),
          GoRoute(path: '/agent/tickets/:id', builder: (_, s) => AgentTicketDetailScreen(id: s.pathParameters['id']!)),
          GoRoute(path: '/agent/saved-views', builder: (_, __) => const SavedViewsScreen()),
          GoRoute(path: '/agent/customers/:id', builder: (_, s) => CustomerProfileScreen(userId: s.pathParameters['id']!)),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        ],
      ),

      // Admin
      ShellRoute(
        builder: (_, __, child) => AdminShell(child: child),
        routes: [
          GoRoute(path: '/admin', builder: (_, __) => const AdminOverviewScreen()),
          GoRoute(path: '/admin/tickets', builder: (_, __) => const AdminTicketsScreen()),
          GoRoute(path: '/admin/users', builder: (_, __) => const UsersScreen()),
          GoRoute(path: '/admin/departments', builder: (_, __) => const DepartmentsScreen()),
          GoRoute(path: '/admin/sla', builder: (_, __) => const SlaPoliciesScreen()),
          GoRoute(path: '/admin/canned', builder: (_, __) => const CannedResponsesScreen()),
          GoRoute(path: '/admin/analytics', builder: (_, __) => const AnalyticsScreen()),
          GoRoute(path: '/admin/kb', builder: (_, __) => const AdminKbScreen()),
          GoRoute(path: '/admin/audit', builder: (_, __) => const AuditLogScreen()),
          GoRoute(path: '/admin/custom-fields', builder: (_, __) => const CustomFieldsScreen()),
          GoRoute(path: '/admin/sla-rules', builder: (_, __) => const SlaRulesScreen()),
          GoRoute(path: '/admin/templates', builder: (_, __) => const TemplatesScreen()),
          GoRoute(path: '/admin/webhooks', builder: (_, __) => const WebhooksScreen()),
          GoRoute(path: '/admin/macros', builder: (_, __) => const MacrosScreen()),
          GoRoute(path: '/admin/teams', builder: (_, __) => const TeamsScreen()),
          GoRoute(path: '/admin/nps', builder: (_, __) => const NpsScreen()),
          GoRoute(path: '/admin/automation-rules', builder: (_, __) => const AutomationRulesScreen()),
          GoRoute(path: '/admin/api-keys', builder: (_, __) => const ApiKeysScreen()),
          GoRoute(path: '/admin/help-topics', builder: (_, __) => const HelpTopicsScreen()),
          GoRoute(path: '/admin/email-inboxes', builder: (_, __) => const EmailInboxesScreen()),
          GoRoute(path: '/admin/organizations', builder: (_, __) => const OrganizationsScreen()),
          GoRoute(path: '/admin/issues', builder: (_, __) => const IssuesScreen()),
          GoRoute(path: '/admin/tags', builder: (_, __) => const TagsScreen()),
          GoRoute(path: '/admin/business-hours', builder: (_, __) => const BusinessHoursScreen()),
          GoRoute(path: '/admin/round-robin', builder: (_, __) => const RoundRobinScreen()),
          GoRoute(path: '/admin/agent-performance', builder: (_, __) => const AgentPerformanceScreen()),
          GoRoute(path: '/admin/automation-rules', builder: (_, __) => const AutomationRulesScreen()),
          GoRoute(path: '/admin/settings', builder: (_, __) => const SettingsScreen()),
          GoRoute(path: '/admin/customers/:id', builder: (_, s) => CustomerProfileScreen(userId: s.pathParameters['id']!)),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        ],
      ),
    ],
  );
});
