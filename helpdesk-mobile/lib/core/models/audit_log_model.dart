class AuditLogModel {
  final String id;
  final String action;
  final String? entityType;
  final String? entityId;
  final String? performedBy;
  final String? details;
  final String? createdAt;

  AuditLogModel({required this.id, required this.action, this.entityType, this.entityId,
      this.performedBy, this.details, this.createdAt});

  factory AuditLogModel.fromJson(Map<String, dynamic> json) => AuditLogModel(
        id: json['id']?.toString() ?? '',
        action: json['action'] ?? '',
        entityType: json['entityType'],
        entityId: json['entityId']?.toString(),
        performedBy: json['performedBy'] ?? json['performedByName'],
        details: json['details'],
        createdAt: json['createdAt'],
      );
}
