import 'package:flutter/material.dart';
import '../../core/models/ticket_model.dart';
import '../../core/theme/app_colors.dart';
import 'status_badge.dart';
import 'priority_badge.dart';
import '../utils/time_ago.dart';

class TicketCard extends StatelessWidget {
  final TicketModel ticket;
  final VoidCallback onTap;
  final bool showAgent;

  const TicketCard({
    super.key,
    required this.ticket,
    required this.onTap,
    this.showAgent = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row
            Row(
              children: [
                Text(
                  ticket.ticketNumber,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
                if (ticket.slaBreached) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.errorBg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 10, color: AppColors.error),
                        SizedBox(width: 3),
                        Text('SLA', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.error)),
                      ],
                    ),
                  ),
                ],
                const Spacer(),
                Text(
                  formatTimeAgo(ticket.createdAt),
                  style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Title
            Text(
              ticket.title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            // Bottom row
            Row(
              children: [
                StatusBadge(status: ticket.status, small: true),
                const SizedBox(width: 6),
                PriorityBadge(priority: ticket.priority, small: true),
                if (showAgent) ...[
                  const Spacer(),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            ticket.assignedAgent?['fullName']?.toString().substring(0, 1) ?? '?',
                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        ticket.assignedAgentName,
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
