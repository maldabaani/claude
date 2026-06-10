import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../features/shared/utils/time_ago.dart';
import '../../../features/shared/widgets/status_badge.dart';
import '../../../features/shared/widgets/priority_badge.dart';

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
  List<dynamic> _watchers = [];
  List<dynamic> _tasks = [];
  List<dynamic> _timeEntries = [];
  bool _loading = true;
  bool _submitting = false;
  bool _internalNote = false;

  // Presence
  List<Map<String, dynamic>> _otherViewers = [];
  Timer? _presenceTimer;

  // Draft
  Timer? _draftTimer;
  DateTime? _draftSavedAt;

  static const _statuses = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _load().then((_) {
      _joinPresence();
      _loadDraft();
    });
    _commentController.addListener(_onCommentChanged);
  }

  @override
  void dispose() {
    _presenceTimer?.cancel();
    _draftTimer?.cancel();
    _leavePresence();
    _commentController.removeListener(_onCommentChanged);
    _commentController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _onCommentChanged() {
    _draftTimer?.cancel();
    _draftTimer = Timer(const Duration(seconds: 3), _saveDraft);
  }

  Future<void> _loadDraft() async {
    try {
      final res = await _api.get(ApiEndpoints.ticketDraft(widget.id));
      final draft = res.data['data'] as Map<String, dynamic>?;
      if (draft != null && mounted && _commentController.text.isEmpty) {
        setState(() {
          _commentController.text = draft['content'] ?? '';
          _internalNote = draft['isInternal'] == true;
          _draftSavedAt = DateTime.tryParse(draft['updatedAt'] ?? '');
        });
      }
    } catch (_) {}
  }

  Future<void> _saveDraft() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    try {
      await _api.put(ApiEndpoints.ticketDraft(widget.id), data: {
        'content': text,
        'isInternal': _internalNote,
      });
      if (mounted) setState(() => _draftSavedAt = DateTime.now());
    } catch (_) {}
  }

  Future<void> _discardDraft() async {
    try {
      await _api.delete(ApiEndpoints.ticketDraft(widget.id));
    } catch (_) {}
    if (mounted) {
      setState(() {
        _commentController.clear();
        _draftSavedAt = null;
      });
    }
  }

  Future<void> _joinPresence() async {
    try {
      final res = await _api.post(ApiEndpoints.ticketPresenceJoin(widget.id), data: {});
      final viewers = (res.data['data'] as List?) ?? [];
      final currentUserId = ref.read(authProvider).user?.id;
      if (mounted) {
        setState(() {
          _otherViewers = viewers
              .cast<Map<String, dynamic>>()
              .where((v) => v['agentId']?.toString() != currentUserId)
              .toList();
        });
      }
      // Poll presence every 30 seconds
      _presenceTimer = Timer.periodic(const Duration(seconds: 30), (_) => _pollPresence());
    } catch (_) {}
  }

  Future<void> _pollPresence() async {
    try {
      final res = await _api.get(ApiEndpoints.ticketPresence(widget.id));
      final viewers = (res.data['data'] as List?) ?? [];
      final currentUserId = ref.read(authProvider).user?.id;
      if (mounted) {
        setState(() {
          _otherViewers = viewers
              .cast<Map<String, dynamic>>()
              .where((v) => v['agentId']?.toString() != currentUserId)
              .toList();
        });
      }
    } catch (_) {}
  }

  void _leavePresence() {
    _api.post(ApiEndpoints.ticketPresenceLeave(widget.id), data: {}).catchError((_) {});
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.get(ApiEndpoints.ticket(widget.id)),
        _api.get(ApiEndpoints.ticketComments(widget.id)),
        _api.get(ApiEndpoints.ticketWatchers(widget.id)),
        _api.get(ApiEndpoints.ticketTasks(widget.id)),
        _api.get(ApiEndpoints.ticketTimeEntries(widget.id)),
      ]);
      if (mounted) {
        final commentsData = results[1].data['data'];
        setState(() {
          _ticket = results[0].data['data'];
          _comments = commentsData is Map ? (commentsData['content'] ?? []) : (commentsData ?? []);
          _watchers = results[2].data['data'] ?? [];
          _tasks = results[3].data['data'] ?? [];
          _timeEntries = results[4].data['data'] ?? [];
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
    } catch (_) {}
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
      setState(() => _draftSavedAt = null);
      _api.delete(ApiEndpoints.ticketDraft(widget.id)).catchError((_) {});
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

  Future<void> _addWatcher(String email) async {
    try {
      await _api.post(ApiEndpoints.ticketWatchers(widget.id), data: {'email': email});
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$email added as watcher'), backgroundColor: AppColors.success),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add watcher'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _removeWatcher(String email) async {
    try {
      await _api.delete(ApiEndpoints.ticketWatcher(widget.id, email));
      setState(() => _watchers.removeWhere((w) => (w['email'] ?? w['userEmail']) == email));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Watcher removed'), backgroundColor: AppColors.success),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to remove watcher'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _addTask(String title) async {
    try {
      await _api.post(ApiEndpoints.ticketTasks(widget.id), data: {'title': title});
      await _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add task'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _toggleTask(String taskId) async {
    try {
      await _api.patch(ApiEndpoints.ticketTaskToggle(widget.id, taskId));
      await _load();
    } catch (_) {}
  }

  Future<void> _deleteTask(String taskId) async {
    try {
      await _api.delete(ApiEndpoints.ticketTask(widget.id, taskId));
      setState(() => _tasks.removeWhere((t) => t['id'].toString() == taskId));
    } catch (_) {}
  }

  Future<void> _mergeTicket(String targetId) async {
    try {
      await _api.post(ApiEndpoints.ticketMerge(widget.id), data: {'targetTicketId': targetId});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tickets merged successfully'), backgroundColor: AppColors.success),
        );
        Navigator.of(context).pop();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to merge tickets'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _snooze(DateTime until) async {
    try {
      await _api.patch(ApiEndpoints.ticketSnooze(widget.id), data: {'snoozeUntil': until.toIso8601String()});
      await _load();
      if (mounted) {
        Navigator.of(context).pop(); // close bottom sheet
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ticket snoozed until ${until.toString().substring(0, 16)}'), backgroundColor: AppColors.warning),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to snooze ticket'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _unsnooze() async {
    try {
      await _api.patch(ApiEndpoints.ticketSnooze(widget.id), data: {'snoozeUntil': null});
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket woken up'), backgroundColor: AppColors.success),
        );
      }
    } catch (_) {}
  }

  void _showSnoozeSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Snooze ticket', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _snoozeOptionButton('In 1 hour', () {
                    final d = DateTime.now().add(const Duration(hours: 1));
                    _snooze(d);
                  }),
                  _snoozeOptionButton('In 4 hours', () {
                    final d = DateTime.now().add(const Duration(hours: 4));
                    _snooze(d);
                  }),
                  _snoozeOptionButton('Tomorrow 9am', () {
                    final now = DateTime.now();
                    final d = DateTime(now.year, now.month, now.day + 1, 9);
                    _snooze(d);
                  }),
                  _snoozeOptionButton('Next Monday 9am', () {
                    final now = DateTime.now();
                    final daysUntilMonday = ((1 - now.weekday + 7) % 7).clamp(1, 7);
                    final d = DateTime(now.year, now.month, now.day + daysUntilMonday, 9);
                    _snooze(d);
                  }),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _snoozeOptionButton(String label, VoidCallback onTap) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: Color(0xFFFDE68A)),
        foregroundColor: const Color(0xFF92400E),
        backgroundColor: const Color(0xFFFFFBEB),
      ),
      child: Text(label),
    );
  }

  void _showMergeDialog() {
    showDialog(
      context: context,
      builder: (_) => _MergeDialog(
        currentId: widget.id,
        api: _api,
        onMerge: _mergeTicket,
      ),
    );
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
          if (_ticket != null) ...[
            IconButton(
              icon: const Icon(Icons.bedtime_outlined),
              tooltip: 'Snooze Ticket',
              onPressed: _showSnoozeSheet,
            ),
            IconButton(
              icon: const Icon(Icons.merge_type_rounded),
              tooltip: 'Merge Ticket',
              onPressed: _showMergeDialog,
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              tooltip: 'Change Status',
              onSelected: _updateStatus,
              itemBuilder: (_) => _statuses.map((s) => PopupMenuItem(
                value: s,
                child: Row(children: [
                  if ((_ticket!['status'] ?? '') == s) ...[
                    const Icon(Icons.check, size: 16, color: AppColors.primary),
                    const SizedBox(width: 8),
                  ] else
                    const SizedBox(width: 24),
                  Text(s),
                ]),
              )).toList(),
            ),
          ],
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: const [
            Tab(text: 'Details'),
            Tab(text: 'Comments'),
            Tab(text: 'Watchers'),
            Tab(text: 'Tasks'),
            Tab(text: 'Activity'),
            Tab(text: 'Time'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ticket == null
              ? const Center(child: Text('Ticket not found.'))
              : Column(
                  children: [
                    // Collision warning banner
                    if (_otherViewers.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        color: const Color(0xFFFEF3C7),
                        child: Row(children: [
                          const Icon(Icons.visibility_outlined, size: 16, color: Color(0xFFD97706)),
                          const SizedBox(width: 8),
                          Expanded(child: Text(
                            'Also viewing: ${_otherViewers.map((v) => v['agentName'] ?? v['userName'] ?? 'Agent').join(', ')}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                          )),
                          const SizedBox(width: 8),
                          const Text(
                            'Replies may conflict',
                            style: TextStyle(fontSize: 11, color: Color(0xFFB45309), fontStyle: FontStyle.italic),
                          ),
                        ]),
                      ),
                    Expanded(
                      child: TabBarView(
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
                            draftSavedAt: _draftSavedAt,
                            onDiscardDraft: _discardDraft,
                          ),
                          _WatchersTab(
                            watchers: _watchers,
                            onAdd: _addWatcher,
                            onRemove: _removeWatcher,
                          ),
                          _TasksTab(
                            tasks: _tasks,
                            onAdd: _addTask,
                            onToggle: _toggleTask,
                            onDelete: _deleteTask,
                          ),
                          _ActivityTab(activity: _activity),
                          _TimeTab(
                            ticketId: widget.id,
                            timeEntries: _timeEntries,
                            api: _api,
                            onEntriesChanged: (entries) => setState(() => _timeEntries = entries),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}

// ─── Details Tab ─────────────────────────────────────────────────────────────

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
          _InfoCard(children: [
            Text(ticket['title'] ?? ticket['subject'] ?? 'No subject', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(ticket['description'] ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
          ]),
          const SizedBox(height: 12),
          _InfoCard(children: [
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Status', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                const SizedBox(height: 4),
                StatusBadge(status: ticket['status'] ?? 'NEW'),
              ])),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Priority', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                const SizedBox(height: 4),
                PriorityBadge(priority: ticket['priority'] ?? 'MEDIUM'),
              ])),
            ]),
          ]),
          const SizedBox(height: 12),
          _InfoCard(children: [
            _DetailRow(
              label: 'Created By',
              value: createdBy?['fullName'] ?? 'Unknown',
              onTap: createdBy?['id'] != null ? () => context.push('/agent/customers/\${createdBy!['id']}') : null,
            ),
            const Divider(height: 16),
            _DetailRow(label: 'Assigned To', value: assignedAgent?['fullName'] ?? 'Unassigned'),
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
          ]),
          const SizedBox(height: 16),
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

// ─── Watchers Tab ─────────────────────────────────────────────────────────────

class _WatchersTab extends StatefulWidget {
  final List<dynamic> watchers;
  final Future<void> Function(String email) onAdd;
  final Future<void> Function(String email) onRemove;

  const _WatchersTab({required this.watchers, required this.onAdd, required this.onRemove});

  @override
  State<_WatchersTab> createState() => _WatchersTabState();
}

class _WatchersTabState extends State<_WatchersTab> {
  final _emailCtrl = TextEditingController();
  bool _adding = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) return;
    setState(() => _adding = true);
    await widget.onAdd(email);
    _emailCtrl.clear();
    if (mounted) setState(() => _adding = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    hintText: 'Add watcher by email...',
                    hintStyle: const TextStyle(color: AppColors.textTertiary, fontSize: 14),
                    filled: true,
                    fillColor: AppColors.surface,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
                  ),
                  onSubmitted: (_) => _submit(),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 46,
                child: ElevatedButton(
                  onPressed: _adding ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  child: _adding
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Add'),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: widget.watchers.isEmpty
              ? const Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.visibility_off_outlined, size: 40, color: AppColors.textTertiary),
                    SizedBox(height: 8),
                    Text('No watchers yet', style: TextStyle(color: AppColors.textSecondary)),
                  ]),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: widget.watchers.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final w = widget.watchers[i] as Map<String, dynamic>;
                    final email = w['email'] ?? w['userEmail'] ?? '';
                    final name = w['fullName'] ?? w['name'] ?? email;
                    final initials = name.isNotEmpty ? name.trim().split(' ').map((p) => p.isNotEmpty ? p[0] : '').take(2).join().toUpperCase() : '?';
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.primary.withOpacity(0.12),
                          child: Text(initials, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                          Text(email, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ])),
                        IconButton(
                          icon: const Icon(Icons.person_remove_outlined, size: 20, color: AppColors.error),
                          tooltip: 'Remove watcher',
                          onPressed: () => widget.onRemove(email),
                        ),
                      ]),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

