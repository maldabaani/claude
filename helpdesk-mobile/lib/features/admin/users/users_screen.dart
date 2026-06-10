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
  List<dynamic> _filteredUsers = [];
  bool _loading = true;
  String _roleFilter = 'ALL';

  static const _roles = ['ALL', 'CUSTOMER', 'AGENT', 'TEAM_LEAD', 'ADMIN'];

  @override
  void initState() {
    super.initState();
    _load();
    _searchController.addListener(_applyFilters);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.get(ApiEndpoints.users, queryParams: {'size': '200'});
      final data = resp.data['data'];
      final content = data is Map ? (data['content'] ?? []) : (data ?? []);
      if (mounted) {
        setState(() {
          _users = content;
          _loading = false;
        });
        _applyFilters();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    final query = _searchController.text.trim().toLowerCase();
    setState(() {
      _filteredUsers = _users.where((u) {
        final matchesRole = _roleFilter == 'ALL' || u['role'] == _roleFilter;
        if (!matchesRole) return false;
        if (query.isEmpty) return true;
        return (u['fullName'] ?? '').toLowerCase().contains(query) ||
            (u['email'] ?? '').toLowerCase().contains(query);
      }).toList();
    });
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'ADMIN': return AppColors.priorityCritical;
      case 'TEAM_LEAD': return AppColors.priorityHigh;
      case 'AGENT': return AppColors.primary;
      case 'CUSTOMER': return AppColors.textSecondary;
      default: return AppColors.textTertiary;
    }
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'TEAM_LEAD': return 'Team Lead';
      default: return role[0] + role.substring(1).toLowerCase();
    }
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  void _showCreateUserSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _UserFormSheet(
        onSave: (data) async {
          await _api.post(ApiEndpoints.users, data: data);
          await _load();
        },
      ),
    );
  }

  void _showEditUserSheet(Map<String, dynamic> user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _UserFormSheet(
        existingUser: user,
        onSave: (data) async {
          await _api.put(ApiEndpoints.user(user['id']), data: data);
          await _load();
        },
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
        title: Text('Users (${_filteredUsers.length})'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateUserSheet,
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.person_add_outlined, color: Colors.white),
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search users...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textTertiary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear, size: 18), onPressed: () { _searchController.clear(); })
                    : null,
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),

          // Role filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _roles.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final r = _roles[i];
                final selected = _roleFilter == r;
                return FilterChip(
                  label: Text(r == 'ALL' ? 'All' : _roleLabel(r), style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textSecondary)),
                  selected: selected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  side: BorderSide(color: selected ? AppColors.primary : AppColors.border),
                  showCheckmark: false,
                  onSelected: (_) { setState(() => _roleFilter = r); _applyFilters(); },
                );
              },
            ),
          ),

          // List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filteredUsers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.group_outlined, size: 48, color: AppColors.textTertiary),
                            const SizedBox(height: 8),
                            Text('No users found', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                          itemCount: _filteredUsers.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (_, i) {
                            final u = _filteredUsers[i] as Map<String, dynamic>;
                            final role = u['role'] ?? 'CUSTOMER';
                            final isActive = u['active'] ?? u['enabled'] ?? true;

                            return InkWell(
                              onTap: () => _showEditUserSheet(u),
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 22,
                                      backgroundColor: _roleColor(role).withOpacity(0.15),
                                      child: Text(
                                        _initials(u['fullName'] ?? '?'),
                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _roleColor(role)),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(u['fullName'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                          const SizedBox(height: 2),
                                          Text(u['email'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), overflow: TextOverflow.ellipsis),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: _roleColor(role).withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(_roleLabel(role), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _roleColor(role))),
                                        ),
                                        const SizedBox(height: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: isActive ? AppColors.successBg : AppColors.errorBg,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            isActive ? 'Active' : 'Inactive',
                                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: isActive ? AppColors.success : AppColors.error),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
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

class _UserFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existingUser;
  final Future<void> Function(Map<String, dynamic>) onSave;

  const _UserFormSheet({this.existingUser, required this.onSave});

  @override
  State<_UserFormSheet> createState() => _UserFormSheetState();
}

class _UserFormSheetState extends State<_UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _role = 'CUSTOMER';
  bool _active = true;
  bool _saving = false;
  String? _error;

  bool get isEditing => widget.existingUser != null;
  static const _roles = ['CUSTOMER', 'AGENT', 'TEAM_LEAD', 'ADMIN'];

  @override
  void initState() {
    super.initState();
    if (isEditing) {
      _nameController.text = widget.existingUser!['fullName'] ?? '';
      _emailController.text = widget.existingUser!['email'] ?? '';
      _role = widget.existingUser!['role'] ?? 'CUSTOMER';
      _active = widget.existingUser!['active'] ?? widget.existingUser!['enabled'] ?? true;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      final data = <String, dynamic>{
        'fullName': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'role': _role,
      };
      if (!isEditing && _passwordController.text.isNotEmpty) {
        data['password'] = _passwordController.text;
      }
      if (isEditing) data['active'] = _active;
      await widget.onSave(data);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() { _error = 'Failed to save user.'; _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(isEditing ? 'Edit User' : 'Create User', style: Theme.of(context).textTheme.titleLarge),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                  ],
                ),
                const SizedBox(height: 16),
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: AppColors.errorBg, borderRadius: BorderRadius.circular(8)),
                    child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                  ),
                  const SizedBox(height: 12),
                ],
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full Name'),
                  validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => (v == null || !v.contains('@')) ? 'Valid email required' : null,
                ),
                const SizedBox(height: 12),
                if (!isEditing) ...[
                  TextFormField(
                    controller: _passwordController,
                    decoration: const InputDecoration(labelText: 'Password'),
                    obscureText: true,
                    validator: (v) => (v == null || v.length < 6) ? 'Min 6 characters' : null,
                  ),
                  const SizedBox(height: 12),
                ],
                DropdownButtonFormField<String>(
                  value: _role,
                  decoration: const InputDecoration(labelText: 'Role'),
                  items: _roles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                  onChanged: (v) { if (v != null) setState(() => _role = v); },
                ),
                if (isEditing) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Active', style: TextStyle(fontSize: 15)),
                      Switch(value: _active, onChanged: (v) => setState(() => _active = v)),
                    ],
                  ),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: _saving
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(isEditing ? 'Save Changes' : 'Create User'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
