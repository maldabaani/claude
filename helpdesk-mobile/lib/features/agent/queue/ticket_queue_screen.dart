import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class TicketQueueScreen extends ConsumerStatefulWidget {
  const TicketQueueScreen({super.key});

  @override
  ConsumerState<TicketQueueScreen> createState() => _TicketQueueScreenState();
}

class _TicketQueueScreenState extends ConsumerState<TicketQueueScreen> {
  final _api = ApiClient();
  List<dynamic> _tickets = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = 'OPEN';
  String _priorityFilter = 'ALL';

  static const _statusOptions = ['ALL', 'NEW', 'OPEN', 'PENDING', 'ON_HOLD'];
  static const _priorityOptions = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final params = <String, dynamic>{'sortBy': 'priority', 'sortDir': 'asc'};
      if (_statusFilter != 'ALL') params['status'] = _statusFilter;
      if (_priorityFilter != 'ALL') params['priority'] = _priorityFilter;
      final resp = await _api.get(ApiEndpoints.tickets, queryParams: params);
      final data = resp.data['data'];
      if (mounted) setState(() { _tickets = data['content'] ?? data ?? []; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _priorityColor(String? priority) {
    switch ((priority ?? '').toUpperCase()) {
      case 'CRITICAL': return AppColors.priorityCritical;
      case 'HIGH': return AppColors.priorityHigh;
      case 'MEDIUM': return AppColors.priorityMedium;
      case 'LOW': return AppColors.priorityLow;
      default: return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ticket Queue')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _statusFilter,
                    decoration: const InputDecoration(labelText: 'Status', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    items: _statusOptions.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
                    onChanged: (v) { if (v != null) { setState(() => _statusFilter = v); _load(); } },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _priorityFilter,
                    decoration: const InputDecoration(labelText: 'Priority', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    items: _priorityOptions.map((p) => DropdownMenuItem(value: p, child: Text(p, style: const TextStyle(fontSize: 13)))).toList(),
                    onChanged: (v) { if (v != null) { setState(() => _priorityFilter = v); _load(); } },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text('Error: $_error'))
                    : _tickets.isEmpty
                        ? const Center(child: Text('No tickets in queue.'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _tickets.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (_, i) {
                                final t = _tickets[i];
                                final priorityColor = _priorityColor(t['priority']);
                                return InkWell(
                                  onTap: () => context.go('/agent/tickets/${t['id']}'),
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: AppColors.border),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          width: 4,
                                          height: 60,
                                          decoration: BoxDecoration(
                                            color: priorityColor,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text('#${t['id']}', style: Theme.of(context).textTheme.labelMedium),
                                                  const Spacer(),
                                                  Text(t['status'] ?? '', style: Theme.of(context).textTheme.labelSmall),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(t['subject'] ?? '', style: Theme.of(context).textTheme.titleSmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  Icon(Icons.circle, size: 8, color: priorityColor),
                                                  const SizedBox(width: 4),
                                                  Text(t['priority'] ?? '', style: TextStyle(fontSize: 11, color: priorityColor, fontWeight: FontWeight.w600)),
                                                  if (t['assigneeName'] != null) ...[
                                                    const SizedBox(width: 8),
                                                    const Icon(Icons.person, size: 12, color: AppColors.textTertiary),
                                                    const SizedBox(width: 2),
                                                    Text(t['assigneeName'], style: Theme.of(context).textTheme.labelSmall),
                                                  ],
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        const Icon(Icons.chevron_right, color: AppColors.textTertiary),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
