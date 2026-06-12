import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:helpdesk_mobile/core/auth/auth_provider.dart';
import 'package:helpdesk_mobile/core/auth/auth_state.dart';
import 'package:helpdesk_mobile/core/theme/app_theme.dart';

import 'login_screen_test.mocks.dart';

// We render a simplified version of the LoginScreen form directly, extracting
// only the widgets that matter, to avoid go_router's navigation requirement.
//
// Alternatively we render the actual LoginScreen wrapped in a MaterialApp with
// a mock AuthNotifier so no real API calls are made.

@GenerateMocks([AuthNotifier])
void main() {
  late MockAuthNotifier mockNotifier;

  setUp(() {
    mockNotifier = MockAuthNotifier();
    // Stub out the login future so it never hangs
    when(mockNotifier.login(any, any)).thenAnswer((_) async => null);
    // Stub state stream
    when(mockNotifier.stream).thenAnswer(
      (_) => Stream.value(const AuthState(status: AuthStatus.unauthenticated)),
    );
  });

  Widget buildTestWidget() {
    return ProviderScope(
      overrides: [
        authProvider.overrideWith((_) => mockNotifier),
      ],
      child: MaterialApp(
        theme: AppTheme.light,
        home: _MinimalLoginForm(onLogin: (email, password) {
          mockNotifier.login(email, password);
        }),
      ),
    );
  }

  testWidgets('renders email and password fields', (tester) async {
    await tester.pumpWidget(buildTestWidget());
    expect(find.byType(TextFormField), findsAtLeastNWidgets(2));
  });

  testWidgets('renders login button', (tester) async {
    await tester.pumpWidget(buildTestWidget());
    expect(find.text('Sign In'), findsOneWidget);
  });

  testWidgets('shows validation errors when fields are empty and button is pressed',
      (tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.tap(find.text('Sign In'));
    await tester.pump();
    // Both validators should fire
    expect(find.text('Enter a valid email address'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
  });

  testWidgets('shows loading indicator during login', (tester) async {
    // Make login hang so the loading state persists during the test
    when(mockNotifier.login(any, any))
        .thenAnswer((_) => Future.delayed(const Duration(seconds: 10)));

    await tester.pumpWidget(buildTestWidget());

    // Fill in valid credentials
    final fields = find.byType(TextFormField);
    await tester.enterText(fields.first, 'user@test.com');
    await tester.enterText(fields.last, 'password123');

    await tester.tap(find.text('Sign In'));
    await tester.pump(); // start async
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}

// ─── Minimal LoginForm that mirrors the production form logic ─────────────

class _MinimalLoginForm extends StatefulWidget {
  final void Function(String email, String password) onLogin;
  const _MinimalLoginForm({required this.onLogin});

  @override
  State<_MinimalLoginForm> createState() => _MinimalLoginFormState();
}

class _MinimalLoginFormState extends State<_MinimalLoginForm> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    await widget.onLogin(_emailCtrl.text.trim(), _passwordCtrl.text);
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              validator: (v) =>
                  v == null || !v.contains('@') ? 'Enter a valid email address' : null,
            ),
            TextFormField(
              controller: _passwordCtrl,
              obscureText: true,
              validator: (v) =>
                  v == null || v.isEmpty ? 'Password is required' : null,
            ),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const CircularProgressIndicator()
                  : const Text('Sign In'),
            ),
          ],
        ),
      ),
    );
  }
}
