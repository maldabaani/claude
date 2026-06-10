import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/saved_view_model.dart';

class SavedViewService {
  final ApiClient _api;
  SavedViewService(this._api);

  Future<List<SavedViewModel>> getAll() async {
    final resp = await _api.get(ApiEndpoints.savedViews);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<SavedViewModel>.from(list.map((e) => SavedViewModel.fromJson(e)));
  }

  Future<SavedViewModel> create(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.savedViews, data: data);
    return SavedViewModel.fromJson(resp.data['data']);
  }

  Future<SavedViewModel> update(String id, Map<String, dynamic> data) async {
    final resp = await _api.put(ApiEndpoints.savedView(id), data: data);
    return SavedViewModel.fromJson(resp.data['data']);
  }

  Future<void> delete(String id) async {
    await _api.delete(ApiEndpoints.savedView(id));
  }
}
