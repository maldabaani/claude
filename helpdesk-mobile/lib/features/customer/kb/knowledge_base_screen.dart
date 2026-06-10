import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/models/kb_article_model.dart';
import '../../../core/theme/app_colors.dart';

// SharedPreferences-free rated articles tracker using in-memory + static map
final _ratedArticles = <String>{};

class KnowledgeBaseScreen extends ConsumerStatefulWidget {
  const KnowledgeBaseScreen({super.key});

  @override
  ConsumerState<KnowledgeBaseScreen> createState() =>
      _KnowledgeBaseScreenState();
}

class _KnowledgeBaseScreenState extends ConsumerState<KnowledgeBaseScreen> {
  final _api = ApiClient();
  final _searchCtrl = TextEditingController();

  List<KbCategoryModel> _categories = [];
  List<KbArticleModel> _articles = [];
  String _selectedCategoryId = '';
  bool _loadingCategories = true;
  bool _loadingArticles = true;
  String? _error;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadArticles();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final resp = await _api.get(
        ApiEndpoints.kbCategories,
        queryParams: {'page': 0, 'size': 50},
      );
      final data = resp.data['data'];
      final List list = data is List ? data : (data['content'] ?? []);
      if (!mounted) return;
      setState(() {
        _categories = list.map((e) => KbCategoryModel.fromJson(e)).toList();
        _loadingCategories = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingCategories = false);
    }
  }

  Future<void> _loadArticles() async {
    setState(() {
      _loadingArticles = true;
      _error = null;
    });
    try {
      final params = <String, dynamic>{'page': 0, 'size': 50, 'published': true};
      if (_selectedCategoryId.isNotEmpty) {
        params['categoryId'] = _selectedCategoryId;
      }
      if (_searchQuery.isNotEmpty) params['search'] = _searchQuery;
      final resp = await _api.get(
        ApiEndpoints.kbArticles,
        queryParams: params,
      );
      final data = resp.data['data'];
      final List list = data is List ? data : (data['content'] ?? []);
      if (!mounted) return;
      setState(() {
        _articles = list.map((e) => KbArticleModel.fromJson(e)).toList();
        _loadingArticles = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load articles.';
        _loadingArticles = false;
      });
    }
  }

  void _selectCategory(String id) {
    if (_selectedCategoryId == id) return;
    setState(() => _selectedCategoryId = id);
    _loadArticles();
  }

  void _onSearch(String query) {
    setState(() => _searchQuery = query);
    _loadArticles();
  }

  Future<KbArticleModel> _trackView(KbArticleModel article) async {
    try {
      final resp = await _api.post(ApiEndpoints.kbArticleView(article.id), data: {});
      final data = resp.data['data'];
      if (data != null) return KbArticleModel.fromJson(data as Map<String, dynamic>);
    } catch (_) {}
    return article.copyWith(viewCount: article.viewCount + 1);
  }

  void _openArticle(BuildContext context, KbArticleModel article) async {
    final updated = await _trackView(article);
    if (!context.mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ArticleSheet(
        article: updated,
        api: _api,
        alreadyRated: _ratedArticles.contains(article.id),
        onRated: () => _ratedArticles.add(article.id),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Header ────────────────────────────────────────────────────
        Container(
          color: AppColors.surface,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Knowledge Base',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Find answers to common questions',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 14),

              // ── Search Bar ───────────────────────────────────────────
              Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: _onSearch,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Search articles…',
                    hintStyle: const TextStyle(
                      color: AppColors.textTertiary,
                      fontSize: 14,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: AppColors.textTertiary,
                      size: 20,
                    ),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              Icons.close_rounded,
                              size: 18,
                              color: AppColors.textTertiary,
                            ),
                            onPressed: () {
                              _searchCtrl.clear();
                              _onSearch('');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      vertical: 13,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // ── Category Chips ───────────────────────────────────────
              if (_loadingCategories)
                SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: 5,
                    itemBuilder: (_, __) => Container(
                      width: 80,
                      height: 32,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                )
              else
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _CategoryChip(
                        label: 'All',
                        count: null,
                        selected: _selectedCategoryId.isEmpty,
                        onTap: () => _selectCategory(''),
                      ),
                      ..._categories.map(
                        (cat) => _CategoryChip(
                          label: cat.name,
                          count: cat.articleCount,
                          selected: _selectedCategoryId == cat.id,
                          onTap: () => _selectCategory(cat.id),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 12),
            ],
          ),
        ),
        Container(height: 1, color: AppColors.border),

        // ── Article List ──────────────────────────────────────────────
        Expanded(
          child: _loadingArticles
              ? ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: 6,
                  itemBuilder: (_, __) => const _ArticleShimmer(),
                )
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.wifi_off_rounded,
                            size: 44,
                            color: AppColors.textTertiary,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            _error!,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _loadArticles,
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
                  : _articles.isEmpty
                      ? _EmptyState(
                          hasSearch: _searchQuery.isNotEmpty ||
                              _selectedCategoryId.isNotEmpty,
                          onClear: () {
                            _searchCtrl.clear();
                            setState(() {
                              _searchQuery = '';
                              _selectedCategoryId = '';
                            });
                            _loadArticles();
                          },
                        )
                      : RefreshIndicator(
                          onRefresh: _loadArticles,
                          color: AppColors.primary,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            itemCount: _articles.length,
                            itemBuilder: (context, i) => _ArticleCard(
                              article: _articles[i],
                              onTap: () =>
                                  _openArticle(context, _articles[i]),
                            ),
                          ),
                        ),
        ),
      ],
    );
  }
}

