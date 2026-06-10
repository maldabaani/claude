import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class MyTicketsScreen extends ConsumerStatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  ConsumerState<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends ConsumerState<MyTicketsScreen> {
  final _api = ApiClient();
  List<dynamic> _tickets = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = 'ALL';

  static const _statusOptions = ['ALL', 'NEW', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final params = <String, dynamic>{'sortBy': 'createdAt', 'sortDir': 'desc'};
      if (_statusFilter != 'ALL') params['status'] = _statusFilter;
      final resp = await _api.get(ApiEndpoints.tickets, queryParams: params);
      final data = resp.data['data'];
      if (mounted) setState(() { _tickets = data['content'] ?? data ?? []; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'NEW': return AppColors.statusNew;
      case 'OPEN': return AppColors.statusOpen;
      case 'PENDING': return AppColors.statusPending;
      case 'ON_HOLD': return AppColors.statusOnHold;
      case 'RESOLVED': return AppColors.statusResolved;
      case 'CLOSED': return AppColors.statusClosed;
      default: return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tickets'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => context.go('/customer/submit')),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _statusOptions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final s = _statusOptions[i];
                final selected = s == _statusFilter;
                return FilterChip(
                  label: Text(s),
                  selected: selected,
                  onSelected: (_) { setState(() => _statusFilter = s); _load(); },
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text('Error: $_error'))
                    : _tickets.isEmpty
                        ? const Center(child: Text('No tickets found.'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _tickets.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (_, i) {
                                final t = _tickets[i];
                                return InkWell(
                                  onTap: () => context.go('/customer/tickets/${t['id']}'),
                                  borderRadius: BorderRadius.circular(16),
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
                                        Row(
                                          children: [
                                            Text('#${t['id']}', style: Theme.of(context).textTheme.labelMedium),
                                            const Spacer(),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: _statusColor(t['status'] ?? '').withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Text(
                                                t['status'] ?? '',
                                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor(t['status'] ?? '')),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(t['subject'] ?? '', style: Theme.of(context).textTheme.titleMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                                        if (t['departmentName'] != null) ...[
                                          const SizedBox(height: 4),
                                          Text(t['departmentName'], style: Theme.of(context).textTheme.bodySmall),
                                        ],
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
