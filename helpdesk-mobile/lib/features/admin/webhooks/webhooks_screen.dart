import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class WebhooksScreen extends ConsumerStatefulWidget {
  const WebhooksScreen({super.key});
  @override
  ConsumerState<WebhooksScreen> createState() => _WebhooksScreenState();
}

class _WebhooksScreenState extends ConsumerState<WebhooksScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.webhooks);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _WebhookDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put('${ApiEndpoints.webhooks}/${item['id']}', data: data);
      else await _api.post(ApiEndpoints.webhooks, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Webhook'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete('${ApiEndpoints.webhooks}/$id'); await _load(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Webhooks (${_items.length})')),
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
                  CircleAvatar(radius: 20, backgroundColor: active ? AppColors.successBg : AppColors.errorBg,
                    child: Icon(Icons.webhook_outlined, size: 18, color: active ? AppColors.success : AppColors.error)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['url'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis),
                    Text('${(d['events'] as List?)?.length ?? 0} events • ${active ? 'Active' : 'Inactive'}',
                      style: TextStyle(fontSize: 11, color: active ? AppColors.success : AppColors.error)),
                  ])),
                  IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                  IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                ]));
            })),
  );
}

class _WebhookDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _WebhookDialog({this.item, required this.onSave});
  @override
  State<_WebhookDialog> createState() => _WebhookDialogState();
}

class _WebhookDialogState extends State<_WebhookDialog> {
  final _formKey = GlobalKey<FormState>();
  final _urlCtrl = TextEditingController();
  final _secretCtrl = TextEditingController();
  bool _active = true;
  bool _saving = false;
  final List<String> _availableEvents = ['ticket.created', 'ticket.updated', 'ticket.assigned', 'ticket.resolved', 'ticket.closed', 'comment.added'];
  final Set<String> _selectedEvents = {};

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _urlCtrl.text = widget.item!['url'] ?? '';
      _secretCtrl.text = widget.item!['secret'] ?? '';
      _active = widget.item!['active'] ?? true;
      _selectedEvents.addAll(List<String>.from(widget.item!['events'] ?? []));
    }
  }

  @override
  void dispose() { _urlCtrl.dispose(); _secretCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'url': _urlCtrl.text.trim(), 'secret': _secretCtrl.text.trim().isEmpty ? null : _secretCtrl.text.trim(),
        'events': _selectedEvents.toList(), 'active': _active});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit Webhook' : 'New Webhook'),
    content: SingleChildScrollView(child: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      TextFormField(controller: _urlCtrl, decoration: const InputDecoration(labelText: 'URL'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      TextFormField(controller: _secretCtrl, decoration: const InputDecoration(labelText: 'Secret (optional)')),
      const SizedBox(height: 12),
      const Text('Events', style: TextStyle(fontWeight: FontWeight.w600)),
      ..._availableEvents.map((e) => CheckboxListTile(title: Text(e, style: const TextStyle(fontSize: 13)), value: _selectedEvents.contains(e), dense: true,
        onChanged: (v) => setState(() { if (v == true) _selectedEvents.add(e); else _selectedEvents.remove(e); }))),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Active'),
        Switch(value: _active, onChanged: (v) => setState(() => _active = v)),
      ]),
    ]))),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
