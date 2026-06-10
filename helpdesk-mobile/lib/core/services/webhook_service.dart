import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/webhook_model.dart';

class WebhookService {
  final ApiClient _api;
  WebhookService(this._api);

  Future<List<WebhookModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.webhooks);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<WebhookModel>.from(list.map((e) => WebhookModel.fromJson(e)));
  }

  Future<WebhookModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.webhooks, data: data);
    return WebhookModel.fromJson(resp.data['data']);
  }

  Future<WebhookModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.webhooks}/$id', data: data);
    return WebhookModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.webhooks}/$id');
  }
}
