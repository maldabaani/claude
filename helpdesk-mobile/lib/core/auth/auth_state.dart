import '../models/user_model.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
  });

  AuthState copyWith({AuthStatus? status, UserModel? user, String? error}) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isAdmin => user?.role == 'ADMIN';
  bool get isAgent => user?.role == 'AGENT' || user?.role == 'TEAM_LEAD' || user?.role == 'ADMIN';
  bool get isCustomer => user?.role == 'CUSTOMER';
}
