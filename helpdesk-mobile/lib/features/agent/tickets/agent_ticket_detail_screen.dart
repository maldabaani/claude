import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/time_ago.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/priority_badge.dart';

class AgentTicketDetailScreen extends ConsumerStatefulWidget {
  final String id;
  const AgentTicketDetailScreen({super.key, required this.id});

  @override
  ConsumerState<AgentTicketDetailScreen> createState() => _AgentTicketDetailScreenState();
}

class _AgentTicketDetailScreenState extends ConsumerState<AgentTicketDetailScreen>
    with SingleTickerProviderStateMixin {
  final _api = ApiClient();
  final _commentController = TextEditingController();
  late TabController _tabController;

  Map<String, dynamic>? _ticket;
  List<dynamic> _comments = [];
  List<dynamic> _activity = [];
  bool _loading = true;
  bool _submitting = false;
  bool _internalNote = false;

  static const _statuses = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.get(ApiEndpoints.ticket(widget.id)),
        _api.get(ApiEndpoints.ticketComments(widget.id)),
      ]);
      if (mounted) {
        final commentsData = results[1].data['data'];
        setState(() {
          _ticket = results[0].data['data'];
          _comments = commentsData is Map ? (commentsData['content'] ?? []) : (commentsData ?? []);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      await _api.patch(ApiEndpoints.ticketStatus(widget.id), data: {'status': status});
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to $status'), backgroundColor: AppColors.success),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update status'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _assignToMe() async {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) return;
    try {
      await _api.patch(ApiEndpoints.ticketAssign(widget.id), data: {'agentId': userId});
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket assigned to you'), backgroundColor: AppColors.success),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to assign ticket'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    setState(() => _submitting = true);
    try {
      await _api.post(ApiEndpoints.ticketComments(widget.id), data: {
        'content': text,
        'body': text,
        'isInternal': _internalNote,
        'internal': _internalNote,
      });
      _commentController.clear();
      await _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to post comment'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Text(_ticket != null ? 'Ticket #${_ticket!['ticketNumber'] ?? _ticket!['id']}' : 'Ticket'),
        actions: [
          if (_ticket != null)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              tooltip: 'Change Status',
              onSelected: _updateStatus,
              itemBuilder: (_) => _statuses.map((s) => PopupMenuItem(
                value: s,
                child: Row(
                  children: [
                    if ((_ticket!['status'] ?? '') == s) ...[
                      const Icon(Icons.check, size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                    ] else
                      const SizedBox(width: 24),
                    Text(s),
                  ],
                ),
              )).toList(),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Details'),
            Tab(text: 'Comments'),
            Tab(text: 'Activity'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ticket == null
              ? const Center(child: Text('Ticket not found.'))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _DetailsTab(ticket: _ticket!, onAssignToMe: _assignToMe, onStatusChange: _updateStatus),
                    _CommentsTab(
                      comments: _comments,
                      commentController: _commentController,
                      internalNote: _internalNote,
                      submitting: _submitting,
                      onToggleInternal: (v) => setState(() => _internalNote = v),
                      onSend: _postComment,
                    ),
                    _ActivityTab(activity: _activity),
                  ],
                ),
    );
  }
}

class _DetailsTab extends StatelessWidget {
  final Map<String, dynamic> ticket;
  final VoidCallback onAssignToMe;
  final ValueChanged<String> onStatusChange;

  const _DetailsTab({required this.ticket, required this.onAssignToMe, required this.onStatusChange});

  @override
  Widget build(BuildContext context) {
    final assignedAgent = ticket['assignedAgent'] as Map<String, dynamic>?;
    final createdBy = ticket['createdBy'] as Map<String, dynamic>?;
    final dueDate = ticket['manualDueDate'] ?? ticket['dueDate'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Subject & Description
          _InfoCard(
            children: [
              Text(
                ticket['title'] ?? ticket['subject'] ?? 'No subject',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                ticket['description'] ?? '',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Status & Priority
          _InfoCard(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Status', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                        const SizedBox(height: 4),
                        StatusBadge(status: ticket['status'] ?? 'NEW'),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Priority', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                        const SizedBox(height: 4),
                        PriorityBadge(priority: ticket['priority'] ?? 'MEDIUM'),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Details
          _InfoCard(
            children: [
              _DetailRow(label: 'Created By', value: createdBy?['fullName'] ?? 'Unknown'),
              const Divider(height: 16),
              _DetailRow(
                label: 'Assigned To',
                value: assignedAgent?['fullName'] ?? 'Unassigned',
              ),
              const Divider(height: 16),
              _DetailRow(label: 'Department', value: ticket['departmentName'] ?? ticket['department']?['name'] ?? '-'),
              const Divider(height: 16),
              _DetailRow(label: 'Created', value: formatTimeAgo(ticket['createdAt'])),
              const Divider(height: 16),
              _DetailRow(label: 'Updated', value: formatTimeAgo(ticket['updatedAt'])),
              if (dueDate != null) ...[
                const Divider(height: 16),
                _DetailRow(
                  label: 'SLA Deadline',
                  value: _formatDate(dueDate),
                  valueColor: (ticket['slaBreached'] == true) ? AppColors.error : AppColors.textPrimary,
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),

          // Actions
          if (assignedAgent == null)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onAssignToMe,
                icon: const Icon(Icons.person_add_outlined),
                label: const Text('Assign to Me'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null) return '-';
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;
  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 110,
          child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textTertiary)),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor ?? AppColors.textPrimary),
          ),
        ),
      ],
    );
  }
}

class _CommentsTab extends StatelessWidget {
  final List<dynamic> comments;
  final TextEditingController commentController;
  final bool internalNote;
  final bool submitting;
  final ValueChanged<bool> onToggleInternal;
  final VoidCallback onSend;

  const _CommentsTab({
    required this.comments,
    required this.commentController,
    required this.internalNote,
    required this.submitting,
    required this.onToggleInternal,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: comments.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.chat_bubble_outline, size: 40, color: AppColors.textTertiary),
                      const SizedBox(height: 8),
                      Text('No comments yet', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: comments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _CommentBubble(comment: comments[i]),
                ),
        ),
        // Comment input
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  GestureDetector(
                    onTap: () => onToggleInternal(!internalNote),
                    child: Row(
                      children: [
                        Icon(
                          internalNote ? Icons.lock_outlined : Icons.public_outlined,
                          size: 16,
                          color: internalNote ? AppColors.warning : AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          internalNote ? 'Internal Note' : 'Public Reply',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: internalNote ? AppColors.warning : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Transform.scale(
                    scale: 0.8,
                    child: Switch(
                      value: internalNote,
                      onChanged: onToggleInternal,
                      activeColor: AppColors.warning,
                    ),
                  ),
                ],
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: commentController,
                      decoration: InputDecoration(
                        hintText: internalNote ? 'Add internal note...' : 'Reply to customer...',
                        isDense: true,
                        filled: true,
                        fillColor: internalNote ? AppColors.warningBg : AppColors.surfaceVariant,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      maxLines: 4,
                      minLines: 1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      onTap: submitting ? null : onSend,
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: submitting
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.send, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CommentBubble extends StatelessWidget {
  final Map<String, dynamic> comment;
  const _CommentBubble({required this.comment});

  String get authorName => comment['author']?['fullName'] ?? comment['authorName'] ?? 'Unknown';
  String get initials {
    final parts = authorName.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  bool get isInternal => comment['internal'] == true || comment['isInternal'] == true;
  String get body => comment['body'] ?? comment['content'] ?? '';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isInternal ? AppColors.warningBg : AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isInternal ? AppColors.warning.withOpacity(0.3) : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: AppColors.primary.withOpacity(0.15),
                child: Text(initials, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
              ),
              const SizedBox(width: 8),
              Text(authorName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              if (isInternal) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.warningBg,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                  ),
                  child: const Text('Internal', style: TextStyle(fontSize: 9, color: AppColors.warning, fontWeight: FontWeight.w700)),
                ),
              ],
              const Spacer(),
              Text(formatTimeAgo(comment['createdAt']), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
            ],
          ),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}

class _ActivityTab extends StatelessWidget {
  final List<dynamic> activity;
  const _ActivityTab({required this.activity});

  @override
  Widget build(BuildContext context) {
    if (activity.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.history, size: 40, color: AppColors.textTertiary),
            const SizedBox(height: 8),
            Text('No activity recorded', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
          ],
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: activity.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final item = activity[i] as Map<String, dynamic>;
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4),
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['description'] ?? item['action'] ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    Text(formatTimeAgo(item['createdAt']), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