// ─── Category Chip ───────────────────────────────────────────────────────────

class _CategoryChip extends StatelessWidget {
  final String label;
  final int? count;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color:
                      selected ? Colors.white : AppColors.textSecondary,
                ),
              ),
              if (count != null) ...[
                const SizedBox(width: 5),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 5,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: selected
                        ? Colors.white.withOpacity(0.25)
                        : AppColors.border,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$count',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : AppColors.textTertiary,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Article Card ─────────────────────────────────────────────────────────────

class _ArticleCard extends StatelessWidget {
  final KbArticleModel article;
  final VoidCallback onTap;

  const _ArticleCard({required this.article, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x05000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.article_outlined,
                size: 22,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (article.categoryName != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 5),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        article.categoryName!,
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  Text(
                    article.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    _stripHtml(article.content),
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.remove_red_eye_outlined,
                        size: 13,
                        color: AppColors.textTertiary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${article.viewCount} views',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textTertiary,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text('👍', style: TextStyle(fontSize: 11)),
                      const SizedBox(width: 2),
                      Text(
                        '${article.helpfulYes}',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textTertiary,
                        ),
                      ),
                      const Spacer(),
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: AppColors.textTertiary,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Article Bottom Sheet ─────────────────────────────────────────────────────

class _ArticleSheet extends StatefulWidget {
  final KbArticleModel article;
  final ApiClient api;
  final bool alreadyRated;
  final VoidCallback onRated;

  const _ArticleSheet({
    required this.article,
    required this.api,
    required this.alreadyRated,
    required this.onRated,
  });

  @override
  State<_ArticleSheet> createState() => _ArticleSheetState();
}

class _ArticleSheetState extends State<_ArticleSheet> {
  late KbArticleModel _article;
  late bool _rated;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _article = widget.article;
    _rated = widget.alreadyRated;
  }

  Future<void> _submitRating(bool helpful) async {
    if (_rated || _submitting) return;
    setState(() => _submitting = true);
    try {
      final resp = await widget.api.post(
        ApiEndpoints.kbArticleRate(_article.id),
        data: {'helpful': helpful},
      );
      final data = resp.data['data'];
      if (mounted) {
        setState(() {
          if (data != null) {
            _article = KbArticleModel.fromJson(data as Map<String, dynamic>);
          } else {
            _article = helpful
                ? _article.copyWith(helpfulYes: _article.helpfulYes + 1)
                : _article.copyWith(helpfulNo: _article.helpfulNo + 1);
          }
          _rated = true;
          _submitting = false;
        });
        widget.onRated();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _article = helpful
              ? _article.copyWith(helpfulYes: _article.helpfulYes + 1)
              : _article.copyWith(helpfulNo: _article.helpfulNo + 1);
          _rated = true;
          _submitting = false;
        });
        widget.onRated();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_article.categoryName != null)
                          Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              _article.categoryName!,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        Text(
                          _article.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.close_rounded,
                      color: AppColors.textSecondary,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Meta
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  const Icon(
                    Icons.remove_red_eye_outlined,
                    size: 14,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${_article.viewCount} views',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text('👍', style: TextStyle(fontSize: 12)),
                  const SizedBox(width: 4),
                  Text(
                    '${_article.helpfulYes}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text('👎', style: TextStyle(fontSize: 12)),
                  const SizedBox(width: 4),
                  Text(
                    '${_article.helpfulNo}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Icon(
                    Icons.calendar_today_outlined,
                    size: 14,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(_article.createdAt),
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),

            Container(height: 1, color: AppColors.border),

            // Content
            Expanded(
              child: SingleChildScrollView(
                controller: scrollCtrl,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _parseContent(_article.content),
                ),
              ),
            ),

            // Bottom rating section
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
              child: _rated
                  ? Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFBBF7D0)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_outline, color: Color(0xFF16A34A), size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Thank you for your feedback!',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF16A34A),
                            ),
                          ),
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        Text(
                          'Was this article helpful?',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_article.helpfulYes} people found this helpful',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textTertiary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _HelpfulButton(
                              icon: Icons.thumb_up_outlined,
                              label: 'Yes (${_article.helpfulYes})',
                              color: AppColors.success,
                              bgColor: AppColors.successBg,
                              enabled: !_submitting,
                              onTap: () => _submitRating(true),
                            ),
                            const SizedBox(width: 12),
                            _HelpfulButton(
                              icon: Icons.thumb_down_outlined,
                              label: 'No (${_article.helpfulNo})',
                              color: AppColors.error,
                              bgColor: AppColors.errorBg,
                              enabled: !_submitting,
                              onTap: () => _submitRating(false),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _parseContent(String content) {
    final clean = _stripHtml(content);
    final paragraphs = clean.split('\n').where((l) => l.trim().isNotEmpty);
    return paragraphs
        .map(
          (p) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Text(
              p.trim(),
              style: const TextStyle(
                fontSize: 14.5,
                color: AppColors.textPrimary,
                height: 1.65,
              ),
            ),
          ),
        )
        .toList();
  }
}

class _HelpfulButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;
  final bool enabled;
  final VoidCallback onTap;

  const _HelpfulButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Opacity(
        opacity: enabled ? 1.0 : 0.5,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Article Shimmer ─────────────────────────────────────────────────────────

class _ArticleShimmer extends StatefulWidget {
  const _ArticleShimmer();

  @override
  State<_ArticleShimmer> createState() => _ArticleShimmerState();
}

class _ArticleShimmerState extends State<_ArticleShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.4, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Opacity(
        opacity: _anim.value,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _box(60, 14, 4),
                    const SizedBox(height: 6),
                    _box(double.infinity, 16, 4),
                    const SizedBox(height: 5),
                    _box(200, 12, 4),
                    const SizedBox(height: 10),
                    _box(80, 12, 4),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _box(double w, double h, double r) => Container(
        width: w,
        height: h,
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(r),
        ),
      );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final bool hasSearch;
  final VoidCallback onClear;

  const _EmptyState({required this.hasSearch, required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.search_off_rounded,
                size: 38,
                color: AppColors.textTertiary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              hasSearch ? 'No articles found' : 'No articles yet',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              hasSearch
                  ? 'Try adjusting your search or category filter.'
                  : 'The knowledge base is being prepared.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            if (hasSearch) ...[
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: onClear,
                icon: const Icon(
                  Icons.clear_all_rounded,
                  size: 16,
                  color: AppColors.primary,
                ),
                label: const Text(
                  'Clear filters',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

String _stripHtml(String html) {
  return html
      .replaceAll(RegExp(r'<[^>]*>'), '')
      .replaceAll(RegExp(r'&nbsp;'), ' ')
      .replaceAll(RegExp(r'&amp;'), '&')
      .replaceAll(RegExp(r'&lt;'), '<')
      .replaceAll(RegExp(r'&gt;'), '>')
      .replaceAll(RegExp(r'&quot;'), '"')
      .trim();
}

String _formatDate(String isoDate) {
  final dt = DateTime.tryParse(isoDate);
  if (dt == null) return isoDate;
  return '${dt.day}/${dt.month}/${dt.year}';
}
