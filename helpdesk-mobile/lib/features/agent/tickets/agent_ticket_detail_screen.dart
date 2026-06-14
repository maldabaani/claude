import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/time_ago.dart';
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
  List<dynamic> _links = [];
  List<dynamic> _children = [];
  bool _loading = true;
  bool _submitting = false;
  bool _internalNote = false;
  List<dynamic> _ticketManagedTags = [];

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
    _tabController = TabController(length: 8, vsync: this);
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
        _api.get(ApiEndpoints.ticketTags(widget.id)),
        _api.get(ApiEndpoints.ticketLinks(widget.id)),
        _api.get(ApiEndpoints.ticketChildren(widget.id)),
      ]);
      if (mounted) {
        final commentsData = results[1].data['data'];
        setState(() {
          _ticket = results[0].data['data'];
          _comments = commentsData is Map ? (commentsData['content'] ?? []) : (commentsData ?? []);
          _watchers = results[2].data['data'] ?? [];
          _tasks = results[3].data['data'] ?? [];
          _timeEntries = results[4].data['data'] ?? [];
          _ticketManagedTags = results[5].data['data'] ?? [];
          _links = results[6].data['data'] ?? [];
          _children = results[7].data['data'] ?? [];
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

  Future<void> _splitTicket({
    required String subject,
    required String description,
    String? departmentId,
    String? priority,
    List<String>? commentIds,
  }) async {
    try {
      final body = <String, dynamic>{
        'subject': subject,
        'description': description,
        if (departmentId != null) 'departmentId': departmentId,
        if (priority != null) 'priority': priority,
        if (commentIds != null && commentIds.isNotEmpty) 'commentIds': commentIds,
      };
      final res = await _api.post(ApiEndpoints.ticketSplit(widget.id), data: body);
      final newTicket = res.data['data'] as Map<String, dynamic>? ?? {};
      final newNumber = newTicket['ticketNumber'] ?? newTicket['id'] ?? '';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Split into #$newNumber'), backgroundColor: const Color(0xFF7C3AED)),
        );
        await _load();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to split ticket'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _showSplitDialog() {
    final ticket = _ticket;
    if (ticket == null) return;
    showDialog(
      context: context,
      builder: (_) => _SplitDialog(
        currentTicket: ticket,
        api: _api,
        onSplit: _splitTicket,
      ),
    );
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


  Future<void> _showMacroSheet() async {
    List<dynamic> macros = [];
    try {
      final resp = await _api.get(ApiEndpoints.macros);
      final data = resp.data['data'];
      macros = data is List ? data : [];
    } catch (_) {}
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.5,
        maxChildSize: 0.85,
        builder: (_, scrollCtrl) => Column(children: [
          Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 8), child: Row(children: [
            const Icon(Icons.flash_on_outlined, color: AppColors.primary),
            const SizedBox(width: 8),
            const Text('Run Macro', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          ])),
          const Divider(height: 1),
          if (macros.isEmpty)
            const Padding(padding: EdgeInsets.all(32), child: Center(child: Text('No macros available', style: TextStyle(color: AppColors.textSecondary))))
          else
            Expanded(child: ListView.separated(
              controller: scrollCtrl,
              padding: const EdgeInsets.all(12),
              itemCount: macros.length,
              separatorBuilder: (_, __) => const SizedBox(height: 6),
              itemBuilder: (_, i) {
                final m = macros[i] as Map<String, dynamic>;
                final actions = m['actions'];
                List<dynamic> actionList = actions is List ? actions : [];
                return InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () async {
                    Navigator.pop(context);
                    try {
                      await _api.post(ApiEndpoints.applyMacro(m['id'].toString(), widget.id), data: {});
                      await _load();
                    } catch (_) {}
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(m['name'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      if ((m['description'] ?? '').isNotEmpty)
                        Text(m['description'], style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      if (actionList.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Wrap(spacing: 4, runSpacing: 4, children: actionList.map((a) {
                          final type = (a['type'] as String?) ?? '';
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
                            child: Text(type, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF4338CA))));
                        }).toList()),
                      ],
                    ])),
                );
              })),
        ]),
      ),
    );
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
              icon: const Icon(Icons.flash_on_outlined),
              tooltip: 'Run Macro',
              onPressed: _showMacroSheet,
            ),
            IconButton(
              icon: const Icon(Icons.bedtime_outlined),
              tooltip: 'Snooze Ticket',
              onPressed: _showSnoozeSheet,
            ),
            IconButton(
              icon: const Icon(Icons.call_split_rounded),
              tooltip: 'Split Ticket',
              onPressed: _showSplitDialog,
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
            Tab(text: 'Links'),
            Tab(text: 'Sub-tickets'),
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
                          _DetailsTab(ticket: _ticket!, onAssignToMe: _assignToMe, onStatusChange: _updateStatus, managedTags: _ticketManagedTags, onTagsChanged: (tags) { setState(() => _ticketManagedTags = tags); }),
                          _CommentsTab(
                            ticketId: widget.id,
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
                          _LinksTab(
                            ticketId: widget.id,
                            links: _links,
                            api: _api,
                            onLinksChanged: (links) => setState(() => _links = links),
                          ),
                          _SubTicketsTab(
                            ticketId: widget.id,
                            ticket: _ticket!,
                            children: _children,
                            api: _api,
                            onChildrenChanged: (children) => setState(() => _children = children),
                            onRefresh: _load,
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

class _DetailsTab extends StatefulWidget {
  final Map<String, dynamic> ticket;
  final VoidCallback onAssignToMe;
  final ValueChanged<String> onStatusChange;
  final List<dynamic> managedTags;
  final ValueChanged<List<dynamic>> onTagsChanged;

  const _DetailsTab({required this.ticket, required this.onAssignToMe, required this.onStatusChange, required this.managedTags, required this.onTagsChanged});

  @override
  State<_DetailsTab> createState() => _DetailsTabState();
}

class _DetailsTabState extends State<_DetailsTab> {
  final _api = ApiClient();
  final _tagSearchCtrl = TextEditingController();
  List<dynamic> _tagSuggestions = [];
  bool _showSuggestions = false;

  @override
  void dispose() { _tagSearchCtrl.dispose(); super.dispose(); }

  Future<void> _searchTags(String q) async {
    if (q.isEmpty) { setState(() { _tagSuggestions = []; _showSuggestions = false; }); return; }
    try {
      final resp = await _api.get(ApiEndpoints.tagSearch, queryParams: {'q': q});
      final data = resp.data['data'];
      final currentIds = widget.managedTags.map((t) => t['id']).toSet();
      if (mounted) setState(() {
        _tagSuggestions = (data is List ? data : []).where((t) => !currentIds.contains(t['id'])).toList();
        _showSuggestions = _tagSuggestions.isNotEmpty;
      });
    } catch (_) {}
  }

  Future<void> _addTag(Map<String, dynamic> tag) async {
    final ticketId = widget.ticket['id'];
    final updated = [...widget.managedTags, tag];
    widget.onTagsChanged(updated);
    await _api.put(ApiEndpoints.ticketTags(ticketId), data: {'tagIds': updated.map((t) => t['id']).toList()});
    setState(() { _tagSearchCtrl.clear(); _tagSuggestions = []; _showSuggestions = false; });
  }

  Future<void> _removeTag(Map<String, dynamic> tag) async {
    final ticketId = widget.ticket['id'];
    final updated = widget.managedTags.where((t) => t['id'] != tag['id']).toList();
    widget.onTagsChanged(updated);
    await _api.put(ApiEndpoints.ticketTags(ticketId), data: {'tagIds': updated.map((t) => t['id']).toList()});
  }

  Color _hexToColor(String hex) {
    try { return Color(int.parse(hex.replaceFirst('#', '0xFF'))); } catch (_) { return const Color(0xFF6366F1); }
  }

  @override
  Widget build(BuildContext context) {
    final ticket = widget.ticket;
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
              onTap: createdBy?['id'] != null ? () => context.push('/agent/customers/${createdBy!['id']}') : null,
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
                value: _formatDate(dueDate as String?),
                valueColor: (ticket['slaBreached'] == true) ? AppColors.error : AppColors.textPrimary,
              ),
            ],
          ]),
          const SizedBox(height: 12),
          // Tags section
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Tags', style: TextStyle(fontSize: 12, color: AppColors.textTertiary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              if (widget.managedTags.isNotEmpty)
                Wrap(spacing: 6, runSpacing: 6, children: widget.managedTags.map((tag) {
                  final color = _hexToColor(tag['color'] ?? '#6366F1');
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(tag['name'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => _removeTag(tag),
                        child: const Icon(Icons.close, size: 12, color: Colors.white),
                      ),
                    ]),
                  );
                }).toList()),
              if (widget.managedTags.isEmpty)
                const Text('No tags', style: TextStyle(fontSize: 12, color: AppColors.textTertiary, fontStyle: FontStyle.italic)),
              const SizedBox(height: 8),
              Stack(children: [
                TextField(
                  controller: _tagSearchCtrl,
                  decoration: const InputDecoration(
                    hintText: '+ Add tag...',
                    hintStyle: TextStyle(fontSize: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    isDense: true,
                  ),
                  style: const TextStyle(fontSize: 12),
                  onChanged: _searchTags,
                ),
              ]),
              if (_showSuggestions && _tagSuggestions.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 4))],
                  ),
                  child: Column(children: _tagSuggestions.take(6).map((t) => InkWell(
                    onTap: () => _addTag(t as Map<String, dynamic>),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(children: [
                        Container(width: 12, height: 12, decoration: BoxDecoration(
                          color: _hexToColor(t['color'] ?? '#6366F1'), shape: BoxShape.circle)),
                        const SizedBox(width: 8),
                        Text(t['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                      ]),
                    ),
                  )).toList()),
                ),
            ]),
          ),
          const SizedBox(height: 16),
          if (assignedAgent == null)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: widget.onAssignToMe,
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

