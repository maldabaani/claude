class IssueModel {
  final String id;
  final String title;
  final String? description;
  final String status;
  final int ticketCount;
  final String? createdAt;

  IssueModel({required this.id, required this.title, this.description,
      required this.status, required this.ticketCount, this.createdAt});

  factory IssueModel.fromJson(Map<String, dynamic> json) => IssueModel(
        id: json['id']?.toString() ?? '',
        title: json['title'] ?? '',
        description: json['description'],
        status: json['status'] ?? 'OPEN',
        ticketCount: json['ticketCount'] ?? 0,
        createdAt: json['createdAt'],
      );

  Map<String, dynamic> toJson() => {'title': title, 'description': description, 'status': status};
}
