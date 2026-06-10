import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class CustomerTicketDetailScreen extends ConsumerStatefulWidget {
  final String id;
  const CustomerTicketDetailScreen({super.key, required this.id});

  @override
  ConsumerState<CustomerTicketDetailScreen> createState() => _CustomerTicketDetailScreenState();
}

class _CustomerTicketDetailScreenState extends ConsumerState<CustomerTicketDetailScreen> {
  final _api = ApiClient();
  final _commentController = TextEditingController();
  Map<String, dynamic>? _ticket;
  List<dynamic> _comments = [];
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _commentController.dispose();
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
        setState(() {
          _ticket = results[0].data['data'];
          _comments = results[1].data['data'] ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    setState(() => _submitting = true);
    try {
      await _api.post(ApiEndpoints.ticketComments(widget.id), data: {'content': text, 'isInternal': false});
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
      appBar: AppBar(title: Text(_ticket != null ? '#${_ticket!['id']}' : 'Ticket')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ticket == null
              ? const Center(child: Text('Ticket not found.'))
              : Column(
                  children: [
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _load,
                        child: ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(_ticket!['subject'] ?? '', style: Theme.of(context).textTheme.headlineSmall),
                                  const SizedBox(height: 8),
                                  Text(_ticket!['description'] ?? '', style: Theme.of(context).textTheme.bodyMedium),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Chip(label: Text(_ticket!['status'] ?? '')),
                                      const SizedBox(width: 8),
                                      Chip(label: Text(_ticket!['priority'] ?? '')),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text('Comments (${_comments.length})', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 8),
                            ..._comments.map((c) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: c['isInternal'] == true ? AppColors.warningBg : AppColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(c['authorName'] ?? 'Unknown', style: Theme.of(context).textTheme.labelMedium),
                                    const SizedBox(height: 4),
                                    Text(c['content'] ?? '', style: Theme.of(context).textTheme.bodyMedium),
                                  ],
                                ),
                              ),
                            )),
                          ],
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      decoration: const BoxDecoration(
                        color: AppColors.surface,
                        border: Border(top: BorderSide(color: AppColors.border)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _commentController,
                              decoration: const InputDecoration(hintText: 'Add a comment...', isDense: true),
                              maxLines: null,
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: _submitting ? null : _postComment,
                            icon: _submitting
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Icon(Icons.send, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
