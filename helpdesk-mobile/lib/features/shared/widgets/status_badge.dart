import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool compact;

  const StatusBadge({super.key, required this.status, this.compact = false});

  static Color colorFor(String status) {
    switch (status.toUpperCase()) {
      case 'NEW': return AppColors.statusNew;
      case 'OPEN': return AppColors.statusOpen;
      case 'PENDING': return AppColors.statusPending;
      case 'ON_HOLD': return AppColors.statusOnHold;
      case 'RESOLVED': return AppColors.statusResolved;
      case 'CLOSED': return AppColors.statusClosed;
      default: return AppColors.textSecondary;
    }
  }

  static Color bgFor(String status) {
    switch (status.toUpperCase()) {
      case 'NEW': return AppColors.statusNewBg;
      case 'OPEN': return AppColors.statusOpenBg;
      case 'PENDING': return AppColors.statusPendingBg;
      case 'ON_HOLD': return AppColors.statusOnHoldBg;
      case 'RESOLVED': return AppColors.statusResolvedBg;
      case 'CLOSED': return AppColors.statusClosedBg;
      default: return AppColors.surfaceVariant;
    }
  }

  static String labelFor(String status) {
    switch (status.toUpperCase()) {
      case 'ON_HOLD': return 'On Hold';
      default: return status[0] + status.substring(1).toLowerCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = colorFor(status);
    final bg = bgFor(status);
    final label = labelFor(status);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 10,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: compact ? 10 : 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
