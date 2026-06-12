import 'package:flutter_test/flutter_test.dart';
import 'package:helpdesk_mobile/core/auth/auth_state.dart';
import 'package:helpdesk_mobile/core/models/user_model.dart';

UserModel makeUser(String role) => UserModel(
      id: '1',
      email: 'test@test.com',
      fullName: 'Test User',
      role: role,
    );

void main() {
  group('AuthState role flags', () {
    test('isAdmin true when user.role == ADMIN', () {
      final state = AuthState(
        status: AuthStatus.authenticated,
        user: makeUser('ADMIN'),
      );
      expect(state.isAdmin, isTrue);
    });

    test('isAdmin false for non-ADMIN roles', () {
      expect(
        AuthState(status: AuthStatus.authenticated, user: makeUser('AGENT')).isAdmin,
        isFalse,
      );
      expect(
        AuthState(status: AuthStatus.authenticated, user: makeUser('CUSTOMER')).isAdmin,
        isFalse,
      );
    });

    test('isAgent true for AGENT role', () {
      final state = AuthState(
        status: AuthStatus.authenticated,
        user: makeUser('AGENT'),
      );
      expect(state.isAgent, isTrue);
    });

    test('isAgent true for TEAM_LEAD role', () {
      final state = AuthState(
        status: AuthStatus.authenticated,
        user: makeUser('TEAM_LEAD'),
      );
      expect(state.isAgent, isTrue);
    });

    test('isAgent true for ADMIN role', () {
      final state = AuthState(
        status: AuthStatus.authenticated,
        user: makeUser('ADMIN'),
      );
      expect(state.isAgent, isTrue);
    });

    test('isAgent false for CUSTOMER role', () {
      final state = AuthState(
        status: AuthStatus.authenticated,
        user: makeUser('CUSTOMER'),
      );
      expect(state.isAgent, isFalse);
    });

    test('isCustomer true only for CUSTOMER role', () {
      expect(
        AuthState(status: AuthStatus.authenticated, user: makeUser('CUSTOMER')).isCustomer,
        isTrue,
      );
      expect(
        AuthState(status: AuthStatus.authenticated, user: makeUser('ADMIN')).isCustomer,
        isFalse,
      );
    });

    test('isAdmin false when user is null', () {
      const state = AuthState(status: AuthStatus.unauthenticated);
      expect(state.isAdmin, isFalse);
    });

    test('isAgent false when user is null', () {
      const state = AuthState(status: AuthStatus.unauthenticated);
      expect(state.isAgent, isFalse);
    });

    test('isCustomer false when user is null', () {
      const state = AuthState(status: AuthStatus.unauthenticated);
      expect(state.isCustomer, isFalse);
    });
  });

  group('AuthState.isAuthenticated', () {
    test('isAuthenticated true when status == authenticated', () {
      const state = AuthState(status: AuthStatus.authenticated);
      expect(state.isAuthenticated, isTrue);
    });

    test('isAuthenticated false when status == unauthenticated', () {
      const state = AuthState(status: AuthStatus.unauthenticated);
      expect(state.isAuthenticated, isFalse);
    });

    test('isAuthenticated false when status == unknown', () {
      const state = AuthState(status: AuthStatus.unknown);
      expect(state.isAuthenticated, isFalse);
    });
  });

  group('AuthState.copyWith', () {
    test('copyWith preserves unset fields', () {
      final user = makeUser('ADMIN');
      final original = AuthState(
        status: AuthStatus.authenticated,
        user: user,
        error: null,
      );

      final copied = original.copyWith(error: 'Some error');

      expect(copied.status, AuthStatus.authenticated);
      expect(copied.user, same(user));
      expect(copied.error, 'Some error');
    });

    test('copyWith can update status', () {
      const original = AuthState(status: AuthStatus.authenticated);
      final copied = original.copyWith(status: AuthStatus.unauthenticated);
      expect(copied.status, AuthStatus.unauthenticated);
    });

    test('copyWith can update user', () {
      const original = AuthState(status: AuthStatus.authenticated);
      final newUser = makeUser('CUSTOMER');
      final copied = original.copyWith(user: newUser);
      expect(copied.user, same(newUser));
    });

    test('copyWith error is always overwritten (even to null)', () {
      final original = AuthState(
        status: AuthStatus.authenticated,
        error: 'old error',
      );
      // copyWith sets error to null when not provided
      final copied = original.copyWith(status: AuthStatus.authenticated);
      expect(copied.error, isNull);
    });
  });
}
