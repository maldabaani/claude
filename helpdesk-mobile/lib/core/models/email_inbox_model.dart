class EmailInboxModel {
  final String id;
  final String name;
  final String email;
  final String? protocol;
  final String? host;
  final int? port;
  final bool active;

  EmailInboxModel({required this.id, required this.name, required this.email,
      this.protocol, this.host, this.port, required this.active});

  factory EmailInboxModel.fromJson(Map<String, dynamic> json) => EmailInboxModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        protocol: json['protocol'],
        host: json['host'],
        port: json['port'],
        active: json['active'] ?? true,
      );

  Map<String, dynamic> toJson() => {
        'name': name, 'email': email, 'protocol': protocol, 'host': host, 'port': port, 'active': active
      };
}
