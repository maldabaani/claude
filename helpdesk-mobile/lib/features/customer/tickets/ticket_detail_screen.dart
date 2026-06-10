import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/services/ticket_service.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/models/ticket_model.dart';
import '../../../core/models/comment_model.dart';
import '../../../core/theme/app_colors.dart';

class TicketDetailScreen extends ConsumerStatefulWidget {
  final String ticketId;

  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  ConsumerState<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends ConsumerState<TicketDetailScreen> {
  final _ticketService = TicketService();
  final _replyCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _api = ApiClient();

  TicketModel? _ticket;
  List<CommentModel> _comments = [];
  bool _loading = true;
  bool _sending = false;
  bool _submittingRating = false;
  String? _error;
  int? _csatRating;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _replyCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final ticket = await _ticketService.getTicket(widget.ticketId);
      final comments = await _ticketService.getComments(widget.ticketId);
      if (!mounted) return;
      setState(() {
        _ticket = ticket;
        _comments = comments.where((c) => !c.internal).toList();
        _loading = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load ticket details.';
        _loading = false;
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendReply() async {
    final text = _replyCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      final comment = await _ticketService.addComment(widget.ticketId, text);
      if (!mounted) return;
      _replyCtrl.clear();
      setState(() {
        _comments.add(comment);
        _sending = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to send reply. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _submitCsatRating(int rating) async {
    setState(() => _submittingRating = true);
    try {
      await _api.post(
        ApiEndpoints.csatRating(widget.ticketId),
        data: {'rating': rating},
      );
      if (!mounted) return;
      setState(() {
        _csatRating = rating;
        _submittingRating = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thank you for your feedback!'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _submittingRating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
            size: 20,
            color: AppColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          _ticket != null ? '#${_ticket!.ticketNumber}' : 'Ticket Detail',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        size: 48,
                        color: AppColors.textTertiary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _load,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                        ),
                        child: const Text(
                          'Retry',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // ── Scrollable content ─────────────────────────────
                    Expanded(
                      child: ListView(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.all(16),
                        children: [
                          // ── Ticket Header Card ───────────────────────
                          _TicketHeaderCard(ticket: _ticket!),
                          const SizedBox(height: 12),

                          // ── CSAT Rating ──────────────────────────────
                          if (_ticket!.isResolved && _csatRating == null)
                            _CsatCard(
                              loading: _submittingRating,
                              onRate: _submitCsatRating,
                            ),
                          if (_csatRating != null)
                            _CsatThanksCard(rating: _csatRating!),

                          const SizedBox(height: 8),

                          // ── Conversation ─────────────────────────────
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.chat_bubble_outline_rounded,
                                  size: 16,
                                  color: AppColors.textTertiary,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Conversation',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          if (_comments.isEmpty)
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: const Column(
                                children: [
                                  Icon(
                                    Icons.chat_outlined,
                                    size: 32,
                                    color: AppColors.textTertiary,
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    'No messages yet',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'Send a reply to start the conversation.',
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.textTertiary,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          else
                            ...(_comments.map(
                              (comment) => _CommentBubble(
                                comment: comment,
                                isMe: comment.authorId == currentUser?.id,
                              ),
                            )),

                          const SizedBox(height: 16),
                        ],
                      ),
                    ),

                    // ── Reply Box ──────────────────────────────────────
                    if (_ticket!.status != 'CLOSED')
                      _ReplyBox(
                        controller: _replyCtrl,
                        sending: _sending,
                        onSend: _sendReply,
                      ),
                  ],
                ),
    );
  }
}

// ─── Ticket Header Card ──────────────────────────────────────────────────────

class _TicketHeaderCard extends StatefulWidget {
  final TicketModel ticket;

  const _TicketHeaderCard({required this.ticket});

  @override
  State<_TicketHeaderCard> createState() => _TicketHeaderCardState();
}

class _TicketHeaderCardState extends State<_TicketHeaderCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final ticket = widget.ticket;
    final statusColor = _statusColor(ticket.status);
    final statusBg = _statusBg(ticket.status);
    final priorityColor = _priorityColor(ticket.priority);
    final priorityBg = _priorityBg(ticket.priority);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top color bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _statusLabel(ticket.status),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: priorityBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: priorityColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            ticket.priority,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: priorityColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '#${ticket.ticketNumber}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  ticket.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  ticket.description,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                  maxLines: _expanded ? null : 3,
                  overflow: _expanded ? null : TextOverflow.ellipsis,
                ),
                if (ticket.description.length > 150)
                  GestureDetector(
                    onTap: () => setState(() => _expanded = !_expanded),
                    child: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        _expanded ? 'Show less' : 'Show more',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 14),
                const Divider(color: AppColors.border, height: 1),
                const SizedBox(height: 12),
                // Meta info
                Wrap(
                  spacing: 16,
                  runSpacing: 8,
                  children: [
                    _MetaChip(
                      icon: Icons.access_time_rounded,
                      label: _formatDate(ticket.createdAt),
                    ),
                    _MetaChip(
                      icon: Icons.person_outline_rounded,
                      label: ticket.assignedAgentId != null
                          ? ticket.assignedAgentName
                          : 'Unassigned',
                    ),
                    if (ticket.slaBreached)
                      const _MetaChip(
                        icon: Icons.warning_amber_rounded,
                        label: 'SLA Breached',
                        color: AppColors.error,
                      ),
                  ],
                ),
                if (ticket.tags.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: ticket.tags
                        .map(
                          (tag) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              tag,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Meta Chip ───────────────────────────────────────────────────────────────

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MetaChip({
    required this.icon,
    required this.label,
    this.color = AppColors.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// ─── Comment Bubble ──────────────────────────────────────────────────────────

class _CommentBubble extends StatelessWidget {
  final CommentModel comment;
  final bool isMe;

  const _CommentBubble({required this.comment, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isMe) ...[
            _Avatar(
              initials: comment.authorInitials,
              isAgent: true,
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Text(
                  isMe ? 'You' : comment.authorName,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textTertiary,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isMe ? AppColors.primary : AppColors.surface,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft:
                          Radius.circular(isMe ? 16 : 4),
                      bottomRight:
                          Radius.circular(isMe ? 4 : 16),
                    ),
                    border: isMe
                        ? null
                        : Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0x08000000),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Text(
                    comment.body,
                    style: TextStyle(
                      fontSize: 14,
                      color: isMe ? Colors.white : AppColors.textPrimary,
                      height: 1.45,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(comment.createdAt),
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          if (isMe) ...[
            const SizedBox(width: 8),
            _Avatar(initials: comment.authorInitials, isAgent: false),
          ],
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String initials;
  final bool isAgent;

  const _Avatar({required this.initials, required this.isAgent});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        gradient: isAgent
            ? const LinearGradient(
                colors: [AppColors.primary, AppColors.gradientEnd],
              )
            : const LinearGradient(
                colors: [Color(0xFF64748B), Color(0xFF94A3B8)],
              ),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

// ─── CSAT Card ───────────────────────────────────────────────────────────────

class _CsatCard extends StatefulWidget {
  final bool loading;
  final ValueChanged<int> onRate;

  const _CsatCard({required this.loading, required this.onRate});

  @override
  State<_CsatCard> createState() => _CsatCardState();
}

class _CsatCardState extends State<_CsatCard> {
  int? _hovered;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFFBEB), Color(0xFFFEF9EE)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.star_rounded, color: Color(0xFFD97706), size: 20),
              SizedBox(width: 8),
              Text(
                'How did we do?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF92400E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Rate your support experience for this ticket.',
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFFB45309),
            ),
          ),
          const SizedBox(height: 14),
          if (widget.loading)
            const Center(
              child: CircularProgressIndicator(color: AppColors.warning),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(5, (i) {
                final rating = i + 1;
                final isHovered = _hovered != null && _hovered! >= rating;
                return GestureDetector(
                  onTap: () => widget.onRate(rating),
                  onPanStart: (_) => setState(() => _hovered = rating),
                  onPanEnd: (_) => setState(() => _hovered = null),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.all(8),
                    child: Icon(
                      Icons.star_rounded,
                      size: 36,
                      color: isHovered
                          ? const Color(0xFFD97706)
                          : const Color(0xFFD1D5DB),
                    ),
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }
}

class _CsatThanksCard extends StatelessWidget {
  final int rating;

  const _CsatThanksCard({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.successBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.check_circle_rounded,
            color: AppColors.success,
            size: 22,
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Feedback submitted',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF14532D),
                ),
              ),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    Icons.star_rounded,
                    size: 16,
                    color: i < rating
                        ? const Color(0xFFD97706)
                        : const Color(0xFFD1D5DB),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Reply Box ───────────────────────────────────────────────────────────────

class _ReplyBox extends StatelessWidget {
  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;

  const _ReplyBox({
    required this.controller,
    required this.sending,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      padding: EdgeInsets.only(
        left: 16,
        right: 12,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 12,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: TextField(
                controller: controller,
                maxLines: null,
                minLines: 1,
                textCapitalization: TextCapitalization.sentences,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
                decoration: const InputDecoration(
                  hintText: 'Write a reply…',
                  hintStyle: TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 14,
                  ),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 11,
                  ),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: sending ? null : onSend,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.gradientEnd],
                ),
                borderRadius: BorderRadius.circular(13),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: sending
                  ? const Center(
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : const Icon(
                      Icons.send_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

Color _statusColor(String s) {
  switch (s) {
    case 'NEW': return AppColors.statusNew;
    case 'OPEN': return AppColors.statusOpen;
    case 'PENDING': return AppColors.statusPending;
    case 'ON_HOLD': return AppColors.statusOnHold;
    case 'RESOLVED': return AppColors.statusResolved;
    case 'CLOSED': return AppColors.statusClosed;
    default: return AppColors.textSecondary;
  }
}

Color _statusBg(String s) {
  switch (s) {
    case 'NEW': return AppColors.statusNewBg;
    case 'OPEN': return AppColors.statusOpenBg;
    case 'PENDING': return AppColors.statusPendingBg;
    case 'ON_HOLD': return AppColors.statusOnHoldBg;
    case 'RESOLVED': return AppColors.statusResolvedBg;
    case 'CLOSED': return AppColors.statusClosedBg;
    default: return AppColors.surfaceVariant;
  }
}

String _statusLabel(String s) {
  switch (s) {
    case 'ON_HOLD': return 'On Hold';
    default: return s[0] + s.substring(1).toLowerCase();
  }
}

Color _priorityColor(String p) {
  switch (p) {
    case 'CRITICAL': return AppColors.priorityCritical;
    case 'HIGH': return AppColors.priorityHigh;
    case 'MEDIUM': return AppColors.priorityMedium;
    default: return AppColors.priorityLow;
  }
}

Color _priorityBg(String p) {
  switch (p) {
    case 'CRITICAL': return AppColors.priorityCriticalBg;
    case 'HIGH': return AppColors.priorityHighBg;
    case 'MEDIUM': return AppColors.priorityMediumBg;
    default: return AppColors.priorityLowBg;
  }
}

String _formatDate(String isoDate) {
  final dt = DateTime.tryParse(isoDate);
  if (dt == null) return isoDate;
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return '${dt.day}/${dt.month}/${dt.year}';
}