class _TasksTab extends StatefulWidget {
  final List<dynamic> tasks;
  final Future<void> Function(String title) onAdd;
  final Future<void> Function(String taskId) onToggle;
  final Future<void> Function(String taskId) onDelete;

  const _TasksTab({required this.tasks, required this.onAdd, required this.onToggle, required this.onDelete});

  @override
  State<_TasksTab> createState() => _TasksTabState();
}

class _TasksTabState extends State<_TasksTab> {
  final _titleCtrl = TextEditingController();
  bool _adding = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _titleCtrl.text.trim();
    if (title.isEmpty) return;
    setState(() => _adding = true);
    await widget.onAdd(title);
    _titleCtrl.clear();
    if (mounted) setState(() => _adding = false);
  }

  @override
  Widget build(BuildContext context) {
    final completed = widget.tasks.where((t) => t['completed'] == true).length;
    return Column(
      children: [
        if (widget.tasks.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              Text('$completed / ${widget.tasks.length} completed',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
              const SizedBox(width: 8),
              Expanded(child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: widget.tasks.isEmpty ? 0 : completed / widget.tasks.length,
                  backgroundColor: AppColors.border,
                  color: AppColors.success,
                  minHeight: 6,
                ),
              )),
            ]),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _titleCtrl,
                decoration: InputDecoration(
                  hintText: 'Add a task...',
                  hintStyle: const TextStyle(color: AppColors.textTertiary, fontSize: 14),
                  filled: true,
                  fillColor: AppColors.surface,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
                ),
                onSubmitted: (_) => _submit(),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              height: 46,
              child: ElevatedButton(
                onPressed: _adding ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: _adding
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.add),
              ),
            ),
          ]),
        ),
        Expanded(
          child: widget.tasks.isEmpty
              ? const Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.checklist_outlined, size: 40, color: AppColors.textTertiary),
                    SizedBox(height: 8),
                    Text('No tasks yet', style: TextStyle(color: AppColors.textSecondary)),
                  ]),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  itemCount: widget.tasks.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 6),
                  itemBuilder: (_, i) {
                    final t = widget.tasks[i] as Map<String, dynamic>;
                    final taskId = t['id'].toString();
                    final completed = t['completed'] == true;
                    return Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: completed ? AppColors.success.withOpacity(0.3) : AppColors.border),
                      ),
                      child: CheckboxListTile(
                        value: completed,
                        onChanged: (_) => widget.onToggle(taskId),
                        title: Text(
                          t['title'] ?? '',
                          style: TextStyle(
                            fontSize: 14,
                            color: completed ? AppColors.textTertiary : AppColors.textPrimary,
                            decoration: completed ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        activeColor: AppColors.success,
                        controlAffinity: ListTileControlAffinity.leading,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                        secondary: IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                          onPressed: () => widget.onDelete(taskId),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// ─── Merge Dialog ─────────────────────────────────────────────────────────────

class _MergeDialog extends StatefulWidget {
  final String currentId;
  final ApiClient api;
  final Future<void> Function(String targetId) onMerge;

  const _MergeDialog({required this.currentId, required this.api, required this.onMerge});

  @override
  State<_MergeDialog> createState() => _MergeDialogState();
}

class _MergeDialogState extends State<_MergeDialog> {
  final _searchCtrl = TextEditingController();
  List<dynamic> _results = [];
  bool _searching = false;
  bool _merging = false;
  String? _selectedId;
  String? _selectedLabel;

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) return;
    setState(() => _searching = true);
    try {
      final res = await widget.api.get(ApiEndpoints.tickets, queryParameters: {'search': query, 'size': 10});
      final data = res.data['data'];
      final items = data is Map ? (data['content'] ?? []) : (data ?? []);
      setState(() {
        _results = (items as List).where((t) => t['id'].toString() != widget.currentId).toList();
        _searching = false;
      });
    } catch (_) {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Merge Ticket'),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'This ticket will be closed and its comments moved to the target ticket.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search tickets by subject or ID...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searching ? const Padding(padding: EdgeInsets.all(10), child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))) : null,
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              onSubmitted: _search,
            ),
            if (_results.isNotEmpty) ...[
              const SizedBox(height: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 220),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _results.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 4),
                  itemBuilder: (_, i) {
                    final t = _results[i] as Map<String, dynamic>;
                    final id = t['id'].toString();
                    final isSelected = _selectedId == id;
                    return InkWell(
                      onTap: () => setState(() {
                        _selectedId = id;
                        _selectedLabel = '${t['ticketNumber'] ?? '#$id'} — ${t['subject'] ?? t['title'] ?? ''}';
                      }),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryLight : AppColors.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
                        ),
                        child: Row(children: [
                          if (isSelected) const Icon(Icons.check_circle, size: 16, color: AppColors.primary) else const Icon(Icons.confirmation_number_outlined, size: 16, color: AppColors.textTertiary),
                          const SizedBox(width: 8),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(t['subject'] ?? t['title'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                            Text('#${t['ticketNumber'] ?? id} · ${t['status'] ?? ''}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          ])),
                        ]),
                      ),
                    );
                  },
                ),
              ),
            ],
            if (_selectedLabel != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.warningBg, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.warning.withOpacity(0.3))),
                child: Row(children: [
                  const Icon(Icons.warning_amber_rounded, size: 16, color: AppColors.warning),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Will merge into: $_selectedLabel', style: const TextStyle(fontSize: 12, color: AppColors.textPrimary))),
                ]),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: (_selectedId == null || _merging) ? null : () async {
            setState(() => _merging = true);
            await widget.onMerge(_selectedId!);
            if (mounted) Navigator.pop(context);
          },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
          child: _merging
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Merge'),
        ),
      ],
    );
  }
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────

