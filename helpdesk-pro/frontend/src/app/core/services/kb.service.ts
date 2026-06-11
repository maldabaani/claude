import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface KbCategory { id: string; name: string; description: string; icon: string; articleCount: number; }
export interface KbArticle { id: string; title: string; slug: string; body: string; status: string; categoryId: string; categoryName: string; viewCount: number; helpfulYes: number; helpfulNo: number; createdAt: string; }
export interface KbArticleRequest { title: string; body: string; categoryId?: string; status: string; }

@Injectable({ providedIn: 'root' })
export class KbService {
  private base = `${environment.apiUrl}/kb`;
  constructor(private http: HttpClient) {}
  getCategories(): Observable<KbCategory[]> { return this.http.get<ApiResponse<KbCategory[]>>(`${this.base}/categories`).pipe(map(r => r.data)); }
  getArticles(categoryId?: string): Observable<KbArticle[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<ApiResponse<KbArticle[]>>(`${this.base}/articles`, { params }).pipe(map(r => r.data));
  }
  search(q: string): Observable<KbArticle[]> { return this.http.get<ApiResponse<KbArticle[]>>(`${this.base}/articles/search`, { params: { q } }).pipe(map(r => r.data)); }
  getArticle(id: string): Observable<KbArticle> { return this.http.get<ApiResponse<KbArticle>>(`${this.base}/articles/${id}`).pipe(map(r => r.data)); }
  trackView(id: string): Observable<KbArticle> { return this.http.post<ApiResponse<KbArticle>>(`${this.base}/articles/${id}/view`, null).pipe(map(r => r.data)); }
  rate(id: string, helpful: boolean): Observable<KbArticle> { return this.http.post<ApiResponse<KbArticle>>(`${this.base}/articles/${id}/rate`, { helpful }).pipe(map(r => r.data)); }
  create(data: KbArticleRequest): Observable<KbArticle> { return this.http.post<ApiResponse<KbArticle>>(`${this.base}/articles`, data).pipe(map(r => r.data)); }
  update(id: string, data: KbArticleRequest): Observable<KbArticle> { return this.http.put<ApiResponse<KbArticle>>(`${this.base}/articles/${id}`, data).pipe(map(r => r.data)); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/articles/${id}`); }
  helpful(id: string, yes: boolean): Observable<void> { return this.http.post<any>(`${this.base}/articles/${id}/helpful`, null, { params: { yes } }); }

  getRatedArticleIds(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem('kb_rated_articles') || '[]')); }
    catch { return new Set(); }
  }
  markRated(id: string): void {
    const rated = this.getRatedArticleIds();
    rated.add(id);
    localStorage.setItem('kb_rated_articles', JSON.stringify([...rated]));
  }
}
