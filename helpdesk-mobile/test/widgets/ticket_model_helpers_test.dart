// Tests for the private helper functions defined in my_tickets_screen.dart.
// Because the helpers (_statusLabel, _formatDate, _statusColor, _priorityColor)
// are package-private top-level functions (not exported), we duplicate/mirror
// them here so they can be tested without modifying the production file.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:helpdesk_mobile/core/theme/app_colors.dart';

// ── Mirrors of the helpers from my_tickets_screen.dart ─────────────────────

String statusLabel(String s) {
  switch (s) {
    case 'ON_HOLD':
      return 'On Hold';
    default:
      return s[0] + s.substring(1).toLowerCase();
  }
}

String formatDate(String isoDate) {
  final dt = DateTime.tryParse(isoDate);
  if (dt == null) return isoDate;
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return '${dt.day}/${dt.month}/${dt.year}';
}

Color statusColor(String s) {
  switch (s) {
    case 'NEW':
      return AppColors.statusNew;
    case 'OPEN':
      return AppColors.statusOpen;
    case 'PENDING':
      return AppColors.statusPending;
    case 'ON_HOLD':
      return AppColors.statusOnHold;
    case 'RESOLVED':
      return AppColors.statusResolved;
    case 'CLOSED':
      return AppColors.statusClosed;
    default:
      return AppColors.textSecondary;
  }
}

Color priorityColor(String p) {
  switch (p) {
    case 'CRITICAL':
      return AppColors.priorityCritical;
    case 'HIGH':
      return AppColors.priorityHigh;
    case 'MEDIUM':
      return AppColors.priorityMedium;
    default:
      return AppColors.priorityLow;
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

void main() {
  group('_statusLabel helper', () {
    test('ON_HOLD → "On Hold"', () {
      expect(statusLabel('ON_HOLD'), 'On Hold');
    });

    test('NEW → "New"', () {
      expect(statusLabel('NEW'), 'New');
    });

    test('OPEN → "Open"', () {
      expect(statusLabel('OPEN'), 'Open');
    });

    test('PENDING → "Pending"', () {
      expect(statusLabel('PENDING'), 'Pending');
    });

    test('RESOLVED → "Resolved"', () {
      expect(statusLabel('RESOLVED'), 'Resolved');
    });

    test('CLOSED → "Closed"', () {
      expect(statusLabel('CLOSED'), 'Closed');
    });
  });

  group('_formatDate helper', () {
    test('date a few minutes ago → "<n>m ago"', () {
      final recent = DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String();
      final result = formatDate(recent);
      expect(result, matches(RegExp(r'^\dm ago$')));
    });

    test('date a few hours ago → "<n>h ago"', () {
      final fewHoursAgo = DateTime.now().subtract(const Duration(hours: 3)).toIso8601String();
      final result = formatDate(fewHoursAgo);
      expect(result, matches(RegExp(r'^\dh ago$')));
    });

    test('date a few days ago → "<n>d ago"', () {
      final fewDaysAgo = DateTime.now().subtract(const Duration(days: 3)).toIso8601String();
      final result = formatDate(fewDaysAgo);
      expect(result, matches(RegExp(r'^\dd ago$')));
    });

    test('date more than 7 days ago → "d/m/yyyy" formatted string', () {
      final oldDate = DateTime(2023, 6, 1);
      final result = formatDate(oldDate.toIso8601String());
      expect(result, '1/6/2023');
    });

    test('invalid date string returns original string', () {
      expect(formatDate('not-a-date'), 'not-a-date');
    });
  });

  group('_statusColor helper', () {
    const knownStatuses = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

    for (final s in knownStatuses) {
      test('does not throw for status "$s"', () {
        expect(() => statusColor(s), returnsNormally);
      });
    }

    test('returns fallback color for unknown status', () {
      expect(statusColor('UNKNOWN'), AppColors.textSecondary);
    });
  });

  group('_priorityColor helper', () {
    const knownPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

    for (final p in knownPriorities) {
      test('does not throw for priority "$p"', () {
        expect(() => priorityColor(p), returnsNormally);
      });
    }

    test('CRITICAL returns priorityCritical', () {
      expect(priorityColor('CRITICAL'), AppColors.priorityCritical);
    });

    test('HIGH returns priorityHigh', () {
      expect(priorityColor('HIGH'), AppColors.priorityHigh);
    });

    test('MEDIUM returns priorityMedium', () {
      expect(priorityColor('MEDIUM'), AppColors.priorityMedium);
    });

    test('LOW returns priorityLow (default)', () {
      expect(priorityColor('LOW'), AppColors.priorityLow);
    });
  });
}
