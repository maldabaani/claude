class SlaRuleModel {
  final String id;
  final String name;
  final String? condition;
  final String? action;
  final String priority;

  SlaRuleModel({required this.id, required this.name, this.condition, this.action, required this.priority});

  factory SlaRuleModel.fromJson(Map<String, dynamic> json) => SlaRuleModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        condition: json['condition'],
        action: json['action'],
        priority: json['priority'] ?? 'LOW',
      );

  Map<String, dynamic> toJson() => {'name': name, 'condition': condition, 'action': action, 'priority': priority};
}
