import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/time_ago.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/priority_badge.dart';

class TicketQueueScreen extends ConsumerStatefulWidget {
  const TicketQueueScreen({super.key});

  @override
  ConsumerState<TicketQueueScreen> createState() => _TicketQueueScreenState();
}

class _TicketQueueScreenState extends ConsumerState<TicketQueueScreen> {
  final _api = ApiClient();
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  List<dynamic> _tickets = [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  String? _error;
  String _statusFilter = 'ALL';
  String _sortBy = 'newest';
  int _page = 0;
  static const _pageSize = 20;

  static const _statusOptions = ['ALL', 'NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED'];
  static const _sortOptions = {
    'newest': 'Newest',
    'oldest': 'Oldest',
    'priority': 'Priority',
  };

  @override
  void initState() {
    super.initState();
    _load(reset: true);
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      if (!_loadingMore && _hasMore) _loadMore();
    }
  }

  Map<String, dynamic> _buildParams(int page) {
    final params = <String, dynamic>{
      'page': page.toString(),
      'size': _pageSize.toString(),
    };
    if (_statusFilter != 'ALL') params['status'] = _statusFilter;
    if (_searchController.text.trim().isNotEmpty) params['search'] = _searchController.text.trim();
    switch (_sortBy) {
      case 'newest':
        params['sortBy'] = 'createdAt';
        params['sortDir'] = 'desc';
        break;
      case 'oldest':
        params['sortBy'] = 'createdAt';
        params['sortDir'] = 'asc';
        break;
      case 'priority':
        params['sortBy'] = 'priority';
        params['sortDir'] = 'asc';
        break;
    }
    return params;
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() { _loading = true; _error = null; _page = 0; _hasMore = true; });
    }
    try {
      final resp = await _api.get(ApiEndpoints.tickets, queryParams: _buildParams(0));
      final data = resp.data['data'];
      final content = data is Map ? (data['content'] ?? []) : (data ?? []);
      final total = data is Map ? (data['totalElements'] ?? content.length) : content.length;
      if (mounted) {
        setState(() {
          _tickets = content;
          _page = 0;
          _hasMore = content.length < total;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() => _loadingMore = true);
    try {
      final nextPage = _page + 1;
      final resp = await _api.get(ApiEndpoints.tickets, queryParams: _buildParams(nextPage));
      final data = resp.data['data'];
      final content = data is Map ? (data['content'] ?? []) : (data ?? []);
      final total = data is Map ? (data['totalElements'] ?? _tickets.length + content.length) : _tickets.length + content.length;
      if (mounted) {
        setState(() {
          _tickets.addAll(content);
          _page = nextPage;
          _hasMore = _tickets.length < total;
          _loadingMore = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text('Ticket Queue'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort),
            tooltip: 'Sort',
            initialValue: _sortBy,
            onSelected: (v) { setState(() => _sortBy = v); _load(reset: true); },
            itemBuilder: (_) => _sortOptions.entries.map((e) => PopupMenuItem(
              value: e.key,
              child: Row(
                children: [
                  if (_sortBy == e.key) const Icon(Icons.check, size: 16, color: AppColors.primary),
                  if (_sortBy == e.key) const SizedBox(width: 8),
                  if (_sortBy != e.key) const SizedBox(width: 24),
                  Text(e.value),
                ],
              ),
            )).toList(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search tickets...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textTertiary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () { _searchController.clear(); _load(reset: true); },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
              onSubmitted: (_) => _load(reset: true),
              onChanged: (v) {
                setState(() {});
                if (v.isEmpty) _load(reset: true);
              },
            ),
          ),

          // Filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _statusOptions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final s = _statusOptions[i];
                final selected = _statusFilter == s;
                return FilterChip(
                  label: Text(s, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppColors.textSecondary)),
                  selected: selected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  side: BorderSide(color: selected ? AppColors.primary : AppColors.border),
                  showCheckmark: false,
                  onSelected: (_) { setState(() => _statusFilter = s); _load(reset: true); },
                );
              },
            ),
          ),

          // List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.error_outline, size: 40, color: AppColors.error),
                              const SizedBox(height: 8),
                              Text('Failed to load tickets', style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 4),
                              TextButton(onPressed: () => _load(reset: true), child: const Text('Retry')),
                            ],
                          ),
                        ),
                      )
                    : _tickets.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.inbox_outlined, size: 48, color: AppColors.textTertiary),
                                const SizedBox(height: 8),
                                Text('No tickets found', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary)),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _load(reset: true),
                            child: ListView.separated(
                              controller: _scrollController,
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                              itemCount: _tickets.length + (_loadingMore ? 1 : 0),
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (_, i) {
                                if (i == _tickets.length) {
                                  return const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(16),
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    ),
                                  );
                                }
                                return _TicketQueueCard(ticket: _tickets[i]);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _TicketQueueCard extends StatelessWidget {
  final Map<String, dynamic> ticket;
  const _TicketQueueCard({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final assignedAgent = ticket['assignedAgent'] as Map<String, dynamic>?;
    final agentName = assignedAgent?['fullName'] ?? ticket['assigneeName'];
    final department = ticket['departmentName'] ?? ticket['department']?['name'];

    return InkWell(
      onTap: () => context.go('/agent/tickets/${ticket['id']}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  '#${ticket['ticketNumber'] ?? ticket['id'] ?? ''}',
                  style: const TextStyle(fontSize: 11, color: AppColors.textTertiary, fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 8),
                StatusBadge(status: ticket['status'] ?? 'NEW', small: true),
                const SizedBox(width: 6),
                PriorityBadge(priority: ticket['priority'] ?? 'MEDIUM', small: true),
                const Spacer(),
                Text(
                  formatTimeAgo(ticket['updatedAt']),
                  style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              ticket['title'] ?? ticket['subject'] ?? '',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                if (department != null) ...[
                  const Icon(Icons.business_outlined, size: 12, color: AppColors.textTertiary),
                  const SizedBox(width: 3),
                  Text(department, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  const SizedBox(width: 10),
                ],
                if (agentName != null) ...[
                  const Icon(Icons.person_outline, size: 12, color: AppColors.textTertiary),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(
                      agentName,
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ] else
                  const Text('Unassigned', style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
