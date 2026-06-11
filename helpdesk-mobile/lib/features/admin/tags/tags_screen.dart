import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

const _colorPalette = [
  Color(0xFF6366F1), Color(0xFF0EA5E9), Color(0xFF10B981), Color(0xFFF59E0B),
  Color(0xFFEF4444), Color(0xFF8B5CF6), Color(0xFFEC4899), Color(0xFF64748B),
];

String _colorToHex(Color c) =>
    '#${c.red.toRadixString(16).padLeft(2, '0')}${c.green.toRadixString(16).padLeft(2, '0')}${c.blue.toRadixString(16).padLeft(2, '0')}';

Color _hexToColor(String hex) {
  try {
    return Color(int.parse(hex.replaceFirst('#', '0xFF')));
  } catch (_) {
    return const Color(0xFF6366F1);
  }
}

class TagsScreen extends ConsumerStatefulWidget {
  const TagsScreen({super.key});
  @override
  ConsumerState<TagsScreen> createState() => _TagsScreenState();
}

class _TagsScreenState extends ConsumerState<TagsScreen> {
  final _api = ApiClient();
  List<dynamic> _tags = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.tags);
      final data = resp.data['data'];
      if (mounted) setState(() { _tags = data is List ? data : []; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showCreateDialog() {
    _showTagDialog(null);
  }

  void _showTagDialog(Map<String, dynamic>? tag) {
    showDialog(
      context: context,
      builder: (_) => _TagFormDialog(
        tag: tag,
        onSave: (name, color) async {
          final payload = {'name': name, 'color': color};
          if (tag != null) {
            await _api.put(ApiEndpoints.tag(tag['id']), data: payload);
          } else {
            await _api.post(ApiEndpoints.tags, data: payload);
          }
          await _load();
        },
      ),
    );
  }

  void _showMergeDialog(Map<String, dynamic> tag) {
    showDialog(
      context: context,
      builder: (_) => _MergeTagDialog(
        sourceTag: tag,
        allTags: _tags.where((t) => t['id'] != tag['id']).toList(),
        onMerge: (targetId) async {
          await _api.post(ApiEndpoints.tagMerge(tag['id']), data: {'targetTagId': targetId});
          await _load();
        },
      ),
    );
  }

  Future<void> _delete(Map<String, dynamic> tag) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Tag'),
        content: Text('Delete "${tag['name']}"? It will be removed from all tickets.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await _api.delete(ApiEndpoints.tag(tag['id']));
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        title: const Text('Tag Taxonomy', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: AppColors.border)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _tags.isEmpty
              ? const Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.label_outline, size: 48, color: AppColors.textTertiary),
                    SizedBox(height: 12),
                    Text('No tags yet', style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
                    SizedBox(height: 4),
                    Text('Tap + to create your first tag', style: TextStyle(color: AppColors.textTertiary, fontSize: 13)),
                  ]),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _tags.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final tag = _tags[i] as Map<String, dynamic>;
                    final color = _hexToColor(tag['color'] ?? '#6366F1');
                    final usageCount = tag['usageCount'] ?? 0;
                    return Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: ListTile(
                        leading: Container(
                          width: 16, height: 16,
                          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                        ),
                        title: Text(tag['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: Text('$usageCount ticket${usageCount != 1 ? 's' : ''}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, size: 18),
                            color: AppColors.textSecondary,
                            onPressed: () => _showTagDialog(tag),
                          ),
                          IconButton(
                            icon: const Icon(Icons.merge_outlined, size: 18),
                            color: AppColors.textSecondary,
                            onPressed: () => _showMergeDialog(tag),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 18),
                            color: AppColors.error,
                            onPressed: () => _delete(tag),
                          ),
                        ]),
                      ),
                    );
                  },
                ),
    );
  }
}

class _TagFormDialog extends StatefulWidget {
  final Map<String, dynamic>? tag;
  final Future<void> Function(String name, String color) onSave;
  const _TagFormDialog({required this.tag, required this.onSave});

  @override
  State<_TagFormDialog> createState() => _TagFormDialogState();
}

class _TagFormDialogState extends State<_TagFormDialog> {
  late TextEditingController _nameCtrl;
  Color _selectedColor = _colorPalette[0];
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.tag?['name'] ?? '');
    if (widget.tag != null) {
      _selectedColor = _hexToColor(widget.tag!['color'] ?? '#6366F1');
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.tag != null ? 'Edit Tag' : 'New Tag'),
    content: SizedBox(
      width: 320,
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        TextField(
          controller: _nameCtrl,
          decoration: const InputDecoration(labelText: 'Name', hintText: 'e.g. billing', border: OutlineInputBorder()),
          maxLength: 50,
        ),
        const SizedBox(height: 12),
        const Text('Color', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: _colorPalette.map((c) => GestureDetector(
          onTap: () => setState(() => _selectedColor = c),
          child: Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: c,
              shape: BoxShape.circle,
              border: _selectedColor == c ? Border.all(color: Colors.black, width: 2) : null,
              boxShadow: _selectedColor == c ? [BoxShadow(color: c.withOpacity(0.5), blurRadius: 6)] : null,
            ),
          ),
        )).toList()),
      ]),
    ),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
        onPressed: _saving || _nameCtrl.text.trim().isEmpty ? null : () async {
          setState(() => _saving = true);
          await widget.onSave(_nameCtrl.text.trim(), _colorToHex(_selectedColor));
          if (mounted) Navigator.pop(context);
        },
        child: Text(_saving ? 'Saving...' : 'Save', style: const TextStyle(color: Colors.white)),
      ),
    ],
  );
}

class _MergeTagDialog extends StatefulWidget {
  final Map<String, dynamic> sourceTag;
  final List<dynamic> allTags;
  final Future<void> Function(String targetId) onMerge;
  const _MergeTagDialog({required this.sourceTag, required this.allTags, required this.onMerge});

  @override
  State<_MergeTagDialog> createState() => _MergeTagDialogState();
}

class _MergeTagDialogState extends State<_MergeTagDialog> {
  String? _selectedTargetId;
  bool _merging = false;

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Merge Tag'),
    content: SizedBox(
      width: 320,
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text.rich(TextSpan(children: [
          const TextSpan(text: 'Merge '),
          TextSpan(text: widget.sourceTag['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
          const TextSpan(text: ' into:'),
        ])),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _selectedTargetId,
          decoration: const InputDecoration(labelText: 'Target tag', border: OutlineInputBorder()),
          items: widget.allTags.map((t) => DropdownMenuItem<String>(
            value: t['id'] as String,
            child: Row(children: [
              Container(width: 12, height: 12, decoration: BoxDecoration(
                color: _hexToColor(t['color'] ?? '#6366F1'), shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text(t['name'] ?? ''),
            ]),
          )).toList(),
          onChanged: (v) => setState(() => _selectedTargetId = v),
        ),
        const SizedBox(height: 8),
        const Text('All tickets using this tag will be updated. The source tag will be deleted.',
            style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
      ]),
    ),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
        onPressed: _merging || _selectedTargetId == null ? null : () async {
          setState(() => _merging = true);
          await widget.onMerge(_selectedTargetId!);
          if (mounted) Navigator.pop(context);
        },
        child: Text(_merging ? 'Merging...' : 'Merge & Delete', style: const TextStyle(color: Colors.white)),
      ),
    ],
  );
}
