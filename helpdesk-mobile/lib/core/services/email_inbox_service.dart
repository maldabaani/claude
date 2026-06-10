import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/email_inbox_model.dart';

class EmailInboxService {
  final ApiClient _api;
  EmailInboxService(this._api);

  Future<List<EmailInboxModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.emailInboxes);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<EmailInboxModel>.from(list.map((e) => EmailInboxModel.fromJson(e)));
  }

  Future<EmailInboxModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.emailInboxes, data: data);
    return EmailInboxModel.fromJson(resp.data['data']);
  }

  Future<EmailInboxModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.emailInboxes}/$id', data: data);
    return EmailInboxModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.emailInboxes}/$id');
  }
}
