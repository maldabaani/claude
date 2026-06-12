// Integration tests for the authentication flow.
//
// IMPORTANT: These tests require a running backend at localhost:8080.
// Start the HelpDesk API server before running:
//   flutter test integration_test/auth_flow_test.dart
//
// Test credentials:
//   Admin:    admin@helpdesk.com    / Admin@123
//   Customer: customer@helpdesk.com / Customer@123

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:helpdesk_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Auth flow integration tests (requires backend at localhost:8080)', () {
    testWidgets('Customer login navigates to customer shell', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should start on login screen
      expect(find.text('Sign in to your account'), findsOneWidget);

      // Enter customer credentials
      final emailField = find.byType(TextFormField).first;
      final passwordField = find.byType(TextFormField).last;

      await tester.enterText(emailField, 'customer@helpdesk.com');
      await tester.enterText(passwordField, 'Customer@123');

      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Customer shell should be visible — it has a bottom nav with "My Tickets"
      expect(find.text('My Tickets'), findsOneWidget);
    });

    testWidgets('Admin login navigates to admin shell', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      expect(find.text('Sign in to your account'), findsOneWidget);

      final emailField = find.byType(TextFormField).first;
      final passwordField = find.byType(TextFormField).last;

      await tester.enterText(emailField, 'admin@helpdesk.com');
      await tester.enterText(passwordField, 'Admin@123');

      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Admin shell should be visible — it has a sidebar/nav with "Overview"
      expect(find.text('Overview'), findsOneWidget);
    });

    testWidgets('Logout clears session and redirects to login', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Login first
      final emailField = find.byType(TextFormField).first;
      final passwordField = find.byType(TextFormField).last;
      await tester.enterText(emailField, 'customer@helpdesk.com');
      await tester.enterText(passwordField, 'Customer@123');
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Tap profile / account to access logout
      // Navigate to profile tab
      final profileTab = find.byIcon(Icons.person_outline_rounded);
      if (profileTab.evaluate().isNotEmpty) {
        await tester.tap(profileTab);
        await tester.pumpAndSettle();
      }

      // Tap logout button
      final logoutButton = find.text('Sign Out');
      if (logoutButton.evaluate().isNotEmpty) {
        await tester.tap(logoutButton);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Should be back on login screen
      expect(find.text('Sign in to your account'), findsOneWidget);
    });
  });
}
