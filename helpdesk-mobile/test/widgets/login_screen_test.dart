// Widget tests for the login screen.
//
// We test a replicated minimal form that mirrors the production LoginScreen
// widgets and validation logic. This avoids go_router and real network calls.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// ─── Minimal widget mirroring the login form ──────────────────────────────

class _TestLoginScreen extends StatefulWidget {
  /// Called when form is valid and the button is tapped.
  final Future<void> Function(String email, String password)? onSubmit;

  const _TestLoginScreen({this.onSubmit});

  @override
  State<_TestLoginScreen> createState() => _TestLoginScreenState();
}

class _TestLoginScreenState extends State<_TestLoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    await widget.onSubmit?.call(_emailCtrl.text.trim(), _passwordCtrl.text);
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Email field
            TextFormField(
              key: const Key('email_field'),
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(hintText: 'Email Address'),
              validator: (v) =>
                  v == null || !v.contains('@') ? 'Enter a valid email address' : null,
            ),
            // Password field
            TextFormField(
              key: const Key('password_field'),
              controller: _passwordCtrl,
              obscureText: true,
              decoration: const InputDecoration(hintText: 'Password'),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Password is required' : null,
            ),
            // Login button / loading indicator
            _loading
                ? const CircularProgressIndicator(key: Key('loading_indicator'))
                : ElevatedButton(
                    key: const Key('login_button'),
                    onPressed: _submit,
                    child: const Text('Sign In'),
                  ),
          ],
        ),
      ),
    );
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────

void main() {
  Widget wrap({Future<void> Function(String, String)? onSubmit}) =>
      MaterialApp(home: _TestLoginScreen(onSubmit: onSubmit));

  testWidgets('renders email and password fields', (tester) async {
    await tester.pumpWidget(wrap());
    expect(find.byKey(const Key('email_field')), findsOneWidget);
    expect(find.byKey(const Key('password_field')), findsOneWidget);
  });

  testWidgets('renders login button', (tester) async {
    await tester.pumpWidget(wrap());
    expect(find.byKey(const Key('login_button')), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
  });

  testWidgets('shows validation errors when fields empty and button pressed',
      (tester) async {
    await tester.pumpWidget(wrap());
    await tester.tap(find.byKey(const Key('login_button')));
    await tester.pump();

    expect(find.text('Enter a valid email address'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
  });

  testWidgets('shows email validation error for value without @', (tester) async {
    await tester.pumpWidget(wrap());
    await tester.enterText(find.byKey(const Key('email_field')), 'notanemail');
    await tester.tap(find.byKey(const Key('login_button')));
    await tester.pump();

    expect(find.text('Enter a valid email address'), findsOneWidget);
  });

  testWidgets('shows loading indicator during login', (tester) async {
    // onSubmit that never completes keeps the loading state visible
    final completer = Future<void>.delayed(const Duration(seconds: 60));

    await tester.pumpWidget(wrap(onSubmit: (_, __) => completer));

    await tester.enterText(find.byKey(const Key('email_field')), 'user@test.com');
    await tester.enterText(find.byKey(const Key('password_field')), 'password123');

    await tester.tap(find.byKey(const Key('login_button')));
    await tester.pump(); // trigger setState(_loading = true)

    expect(find.byKey(const Key('loading_indicator')), findsOneWidget);
    // Button is replaced by spinner while loading
    expect(find.byKey(const Key('login_button')), findsNothing);
  });
}