// ─── Split Dialog ─────────────────────────────────────────────────────────────

class _SplitDialog extends StatefulWidget {
  final Map<String, dynamic> currentTicket;
  final ApiClient api;
  final Future<void> Function({
    required String subject,
    required String description,
    String? departmentId,
    String? priority,
    List<String>? commentIds,
  }) onSplit;

  const _SplitDialog({required this.currentTicket, required this.api, required this.onSplit});

  @override
  State<_SplitDialog> createState() => _SplitDialogState();
}

class _SplitDialogState extends State<_SplitDialog> {
  late final TextEditingController _subjectCtrl;
  late final TextEditingController _descCtrl;
  bool _splitting = false;
  String _priority = 'MEDIUM';

  final _priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  @override
  void initState() {
    super.initState();
    final title = widget.currentTicket['title'] ?? widget.currentTicket['subject'] ?? '';
    _subjectCtrl = TextEditingController(text: 'Split: $title');
    _descCtrl = TextEditingController();
    _priority = widget.currentTicket['priority'] ?? 'MEDIUM';
  }

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(children: [
        Icon(Icons.call_split_rounded, color: Color(0xFF7C3AED)),
        SizedBox(width: 8),
        Text('Split Ticket'),
      ]),
      content: SizedBox(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Create a new ticket from this one.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              const Text('Subject', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _subjectCtrl,
                decoration: InputDecoration(
                  hintText: 'New ticket subject...',
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
              const SizedBox(height: 12),
              const Text('Description', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _descCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Describe the issue...',
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
              const SizedBox(height: 12),
              const Text('Priority', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                items: _priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                onChanged: (v) => setState(() => _priority = v ?? _priority),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _splitting ? null : () async {
            final subject = _subjectCtrl.text.trim();
            if (subject.isEmpty) return;
            setState(() => _splitting = true);
            await widget.onSplit(
              subject: subject,
              description: _descCtrl.text.trim(),
              priority: _priority,
            );
            if (mounted) Navigator.pop(context);
          },
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7C3AED), foregroundColor: Colors.white),
          child: _splitting
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Split'),
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
      final res = await widget.api.get(ApiEndpoints.tickets, queryParams: {'search': query, 'size': '10'});
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

class _CommentsTab extends StatefulWidget {
  final String ticketId;
  final List<dynamic> comments;
  final TextEditingController commentController;
  final bool internalNote;
  final bool submitting;
  final ValueChanged<bool> onToggleInternal;
  final VoidCallback onSend;
  final DateTime? draftSavedAt;
  final VoidCallback? onDiscardDraft;

  const _CommentsTab({
    required this.ticketId,
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
  State<_CommentsTab> createState() => _CommentsTabState();
}

class _CommentsTabState extends State<_CommentsTab> {
  final _api = ApiClient();
  bool _aiLoading = false;
  String _aiError = '';
  Map<String, dynamic>? _aiSuggestion;

  // AI Summary state
  bool _summaryLoading = false;
  String? _summaryError;
  String? _aiSummary;

  // Sentiment state
  bool _sentimentLoading = false;
  String? _sentimentError;
  Map<String, dynamic>? _sentiment;

  // Smart Reply state
  bool _smartReplyLoading = false;

  // Auto-Categorize state
  bool _autoCategorizeLoading = false;

  // Editable fields shown in the suggestion card
  final _aiCategoryCtrl = TextEditingController();
  final _aiPriorityCtrl = TextEditingController();
  final _aiResponseCtrl = TextEditingController();

  @override
  void dispose() {
    _aiCategoryCtrl.dispose();
    _aiPriorityCtrl.dispose();
    _aiResponseCtrl.dispose();
    super.dispose();
  }

  Future<void> _requestAiSuggestion() async {
    setState(() { _aiLoading = true; _aiError = ''; _aiSuggestion = null; });
    try {
      final res = await _api.post(ApiEndpoints.ticketAiSuggestions(widget.ticketId), data: {});
      final data = res.data['data'] as Map<String, dynamic>;
      _aiCategoryCtrl.text = data['category'] ?? '';
      _aiPriorityCtrl.text = data['priority'] ?? '';
      _aiResponseCtrl.text = data['suggestedResponse'] ?? '';
      if (mounted) setState(() { _aiSuggestion = data; _aiLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _aiError = 'Failed to get AI suggestion'; _aiLoading = false; });
    }
  }

  void _applyAiSuggestion() {
    widget.commentController.text = _aiResponseCtrl.text;
    setState(() => _aiSuggestion = null);
  }

  void _dismissAiSuggestion() => setState(() { _aiSuggestion = null; _aiError = ''; });

  Future<void> _requestAiSummary() async {
    setState(() { _summaryLoading = true; _summaryError = null; });
    try {
      final response = await _api.post(ApiEndpoints.ticketAiSummary(widget.ticketId), data: {});
      setState(() {
        _aiSummary = response.data['summary'] as String;
        _summaryLoading = false;
      });
    } catch (e) {
      setState(() {
        _summaryError = 'Failed to generate summary.';
        _summaryLoading = false;
      });
    }
  }

  void _dismissAiSummary() => setState(() { _aiSummary = null; _summaryError = null; });

  Future<void> _requestSentiment() async {
    setState(() { _sentimentLoading = true; _sentimentError = null; });
    try {
      final response = await _api.post(ApiEndpoints.ticketAiSentiment(widget.ticketId), data: {});
      setState(() {
        _sentiment = Map<String, dynamic>.from(response.data);
        _sentimentLoading = false;
      });
    } catch (e) {
      setState(() {
        _sentimentError = 'Failed to analyze sentiment.';
        _sentimentLoading = false;
      });
    }
  }

  void _dismissSentiment() => setState(() { _sentiment = null; _sentimentError = null; });

  Future<void> _autoCategorize() async {
    setState(() => _autoCategorizeLoading = true);
    try {
      await _api.post(ApiEndpoints.ticketAiAutoCategorize(widget.ticketId), data: {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket categorized by AI'), backgroundColor: Color(0xFF7C3AED)),
        );
        setState(() => _autoCategorizeLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _autoCategorizeLoading = false);
    }
  }

  Future<void> _requestSmartReply() async {
    setState(() => _smartReplyLoading = true);
    try {
      final response = await _api.post(ApiEndpoints.ticketAiSmartReply(widget.ticketId), data: {});
      final reply = response.data['reply'] as String? ?? '';
      widget.commentController.text = reply;
      if (mounted) setState(() => _smartReplyLoading = false);
    } catch (e) {
      if (mounted) setState(() => _smartReplyLoading = false);
    }
  }

  Color _sentimentColor(String sentiment) {
    switch (sentiment) {
      case 'positive': return const Color(0xFF16A34A);
      case 'negative':
      case 'frustrated': return const Color(0xFFDC2626);
      case 'urgent': return const Color(0xFFEA580C);
      default: return const Color(0xFF6B7280);
    }
  }

  Color _scoreColor(int score) {
    if (score >= 7) return const Color(0xFF4ADE80);
    if (score >= 4) return const Color(0xFFFBBF24);
    return const Color(0xFFF87171);
  }

  String _capitalize(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: widget.comments.isEmpty
              ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.chat_bubble_outline, size: 40, color: AppColors.textTertiary),
                  SizedBox(height: 8),
                  Text('No comments yet', style: TextStyle(color: AppColors.textSecondary)),
                ]))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: widget.comments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _CommentBubble(comment: widget.comments[i]),
                ),
        ),

        // ── AI Suggestion Card ──────────────────────────────────────────────
        if (_aiSuggestion != null)
          Container(
            margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F3FF),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF7C3AED).withOpacity(0.3)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.auto_awesome, size: 16, color: Color(0xFF7C3AED)),
                const SizedBox(width: 6),
                const Expanded(
                  child: Text('AI Suggestion — review and edit before applying',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF7C3AED))),
                ),
                GestureDetector(
                  onTap: _dismissAiSuggestion,
                  child: const Icon(Icons.close, size: 18, color: Color(0xFF7C3AED)),
                ),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Category', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _aiCategoryCtrl,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      isDense: true,
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                    ),
                  ),
                ])),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Priority', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _aiPriorityCtrl,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      isDense: true,
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                    ),
                  ),
                ])),
              ]),
              const SizedBox(height: 10),
              const Text('Suggested Response', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
              const SizedBox(height: 4),
              TextField(
                controller: _aiResponseCtrl,
                maxLines: 4,
                minLines: 2,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  isDense: true,
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                ),
              ),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                TextButton(
                  onPressed: _dismissAiSuggestion,
                  child: const Text('Dismiss', style: TextStyle(color: AppColors.textSecondary)),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _applyAiSuggestion,
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Apply to Reply'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ]),
            ]),
          ),

        if (_aiError.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
            child: Text(_aiError, style: const TextStyle(fontSize: 12, color: AppColors.error)),
          ),

        // ── Sentiment Card ───────────────────────────────────────────────────
        if (_sentiment != null)
          Container(
            margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.favorite_outline, size: 16, color: Color(0xFFD97706)),
                const SizedBox(width: 6),
                const Expanded(
                  child: Text('Customer Sentiment',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFD97706))),
                ),
                GestureDetector(
                  onTap: _dismissSentiment,
                  child: const Icon(Icons.close, size: 18, color: Color(0xFFD97706)),
                ),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: () {
                      final s = _sentiment!['sentiment'] as String? ?? '';
                      if (s == 'positive') return const Color(0xFFDCFCE7);
                      if (s == 'negative' || s == 'frustrated') return const Color(0xFFFEE2E2);
                      if (s == 'urgent') return const Color(0xFFFFEDD5);
                      return const Color(0xFFF1F5F9);
                    }(),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    (_sentiment!['sentiment'] as String? ?? 'neutral').toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: () {
                        final s = _sentiment!['sentiment'] as String? ?? '';
                        if (s == 'positive') return const Color(0xFF15803D);
                        if (s == 'negative' || s == 'frustrated') return const Color(0xFFDC2626);
                        if (s == 'urgent') return const Color(0xFFEA580C);
                        return const Color(0xFF475569);
                      }(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: ((_sentiment!['score'] as num? ?? 5) / 10).toDouble(),
                      backgroundColor: const Color(0xFFE5E7EB),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        (_sentiment!['score'] as num? ?? 5) >= 7
                            ? const Color(0xFF4ADE80)
                            : (_sentiment!['score'] as num? ?? 5) >= 4
                                ? const Color(0xFFFBBF24)
                                : const Color(0xFFF87171),
                      ),
                      minHeight: 8,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text('${_sentiment!['score'] ?? 5}/10',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
              ]),
              const SizedBox(height: 8),
              Text('💡 ${_sentiment!['action'] ?? ''}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF92400E))),
            ]),
          ),
        if (_sentimentError != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
            child: Text(_sentimentError!, style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
          ),

        // ── AI Summary Card ─────────────────────────────────────────────────
        if (_aiSummary != null)
          Container(
            margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDFA),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF0D9488).withOpacity(0.3)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.summarize_outlined, size: 16, color: Color(0xFF0D9488)),
                const SizedBox(width: 6),
                const Expanded(
                  child: Text('AI Summary',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF0D9488))),
                ),
                GestureDetector(
                  onTap: _dismissAiSummary,
                  child: const Icon(Icons.close, size: 18, color: Color(0xFF0D9488)),
                ),
              ]),
              const SizedBox(height: 10),
              Text(_aiSummary!, style: const TextStyle(fontSize: 13, color: Color(0xFF134E4A), height: 1.5)),
            ]),
          ),

        if (_summaryError != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
            child: Text(_summaryError!, style: const TextStyle(fontSize: 12, color: AppColors.error)),
          ),

        // ── Reply Box ───────────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
          decoration: const BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.border))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              GestureDetector(
                onTap: () => widget.onToggleInternal(!widget.internalNote),
                child: Row(children: [
                  Icon(widget.internalNote ? Icons.lock_outlined : Icons.public_outlined, size: 16, color: widget.internalNote ? AppColors.warning : AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(widget.internalNote ? 'Internal Note' : 'Public Reply',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: widget.internalNote ? AppColors.warning : AppColors.textSecondary)),
                ]),
              ),
              const SizedBox(width: 8),
              Transform.scale(scale: 0.8, child: Switch(value: widget.internalNote, onChanged: widget.onToggleInternal, activeColor: AppColors.warning)),
              const Spacer(),
              // AI Suggest button
              _aiLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF7C3AED)))
                  : TextButton.icon(
                      onPressed: _requestAiSuggestion,
                      icon: const Icon(Icons.auto_awesome, size: 15, color: Color(0xFF7C3AED)),
                      label: const Text('AI Suggest', style: TextStyle(fontSize: 12, color: Color(0xFF7C3AED), fontWeight: FontWeight.w600)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Color(0xFF7C3AED), width: 1)),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
              const SizedBox(width: 6),
              // AI Summary button
              _summaryLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0D9488)))
                  : TextButton.icon(
                      onPressed: _requestAiSummary,
                      icon: const Icon(Icons.summarize_outlined, size: 15, color: Color(0xFF0D9488)),
                      label: const Text('AI Summary', style: TextStyle(fontSize: 12, color: Color(0xFF0D9488), fontWeight: FontWeight.w600)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Color(0xFF0D9488), width: 1)),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
              const SizedBox(width: 6),
              // Auto-Categorize button
              _autoCategorizeLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF7C3AED)))
                  : TextButton.icon(
                      onPressed: _autoCategorize,
                      icon: const Icon(Icons.auto_fix_high_outlined, size: 15, color: Color(0xFF7C3AED)),
                      label: const Text('Auto-Cat', style: TextStyle(fontSize: 12, color: Color(0xFF7C3AED), fontWeight: FontWeight.w600)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Color(0xFF7C3AED), width: 1)),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
              const SizedBox(width: 6),
              // Smart Reply button
              _smartReplyLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF059669)))
                  : TextButton.icon(
                      onPressed: _requestSmartReply,
                      icon: const Icon(Icons.reply_outlined, size: 15, color: Color(0xFF059669)),
                      label: const Text('Smart Reply', style: TextStyle(fontSize: 12, color: Color(0xFF059669), fontWeight: FontWeight.w600)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Color(0xFF059669), width: 1)),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
              const SizedBox(width: 6),
              // Sentiment button
              _sentimentLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFD97706)))
                  : TextButton.icon(
                      onPressed: _requestSentiment,
                      icon: const Icon(Icons.favorite_outline, size: 15, color: Color(0xFFD97706)),
                      label: const Text('Sentiment', style: TextStyle(fontSize: 12, color: Color(0xFFD97706), fontWeight: FontWeight.w600)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Color(0xFFD97706), width: 1)),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
            ]),
            if (widget.draftSavedAt != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(children: [
                  const Icon(Icons.save_outlined, size: 12, color: AppColors.textTertiary),
                  const SizedBox(width: 4),
                  const Text('Draft saved', style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: widget.onDiscardDraft,
                    child: const Text('Discard', style: TextStyle(fontSize: 11, color: AppColors.error, fontWeight: FontWeight.w600)),
                  ),
                ]),
              ),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Expanded(
                child: TextField(
                  controller: widget.commentController,
                  decoration: InputDecoration(
                    hintText: widget.internalNote ? 'Add internal note...' : 'Reply to customer...',
                    isDense: true,
                    filled: true,
                    fillColor: widget.internalNote ? AppColors.warningBg : AppColors.surfaceVariant,
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
                  onTap: widget.submitting ? null : widget.onSend,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: widget.submitting
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


// ─── Links Tab ────────────────────────────────────────────────────────────────

class _LinksTab extends StatefulWidget {
  final String ticketId;
  final List<dynamic> links;
  final ApiClient api;
  final ValueChanged<List<dynamic>> onLinksChanged;

  const _LinksTab({
    required this.ticketId,
    required this.links,
    required this.api,
    required this.onLinksChanged,
  });

  @override
  State<_LinksTab> createState() => _LinksTabState();
}

class _LinksTabState extends State<_LinksTab> {
  static const _linkTypes = [
    {'value': 'RELATED_TO', 'label': 'Related To', 'icon': '🔗'},
    {'value': 'BLOCKS', 'label': 'Blocks', 'icon': '🚫'},
    {'value': 'IS_BLOCKED_BY', 'label': 'Is Blocked By', 'icon': '⛔'},
    {'value': 'DUPLICATES', 'label': 'Duplicates', 'icon': '📋'},
    {'value': 'IS_DUPLICATED_BY', 'label': 'Is Duplicated By', 'icon': '📄'},
  ];

  String _selectedLinkType = 'RELATED_TO';

  Map<String, List<dynamic>> _groupLinks() {
    final map = <String, List<dynamic>>{};
    for (final link in widget.links) {
      final type = link['linkType'] as String? ?? 'RELATED_TO';
      map.putIfAbsent(type, () => []).add(link);
    }
    return map;
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'BLOCKS': return const Color(0xFFDC2626);
      case 'IS_BLOCKED_BY': return const Color(0xFFC2410C);
      case 'DUPLICATES': return const Color(0xFF15803D);
      case 'IS_DUPLICATED_BY': return const Color(0xFF57534E);
      default: return const Color(0xFF1D4ED8);
    }
  }

  Color _typeBg(String type) {
    switch (type) {
      case 'BLOCKS': return const Color(0xFFFEF2F2);
      case 'IS_BLOCKED_BY': return const Color(0xFFFFF7ED);
      case 'DUPLICATES': return const Color(0xFFF0FDF4);
      case 'IS_DUPLICATED_BY': return const Color(0xFFFAFAF9);
      default: return const Color(0xFFEFF6FF);
    }
  }

  String _typeLabel(String type) {
    final found = _linkTypes.firstWhere((t) => t['value'] == type, orElse: () => {'label': type, 'icon': '🔗', 'value': type});
    return '${found['icon']} ${found['label']}';
  }

  Future<void> _removeLink(String linkId) async {
    try {
      await widget.api.delete(ApiEndpoints.ticketLink(widget.ticketId, linkId));
      final res = await widget.api.get(ApiEndpoints.ticketLinks(widget.ticketId));
      widget.onLinksChanged(res.data['data'] ?? []);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to remove link'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _showAddLinkSheet() {
    final searchCtrl = TextEditingController();
    List<dynamic> results = [];
    bool searching = false;
    String? selectedTicketId;
    String? selectedTicketLabel;
    String selectedType = _selectedLinkType;
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Link Ticket', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                controller: searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Search tickets...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  suffixIcon: searching ? const Padding(padding: EdgeInsets.all(10), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))) : null,
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                onChanged: (q) async {
                  if (q.trim().length < 2) { setSheet(() { results = []; }); return; }
                  setSheet(() => searching = true);
                  try {
                    final res = await widget.api.get(ApiEndpoints.tickets, queryParams: {'search': q, 'size': '10'});
                    final data = res.data['data'];
                    final items = data is Map ? (data['content'] ?? []) : (data ?? []);
                    setSheet(() {
                      results = (items as List).where((t) => t['id'].toString() != widget.ticketId).toList();
                      searching = false;
                    });
                  } catch (_) { setSheet(() => searching = false); }
                },
              ),
              if (results.isNotEmpty) ...[
                const SizedBox(height: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 180),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: results.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 4),
                    itemBuilder: (_, i) {
                      final t = results[i] as Map<String, dynamic>;
                      final id = t['id'].toString();
                      final isSelected = selectedTicketId == id;
                      return InkWell(
                        onTap: () => setSheet(() {
                          selectedTicketId = id;
                          selectedTicketLabel = '${t['ticketNumber'] ?? '#$id'} — ${t['title'] ?? t['subject'] ?? ''}';
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
                              Text(t['title'] ?? t['subject'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                              Text('#${t['ticketNumber'] ?? id}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                            ])),
                          ]),
                        ),
                      );
                    },
                  ),
                ),
              ],
              const SizedBox(height: 12),
              const Text('Relationship type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: _linkTypes.map((t) {
                  final isSelected = selectedType == t['value'];
                  return FilterChip(
                    label: Text('${t['icon']} ${t['label']}', style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : AppColors.textPrimary)),
                    selected: isSelected,
                    onSelected: (_) => setSheet(() => selectedType = t['value']!),
                    backgroundColor: AppColors.surface,
                    selectedColor: AppColors.primary,
                    checkmarkColor: Colors.white,
                    side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (selectedTicketId == null || submitting) ? null : () async {
                    setSheet(() => submitting = true);
                    try {
                      await widget.api.post(ApiEndpoints.ticketLinks(widget.ticketId), data: {
                        'targetTicketId': selectedTicketId,
                        'linkType': selectedType,
                      });
                      final res = await widget.api.get(ApiEndpoints.ticketLinks(widget.ticketId));
                      widget.onLinksChanged(res.data['data'] ?? []);
                      if (mounted) Navigator.of(ctx).pop();
                    } catch (_) {
                      if (mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Failed to add link'), backgroundColor: AppColors.error),
                        );
                      }
                    } finally {
                      if (mounted) setSheet(() => submitting = false);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(submitting ? 'Linking...' : 'Add Link'),
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
    final grouped = _groupLinks();

    return Stack(
      children: [
        widget.links.isEmpty
            ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.link_off_outlined, size: 40, color: AppColors.textTertiary),
                SizedBox(height: 8),
                Text('No linked tickets', style: TextStyle(color: AppColors.textSecondary)),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                itemCount: grouped.length,
                itemBuilder: (_, i) {
                  final type = grouped.keys.elementAt(i);
                  final typeLinks = grouped[type]!;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: EdgeInsets.only(bottom: 8, top: i == 0 ? 0 : 12),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _typeBg(type),
                          borderRadius: BorderRadius.circular(6),
                          border: Border(left: BorderSide(color: _typeColor(type), width: 3)),
                        ),
                        child: Text(_typeLabel(type), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _typeColor(type))),
                      ),
                      ...typeLinks.map((link) {
                        final linkId = link['id']?.toString() ?? '';
                        final number = link['linkedTicketNumber'] ?? '';
                        final subject = link['linkedTicketSubject'] ?? '';
                        final status = link['linkedTicketStatus'] ?? '';
                        final linkedId = link['linkedTicketId']?.toString() ?? '';
                        return Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(children: [
                            Text(number, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary, fontFamily: 'monospace')),
                            const SizedBox(width: 8),
                            Expanded(child: Text(subject, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis)),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(4)),
                              child: Text(status, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                            ),
                            const SizedBox(width: 4),
                            IconButton(
                              icon: const Icon(Icons.close, size: 16),
                              color: AppColors.textTertiary,
                              onPressed: () => _removeLink(linkId),
                              visualDensity: VisualDensity.compact,
                              padding: EdgeInsets.zero,
                              tooltip: 'Remove link',
                            ),
                          ]),
                        );
                      }),
                    ],
                  );
                },
              ),
        Positioned(
          bottom: 16,
          right: 16,
          child: FloatingActionButton.small(
            onPressed: _showAddLinkSheet,
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.add, color: Colors.white),
          ),
        ),
      ],
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


