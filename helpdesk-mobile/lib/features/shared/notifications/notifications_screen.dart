import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/time_ago.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final _api = ApiClient();
  List<dynamic> _notifications = [];
  bool _loading = true;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.notifications, queryParams: {'size': '50', 'sortDir': 'desc'});
      final data = resp.data['data'];
      final content = data is Map ? (data['content'] ?? []) : (data ?? []);
      if (mounted) setState(() { _notifications = content; _loading = false; });
    } catch (_) {
      if (mounted && !silent) setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _api.post(ApiEndpoints.notificationsMarkRead);
      await _load(silent: true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All notifications marked as read'), backgroundColor: AppColors.success),
        );
      }
    } catch (_) {}
  }

  Future<void> _markRead(String id) async {
    try {
      await _api.patch('${ApiEndpoints.notifications}/$id/read');
      setState(() {
        final idx = _notifications.indexWhere((n) => n['id'] == id);
        if (idx != -1) {
          _notifications[idx] = Map<String, dynamic>.from(_notifications[idx])..['read'] = true;
        }
      });
    } catch (_) {}
  }

  IconData _iconForEvent(String? event) {
    switch ((event ?? '').toUpperCase()) {
      case 'TICKET_CREATED': return Icons.confirmation_number_outlined;
      case 'TICKET_ASSIGNED': return Icons.person_add_outlined;
      case 'STATUS_CHANGED': return Icons.swap_horiz_outlined;
      case 'COMMENT_ADDED': return Icons.chat_bubble_outline;
      case 'SLA_BREACHED': return Icons.warning_amber_outlined;
      default: return Icons.notifications_outlined;
    }
  }

  Color _colorForEvent(String? event) {
    switch ((event ?? '').toUpperCase()) {
      case 'TICKET_CREATED': return AppColors.primary;
      case 'TICKET_ASSIGNED': return AppColors.accent;
      case 'STATUS_CHANGED': return AppColors.statusPending;
      case 'COMMENT_ADDED': return AppColors.statusOpen;
      case 'SLA_BREACHED': return AppColors.error;
      default: return AppColors.textSecondary;
    }
  }

  int get _unreadCount => _notifications.where((n) => n['read'] == false).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Text(_unreadCount > 0 ? 'Notifications ($_unreadCount unread)' : 'Notifications'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read', style: TextStyle(fontSize: 13)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.notifications_none_outlined, size: 56, color: AppColors.textTertiary),
                      const SizedBox(height: 12),
                      Text('No notifications', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.textSecondary)),
                      const SizedBox(height: 4),
                      Text("You're all caught up!", style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, indent: 70),
                    itemBuilder: (_, i) {
                      final n = _notifications[i] as Map<String, dynamic>;
                      final isUnread = n['read'] == false;
                      final event = n['event'] as String?;
                      final color = _colorForEvent(event);

                      return Dismissible(
                        key: Key(n['id'] ?? '$i'),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: AppColors.primary,
                          child: const Icon(Icons.done_all, color: Colors.white),
                        ),
                        onDismissed: (_) => _markRead(n['id'] ?? ''),
                        child: InkWell(
                          onLongPress: () => _markRead(n['id'] ?? ''),
                          child: Container(
                            decoration: BoxDecoration(
                              color: isUnread ? AppColors.primaryLight.withOpacity(0.5) : AppColors.surface,
                              border: isUnread
                                  ? const Border(left: BorderSide(color: AppColors.primary, width: 3))
                                  : null,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: color.withOpacity(0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(_iconForEvent(event), color: color, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                _eventLabel(event),
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: isUnread ? FontWeight.w700 : FontWeight.w500,
                                                  color: AppColors.textPrimary,
                                                ),
                                              ),
                                            ),
                                            Text(
                                              formatTimeAgo(n['createdAt']),
                                              style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          n['message'] ?? '',
                                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (isUnread) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _eventLabel(String? event) {
    switch ((event ?? '').toUpperCase()) {
      case 'TICKET_CREATED': return 'New Ticket Created';
      case 'TICKET_ASSIGNED': return 'Ticket Assigned';
      case 'STATUS_CHANGED': return 'Status Updated';
      case 'COMMENT_ADDED': return 'New Comment';
      case 'SLA_BREACHED': return 'SLA Breached';
      default: return event ?? 'Notification';
    }
  }
}
