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
import '../../features/agent/dashboard/agent_dashboard_screen.dart';
import '../../features/agent/queue/ticket_queue_screen.dart';
import '../../features/agent/tickets/agent_ticket_detail_screen.dart';
import '../../features/admin/overview/admin_overview_screen.dart';
import '../../features/admin/users/users_screen.dart';
import '../../features/admin/analytics/analytics_screen.dart';
import '../../features/admin/settings/settings_screen.dart';
import '../../features/shared/profile/profile_screen.dart';
import '../../features/shared/notifications/notifications_screen.dart';
import '../../features/customer/shell/customer_shell.dart';
import '../../features/agent/shell/agent_shell.dart';
import '../../features/admin/shell/admin_shell.dart';

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
        email: s.uri.queryParameters['email'] ?? '',
        password: s.uri.queryParameters['password'] ?? '',
      )),

      // Customer
      ShellRoute(
        builder: (_, __, child) => CustomerShell(child: child),
        routes: [
          GoRoute(path: '/customer', builder: (_, __) => const CustomerHomeScreen()),
          GoRoute(path: '/customer/tickets', builder: (_, __) => const MyTicketsScreen()),
          GoRoute(path: '/customer/tickets/:id', builder: (_, s) => TicketDetailScreen(id: s.pathParameters['id']!)),
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
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        ],
      ),

      // Admin
      ShellRoute(
        builder: (_, __, child) => AdminShell(child: child),
        routes: [
          GoRoute(path: '/admin', builder: (_, __) => const AdminOverviewScreen()),
          GoRoute(path: '/admin/users', builder: (_, __) => const UsersScreen()),
          GoRoute(path: '/admin/analytics', builder: (_, __) => const AnalyticsScreen()),
          GoRoute(path: '/admin/settings', builder: (_, __) => const SettingsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        ],
      ),
    ],
  );
});