// ─── Sub-tickets Tab ──────────────────────────────────────────────────────────

class _SubTicketsTab extends ConsumerStatefulWidget {
  final String ticketId;
  final Map<String, dynamic> ticket;
  final List<dynamic> children;
  final ApiClient api;
  final ValueChanged<List<dynamic>> onChildrenChanged;
  final Future<void> Function() onRefresh;

  const _SubTicketsTab({
    required this.ticketId,
    required this.ticket,
    required this.children,
    required this.api,
    required this.onChildrenChanged,
    required this.onRefresh,
  });

  @override
  ConsumerState<_SubTicketsTab> createState() => _SubTicketsTabState();
}

class _SubTicketsTabState extends ConsumerState<_SubTicketsTab> {
  bool _submitting = false;

  static const _priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  void _showAddSheet() {
    String subject = '';
    String description = '';
    String priority = 'MEDIUM';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
          child: SingleChildScrollView(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Add Sub-ticket', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 16),
              const Text('Subject', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
              const SizedBox(height: 4),
              TextFormField(
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Sub-ticket subject', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                onChanged: (v) => setSheet(() => subject = v),
              ),
              const SizedBox(height: 12),
              const Text('Description', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
              const SizedBox(height: 4),
              TextFormField(
                maxLines: 3,
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Describe the issue...', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                onChanged: (v) => setSheet(() => description = v),
              ),
              const SizedBox(height: 12),
              const Text('Priority', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
              const SizedBox(height: 4),
              DropdownButtonFormField<String>(
                value: priority,
                decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                items: _priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                onChanged: (v) => setSheet(() => priority = v ?? 'MEDIUM'),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: subject.trim().isEmpty || _submitting ? null : () async {
                    setSheet(() => _submitting = true);
                    try {
                      final res = await widget.api.post(
                        ApiEndpoints.ticketChildren(widget.ticketId),
                        data: {
                          'subject': subject.trim(),
                          'description': description.trim().isEmpty ? subject.trim() : description.trim(),
                          'priority': priority,
                        },
                      );
                      final child = res.data['data'] as Map<String, dynamic>;
                      widget.onChildrenChanged([...widget.children, child]);
                      if (mounted) Navigator.of(ctx).pop();
                    } catch (_) {
                      if (mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Failed to create sub-ticket'), backgroundColor: AppColors.error),
                        );
                      }
                    } finally {
                      if (mounted) setSheet(() => _submitting = false);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(_submitting ? 'Creating...' : 'Create Sub-ticket'),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'NEW': return const Color(0xFF1D4ED8);
      case 'OPEN': return const Color(0xFF5B21B6);
      case 'PENDING': return const Color(0xFF92400E);
      case 'RESOLVED': return const Color(0xFF15803D);
      case 'CLOSED': return const Color(0xFF64748B);
      default: return AppColors.textSecondary;
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'NEW': return const Color(0xFFDBEAFE);
      case 'OPEN': return const Color(0xFFEDE9FE);
      case 'PENDING': return const Color(0xFFFEF3C7);
      case 'RESOLVED': return const Color(0xFFDCFCE7);
      case 'CLOSED': return const Color(0xFFF1F5F9);
      default: return AppColors.surfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    final parentId = widget.ticket['parentTicketId']?.toString();
    final parentNumber = widget.ticket['parentTicketNumber']?.toString();
    final parentTitle = widget.ticket['parentTicketTitle']?.toString();

    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          children: [
            // Parent ticket card
            if (parentId != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: Row(children: [
                  const Icon(Icons.arrow_upward, size: 16, color: Color(0xFF166534)),
                  const SizedBox(width: 8),
                  const Text('Parent: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => context.push('/agent/tickets/$parentId'),
                      child: Text(
                        '#${parentNumber ?? parentId}${parentTitle != null ? ' — $parentTitle' : ''}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF166534), decoration: TextDecoration.underline),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 12),
            ],

            // Children list header
            Row(children: [
              const Text('Sub-tickets', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              if (widget.children.isNotEmpty) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(10)),
                  child: Text('${widget.children.length}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
                ),
              ],
            ]),
            const SizedBox(height: 8),

            if (widget.children.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.account_tree_outlined, size: 32, color: AppColors.textTertiary),
                  SizedBox(height: 8),
                  Text('No sub-tickets', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                ]),
              )
            else
              ...widget.children.map((child) {
                final childMap = child as Map<String, dynamic>;
                final childId = childMap['id']?.toString() ?? '';
                final number = childMap['ticketNumber']?.toString() ?? '';
                final subject = childMap['subject']?.toString() ?? childMap['title']?.toString() ?? '';
                final status = childMap['status']?.toString() ?? 'NEW';

                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: ListTile(
                    dense: true,
                    onTap: () => context.push('/agent/tickets/$childId'),
                    title: Row(children: [
                      Text(number, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary, fontFamily: 'monospace')),
                      const SizedBox(width: 8),
                      Expanded(child: Text(subject, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ]),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(color: _statusBg(status), borderRadius: BorderRadius.circular(6)),
                      child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _statusColor(status))),
                    ),
                  ),
                );
              }),
          ],
        ),
        Positioned(
          bottom: 16,
          right: 16,
          child: FloatingActionButton.small(
            onPressed: _showAddSheet,
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.add, color: Colors.white),
          ),
        ),
      ],
    );
  }
}
