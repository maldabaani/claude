import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class SlaPoliciesScreen extends ConsumerStatefulWidget {
  const SlaPoliciesScreen({super.key});
  @override
  ConsumerState<SlaPoliciesScreen> createState() => _SlaPoliciesScreenState();
}

class _SlaPoliciesScreenState extends ConsumerState<SlaPoliciesScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.slaPolicies);
      final data = resp.data['data'];
      final list = data is List ? data : (data['content'] ?? []);
      if (mounted) setState(() { _items = list; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _SlaDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put('${ApiEndpoints.slaPolicies}/${item['id']}', data: data);
      else await _api.post(ApiEndpoints.slaPolicies, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete SLA Policy'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete('${ApiEndpoints.slaPolicies}/$id'); await _load(); }
  }

  Color _priorityColor(String p) {
    switch (p) { case 'CRITICAL': return AppColors.priorityCritical; case 'HIGH': return AppColors.priorityHigh;
      case 'MEDIUM': return AppColors.priorityMedium; default: return AppColors.priorityLow; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('SLA Policies (${_items.length})')),
      floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
      body: _loading ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(onRefresh: _load, child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
              itemCount: _items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final d = _items[i] as Map<String, dynamic>;
                final priority = d['priority'] ?? 'LOW';
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
                      Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: _priorityColor(priority).withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                        child: Text(priority, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _priorityColor(priority)))),
                      IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                      IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                    ]),
                    const SizedBox(height: 8),
                    Row(children: [
                      _chip(Icons.reply_outlined, 'Response: ${d['responseTimeHours'] ?? 0}h'),
                      const SizedBox(width: 8),
                      _chip(Icons.check_circle_outline, 'Resolution: ${d['resolutionTimeHours'] ?? 0}h'),
                    ]),
                  ]),
                );
              })),
    );
  }

  Widget _chip(IconData icon, String label) => Row(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, size: 14, color: AppColors.textSecondary), const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
  ]);
}

class _SlaDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _SlaDialog({this.item, required this.onSave});
  @override
  State<_SlaDialog> createState() => _SlaDialogState();
}

class _SlaDialogState extends State<_SlaDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _responseCtrl = TextEditingController(text: '4');
  final _resolutionCtrl = TextEditingController(text: '24');
  String _priority = 'MEDIUM';
  bool _saving = false;
  static const _priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameCtrl.text = widget.item!['name'] ?? '';
      _descCtrl.text = widget.item!['description'] ?? '';
      _responseCtrl.text = (widget.item!['responseTimeHours'] ?? 4).toString();
      _resolutionCtrl.text = (widget.item!['resolutionTimeHours'] ?? 24).toString();
      _priority = widget.item!['priority'] ?? 'MEDIUM';
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _descCtrl.dispose(); _responseCtrl.dispose(); _resolutionCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'name': _nameCtrl.text.trim(), 'description': _descCtrl.text.trim(),
        'responseTimeHours': int.tryParse(_responseCtrl.text) ?? 4,
        'resolutionTimeHours': int.tryParse(_resolutionCtrl.text) ?? 24, 'priority': _priority});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit SLA Policy' : 'New SLA Policy'),
    content: SingleChildScrollView(child: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      TextFormField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: TextFormField(controller: _responseCtrl, decoration: const InputDecoration(labelText: 'Response (hours)'), keyboardType: TextInputType.number)),
        const SizedBox(width: 12),
        Expanded(child: TextFormField(controller: _resolutionCtrl, decoration: const InputDecoration(labelText: 'Resolution (hours)'), keyboardType: TextInputType.number)),
      ]),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(value: _priority, decoration: const InputDecoration(labelText: 'Priority'),
        items: _priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
        onChanged: (v) { if (v != null) setState(() => _priority = v); }),
    ]))),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
