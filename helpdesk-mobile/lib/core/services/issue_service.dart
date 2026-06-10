import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/issue_model.dart';

class IssueService {
  final ApiClient _api;
  IssueService(this._api);

  Future<List<IssueModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.issues);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<IssueModel>.from(list.map((e) => IssueModel.fromJson(e)));
  }

  Future<IssueModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.issues, data: data);
    return IssueModel.fromJson(resp.data['data']);
  }

  Future<IssueModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put(ApiEndpoints.issue(id), data: data);
    return IssueModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete(ApiEndpoints.issue(id));
  }

  Future<List<dynamic>> getLinkedTickets(String id) async {
    final resp = await _api.get(ApiEndpoints.issueTickets(id));
    final data = resp.data['data'];
    return data is List ? data : (data['content'] ?? []);
  }
}
