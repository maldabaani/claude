import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { KbService, KbCategory, KbArticle } from '../../../core/services/kb.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SkeletonModule],
  template: `
    <div class="space-y-6">

      <!-- CATEGORIES VIEW -->
      <div *ngIf="view() === 'categories'">
        <!-- Hero -->
        <div class="relative overflow-hidden rounded-2xl p-10 text-white text-center"
             style="background:linear-gradient(135deg,#1E40AF 0%,#2563EB 50%,#4F46E5 100%)">
          <div class="absolute top-0 right-0 opacity-10"
               style="width:280px;height:280px;border-radius:50%;background:white;transform:translate(35%,-35%)"></div>
          <div class="relative z-10">
            <h1 class="text-3xl font-black mb-2" style="letter-spacing:-0.03em">How can we help?</h1>
            <p class="text-blue-200 text-sm mb-6">Search our knowledge base or browse categories below</p>
            <div class="flex max-w-md mx-auto gap-2">
              <input
                pInputText
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search articles..."
                class="flex-1 rounded-xl border-0 px-4 py-2.5 text-gray-900 text-sm"
                style="background:rgba(255,255,255,0.95)"
                (keyup.enter)="onSearch()"
              />
              <button
                pButton
                label="Search"
                icon="pi pi-search"
                (click)="onSearch()"
                class="rounded-xl"
                style="background:white;color:#1D4ED8;border:none;font-weight:600"
              ></button>
            </div>
          </div>
        </div>

        <!-- Category Cards -->
        <div>
          <h2 class="font-bold text-gray-900 text-base mb-4" style="letter-spacing:-0.02em">Browse by Category</h2>

          <div *ngIf="loading()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p-skeleton *ngFor="let s of [1,2,3,4]" height="120px" borderRadius="12px"></p-skeleton>
          </div>

          <div *ngIf="!loading()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div *ngFor="let cat of categories()"
                 class="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
                 style="box-shadow:0 1px 3px rgba(0,0,0,0.05)"
                 (click)="selectCategory(cat)">
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background:#EFF6FF">
                  <i [class]="'pi ' + cat.icon" style="font-size:20px;color:#2563EB"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-gray-900 text-sm mb-1">{{ cat.name }}</p>
                  <p class="text-xs text-slate-400 leading-relaxed mb-2">{{ cat.description }}</p>
                  <span class="text-xs font-semibold" style="color:#2563EB">
                    {{ cat.articleCount }} article{{ cat.articleCount !== 1 ? 's' : '' }}
                  </span>
                </div>
                <i class="pi pi-chevron-right text-slate-300 shrink-0 mt-1" style="font-size:16px"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ARTICLES VIEW -->
      <div *ngIf="view() === 'articles'">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 mb-6">
          <button class="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                  style="color:#2563EB"
                  (click)="goToCategories()">
            <i class="pi pi-arrow-left" style="font-size:14px"></i>
            Knowledge Base
          </button>
          <span class="text-slate-300">/</span>
          <span class="text-sm font-semibold text-gray-700">{{ selectedCategory()?.name }}</span>
        </div>

        <div *ngIf="articlesLoading()" class="space-y-3">
          <p-skeleton *ngFor="let s of [1,2,3]" height="60px" borderRadius="10px"></p-skeleton>
        </div>

        <div *ngIf="!articlesLoading()" class="bg-white rounded-xl border border-gray-100 overflow-hidden"
             style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div *ngIf="articles().length === 0" class="py-16 text-center">
            <i class="pi pi-file text-slate-300" style="font-size:40px"></i>
            <p class="text-sm font-semibold text-slate-400 mt-4">No articles in this category yet</p>
          </div>
          <div *ngFor="let article of articles(); let last = last"
               class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
               (click)="openArticle(article)">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background:#EFF6FF">
              <i class="pi pi-file-o" style="font-size:15px;color:#2563EB"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 text-sm truncate">{{ article.title }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ article.viewCount }} views</p>
            </div>
            <i class="pi pi-chevron-right text-slate-300 shrink-0" style="font-size:16px"></i>
          </div>
        </div>
      </div>

      <!-- ARTICLE VIEW -->
      <div *ngIf="view() === 'article'">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 mb-6">
          <button class="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                  style="color:#2563EB"
                  (click)="backToArticles()">
            <i class="pi pi-arrow-left" style="font-size:14px"></i>
            Back to articles
          </button>
        </div>

        <div *ngIf="selectedArticle()" class="bg-white rounded-xl border border-gray-100 p-8"
             style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div class="flex items-center gap-2 mb-4">
            <span *ngIf="selectedArticle()!.categoryName"
                  class="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style="background:#EFF6FF;color:#1D4ED8">
              {{ selectedArticle()!.categoryName }}
            </span>
            <span class="text-xs text-slate-400">{{ selectedArticle()!.viewCount }} views</span>
          </div>

          <h1 class="text-2xl font-black text-gray-900 mb-6" style="letter-spacing:-0.03em">
            {{ selectedArticle()!.title }}
          </h1>

          <div class="text-sm text-gray-700 leading-relaxed" style="white-space:pre-wrap">{{ selectedArticle()!.body }}</div>

          <!-- Helpful -->
          <div class="mt-10 pt-6 border-t border-gray-100">
            <p class="text-sm font-semibold text-gray-700 mb-3">Was this article helpful?</p>
            <div class="flex items-center gap-3">
              <button
                pButton
                [label]="'Yes (' + selectedArticle()!.helpfulYes + ')'"
                icon="pi pi-thumbs-up"
                [disabled]="helpfulVoted()"
                (click)="markHelpful(true)"
                class="p-button-outlined p-button-sm rounded-xl"
                style="border-color:#22C55E;color:#16A34A"
              ></button>
              <button
                pButton
                [label]="'No (' + selectedArticle()!.helpfulNo + ')'"
                icon="pi pi-thumbs-down"
                [disabled]="helpfulVoted()"
                (click)="markHelpful(false)"
                class="p-button-outlined p-button-sm rounded-xl"
                style="border-color:#EF4444;color:#DC2626"
              ></button>
              <span *ngIf="helpfulVoted()" class="text-xs text-slate-400">Thanks for your feedback!</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SEARCH RESULTS VIEW -->
      <div *ngIf="view() === 'search'">
        <div class="flex items-center gap-2 mb-6">
          <button class="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                  style="color:#2563EB"
                  (click)="goToCategories()">
            <i class="pi pi-arrow-left" style="font-size:14px"></i>
            Knowledge Base
          </button>
          <span class="text-slate-300">/</span>
          <span class="text-sm text-slate-500">Search: "{{ searchQuery }}"</span>
        </div>

        <div *ngIf="articlesLoading()" class="space-y-3">
          <p-skeleton *ngFor="let s of [1,2,3]" height="60px" borderRadius="10px"></p-skeleton>
        </div>

        <div *ngIf="!articlesLoading()" class="bg-white rounded-xl border border-gray-100 overflow-hidden"
             style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div *ngIf="articles().length === 0" class="py-16 text-center">
            <i class="pi pi-search text-slate-300" style="font-size:40px"></i>
            <p class="text-sm font-semibold text-slate-400 mt-4">No results found for "{{ searchQuery }}"</p>
          </div>
          <div *ngFor="let article of articles(); let last = last"
               class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
               (click)="openArticle(article)">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background:#EFF6FF">
              <i class="pi pi-file-o" style="font-size:15px;color:#2563EB"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 text-sm truncate">{{ article.title }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ article.categoryName }}</p>
            </div>
            <i class="pi pi-chevron-right text-slate-300 shrink-0" style="font-size:16px"></i>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class KnowledgeBaseComponent implements OnInit {
  view = signal<'categories' | 'articles' | 'article' | 'search'>('categories');
  loading = signal(true);
  articlesLoading = signal(false);
  categories = signal<KbCategory[]>([]);
  articles = signal<KbArticle[]>([]);
  selectedCategory = signal<KbCategory | null>(null);
  selectedArticle = signal<KbArticle | null>(null);
  helpfulVoted = signal(false);
  searchQuery = '';

  constructor(private kbService: KbService) {}

  ngOnInit() {
    this.kbService.getCategories().subscribe({
      next: (cats) => { this.categories.set(cats); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  selectCategory(cat: KbCategory) {
    this.selectedCategory.set(cat);
    this.articlesLoading.set(true);
    this.view.set('articles');
    this.kbService.getArticles(cat.id).subscribe({
      next: (arts) => { this.articles.set(arts.filter(a => a.status === 'PUBLISHED')); this.articlesLoading.set(false); },
      error: () => this.articlesLoading.set(false),
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) return;
    this.articlesLoading.set(true);
    this.view.set('search');
    this.kbService.search(this.searchQuery.trim()).subscribe({
      next: (arts) => { this.articles.set(arts); this.articlesLoading.set(false); },
      error: () => this.articlesLoading.set(false),
    });
  }

  openArticle(article: KbArticle) {
    this.helpfulVoted.set(false);
    this.kbService.getArticle(article.id).subscribe({
      next: (a) => { this.selectedArticle.set(a); this.view.set('article'); },
    });
  }

  markHelpful(yes: boolean) {
    const article = this.selectedArticle();
    if (!article) return;
    this.kbService.helpful(article.id, yes).subscribe();
    this.helpfulVoted.set(true);
    if (yes) {
      this.selectedArticle.set({ ...article, helpfulYes: article.helpfulYes + 1 });
    } else {
      this.selectedArticle.set({ ...article, helpfulNo: article.helpfulNo + 1 });
    }
  }

  goToCategories() {
    this.view.set('categories');
    this.searchQuery = '';
  }

  backToArticles() {
    if (this.selectedCategory()) {
      this.view.set('articles');
    } else {
      this.view.set('categories');
    }
  }
}
