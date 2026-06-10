import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
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
  Map<String, dynamic>? _analytics;
  bool _loading = true;
  int _days = 7;

  static const _dayOptions = [7, 30, 90];
  static const _dayLabels = {7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days'};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.analytics, queryParams: {'days': _days.toString()});
      if (mounted) setState(() { _analytics = resp.data['data']; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Analytics'),
      ),
      body: Column(
        children: [
          // Date range chips
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: _dayOptions.map((d) {
                final selected = _days == d;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(_dayLabels[d]!, style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textSecondary)),
                    selected: selected,
                    selectedColor: AppColors.primary,
                    backgroundColor: AppColors.surface,
                    side: BorderSide(color: selected ? AppColors.primary : AppColors.border),
                    onSelected: (_) { setState(() => _days = d); _load(); },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // KPI grid
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 1.5,
                            children: [
                              _KpiCard(label: 'Total Tickets', value: _analytics?['totalTickets']?.toString() ?? '-', color: AppColors.primary),
                              _KpiCard(label: 'Open Tickets', value: _analytics?['openTickets']?.toString() ?? '-', color: AppColors.statusOpen),
                              _KpiCard(label: 'Resolved Today', value: _analytics?['resolvedToday']?.toString() ?? '-', color: AppColors.statusResolved),
                              _KpiCard(label: 'Avg Response', value: _analytics?['avgResponseTime']?.toString() ?? '-', color: AppColors.statusPending),
                              _KpiCard(label: 'SLA Compliance', value: _analytics?['slaComplianceRate'] != null ? '${_analytics!['slaComplianceRate']}%' : '-', color: AppColors.success),
                              _KpiCard(label: 'Active Agents', value: _analytics?['activeAgents']?.toString() ?? '-', color: AppColors.accent),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Line chart
                          Text('Tickets Over Time', style: Theme.of(context).textTheme.titleLarge),
                          const SizedBox(height: 12),
                          _TicketsOverTimeChart(analytics: _analytics, days: _days),
                          const SizedBox(height: 24),

                          // Pie chart
                          Text('Tickets by Priority', style: Theme.of(context).textTheme.titleLarge),
                          const SizedBox(height: 12),
                          _PriorityPieChart(analytics: _analytics),
                          const SizedBox(height: 24),

                          // Top agents
                          Text('Top Agents', style: Theme.of(context).textTheme.titleLarge),
                          const SizedBox(height: 12),
                          _TopAgentsTable(analytics: _analytics),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _KpiCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _TicketsOverTimeChart extends StatelessWidget {
  final Map<String, dynamic>? analytics;
  final int days;
  const _TicketsOverTimeChart({required this.analytics, required this.days});

  @override
  Widget build(BuildContext context) {
    final rawData = analytics?['ticketsByDay'] as List?;
    List<FlSpot> spots;

    if (rawData != null && rawData.isNotEmpty) {
      spots = rawData.asMap().entries.map((e) {
        final item = e.value as Map<String, dynamic>;
        return FlSpot(e.key.toDouble(), (item['count'] ?? 0).toDouble());
      }).toList();
    } else {
      spots = List.generate(days > 30 ? 12 : days, (i) => FlSpot(i.toDouble(), 0));
    }

    final maxY = spots.map((s) => s.y).fold(0.0, (a, b) => a > b ? a : b);
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
        child: LineChart(
          LineChartData(
            minY: 0,
            maxY: chartMaxY,
            lineTouchData: const LineTouchData(enabled: true),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              getDrawingHorizontalLine: (_) => FlLine(color: AppColors.border, strokeWidth: 1),
            ),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                color: AppColors.primary,
                barWidth: 2.5,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true,
                  color: AppColors.primary.withOpacity(0.1),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PriorityPieChart extends StatelessWidget {
  final Map<String, dynamic>? analytics;
  const _PriorityPieChart({required this.analytics});

  @override
  Widget build(BuildContext context) {
    final data = [
      _PieData('Critical', (analytics?['criticalTickets'] ?? 0).toDouble(), AppColors.priorityCritical),
      _PieData('High', (analytics?['highTickets'] ?? 0).toDouble(), AppColors.priorityHigh),
      _PieData('Medium', (analytics?['mediumTickets'] ?? 0).toDouble(), AppColors.priorityMedium),
      _PieData('Low', (analytics?['lowTickets'] ?? 0).toDouble(), AppColors.priorityLow),
    ].where((d) => d.value > 0).toList();

    if (data.isEmpty) {
      return Container(
        height: 100,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(child: Text('No priority data available', style: TextStyle(color: AppColors.textSecondary))),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          SizedBox(
            height: 160,
            width: 160,
            child: PieChart(
              PieChartData(
                sections: data.map((d) => PieChartSectionData(
                  value: d.value,
                  color: d.color,
                  radius: 55,
                  title: '',
                )).toList(),
                sectionsSpace: 2,
                centerSpaceRadius: 30,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: data.map((d) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(width: 10, height: 10, decoration: BoxDecoration(color: d.color, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text(d.label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const Spacer(),
                    Text('${d.value.toInt()}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  ],
                ),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _PieData {
  final String label;
  final double value;
  final Color color;
  _PieData(this.label, this.value, this.color);
}

class _TopAgentsTable extends StatelessWidget {
  final Map<String, dynamic>? analytics;
  const _TopAgentsTable({required this.analytics});

  @override
  Widget build(BuildContext context) {
    final agents = (analytics?['topAgents'] as List?) ?? [];

    if (agents.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(child: Text('No agent data available', style: TextStyle(color: AppColors.textSecondary))),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: const Row(
              children: [
                Expanded(child: Text('Agent', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary))),
                SizedBox(width: 70, child: Text('Resolved', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary), textAlign: TextAlign.center)),
                SizedBox(width: 80, child: Text('Avg Time', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary), textAlign: TextAlign.right)),
              ],
            ),
          ),
          ...agents.asMap().entries.map((e) {
            final agent = e.value as Map<String, dynamic>;
            final isLast = e.key == agents.length - 1;
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: AppColors.primary.withOpacity(0.15),
                        child: Text(
                          _initials(agent['name'] ?? agent['fullName'] ?? '?'),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          agent['name'] ?? agent['fullName'] ?? 'Unknown',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                      SizedBox(
                        width: 70,
                        child: Text(
                          '${agent['resolvedCount'] ?? 0}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.statusResolved),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      SizedBox(
                        width: 80,
                        child: Text(
                          agent['avgResponseTime']?.toString() ?? '-',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          textAlign: TextAlign.right,
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isLast) const Divider(height: 1),
              ],
            );
          }),
        ],
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }
}
