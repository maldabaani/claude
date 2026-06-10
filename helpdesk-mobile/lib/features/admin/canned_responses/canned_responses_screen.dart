import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class CannedResponsesScreen extends ConsumerStatefulWidget {
  const CannedResponsesScreen({super.key});
  @override
  ConsumerState<CannedResponsesScreen> createState() => _CannedResponsesScreenState();
}

class _CannedResponsesScreenState extends ConsumerState<CannedResponsesScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  List<dynamic> _filtered = [];

  @override
  void initState() { super.initState(); _load(); _searchCtrl.addListener(_filter); }
  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.cannedResponses);
      final data = resp.data['data'];
      final list = data is List ? data : (data['content'] ?? []);
      if (mounted) setState(() { _items = list; _loading = false; _filter(); });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _filter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() => _filtered = q.isEmpty ? _items : _items.where((i) =>
      (i['title'] ?? '').toLowerCase().contains(q) || (i['content'] ?? '').toLowerCase().contains(q)).toList());
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _CannedDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put('${ApiEndpoints.cannedResponses}/${item['id']}', data: data);
      else await _api.post(ApiEndpoints.cannedResponses, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Canned Response'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete('${ApiEndpoints.cannedResponses}/$id'); await _load(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Canned Responses (${_filtered.length})')),
    floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    body: Column(children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 0), child: TextField(controller: _searchCtrl, decoration: InputDecoration(
        hintText: 'Search...', prefixIcon: const Icon(Icons.search, color: AppColors.textTertiary),
        filled: true, fillColor: AppColors.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)), isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 10)))),
      Expanded(child: _loading ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(onRefresh: _load, child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final d = _filtered[i] as Map<String, dynamic>;
                return Container(padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(d['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
                      if (d['category'] != null) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(4)),
                        child: Text(d['category'], style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.w600))),
                      IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                      IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                    ]),
                    const SizedBox(height: 6),
                    Text(d['content'] ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ]));
              }))),
    ]),
  );
}

class _CannedDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _CannedDialog({this.item, required this.onSave});
  @override
  State<_CannedDialog> createState() => _CannedDialogState();
}

class _CannedDialogState extends State<_CannedDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _titleCtrl.text = widget.item!['title'] ?? '';
      _contentCtrl.text = widget.item!['content'] ?? '';
      _categoryCtrl.text = widget.item!['category'] ?? '';
    }
  }

  @override
  void dispose() { _titleCtrl.dispose(); _contentCtrl.dispose(); _categoryCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'title': _titleCtrl.text.trim(), 'content': _contentCtrl.text.trim(), 'category': _categoryCtrl.text.trim().isEmpty ? null : _categoryCtrl.text.trim()});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit Canned Response' : 'New Canned Response'),
    content: SingleChildScrollView(child: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      TextFormField(controller: _categoryCtrl, decoration: const InputDecoration(labelText: 'Category (optional)')),
      const SizedBox(height: 12),
      TextFormField(controller: _contentCtrl, decoration: const InputDecoration(labelText: 'Content'), maxLines: 5, validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
    ]))),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
