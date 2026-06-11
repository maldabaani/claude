import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';
import '../../../features/shared/utils/time_ago.dart';
import '../../../features/shared/widgets/status_badge.dart';

class CustomerProfileScreen extends ConsumerStatefulWidget {
  final String userId;
  const CustomerProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<CustomerProfileScreen> createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends ConsumerState<CustomerProfileScreen> {
  final _api = ApiClient();
  final _noteController = TextEditingController();

  Map<String, dynamic>? _profile;
  bool _loading = true;
  bool _savingNote = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await _api.get(ApiEndpoints.customerProfile(widget.userId));
      if (mounted) {
        setState(() {
          _profile = res.data['data'] as Map<String, dynamic>;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addNote() async {
    final content = _noteController.text.trim();
    if (content.isEmpty) return;
    setState(() => _savingNote = true);
    try {
      final res = await _api.post(ApiEndpoints.customerNotes(widget.userId), data: {'content': content});
      final newNote = res.data['data'] as Map<String, dynamic>;
      final notes = List<dynamic>.from(_profile?['notes'] ?? []);
      notes.insert(0, newNote);
      setState(() {
        _profile = {..._profile!, 'notes': notes};
        _noteController.clear();
        _savingNote = false;
      });
    } catch (_) {
      if (mounted) setState(() => _savingNote = false);
    }
  }

  String _initials(String? name) {
    if (name == null || name.isEmpty) return 'C';
    final parts = name.trim().split(' ');
    return parts.map((p) => p.isNotEmpty ? p[0].toUpperCase() : '').join().substring(0, parts.length > 1 ? 2 : 1);
  }

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    try {
      final dt = DateTime.parse(iso).toLocal();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _profile?['user'] as Map<String, dynamic>?;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(user?['fullName'] ?? 'Customer Profile'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _profile == null
              ? const Center(child: Text('Customer not found'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildHeaderCard(user),
                        const SizedBox(height: 16),
                        _buildStatsRow(),
                        const SizedBox(height: 16),
                        _buildRecentTickets(),
                        const SizedBox(height: 16),
                        _buildAgentNotes(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildHeaderCard(Map<String, dynamic>? user) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Center(
              child: Text(
                _initials(user?['fullName']),
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user?['fullName'] ?? '—',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 2),
                Text(user?['email'] ?? '—',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                const SizedBox(height: 6),
                Row(children: [
                  _RoleBadge(role: user?['role'] ?? 'CUSTOMER'),
                  const SizedBox(width: 8),
                  Text('Since ${_formatDate(user?['createdAt'])}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    final stats = _profile?['stats'] as Map<String, dynamic>? ?? {};
    final avgCsat = stats['avgCsat'];
    return Row(
      children: [
        Expanded(child: _StatCard(label: 'Total', value: '${stats['totalTickets'] ?? 0}', color: AppColors.textPrimary)),
        const SizedBox(width: 8),
        Expanded(child: _StatCard(label: 'Open', value: '${stats['openTickets'] ?? 0}', color: const Color(0xFFD97706))),
        const SizedBox(width: 8),
        Expanded(child: _StatCard(label: 'Resolved', value: '${stats['resolvedTickets'] ?? 0}', color: const Color(0xFF16A34A))),
        const SizedBox(width: 8),
        Expanded(child: _StatCard(
          label: 'CSAT',
          value: avgCsat != null ? avgCsat.toStringAsFixed(1) : '—',
          color: AppColors.accent,
        )),
      ],
    );
  }

  Widget _buildRecentTickets() {
    final tickets = (_profile?['recentTickets'] as List<dynamic>?) ?? [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Recent Tickets',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textTertiary, letterSpacing: 0.5)),
          const SizedBox(height: 12),
          if (tickets.isEmpty)
            const Center(child: Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text('No tickets yet', style: TextStyle(color: AppColors.textTertiary)),
            ))
          else
            ...tickets.map((t) {
              final ticket = t as Map<String, dynamic>;
              return InkWell(
                onTap: () => context.push('/agent/tickets/${ticket['id']}'),
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('#${ticket['ticketNumber']}',
                                style: const TextStyle(fontSize: 11, color: AppColors.textTertiary, fontFamily: 'monospace')),
                            const SizedBox(height: 2),
                            Text(ticket['title'] ?? '—',
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 2),
                            Text(_formatDate(ticket['createdAt']),
                                style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                          ],
                        ),
                      ),
                      StatusBadge(status: ticket['status'] ?? 'NEW'),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildAgentNotes() {
    final notes = (_profile?['notes'] as List<dynamic>?) ?? [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Agent Notes',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textTertiary, letterSpacing: 0.5)),
          const SizedBox(height: 12),
          if (notes.isEmpty)
            const Center(child: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('No notes yet', style: TextStyle(color: AppColors.textTertiary)),
            ))
          else
            ...notes.map((n) {
              final note = n as Map<String, dynamic>;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(note['content'] ?? '',
                        style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    Text('${note['agentName']} · ${_formatDate(note['createdAt'])}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                  ],
                ),
              );
            }),
          const SizedBox(height: 12),
          TextField(
            controller: _noteController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Add a private note about this customer...',
              hintStyle: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _savingNote ? null : _addNote,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(_savingNote ? 'Saving...' : 'Add Note'),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
        ],
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (role) {
      case 'ADMIN': bg = const Color(0xFFF3E8FF); fg = const Color(0xFF7E22CE); break;
      case 'AGENT': bg = const Color(0xFFDBEAFE); fg = const Color(0xFF1D4ED8); break;
      case 'TEAM_LEAD': bg = const Color(0xFFCCFBF1); fg = const Color(0xFF0F766E); break;
      default: bg = const Color(0xFFE0E7FF); fg = const Color(0xFF4338CA);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(role, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
    );
  }
}
