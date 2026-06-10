import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class SavedViewsScreen extends ConsumerStatefulWidget {
  const SavedViewsScreen({super.key});
  @override
  ConsumerState<SavedViewsScreen> createState() => _SavedViewsScreenState();
}

class _SavedViewsScreenState extends ConsumerState<SavedViewsScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.savedViews);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _SavedViewDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put(ApiEndpoints.savedView(item['id'].toString()), data: data);
      else await _api.post(ApiEndpoints.savedViews, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Saved View'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete(ApiEndpoints.savedView(id)); await _load(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Saved Views (${_items.length})')),
    floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    body: _loading ? const Center(child: CircularProgressIndicator())
        : _items.isEmpty ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.bookmark_border_outlined, size: 48, color: AppColors.textTertiary),
            SizedBox(height: 8),
            Text('No saved views', style: TextStyle(color: AppColors.textSecondary)),
          ]))
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final d = _items[i] as Map<String, dynamic>;
              final isDefault = d['isDefault'] ?? false;
              return Container(padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  Icon(isDefault ? Icons.bookmark : Icons.bookmark_border_outlined, color: isDefault ? AppColors.primary : AppColors.textSecondary),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    Text('${(d['filters'] as Map?)?.length ?? 0} filters', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ])),
                  if (isDefault) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(4)),
                    child: const Text('Default', style: TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.w600))),
                  IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                  IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                ]));
            })),
  );
}

class _SavedViewDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _SavedViewDialog({this.item, required this.onSave});
  @override
  State<_SavedViewDialog> createState() => _SavedViewDialogState();
}

class _SavedViewDialogState extends State<_SavedViewDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  bool _isDefault = false;
  String _statusFilter = '';
  String _priorityFilter = '';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameCtrl.text = widget.item!['name'] ?? '';
      _isDefault = widget.item!['isDefault'] ?? false;
      final filters = widget.item!['filters'] as Map? ?? {};
      _statusFilter = filters['status'] ?? '';
      _priorityFilter = filters['priority'] ?? '';
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final filters = <String, dynamic>{};
    if (_statusFilter.isNotEmpty) filters['status'] = _statusFilter;
    if (_priorityFilter.isNotEmpty) filters['priority'] = _priorityFilter;
    try {
      await widget.onSave({'name': _nameCtrl.text.trim(), 'filters': filters, 'isDefault': _isDefault});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit View' : 'New Saved View'),
    content: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'View Name'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(value: _statusFilter.isEmpty ? '' : _statusFilter, decoration: const InputDecoration(labelText: 'Status Filter'),
        items: ['', 'NEW', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map((s) => DropdownMenuItem(value: s, child: Text(s.isEmpty ? 'Any' : s))).toList(),
        onChanged: (v) => setState(() => _statusFilter = v ?? '')),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(value: _priorityFilter.isEmpty ? '' : _priorityFilter, decoration: const InputDecoration(labelText: 'Priority Filter'),
        items: ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => DropdownMenuItem(value: p, child: Text(p.isEmpty ? 'Any' : p))).toList(),
        onChanged: (v) => setState(() => _priorityFilter = v ?? '')),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Set as Default'), Switch(value: _isDefault, onChanged: (v) => setState(() => _isDefault = v)),
      ]),
    ])),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