class _CommentsTab extends StatelessWidget {
  final List<dynamic> comments;
  final TextEditingController commentController;
  final bool internalNote;
  final bool submitting;
  final ValueChanged<bool> onToggleInternal;
  final VoidCallback onSend;
  final DateTime? draftSavedAt;
  final VoidCallback? onDiscardDraft;

  const _CommentsTab({
    required this.comments,
    required this.commentController,
    required this.internalNote,
    required this.submitting,
    required this.onToggleInternal,
    required this.onSend,
    this.draftSavedAt,
    this.onDiscardDraft,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: comments.isEmpty
              ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.chat_bubble_outline, size: 40, color: AppColors.textTertiary),
                  SizedBox(height: 8),
                  Text('No comments yet', style: TextStyle(color: AppColors.textSecondary)),
                ]))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: comments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _CommentBubble(comment: comments[i]),
                ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
          decoration: const BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.border))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              GestureDetector(
                onTap: () => onToggleInternal(!internalNote),
                child: Row(children: [
                  Icon(internalNote ? Icons.lock_outlined : Icons.public_outlined, size: 16, color: internalNote ? AppColors.warning : AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(internalNote ? 'Internal Note' : 'Public Reply',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: internalNote ? AppColors.warning : AppColors.textSecondary)),
                ]),
              ),
              const SizedBox(width: 8),
              Transform.scale(scale: 0.8, child: Switch(value: internalNote, onChanged: onToggleInternal, activeColor: AppColors.warning)),
            ]),
            if (draftSavedAt != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(children: [
                  const Icon(Icons.save_outlined, size: 12, color: AppColors.textTertiary),
                  const SizedBox(width: 4),
                  Text('Draft saved', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: onDiscardDraft,
                    child: const Text('Discard', style: TextStyle(fontSize: 11, color: AppColors.error, fontWeight: FontWeight.w600)),
                  ),
                ]),
              ),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Expanded(
                child: TextField(
                  controller: commentController,
                  decoration: InputDecoration(
                    hintText: internalNote ? 'Add internal note...' : 'Reply to customer...',
                    isDense: true,
                    filled: true,
                    fillColor: internalNote ? AppColors.warningBg : AppColors.surfaceVariant,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
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
            ]),
          ]),
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
        border: Border.all(color: isInternal ? AppColors.warning.withOpacity(0.3) : AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
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
              decoration: BoxDecoration(color: AppColors.warningBg, borderRadius: BorderRadius.circular(4), border: Border.all(color: AppColors.warning.withOpacity(0.3))),
              child: const Text('Internal', style: TextStyle(fontSize: 9, color: AppColors.warning, fontWeight: FontWeight.w700)),
            ),
          ],
          const Spacer(),
          Text(formatTimeAgo(comment['createdAt']), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
        ]),
        const SizedBox(height: 8),
        Text(body, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary)),
      ]),
    );
  }
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

