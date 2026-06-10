import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';

class CsatRatingScreen extends ConsumerStatefulWidget {
  final String ticketId;
  const CsatRatingScreen({super.key, required this.ticketId});
  @override
  ConsumerState<CsatRatingScreen> createState() => _CsatRatingScreenState();
}

class _CsatRatingScreenState extends ConsumerState<CsatRatingScreen> {
  final _api = ApiClient();
  int _rating = 0;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;
  bool _submitted = false;
  String? _error;

  @override
  void dispose() { _commentCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (_rating == 0) { setState(() => _error = 'Please select a rating'); return; }
    setState(() { _submitting = true; _error = null; });
    try {
      await _api.post(ApiEndpoints.csatRating(widget.ticketId), data: {
        'rating': _rating,
        'comment': _commentCtrl.text.trim().isEmpty ? null : _commentCtrl.text.trim(),
      });
      if (mounted) setState(() { _submitted = true; _submitting = false; });
    } catch (e) { setState(() { _error = 'Failed to submit. Please try again.'; _submitting = false; }); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(backgroundColor: AppColors.surface, elevation: 0, title: const Text('Rate Your Experience'),
      leading: IconButton(icon: const Icon(Icons.close), onPressed: () => context.pop())),
    body: _submitted ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.check_circle_outline, size: 72, color: AppColors.success),
        const SizedBox(height: 16),
        Text('Thank you for your feedback!', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        const Text('Your rating has been submitted.', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 24),
        ElevatedButton(onPressed: () => context.pop(), style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
          child: const Text('Back to Ticket')),
      ]))
    : SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('How would you rate your support experience for ticket #${widget.ticketId}?',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
        const SizedBox(height: 32),
        Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) {
          final star = i + 1;
          return GestureDetector(onTap: () => setState(() { _rating = star; _error = null; }), child: Padding(padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Icon(star <= _rating ? Icons.star_rounded : Icons.star_border_rounded, size: 48, color: star <= _rating ? const Color(0xFFF59E0B) : AppColors.textTertiary)));
        }))),
        const SizedBox(height: 8),
        Center(child: Text(_ratingLabel(_rating), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _rating > 0 ? AppColors.primary : AppColors.textTertiary))),
        const SizedBox(height: 32),
        const Text('Additional Comments (optional)', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        TextField(controller: _commentCtrl, maxLines: 4, decoration: InputDecoration(
          hintText: 'Tell us more about your experience...', filled: true, fillColor: AppColors.surface,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)))),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppColors.error)),
        ],
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          child: _submitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Submit Rating', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)))),
      ])),
  );

  String _ratingLabel(int r) {
    switch (r) { case 1: return 'Very Unsatisfied'; case 2: return 'Unsatisfied'; case 3: return 'Neutral'; case 4: return 'Satisfied'; case 5: return 'Very Satisfied'; default: return 'Tap a star to rate'; }
  }
}
