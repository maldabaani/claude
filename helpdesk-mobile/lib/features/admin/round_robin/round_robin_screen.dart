import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class RoundRobinScreen extends ConsumerStatefulWidget {
  const RoundRobinScreen({super.key});
  @override
  ConsumerState<RoundRobinScreen> createState() => _RoundRobinScreenState();
}

class _RoundRobinScreenState extends ConsumerState<RoundRobinScreen> {
  final _api = ApiClient();
  bool _loading = true;
  bool _saving = false;
  bool _globalEnabled = false;
  List<Map<String, dynamic>> _departments = [];
  Map<String, bool> _deptEnabled = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final [globalResp, deptsResp] = await Future.wait([
        _api.get(ApiEndpoints.roundRobin),
        _api.get(ApiEndpoints.departments),
      ]);
      final global = globalResp.data['data'] as Map<String, dynamic>? ?? {};
      _globalEnabled = global['isEnabled'] as bool? ?? false;

      final depts = (deptsResp.data['data'] as List? ?? []).cast<Map<String, dynamic>>();
      _departments = depts;

      final Map<String, bool> enabled = {};
      for (final d in depts) {
        final id = d['id'] as String;
        try {
          final r = await _api.get('${ApiEndpoints.roundRobin}/department/$id');
          enabled[id] = (r.data['data']?['isEnabled'] as bool?) ?? false;
        } catch (_) {
          enabled[id] = false;
        }
      }
      if (mounted) setState(() { _deptEnabled = enabled; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _api.put(ApiEndpoints.roundRobin, data: {'isEnabled': _globalEnabled});
      for (final d in _departments) {
        final id = d['id'] as String;
        await _api.put('${ApiEndpoints.roundRobin}/department/$id',
            data: {'isEnabled': _deptEnabled[id] ?? false});
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Round-robin settings saved')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Save failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        title: Text('Round Robin', style: TextStyle(color: colors.textPrimary)),
        iconTheme: IconThemeData(color: colors.textPrimary),
        actions: [
          if (_saving)
            const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
          else
            TextButton(
              onPressed: _save,
              child: const Text('Save', style: TextStyle(color: AppColors.primary)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _SectionCard(
                  colors: colors,
                  title: 'Global Setting',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SwitchListTile(
                        value: _globalEnabled,
                        onChanged: (v) => setState(() => _globalEnabled = v),
                        title: Text('Enable Round Robin', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600)),
                        subtitle: Text('Automatically assign new tickets to agents in rotation', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
                        activeColor: AppColors.primary,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _SectionCard(
                  colors: colors,
                  title: 'Per-Department Override',
                  child: _departments.isEmpty
                      ? Text('No departments found', style: TextStyle(color: colors.textSecondary))
                      : Column(
                          children: _departments.map((d) {
                            final id = d['id'] as String;
                            return SwitchListTile(
                              value: _deptEnabled[id] ?? false,
                              onChanged: (v) => setState(() => _deptEnabled[id] = v),
                              title: Text(d['name'] as String? ?? 'Department', style: TextStyle(color: colors.textPrimary)),
                              activeColor: AppColors.primary,
                              contentPadding: EdgeInsets.zero,
                            );
                          }).toList(),
                        ),
                ),
              ],
            ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final dynamic colors;
  final String title;
  final Widget child;
  const _SectionCard({required this.colors, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
