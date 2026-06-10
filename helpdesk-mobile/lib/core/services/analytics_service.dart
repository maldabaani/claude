import '../api/api_client.dart';
import '../api/api_endpoints.dart';

class AnalyticsService {
  final _api = ApiClient();

  Future<Map<String, dynamic>> getAnalytics({int days = 30}) async {
    final resp = await _api.get(ApiEndpoints.analytics, queryParams: {'days': days});
    return resp.data['data'] ?? {};
  }
}
