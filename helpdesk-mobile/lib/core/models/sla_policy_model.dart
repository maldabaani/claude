class SlaPolicyModel {
  final String id;
  final String name;
  final String? description;
  final int responseTimeHours;
  final int resolutionTimeHours;
  final String priority;

  SlaPolicyModel({required this.id, required this.name, this.description,
      required this.responseTimeHours, required this.resolutionTimeHours, required this.priority});

  factory SlaPolicyModel.fromJson(Map<String, dynamic> json) => SlaPolicyModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        description: json['description'],
        responseTimeHours: json['responseTimeHours'] ?? 0,
        resolutionTimeHours: json['resolutionTimeHours'] ?? 0,
        priority: json['priority'] ?? 'LOW',
      );

  Map<String, dynamic> toJson() => {
        'name': name, 'description': description,
        'responseTimeHours': responseTimeHours,
        'resolutionTimeHours': resolutionTimeHours,
        'priority': priority,
      };
}
