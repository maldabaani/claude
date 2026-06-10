import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class IssuesScreen extends ConsumerStatefulWidget {
  const IssuesScreen({super.key});
  @override
  ConsumerState<IssuesScreen> createState() => _IssuesScreenState();
}

class _IssuesScreenState extends ConsumerState<IssuesScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.issues);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _IssueDialog(item: item, onSave: (data) async {
      if (item != null) await _api.put(ApiEndpoints.issue(item['id'].toString()), data: data);
      else await _api.post(ApiEndpoints.issues, data: data);
      await _load();
    }));
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Issue'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete(ApiEndpoints.issue(id)); await _load(); }
  }

  void _viewTickets(Map<String, dynamic> issue) async {
    try {
      final resp = await _api.get(ApiEndpoints.issueTickets(issue['id'].toString()));
      final data = resp.data['data'];
      final tickets = data is List ? data : (data['content'] ?? []);
      if (!mounted) return;
      showDialog(context: context, builder: (_) => AlertDialog(
        title: Text('Tickets for "${issue['title']}"'),
        content: SizedBox(width: double.maxFinite, height: 300, child: tickets.isEmpty
            ? const Center(child: Text('No linked tickets'))
            : ListView.separated(itemCount: tickets.length, separatorBuilder: (_, __) => const Divider(),
                itemBuilder: (_, i) {
                  final t = tickets[i] as Map<String, dynamic>;
                  return ListTile(dense: true, leading: const Icon(Icons.confirmation_number_outlined, size: 18),
                    title: Text(t['subject'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                    subtitle: Text('#${t['id']} • ${t['status'] ?? ''}', style: const TextStyle(fontSize: 11)));
                })),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
      ));
    } catch (_) {}
  }

  Color _statusColor(String s) {
    switch (s) { case 'OPEN': return AppColors.statusOpen; case 'CLOSED': return AppColors.statusClosed; default: return AppColors.textSecondary; }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('Issues (${_items.length})')),
    floatingActionButton: FloatingActionButton(onPressed: _showForm, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    body: _loading ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final d = _items[i] as Map<String, dynamic>;
              final status = d['status'] ?? 'OPEN';
              return InkWell(
                onTap: () => _viewTickets(d),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                  child: Row(children: [
                    const Icon(Icons.bug_report_outlined, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(d['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      Text('${d['ticketCount'] ?? 0} linked tickets', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: _statusColor(status).withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                      child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _statusColor(status))),
                    ),
                    IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showForm(d)),
                    IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _delete(d['id'].toString())),
                  ]),
                ),
              );
            })),
  );
}

class _IssueDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _IssueDialog({this.item, required this.onSave});
  @override
  State<_IssueDialog> createState() => _IssueDialogState();
}

class _IssueDialogState extends State<_IssueDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _status = 'OPEN';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _titleCtrl.text = widget.item!['title'] ?? ''; _descCtrl.text = widget.item!['description'] ?? ''; _status = widget.item!['status'] ?? 'OPEN';
    }
  }

  @override
  void dispose() { _titleCtrl.dispose(); _descCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'title': _titleCtrl.text.trim(), 'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(), 'status': _status});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit Issue' : 'New Issue'),
    content: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      TextFormField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status'),
        items: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
        onChanged: (v) { if (v != null) setState(() => _status = v); }),
    ])),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
