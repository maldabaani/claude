class SavedViewModel {
  final String id;
  final String name;
  final Map<String, dynamic> filters;
  final bool isDefault;

  SavedViewModel({required this.id, required this.name, required this.filters, required this.isDefault});

  factory SavedViewModel.fromJson(Map<String, dynamic> json) => SavedViewModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        filters: Map<String, dynamic>.from(json['filters'] ?? {}),
        isDefault: json['isDefault'] ?? false,
      );

  Map<String, dynamic> toJson() => {'name': name, 'filters': filters, 'isDefault': isDefault};
}
