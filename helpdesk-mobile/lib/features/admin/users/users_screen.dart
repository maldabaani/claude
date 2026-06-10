import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  final _api = ApiClient();
  final _searchController = TextEditingController();
  List<dynamic> _users = [];
  bool _loading = true;
  String? _error;
  String _roleFilter = 'ALL';

  static const _roles = ['ALL', 'ADMIN', 'AGENT', 'TEAM_LEAD', 'CUSTOMER'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({String? search}) async {
    setState(() { _loading = true; _error = null; });
    try {
      final params = <String, dynamic>{};
      if (_roleFilter != 'ALL') params['role'] = _roleFilter;
      if (search != null && search.isNotEmpty) params['search'] = search;
      final resp = await _api.get(ApiEndpoints.users, queryParams: params);
      final data = resp.data['data'];
      if (mounted) setState(() { _users = data['content'] ?? data ?? []; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _roleColor(String? role) {
    switch (role) {
      case 'ADMIN': return AppColors.priorityCritical;
      case 'TEAM_LEAD': return AppColors.priorityHigh;
      case 'AGENT': return AppColors.primary;
      case 'CUSTOMER': return AppColors.statusResolved;
      default: return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search users...',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _searchController.clear(); _load(); })
                    : null,
              ),
              onSubmitted: (v) => _load(search: v),
              onChanged: (v) { if (v.isEmpty) _load(); },
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 44,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              scrollDirection: Axis.horizontal,
              itemCount: _roles.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final r = _roles[i];
                return FilterChip(
                  label: Text(r),
                  selected: r == _roleFilter,
                  onSelected: (_) { setState(() => _roleFilter = r); _load(); },
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text('Error: $_error'))
                    : _users.isEmpty
                        ? const Center(child: Text('No users found.'))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _users.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (_, i) {
                                final u = _users[i];
                                final role = u['role'] as String? ?? '';
                                return Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: _roleColor(role).withOpacity(0.15),
                                        child: Text(
                                          (u['fullName'] as String? ?? '?').isNotEmpty
                                              ? (u['fullName'] as String).substring(0, 1).toUpperCase()
                                              : '?',
                                          style: TextStyle(color: _roleColor(role), fontWeight: FontWeight.w700),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(u['fullName'] ?? '', style: Theme.of(context).textTheme.titleSmall),
                                            Text(u['email'] ?? '', style: Theme.of(context).textTheme.bodySmall),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: _roleColor(role).withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Text(role, style: TextStyle(fontSize: 11, color: _roleColor(role), fontWeight: FontWeight.w600)),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
