import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { KeyboardShortcutService } from '../../../core/services/keyboard-shortcut.service';
import { TagService, Tag as ManagedTag } from '../../../core/services/tag.service';
import { UserService } from '../../../core/services/user.service';
import { DepartmentService } from '../../../core/services/department.service';
import { CannedResponseService, CannedResponse as CannedResponseModel } from '../../../core/services/canned-response.service';
import { CustomFieldService, CustomField } from '../../../core/services/custom-field.service';
import { TaskService, TicketTask } from '../../../core/services/task.service';
import { IssueService, Issue } from '../../../core/services/issue.service';
import { PresenceService, PresenceViewer } from '../../../core/services/presence.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { DraftService } from '../../../core/services/draft.service';
import { TimeEntryService, TimeEntry } from '../../../core/services/time-entry.service';
import { TicketLinkService, TicketLink, LinkType } from '../../../core/services/ticket-link.service';
import { TicketParentService, TicketSummary } from '../../../core/services/ticket-parent.service';
import { MacroService, Macro } from '../../../core/services/macro.service';
import { Ticket, Comment, TicketStatus, User, Department, Attachment } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { environment } from '../../../../environments/environment';
import { HlmButtonComponent } from '../../../shared/ui/hlm-button/hlm-button.component';
import { HlmInputDirective } from '../../../shared/ui/hlm-input/hlm-input.component';
import { HlmCheckboxDirective } from '../../../shared/ui/hlm-checkbox/hlm-checkbox.component';
import { HlmSelectDirective } from '../../../shared/ui/hlm-select/hlm-select.component';
import { HlmModalComponent } from '../../../shared/ui/hlm-modal/hlm-modal.component';