class _ActivityTab extends StatelessWidget {
  final List<dynamic> activity;
  const _ActivityTab({required this.activity});

  @override
  Widget build(BuildContext context) {
    if (activity.isEmpty) {
      return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.history, size: 40, color: AppColors.textTertiary),
        SizedBox(height: 8),
        Text('No activity recorded', style: TextStyle(color: AppColors.textSecondary)),
      ]));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: activity.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final item = activity[i] as Map<String, dynamic>;
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(width: 8, height: 8, margin: const EdgeInsets.only(top: 4), decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item['description'] ?? item['action'] ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text(formatTimeAgo(item['createdAt']), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
            ])),
          ]),
        );
      },
    );
  }
}

// ─── Shared Widgets ───────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  final List<Widget> children;
  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
  );
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final VoidCallback? onTap;
  const _DetailRow({required this.label, required this.value, this.valueColor, this.onTap});

  @override
  Widget build(BuildContext context) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
    SizedBox(width: 110, child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textTertiary))),
    Expanded(child: onTap != null
        ? GestureDetector(
            onTap: onTap,
            child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF4F46E5), decoration: TextDecoration.underline)),
          )
        : Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor ?? AppColors.textPrimary))),
  ]);
}

// ─── Time Tab ─────────────────────────────────────────────────────────────────

