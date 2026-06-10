class HelpTopicModel {
  final String id;
  final String name;
  final String? departmentId;
  final bool active;

  HelpTopicModel({required this.id, required this.name, this.departmentId, required this.active});

  factory HelpTopicModel.fromJson(Map<String, dynamic> json) => HelpTopicModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        departmentId: json['departmentId']?.toString(),
        active: json['active'] ?? true,
      );

  Map<String, dynamic> toJson() => {'name': name, 'departmentId': departmentId, 'active': active};
}
