import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/help_topic_model.dart';

class HelpTopicService {
  final ApiClient _api;
  HelpTopicService(this._api);

  Future<List<HelpTopicModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.helpTopics);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<HelpTopicModel>.from(list.map((e) => HelpTopicModel.fromJson(e)));
  }

  Future<HelpTopicModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.helpTopics, data: data);
    return HelpTopicModel.fromJson(resp.data['data']);
  }

  Future<HelpTopicModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.helpTopics}/$id', data: data);
    return HelpTopicModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.helpTopics}/$id');
  }
}