class _TimeTab extends StatefulWidget {
  final String ticketId;
  final List<dynamic> timeEntries;
  final ApiClient api;
  final ValueChanged<List<dynamic>> onEntriesChanged;

  const _TimeTab({
    required this.ticketId,
    required this.timeEntries,
    required this.api,
    required this.onEntriesChanged,
  });

  @override
  State<_TimeTab> createState() => _TimeTabState();
}

class _TimeTabState extends State<_TimeTab> {
  bool _submitting = false;
  int _hours = 0;
  int _mins = 0;
  String _note = '';

  int get _totalMinutes => widget.timeEntries.fold<int>(
      0, (sum, e) => sum + ((e['minutes'] as num?)?.toInt() ?? 0));

  String _fmtMinutes(int total) {
    final h = total ~/ 60;
    final m = total % 60;
    if (h > 0 && m > 0) return '${h}h ${m}m';
    if (h > 0) return '${h}h';
    return '${m}m';
  }

  Future<void> _logTime() async {
    final minutes = _hours * 60 + _mins;
    if (minutes <= 0) return;
    setState(() => _submitting = true);
    try {
      final res = await widget.api.post(
        ApiEndpoints.ticketTimeEntries(widget.ticketId),
        data: {'minutes': minutes, if (_note.isNotEmpty) 'note': _note},
      );
      final entry = res.data['data'];
      widget.onEntriesChanged([entry, ...widget.timeEntries]);
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Time logged: ${_fmtMinutes(minutes)}'), backgroundColor: AppColors.success),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to log time'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _deleteEntry(String entryId) async {
    try {
      await widget.api.delete(ApiEndpoints.ticketTimeEntry(widget.ticketId, entryId));
      widget.onEntriesChanged(widget.timeEntries.where((e) => e['id'].toString() != entryId).toList());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete entry'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _showLogSheet() {
    _hours = 0;
    _mins = 0;
    _note = '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Log Time', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Hours', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                  const SizedBox(height: 4),
                  TextFormField(
                    initialValue: '0',
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    onChanged: (v) => setModalState(() => _hours = int.tryParse(v) ?? 0),
                  ),
                ])),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Minutes', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                  const SizedBox(height: 4),
                  TextFormField(
                    initialValue: '0',
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    onChanged: (v) => setModalState(() => _mins = (int.tryParse(v) ?? 0).clamp(0, 59)),
                  ),
                ])),
              ]),
              const SizedBox(height: 12),
              const Text('Note (optional)', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
              const SizedBox(height: 4),
              TextFormField(
                maxLines: 2,
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'What did you work on?', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                onChanged: (v) => setModalState(() => _note = v),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_hours == 0 && _mins == 0) || _submitting ? null : _logTime,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(_submitting ? 'Saving...' : 'Save Entry'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.timeEntries.isEmpty
            ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.timer_outlined, size: 40, color: AppColors.textTertiary),
                SizedBox(height: 8),
                Text('No time logged yet', style: TextStyle(color: AppColors.textSecondary)),
              ]))
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                itemCount: widget.timeEntries.length + 1,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  if (i == 0) {
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Row(children: [
                        const Icon(Icons.timer_outlined, color: Color(0xFF1D4ED8), size: 18),
                        const SizedBox(width: 8),
                        Text('Total: ${_fmtMinutes(_totalMinutes)}',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
                      ]),
                    );
                  }
                  final entry = widget.timeEntries[i - 1] as Map<String, dynamic>;
                  final agentName = entry['agentName'] ?? 'Agent';
                  final minutes = (entry['minutes'] as num?)?.toInt() ?? 0;
                  final note = entry['note'] as String?;
                  final loggedAt = entry['loggedAt'] as String?;
                  final entryId = entry['id']?.toString() ?? '';

                  return Dismissible(
                    key: Key(entryId),
                    direction: DismissDirection.endToStart,
                    background: Container(
                      alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 16),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.delete_outline, color: Colors.white),
                    ),
                    onDismissed: (_) => _deleteEntry(entryId),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Text(agentName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(8)),
                              child: Text(_fmtMinutes(minutes), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
                            ),
                            if (loggedAt != null) ...[
                              const SizedBox(width: 8),
                              Text(loggedAt.substring(0, 10), style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                            ],
                          ]),
                          if (note != null && note.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(note, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ])),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18),
                          color: AppColors.textTertiary,
                          onPressed: () => _deleteEntry(entryId),
                          visualDensity: VisualDensity.compact,
                          padding: EdgeInsets.zero,
                        ),
                      ]),
                    ),
                  );
                },
              ),
        Positioned(
          bottom: 16,
          right: 16,
          child: FloatingActionButton.small(
            onPressed: _showLogSheet,
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.add, color: Colors.white),
          ),
        ),
      ],
    );
  }
}
