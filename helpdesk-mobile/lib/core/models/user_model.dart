class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? departmentId;
  final bool active;

  const UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.departmentId,
    this.active = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id'] ?? '',
    email: json['email'] ?? '',
    fullName: json['fullName'] ?? '',
    role: json['role'] ?? 'CUSTOMER',
    departmentId: json['departmentId'],
    active: json['active'] ?? true,
  );

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  bool get isAdmin => role == 'ADMIN';
  bool get isAgentOrAbove => role == 'AGENT' || role == 'TEAM_LEAD' || role == 'ADMIN';
  bool get isCustomer => role == 'CUSTOMER';
}
