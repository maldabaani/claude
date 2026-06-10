import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class AuditLogScreen extends ConsumerStatefulWidget {
  const AuditLogScreen({super.key});
  @override
  ConsumerState<AuditLogScreen> createState() => _AuditLogScreenState();
}

class _AuditLogScreenState extends ConsumerState<AuditLogScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  List<dynamic> _filtered = [];
  String? _entityTypeFilter;

  @override
  void initState() { super.initState(); _load(); _searchCtrl.addListener(_filter); }
  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.auditLog, queryParams: {'size': '100'});
      final data = resp.data['data'];
      final list = data is List ? data : (data['content'] ?? []);
      if (mounted) setState(() { _items = list; _loading = false; _filter(); });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _filter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() => _filtered = _items.where((i) {
      if (_entityTypeFilter != null && _entityTypeFilter!.isNotEmpty && i['entityType'] != _entityTypeFilter) return false;
      if (q.isEmpty) return true;
      return (i['action'] ?? '').toLowerCase().contains(q) || (i['performedBy'] ?? '').toLowerCase().contains(q) || (i['entityType'] ?? '').toLowerCase().contains(q);
    }).toList());
  }

  Color _actionColor(String action) {
    if (action.contains('DELETE') || action.contains('REMOVE')) return AppColors.error;
    if (action.contains('CREATE') || action.contains('ADD')) return AppColors.success;
    if (action.contains('UPDATE') || action.contains('CHANGE')) return AppColors.warning;
    return AppColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    final entityTypes = _items.map((i) => i['entityType']?.toString() ?? '').where((e) => e.isNotEmpty).toSet().toList();
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Audit Log (${_filtered.length})')),
      body: Column(children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 0), child: TextField(controller: _searchCtrl, decoration: InputDecoration(
          hintText: 'Search logs...', prefixIcon: const Icon(Icons.search, color: AppColors.textTertiary),
          filled: true, fillColor: AppColors.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)), isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 10)))),
        if (entityTypes.isNotEmpty) SizedBox(height: 44, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          children: [null, ...entityTypes].map((t) {
            final selected = _entityTypeFilter == t;
            return Padding(padding: const EdgeInsets.only(right: 8), child: FilterChip(
              label: Text(t ?? 'All', style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textSecondary)),
              selected: selected, selectedColor: AppColors.primary, backgroundColor: AppColors.surface, side: BorderSide(color: selected ? AppColors.primary : AppColors.border), showCheckmark: false,
              onSelected: (_) { setState(() { _entityTypeFilter = selected ? null : t; _filter(); }); }));
          }).toList())),
        Expanded(child: _loading ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(onRefresh: _load, child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 80), itemCount: _filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 6),
                itemBuilder: (_, i) {
                  final d = _filtered[i] as Map<String, dynamic>;
                  final action = d['action'] ?? '';
                  return Container(padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                    child: Row(children: [
                      Container(width: 6, height: 40, decoration: BoxDecoration(color: _actionColor(action), borderRadius: BorderRadius.circular(3))),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(action, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _actionColor(action))),
                        Row(children: [
                          if (d['entityType'] != null) Text('${d['entityType']} ', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          if (d['performedBy'] != null) Text('by ${d['performedBy']}', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                        ]),
                        if (d['createdAt'] != null) Text(d['createdAt'].toString().substring(0, 16), style: const TextStyle(fontSize: 10, color: AppColors.textTertiary)),
                      ])),
                    ]));
                }))),
      ]),
    );
  }
}
