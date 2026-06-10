import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class SubmitTicketScreen extends ConsumerStatefulWidget {
  const SubmitTicketScreen({super.key});

  @override
  ConsumerState<SubmitTicketScreen> createState() => _SubmitTicketScreenState();
}

class _SubmitTicketScreenState extends ConsumerState<SubmitTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiClient();
  final _subjectController = TextEditingController();
  final _descController = TextEditingController();
  String _priority = 'MEDIUM';
  String? _departmentId;
  List<dynamic> _departments = [];
  bool _loading = false;
  bool _loadingDeps = true;

  static const _priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  @override
  void initState() {
    super.initState();
    _loadDepartments();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadDepartments() async {
    try {
      final resp = await _api.get(ApiEndpoints.departments);
      if (mounted) setState(() { _departments = resp.data['data'] ?? []; _loadingDeps = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingDeps = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final body = <String, dynamic>{
        'subject': _subjectController.text.trim(),
        'description': _descController.text.trim(),
        'priority': _priority,
        if (_departmentId != null) 'departmentId': _departmentId,
      };
      await _api.post(ApiEndpoints.tickets, data: body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket submitted successfully!')),
        );
        context.go('/customer/tickets');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Submit Ticket')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _subjectController,
                decoration: const InputDecoration(labelText: 'Subject'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Subject is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descController,
                decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
                maxLines: 5,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Description is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: _priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                onChanged: (v) { if (v != null) setState(() => _priority = v); },
              ),
              const SizedBox(height: 16),
              if (_loadingDeps)
                const LinearProgressIndicator()
              else if (_departments.isNotEmpty)
                DropdownButtonFormField<String?>(
                  value: _departmentId,
                  decoration: const InputDecoration(labelText: 'Department (optional)'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('No department')),
                    ..._departments.map((d) => DropdownMenuItem(value: d['id'].toString(), child: Text(d['name'] ?? ''))),
                  ],
                  onChanged: (v) => setState(() => _departmentId = v),
                ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Submit Ticket'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
