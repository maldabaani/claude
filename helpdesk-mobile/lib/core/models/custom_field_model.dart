class CustomFieldModel {
  final String id;
  final String name;
  final String fieldType;
  final bool required;
  final List<String> options;

  CustomFieldModel({required this.id, required this.name, required this.fieldType,
      required this.required, required this.options});

  factory CustomFieldModel.fromJson(Map<String, dynamic> json) => CustomFieldModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        fieldType: json['fieldType'] ?? 'TEXT',
        required: json['required'] ?? false,
        options: List<String>.from(json['options'] ?? []),
      );

  Map<String, dynamic> toJson() => {
        'name': name, 'fieldType': fieldType, 'required': required, 'options': options
      };
}
