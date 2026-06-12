import 'package:flutter_test/flutter_test.dart';
import 'package:helpdesk_mobile/core/models/user_model.dart';

void main() {
  group('UserModel.fromJson', () {
    test('fromJson with userId field (auth response) maps to id', () {
      final json = {
        'userId': 'auth-user-123',
        'email': 'user@test.com',
        'fullName': 'Test User',
        'role': 'CUSTOMER',
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 'auth-user-123');
    });

    test('fromJson with id field (me response) maps to id', () {
      final json = {
        'id': 'me-user-456',
        'email': 'user@test.com',
        'fullName': 'Test User',
        'role': 'ADMIN',
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 'me-user-456');
    });

    test('fromJson id field takes priority over userId', () {
      final json = {
        'id': 'id-value',
        'userId': 'userId-value',
        'email': 'user@test.com',
        'fullName': 'Test User',
        'role': 'CUSTOMER',
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 'id-value');
    });

    test('fromJson with empty json uses defaults', () {
      final user = UserModel.fromJson({});
      expect(user.id, '');
      expect(user.email, '');
      expect(user.fullName, '');
      expect(user.role, 'CUSTOMER');
      expect(user.active, true);
    });
  });

  group('UserModel role checks', () {
    UserModel makeUser(String role) => UserModel(
          id: '1',
          email: 'test@test.com',
          fullName: 'Test User',
          role: role,
        );

    test('isAdmin returns true only for ADMIN role', () {
      expect(makeUser('ADMIN').isAdmin, isTrue);
      expect(makeUser('AGENT').isAdmin, isFalse);
      expect(makeUser('CUSTOMER').isAdmin, isFalse);
      expect(makeUser('TEAM_LEAD').isAdmin, isFalse);
    });

    test('isAgentOrAbove returns true for AGENT', () {
      expect(makeUser('AGENT').isAgentOrAbove, isTrue);
    });

    test('isAgentOrAbove returns true for TEAM_LEAD', () {
      expect(makeUser('TEAM_LEAD').isAgentOrAbove, isTrue);
    });

    test('isAgentOrAbove returns true for ADMIN', () {
      expect(makeUser('ADMIN').isAgentOrAbove, isTrue);
    });

    test('isAgentOrAbove returns false for CUSTOMER', () {
      expect(makeUser('CUSTOMER').isAgentOrAbove, isFalse);
    });

    test('isCustomer returns true only for CUSTOMER role', () {
      expect(makeUser('CUSTOMER').isCustomer, isTrue);
      expect(makeUser('ADMIN').isCustomer, isFalse);
      expect(makeUser('AGENT').isCustomer, isFalse);
    });
  });

  group('UserModel.initials', () {
    test('initials from "John Doe" returns "JD"', () {
      final user = UserModel(
        id: '1',
        email: 'john@test.com',
        fullName: 'John Doe',
        role: 'CUSTOMER',
      );
      expect(user.initials, 'JD');
    });

    test('initials from single name "Alice" returns "A"', () {
      final user = UserModel(
        id: '1',
        email: 'alice@test.com',
        fullName: 'Alice',
        role: 'CUSTOMER',
      );
      expect(user.initials, 'A');
    });

    test('initials are uppercased', () {
      final user = UserModel(
        id: '1',
        email: 'test@test.com',
        fullName: 'john doe',
        role: 'CUSTOMER',
      );
      expect(user.initials, 'JD');
    });

    test('initials from three names uses first two', () {
      final user = UserModel(
        id: '1',
        email: 'test@test.com',
        fullName: 'Alice Bob Charlie',
        role: 'CUSTOMER',
      );
      expect(user.initials, 'AB');
    });
  });
}
