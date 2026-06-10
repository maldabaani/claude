import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/template_model.dart';

class TemplateService {
  final ApiClient _api;
  TemplateService(this._api);

  Future<List<TemplateModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.templates);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<TemplateModel>.from(list.map((e) => TemplateModel.fromJson(e)));
  }

  Future<TemplateModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.templates, data: data);
    return TemplateModel.fromJson(resp.data['data']);
  }

  Future<TemplateModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.templates}/$id', data: data);
    return TemplateModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.templates}/$id');
  }
}
