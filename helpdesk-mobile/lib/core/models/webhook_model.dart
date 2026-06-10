class WebhookModel {
  final String id;
  final String url;
  final String? secret;
  final List<String> events;
  final bool active;

  WebhookModel({required this.id, required this.url, this.secret, required this.events, required this.active});

  factory WebhookModel.fromJson(Map<String, dynamic> json) => WebhookModel(
        id: json['id']?.toString() ?? '',
        url: json['url'] ?? '',
        secret: json['secret'],
        events: List<String>.from(json['events'] ?? []),
        active: json['active'] ?? true,
      );

  Map<String, dynamic> toJson() => {'url': url, 'secret': secret, 'events': events, 'active': active};
}
