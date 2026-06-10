import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class AdminKbScreen extends ConsumerStatefulWidget {
  const AdminKbScreen({super.key});
  @override
  ConsumerState<AdminKbScreen> createState() => _AdminKbScreenState();
}

class _AdminKbScreenState extends ConsumerState<AdminKbScreen> with SingleTickerProviderStateMixin {
  final _api = ApiClient();
  List<dynamic> _categories = [];
  List<dynamic> _articles = [];
  bool _loading = true;
  late TabController _tabCtrl;

  @override
  void initState() { super.initState(); _tabCtrl = TabController(length: 2, vsync: this); _load(); }
  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final catResp = await _api.get(ApiEndpoints.kbCategories);
      final artResp = await _api.get(ApiEndpoints.kbArticles);
      final catData = catResp.data['data']; final artData = artResp.data['data'];
      if (mounted) setState(() {
        _categories = catData is List ? catData : (catData['content'] ?? []);
        _articles = artData is List ? artData : (artData['content'] ?? []);
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _showCategoryForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _SimpleNameDialog(
      title: item != null ? 'Edit Category' : 'New Category',
      initialName: item?['name'] ?? '',
      onSave: (name) async {
        if (item != null) await _api.put('${ApiEndpoints.kbCategories}/${item['id']}', data: {'name': name});
        else await _api.post(ApiEndpoints.kbCategories, data: {'name': name});
        await _load();
      }));
  }

  void _showArticleForm([Map<String, dynamic>? item]) {
    showDialog(context: context, builder: (_) => _ArticleDialog(item: item, categories: _categories, onSave: (data) async {
      if (item != null) await _api.put(ApiEndpoints.kbArticle(item['id'].toString()), data: data);
      else await _api.post(ApiEndpoints.kbArticles, data: data);
      await _load();
    }));
  }

  Future<void> _deleteCategory(String id) async {
    final ok = await _confirmDelete();
    if (ok) { await _api.delete('${ApiEndpoints.kbCategories}/$id'); await _load(); }
  }

  Future<void> _deleteArticle(String id) async {
    final ok = await _confirmDelete();
    if (ok) { await _api.delete(ApiEndpoints.kbArticle(id)); await _load(); }
  }

  Future<bool> _confirmDelete() async {
    return await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete'), content: const Text('Are you sure?'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.white)))],
    )) ?? false;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: const Text('Knowledge Base'),
      bottom: TabBar(controller: _tabCtrl, tabs: const [Tab(text: 'Categories'), Tab(text: 'Articles')])),
    floatingActionButton: FloatingActionButton(onPressed: () => _tabCtrl.index == 0 ? _showCategoryForm() : _showArticleForm(),
      backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    body: _loading ? const Center(child: CircularProgressIndicator()) : TabBarView(controller: _tabCtrl, children: [
      RefreshIndicator(onRefresh: _load, child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _categories.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final d = _categories[i] as Map<String, dynamic>;
          return Container(padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
            child: Row(children: [
              const Icon(Icons.folder_outlined, color: AppColors.primary),
              const SizedBox(width: 12),
              Expanded(child: Text(d['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
              IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showCategoryForm(d)),
              IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _deleteCategory(d['id'].toString())),
            ]));
        })),
      RefreshIndicator(onRefresh: _load, child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80), itemCount: _articles.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final d = _articles[i] as Map<String, dynamic>;
          return Container(padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
            child: Row(children: [
              const Icon(Icons.article_outlined, color: AppColors.primary),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(d['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                Text(d['categoryName'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ])),
              IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: () => _showArticleForm(d)),
              IconButton(icon: const Icon(Icons.delete_outlined, size: 18, color: AppColors.error), onPressed: () => _deleteArticle(d['id'].toString())),
            ]));
        })),
    ]),
  );
}

class _SimpleNameDialog extends StatefulWidget {
  final String title;
  final String initialName;
  final Future<void> Function(String) onSave;
  const _SimpleNameDialog({required this.title, required this.initialName, required this.onSave});
  @override
  State<_SimpleNameDialog> createState() => _SimpleNameDialogState();
}

class _SimpleNameDialogState extends State<_SimpleNameDialog> {
  late final TextEditingController _ctrl;
  bool _saving = false;
  @override
  void initState() { super.initState(); _ctrl = TextEditingController(text: widget.initialName); }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try { await widget.onSave(_ctrl.text.trim()); if (mounted) Navigator.pop(context); }
    catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.title),
    content: TextField(controller: _ctrl, decoration: const InputDecoration(labelText: 'Name')),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white), child: const Text('Save')),
    ],
  );
}

class _ArticleDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final List<dynamic> categories;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _ArticleDialog({this.item, required this.categories, required this.onSave});
  @override
  State<_ArticleDialog> createState() => _ArticleDialogState();
}

class _ArticleDialogState extends State<_ArticleDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  String? _categoryId;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.item != null) {
      _titleCtrl.text = widget.item!['title'] ?? '';
      _bodyCtrl.text = widget.item!['body'] ?? widget.item!['content'] ?? '';
      _categoryId = widget.item!['categoryId']?.toString();
    }
    if (_categoryId == null && widget.categories.isNotEmpty) {
      _categoryId = widget.categories[0]['id'].toString();
    }
  }

  @override
  void dispose() { _titleCtrl.dispose(); _bodyCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({'title': _titleCtrl.text.trim(), 'body': _bodyCtrl.text.trim(), 'categoryId': _categoryId});
      if (mounted) Navigator.pop(context);
    } catch (_) { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.item != null ? 'Edit Article' : 'New Article'),
    content: SingleChildScrollView(child: Form(key: _formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
      TextFormField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
      const SizedBox(height: 12),
      if (widget.categories.isNotEmpty) DropdownButtonFormField<String>(
        value: _categoryId, decoration: const InputDecoration(labelText: 'Category'),
        items: widget.categories.map((c) => DropdownMenuItem(value: c['id'].toString(), child: Text(c['name'] ?? ''))).toList(),
        onChanged: (v) => setState(() => _categoryId = v)),
      const SizedBox(height: 12),
      TextFormField(controller: _bodyCtrl, decoration: const InputDecoration(labelText: 'Content'), maxLines: 6, validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
    ]))),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      ElevatedButton(onPressed: _saving ? null : _save, style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save')),
    ],
  );
}
