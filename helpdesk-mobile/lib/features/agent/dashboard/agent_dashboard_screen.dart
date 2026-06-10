import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/time_ago.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/priority_badge.dart';

class AgentDashboardScreen extends ConsumerStatefulWidget {
  const AgentDashboardScreen({super.key});

  @override
  ConsumerState<AgentDashboardScreen> createState() => _AgentDashboardScreenState();
}

class _AgentDashboardScreenState extends ConsumerState<AgentDashboardScreen> {
  final _api = ApiClient();
  Map<String, dynamic>? _analytics;
  List<dynamic> _recentTickets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.get(ApiEndpoints.analytics),
        _api.get(ApiEndpoints.tickets, queryParams: {
          'assignedToMe': 'true',
          'sortBy': 'updatedAt',
          'sortDir': 'desc',
          'size': '5',
        }),
      ]);
      if (mounted) {
        setState(() {
          _analytics = results[0].data['data'];
          final ticketData = results[1].data['data'];
          _recentTickets = ticketData is Map ? (ticketData['content'] ?? []) : (ticketData ?? []);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.go('/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header gradient
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, ${user?.fullName ?? 'Agent'} 👋',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "Here's your ticket overview for today",
                      style: TextStyle(fontSize: 14, color: Colors.white70),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_loading)
                      const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
                    else ...[
                      // Stats grid
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.5,
                        children: [
                          _GradientStatCard(
                            label: 'My Open Tickets',
                            value: _analytics?['openTickets']?.toString() ?? '-',
                            icon: Icons.inbox_outlined,
                            gradientColors: [const Color(0xFF2563EB), const Color(0xFF1D4ED8)],
                          ),
                          _GradientStatCard(
                            label: 'Unassigned',
                            value: _analytics?['unassignedTickets']?.toString() ?? '-',
                            icon: Icons.person_off_outlined,
                            gradientColors: [const Color(0xFF7C3AED), const Color(0xFF6D28D9)],
                          ),
                          _GradientStatCard(
                            label: 'SLA Breaching',
                            value: _analytics?['slaBreachedTickets']?.toString() ?? '-',
                            icon: Icons.warning_amber_outlined,
                            gradientColors: [const Color(0xFFDC2626), const Color(0xFFB91C1C)],
                          ),
                          _GradientStatCard(
                            label: 'Resolved Today',
                            value: _analytics?['resolvedToday']?.toString() ?? '-',
                            icon: Icons.check_circle_outline,
                            gradientColors: [const Color(0xFF16A34A), const Color(0xFF15803D)],
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Recent Activity
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Recent Activity', style: Theme.of(context).textTheme.titleLarge),
                        TextButton(
                          onPressed: () => context.go('/agent/queue'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    if (_loading)
                      const SizedBox()
                    else if (_recentTickets.isEmpty)
                      _EmptyActivity()
                    else
                      ...(_recentTickets.map((t) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _RecentTicketCard(ticket: t),
                      ))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GradientStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final List<Color> gradientColors;

  const _GradientStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.gradientColors,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: Colors.white70, size: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: Colors.white70),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RecentTicketCard extends StatelessWidget {
  final Map<String, dynamic> ticket;
  const _RecentTicketCard({required this.ticket});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go('/agent/tickets/${ticket['id']}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '#${ticket['ticketNumber'] ?? ticket['id'] ?? ''}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textTertiary, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          ticket['title'] ?? ticket['subject'] ?? '',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      StatusBadge(status: ticket['status'] ?? 'NEW', small: true),
                      const SizedBox(width: 6),
                      PriorityBadge(priority: ticket['priority'] ?? 'MEDIUM', small: true),
                      const Spacer(),
                      Text(
                        formatTimeAgo(ticket['updatedAt']),
                        style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 20),
          ],
        ),
      ),
    );
  }
}

class _EmptyActivity extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          const Icon(Icons.inbox_outlined, size: 40, color: AppColors.textTertiary),
          const SizedBox(height: 8),
          Text('No recent tickets', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
