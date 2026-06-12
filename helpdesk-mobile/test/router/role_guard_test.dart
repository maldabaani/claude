import 'package:flutter_test/flutter_test.dart';
import 'package:helpdesk_mobile/core/auth/auth_state.dart';
import 'package:helpdesk_mobile/core/models/user_model.dart';

/// Pure redirect function extracted from app_router.dart for unit testing.
/// Mirrors the logic in GoRouter's redirect callback exactly.
String? appRedirect({
  required AuthState authState,
  required String location,
}) {
  final isAuth = authState.status == AuthStatus.authenticated;
  final isUnknown = authState.status == AuthStatus.unknown;

  if (isUnknown) return null;

  final authRoutes = ['/login', '/register', '/2fa'];
  final isAuthRoute = authRoutes.any((r) => location.startsWith(r));

  if (!isAuth && !isAuthRoute) return '/login';
  if (isAuth && isAuthRoute) {
    if (authState.isAdmin) return '/admin';
    if (authState.isAgent) return '/agent';
    return '/customer';
  }

  // Role-based shell guards
  if (isAuth) {
    final isCustomerRoute = location.startsWith('/customer');
    final isAgentRoute = location.startsWith('/agent');
    final isAdminRoute = location.startsWith('/admin');

    if (isCustomerRoute && !authState.isCustomer) {
      if (authState.isAdmin) return '/admin';
      return '/agent';
    }
    if (isAgentRoute && authState.isCustomer) return '/customer';
    if (isAdminRoute && !authState.isAdmin) {
      if (authState.isAgent) return '/agent';
      return '/customer';
    }
  }

  return null;
}

UserModel makeUser(String role) => UserModel(
      id: '1',
      email: 'test@test.com',
      fullName: 'Test User',
      role: role,
    );

const unauthenticated = AuthState(status: AuthStatus.unauthenticated);

AuthState authenticated(String role) => AuthState(
      status: AuthStatus.authenticated,
      user: makeUser(role),
    );

void main() {
  group('Role guard redirect logic', () {
    test('unauthenticated user on /admin redirects to /login', () {
      final result = appRedirect(authState: unauthenticated, location: '/admin');
      expect(result, '/login');
    });

    test('unauthenticated user on /customer redirects to /login', () {
      final result = appRedirect(authState: unauthenticated, location: '/customer');
      expect(result, '/login');
    });

    test('unauthenticated user on /login is allowed (no redirect)', () {
      final result = appRedirect(authState: unauthenticated, location: '/login');
      expect(result, isNull);
    });

    test('authenticated ADMIN on /login redirects to /admin', () {
      final result = appRedirect(
        authState: authenticated('ADMIN'),
        location: '/login',
      );
      expect(result, '/admin');
    });

    test('authenticated CUSTOMER on /login redirects to /customer', () {
      final result = appRedirect(
        authState: authenticated('CUSTOMER'),
        location: '/login',
      );
      expect(result, '/customer');
    });

    test('authenticated AGENT on /login redirects to /agent', () {
      final result = appRedirect(
        authState: authenticated('AGENT'),
        location: '/login',
      );
      expect(result, '/agent');
    });

    test('authenticated ADMIN on /customer/tickets redirects to /admin', () {
      final result = appRedirect(
        authState: authenticated('ADMIN'),
        location: '/customer/tickets',
      );
      expect(result, '/admin');
    });

    test('authenticated CUSTOMER on /admin/users redirects to /customer', () {
      final result = appRedirect(
        authState: authenticated('CUSTOMER'),
        location: '/admin/users',
      );
      expect(result, '/customer');
    });

    test('authenticated AGENT on /customer/tickets redirects to /agent', () {
      final result = appRedirect(
        authState: authenticated('AGENT'),
        location: '/customer/tickets',
      );
      expect(result, '/agent');
    });

    test('authenticated CUSTOMER on own /customer route is allowed', () {
      final result = appRedirect(
        authState: authenticated('CUSTOMER'),
        location: '/customer/tickets',
      );
      expect(result, isNull);
    });

    test('authenticated ADMIN on /admin route is allowed', () {
      final result = appRedirect(
        authState: authenticated('ADMIN'),
        location: '/admin/users',
      );
      expect(result, isNull);
    });

    test('authenticated AGENT on /agent route is allowed', () {
      final result = appRedirect(
        authState: authenticated('AGENT'),
        location: '/agent/queue',
      );
      expect(result, isNull);
    });

    test('unknown auth status returns null (wait for resolution)', () {
      const unknownState = AuthState(status: AuthStatus.unknown);
      final result = appRedirect(authState: unknownState, location: '/admin');
      expect(result, isNull);
    });

    test('authenticated AGENT on /admin route redirects to /agent', () {
      final result = appRedirect(
        authState: authenticated('AGENT'),
        location: '/admin/settings',
      );
      expect(result, '/agent');
    });
  });
}
