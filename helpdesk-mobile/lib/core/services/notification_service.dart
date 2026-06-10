import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/notification_model.dart';

class NotificationService {
  final _api = ApiClient();

  Future<Map<String, dynamic>> getNotifications({int page = 0, int size = 20}) async {
    final resp = await _api.get(ApiEndpoints.notifications, queryParams: {'page': page, 'size': size});
    final data = resp.data['data'];
    return {
      'content': (data['content'] as List).map((e) => NotificationModel.fromJson(e)).toList(),
      'totalElements': data['totalElements'] ?? 0,
    };
  }

  Future<int> getUnreadCount() async {
    try {
      final resp = await _api.get(ApiEndpoints.notificationsUnreadCount);
      return resp.data['data'] ?? 0;
    } catch (_) {
      return 0;
    }
  }

  Future<void> markAllRead() async {
    await _api.post(ApiEndpoints.notificationsMarkRead);
  }
}
