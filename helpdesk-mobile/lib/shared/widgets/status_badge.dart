import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool small;

  const StatusBadge({super.key, required this.status, this.small = false});

  @override
  Widget build(BuildContext context) {
    final config = _statusConfig(status);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 10,
        vertical: small ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: config.bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: config.color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: small ? 5 : 6,
            height: small ? 5 : 6,
            decoration: BoxDecoration(color: config.color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            config.label,
            style: TextStyle(
              fontSize: small ? 10 : 11,
              fontWeight: FontWeight.w700,
              color: config.color,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  _StatusConfig _statusConfig(String s) {
    switch (s.toUpperCase()) {
      case 'NEW': return _StatusConfig('New', AppColors.statusNew, AppColors.statusNewBg);
      case 'OPEN': return _StatusConfig('Open', AppColors.statusOpen, AppColors.statusOpenBg);
      case 'PENDING': return _StatusConfig('Pending', AppColors.statusPending, AppColors.statusPendingBg);
      case 'ON_HOLD': return _StatusConfig('On Hold', AppColors.statusOnHold, AppColors.statusOnHoldBg);
      case 'RESOLVED': return _StatusConfig('Resolved', AppColors.statusResolved, AppColors.statusResolvedBg);
      case 'CLOSED': return _StatusConfig('Closed', AppColors.statusClosed, AppColors.statusClosedBg);
      default: return _StatusConfig(s, AppColors.textTertiary, AppColors.surfaceVariant);
    }
  }
}

class _StatusConfig {
  final String label;
  final Color color;
  final Color bg;
  const _StatusConfig(this.label, this.color, this.bg);
}
