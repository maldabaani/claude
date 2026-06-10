class KbCategoryModel {
  final String id;
  final String name;
  final String? description;
  final int articleCount;

  const KbCategoryModel({required this.id, required this.name, this.description, this.articleCount = 0});

  factory KbCategoryModel.fromJson(Map<String, dynamic> json) => KbCategoryModel(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    description: json['description'],
    articleCount: json['articleCount'] ?? 0,
  );
}

class KbArticleModel {
  final String id;
  final String title;
  final String content;
  final String categoryId;
  final String? categoryName;
  final bool published;
  final int viewCount;
  final String createdAt;

  const KbArticleModel({
    required this.id,
    required this.title,
    required this.content,
    required this.categoryId,
    this.categoryName,
    required this.published,
    this.viewCount = 0,
    required this.createdAt,
  });

  factory KbArticleModel.fromJson(Map<String, dynamic> json) => KbArticleModel(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    content: json['content'] ?? '',
    categoryId: json['categoryId'] ?? '',
    categoryName: json['categoryName'],
    published: json['published'] ?? true,
    viewCount: json['viewCount'] ?? 0,
    createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
  );
}
