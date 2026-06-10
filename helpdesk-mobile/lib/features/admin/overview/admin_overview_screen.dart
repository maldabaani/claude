import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/time_ago.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/priority_badge.dart';

class AdminOverviewScreen extends ConsumerStatefulWidget {
  const AdminOverviewScreen({super.key});

  @override
  ConsumerState<AdminOverviewScreen> createState() => _AdminOverviewScreenState();
}

class _AdminOverviewScreenState extends ConsumerState<AdminOverviewScreen> {
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
        _api.get(ApiEndpoints.tickets, queryParams: {'sortBy': 'createdAt', 'sortDir': 'desc', 'size': '10'}),
      ]);
      if (mounted) {
        final ticketData = results[1].data['data'];
        setState(() {
          _analytics = results[0].data['data'];
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
        title: const Text('Admin Overview'),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () => context.go('/notifications')),
          IconButton(icon: const Icon(Icons.person_outline), onPressed: () => context.go('/profile')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.sidebar, Color(0xFF1E293B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome, ${user?.fullName ?? 'Admin'}',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    const Text('System overview dashboard', style: TextStyle(fontSize: 13, color: Colors.white60)),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (_loading)
                const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
              else ...[
                // KPI Grid
                Text('Key Metrics', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    _KpiCard(label: 'Total Tickets', value: _analytics?['totalTickets']?.toString() ?? '-', icon: Icons.confirmation_number_outlined, color: AppColors.primary),
                    _KpiCard(label: 'Open Tickets', value: _analytics?['openTickets']?.toString() ?? '-', icon: Icons.inbox_outlined, color: AppColors.statusOpen),
                    _KpiCard(label: 'Resolved Today', value: _analytics?['resolvedToday']?.toString() ?? '-', icon: Icons.check_circle_outline, color: AppColors.statusResolved),
                    _KpiCard(label: 'Avg Response', value: _analytics?['avgResponseTime']?.toString() ?? '-', icon: Icons.timer_outlined, color: AppColors.statusPending),
                    _KpiCard(label: 'SLA Compliance', value: _analytics?['slaComplianceRate'] != null ? '${_analytics!['slaComplianceRate']}%' : '-', icon: Icons.verified_outlined, color: AppColors.success),
                    _KpiCard(label: 'Active Agents', value: _analytics?['activeAgents']?.toString() ?? '-', icon: Icons.support_agent_outlined, color: AppColors.accent),
                  ],
                ),
                const SizedBox(height: 24),

                // Bar chart
                Text('Tickets by Status', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                _TicketsByStatusChart(analytics: _analytics),
                const SizedBox(height: 24),

                // Recent tickets
                Text('Recent Tickets', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                _RecentTicketsTable(tickets: _recentTickets),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _KpiCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
                Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary), maxLines: 2),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TicketsByStatusChart extends StatelessWidget {
  final Map<String, dynamic>? analytics;
  const _TicketsByStatusChart({required this.analytics});

  @override
  Widget build(BuildContext context) {
    final data = [
      _BarData('NEW', (analytics?['newTickets'] ?? 0).toDouble(), AppColors.statusNew),
      _BarData('OPEN', (analytics?['openTickets'] ?? 0).toDouble(), AppColors.statusOpen),
      _BarData('PENDING', (analytics?['pendingTickets'] ?? 0).toDouble(), AppColors.statusPending),
      _BarData('ON HOLD', (analytics?['onHoldTickets'] ?? 0).toDouble(), AppColors.statusOnHold),
      _BarData('RESOLVED', (analytics?['resolvedTickets'] ?? 0).toDouble(), AppColors.statusResolved),
    ];
    final maxY = data.map((d) => d.value).fold(0.0, (a, b) => a > b ? a : b);
    final chartMaxY = maxY < 5 ? 5.0 : maxY * 1.2;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: SizedBox(
        height: 180,
        child: BarChart(
          BarChartData(
            maxY: chartMaxY,
            barTouchData: BarTouchData(enabled: true),
            titlesData: FlTitlesData(
              show: true,
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (value, meta) {
                    final i = value.toInt();
                    if (i < 0 || i >= data.length) return const SizedBox();
                    return Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(data[i].label, style: const TextStyle(fontSize: 9, color: AppColors.textSecondary)),
                    );
                  },
                ),
              ),
              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            gridData: FlGridData(show: false),
            barGroups: data.asMap().entries.map((e) => BarChartGroupData(
              x: e.key,
              barRods: [
                BarChartRodData(
                  toY: e.value.value,
                  color: e.value.color,
                  width: 32,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(6),
                    topRight: Radius.circular(6),
                  ),
                ),
              ],
            )).toList(),
          ),
        ),
      ),
    );
  }
}

class _BarData {
  final String label;
  final double value;
  final Color color;
  _BarData(this.label, this.value, this.color);
}

class _RecentTicketsTable extends StatelessWidget {
  final List<dynamic> tickets;
  const _RecentTicketsTable({required this.tickets});

  @override
  Widget build(BuildContext context) {
    if (tickets.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(child: Text('No recent tickets', style: TextStyle(color: AppColors.textSecondary))),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: tickets.asMap().entries.map((e) {
          final t = e.value as Map<String, dynamic>;
          final agentName = t['assignedAgent']?['fullName'] ?? t['assigneeName'] ?? 'Unassigned';
          final isLast = e.key == tickets.length - 1;

          return Column(
            children: [
              InkWell(
                onTap: () => context.go('/admin/tickets/${t['id']}'),
                borderRadius: BorderRadius.circular(isLast ? 16 : 0).copyWith(
                  topLeft: e.key == 0 ? const Radius.circular(16) : Radius.zero,
                  topRight: e.key == 0 ? const Radius.circular(16) : Radius.zero,
                  bottomLeft: isLast ? const Radius.circular(16) : Radius.zero,
                  bottomRight: isLast ? const Radius.circular(16) : Radius.zero,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 50,
                        child: Text(
                          '#${t['ticketNumber'] ?? t['id'] ?? ''}',
                          style: const TextStyle(fontSize: 11, color: AppColors.textTertiary, fontWeight: FontWeight.w600),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          t['title'] ?? t['subject'] ?? '',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      StatusBadge(status: t['status'] ?? 'NEW', small: true),
                    ],
                  ),
                ),
              ),
              if (!isLast) const Divider(height: 1),
            ],
          );
        }).toList(),
      ),
    );
  }
}
