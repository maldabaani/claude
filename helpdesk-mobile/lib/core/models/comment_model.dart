class CommentModel {
  final String id;
  final String ticketId;
  final String body;
  final bool internal;
  final String authorId;
  final Map<String, dynamic>? author;
  final String createdAt;

  const CommentModel({
    required this.id,
    required this.ticketId,
    required this.body,
    required this.internal,
    required this.authorId,
    this.author,
    required this.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) => CommentModel(
    id: json['id'] ?? '',
    ticketId: json['ticketId'] ?? '',
    body: json['body'] ?? '',
    internal: json['internal'] ?? false,
    authorId: json['authorId'] ?? '',
    author: json['author'],
    createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
  );

  String get authorName => author?['fullName'] ?? 'Unknown';
  String get authorInitials {
    final name = authorName;
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }
}
