import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/custom_field_model.dart';

class CustomFieldService {
  final ApiClient _api;
  CustomFieldService(this._api);

  Future<List<CustomFieldModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.customFields);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<CustomFieldModel>.from(list.map((e) => CustomFieldModel.fromJson(e)));
  }

  Future<CustomFieldModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.customFields, data: data);
    return CustomFieldModel.fromJson(resp.data['data']);
  }

  Future<CustomFieldModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.customFields}/$id', data: data);
    return CustomFieldModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.customFields}/$id');
  }
}
