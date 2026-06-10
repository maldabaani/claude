class ApiKeyModel {
  final String id;
  final String name;
  final String? keyPrefix;
  final String? createdAt;
  final String? lastUsedAt;
  final bool active;

  ApiKeyModel({required this.id, required this.name, this.keyPrefix, this.createdAt, this.lastUsedAt, required this.active});

  factory ApiKeyModel.fromJson(Map<String, dynamic> json) => ApiKeyModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        keyPrefix: json['keyPrefix'],
        createdAt: json['createdAt'],
        lastUsedAt: json['lastUsedAt'],
        active: json['active'] ?? true,
      );

  Map<String, dynamic> toJson() => {'name': name, 'active': active};
}
