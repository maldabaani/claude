import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/user_model.dart';
import 'auth_state.dart';

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _init();
  }

  final _api = ApiClient();

  Future<void> _init() async {
    final token = await _api.getAccessToken();
    if (token != null) {
      try {
        final resp = await _api.get(ApiEndpoints.me);
        final user = UserModel.fromJson(resp.data['data']);
        state = AuthState(status: AuthStatus.authenticated, user: user);
      } catch (_) {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<String?> login(String email, String password) async {
    try {
      final resp = await _api.post(ApiEndpoints.login, data: {
        'email': email,
        'password': password,
      });
      final data = resp.data['data'];
      if (data['requiresTwoFactor'] == true) {
        // Pass the temp token back to the caller for the 2FA verify step.
        return 'REQUIRES_2FA:${data['tempToken']}';
      }
      await _api.saveTokens(data['accessToken'], data['refreshToken']);
      final user = UserModel.fromJson(data);
      state = AuthState(status: AuthStatus.authenticated, user: user);
      return null;
    } catch (e) {
      return _parseError(e);
    }
  }

  Future<String?> verifyTwoFa(String tempToken, String code) async {
    try {
      final resp = await _api.post(ApiEndpoints.twoFaVerify, data: {
        'tempToken': tempToken,
        'code': code,
      });
      final data = resp.data['data'];
      await _api.saveTokens(data['accessToken'], data['refreshToken']);
      final user = UserModel.fromJson(data);
      state = AuthState(status: AuthStatus.authenticated, user: user);
      return null;
    } catch (e) {
      return _parseError(e);
    }
  }

  Future<String?> register(String fullName, String email, String password) async {
    try {
      final resp = await _api.post(ApiEndpoints.register, data: {
        'fullName': fullName,
        'email': email,
        'password': password,
      });
      final data = resp.data['data'];
      await _api.saveTokens(data['accessToken'], data['refreshToken']);
      final user = UserModel.fromJson(data);
      state = AuthState(status: AuthStatus.authenticated, user: user);
      return null;
    } catch (e) {
      return _parseError(e);
    }
  }

  Future<void> logout() async {
    try { await _api.post(ApiEndpoints.logout); } catch (_) {}
    await _api.clearTokens();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  String _parseError(dynamic e) {
    if (e is Exception) {
      final msg = e.toString();
      if (msg.contains('401')) return 'Invalid email or password';
      if (msg.contains('429')) return 'Too many attempts. Please wait.';
      if (msg.contains('SocketException') || msg.contains('Connection')) {
        return 'Cannot connect to server. Check your connection.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
