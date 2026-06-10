import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class PriorityBadge extends StatelessWidget {
  final String priority;
  final bool small;

  const PriorityBadge({super.key, required this.priority, this.small = false});

  @override
  Widget build(BuildContext context) {
    final config = _priorityConfig(priority);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 10,
        vertical: small ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: config.bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        config.label,
        style: TextStyle(
          fontSize: small ? 10 : 11,
          fontWeight: FontWeight.w700,
          color: config.color,
        ),
      ),
    );
  }

  _PriorityConfig _priorityConfig(String p) {
    switch (p.toUpperCase()) {
      case 'CRITICAL': return _PriorityConfig('Critical', AppColors.priorityCritical, AppColors.priorityCriticalBg);
      case 'HIGH': return _PriorityConfig('High', AppColors.priorityHigh, AppColors.priorityHighBg);
      case 'MEDIUM': return _PriorityConfig('Medium', AppColors.priorityMedium, AppColors.priorityMediumBg);
      case 'LOW': return _PriorityConfig('Low', AppColors.priorityLow, AppColors.priorityLowBg);
      default: return _PriorityConfig(p, AppColors.textTertiary, AppColors.surfaceVariant);
    }
  }
}

class _PriorityConfig {
  final String label;
  final Color color;
  final Color bg;
  const _PriorityConfig(this.label, this.color, this.bg);
}
