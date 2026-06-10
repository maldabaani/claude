import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class AdminTicketsScreen extends ConsumerStatefulWidget {
  const AdminTicketsScreen({super.key});
  @override
  ConsumerState<AdminTicketsScreen> createState() => _AdminTicketsScreenState();
}

class _AdminTicketsScreenState extends ConsumerState<AdminTicketsScreen> {
  final _api = ApiClient();
  List<dynamic> _tickets = [];
  List<dynamic> _filtered = [];
  bool _loading = true;
  String _statusFilter = 'ALL';
  String _priorityFilter = 'ALL';
  final _searchCtrl = TextEditingController();
  final Set<String> _selected = {};
  bool _bulkMode = false;

  static const _statuses = ['ALL', 'NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
  static const _priorities = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  @override
  void initState() { super.initState(); _load(); _searchCtrl.addListener(_filter); }
  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.tickets, queryParams: {'size': '200'});
      final data = resp.data['data'];
      final list = data is List ? data : (data['content'] ?? []);
      if (mounted) setState(() { _tickets = list; _loading = false; _filter(); });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _filter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() => _filtered = _tickets.where((t) {
      if (_statusFilter != 'ALL' && t['status'] != _statusFilter) return false;
      if (_priorityFilter != 'ALL' && t['priority'] != _priorityFilter) return false;
      if (q.isEmpty) return true;
      return (t['subject'] ?? '').toLowerCase().contains(q) || (t['id']?.toString() ?? '').contains(q);
    }).toList());
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'NEW': return AppColors.statusNew; case 'OPEN': return AppColors.statusOpen;
      case 'PENDING': return AppColors.statusPending; case 'ON_HOLD': return AppColors.statusOnHold;
      case 'RESOLVED': return AppColors.statusResolved; case 'CLOSED': return AppColors.statusClosed;
      default: return AppColors.textSecondary;
    }
  }

  Color _priorityColor(String p) {
    switch (p) { case 'CRITICAL': return AppColors.priorityCritical; case 'HIGH': return AppColors.priorityHigh;
      case 'MEDIUM': return AppColors.priorityMedium; default: return AppColors.priorityLow; }
  }

  Future<void> _bulkAction(String action) async {
    if (_selected.isEmpty) return;
    try {
      await _api.post(ApiEndpoints.ticketsBulk, data: {'ids': _selected.toList(), 'action': action});
      setState(() { _selected.clear(); _bulkMode = false; });
      await _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(
      backgroundColor: AppColors.surface, elevation: 0,
      title: _bulkMode ? Text('${_selected.length} selected') : Text('Tickets (${_filtered.length})'),
      actions: [
        if (_bulkMode) ...[
          TextButton(onPressed: () => _bulkAction('CLOSE'), child: const Text('Close')),
          TextButton(onPressed: () => _bulkAction('RESOLVE'), child: const Text('Resolve')),
          IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() { _selected.clear(); _bulkMode = false; })),
        ] else
          IconButton(icon: const Icon(Icons.checklist_outlined), tooltip: 'Bulk select', onPressed: () => setState(() => _bulkMode = true)),
      ],
    ),
    body: Column(children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 0), child: TextField(controller: _searchCtrl, decoration: InputDecoration(
        hintText: 'Search tickets...', prefixIcon: const Icon(Icons.search, color: AppColors.textTertiary),
        filled: true, fillColor: AppColors.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)), isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 10)))),
      SizedBox(height: 44, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        children: _statuses.map((s) {
          final sel = _statusFilter == s;
          return Padding(padding: const EdgeInsets.only(right: 8), child: FilterChip(
            label: Text(s == 'ALL' ? 'All' : s, style: TextStyle(fontSize: 11, color: sel ? Colors.white : AppColors.textSecondary)),
            selected: sel, selectedColor: AppColors.primary, backgroundColor: AppColors.surface, side: BorderSide(color: sel ? AppColors.primary : AppColors.border), showCheckmark: false,
            onSelected: (_) { setState(() => _statusFilter = s); _filter(); }));
        }).toList())),
      Expanded(child: _loading ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(onRefresh: _load, child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 80), itemCount: _filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final t = _filtered[i] as Map<String, dynamic>;
                final id = t['id'].toString();
                final status = t['status'] ?? 'NEW';
                final priority = t['priority'] ?? 'LOW';
                final isSelected = _selected.contains(id);

                return InkWell(
                  onTap: () {
                    if (_bulkMode) {
                      setState(() { if (isSelected) _selected.remove(id); else _selected.add(id); });
                    } else {
                      context.push('/agent/tickets/$id');
                    }
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primaryLight : AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
                    ),
                    child: Row(children: [
                      if (_bulkMode) Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Checkbox(value: isSelected, onChanged: (v) => setState(() { if (v == true) _selected.add(id); else _selected.remove(id); })),
                      ),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(t['subject'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: _statusColor(status).withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                            child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _statusColor(status))),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: _priorityColor(priority).withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                            child: Text(priority, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _priorityColor(priority))),
                          ),
                          const SizedBox(width: 6),
                          Text('#$id', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                        ]),
                      ])),
                    ]),
                  ),
                );
              }))),
    ]),
  );
}
