import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/organization_model.dart';

class OrganizationService {
  final ApiClient _api;
  OrganizationService(this._api);

  Future<List<OrganizationModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.organizations);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<OrganizationModel>.from(list.map((e) => OrganizationModel.fromJson(e)));
  }

  Future<OrganizationModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.organizations, data: data);
    return OrganizationModel.fromJson(resp.data['data']);
  }

  Future<OrganizationModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.organizations}/$id', data: data);
    return OrganizationModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.organizations}/$id');
  }
}
