import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/canned_response_model.dart';

class CannedResponseService {
  final ApiClient _api;
  CannedResponseService(this._api);

  Future<List<CannedResponseModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.cannedResponses);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<CannedResponseModel>.from(list.map((e) => CannedResponseModel.fromJson(e)));
  }

  Future<CannedResponseModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.cannedResponses, data: data);
    return CannedResponseModel.fromJson(resp.data['data']);
  }

  Future<CannedResponseModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.cannedResponses}/$id', data: data);
    return CannedResponseModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.cannedResponses}/$id');
  }
}
