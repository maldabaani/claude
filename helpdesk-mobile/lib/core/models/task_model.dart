class TaskModel {
  final String id;
  final String title;
  final bool completed;
  final String? ticketId;

  TaskModel({required this.id, required this.title, required this.completed, this.ticketId});

  factory TaskModel.fromJson(Map<String, dynamic> json) => TaskModel(
        id: json['id']?.toString() ?? '',
        title: json['title'] ?? '',
        completed: json['completed'] ?? false,
        ticketId: json['ticketId']?.toString(),
      );

  Map<String, dynamic> toJson() => {'title': title, 'completed': completed};
}
