class DepartmentModel {
  final String id;
  final String name;
  final String? description;

  const DepartmentModel({required this.id, required this.name, this.description});

  factory DepartmentModel.fromJson(Map<String, dynamic> json) => DepartmentModel(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    description: json['description'],
  );
}
