import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/task_model.dart';

class TaskService {
  final ApiClient _api;
  TaskService(this._api);

  Future<List<TaskModel>> getTasks(String ticketId) async {
    final resp = await _api.get(ApiEndpoints.ticketTasks(ticketId));
    final data = resp.data['data'];
    final list = data is List ? data : (data['content'] ?? []);
    return List<TaskModel>.from(list.map((e) => TaskModel.fromJson(e)));
  }

  Future<TaskModel> createTask(String ticketId, String title) async {
    final resp = await _api.post(ApiEndpoints.ticketTasks(ticketId), data: {'title': title});
    return TaskModel.fromJson(resp.data['data']);
  }

  Future<TaskModel> toggleTask(String ticketId, String taskId) async {
    final resp = await _api.post(ApiEndpoints.ticketTaskToggle(ticketId, taskId));
    return TaskModel.fromJson(resp.data['data']);
  }

  Future<void> deleteTask(String ticketId, String taskId) async {
    await _api.delete(ApiEndpoints.ticketTask(ticketId, taskId));
  }
}
