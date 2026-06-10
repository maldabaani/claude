class TemplateModel {
  final String id;
  final String name;
  final String subject;
  final String body;
  final String? departmentId;

  TemplateModel({required this.id, required this.name, required this.subject, required this.body, this.departmentId});

  factory TemplateModel.fromJson(Map<String, dynamic> json) => TemplateModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        subject: json['subject'] ?? '',
        body: json['body'] ?? '',
        departmentId: json['departmentId']?.toString(),
      );

  Map<String, dynamic> toJson() => {'name': name, 'subject': subject, 'body': body, 'departmentId': departmentId};
}
