import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class EmailInboxesScreen extends ConsumerStatefulWidget {
  const EmailInboxesScreen({super.key});
  @override
  ConsumerState<EmailInboxesScreen> createState() => _EmailInboxesScreenState();
}

class _EmailInboxesScreenState extends ConsumerState<EmailInboxesScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.emailInboxes);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _InboxDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put('${ApiEndpoints.emailInboxes}/${item['id']}', data: data);
      else await _api.post(ApiEndpoints.emailInboxes, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Email Inbox'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete('${ApiEndpoints.emailInboxes}/$id'); await _load(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Email Inboxes (${_items.length})')),
    floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    body: _loading ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final d = _items[i] as Map<String, dynamic>;
              final active = d['active'] ?? true;
              return Container(padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  CircleAvatar(radius: 20, backgroundColor: active ? AppColors.primaryLight : AppColors.errorBg,
                    child: Icon(Icons.email_outlined, size: 18, color: active ? AppColors.primary : AppColors.error)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    Text(d['email'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    if (d['protocol'] != null) Text('${d['protocol']} • ${d['host'] ?? ''} : ${d['port'] ?? ''}', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                  ])),
                  IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                  IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                ]));
            })),
  );
}

class _InboxDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _InboxDialog({this.item, required this.onSave});
  @override
  State<_InboxDialog> createState() => _InboxDialogState();
}

class _InboxDialogState extends State<_InboxDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _hostCtrl = TextEditingController();
  final _portCtrl = TextEditingController(text: '993');
  String _protocol = 'IMAP';
  bool _active = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _nameCtrl.text = widget.item!['name'] ?? ''; _emailCtrl.text = widget.item!['email'] ?? '';
      _hostCtrl.text = widget.item!['host'] ?? ''; _portCtrl.text = (widget.item!['port'] ?? 993).toString();
      _protocol = widget.item!['protocol'] ?? 'IMAP'; _active = widget.item!['active'] ?? true;
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _hostCtrl.dispose(); _portCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'name': _nameCtrl.text.trim(), 'email': _emailCtrl.text.trim(),
        'host': _hostCtrl.text.trim(), 'port': int.tryParse(_portCtrl.text) ?? 993,
        'protocol': _protocol, 'active': _active});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit Email Inbox' : 'New Email Inbox'),
    content: SingleChildScrollView(child: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Inbox Name'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      TextFormField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email Address'), keyboardType: TextInputType.emailAddress, validator: (v) => (v == null || !v.contains('@')) ? 'Valid email required' : null),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(value: _protocol, decoration: const InputDecoration(labelText: 'Protocol'),
        items: ['IMAP', 'POP3', 'SMTP'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
        onChanged: (v) { if (v != null) setState(() => _protocol = v); }),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: TextFormField(controller: _hostCtrl, decoration: const InputDecoration(labelText: 'Host'))),
        const SizedBox(width: 12),
        SizedBox(width: 80, child: TextFormField(controller: _portCtrl, decoration: const InputDecoration(labelText: 'Port'), keyboardType: TextInputType.number)),
      ]),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Active'), Switch(value: _active, onChanged: (v) => setState(() => _active = v)),
      ]),
    ]))),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
