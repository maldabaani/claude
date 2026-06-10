import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/sla_policy_model.dart';
import '../models/sla_rule_model.dart';

class SlaService {
  final ApiClient _api;
  SlaService(this._api);

  Future<List<SlaPolicyModel>> getPolicies() async {
    final resp = await _api.get(ApiEndpoints.slaPolicies);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<SlaPolicyModel>.from(list.map((e) => SlaPolicyModel.fromJson(e)));
  }

  Future<SlaPolicyModel> createPolicy(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.slaPolicies, data: data);
    return SlaPolicyModel.fromJson(resp.data['data']);
  }

  Future<SlaPolicyModel> updatePolicy(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.slaPolicies}/$id', data: data);
    return SlaPolicyModel.fromJson(resp.data['data']);
  }

  Future<void> deletePolicy(String id) async {
    await _api.delete('${ApiEndpoints.slaPolicies}/$id');
  }

  Future<List<SlaRuleModel>> getRules() async {
    final resp = await _api.get(ApiEndpoints.slaEscalations);
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<SlaRuleModel>.from(list.map((e) => SlaRuleModel.fromJson(e)));
  }

  Future<SlaRuleModel> createRule(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.slaEscalations, data: data);
    return SlaRuleModel.fromJson(resp.data['data']);
  }

  Future<SlaRuleModel> updateRule(String id, Map<String, dynamic> data) async {
    final resp = await _api.put('${ApiEndpoints.slaEscalations}/$id', data: data);
    return SlaRuleModel.fromJson(resp.data['data']);
  }

  Future<void> deleteRule(String id) async {
    await _api.delete('${ApiEndpoints.slaEscalations}/$id');
  }
}
