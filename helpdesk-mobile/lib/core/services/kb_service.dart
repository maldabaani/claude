import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/kb_article_model.dart';

class KbService {
  final _api = ApiClient();

  Future<List<KbCategoryModel>> getCategories() async {
    final resp = await _api.get(ApiEndpoints.kbCategories);
    return (resp.data['data'] as List).map((e) => KbCategoryModel.fromJson(e)).toList();
  }

  Future<List<KbArticleModel>> getArticles({String? categoryId, String? search}) async {
    final params = <String, dynamic>{};
    if (categoryId != null) params['categoryId'] = categoryId;
    if (search != null && search.isNotEmpty) params['search'] = search;
    final resp = await _api.get(ApiEndpoints.kbArticles, queryParams: params);
    return (resp.data['data'] as List).map((e) => KbArticleModel.fromJson(e)).toList();
  }

  Future<KbArticleModel> getArticle(String id) async {
    final resp = await _api.get(ApiEndpoints.kbArticle(id));
    return KbArticleModel.fromJson(resp.data['data']);
  }
}
