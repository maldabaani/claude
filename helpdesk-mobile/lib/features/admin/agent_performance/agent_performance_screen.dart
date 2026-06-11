import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class AgentPerformanceScreen extends ConsumerStatefulWidget {
  const AgentPerformanceScreen({super.key});

  @override
  ConsumerState<AgentPerformanceScreen> createState() => _AgentPerformanceScreenState();
}

class _AgentPerformanceScreenState extends ConsumerState<AgentPerformanceScreen> {
  final _api = ApiClient();
  List<dynamic> _agents = [];
  bool _loading = true;
  int _selectedDays = 30;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final to = DateTime.now().toUtc().toIso8601String();
      final from = DateTime.now().subtract(Duration(days: _selectedDays)).toUtc().toIso8601String();
      final res = await _api.get(ApiEndpoints.agentPerformance, queryParams: {'from': from, 'to': to});
      if (mounted) {
        setState(() {
          _agents = res.data['data'] ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showDetail(Map<String, dynamic> agent) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _AgentDetailSheet(agent: agent),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Agent Performance'),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: SegmentedButton<int>(
              style: const ButtonStyle(
                visualDensity: VisualDensity.compact,
              ),
              segments: const [
                ButtonSegment(value: 7, label: Text('7d')),
                ButtonSegment(value: 30, label: Text('30d')),
                ButtonSegment(value: 90, label: Text('90d')),
              ],
              selected: {_selectedDays},
              onSelectionChanged: (s) {
                setState(() => _selectedDays = s.first);
                _load();
              },
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _agents.isEmpty
                ? const Center(child: Text('No agent data available.', style: TextStyle(color: AppColors.textSecondary)))
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: _agents.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final agent = _agents[i] as Map<String, dynamic>;
                      return _AgentCard(
                        agent: agent,
                        onTap: () => _showDetail(agent),
                      );
                    },
                  ),
      ),
    );
  }
}

class _AgentCard extends StatelessWidget {
  final Map<String, dynamic> agent;
  final VoidCallback onTap;

  const _AgentCard({required this.agent, required this.onTap});

  Color _statusColor(String status) {
    switch (status) {
      case 'ONLINE': return AppColors.success;
      case 'BUSY': return AppColors.statusPending;
      case 'AWAY': return Colors.orange;
      default: return AppColors.textTertiary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = agent['availabilityStatus'] as String? ?? 'OFFLINE';
    final csat = (agent['csatScore'] as num?)?.toDouble() ?? 0.0;
    final resolved = agent['ticketsResolved'] ?? 0;
    final open = agent['ticketsOpen'] ?? 0;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  child: Text(
                    (agent['agentName'] as String? ?? '?').isNotEmpty
                        ? (agent['agentName'] as String)[0].toUpperCase()
                        : '?',
                    style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                ),
                Positioned(
                  bottom: 0, right: 0,
                  child: Container(
                    width: 11, height: 11,
                    decoration: BoxDecoration(
                      color: _statusColor(status),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.surface, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(agent['agentName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  Text(status.toLowerCase(), style: TextStyle(fontSize: 11, color: _statusColor(status))),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  children: [
                    _MetricChip(label: '$resolved resolved', color: AppColors.success),
                    const SizedBox(width: 6),
                    _MetricChip(label: '$open open', color: AppColors.statusPending),
                  ],
                ),
                const SizedBox(height: 4),
                if (csat > 0)
                  Row(
                    children: [
                      Icon(Icons.star_rounded, size: 13, color: Colors.amber.shade600),
                      const SizedBox(width: 2),
                      Text(csat.toStringAsFixed(1), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  )
                else
                  const Text('No CSAT', style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
              ],
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 18),
          ],
        ),
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  final String label;
  final Color color;
  const _MetricChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
  );
}

class _AgentDetailSheet extends StatelessWidget {
  final Map<String, dynamic> agent;
  const _AgentDetailSheet({required this.agent});

  String _formatMinutes(num? minutes) {
    if (minutes == null || minutes == 0) return '—';
    final m = minutes.toDouble();
    final h = m ~/ 60;
    final rem = (m % 60).round();
    if (h > 0 && rem > 0) return '${h}h ${rem}m';
    if (h > 0) return '${h}h';
    return '${rem}m';
  }

  Widget _metricRow(String label, String value, Color valueColor) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        Text(value, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: valueColor)),
      ],
    ),
  );

  Widget _barRow(BuildContext context, String label, double value, double max, Color color) {
    final pct = max > 0 ? (value / max).clamp(0.0, 1.0) : 0.0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              Text(_formatMinutes(value), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct,
              backgroundColor: AppColors.border,
              color: color,
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = agent['agentName'] as String? ?? '';
    final email = agent['agentEmail'] as String? ?? '';
    final status = agent['availabilityStatus'] as String? ?? 'OFFLINE';
    final resolved = (agent['ticketsResolved'] as num?)?.toInt() ?? 0;
    final open = (agent['ticketsOpen'] as num?)?.toInt() ?? 0;
    final avgFirst = (agent['avgFirstResponseMinutes'] as num?)?.toDouble() ?? 0.0;
    final avgRes = (agent['avgResolutionMinutes'] as num?)?.toDouble() ?? 0.0;
    final csat = (agent['csatScore'] as num?)?.toDouble() ?? 0.0;
    final maxTime = [avgFirst, avgRes].reduce((a, b) => a > b ? a : b);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      builder: (_, controller) => ListView(
        controller: controller,
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Center(child: Container(width: 36, height: 4, margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)))),
          Row(children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.primary)),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              Text(email, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              Text(status.toLowerCase(), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
            ])),
          ]),
          const SizedBox(height: 20),
          const Divider(color: AppColors.border),
          const SizedBox(height: 12),
          Text('Ticket Metrics', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          _metricRow('Tickets Resolved', '$resolved', AppColors.success),
          _metricRow('Tickets Open', '$open', AppColors.statusPending),
          const SizedBox(height: 8),
          const Divider(color: AppColors.border),
          const SizedBox(height: 12),
          Text('Response Times', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          _barRow(context, 'Avg First Response', avgFirst, maxTime.clamp(1, double.infinity), AppColors.primary),
          _barRow(context, 'Avg Resolution', avgRes, maxTime.clamp(1, double.infinity), const Color(0xFF6366F1)),
          const SizedBox(height: 8),
          const Divider(color: AppColors.border),
          const SizedBox(height: 12),
          Text('Customer Satisfaction', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          if (csat > 0) ...[
            Row(children: [
              for (int i = 1; i <= 5; i++)
                Icon(i <= csat.round() ? Icons.star_rounded : Icons.star_outline_rounded,
                    color: Colors.amber.shade600, size: 28),
              const SizedBox(width: 10),
              Text(csat.toStringAsFixed(1), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              Text(' / 5', style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
            ]),
          ] else
            const Text('No CSAT ratings in this period.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }
}
