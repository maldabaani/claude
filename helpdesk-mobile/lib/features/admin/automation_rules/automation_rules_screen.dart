import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class AutomationRulesScreen extends ConsumerStatefulWidget {
  const AutomationRulesScreen({super.key});
  @override
  ConsumerState<AutomationRulesScreen> createState() => _AutomationRulesScreenState();
}

class _AutomationRulesScreenState extends ConsumerState<AutomationRulesScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.automationRules);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _AutomationRuleSheet(item: item, onSave: (data) async {
        if (item != null) await _api.put(ApiEndpoints.automationRule(item['id'].toString()), data: data);
        else await _api.post(ApiEndpoints.automationRules, data: data);
        await _load();
      }),
    );
  }

  Future<void> _toggleActive(Map<String, dynamic> item) async {
    final updated = Map<String, dynamic>.from(item);
    updated['active'] = !(item['active'] as bool? ?? true);
    try {
      await _api.put(ApiEndpoints.automationRule(item['id'].toString()), data: updated);
      await _load();
    } catch (_) {}
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Automation Rule'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete(ApiEndpoints.automationRule(id)); await _load(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Automation Rules (${_items.length})')),
    floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    body: _loading ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final d = _items[i] as Map<String, dynamic>;
              final active = d['active'] as bool? ?? true;
              return Container(padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  Icon(Icons.auto_awesome_outlined, color: active ? AppColors.primary : AppColors.textSecondary),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    if (d['triggerType'] != null) Text('Trigger: ${d['triggerType']}${d['triggerEvent'] != null ? ' · ${d['triggerEvent']}' : ''}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  ])),
                  Switch(value: active, onChanged: (_) => _toggleActive(d), activeColor: AppColors.primary),
                  IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                  IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                ]));
            })),
  );
}

class _AutomationRuleSheet extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _AutomationRuleSheet({this.item, required this.onSave});
  @override
  State<_AutomationRuleSheet> createState() => _AutomationRuleSheetState();
}

class _AutomationRuleSheetState extends State<_AutomationRuleSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _triggerEventCtrl = TextEditingController();
  final _triggerHoursCtrl = TextEditingController();
  String _triggerType = 'EVENT';
  bool _active = true;
  int _runOrder = 0;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameCtrl.text = widget.item!['name'] ?? '';
      _triggerType = widget.item!['triggerType'] ?? 'EVENT';
      _triggerEventCtrl.text = widget.item!['triggerEvent'] ?? '';
      _triggerHoursCtrl.text = (widget.item!['triggerHours'] ?? '').toString();
      _active = widget.item!['active'] as bool? ?? true;
      _runOrder = widget.item!['runOrder'] as int? ?? 0;
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _triggerEventCtrl.dispose(); _triggerHoursCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({
        'name': _nameCtrl.text.trim(),
        'triggerType': _triggerType,
        'triggerEvent': _triggerEventCtrl.text.trim().isEmpty ? null : _triggerEventCtrl.text.trim(),
        'triggerHours': _triggerHoursCtrl.text.isEmpty ? null : int.tryParse(_triggerHoursCtrl.text),
        'active': _active,
        'runOrder': _runOrder,
        'conditions': '[]',
        'actions': '[]',
      });
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
    child: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(widget.item != null ? 'Edit Automation Rule' : 'New Automation Rule',
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      const SizedBox(height: 20),
      TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Rule Name'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(value: _triggerType, decoration: const InputDecoration(labelText: 'Trigger Type'),
        items: ['EVENT', 'TIME', 'SCHEDULE'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
        onChanged: (v) { if (v != null) setState(() => _triggerType = v); }),
      const SizedBox(height: 12),
      TextFormField(controller: _triggerEventCtrl, decoration: const InputDecoration(labelText: 'Trigger Event (optional)')),
      const SizedBox(height: 12),
      TextFormField(controller: _triggerHoursCtrl, decoration: const InputDecoration(labelText: 'Trigger Hours (optional)'), keyboardType: TextInputType.number),
      const SizedBox(height: 12),
      Row(children: [
        const Text('Active', style: TextStyle(color: AppColors.textPrimary)),
        const Spacer(),
        Switch(value: _active, onChanged: (v) => setState(() => _active = v), activeColor: AppColors.primary),
      ]),
      const SizedBox(height: 20),
      SizedBox(width: double.infinity, child: ElevatedButton(
        onPressed: _saving ? null : _save,
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save Rule'),
      )),
    ])),
  );
}
