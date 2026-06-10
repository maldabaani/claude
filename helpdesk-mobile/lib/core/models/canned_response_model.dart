class CannedResponseModel {
  final String id;
  final String title;
  final String content;
  final String? category;

  CannedResponseModel({required this.id, required this.title, required this.content, this.category});

  factory CannedResponseModel.fromJson(Map<String, dynamic> json) => CannedResponseModel(
        id: json['id']?.toString() ?? '',
        title: json['title'] ?? '',
        content: json['content'] ?? '',
        category: json['category'],
      );

  Map<String, dynamic> toJson() => {'title': title, 'content': content, 'category': category};
}
