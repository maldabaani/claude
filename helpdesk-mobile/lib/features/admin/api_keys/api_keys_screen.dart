import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class ApiKeysScreen extends ConsumerStatefulWidget {
  const ApiKeysScreen({super.key});
  @override
  ConsumerState<ApiKeysScreen> createState() => _ApiKeysScreenState();
}

class _ApiKeysScreenState extends ConsumerState<ApiKeysScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.apiKeys);
      final data = resp.data['data'];
      if (mounted) setState(() { _items = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showCreate() {
    final nameCtrl = TextEditingController();
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Create API Key'),
      content: TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Key Name')),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white), onPressed: () async {
          if (nameCtrl.text.trim().isEmpty) return;
          Navigator.pop(context);
          try {
            final resp = await _api.post(ApiEndpoints.apiKeys, data: {'name': nameCtrl.text.trim()});
            final keyData = resp.data['data'];
            if (mounted) _showKeyCreated(keyData['key'] ?? keyData['apiKey'] ?? '');
            await _load();
          } catch (_) {}
        }, child: const Text('Create')),
      ],
    ));
  }

  void _showKeyCreated(String key) {
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('API Key Created'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Copy this key now. It will not be shown again.', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 12),
        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(8)),
          child: Row(children: [
            Expanded(child: Text(key, style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: AppColors.textPrimary))),
            IconButton(icon: const Icon(Icons.copy_outlined, size: 18), onPressed: () => Clipboard.setData(ClipboardData(text: key))),
          ])),
      ]),
      actions: [ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white), onPressed: () => Navigator.pop(context), child: const Text('Done'))],
    ));
  }

  Future<void> _revoke(String id, String name) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Revoke API Key'),
      content: Text('Revoke key "$name"? This cannot be undone.'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Revoke', style: TextStyle(color: Colors.white)))],
    ));
    if (ok == true) { await _api.delete('${ApiEndpoints.apiKeys}/$id'); await _load(); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: Text('API Keys (${_items.length})')),
    floatingActionButton: FloatingActionButton(onPressed: _showCreate, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
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
                    child: Icon(Icons.key_outlined, size: 18, color: active ? AppColors.primary : AppColors.error)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    Text(d['keyPrefix'] != null ? '${d['keyPrefix']}...' : 'No prefix', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontFamily: 'monospace')),
                  ])),
                  IconButton(icon: const Icon(Icons.block_outlined, size: 18, color: AppColors.error), onPressed: () => _revoke(d['id'].toString(), d['name'] ?? '')),
                ]));
            })),
  );
}
