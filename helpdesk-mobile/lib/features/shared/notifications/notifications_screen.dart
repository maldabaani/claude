import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final _api = ApiClient();
  List<dynamic> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.notifications);
      final data = resp.data['data'];
      if (mounted) setState(() { _notifications = data is List ? data : (data['content'] ?? []); _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _api.post(ApiEndpoints.notificationsMarkRead);
      await _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_notifications.isNotEmpty)
            TextButton(onPressed: _markAllRead, child: const Text('Mark all read')),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.notifications_none, size: 64, color: AppColors.textTertiary),
                      const SizedBox(height: 12),
                      Text('No notifications', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.textSecondary)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final n = _notifications[i];
                      final isRead = n['read'] == true || n['isRead'] == true;
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isRead ? AppColors.surface : AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: isRead ? AppColors.border : AppColors.primary.withOpacity(0.2)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isRead ? AppColors.surfaceVariant : AppColors.primaryLight,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.notifications,
                                size: 16,
                                color: isRead ? AppColors.textSecondary : AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(n['title'] ?? n['message'] ?? '', style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: isRead ? FontWeight.w500 : FontWeight.w700,
                                  )),
                                  if (n['message'] != null && n['title'] != null) ...[
                                    const SizedBox(height: 2),
                                    Text(n['message'], style: Theme.of(context).textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                                  ],
                                ],
                              ),
                            ),
                            if (!isRead)
                              Container(
                                width: 8,
                                height: 8,
                                margin: const EdgeInsets.only(top: 4),
                                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