@Component({
  selector: 'app-agent-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule, DatePipe,
    HlmButtonComponent, HlmInputDirective, HlmCheckboxDirective, HlmSelectDirective, HlmModalComponent,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <app-skeleton-loader *ngIf="loading()" type="card" />

    <div *ngIf="!loading() && ticket()" class="space-y-5">

      <!-- Collision warning -->
      <div *ngIf="otherViewers().length > 0"
           class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
           style="background:#FEF3C7;border:1px solid #FDE68A;color:#92400E">
        <i class="pi pi-eye" style="font-size:16px;color:#D97706"></i>
        <span>Also viewing: <strong>{{ otherViewers()[0].agentName }}<ng-container *ngIf="otherViewers().length > 1">, +{{ otherViewers().length - 1 }} more</ng-container></strong></span>
        <span class="ml-2 text-xs" style="color:#B45309">Be careful — replies may conflict</span>
      </div>

      <!-- Split from banner -->
      <div *ngIf="ticket()?.splitFromId"
           class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
           style="background:#F0F9FF;border:1px solid #BAE6FD;color:#0369A1">
        <i class="pi pi-sitemap" style="font-size:16px;color:#0284C7"></i>
        <span>Split from <a [routerLink]="['/agent/tickets', ticket()!.splitFromId]"
              class="font-bold hover:underline">#{{ ticket()!.splitFromNumber }}</a></span>
      </div>

      <!-- Snooze banner -->
      <div *ngIf="ticket()?.snoozedUntil"
           class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
           style="background:#FFFBEB;border:1px solid #FDE68A;color:#92400E">
        <span style="font-size:16px">💤</span>
        <span>Snoozed until <strong>{{ ticket()!.snoozedUntil | date:'MMM d, h:mm a' }}</strong></span>
        <button (click)="unsnooze()"
                class="ml-auto px-3 py-1 rounded-lg text-xs font-bold border"
                style="border-color:#D97706;color:#D97706;background:white">
          Wake up
        </button>
      </div>

      <!-- Back nav -->
      <div class="flex items-center justify-between">
        <a routerLink="/agent/queue"
           class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-gray-900 transition-colors">
          <i class="pi pi-arrow-left" style="font-size:16px"></i>
          Back to queue
        </a>
        <button *ngIf="!ticket()?.snoozedUntil" (click)="showSnoozeDialog = true"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                title="Snooze ticket (S)">
          <span>💤</span>
          Snooze
        </button>
        <button (click)="openMacroOverlay()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
          <i class="pi pi-bolt" style="font-size:12px"></i>
          Run Macro
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- ── Left: Main thread ── -->
        <div class="lg:col-span-2 space-y-4">

          <!-- Ticket header -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="h-1 w-full" [ngClass]="topBarClass()"></div>
            <div class="p-6">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-mono font-bold text-slate-400">{{ ticket()!.ticketNumber }}</span>
                <span class="text-slate-300">•</span>
                <span class="text-xs text-slate-400">{{ ticket()!.createdAt | timeAgo }}</span>
              </div>
              <h1 class="text-xl font-black text-gray-900 mb-3" style="letter-spacing:-0.02em">{{ ticket()!.title }}</h1>
              <div class="rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                   style="background:#F8FAFC;border:1px solid #F1F5F9">
                {{ ticket()!.description }}
              </div>
              <p class="text-xs text-slate-400 mt-3 font-medium">
                Submitted by <span class="text-gray-700 font-semibold">{{ ticket()!.createdBy?.fullName }}</span>
              </p>

              <!-- Attachments -->
              <div *ngIf="attachments().length > 0" class="mt-4">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</p>
                <div class="flex flex-wrap gap-2">
                  <a *ngFor="let att of attachments()"
                     [href]="getDownloadUrl(att.id)"
                     target="_blank"
                     class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-blue-50 transition-colors"
                     style="background:#F8FAFC;border-color:#E2E8F0;color:#2563EB">
                    <i class="pi pi-paperclip" style="font-size:12px"></i>
                    {{ att.fileName }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Conversation thread -->
          <div *ngIf="comments().length > 0" class="space-y-3">
            <div *ngFor="let comment of comments()"
                 class="flex gap-3"
                 [class.flex-row-reverse]="comment.internal">

              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                   [ngClass]="comment.internal ? 'bg-amber-500' : 'bg-gradient-to-br from-blue-600 to-blue-700'">
                {{ comment.author.fullName[0] }}
              </div>

              <div class="flex-1 max-w-2xl">
                <div class="rounded-2xl p-4 text-sm"
                     [ngClass]="comment.internal
                       ? 'rounded-tr-sm bg-amber-50 border border-amber-200'
                       : 'rounded-tl-sm bg-white border border-gray-100'"
                     [style.box-shadow]="'0 1px 3px rgba(0,0,0,0.04)'">
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="font-bold text-gray-900 text-sm">{{ comment.author.fullName }}</span>
                    <span *ngIf="comment.internal"
                          class="px-2 py-0.5 rounded-full text-xs font-bold"
                          style="background:#FDE68A;color:#78350F">
                      Internal Note
                    </span>
                    <span class="text-xs text-slate-400 font-medium ml-auto">{{ comment.createdAt | timeAgo }}</span>
                  </div>
                  <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ comment.body }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Reply card -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-gray-900 text-sm">Reply</h3>
                <div class="flex items-center gap-2">
                  <div class="relative">
                    <button type="button" (click)="showCannedPanel.set(!showCannedPanel())"
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      <i class="pi pi-bookmark" style="font-size:12px"></i>
                      Canned
                    </button>
                    <div *ngIf="showCannedPanel()"
                         class="absolute right-0 z-50 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                         style="width:320px">
                      <div class="p-3 border-b border-gray-100">
                        <input hlmInput class="w-full" placeholder="Search responses..."
                               [ngModel]="cannedSearch()" (ngModelChange)="setCannedSearch($event)" />
                      </div>
                      <div class="max-h-64 overflow-y-auto">
                        <div *ngFor="let r of filteredCanned()"
                             (click)="insertCanned(r); showCannedPanel.set(false)"
                             class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 transition-colors">
                          <p class="text-sm font-semibold text-gray-900">{{ r.title }}</p>
                          <p class="text-xs text-slate-400 mt-0.5 truncate">{{ r.body }}</p>
                        </div>
                        <div *ngIf="filteredCanned().length === 0" class="px-4 py-6 text-center text-xs text-slate-400">
                          No responses found
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                    <button type="button" (click)="noteMode = 'public'"
                            class="px-3 py-1.5 transition-colors"
                            [class.bg-primary-600]="noteMode === 'public'"
                            [class.text-white]="noteMode === 'public'"
                            [class.text-gray-600]="noteMode !== 'public'">
                      Public
                    </button>
                    <button type="button" (click)="noteMode = 'internal'"
                            class="px-3 py-1.5 transition-colors border-l border-gray-200"
                            [class.bg-amber-500]="noteMode === 'internal'"
                            [class.text-white]="noteMode === 'internal'"
                            [class.text-gray-600]="noteMode !== 'internal'">
                      Internal
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="noteMode === 'internal'"
                   class="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3 text-xs font-medium"
                   style="background:#FFFBEB;border:1px solid #FDE68A;color:#92400E">
                <i class="pi pi-lock" style="font-size:14px"></i>
                Internal note — only agents can see this
              </div>

              <div class="relative">
                <textarea #replyTextarea hlmInput [formControl]="replyControl" rows="4" class="w-full"
                          [placeholder]="noteMode === 'internal'
                            ? 'Add an internal note visible only to your team... Use &#64; to mention agents'
                            : 'Type a reply to the customer...'"
                          (input)="onReplyInput($event)"
                          (keydown)="onReplyKeydown($event)"></textarea>
                <div *ngIf="showMentionDropdown() && noteMode === 'internal'"
                     class="absolute z-50 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                     style="min-width:200px;max-height:200px;overflow-y:auto;top:100%;left:0;margin-top:4px">
                  <div *ngIf="mentionFilteredAgents().length === 0" class="px-4 py-3 text-xs text-slate-400">No agents found</div>
                  <div *ngFor="let agent of mentionFilteredAgents(); let i = index"
                       (mousedown)="insertMention(agent)"
                       class="px-4 py-2.5 cursor-pointer flex items-center gap-2.5 hover:bg-blue-50 transition-colors"
                       [class.bg-blue-50]="i === mentionSelectedIndex()">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                         style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                      {{ agent.fullName[0] }}
                    </div>
                    <span class="text-sm font-medium text-gray-800">{{ agent.fullName }}</span>
                  </div>
                </div>
              </div>

              <!-- Draft indicator -->
              <div *ngIf="draftSavedAt()" class="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span>💾 Draft saved {{ draftSavedAt() | date:'h:mm a' }}</span>
                <button type="button" (click)="discardDraft()"
                        class="text-xs text-red-400 hover:text-red-600 underline transition-colors">
                  Discard draft
                </button>
              </div>

              <!-- Pending files -->
              <div *ngIf="pendingFiles().length > 0" class="flex flex-wrap gap-2 mt-2">
                <div *ngFor="let f of pendingFiles()"
                     class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                     style="background:#F0FDF4;border-color:#BBF7D0;color:#166534">
                  <i class="pi pi-file" style="font-size:11px"></i>
                  {{ f.name }}
                  <button type="button" (click)="removeFile(f)" class="hover:text-red-500 transition-colors ml-1">
                    <i class="pi pi-times" style="font-size:10px"></i>
                  </button>
                </div>
              </div>

              <!-- Sentiment Panel -->
              <div *ngIf="sentiment()" class="mt-3 rounded-xl border border-amber-200 overflow-hidden" style="background:#FFFBEB">
                <div class="px-4 py-2.5 flex items-center justify-between" style="border-bottom:1px solid #FDE68A">
                  <span class="text-xs font-bold text-amber-700">😊 Customer Sentiment</span>
                  <button (click)="dismissSentiment()" class="text-amber-300 hover:text-amber-600 transition-colors leading-none">
                    <i class="pi pi-times" style="font-size:11px"></i>
                  </button>
                </div>
                <div class="p-4 space-y-2">
                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                      [ngClass]="{
                        'bg-green-100 text-green-700': sentiment()!.sentiment === 'positive',
                        'bg-gray-100 text-gray-600': sentiment()!.sentiment === 'neutral',
                        'bg-red-100 text-red-700': sentiment()!.sentiment === 'negative' || sentiment()!.sentiment === 'frustrated',
                        'bg-orange-100 text-orange-700': sentiment()!.sentiment === 'urgent'
                      }">{{ sentiment()!.sentiment | titlecase }}</span>
                    <div class="flex-1 bg-gray-100 rounded-full h-2">
                      <div class="h-2 rounded-full transition-all"
                        [style.width.%]="sentiment()!.score * 10"
                        [ngClass]="{
                          'bg-green-400': sentiment()!.score >= 7,
                          'bg-amber-400': sentiment()!.score >= 4 && sentiment()!.score < 7,
                          'bg-red-400': sentiment()!.score < 4
                        }"></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-500">{{ sentiment()!.score }}/10</span>
                  </div>
                  <p class="text-xs text-amber-800">💡 {{ sentiment()!.action }}</p>
                </div>
              </div>
              <div *ngIf="sentimentError()" class="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                <i class="pi pi-exclamation-circle" style="font-size:11px"></i>
                {{ sentimentError() }}
              </div>

                            <!-- AI Summary Panel -->
              <div *ngIf="aiSummary()" class="mt-3 rounded-xl border border-teal-200 overflow-hidden" style="background:#F0FDFA">
                <div class="px-4 py-2.5 flex items-center justify-between" style="border-bottom:1px solid #99F6E4">
                  <span class="text-xs font-bold text-teal-700">🧠 AI Summary</span>
                  <button (click)="dismissAiSummary()" class="text-teal-300 hover:text-teal-600 transition-colors leading-none">
                    <i class="pi pi-times" style="font-size:11px"></i>
                  </button>
                </div>
                <div class="p-4">
                  <p class="text-sm text-gray-700 leading-relaxed">{{ aiSummary() }}</p>
                </div>
              </div>

              <!-- AI Summary error -->
              <div *ngIf="aiSummaryError()" class="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                <i class="pi pi-exclamation-circle" style="font-size:11px"></i>
                {{ aiSummaryError() }}
              </div>

              <!-- AI Suggestion Panel -->
              <div *ngIf="aiSuggestion()" class="mt-3 rounded-xl border border-indigo-200 overflow-hidden" style="background:#F5F3FF">
                <div class="px-4 py-2.5 flex items-center justify-between" style="border-bottom:1px solid #DDD6FE">
                  <span class="text-xs font-bold text-indigo-700">✨ AI Suggestion — review and edit before applying</span>
                  <button (click)="dismissAiSuggestion()" class="text-indigo-300 hover:text-indigo-600 transition-colors leading-none">
                    <i class="pi pi-times" style="font-size:11px"></i>
                  </button>
                </div>
                <div class="p-4 space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                      <select hlmSelect [(ngModel)]="aiSuggestCategory" class="w-full">
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="account">Account</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                      <select hlmSelect [(ngModel)]="aiSuggestPriority" class="w-full">
                        <option *ngFor="let opt of priorityOptions" [value]="opt.value">{{ opt.label }}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Suggested Response</label>
                    <textarea [(ngModel)]="aiSuggestResponse" rows="3"
                              class="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-400"
                              style="font-family:inherit;resize:vertical"></textarea>
                  </div>
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="dismissAiSuggestion()"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      Dismiss
                    </button>
                    <button (click)="applyAiSuggestion()"
                            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                            style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                      <i class="pi pi-check" style="font-size:11px"></i>
                      Apply to Ticket
                    </button>
                  </div>
                </div>
              </div>

              <!-- AI error -->
              <div *ngIf="aiError()" class="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                <i class="pi pi-exclamation-circle" style="font-size:11px"></i>
                {{ aiError() }}
              </div>

              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center gap-2">
                  <input type="file" #fileInput (change)="onFileSelected($event)" multiple style="display:none">
                  <button type="button" (click)="fileInput.click()"
                          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    <i class="pi pi-paperclip" style="font-size:14px"></i>
                    Attach
                  </button>
                  <button type="button" (click)="requestAiSuggestion()"
                          [disabled]="aiLoading()"
                          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50">
                    <i [class]="aiLoading() ? 'pi pi-spinner pi-spin' : 'pi pi-sparkles'" style="font-size:14px"></i>
                    {{ aiLoading() ? 'Thinking…' : 'AI Suggest' }}
                  </button>
                  <button type="button" (click)="requestSentiment()"
                          [disabled]="sentimentLoading()"
                          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50">
                    <i [class]="sentimentLoading() ? 'pi pi-spinner pi-spin' : 'pi pi-heart'" style="font-size:14px"></i>
                    {{ sentimentLoading() ? 'Analyzing…' : 'Sentiment' }}
                  </button>
                  <button type="button" (click)="requestAiSummary()"
                          [disabled]="aiSummaryLoading()"
                          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-teal-200 text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50">
                    <i [class]="aiSummaryLoading() ? 'pi pi-spinner pi-spin' : 'pi pi-align-left'" style="font-size:14px"></i>
                    {{ aiSummaryLoading() ? 'Summarizing…' : 'AI Summary' }}
                  </button>
                  <button type="button" (click)="requestSmartReply()"
                          [disabled]="smartReplyLoading()"
                          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                    <i [class]="smartReplyLoading() ? 'pi pi-spinner pi-spin' : 'pi pi-reply'" style="font-size:14px"></i>
                    {{ smartReplyLoading() ? 'Drafting…' : 'Smart Reply' }}
                  </button>
                </div>
                <button (click)="sendReply()"
                        [disabled]="replyControl.invalid || submitting"
                        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        [style.background]="noteMode === 'internal' ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#2563EB,#1D4ED8)'"
                        style="box-shadow:0 2px 8px rgba(0,0,0,0.15)"
                        title="Focus reply textarea (R)">
                  <i class="pi pi-send" style="font-size:16px"></i>
                  {{ submitting ? 'Sending...' : (noteMode === 'internal' ? 'Add Note' : 'Send Reply') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Right: Sidebar details ── -->
        <div class="space-y-4">

          <!-- Status & Actions -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="px-5 py-4" style="border-bottom:1px solid #F1F5F9">
              <h3 class="font-bold text-gray-900 text-sm">Ticket Details</h3>
            </div>
            <div class="p-5 space-y-5">

              <!-- Status -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Status
                  <span class="ml-1 text-slate-300 font-normal normal-case tracking-normal" style="font-size:10px">(E) resolve</span>
                </label>
                <select hlmSelect [(ngModel)]="currentStatus" (ngModelChange)="updateStatus()" class="w-full">
                  <option *ngFor="let opt of statusOptions" [value]="opt.value">{{ opt.label }}</option>
                </select>
                <div *ngIf="ticket()!.closedByAi" class="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-200">
                  <i class="pi pi-android" style="font-size:11px"></i>
                  Closed by AI Agent
                </div>
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <div class="flex items-center gap-2 flex-wrap">
                  <app-priority-badge [priority]="ticket()!.priority" />
                  <button (click)="autoCategorize()" [disabled]="autoCategorizeLoading()"
                          class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50"
                          title="AI sets category & priority automatically">
                    <i [class]="autoCategorizeLoading() ? 'pi pi-spinner pi-spin' : 'pi pi-bolt'" style="font-size:11px"></i>
                    {{ autoCategorizeLoading() ? '…' : 'Auto' }}
                  </button>
                </div>
              </div>

              <!-- SLA -->
              <div *ngIf="ticket()!.dueDate">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SLA Due</label>
                <div class="flex items-center gap-2" [ngClass]="ticket()!.slaBreached ? 'text-red-600' : 'text-gray-700'">
                  <i *ngIf="ticket()!.slaBreached" class="pi pi-exclamation-triangle text-red-500" style="font-size:14px"></i>
                  <span class="text-sm font-semibold">{{ ticket()!.dueDate | date:'MMM d, h:mm a' }}</span>
                </div>
                <p *ngIf="ticket()!.slaBreached" class="text-xs text-red-500 font-medium mt-1">SLA Breached</p>
              </div>

              <!-- Duplicate Detection -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Duplicates</label>
                  <button (click)="checkDuplicates()" [disabled]="duplicatesLoading()"
                          class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
                    <i [class]="duplicatesLoading() ? 'pi pi-spinner pi-spin' : 'pi pi-search'" style="font-size:11px"></i>
                    {{ duplicatesLoading() ? '…' : 'Check' }}
                  </button>
                </div>
                <div *ngIf="duplicatesChecked() && duplicates().length === 0" class="text-xs text-slate-400">No duplicates found</div>
                <div *ngFor="let dup of duplicates()" class="mb-2 p-2 rounded-lg border border-rose-100 bg-rose-50">
                  <a [routerLink]="['/agent/tickets', dup.id]" class="text-xs font-bold text-rose-700 hover:underline">#{{ dup.ticketNumber }}</a>
                  <span class="ml-1 text-xs text-rose-600 font-semibold">{{ dup.similarityScore }}% match</span>
                  <p class="text-xs text-slate-600 mt-0.5 leading-snug">{{ dup.title }}</p>
                  <p class="text-xs text-slate-400 mt-0.5 italic">{{ dup.reason }}</p>
                </div>
              </div>

              <!-- Manual Due Date -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                <input type="date" hlmInput class="w-full"
                       [value]="dateInputValue(manualDueDateValue)"
                       (change)="onManualDueDateInput($event)" />
                <p *ngIf="isManualOverdue()" class="text-xs text-red-500 font-medium mt-1">Overdue!</p>
              </div>

              <!-- Divider -->
              <div style="border-top:1px solid #F1F5F9"></div>

              <!-- Customer info -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</label>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                       style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                    {{ (ticket()!.createdBy?.fullName || 'C')[0] }}
                  </div>
                  <div class="min-w-0">
                    <a [routerLink]="['/agent/customers', ticket()!.createdBy?.id]" class="text-sm font-bold text-gray-900 hover:text-indigo-600 hover:underline truncate block">{{ ticket()!.createdBy?.fullName }}</a>
                    <p class="text-xs text-slate-400 truncate">{{ ticket()!.createdBy?.email }}</p>
                  </div>
                </div>
              </div>

              <!-- Assigned Agent -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assigned To
                  <span class="ml-1 text-slate-300 font-normal normal-case tracking-normal" style="font-size:10px">(A) assign me</span>
                </label>
                <select hlmSelect [(ngModel)]="currentAgentId" (ngModelChange)="assignAgent()" class="w-full">
                  <option *ngFor="let opt of agentOptions" [ngValue]="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <!-- Department -->
              <div *ngIf="ticket()!.departmentId">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                <p class="text-sm font-semibold text-gray-700">{{ departmentName() }}</p>
              </div>

              <!-- First Response -->
              <div *ngIf="ticket()!.firstResponseAt">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Response</label>
                <p class="text-sm font-semibold text-green-600">{{ ticket()!.firstResponseAt | date:'MMM d, h:mm a' }}</p>
              </div>
              <div *ngIf="!ticket()!.firstResponseAt">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Response</label>
                <p class="text-xs font-medium text-amber-500">Awaiting first reply</p>
              </div>

              <!-- Tags -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                <div class="flex flex-wrap gap-1.5 mb-2">
                  <span *ngFor="let tag of ticketManagedTags()"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        [style.background]="tag.color">
                    {{ tag.name }}
                    <button (click)="removeManagedTag(tag)" class="hover:opacity-75 transition-opacity leading-none ml-0.5">
                      <i class="pi pi-times" style="font-size:10px"></i>
                    </button>
                  </span>
                  <span *ngIf="ticketManagedTags().length === 0" class="text-xs text-slate-300 italic">No tags</span>
                </div>
                <!-- Tag autocomplete -->
                <div class="relative">
                  <input #tagSearchInput
                         class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
                         placeholder="+ Add tag..."
                         [(ngModel)]="tagSearchQuery"
                         (input)="onTagSearch($event)"
                         (focus)="showTagSuggestions = true"
                         style="font-family:inherit">
                  <div *ngIf="showTagSuggestions && tagSuggestions().length > 0"
                       class="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-40 overflow-y-auto">
                    <button *ngFor="let t of tagSuggestions()"
                            (click)="addManagedTag(t)"
                            class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors text-left">
                      <span class="w-3 h-3 rounded-full shrink-0" [style.background]="t.color"></span>
                      <span class="font-medium text-gray-800">{{ t.name }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Watchers -->
              <div style="border-top:1px solid #F1F5F9;padding-top:16px">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Watchers</label>
                <div class="flex flex-wrap gap-1.5 mb-2">
                  <span *ngFor="let w of watchers()"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0">
                    {{ w }}
                    <button (click)="removeWatcher(w)" class="hover:text-red-500 transition-colors leading-none">
                      <i class="pi pi-times" style="font-size:11px"></i>
                    </button>
                  </span>
                  <span *ngIf="watchers().length === 0" class="text-xs text-slate-300 italic">No watchers</span>
                </div>
                <div class="flex gap-1.5">
                  <input #watcherInput
                         type="email"
                         class="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
                         placeholder="email@example.com"
                         (keydown.enter)="addWatcher(watcherInput.value); watcherInput.value = ''"
                         style="font-family:inherit">
                  <button (click)="addWatcher(watcherInput.value); watcherInput.value = ''"
                          class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white"
                          style="background:#2563EB">
                    Add
                  </button>
                </div>
              </div>

              <!-- Custom Fields -->
              <div *ngIf="customFields().length > 0" style="border-top:1px solid #F1F5F9;padding-top:16px">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Custom Fields</label>
                <div class="space-y-3">
                  <div *ngFor="let field of customFields()">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">
                      {{ field.name }}
                      <span *ngIf="field.required" class="text-red-400 ml-0.5">*</span>
                    </label>
                    <!-- TEXT -->
                    <input *ngIf="field.fieldType === 'TEXT'"
                           class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
                           style="font-family:inherit"
                           [ngModel]="customValues()[field.fieldKey]"
                           (ngModelChange)="onCustomValueChange(field.fieldKey, $event)"
                           (blur)="saveCustomValues()"
                           placeholder="{{ field.name }}" />
                    <!-- DROPDOWN -->
                    <select *ngIf="field.fieldType === 'DROPDOWN'" hlmSelect class="w-full"
                            [ngModel]="customValues()[field.fieldKey]"
                            (ngModelChange)="onCustomValueChangeAndSave(field.fieldKey, $event)">
                      <option *ngFor="let opt of field.options" [value]="opt">{{ opt }}</option>
                    </select>
                    <!-- DATE -->
                    <input *ngIf="field.fieldType === 'DATE'" type="date" hlmInput class="w-full"
                           [value]="dateInputValue(customDateValues()[field.fieldKey])"
                           (change)="onCustomDateInput(field.fieldKey, $event)" />
                    <!-- CHECKBOX -->
                    <div *ngIf="field.fieldType === 'CHECKBOX'" class="flex items-center gap-2">
                      <input type="checkbox" hlmCheckbox
                             [checked]="customValues()[field.fieldKey] === 'true'"
                             (change)="onCustomValueChangeAndSave(field.fieldKey, $any($event.target).checked ? 'true' : 'false')" />
                      <span class="text-xs text-gray-600">{{ field.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tasks section -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="px-5 py-4" style="border-bottom:1px solid #F1F5F9">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-gray-900 text-sm">Tasks</h3>
                <span *ngIf="tasks().length > 0"
                      class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style="background:#EFF6FF;color:#1D4ED8">
                  {{ completedTaskCount() }}/{{ tasks().length }} complete
                </span>
              </div>
              <!-- Progress bar -->
              <div *ngIf="tasks().length > 0" class="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div class="h-full rounded-full bg-blue-500 transition-all"
                     [style.width]="taskProgressPct() + '%'"></div>
              </div>
            </div>
            <div class="p-4 space-y-2">
              <div *ngFor="let task of tasks()"
                   class="flex items-center gap-2 group">
                <input type="checkbox"
                       [checked]="task.completed"
                       (change)="toggleTask(task)"
                       class="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0" />
                <span class="flex-1 text-sm text-gray-700 min-w-0 truncate"
                      [class.line-through]="task.completed"
                      [class.text-slate-400]="task.completed">
                  {{ task.title }}
                </span>
                <button (click)="deleteTask(task)"
                        class="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 transition-all shrink-0">
                  <i class="pi pi-times" style="font-size:11px"></i>
                </button>
              </div>
              <div *ngIf="tasks().length === 0" class="text-xs text-slate-400 italic text-center py-2">No tasks yet</div>
              <!-- Add task input -->
              <div class="flex gap-1.5 mt-3">
                <input #taskInput
                       class="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
                       placeholder="Add a task..."
                       (keydown.enter)="addTask(taskInput.value); taskInput.value = ''"
                       style="font-family:inherit" />
                <button (click)="addTask(taskInput.value); taskInput.value = ''"
                        class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
                        style="background:#2563EB">
                  Add
                </button>
              </div>
            </div>
          </div>

          <!-- Linked Issues section -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="px-5 py-4 flex items-center justify-between" style="border-bottom:1px solid #F1F5F9">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-gray-900 text-sm">Linked Incidents</h3>
                <span *ngIf="linkedIssues().length > 0"
                      class="px-2 py-0.5 rounded-full text-xs font-bold"
                      style="background:#FEF3C7;color:#92400E">{{ linkedIssues().length }}</span>
              </div>
              <button (click)="showLinkIssueDialog()"
                      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <i class="pi pi-plus" style="font-size:12px"></i>
                Link
              </button>
            </div>
            <div class="p-4">
              <div *ngIf="linkedIssues().length === 0" class="text-xs text-slate-400 italic text-center py-2">
                No linked incidents
              </div>
              <div *ngFor="let issue of linkedIssues(); let last = last"
                   class="flex items-start gap-3 py-2.5"
                   [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     [style.background]="issue.status === 'OPEN' ? '#FEF3C7' : '#F1F5F9'">
                  <i class="pi pi-exclamation-circle"
                     [style.color]="issue.status === 'OPEN' ? '#D97706' : '#94A3B8'"
                     style="font-size:13px"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ issue.title }}</p>
                  <span class="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        [style.background]="issue.status === 'OPEN' ? '#FEF3C7' : '#F1F5F9'"
                        [style.color]="issue.status === 'OPEN' ? '#92400E' : '#64748B'">
                    {{ issue.status }}
                  </span>
                </div>
                <button (click)="unlinkIssue(issue.id)"
                        class="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        title="Unlink">
                  <i class="pi pi-times" style="font-size:11px"></i>
                </button>
              </div>
            </div>
          </div>


          <!-- Linked Tickets section -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="px-5 py-4 flex items-center justify-between" style="border-bottom:1px solid #F1F5F9">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-gray-900 text-sm">Linked Tickets</h3>
                <span *ngIf="ticketLinks().length > 0"
                      class="px-2 py-0.5 rounded-full text-xs font-bold"
                      style="background:#EFF6FF;color:#1D4ED8">{{ ticketLinks().length }}</span>
              </div>
              <button (click)="showAddLinkDialog()"
                      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <i class="pi pi-plus" style="font-size:12px"></i>
                Add Link
              </button>
            </div>
            <div class="p-4">
              <div *ngIf="ticketLinks().length === 0" class="text-xs text-slate-400 italic text-center py-2">
                No linked tickets
              </div>
              <ng-container *ngFor="let group of groupedLinks()">
                <div class="mb-3">
                  <div class="flex items-center gap-1.5 mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          [style.background]="linkTypeStyle(group.type).bg"
                          [style.color]="linkTypeStyle(group.type).color">
                      {{ linkTypeStyle(group.type).label }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <div *ngFor="let link of group.links"
                         class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:border-blue-300 transition-colors"
                         style="background:#F8FAFC;border-color:#E2E8F0"
                         [routerLink]="['/agent/tickets', link.linkedTicketId]">
                      <span class="font-mono text-blue-600">{{ link.linkedTicketNumber }}</span>
                      <span class="text-gray-600 truncate max-w-32">{{ link.linkedTicketSubject }}</span>
                      <button (click)="removeTicketLink($event, link)"
                              class="ml-1 text-gray-300 hover:text-red-500 transition-colors leading-none">
                        <i class="pi pi-times" style="font-size:9px"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>

          <!-- Time Tracking section -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="px-5 py-4 flex items-center justify-between" style="border-bottom:1px solid #F1F5F9">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-gray-900 text-sm">⏱ Time</h3>
                <span *ngIf="totalTimeMinutes() > 0"
                      class="px-2 py-0.5 rounded-full text-xs font-bold"
                      style="background:#EFF6FF;color:#1D4ED8">{{ formatMinutes(totalTimeMinutes()) }}</span>
              </div>
              <button (click)="showLogTimeForm = !showLogTimeForm"
                      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <i class="pi pi-plus" style="font-size:12px"></i>
                Log Time
              </button>
            </div>
            <div class="p-4 space-y-3">
              <!-- Log form -->
              <div *ngIf="showLogTimeForm" class="rounded-xl p-3 space-y-2" style="background:#F8FAFC;border:1px solid #E2E8F0">
                <div class="flex gap-2">
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Hours</label>
                    <input type="number" hlmInput class="w-full" min="0" max="99" [(ngModel)]="logHours" />
                  </div>
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Minutes</label>
                    <input type="number" hlmInput class="w-full" min="0" max="59" [(ngModel)]="logMins" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Note (optional)</label>
                  <textarea hlmInput [(ngModel)]="logNote" rows="2" class="w-full text-xs" placeholder="What did you work on?"></textarea>
                </div>
                <div class="flex gap-2 justify-end">
                  <button (click)="showLogTimeForm = false; logHours = 0; logMins = 0; logNote = ''"
                          class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button (click)="submitTimeEntry()"
                          [disabled]="(logHours === 0 && logMins === 0) || loggingTime"
                          class="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-colors"
                          style="background:#2563EB">
                    {{ loggingTime ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>

              <!-- Entries list -->
              <div *ngIf="timeEntries().length === 0 && !showLogTimeForm" class="text-xs text-slate-400 italic text-center py-2">
                No time logged yet
              </div>
              <div *ngFor="let entry of timeEntries()"
                   class="flex items-start gap-2 group">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-gray-800">{{ entry.agentName }}</span>
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                          style="background:#DBEAFE;color:#1D4ED8">{{ formatMinutes(entry.minutes) }}</span>
                    <span class="text-xs text-slate-400">{{ entry.loggedAt | date:'MMM d' }}</span>
                  </div>
                  <p *ngIf="entry.note" class="text-xs text-slate-500 mt-0.5 truncate">{{ entry.note }}</p>
                </div>
                <button (click)="deleteTimeEntry(entry)"
                        class="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 transition-all shrink-0">
                  <i class="pi pi-trash" style="font-size:11px"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Sub-tickets section -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="px-5 py-4 flex items-center justify-between" style="border-bottom:1px solid #F1F5F9">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-gray-900 text-sm">Sub-tickets</h3>
                <span *ngIf="childTickets().length > 0"
                      class="px-2 py-0.5 rounded-full text-xs font-bold"
                      style="background:#EFF6FF;color:#1D4ED8">{{ childTickets().length }}</span>
              </div>
              <button (click)="showAddSubTicketForm = !showAddSubTicketForm"
                      class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <i class="pi pi-plus" style="font-size:12px"></i>
                Add
              </button>
            </div>
            <div class="p-4 space-y-3">

              <!-- Parent link -->
              <div *ngIf="ticket()?.parentTicketId" class="flex items-center gap-2 px-3 py-2 rounded-lg"
                   style="background:#F0FDF4;border:1px solid #BBF7D0">
                <i class="pi pi-arrow-up" style="font-size:11px;color:#166534"></i>
                <span class="text-xs font-semibold text-gray-600">Parent:</span>
                <a [routerLink]="['/agent/tickets', ticket()!.parentTicketId]"
                   class="text-xs font-bold text-green-700 hover:underline truncate">
                  #{{ ticket()!.parentTicketNumber || ticket()!.parentTicketId }}
                  <ng-container *ngIf="ticket()!.parentTicketTitle"> — {{ ticket()!.parentTicketTitle }}</ng-container>
                </a>
                <button (click)="unlinkParent()"
                        class="ml-auto text-gray-300 hover:text-red-500 transition-colors leading-none"
                        title="Remove parent link">
                  <i class="pi pi-times" style="font-size:10px"></i>
                </button>
              </div>

              <!-- Add sub-ticket inline form -->
              <div *ngIf="showAddSubTicketForm" class="rounded-xl p-3 space-y-2" style="background:#F8FAFC;border:1px solid #E2E8F0">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                  <input hlmInput class="w-full text-sm" placeholder="Sub-ticket subject..."
                         [(ngModel)]="newSubSubject" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                  <textarea hlmInput [(ngModel)]="newSubDescription" rows="2" class="w-full text-xs"
                            placeholder="Describe the issue..."></textarea>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                  <select hlmSelect class="w-full" [(ngModel)]="newSubPriority">
                    <option *ngFor="let opt of priorityOptions" [value]="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div class="flex gap-2 justify-end">
                  <button (click)="showAddSubTicketForm = false; newSubSubject = ''; newSubDescription = ''"
                          class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button (click)="createSubTicket()"
                          [disabled]="!newSubSubject.trim() || creatingSubTicket"
                          class="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-colors"
                          style="background:#2563EB">
                    {{ creatingSubTicket ? 'Creating...' : 'Create' }}
                  </button>
                </div>
              </div>

              <!-- Child tickets list -->
              <div *ngIf="childTickets().length === 0 && !showAddSubTicketForm" class="text-xs text-slate-400 italic text-center py-2">
                No sub-tickets
              </div>
              <div *ngFor="let child of childTickets(); let last = last"
                   class="flex items-center gap-2 py-1.5"
                   [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'">
                <a [routerLink]="['/agent/tickets', child.id]"
                   class="text-xs font-mono font-bold text-blue-600 hover:underline shrink-0">
                  {{ child.ticketNumber }}
                </a>
                <span class="flex-1 text-xs text-gray-700 truncate min-w-0">{{ child.subject }}</span>
                <span class="shrink-0 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                      [ngStyle]="statusChipStyle(child.status)">
                  {{ child.status }}
                </span>
              </div>

              <!-- Set parent button -->
              <button *ngIf="!ticket()?.parentTicketId" (click)="showSetParentDialog = true"
                      class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors mt-1">
                <i class="pi pi-link" style="font-size:11px"></i>
                Set parent ticket
              </button>
            </div>
          </div>

          <!-- Merge/Split ticket buttons -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="p-4 space-y-2">
              <button (click)="openSplitDialog()"
                      class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors">
                <i class="pi pi-sitemap" style="font-size:15px"></i>
                Split Ticket
              </button>
              <button (click)="showMergeDialog()"
                      class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <i class="pi pi-arrow-right-arrow-left" style="font-size:15px"></i>
                Merge Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Macro overlay -->
    <hlm-modal [(visible)]="macroOverlayVisible" header="⚡ Run Macro" width="420px">
      <div class="space-y-2 p-5">
        <p class="text-sm text-slate-500 mb-3">Select a macro to apply multiple actions to this ticket at once.</p>
        <div *ngIf="macros().length === 0" class="text-center py-6 text-slate-400 text-sm">No macros available</div>
        <div *ngFor="let m of macros()"
             (click)="applyMacro(m)"
             class="flex flex-col gap-1 px-4 py-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
          <span class="font-semibold text-gray-900 text-sm">{{ m.name }}</span>
          <span *ngIf="m.description" class="text-xs text-slate-400">{{ m.description }}</span>
          <div class="flex flex-wrap gap-1 mt-1">
            <span *ngFor="let a of parseMacroActions(m.actions)"
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  style="background:#EEF2FF;color:#4338CA">{{ a.type }}: {{ a.value }}</span>
          </div>
        </div>
      </div>
    </hlm-modal>

    <!-- Snooze dialog -->
    <hlm-modal [(visible)]="showSnoozeDialog" header="💤 Snooze Ticket" width="420px">
      <div class="space-y-3 p-5">
        <p class="text-sm text-slate-500">Hide this ticket from the queue until a future time. It will automatically reappear when the time arrives.</p>
        <div class="grid grid-cols-2 gap-2">
          <button (click)="snooze(snoozeIn(1))"
                  class="px-3 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-colors text-left">
            ⏰ In 1 hour
          </button>
          <button (click)="snooze(snoozeIn(4))"
                  class="px-3 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-colors text-left">
            ⏰ In 4 hours
          </button>
          <button (click)="snooze(snoozeTomorrow9am())"
                  class="px-3 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-colors text-left">
            🌅 Tomorrow 9am
          </button>
          <button (click)="snooze(snoozeNextMonday9am())"
                  class="px-3 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-colors text-left">
            📅 Next Monday 9am
          </button>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom time</label>
          <input type="datetime-local" [(ngModel)]="customSnoozeDate"
                 class="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400"
                 style="font-family:inherit" />
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button hlmButton variant="outline" (click)="showSnoozeDialog = false">
            Cancel
          </button>
          <button (click)="snoozeCustom(customSnoozeDate)"
                  [disabled]="!customSnoozeDate"
                  class="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style="background:#D97706">
            Snooze
          </button>
        </div>
      </div>
    </hlm-modal>

    <!-- Merge dialog -->
    <hlm-modal [(visible)]="mergeDialogVisible" header="Merge Ticket" width="480px">
      <div class="space-y-4 p-5">
        <p class="text-sm text-slate-500">Search for a target ticket to merge this ticket into. All comments will be moved to the target ticket and this ticket will be closed.</p>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Search tickets</label>
          <input hlmInput class="w-full text-sm"
                 placeholder="Enter subject or ticket ID..."
                 [ngModel]="mergeSearch()"
                 (ngModelChange)="onMergeSearch($event)" />
        </div>
        <div *ngIf="mergeResults().length > 0" class="border border-gray-200 rounded-xl overflow-hidden">
          <div *ngFor="let t of mergeResults()"
               (click)="selectMergeTarget(t)"
               class="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
               [class.bg-blue-50]="mergeTargetId() === t.id">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">{{ t.title }}</span>
              <span class="text-xs font-mono text-slate-400">{{ t.ticketNumber }}</span>
            </div>
            <span class="text-xs text-slate-400">{{ t.status }}</span>
          </div>
        </div>
        <div *ngIf="mergeSearch().length > 1 && mergeResults().length === 0" class="text-xs text-slate-400 text-center py-3">
          No matching tickets found
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button hlmButton variant="outline" (click)="mergeDialogVisible = false">
            Cancel
          </button>
          <button (click)="confirmMerge()"
                  [disabled]="!mergeTargetId() || merging"
                  class="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style="background:#2563EB">
            {{ merging ? 'Merging...' : 'Merge' }}
          </button>
        </div>
      </div>
    </hlm-modal>

    <!-- Add Ticket Link dialog -->
    <hlm-modal [(visible)]="addLinkDialogVisible" header="Link Ticket" width="480px">
      <div class="space-y-4 p-5">
        <p class="text-sm text-slate-500">Search for a ticket to link and select the relationship type.</p>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Search tickets</label>
          <input hlmInput class="w-full text-sm"
                 placeholder="Enter subject or ticket number..."
                 [ngModel]="linkSearch()"
                 (ngModelChange)="onLinkSearch($event)" />
        </div>
        <div *ngIf="linkResults().length > 0" class="border border-gray-200 rounded-xl overflow-hidden">
          <div *ngFor="let t of linkResults()"
               (click)="selectLinkTarget(t)"
               class="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
               [class.bg-blue-50]="linkTargetId() === t.id">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">{{ t.title }}</span>
              <span class="text-xs font-mono text-slate-400">{{ t.ticketNumber }}</span>
            </div>
            <span class="text-xs text-slate-400">{{ t.status }}</span>
          </div>
        </div>
        <div *ngIf="linkSearch().length > 1 && linkResults().length === 0" class="text-xs text-slate-400 text-center py-3">
          No matching tickets found
        </div>
        <div *ngIf="linkTargetId()">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Relationship type</label>
          <select hlmSelect class="w-full" [(ngModel)]="selectedLinkType">
            <option *ngFor="let opt of linkTypeOptions" [value]="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button hlmButton variant="outline" (click)="addLinkDialogVisible = false">
            Cancel
          </button>
          <button (click)="confirmAddLink()"
                  [disabled]="!linkTargetId() || !selectedLinkType || addingLink"
                  class="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style="background:#2563EB">
            {{ addingLink ? 'Linking...' : 'Add Link' }}
          </button>
        </div>
      </div>
    </hlm-modal>

    <!-- Set Parent dialog -->
    <hlm-modal [(visible)]="showSetParentDialog" header="Set Parent Ticket" width="480px">
      <div class="space-y-4 p-5">
        <p class="text-sm text-slate-500">Search for a ticket to set as the parent of this ticket.</p>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Search tickets</label>
          <input hlmInput class="w-full text-sm"
                 placeholder="Enter subject or ticket number..."
                 [ngModel]="parentSearch()"
                 (ngModelChange)="onParentSearch($event)" />
        </div>
        <div *ngIf="parentResults().length > 0" class="border border-gray-200 rounded-xl overflow-hidden">
          <div *ngFor="let t of parentResults()"
               (click)="selectParentTarget(t)"
               class="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
               [class.bg-blue-50]="parentTargetId() === t.id">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">{{ t.title }}</span>
              <span class="text-xs font-mono text-slate-400">{{ t.ticketNumber }}</span>
            </div>
            <span class="text-xs text-slate-400">{{ t.status }}</span>
          </div>
        </div>
        <div *ngIf="parentSearch().length > 1 && parentResults().length === 0" class="text-xs text-slate-400 text-center py-3">
          No matching tickets found
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button hlmButton variant="outline" (click)="showSetParentDialog = false">
            Cancel
          </button>
          <button (click)="confirmSetParent()"
                  [disabled]="!parentTargetId() || settingParent"
                  class="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style="background:#2563EB">
            {{ settingParent ? 'Setting...' : 'Set Parent' }}
          </button>
        </div>
      </div>
    </hlm-modal>

    <!-- Split Ticket dialog -->
    <hlm-modal [(visible)]="splitDialogVisible" header="Split Ticket" width="520px">
      <div class="space-y-4 p-5">
        <p class="text-sm text-slate-500">Create a new ticket from this one. Optionally move selected comments to the new ticket.</p>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">New ticket subject</label>
          <input hlmInput class="w-full text-sm" placeholder="Subject..."
                 [(ngModel)]="splitSubject" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea hlmInput [(ngModel)]="splitDescription" rows="3" class="w-full text-sm"
                    placeholder="Describe the issue..."></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
            <select hlmSelect class="w-full" [(ngModel)]="splitDepartmentId">
              <option *ngFor="let opt of departmentOptions()" [value]="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
            <select hlmSelect class="w-full" [(ngModel)]="splitPriority">
              <option *ngFor="let opt of priorityOptions" [value]="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div *ngIf="publicComments().length > 0">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Move comments to new ticket (optional)</label>
          <div class="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            <div *ngFor="let c of publicComments(); let last = last"
                 class="flex items-start gap-3 px-4 py-3"
                 [style.border-bottom]="!last ? '1px solid #F1F5F9' : 'none'">
              <input type="checkbox" hlmCheckbox
                     [checked]="splitCommentIds.includes(c.id)"
                     (change)="toggleSplitComment(c.id, $any($event.target).checked)" />
              <div class="min-w-0">
                <p class="text-xs font-semibold text-gray-700">{{ c.author.fullName }}</p>
                <p class="text-xs text-slate-500 mt-0.5 truncate">{{ c.body }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button hlmButton variant="outline" (click)="splitDialogVisible = false">
            Cancel
          </button>
          <button (click)="confirmSplit()"
                  [disabled]="!splitSubject.trim() || splitting"
                  class="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style="background:#7C3AED">
            {{ splitting ? 'Splitting...' : 'Split Ticket' }}
          </button>
        </div>
      </div>
    </hlm-modal>

    <!-- Link to Issue dialog -->
    <hlm-modal [(visible)]="linkIssueDialogVisible" header="Link to Issue" width="480px">
      <div class="space-y-4 p-5">
        <p class="text-sm text-slate-500">Search for an issue to link this ticket to.</p>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Search issues</label>
          <input hlmInput class="w-full text-sm"
                 placeholder="Issue title..."
                 [ngModel]="issueSearch()"
                 (ngModelChange)="onIssueSearch($event)" />
        </div>
        <div *ngIf="issueResults().length > 0" class="border border-gray-200 rounded-xl overflow-hidden">
          <div *ngFor="let iss of issueResults()"
               (click)="selectIssue(iss)"
               class="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
               [class.bg-blue-50]="selectedIssueId() === iss.id">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">{{ iss.title }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                    [ngClass]="iss.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
                {{ iss.status }}
              </span>
            </div>
          </div>
        </div>
        <div *ngIf="issueSearch().length > 1 && issueResults().length === 0" class="text-xs text-slate-400 text-center py-3">
          No issues found
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button hlmButton variant="outline" (click)="linkIssueDialogVisible = false">
            Cancel
          </button>
          <button (click)="confirmLinkIssue()"
                  [disabled]="!selectedIssueId() || linkingIssue"
                  class="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style="background:#2563EB">
            {{ linkingIssue ? 'Linking...' : 'Link Issue' }}
          </button>
        </div>
      </div>
    </hlm-modal>
  `,
})
export class AgentTicketDetailComponent implements OnInit, OnDestroy {
  ticket = signal<Ticket | null>(null);
  comments = signal<Comment[]>([]);
  agents = signal<User[]>([]);
  departments = signal<Department[]>([]);

  // AI triage suggestion state
  aiLoading = signal(false);
  aiError = signal('');
  aiSuggestion = signal<{category: string; priority: string; suggestedResponse: string} | null>(null);

  // AI summary state
  aiSummary = signal<string | null>(null);
  aiSummaryLoading = signal(false);
  aiSummaryError = signal<string | null>(null);
  sentiment = signal<{ sentiment: string; score: number; action: string } | null>(null);
  sentimentLoading = signal(false);
  sentimentError = signal<string | null>(null);
  smartReplyLoading = signal(false);
  autoCategorizeLoading = signal(false);
  duplicates = signal<{ id: string; ticketNumber: string; title: string; similarityScore: number; reason: string }[]>([]);
  duplicatesLoading = signal(false);
  duplicatesChecked = signal(false);
  aiSuggestCategory = '';
  aiSuggestPriority = '';
  aiSuggestResponse = '';
  attachments = signal<Attachment[]>([]);
  pendingFiles = signal<File[]>([]);
  loading = signal(true);
  submitting = false;

  // Draft
  draftSavedAt = signal<Date | null>(null);
  private replySubject = new Subject<string>();
  private draftSubscription: Subscription | null = null;

  // Watchers
  watchers = signal<string[]>([]);

  // Custom fields
  customFields = signal<CustomField[]>([]);
  customValues = signal<Record<string, string>>({});
  customDateValues = signal<Record<string, Date | null>>({});

  // Manual due date
  manualDueDateValue: Date | null = null;

  // Link to Issue
  linkIssueDialogVisible = false;
  issueSearch = signal('');
  issueResults = signal<Issue[]>([]);
  selectedIssueId = signal<string | null>(null);
  linkingIssue = false;
  linkedIssues = signal<Issue[]>([]);
  private issueSearchTimeout: any;

  // Ticket Links
  ticketLinks = signal<TicketLink[]>([]);
  macros = signal<Macro[]>([]);
  macroOverlayVisible = false;

  // Sub-tickets
  childTickets = signal<TicketSummary[]>([]);
  showAddSubTicketForm = false;
  newSubSubject = '';
  newSubDescription = '';
  newSubPriority = 'MEDIUM';
  creatingSubTicket = false;
  showSetParentDialog = false;
  parentSearch = signal('');
  parentResults = signal<any[]>([]);
  parentTargetId = signal<string | null>(null);
  settingParent = false;
  private parentSearchTimeout: any;

  priorityOptions = [
    { label: 'LOW', value: 'LOW' },
    { label: 'MEDIUM', value: 'MEDIUM' },
    { label: 'HIGH', value: 'HIGH' },
    { label: 'URGENT', value: 'URGENT' },
  ];

  statusChipStyle(status: string): Record<string, string> {
    const map: Record<string, Record<string, string>> = {
      NEW: { background: '#DBEAFE', color: '#1D4ED8' },
      OPEN: { background: '#EDE9FE', color: '#5B21B6' },
      PENDING: { background: '#FEF3C7', color: '#92400E' },
      ON_HOLD: { background: '#F1F5F9', color: '#475569' },
      RESOLVED: { background: '#DCFCE7', color: '#15803D' },
      CLOSED: { background: '#F1F5F9', color: '#64748B' },
    };
    return map[status] ?? { background: '#F1F5F9', color: '#475569' };
  }
  applyingMacro = false;
  addLinkDialogVisible = false;
  linkSearch = signal('');
  linkResults = signal<any[]>([]);
  linkTargetId = signal<string | null>(null);
  selectedLinkType: LinkType = 'RELATED_TO';
  addingLink = false;
  private linkSearchTimeout: any;

  linkTypeOptions = [
    { label: '🔗 Related To', value: 'RELATED_TO' },
    { label: '🚫 Blocks', value: 'BLOCKS' },
    { label: '⛔ Is Blocked By', value: 'IS_BLOCKED_BY' },
    { label: '📋 Duplicates', value: 'DUPLICATES' },
    { label: '📄 Is Duplicated By', value: 'IS_DUPLICATED_BY' },
  ];

  groupedLinks(): { type: LinkType; links: TicketLink[] }[] {
    const map = new Map<LinkType, TicketLink[]>();
    for (const link of this.ticketLinks()) {
      if (!map.has(link.linkType)) map.set(link.linkType, []);
      map.get(link.linkType)!.push(link);
    }
    return Array.from(map.entries()).map(([type, links]) => ({ type, links }));
  }

  linkTypeStyle(type: LinkType): { bg: string; color: string; label: string } {
    const styles: Record<LinkType, { bg: string; color: string; label: string }> = {
      RELATED_TO: { bg: '#EFF6FF', color: '#1D4ED8', label: '🔗 Related To' },
      BLOCKS: { bg: '#FEF2F2', color: '#DC2626', label: '🚫 Blocks' },
      IS_BLOCKED_BY: { bg: '#FFF7ED', color: '#C2410C', label: '⛔ Blocked By' },
      DUPLICATES: { bg: '#F0FDF4', color: '#15803D', label: '📋 Duplicates' },
      IS_DUPLICATED_BY: { bg: '#FAFAF9', color: '#57534E', label: '📄 Duplicated By' },
    };
    return styles[type];
  }

  // Time tracking
  timeEntries = signal<TimeEntry[]>([]);
  showLogTimeForm = false;
  logHours = 0;
  logMins = 0;
  logNote = '';
  loggingTime = false;

  totalTimeMinutes(): number {
    return this.timeEntries().reduce((sum, e) => sum + e.minutes, 0);
  }

  formatMinutes(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h > 0 && m > 0) return h + 'h ' + m + 'm';
    if (h > 0) return h + 'h';
    return m + 'm';
  }

  submitTimeEntry() {
    const minutes = (this.logHours * 60) + this.logMins;
    if (minutes <= 0) return;
    this.loggingTime = true;
    const id = this.ticket()!.id;
    this.timeEntryService.logTime(id, { minutes, note: this.logNote || undefined }).subscribe({
      next: (entry) => {
        this.timeEntries.update(list => [entry, ...list]);
        this.showLogTimeForm = false;
        this.logHours = 0;
        this.logMins = 0;
        this.logNote = '';
        this.loggingTime = false;
      },
      error: () => { this.loggingTime = false; }
    });
  }

  deleteTimeEntry(entry: TimeEntry) {
    const id = this.ticket()!.id;
    this.timeEntryService.deleteEntry(id, entry.id).subscribe(() => {
      this.timeEntries.update(list => list.filter(e => e.id !== entry.id));
    });
  }

  // Snooze
  showSnoozeDialog = false;
  customSnoozeDate = '';

  // Merge
  mergeDialogVisible = false;
  mergeSearch = signal('');
  mergeResults = signal<Ticket[]>([]);
  mergeTargetId = signal<string | null>(null);

  // Managed tags
  ticketManagedTags = signal<ManagedTag[]>([]);
  tagSuggestions = signal<ManagedTag[]>([]);
  tagSearchQuery = '';
  showTagSuggestions = false;
  merging = false;
  private mergeSearchTimeout: any;

  // Split
  splitDialogVisible = false;
  splitSubject = '';
  splitDescription = '';
  splitDepartmentId: string | null = null;
  splitPriority = 'MEDIUM';
  splitCommentIds: string[] = [];
  splitting = false;
  replyControl = new FormControl('', Validators.required);
  noteMode: 'public' | 'internal' = 'public';
  currentStatus: TicketStatus = 'NEW';
  currentAgentId: string | null = null;

  // Mention state
  showMentionDropdown = signal(false);
  mentionQuery = signal('');
  mentionSelectedIndex = signal(0);
  mentionStart = 0;

  @ViewChild('replyTextarea') replyTextarea!: ElementRef<HTMLTextAreaElement>;

  mentionFilteredAgents(): User[] {
    const q = this.mentionQuery().toLowerCase();
    return this.agents().filter(a => a.fullName.toLowerCase().includes(q)).slice(0, 8);
  }

  // Presence state
  presenceAgents = signal<PresenceViewer[]>([]);
  otherViewers = signal<PresenceViewer[]>([]);
  private presenceInterval: ReturnType<typeof setInterval> | null = null;
  private presenceSubscription: Subscription | null = null;

  noteModeOptions = [
    { label: 'Public', value: 'public' },
    { label: 'Internal', value: 'internal' },
  ];

  statusOptions = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map(s => ({
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: s as TicketStatus
  }));

  agentOptions: { label: string; value: string | null }[] = [{ label: 'Unassigned', value: null }];

  cannedResponses = signal<CannedResponseModel[]>([]);
  cannedSearch = signal('');
  showCannedPanel = signal(false);

  filteredCanned(): CannedResponseModel[] {
    const q = this.cannedSearch().toLowerCase();
    return this.cannedResponses().filter(r =>
      r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q)
    );
  }

  setCannedSearch(value: string) { this.cannedSearch.set(value); }

  insertCanned(r: CannedResponseModel) {
    this.replyControl.setValue((this.replyControl.value || '') + r.body);
  }

  getDownloadUrl(attId: string): string {
    return `${environment.apiUrl}/attachments/${attId}/download`;
  }

  // Tasks
  tasks = signal<TicketTask[]>([]);

  completedTaskCount(): number {
    return this.tasks().filter(t => t.completed).length;
  }

  taskProgressPct(): number {
    if (this.tasks().length === 0) return 0;
    return Math.round((this.completedTaskCount() / this.tasks().length) * 100);
  }

  addTask(title: string) {
    const t = title.trim();
    if (!t) return;
    const id = this.ticket()!.id;
    this.taskService.createTask(id, t).subscribe(task => {
      this.tasks.update(list => [...list, task]);
    });
  }

  toggleTask(task: TicketTask) {
    const id = this.ticket()!.id;
    this.taskService.toggleTask(id, task.id).subscribe(updated => {
      this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
    });
  }

  deleteTask(task: TicketTask) {
    const id = this.ticket()!.id;
    this.taskService.deleteTask(id, task.id).subscribe(() => {
      this.tasks.update(list => list.filter(t => t.id !== task.id));
    });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private cannedResponseService: CannedResponseService,
    private customFieldService: CustomFieldService,
    private taskService: TaskService,
    private issueService: IssueService,
    private presenceService: PresenceService,
    private authService: AuthService,
    private draftService: DraftService,
    private timeEntryService: TimeEntryService,
    private tagService: TagService,
    private ticketLinkService: TicketLinkService,
    private macroService: MacroService,
    private ticketParentService: TicketParentService,
    private shortcutService: KeyboardShortcutService,
  ) {}

  onReplyInput(event: Event) {
    if (this.noteMode !== 'internal') { this.showMentionDropdown.set(false); return; }
    const ta = event.target as HTMLTextAreaElement;
    const pos = ta.selectionStart;
    const text = ta.value.substring(0, pos);
    const atIdx = text.lastIndexOf('@');
    if (atIdx >= 0 && !text.substring(atIdx).includes(' ')) {
      this.mentionStart = atIdx;
      this.mentionQuery.set(text.substring(atIdx + 1));
      this.mentionSelectedIndex.set(0);
      this.showMentionDropdown.set(true);
    } else {
      this.showMentionDropdown.set(false);
    }
  }

  onReplyKeydown(event: KeyboardEvent) {
    if (!this.showMentionDropdown()) return;
    const agents = this.mentionFilteredAgents();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionSelectedIndex.update(i => Math.min(i + 1, agents.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionSelectedIndex.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      if (agents.length > 0) {
        event.preventDefault();
        this.insertMention(agents[this.mentionSelectedIndex()]);
      }
    } else if (event.key === 'Escape') {
      this.showMentionDropdown.set(false);
    }
  }

  insertMention(agent: User) {
    const current = this.replyControl.value || '';
    const before = current.substring(0, this.mentionStart);
    const after = current.substring(this.mentionStart + 1 + this.mentionQuery().length);
    const newVal = before + '@' + agent.fullName + ' ' + after;
    this.replyControl.setValue(newVal);
    this.showMentionDropdown.set(false);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ticketService.getTicket(id).subscribe(t => {
      this.ticket.set(t);
      this.currentStatus = t.status;
      this.currentAgentId = t.assignedAgent?.id ?? null;
      if (t.manualDueDate) this.manualDueDateValue = new Date(t.manualDueDate);
      this.loading.set(false);
    });
    this.tagService.getTicketTags(id).subscribe(tags => this.ticketManagedTags.set(tags));
    this.ticketService.getComments(id).subscribe(c => this.comments.set(c));
    this.ticketService.getAttachments(id).subscribe(a => this.attachments.set(a));
    this.userService.getUsers('AGENT', 0, 100).subscribe(p => {
      this.agents.set(p.content);
      this.agentOptions = [
        { label: 'Unassigned', value: null },
        ...p.content.map((a: User) => ({ label: a.fullName, value: a.id }))
      ];
    });
    this.departmentService.getDepartments().subscribe(p => this.departments.set(p.content));
    this.cannedResponseService.getAll().subscribe(list => this.cannedResponses.set(list));
    this.ticketService.getWatchers(id).subscribe(w => this.watchers.set(w));
    this.customFieldService.getFields().subscribe(fields => this.customFields.set(fields));
    this.taskService.getTasks(id).subscribe(list => this.tasks.set(list));
    this.issueService.getIssuesByTicket(id).subscribe(issues => this.linkedIssues.set(issues));
    this.timeEntryService.getEntries(id).subscribe(entries => this.timeEntries.set(entries));
    this.ticketLinkService.getLinks(id).subscribe(links => this.ticketLinks.set(links));
    this.ticketParentService.getChildren(id).subscribe(children => this.childTickets.set(children));
    this.customFieldService.getValues(id).subscribe(vals => {
      this.customValues.set(vals);
      const dates: Record<string, Date | null> = {};
      Object.entries(vals).forEach(([k, v]) => { if (v) dates[k] = new Date(v); });
      this.customDateValues.set(dates);
    });

    // Load draft
    this.draftService.getDraft(id).subscribe(draft => {
      if (draft) {
        this.replyControl.setValue(draft.content, { emitEvent: false });
        this.noteMode = draft.isInternal ? 'internal' : 'public';
        this.draftSavedAt.set(new Date(draft.updatedAt));
      }
    });

    // Auto-save draft with debounce
    this.draftSubscription = this.replySubject.pipe(
      debounceTime(3000),
      distinctUntilChanged(),
      switchMap(value => {
        if (!value || !value.trim()) return [];
        const isInternal = this.noteMode === 'internal';
        return this.draftService.saveDraft(id, value, isInternal);
      })
    ).subscribe(saved => {
      if (saved) this.draftSavedAt.set(new Date(saved.updatedAt));
    });

    this.replyControl.valueChanges.subscribe(val => {
      if (val) this.replySubject.next(val);
    });

    // Presence: join and subscribe to WebSocket updates
    this.presenceService.join(id).subscribe(viewers => this._updatePresence(viewers, id));
    // Subscribe to real-time updates
    this.presenceSubscription = this.presenceService.presence$.subscribe(update => {
      if (update.ticketId === id) this._updatePresence(update.viewers, id);
    });
    // Wire up WebSocket subscription after a brief delay to allow connection
    setTimeout(() => this.presenceService.subscribeToTicket(id), 1000);
    // Also poll every 30s as fallback
    this.presenceInterval = setInterval(() => {
      this.presenceService.getViewers(id).subscribe(viewers => this._updatePresence(viewers, id));
    }, 30000);

    // Register ticket-action keyboard shortcuts
    this.shortcutService.register('r', 'Focus reply textarea', 'Ticket Actions', () => {
      if (this.replyTextarea?.nativeElement) {
        this.replyTextarea.nativeElement.focus();
      }
    });
    this.shortcutService.register('e', 'Resolve ticket', 'Ticket Actions', () => {
      this.currentStatus = 'RESOLVED';
      this.updateStatus();
    });
    this.shortcutService.register('s', 'Snooze ticket', 'Ticket Actions', () => {
      this.showSnoozeDialog = true;
    });
    this.shortcutService.register('a', 'Assign ticket to me', 'Ticket Actions', () => {
      const me = this.authService.currentUser();
      if (!me) return;
      const myAgent = this.agents().find(ag => ag.id === me.userId);
      if (myAgent) {
        this.currentAgentId = myAgent.id;
        this.assignAgent();
      }
    });
  }

  private _updatePresence(viewers: PresenceViewer[], ticketId: string) {
    this.presenceAgents.set(viewers);
    const currentUserId = this.authService.currentUser()?.userId;
    this.otherViewers.set(viewers.filter(v => v.agentId !== currentUserId));
  }

  ngOnDestroy() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.presenceService.leave(id).subscribe();
    this.presenceService.unsubscribeFromTicket();
    if (this.presenceSubscription) this.presenceSubscription.unsubscribe();
    if (this.presenceInterval) clearInterval(this.presenceInterval);
    if (this.draftSubscription) this.draftSubscription.unsubscribe();
    // Unregister ticket-action shortcuts
    this.shortcutService.unregister('r');
    this.shortcutService.unregister('e');
    this.shortcutService.unregister('s');
    this.shortcutService.unregister('a');
  }

  otherAgentsCount(): number {
    return this.otherViewers().length;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.pendingFiles.update(existing => [...existing, ...files]);
    input.value = '';
  }

  removeFile(file: File) {
    this.pendingFiles.update(existing => existing.filter(f => f !== file));
  }

  sendReply() {
    if (this.replyControl.invalid) return;
    this.submitting = true;
    const id = this.ticket()!.id;
    const isInternal = this.noteMode === 'internal';
    this.ticketService.addComment(id, this.replyControl.value!, isInternal).subscribe({
      next: (comment) => {
        this.comments.update(c => [...c, comment]);
        const files = this.pendingFiles();
        this.pendingFiles.set([]);
        files.forEach(f => this.ticketService.uploadAttachment(id, f).subscribe({
          next: (att) => this.attachments.update(a => [...a, att])
        }));
        this.replyControl.reset();
        this.draftSavedAt.set(null);
        this.draftService.deleteDraft(id).subscribe();
        this.submitting = false;
      },
      error: () => { this.submitting = false; },
    });
  }

  discardDraft() {
    const id = this.ticket()?.id;
    if (!id) return;
    this.replyControl.reset();
    this.draftSavedAt.set(null);
    this.draftService.deleteDraft(id).subscribe();
  }

  updateStatus() {
    const id = this.ticket()!.id;
    this.ticketService.changeStatus(id, this.currentStatus).subscribe(t => this.ticket.set(t));
  }

  assignAgent() {
    if (!this.currentAgentId) return;
    const id = this.ticket()!.id;
    this.ticketService.assignTicket(id, this.currentAgentId).subscribe(t => this.ticket.set(t));
  }

  departmentName(): string {
    const deptId = this.ticket()?.departmentId;
    if (!deptId) return '';
    return this.departments().find(d => d.id === deptId)?.name ?? deptId;
  }

  addTag(value: string) {
    const tag = value.trim();
    if (!tag) return;
    const ticket = this.ticket()!;
    if (ticket.tags.includes(tag)) return;
    const newTags = [...ticket.tags, tag];
    this.ticketService.updateTicket(ticket.id, { tags: newTags }).subscribe(t => this.ticket.set(t));
  }

  removeTag(tag: string) {
    const ticket = this.ticket()!;
    const newTags = ticket.tags.filter(t => t !== tag);
    this.ticketService.updateTicket(ticket.id, { tags: newTags }).subscribe(t => this.ticket.set(t));
  }

  // Managed tag methods
  addManagedTag(tag: ManagedTag) {
    const current = this.ticketManagedTags();
    if (current.some(t => t.id === tag.id)) return;
    const newTags = [...current, tag];
    this.ticketManagedTags.set(newTags);
    this.tagService.setTicketTags(this.ticket()!.id, newTags.map(t => t.id)).subscribe();
    this.tagSearchQuery = '';
    this.showTagSuggestions = false;
    this.tagSuggestions.set([]);
  }

  removeManagedTag(tag: ManagedTag) {
    const newTags = this.ticketManagedTags().filter(t => t.id !== tag.id);
    this.ticketManagedTags.set(newTags);
    this.tagService.setTicketTags(this.ticket()!.id, newTags.map(t => t.id)).subscribe();
  }

  onTagSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    if (!q.trim()) {
      this.tagSuggestions.set([]);
      return;
    }
    this.tagService.searchTags(q).subscribe(tags => {
      const currentIds = new Set(this.ticketManagedTags().map(t => t.id));
      this.tagSuggestions.set(tags.filter(t => !currentIds.has(t.id)));
    });
  }

  addWatcher(value: string) {
    const email = value.trim();
    if (!email) return;
    const id = this.ticket()!.id;
    this.ticketService.addWatcher(id, email).subscribe(() => {
      this.ticketService.getWatchers(id).subscribe(w => this.watchers.set(w));
    });
  }

  removeWatcher(email: string) {
    const id = this.ticket()!.id;
    this.ticketService.removeWatcher(id, email).subscribe(() => {
      this.watchers.update(list => list.filter(w => w !== email));
    });
  }

  departmentOptions(): {label: string; value: string}[] {
    return this.departments().map(d => ({ label: d.name, value: d.id }));
  }

  publicComments(): import('../../../core/models').Comment[] {
    return this.comments().filter(c => !c.internal);
  }

  openSplitDialog() {
    const t = this.ticket();
    if (!t) return;
    this.splitSubject = 'Split: ' + t.title;
    this.splitDescription = '';
    this.splitDepartmentId = t.departmentId ?? null;
    this.splitPriority = t.priority ?? 'MEDIUM';
    this.splitCommentIds = [];
    this.splitDialogVisible = true;
  }

  confirmSplit() {
    const subject = this.splitSubject.trim();
    if (!subject) return;
    this.splitting = true;
    const id = this.ticket()!.id;
    this.ticketService.splitTicket(id, {
      subject,
      description: this.splitDescription,
      departmentId: this.splitDepartmentId ?? undefined,
      priority: this.splitPriority,
      commentIds: this.splitCommentIds.length > 0 ? this.splitCommentIds : undefined,
    }).subscribe({
      next: (newTicket) => {
        this.splitting = false;
        this.splitDialogVisible = false;
        // Reload comments (some may have moved)
        this.ticketService.getComments(id).subscribe(c => this.comments.set(c));
        // Show success
        const nb: any = document.createElement('div');
        nb.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:#7C3AED;color:white;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
        nb.textContent = 'Ticket split successfully into #' + newTicket.ticketNumber;
        document.body.appendChild(nb);
        setTimeout(() => nb.remove(), 4000);
      },
      error: () => { this.splitting = false; },
    });
  }

  showMergeDialog() {
    this.mergeDialogVisible = true;
    this.mergeSearch.set('');
    this.mergeResults.set([]);
    this.mergeTargetId.set(null);
  }

  onMergeSearch(query: string) {
    this.mergeSearch.set(query);
    clearTimeout(this.mergeSearchTimeout);
    if (query.length < 2) { this.mergeResults.set([]); return; }
    this.mergeSearchTimeout = setTimeout(() => {
      this.ticketService.getTickets({ search: query, size: 10 }).subscribe(page => {
        this.mergeResults.set(page.content.filter(t => t.id !== this.ticket()!.id));
      });
    }, 300);
  }

  selectMergeTarget(t: Ticket) {
    this.mergeTargetId.set(t.id);
  }

  confirmMerge() {
    const targetId = this.mergeTargetId();
    if (!targetId) return;
    this.merging = true;
    this.ticketService.mergeTicket(this.ticket()!.id, targetId).subscribe({
      next: () => {
        this.merging = false;
        this.mergeDialogVisible = false;
        this.router.navigate(['/agent/tickets', targetId]);
      },
      error: () => { this.merging = false; },
    });
  }

  onCustomValueChange(key: string, value: string) {
    this.customValues.update(vals => ({ ...vals, [key]: value }));
  }

  onCustomValueChangeAndSave(key: string, value: string) {
    this.onCustomValueChange(key, value);
    this.saveCustomValues();
  }

  onCustomDateChange(key: string, date: Date | null) {
    this.customDateValues.update(d => ({ ...d, [key]: date }));
    const value = date ? date.toISOString().substring(0, 10) : '';
    this.onCustomValueChangeAndSave(key, value);
  }

  saveCustomValues() {
    const id = this.ticket()?.id;
    if (!id) return;
    this.customFieldService.saveValues(id, this.customValues()).subscribe();
  }

  snoozeIn(hours: number): Date {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return d;
  }

  snoozeTomorrow9am(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  snoozeNextMonday9am(): Date {
    const d = new Date();
    const day = d.getDay();
    const daysUntilMonday = ((1 - day + 7) % 7) || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  snoozeCustom(dateStr: string) {
    this.snooze(dateStr ? new Date(dateStr) : null);
  }

  snooze(until: Date | null) {
    if (!until) return;
    const id = this.ticket()!.id;
    this.ticketService.snoozeTicket(id, until.toISOString()).subscribe(t => {
      this.ticket.set(t);
      this.showSnoozeDialog = false;
      this.customSnoozeDate = '';
    });
  }

  unsnooze() {
    const id = this.ticket()!.id;
    this.ticketService.snoozeTicket(id, null).subscribe(t => this.ticket.set(t));
  }

  topBarClass(): string {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500', OPEN: 'bg-indigo-500', PENDING: 'bg-amber-400',
      ON_HOLD: 'bg-slate-400', RESOLVED: 'bg-green-500', CLOSED: 'bg-slate-300',
    };
    return map[this.ticket()?.status || ''] || 'bg-gray-200';
  }

  onManualDueDateChange(date: Date) {
    const id = this.ticket()?.id;
    if (!id) return;
    this.ticketService.updateDueDate(id, date.toISOString()).subscribe(t => this.ticket.set(t));
  }

  clearManualDueDate() {
    const id = this.ticket()?.id;
    if (!id) return;
    this.manualDueDateValue = null;
    this.ticketService.updateDueDate(id, null).subscribe(t => this.ticket.set(t));
  }

  dateInputValue(d: Date | null): string {
    return d ? d.toISOString().substring(0, 10) : '';
  }

  onManualDueDateInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      this.clearManualDueDate();
      return;
    }
    const date = new Date(value);
    this.manualDueDateValue = date;
    this.onManualDueDateChange(date);
  }

  onCustomDateInput(key: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.onCustomDateChange(key, value ? new Date(value) : null);
  }

  toggleSplitComment(id: string, checked: boolean) {
    if (checked) {
      if (!this.splitCommentIds.includes(id)) this.splitCommentIds.push(id);
    } else {
      this.splitCommentIds = this.splitCommentIds.filter(c => c !== id);
    }
  }

  isManualOverdue(): boolean {
    const d = this.ticket()?.manualDueDate;
    if (!d) return false;
    return new Date(d) < new Date();
  }

  showLinkIssueDialog() {
    this.linkIssueDialogVisible = true;
    this.issueSearch.set('');
    this.issueResults.set([]);
    this.selectedIssueId.set(null);
    // Load all issues for search
    this.issueService.getIssues().subscribe(issues => this.issueResults.set(issues));
  }

  onIssueSearch(query: string) {
    this.issueSearch.set(query);
    clearTimeout(this.issueSearchTimeout);
    this.issueSearchTimeout = setTimeout(() => {
      this.issueService.getIssues().subscribe(issues => {
        const q = query.toLowerCase();
        this.issueResults.set(issues.filter(i => i.title.toLowerCase().includes(q)));
      });
    }, 300);
  }

  selectIssue(issue: Issue) {
    this.selectedIssueId.set(issue.id);
  }

  confirmLinkIssue() {
    const issueId = this.selectedIssueId();
    if (!issueId) return;
    this.linkingIssue = true;
    this.issueService.linkTicket(issueId, this.ticket()!.id).subscribe({
      next: () => {
        this.linkingIssue = false;
        this.linkIssueDialogVisible = false;
        // Refresh linked issues
        this.issueService.getIssuesByTicket(this.ticket()!.id).subscribe(issues => this.linkedIssues.set(issues));
      },
      error: () => { this.linkingIssue = false; },
    });
  }

  unlinkIssue(issueId: string) {
    this.issueService.unlinkTicket(issueId, this.ticket()!.id).subscribe({
      next: () => { this.linkedIssues.update(list => list.filter(i => i.id !== issueId)); },
      error: () => {},
    });
  }

  showAddLinkDialog() {
    this.addLinkDialogVisible = true;
    this.linkSearch.set('');
    this.linkResults.set([]);
    this.linkTargetId.set(null);
    this.selectedLinkType = 'RELATED_TO';
  }

  onLinkSearch(query: string) {
    this.linkSearch.set(query);
    clearTimeout(this.linkSearchTimeout);
    if (query.length < 2) { this.linkResults.set([]); return; }
    this.linkSearchTimeout = setTimeout(() => {
      this.ticketService.getTickets({ search: query, size: 10 }).subscribe(page => {
        this.linkResults.set(page.content.filter(t => t.id !== this.ticket()!.id));
      });
    }, 300);
  }

  selectLinkTarget(t: any) {
    this.linkTargetId.set(t.id);
  }

  confirmAddLink() {
    const targetId = this.linkTargetId();
    if (!targetId || !this.selectedLinkType) return;
    this.addingLink = true;
    const id = this.ticket()!.id;
    this.ticketLinkService.addLink(id, targetId, this.selectedLinkType).subscribe({
      next: (links) => {
        this.ticketLinks.set(links);
        this.addingLink = false;
        this.addLinkDialogVisible = false;
      },
      error: () => { this.addingLink = false; },
    });
  }

  removeTicketLink(event: MouseEvent, link: TicketLink) {
    event.preventDefault();
    event.stopPropagation();
    const id = this.ticket()!.id;
    this.ticketLinkService.removeLink(id, link.id).subscribe({
      next: () => {
        this.ticketLinkService.getLinks(id).subscribe(links => this.ticketLinks.set(links));
      },
    });
  }

  loadMacros() {
    this.macroService.getAll().subscribe({
      next: ms => this.macros.set(ms),
      error: () => {}
    });
  }

  parseMacroActions(actions: string): { type: string; value: string }[] {
    try {
      return JSON.parse(actions) ?? [];
    } catch {
      return [];
    }
  }

  openMacroOverlay() {
    if (this.macros().length === 0) { this.loadMacros(); }
    this.macroOverlayVisible = true;
  }

  applyMacro(m: Macro) {
    const ticketId = this.ticket()?.id;
    if (!ticketId) return;
    this.applyingMacro = true;
    this.macroService.apply(m.id, ticketId).subscribe({
      next: () => {
        this.applyingMacro = false;
        this.macroOverlayVisible = false;
        const id = this.route.snapshot.paramMap.get('id')!;
        this.ticketService.getTicket(id).subscribe(t => this.ticket.set(t));
      },
      error: () => { this.applyingMacro = false; }
    });
  }

  createSubTicket() {
    const subject = this.newSubSubject.trim();
    if (!subject) return;
    const id = this.ticket()!.id;
    this.creatingSubTicket = true;
    this.ticketParentService.createChild(id, {
      subject,
      description: this.newSubDescription.trim() || subject,
      priority: this.newSubPriority,
    }).subscribe({
      next: (child) => {
        this.childTickets.update(list => [...list, child]);
        this.showAddSubTicketForm = false;
        this.newSubSubject = '';
        this.newSubDescription = '';
        this.newSubPriority = 'MEDIUM';
        this.creatingSubTicket = false;
      },
      error: () => { this.creatingSubTicket = false; },
    });
  }

  unlinkParent() {
    const id = this.ticket()!.id;
    this.ticketParentService.removeParent(id).subscribe({
      next: () => {
        this.ticket.update(t => t ? { ...t, parentTicketId: null, parentTicketNumber: null, parentTicketTitle: null } : t);
      },
    });
  }

  onParentSearch(query: string) {
    this.parentSearch.set(query);
    clearTimeout(this.parentSearchTimeout);
    if (query.length < 2) { this.parentResults.set([]); return; }
    this.parentSearchTimeout = setTimeout(() => {
      this.ticketService.getTickets({ search: query, size: 10 }).subscribe(page => {
        this.parentResults.set(page.content.filter((t: any) => t.id !== this.ticket()!.id));
      });
    }, 300);
  }

  selectParentTarget(t: any) {
    this.parentTargetId.set(t.id);
  }

  confirmSetParent() {
    const parentId = this.parentTargetId();
    if (!parentId) return;
    this.settingParent = true;
    const id = this.ticket()!.id;
    const target = this.parentResults().find((t: any) => t.id === parentId);
    this.ticketParentService.setParent(id, parentId).subscribe({
      next: () => {
        this.settingParent = false;
        this.showSetParentDialog = false;
        this.ticket.update(t => t ? {
          ...t,
          parentTicketId: parentId,
          parentTicketNumber: target?.ticketNumber ?? null,
          parentTicketTitle: target?.title ?? null,
        } : t);
      },
      error: () => { this.settingParent = false; },
    });
  }

  // ── AI Triage ──────────────────────────────────────────────────────────────

  requestAiSuggestion(): void {
    const id = this.ticket()?.id;
    if (!id) return;
    this.aiLoading.set(true);
    this.aiError.set('');
    this.aiSuggestion.set(null);
    this.ticketService.getAiSuggestions(id).subscribe({
      next: (s) => {
        this.aiSuggestCategory = s.category;
        this.aiSuggestPriority = s.priority.toUpperCase();
        this.aiSuggestResponse = s.suggestedResponse;
        this.aiSuggestion.set(s);
        this.aiLoading.set(false);
      },
      error: () => {
        this.aiError.set('AI suggestion unavailable');
        this.aiLoading.set(false);
      },
    });
  }

  applyAiSuggestion(): void {
    const id = this.ticket()?.id;
    if (!id || !this.aiSuggestion()) return;
    // Pre-fill reply textarea — agent must still click Send Reply
    this.replyControl.setValue(this.aiSuggestResponse);
    // Update ticket priority and category (explicit agent action)
    this.ticketService.updateTicket(id, {
      priority: this.aiSuggestPriority as any,
      category: this.aiSuggestCategory,
    }).subscribe({
      next: (updated) => { this.ticket.set(updated); },
      error: () => { /* reply textarea still pre-filled even if ticket update fails */ },
    });
    this.aiSuggestion.set(null);
    this.aiError.set('');
  }

  dismissAiSuggestion(): void {
    this.aiSuggestion.set(null);
    this.aiError.set('');
  }

  requestAiSummary() {
    this.aiSummaryLoading.set(true);
    this.aiSummaryError.set(null);
    this.ticketService.getAiSummary(this.ticket()!.id).subscribe({
      next: (res) => {
        this.aiSummary.set(res.summary);
        this.aiSummaryLoading.set(false);
      },
      error: () => {
        this.aiSummaryError.set('Failed to generate summary.');
        this.aiSummaryLoading.set(false);
      }
    });
  }

  dismissAiSummary() {
    this.aiSummary.set(null);
    this.aiSummaryError.set(null);
  }

  requestSentiment() {
    this.sentimentLoading.set(true);
    this.sentimentError.set(null);
    this.ticketService.getAiSentiment(this.ticket()!.id).subscribe({
      next: (res) => { this.sentiment.set(res); this.sentimentLoading.set(false); },
      error: () => { this.sentimentError.set('Failed to analyze sentiment.'); this.sentimentLoading.set(false); }
    });
  }

  dismissSentiment() {
    this.sentiment.set(null);
    this.sentimentError.set(null);
  }

  requestSmartReply() {
    this.smartReplyLoading.set(true);
    this.ticketService.getSmartReply(this.ticket()!.id).subscribe({
      next: (res) => {
        this.replyControl.setValue(res.reply);
        this.smartReplyLoading.set(false);
      },
      error: () => { this.smartReplyLoading.set(false); }
    });
  }

  autoCategorize() {
    this.autoCategorizeLoading.set(true);
    this.ticketService.autoCategorize(this.ticket()!.id).subscribe({
      next: (res) => {
        this.ticketService.getTicket(this.ticket()!.id).subscribe(t => this.ticket.set(t));
        this.autoCategorizeLoading.set(false);
      },
      error: () => { this.autoCategorizeLoading.set(false); }
    });
  }

  checkDuplicates() {
    this.duplicatesLoading.set(true);
    this.ticketService.detectDuplicates(this.ticket()!.id).subscribe({
      next: (res) => {
        this.duplicates.set(res.duplicates || []);
        this.duplicatesChecked.set(true);
        this.duplicatesLoading.set(false);
      },
      error: () => { this.duplicatesLoading.set(false); }
    });
  }
}
