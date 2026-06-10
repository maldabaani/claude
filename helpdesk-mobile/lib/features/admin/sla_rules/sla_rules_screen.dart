import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class SlaRulesScreen extends ConsumerStatefulWidget {
  const SlaRulesScreen({super.key});
  @override
  ConsumerState<SlaRulesScreen> createState() => _SlaRulesScreenState();
}

class _SlaRulesScreenState extends ConsumerState<SlaRulesScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.slaEscalations);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _SlaRuleDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put('${ApiEndpoints.slaEscalations}/${item['id']}', data: data);
      else await _api.post(ApiEndpoints.slaEscalations, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete SLA Rule'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete('${ApiEndpoints.slaEscalations}/$id'); await _load(); }
  }

  Color _priorityColor(String p) {
    switch (p) { case 'CRITICAL': return AppColors.priorityCritical; case 'HIGH': return AppColors.priorityHigh;
      case 'MEDIUM': return AppColors.priorityMedium; default: return AppColors.priorityLow; }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('SLA Rules (${_items.length})')),
    floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    body: _loading ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final d = _items[i] as Map<String, dynamic>;
              final priority = d['priority'] ?? 'LOW';
              return Container(padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  const Icon(Icons.rule_outlined, color: AppColors.primary),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    if (d['condition'] != null) Text('If: ${d['condition']}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    if (d['action'] != null) Text('Then: ${d['action']}', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                  ])),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: _priorityColor(priority).withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                    child: Text(priority, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _priorityColor(priority)))),
                  IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                  IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                ]));
            })),
  );
}

class _SlaRuleDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _SlaRuleDialog({this.item, required this.onSave});
  @override
  State<_SlaRuleDialog> createState() => _SlaRuleDialogState();
}

class _SlaRuleDialogState extends State<_SlaRuleDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _conditionCtrl = TextEditingController();
  final _actionCtrl = TextEditingController();
  String _priority = 'MEDIUM';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameCtrl.text = widget.item!['name'] ?? ''; _conditionCtrl.text = widget.item!['condition'] ?? '';
      _actionCtrl.text = widget.item!['action'] ?? ''; _priority = widget.item!['priority'] ?? 'MEDIUM';
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _conditionCtrl.dispose(); _actionCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'name': _nameCtrl.text.trim(), 'condition': _conditionCtrl.text.trim(), 'action': _actionCtrl.text.trim(), 'priority': _priority});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit SLA Rule' : 'New SLA Rule'),
    content: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Rule Name'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      TextFormField(controller: _conditionCtrl, decoration: const InputDecoration(labelText: 'Condition'), maxLines: 2),
      const SizedBox(height: 12),
      TextFormField(controller: _actionCtrl, decoration: const InputDecoration(labelText: 'Action'), maxLines: 2),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(value: _priority, decoration: const InputDecoration(labelText: 'Priority'),
        items: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
        onChanged: (v) { if (v != null) setState(() => _priority = v); }),
    ])),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
