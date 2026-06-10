import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class DepartmentsScreen extends ConsumerStatefulWidget {
  const DepartmentsScreen({super.key});
  @override
  ConsumerState<DepartmentsScreen> createState() => _DepartmentsScreenState();
}

class _DepartmentsScreenState extends ConsumerState<DepartmentsScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.departments);
      final data = resp.data['data'];
      final list = data is List ? data : (data['content'] ?? []);
      if (mounted) setState(() { _items = list; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _DeptDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put(ApiEndpoints.department(item['id'].toString()), data: data);
      else await _api.post(ApiEndpoints.departments, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Department'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete(ApiEndpoints.department(id)); await _load(); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Departments (${_items.length})')),
      floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
      body: _loading ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(onRefresh: _load, child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
              itemCount: _items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final d = _items[i] as Map<String, dynamic>;
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                  child: Row(children: [
                    const CircleAvatar(radius: 20, backgroundColor: AppColors.primaryLight, child: Icon(Icons.business_outlined, color: AppColors.primary, size: 20)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      if (d['description'] != null) Text(d['description'], style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ])),
                    IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                    IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                  ]),
                );
              })),
    );
  }
}

class _DeptDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _DeptDialog({this.item, required this.onSave});
  @override
  State<_DeptDialog> createState() => _DeptDialogState();
}

class _DeptDialogState extends State<_DeptDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameCtrl.text = widget.item!['name'] ?? '';
      _descCtrl.text = widget.item!['description'] ?? '';
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _descCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'name': _nameCtrl.text.trim(), 'description': _descCtrl.text.trim()});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit Department' : 'New Department'),
    content: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      TextFormField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
    ])),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
