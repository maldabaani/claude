import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  final _api = ApiClient();
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.analytics);
      if (mounted) setState(() { _data = resp.data['data']; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Ticket Statistics', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    _StatRow(label: 'Total Tickets', value: _data?['totalTickets']?.toString() ?? '-'),
                    _StatRow(label: 'Open Tickets', value: _data?['openTickets']?.toString() ?? '-'),
                    _StatRow(label: 'Resolved Tickets', value: _data?['resolvedTickets']?.toString() ?? '-'),
                    _StatRow(label: 'Closed Tickets', value: _data?['closedTickets']?.toString() ?? '-'),
                    _StatRow(label: 'Avg First Response', value: _data?['avgFirstResponseTime'] ?? '-'),
                    _StatRow(label: 'Avg Resolution Time', value: _data?['avgResolutionTime'] ?? '-'),
                    _StatRow(label: 'CSAT Score', value: _data?['csatScore'] != null ? '${_data!['csatScore']}%' : '-'),
                    const SizedBox(height: 24),
                    Text('Agent Performance', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    if (_data?['agentStats'] is List && (_data!['agentStats'] as List).isNotEmpty)
                      ...(_data!['agentStats'] as List).map((a) => _AgentStatCard(agent: a))
                    else
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Center(child: Text('No agent data available.')),
                      ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final String label;
  final String value;
  const _StatRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(value, style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.primary)),
        ],
      ),
    );
  }
}

class _AgentStatCard extends StatelessWidget {
  final Map<String, dynamic> agent;
  const _AgentStatCard({required this.agent});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.primaryLight,
            child: Text(
              (agent['agentName'] as String? ?? '?').isNotEmpty ? (agent['agentName'] as String)[0].toUpperCase() : '?',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(agent['agentName'] ?? '', style: Theme.of(context).textTheme.titleSmall),
                Text('Resolved: ${agent['resolvedCount'] ?? 0}  •  Avg: ${agent['avgResponseTime'] ?? '-'}',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
