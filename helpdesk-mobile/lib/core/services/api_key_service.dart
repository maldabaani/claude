import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/api_key_model.dart';

class ApiKeyService {
  final ApiClient _api;
  ApiKeyService(this._api);

  Future<List<ApiKeyModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.apiKeys);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<ApiKeyModel>.from(list.map((e) => ApiKeyModel.fromJson(e)));
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.apiKeys, data: data);
    return Map<String, dynamic>.from(resp.data['data']);
  }

  Future<void> revoke(String id) async {
    await _api.delete('${ApiEndpoints.apiKeys}/$id');
  }
}
