import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/services/ticket_service.dart';
import '../../../core/models/ticket_model.dart';
import '../../../core/theme/app_colors.dart';

class CustomerHomeScreen extends ConsumerStatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  ConsumerState<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends ConsumerState<CustomerHomeScreen> {
  final _ticketService = TicketService();
  List<TicketModel> _tickets = [];
  int _totalOpen = 0;
  int _totalPending = 0;
  int _totalResolved = 0;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final all = await _ticketService.getTickets(size: 20);
      final open = await _ticketService.getTickets(status: 'OPEN', size: 1);
      final pending =
          await _ticketService.getTickets(status: 'PENDING', size: 1);
      final resolved =
          await _ticketService.getTickets(status: 'RESOLVED', size: 1);
      if (!mounted) return;
      setState(() {
        _tickets =
            (all['content'] as List<TicketModel>).take(5).toList();
        _totalOpen = open['totalElements'] as int;
        _totalPending = pending['totalElements'] as int;
        _totalResolved = resolved['totalElements'] as int;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load data. Pull down to retry.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final firstName = user?.fullName.split(' ').first ?? 'there';

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // ── Welcome Hero ───────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF1E3A8A),
                    Color(0xFF2563EB),
                    Color(0xFF4F46E5),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello, $firstName! 👋',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: -0.4,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'How can we help you today?',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withOpacity(0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Text(
                            user?.initials ?? '?',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  GestureDetector(
                    onTap: () => context.push('/customer/submit'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.add_circle_outline_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Submit a new support ticket',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          Spacer(),
                          Icon(
                            Icons.arrow_forward_ios_rounded,
                            color: Colors.white,
                            size: 14,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Stats Row ──────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  _StatCard(
                    label: 'Open',
                    count: _totalOpen,
                    color: AppColors.statusOpen,
                    bgColor: AppColors.statusOpenBg,
                    icon: Icons.radio_button_checked_rounded,
                    loading: _loading,
                  ),
                  const SizedBox(width: 10),
                  _StatCard(
                    label: 'Pending',
                    count: _totalPending,
                    color: AppColors.statusPending,
                    bgColor: AppColors.statusPendingBg,
                    icon: Icons.hourglass_empty_rounded,
                    loading: _loading,
                  ),
                  const SizedBox(width: 10),
                  _StatCard(
                    label: 'Resolved',
                    count: _totalResolved,
                    color: AppColors.statusResolved,
                    bgColor: AppColors.statusResolvedBg,
                    icon: Icons.check_circle_outline_rounded,
                    loading: _loading,
                  ),
                ],
              ),
            ),
          ),

          // ── Quick Actions ──────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: _QuickActionCard(
                      icon: Icons.confirmation_number_rounded,
                      label: 'My Tickets',
                      subtitle: 'Track your issues',
                      color: AppColors.primary,
                      bgColor: AppColors.primaryLight,
                      onTap: () => context.go('/customer/tickets'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionCard(
                      icon: Icons.menu_book_rounded,
                      label: 'Knowledge Base',
                      subtitle: 'Find answers fast',
                      color: AppColors.accent,
                      bgColor: const Color(0xFFEEF2FF),
                      onTap: () => context.go('/customer/kb'),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Recent Tickets header ──────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Row(
                children: [
                  const Text(
                    'Recent Tickets',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => context.go('/customer/tickets'),
                    child: const Text(
                      'View all',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Error ──────────────────────────────────────────────────────
          if (_error != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.errorBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: AppColors.error,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF991B1B),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // ── Ticket List / Shimmer ──────────────────────────────────────
          if (_loading)
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) => const _TicketShimmer(),
                childCount: 4,
              ),
            )
          else if (_tickets.isEmpty && _error == null)
            SliverToBoxAdapter(
              child: _EmptyState(
                icon: Icons.inbox_outlined,
                title: 'No tickets yet',
                subtitle:
                    'Submit your first support ticket and we\'ll get back to you shortly.',
                actionLabel: 'Submit Ticket',
                onAction: () => context.push('/customer/submit'),
              ),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) => _TicketCard(
                  ticket: _tickets[i],
                  onTap: () =>
                      context.push('/customer/tickets/${_tickets[i].id}'),
                ),
                childCount: _tickets.length,
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bgColor;
  final IconData icon;
  final bool loading;

  const _StatCard({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
    required this.icon,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(height: 8),
            loading
                ? Container(
                    width: 28,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  )
                : Text(
                    '$count',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: color,
                    ),
                  ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Quick Action Card ───────────────────────────────────────────────────────

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.bgColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────

class _TicketCard extends StatelessWidget {
  final TicketModel ticket;
  final VoidCallback onTap;

  const _TicketCard({required this.ticket, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(ticket.status);
    final statusBg = _statusBg(ticket.status);
    final priorityColor = _priorityColor(ticket.priority);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Color accent bar on top
            Container(
              height: 3,
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: statusBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _statusLabel(ticket.status),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: statusColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: priorityColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        ticket.priority,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: priorityColor,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '#${ticket.ticketNumber}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
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
                  const SizedBox(height: 4),
                  Text(
                    ticket.description,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 13,
                        color: AppColors.textTertiary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatDate(ticket.createdAt),
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textTertiary,
                        ),
                      ),
                      const Spacer(),
                      if (ticket.assignedAgentId != null) ...[
                        const Icon(
                          Icons.person_outline_rounded,
                          size: 13,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          ticket.assignedAgentName,
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ] else
                        const Text(
                          'Unassigned',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: AppColors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Ticket Shimmer ──────────────────────────────────────────────────────────

class _TicketShimmer extends StatefulWidget {
  const _TicketShimmer();

  @override
  State<_TicketShimmer> createState() => _TicketShimmerState();
}

class _TicketShimmerState extends State<_TicketShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.4, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Opacity(
        opacity: _anim.value,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _shimmerBox(60, 20, 6),
                  const SizedBox(width: 8),
                  _shimmerBox(40, 20, 6),
                ],
              ),
              const SizedBox(height: 10),
              _shimmerBox(double.infinity, 14, 4),
              const SizedBox(height: 6),
              _shimmerBox(200, 14, 4),
              const SizedBox(height: 10),
              _shimmerBox(120, 12, 4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _shimmerBox(double w, double h, double r) => Container(
        width: w,
        height: h,
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(r),
        ),
      );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, size: 34, color: AppColors.textTertiary),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: onAction,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: Text(
              actionLabel,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

Color _statusColor(String status) {
  switch (status) {
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

Color _statusBg(String status) {
  switch (status) {
    case 'NEW':
      return AppColors.statusNewBg;
    case 'OPEN':
      return AppColors.statusOpenBg;
    case 'PENDING':
      return AppColors.statusPendingBg;
    case 'ON_HOLD':
      return AppColors.statusOnHoldBg;
    case 'RESOLVED':
      return AppColors.statusResolvedBg;
    case 'CLOSED':
      return AppColors.statusClosedBg;
    default:
      return AppColors.surfaceVariant;
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'ON_HOLD':
      return 'On Hold';
    default:
      return status[0] + status.substring(1).toLowerCase();
  }
}

Color _priorityColor(String priority) {
  switch (priority) {
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

String _formatDate(String isoDate) {
  final dt = DateTime.tryParse(isoDate);
  if (dt == null) return isoDate;
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return '${dt.day}/${dt.month}/${dt.year}';
}
