class OrganizationModel {
  final String id;
  final String name;
  final String? domain;
  final String? contactEmail;

  OrganizationModel({required this.id, required this.name, this.domain, this.contactEmail});

  factory OrganizationModel.fromJson(Map<String, dynamic> json) => OrganizationModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        domain: json['domain'],
        contactEmail: json['contactEmail'],
      );

  Map<String, dynamic> toJson() => {'name': name, 'domain': domain, 'contactEmail': contactEmail};
}
