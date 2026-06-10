import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/ticket_model.dart';
import '../models/comment_model.dart';

class TicketService {
  final _api = ApiClient();

  Future<Map<String, dynamic>> getTickets({
    int page = 0,
    int size = 15,
    String? status,
    String? priority,
    String? search,
    String? agentId,
  }) async {
    final params = <String, dynamic>{'page': page, 'size': size};
    if (status != null && status.isNotEmpty) params['status'] = status;
    if (priority != null && priority.isNotEmpty) params['priority'] = priority;
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (agentId != null) params['agentId'] = agentId;
    final resp = await _api.get(ApiEndpoints.tickets, queryParams: params);
    final data = resp.data['data'];
    return {
      'content': (data['content'] as List).map((e) => TicketModel.fromJson(e)).toList(),
      'totalElements': data['totalElements'] ?? 0,
      'totalPages': data['totalPages'] ?? 1,
    };
  }

  Future<TicketModel> getTicket(String id) async {
    final resp = await _api.get(ApiEndpoints.ticket(id));
    return TicketModel.fromJson(resp.data['data']);
  }

  Future<TicketModel> createTicket(Map<String, dynamic> data) async {
    final resp = await _api.post(ApiEndpoints.tickets, data: data);
    return TicketModel.fromJson(resp.data['data']);
  }

  Future<TicketModel> updateTicket(String id, Map<String, dynamic> data) async {
    final resp = await _api.put(ApiEndpoints.ticket(id), data: data);
    return TicketModel.fromJson(resp.data['data']);
  }

  Future<TicketModel> changeStatus(String id, String status) async {
    final resp = await _api.patch(ApiEndpoints.ticketStatus(id), data: {'status': status});
    return TicketModel.fromJson(resp.data['data']);
  }

  Future<TicketModel> assignTicket(String id, String agentId) async {
    final resp = await _api.patch(ApiEndpoints.ticketAssign(id), data: {'agentId': agentId});
    return TicketModel.fromJson(resp.data['data']);
  }

  Future<List<CommentModel>> getComments(String id) async {
    final resp = await _api.get(ApiEndpoints.ticketComments(id));
    return (resp.data['data'] as List).map((e) => CommentModel.fromJson(e)).toList();
  }

  Future<CommentModel> addComment(String id, String body, {bool internal = false}) async {
    final resp = await _api.post(ApiEndpoints.ticketComments(id), data: {'body': body, 'internal': internal});
    return CommentModel.fromJson(resp.data['data']);
  }
}
