import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class AdminSettingsScreen extends ConsumerStatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  ConsumerState<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends ConsumerState<AdminSettingsScreen> {
  final _api = ApiClient();
  List<dynamic> _slaRules = [];
  List<dynamic> _departments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.get(ApiEndpoints.slaPolicies).catchError((_) => null),
        _api.get(ApiEndpoints.departments).catchError((_) => null),
      ]);
      if (mounted) {
        setState(() {
          if (results[0] != null) {
            final d = results[0]!.data['data'];
            _slaRules = d is Map ? (d['content'] ?? []) : (d ?? []);
          }
          if (results[1] != null) {
            final d = results[1]!.data['data'];
            _departments = d is Map ? (d['content'] ?? []) : (d ?? []);
          }
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddDepartmentSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _DepartmentFormSheet(
        onSave: (data) async {
          await _api.post(ApiEndpoints.departments, data: data);
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
        title: const Text('Settings'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDepartmentSheet,
        backgroundColor: AppColors.primary,
        tooltip: 'Add Department',
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // SLA Rules
                    Text('SLA Rules', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text('Response and resolution time targets by priority', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 12),
                    if (_slaRules.isEmpty)
                      _EmptySection(icon: Icons.timer_outlined, message: 'No SLA rules configured')
                    else
                      ..._slaRules.map((rule) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _SlaRuleCard(rule: rule as Map<String, dynamic>, onEdit: () => _showEditSlaSheet(rule)),
                      )),
                    const SizedBox(height: 24),

                    // Departments
                    Text('Departments', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text('Manage support departments and teams', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 12),
                    if (_departments.isEmpty)
                      _EmptySection(icon: Icons.business_outlined, message: 'No departments configured')
                    else
                      ..._departments.map((dept) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _DepartmentCard(department: dept as Map<String, dynamic>),
                      )),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
    );
  }

  void _showEditSlaSheet(Map<String, dynamic> rule) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _SlaEditSheet(rule: rule, onSave: (data) async {
        await _api.put('${ApiEndpoints.slaPolicies}/${rule['id']}', data: data);
        await _load();
      }),
    );
  }
}

class _SlaRuleCard extends StatelessWidget {
  final Map<String, dynamic> rule;
  final VoidCallback onEdit;

  const _SlaRuleCard({required this.rule, required this.onEdit});

  Color _priorityColor(String? priority) {
    switch ((priority ?? '').toUpperCase()) {
      case 'CRITICAL': return AppColors.priorityCritical;
      case 'HIGH': return AppColors.priorityHigh;
      case 'MEDIUM': return AppColors.priorityMedium;
      case 'LOW': return AppColors.priorityLow;
      default: return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final priority = rule['priority'] ?? rule['name'] ?? '';
    final color = _priorityColor(priority);

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
            width: 4,
            height: 50,
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(priority.toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 12, color: AppColors.textTertiary),
                    const SizedBox(width: 4),
                    Text('Response: ${rule['firstResponseHours'] ?? rule['responseTime'] ?? '-'}h', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(width: 12),
                    const Icon(Icons.check_circle_outline, size: 12, color: AppColors.textTertiary),
                    const SizedBox(width: 4),
                    Text('Resolve: ${rule['resolveHours'] ?? rule['resolveTime'] ?? '-'}h', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ],
            ),
          ),
          IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary), onPressed: onEdit),
        ],
      ),
    );
  }
}

class _DepartmentCard extends StatelessWidget {
  final Map<String, dynamic> department;
  const _DepartmentCard({required this.department});

  @override
  Widget build(BuildContext context) {
    final agentCount = department['agentCount'] ?? department['memberCount'] ?? 0;

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
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.business_outlined, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(department['name'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                if (department['description'] != null) ...[
                  const SizedBox(height: 2),
                  Text(department['description'], style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.group_outlined, size: 12, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text('$agentCount', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptySection extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptySection({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(icon, size: 32, color: AppColors.textTertiary),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class _DepartmentFormSheet extends StatefulWidget {
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _DepartmentFormSheet({required this.onSave});

  @override
  State<_DepartmentFormSheet> createState() => _DepartmentFormSheetState();
}

class _DepartmentFormSheetState extends State<_DepartmentFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      await widget.onSave({'name': _nameController.text.trim(), 'description': _descController.text.trim()});
      if (mounted) Navigator.pop(context);
    } catch (_) {
      setState(() { _error = 'Failed to create department.'; _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Add Department', style: Theme.of(context).textTheme.titleLarge),
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
                decoration: const InputDecoration(labelText: 'Department Name'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descController,
                decoration: const InputDecoration(labelText: 'Description (optional)'),
                maxLines: 2,
              ),
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
                      : const Text('Create Department'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SlaEditSheet extends StatefulWidget {
  final Map<String, dynamic> rule;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _SlaEditSheet({required this.rule, required this.onSave});

  @override
  State<_SlaEditSheet> createState() => _SlaEditSheetState();
}

class _SlaEditSheetState extends State<_SlaEditSheet> {
  final _responseController = TextEditingController();
  final _resolveController = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _responseController.text = '${widget.rule['firstResponseHours'] ?? widget.rule['responseTime'] ?? ''}';
    _resolveController.text = '${widget.rule['resolveHours'] ?? widget.rule['resolveTime'] ?? ''}';
  }

  @override
  void dispose() {
    _responseController.dispose();
    _resolveController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await widget.onSave({
        'firstResponseHours': int.tryParse(_responseController.text) ?? 0,
        'resolveHours': int.tryParse(_resolveController.text) ?? 0,
      });
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Edit SLA Rule: ${widget.rule['priority'] ?? ''}', style: Theme.of(context).textTheme.titleLarge),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _responseController,
              decoration: const InputDecoration(labelText: 'First Response (hours)', suffixText: 'h'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _resolveController,
              decoration: const InputDecoration(labelText: 'Resolve Time (hours)', suffixText: 'h'),
              keyboardType: TextInputType.number,
            ),
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
                    : const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
