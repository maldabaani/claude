import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class NpsScreen extends ConsumerStatefulWidget {
  const NpsScreen({super.key});
  @override
  ConsumerState<NpsScreen> createState() => _NpsScreenState();
}

class _NpsScreenState extends ConsumerState<NpsScreen> {
  final _api = ApiClient();
  bool _loading = true;
  int _selectedDays = 30;
  Map<String, dynamic>? _score;
  List<Map<String, dynamic>> _responses = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final from = DateTime.now().subtract(Duration(days: _selectedDays)).toUtc().toIso8601String();
    final to = DateTime.now().toUtc().toIso8601String();
    try {
      final [scoreResp, respResp] = await Future.wait([
        _api.get('${ApiEndpoints.npsScore}?from=$from&to=$to'),
        _api.get('${ApiEndpoints.npsResponses}?from=$from&to=$to'),
      ]);
      if (mounted) setState(() {
        _score = scoreResp.data['data'] as Map<String, dynamic>?;
        _responses = List<Map<String, dynamic>>.from(respResp.data['data'] ?? []);
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  Color _scoreColor(int s) {
    if (s >= 50) return Colors.green;
    if (s >= 0) return Colors.orange;
    return Colors.red;
  }

  String _category(int s) {
    if (s >= 9) return 'Promoter';
    if (s >= 7) return 'Passive';
    return 'Detractor';
  }

  Color _categoryColor(int s) {
    if (s >= 9) return Colors.green;
    if (s >= 7) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final nps = _score?['npsScore'] as int? ?? 0;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        title: Text('NPS Dashboard', style: TextStyle(color: colors.textPrimary)),
        iconTheme: IconThemeData(color: colors.textPrimary),
        actions: [
          PopupMenuButton<int>(
            initialValue: _selectedDays,
            onSelected: (v) { setState(() => _selectedDays = v); _load(); },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 7, child: Text('Last 7 days')),
              const PopupMenuItem(value: 30, child: Text('Last 30 days')),
              const PopupMenuItem(value: 90, child: Text('Last 90 days')),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(children: [
                Text('$_selectedDays days', style: TextStyle(color: colors.textPrimary)),
                const Icon(Icons.arrow_drop_down),
              ]),
            ),
          ),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_score != null) ...[
                Container(
                  decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: colors.border)),
                  padding: const EdgeInsets.all(20),
                  child: Column(children: [
                    Text('Net Promoter Score', style: TextStyle(color: colors.textSecondary, fontSize: 13)),
                    const SizedBox(height: 8),
                    Text('$nps', style: TextStyle(fontSize: 56, fontWeight: FontWeight.w900, color: _scoreColor(nps))),
                    Text('${_score!['total']} responses', style: TextStyle(color: colors.textTertiary, fontSize: 12)),
                    const SizedBox(height: 20),
                    _Bar(label: 'Promoters (9-10)', pct: (_score!['promoterPct'] as num?)?.toDouble() ?? 0, color: Colors.green, count: _score!['promoters'] as int? ?? 0),
                    const SizedBox(height: 10),
                    _Bar(label: 'Passives (7-8)', pct: (_score!['passivePct'] as num?)?.toDouble() ?? 0, color: Colors.orange, count: _score!['passives'] as int? ?? 0),
                    const SizedBox(height: 10),
                    _Bar(label: 'Detractors (0-6)', pct: (_score!['detractorPct'] as num?)?.toDouble() ?? 0, color: Colors.red, count: _score!['detractors'] as int? ?? 0),
                  ]),
                ),
                const SizedBox(height: 16),
              ],
              Text('Recent Responses', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 8),
              if (_responses.isEmpty)
                Center(child: Padding(padding: const EdgeInsets.all(32), child: Text('No responses in this period', style: TextStyle(color: colors.textTertiary))))
              else
                ..._responses.map((r) {
                  final score = r['score'] as int? ?? 0;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: colors.border)),
                    child: Row(children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(color: _categoryColor(score).withOpacity(0.15), shape: BoxShape.circle),
                        child: Center(child: Text('$score', style: TextStyle(fontWeight: FontWeight.w900, color: _categoryColor(score)))),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: _categoryColor(score).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                          child: Text(_category(score), style: TextStyle(color: _categoryColor(score), fontSize: 11, fontWeight: FontWeight.w600)),
                        ),
                        if (r['comment'] != null && (r['comment'] as String).isNotEmpty)
                          Padding(padding: const EdgeInsets.only(top: 4), child: Text(r['comment'] as String, style: TextStyle(color: colors.textSecondary, fontSize: 12))),
                      ])),
                    ]),
                  );
                }),
            ],
          ),
    );
  }
}

class _Bar extends StatelessWidget {
  final String label;
  final double pct;
  final Color color;
  final int count;
  const _Bar({required this.label, required this.pct, required this.color, required this.count});

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(fontSize: 12)),
      Text('$count (${pct.toStringAsFixed(0)}%)', style: const TextStyle(fontSize: 12)),
    ]),
    const SizedBox(height: 4),
    ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: LinearProgressIndicator(value: pct / 100, backgroundColor: Colors.grey.shade200, valueColor: AlwaysStoppedAnimation(color), minHeight: 8),
    ),
  ]);
}
