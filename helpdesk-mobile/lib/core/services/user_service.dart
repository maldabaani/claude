import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/user_model.dart';

class UserService {
  final _api = ApiClient();

  Future<List<UserModel>> getUsers({String? role, int page = 0, int size = 100}) async {
    final params = <String, dynamic>{'page': page, 'size': size};
    if (role != null) params['role'] = role;
    final resp = await _api.get(ApiEndpoints.users, queryParams: params);
    final data = resp.data['data'];
    return (data['content'] as List).map((e) => UserModel.fromJson(e)).toList();
  }

  Future<UserModel> getMe() async {
    final resp = await _api.get(ApiEndpoints.me);
    return UserModel.fromJson(resp.data['data']);
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final resp = await _api.put(ApiEndpoints.me, data: data);
    return UserModel.fromJson(resp.data['data']);
  }

  Future<UserModel> createUser(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.users, data: data);
    return UserModel.fromJson(resp.data['data']);
  }

  Future<UserModel> updateUser(String id, Map<String, dynamic> data) async {
    final resp = await _api.put(ApiEndpoints.user(id), data: data);
    return UserModel.fromJson(resp.data['data']);
  }
}
