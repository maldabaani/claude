import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/audit_log_model.dart';

class AuditService {
  final ApiClient _api;
  AuditService(this._api);

  Future<List<AuditLogModel>> getLogs({Map<String, dynamic>? filters}) async {
    final resp = await _api.get(ApiEndpoints.auditLog, queryParams: filters);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<AuditLogModel>.from(list.map((e) => AuditLogModel.fromJson(e)));
  }
}
