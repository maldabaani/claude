import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class TeamsScreen extends ConsumerStatefulWidget {
  const TeamsScreen({super.key});
  @override
  ConsumerState<TeamsScreen> createState() => _TeamsScreenState();
}

class _TeamsScreenState extends ConsumerState<TeamsScreen> {
  final _api = ApiClient();
  List<Map<String, dynamic>> _teams = [];
  bool _loading = true;

  static const _colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final r = await _api.get(ApiEndpoints.teams);
      setState(() { _teams = List<Map<String, dynamic>>.from(r.data['data'] ?? []); _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Color _parseColor(String? hex) {
    if (hex == null || hex.length < 7) return AppColors.primary;
    return Color(int.parse(hex.replaceFirst('#', '0xFF')));
  }

  void _showTeamSheet({Map<String, dynamic>? team}) {
    final nameCtrl = TextEditingController(text: team?['name'] ?? '');
    final descCtrl = TextEditingController(text: team?['description'] ?? '');
    String selectedColor = team?['color'] ?? '#6366F1';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => StatefulBuilder(builder: (ctx, setS) => Padding(
        padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(team == null ? 'New Team' : 'Edit Team', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name *', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          const Text('Color', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Row(children: _colors.map((c) => GestureDetector(
            onTap: () => setS(() => selectedColor = c),
            child: Container(
              width: 28, height: 28, margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: _parseColor(c), shape: BoxShape.circle,
                border: Border.all(color: selectedColor == c ? Colors.black : Colors.transparent, width: 2),
              ),
            ),
          )).toList()),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty) return;
              Navigator.pop(context);
              try {
                if (team == null) {
                  await _api.post(ApiEndpoints.teams, data: {'name': nameCtrl.text.trim(), 'description': descCtrl.text.trim(), 'color': selectedColor});
                } else {
                  await _api.put(ApiEndpoints.team(team['id'] as String), data: {'name': nameCtrl.text.trim(), 'description': descCtrl.text.trim(), 'color': selectedColor});
                }
                _load();
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            child: Text(team == null ? 'Create' : 'Update'),
          )),
        ]),
      )),
    );
  }

  void _showMembersSheet(Map<String, dynamic> team) async {
    List<Map<String, dynamic>> members = [];
    try {
      final r = await _api.get(ApiEndpoints.teamMembers(team['id'] as String));
      members = List<Map<String, dynamic>>.from(r.data['data'] ?? []);
    } catch (_) {}

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => StatefulBuilder(builder: (ctx, setS) => DraggableScrollableSheet(
        expand: false, initialChildSize: 0.6, maxChildSize: 0.9,
        builder: (_, sc) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Members — ${team['name']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text('${members.length} member(s)', style: const TextStyle(color: Colors.grey)),
            const Divider(),
            Expanded(child: members.isEmpty
              ? const Center(child: Text('No members yet'))
              : ListView.builder(controller: sc, itemCount: members.length, itemBuilder: (_, i) {
                  final m = members[i];
                  return ListTile(
                    leading: CircleAvatar(child: Text((m['fullName'] as String? ?? 'U')[0])),
                    title: Text(m['fullName'] as String? ?? ''),
                    subtitle: Text(m['email'] as String? ?? ''),
                    trailing: IconButton(
                      icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                      onPressed: () async {
                        try {
                          await _api.delete(ApiEndpoints.teamMember(team['id'] as String, m['id'] as String));
                          setS(() => members.removeAt(i));
                        } catch (_) {}
                      },
                    ),
                  );
                }),
            ),
          ]),
        ),
      )),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        title: Text('Teams', style: TextStyle(color: colors.textPrimary)),
        iconTheme: IconThemeData(color: colors.textPrimary),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showTeamSheet(),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _teams.isEmpty
          ? const Center(child: Text('No teams yet'))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _teams.length,
              itemBuilder: (_, i) {
                final t = _teams[i];
                final color = _parseColor(t['color'] as String?);
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: colors.border)),
                  child: ListTile(
                    leading: CircleAvatar(backgroundColor: color, child: Text((t['name'] as String? ?? 'T')[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
                    title: Text(t['name'] as String? ?? '', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600)),
                    subtitle: Text(t['description'] as String? ?? '', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
                    trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                      IconButton(icon: const Icon(Icons.group_outlined, size: 20), onPressed: () => _showMembersSheet(t)),
                      IconButton(icon: const Icon(Icons.edit_outlined, size: 20), onPressed: () => _showTeamSheet(team: t)),
                      IconButton(icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red), onPressed: () async {
                        await _api.delete(ApiEndpoints.team(t['id'] as String));
                        _load();
                      }),
                    ]),
                  ),
                );
              },
            ),
    );
  }
}
