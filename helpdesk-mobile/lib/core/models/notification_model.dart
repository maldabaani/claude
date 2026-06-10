class NotificationModel {
  final String id;
  final String recipientId;
  final String event;
  final String message;
  final String? referenceId;
  final bool read;
  final String createdAt;

  const NotificationModel({
    required this.id,
    required this.recipientId,
    required this.event,
    required this.message,
    this.referenceId,
    required this.read,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
    id: json['id'] ?? '',
    recipientId: json['recipientId'] ?? '',
    event: json['event'] ?? '',
    message: json['message'] ?? '',
    referenceId: json['referenceId'],
    read: json['read'] ?? false,
    createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
  );
}
