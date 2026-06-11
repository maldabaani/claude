import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

const _actionColors = {
  'SET_STATUS':   Color(0xFF4338CA),
  'ASSIGN_TO':    Color(0xFF16A34A),
  'ADD_TAG':      Color(0xFFC2410C),
  'ADD_COMMENT':  Color(0xFF0369A1),
  'SET_PRIORITY': Color(0xFF9333EA),
};

const _actionBg = {
  'SET_STATUS':   Color(0xFFEEF2FF),
  'ASSIGN_TO':    Color(0xFFF0FDF4),
  'ADD_TAG':      Color(0xFFFFF7ED),
  'ADD_COMMENT':  Color(0xFFF0F9FF),
  'SET_PRIORITY': Color(0xFFFDF4FF),
};

class MacrosScreen extends ConsumerStatefulWidget {
  const MacrosScreen({super.key});
  @override
  ConsumerState<MacrosScreen> createState() => _MacrosScreenState();
}

class _MacrosScreenState extends ConsumerState<MacrosScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.macros);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : []; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  List<dynamic> _parseActions(dynamic raw) {
    if (raw is List) return raw;
    if (raw is String) {
      try { return jsonDecode(raw) as List; } catch (_) { return []; }
    }
    return [];
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _MacroDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put('${ApiEndpoints.macros}/${item['id']}', data: data);
      else await _api.post(ApiEndpoints.macros, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Macro'), content: const Text('Are you sure?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true),
          child: const Text('Delete', style: TextStyle(color: Colors.white))),
      ],
    ));
    if (ok == true) { await _api.delete('${ApiEndpoints.macros}/$id'); await _load(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Macros (${_items.length})')),
    floatingActionButton: FloatingActionButton(
      onPressed: _showForm,
      backgroundColor: AppColors.primary,
      child: const Icon(Icons.add, color: Colors.white)),
    body: _loading ? const Center(child: CircularProgressIndicator())
      : RefreshIndicator(onRefresh: _load, child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) {
            final d = _items[i] as Map<String, dynamic>;
            final actions = _parseActions(d['actions']);
            final active = d['active'] ?? true;
            return Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.surface,
                borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  CircleAvatar(radius: 18,
                    backgroundColor: active ? const Color(0xFFEEF2FF) : AppColors.errorBg,
                    child: Icon(Icons.flash_on_outlined, size: 16,
                      color: active ? AppColors.primary : AppColors.error)),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['name'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
                    if ((d['description'] ?? '').isNotEmpty)
                      Text(d['description'], style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  ])),
                  IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary),
                    onPressed: () => _showForm(d)),
                  IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error),
                    onPressed: () => _delete(d['id'].toString())),
                ]),
                if (actions.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 4, runSpacing: 4, children: actions.map((a) {
                    final type = (a['type'] as String?) ?? '';
                    final value = (a['value'] as String?) ?? '';
                    final bg = _actionBg[type] ?? const Color(0xFFF3F4F6);
                    final fg = _actionColors[type] ?? const Color(0xFF374151);
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
                      child: Text('$type: $value', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg)));
                  }).toList()),
                ],
              ]),
            );
          })),
  );
}

class _MacroDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _MacroDialog({this.item, required this.onSave});
  @override
  State<_MacroDialog> createState() => _MacroDialogState();
}

class _MacroDialogState extends State<_MacroDialog> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  List<Map<String, String>> _actions = [];
  bool _saving = false;

  static const _actionTypes = ['SET_STATUS', 'ASSIGN_TO', 'ADD_TAG', 'ADD_COMMENT', 'SET_PRIORITY'];

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameCtrl.text = widget.item!['name'] ?? '';
      _descCtrl.text = widget.item!['description'] ?? '';
      final raw = widget.item!['actions'];
      List<dynamic> parsed = [];
      if (raw is List) parsed = raw;
      else if (raw is String) { try { parsed = jsonDecode(raw); } catch (_) {} }
      _actions = parsed.map((a) => {'type': (a['type'] as String?) ?? 'SET_STATUS', 'value': (a['value'] as String?) ?? ''}).toList();
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _descCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'actions': jsonEncode(_actions),
      });
      if (mounted) Navigator.pop(context);
    } finally { if (mounted) setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit Macro' : 'New Macro'),
    content: SizedBox(width: 360, child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name *', border: OutlineInputBorder())),
      const SizedBox(height: 12),
      TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()), maxLines: 2),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Actions', style: TextStyle(fontWeight: FontWeight.w600)),
        TextButton.icon(icon: const Icon(Icons.add, size: 16), label: const Text('Add'),
          onPressed: () => setState(() => _actions.add({'type': 'SET_STATUS', 'value': ''}))),
      ]),
      ..._actions.asMap().entries.map((e) {
        final idx = e.key;
        final a = e.value;
        return Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [
          Expanded(child: DropdownButtonFormField<String>(
            value: a['type'],
            decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
            items: _actionTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 11)))).toList(),
            onChanged: (v) => setState(() => _actions[idx]['type'] = v!),
          )),
          const SizedBox(width: 6),
          Expanded(child: TextField(
            controller: TextEditingController(text: a['value'])..selection = TextSelection.collapsed(offset: a['value']!.length),
            decoration: const InputDecoration(hintText: 'Value', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
            onChanged: (v) => _actions[idx]['value'] = v,
          )),
          IconButton(icon: const Icon(Icons.close, size: 16, color: Colors.red), onPressed: () => setState(() => _actions.removeAt(idx))),
        ]));
      }),
    ]))),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save')),
    ],
  );
}
