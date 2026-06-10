import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/department_model.dart';

class DepartmentService {
  final _api = ApiClient();

  Future<List<DepartmentModel>> getDepartments() async {
    final resp = await _api.get(ApiEndpoints.departments, queryParams: {'page': 0, 'size': 100});
    final data = resp.data['data'];
    return (data['content'] as List).map((e) => DepartmentModel.fromJson(e)).toList();
  }
}
