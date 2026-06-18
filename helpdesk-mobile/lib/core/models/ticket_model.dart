class TicketModel {
  final String id;
  final String ticketNumber;
  final String title;
  final String description;
  final String status;
  final String priority;
  final String? departmentId;
  final String createdById;
  final String? assignedAgentId;
  final Map<String, dynamic>? createdBy;
  final Map<String, dynamic>? assignedAgent;
  final List<String> tags;
  final bool slaBreached;
  final String? dueDate;
  final String? manualDueDate;
  final String? firstResponseAt;
  final String? resolvedAt;
  final String createdAt;
  final String updatedAt;
  final bool closedByAi;

  const TicketModel({
    required this.id,
    required this.ticketNumber,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    this.departmentId,
    required this.createdById,
    this.assignedAgentId,
    this.createdBy,
    this.assignedAgent,
    this.tags = const [],
    this.slaBreached = false,
    this.dueDate,
    this.manualDueDate,
    this.firstResponseAt,
    this.resolvedAt,
    required this.createdAt,
    required this.updatedAt,
    this.closedByAi = false,
  });

  factory TicketModel.fromJson(Map<String, dynamic> json) => TicketModel(
    id: json['id'] ?? '',
    ticketNumber: json['ticketNumber'] ?? '',
    title: json['title'] ?? '',
    description: json['description'] ?? '',
    status: json['status'] ?? 'NEW',
    priority: json['priority'] ?? 'MEDIUM',
    departmentId: json['departmentId'],
    createdById: json['createdById'] ?? '',
    assignedAgentId: json['assignedAgentId'],
    createdBy: json['createdBy'],
    assignedAgent: json['assignedAgent'],
    tags: List<String>.from(json['tags'] ?? []),
    slaBreached: json['slaBreached'] ?? false,
    dueDate: json['dueDate'],
    manualDueDate: json['manualDueDate'],
    firstResponseAt: json['firstResponseAt'],
    resolvedAt: json['resolvedAt'],
    createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
    updatedAt: json['updatedAt'] ?? DateTime.now().toIso8601String(),
    closedByAi: json['closedByAi'] ?? false,
  );

  String get assignedAgentName => assignedAgent?['fullName'] ?? 'Unassigned';
  String get createdByName => createdBy?['fullName'] ?? 'Unknown';
  bool get isResolved => status == 'RESOLVED' || status == 'CLOSED';
  bool get isOverdue {
    final due = manualDueDate ?? dueDate;
    if (due == null) return false;
    return DateTime.tryParse(due)?.isBefore(DateTime.now()) ?? false;
  }
}
