import 'package:flutter_test/flutter_test.dart';
import 'package:helpdesk_mobile/core/models/ticket_model.dart';

void main() {
  group('TicketModel.fromJson', () {
    final fullJson = {
      'id': 'ticket-1',
      'ticketNumber': 'TKT-001',
      'title': 'Test Ticket',
      'description': 'A description',
      'status': 'OPEN',
      'priority': 'HIGH',
      'departmentId': 'dept-1',
      'createdById': 'user-1',
      'assignedAgentId': 'agent-1',
      'createdBy': {'fullName': 'John Doe'},
      'assignedAgent': {'fullName': 'Jane Agent'},
      'tags': ['bug', 'urgent'],
      'slaBreached': true,
      'dueDate': '2025-12-31T00:00:00Z',
      'manualDueDate': null,
      'firstResponseAt': '2025-01-01T10:00:00Z',
      'resolvedAt': null,
      'createdAt': '2025-01-01T09:00:00Z',
      'updatedAt': '2025-01-01T09:30:00Z',
    };

    test('fromJson with full data maps all fields correctly', () {
      final ticket = TicketModel.fromJson(fullJson);

      expect(ticket.id, 'ticket-1');
      expect(ticket.ticketNumber, 'TKT-001');
      expect(ticket.title, 'Test Ticket');
      expect(ticket.description, 'A description');
      expect(ticket.status, 'OPEN');
      expect(ticket.priority, 'HIGH');
      expect(ticket.departmentId, 'dept-1');
      expect(ticket.createdById, 'user-1');
      expect(ticket.assignedAgentId, 'agent-1');
      expect(ticket.createdBy, {'fullName': 'John Doe'});
      expect(ticket.assignedAgent, {'fullName': 'Jane Agent'});
      expect(ticket.tags, ['bug', 'urgent']);
      expect(ticket.slaBreached, true);
      expect(ticket.dueDate, '2025-12-31T00:00:00Z');
      expect(ticket.firstResponseAt, '2025-01-01T10:00:00Z');
      expect(ticket.createdAt, '2025-01-01T09:00:00Z');
      expect(ticket.updatedAt, '2025-01-01T09:30:00Z');
    });

    test('fromJson with null optional fields applies defaults without crashing', () {
      final json = <String, dynamic>{};
      final ticket = TicketModel.fromJson(json);

      expect(ticket.id, '');
      expect(ticket.ticketNumber, '');
      expect(ticket.title, '');
      expect(ticket.description, '');
      expect(ticket.status, 'NEW');
      expect(ticket.priority, 'MEDIUM');
      expect(ticket.departmentId, isNull);
      expect(ticket.assignedAgentId, isNull);
      expect(ticket.createdBy, isNull);
      expect(ticket.assignedAgent, isNull);
      expect(ticket.tags, isEmpty);
      expect(ticket.slaBreached, false);
    });

    test('fromJson with missing id uses empty string default', () {
      final json = <String, dynamic>{'title': 'No ID ticket'};
      final ticket = TicketModel.fromJson(json);
      expect(ticket.id, '');
    });
  });

  group('TicketModel computed properties', () {
    TicketModel makeTicket({
      String status = 'NEW',
      String? dueDate,
      String? manualDueDate,
      Map<String, dynamic>? assignedAgent,
      Map<String, dynamic>? createdBy,
    }) {
      return TicketModel(
        id: '1',
        ticketNumber: 'TKT-001',
        title: 'Test',
        description: 'Desc',
        status: status,
        priority: 'MEDIUM',
        createdById: 'user-1',
        assignedAgent: assignedAgent,
        createdBy: createdBy,
        dueDate: dueDate,
        manualDueDate: manualDueDate,
        createdAt: DateTime.now().toIso8601String(),
        updatedAt: DateTime.now().toIso8601String(),
      );
    }

    test('isResolved returns true for RESOLVED status', () {
      expect(makeTicket(status: 'RESOLVED').isResolved, isTrue);
    });

    test('isResolved returns true for CLOSED status', () {
      expect(makeTicket(status: 'CLOSED').isResolved, isTrue);
    });

    test('isResolved returns false for OPEN status', () {
      expect(makeTicket(status: 'OPEN').isResolved, isFalse);
    });

    test('isOverdue returns true when dueDate is in the past', () {
      final past = DateTime.now().subtract(const Duration(days: 1)).toIso8601String();
      expect(makeTicket(dueDate: past).isOverdue, isTrue);
    });

    test('isOverdue returns false when dueDate is in the future', () {
      final future = DateTime.now().add(const Duration(days: 1)).toIso8601String();
      expect(makeTicket(dueDate: future).isOverdue, isFalse);
    });

    test('isOverdue uses manualDueDate when present (past)', () {
      final past = DateTime.now().subtract(const Duration(hours: 1)).toIso8601String();
      final future = DateTime.now().add(const Duration(days: 1)).toIso8601String();
      expect(makeTicket(dueDate: future, manualDueDate: past).isOverdue, isTrue);
    });

    test('isOverdue returns false when no dueDate', () {
      expect(makeTicket().isOverdue, isFalse);
    });

    test('assignedAgentName returns agent fullName when present', () {
      final ticket = makeTicket(assignedAgent: {'fullName': 'Jane Agent'});
      expect(ticket.assignedAgentName, 'Jane Agent');
    });

    test('assignedAgentName returns Unassigned when assignedAgent is null', () {
      expect(makeTicket(assignedAgent: null).assignedAgentName, 'Unassigned');
    });

    test('createdByName returns fullName when present', () {
      final ticket = makeTicket(createdBy: {'fullName': 'John Doe'});
      expect(ticket.createdByName, 'John Doe');
    });

    test('createdByName returns Unknown when createdBy is null', () {
      expect(makeTicket(createdBy: null).createdByName, 'Unknown');
    });
  });
}
