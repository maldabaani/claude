import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class PriorityBadge extends StatelessWidget {
  final String priority;
  final bool compact;

  const PriorityBadge({super.key, required this.priority, this.compact = false});

  static Color colorFor(String priority) {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return AppColors.priorityCritical;
      case 'HIGH': return AppColors.priorityHigh;
      case 'MEDIUM': return AppColors.priorityMedium;
      case 'LOW': return AppColors.priorityLow;
      default: return AppColors.textSecondary;
    }
  }

  static Color bgFor(String priority) {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return AppColors.priorityCriticalBg;
      case 'HIGH': return AppColors.priorityHighBg;
      case 'MEDIUM': return AppColors.priorityMediumBg;
      case 'LOW': return AppColors.priorityLowBg;
      default: return AppColors.surfaceVariant;
    }
  }

  static IconData iconFor(String priority) {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return Icons.local_fire_department;
      case 'HIGH': return Icons.keyboard_double_arrow_up;
      case 'MEDIUM': return Icons.remove;
      case 'LOW': return Icons.keyboard_double_arrow_down;
      default: return Icons.remove;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = colorFor(priority);
    final bg = bgFor(priority);
    final icon = iconFor(priority);
    final label = priority[0].toUpperCase() + priority.substring(1).toLowerCase();

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 8,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: compact ? 10 : 12, color: color),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: compact ? 10 : 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
