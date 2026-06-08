import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { CsatService } from '../../core/services/csat.service';

@Component({
  selector: 'app-csat-rating',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center" style="background:#F8FAFC">
      <div class="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full mx-4"
           style="box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
            <i class="pi pi-star-fill text-white" style="font-size:24px"></i>
          </div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Rate Your Experience</h1>
          <p class="text-sm text-slate-400 mt-1">How satisfied were you with our support?</p>
        </div>

        <div *ngIf="submitted()" class="text-center py-6">
          <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
               style="background:#F0FDF4">
            <i class="pi pi-check-circle" style="font-size:32px;color:#16a34a"></i>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p class="text-slate-500 text-sm">Your feedback helps us improve our support.</p>
          <a routerLink="/customer" pButton class="mt-6 !rounded-xl">Back to Portal</a>
        </div>

        <div *ngIf="alreadyRated()" class="text-center py-6">
          <i class="pi pi-info-circle" style="font-size:32px;color:#6366F1"></i>
          <p class="text-gray-600 mt-3">You have already rated this ticket.</p>
          <a routerLink="/customer" pButton class="mt-6 !rounded-xl">Back to Portal</a>
        </div>

        <div *ngIf="!submitted() && !alreadyRated()">
          <!-- Star rating -->
          <div class="flex justify-center gap-3 mb-6">
            <button *ngFor="let star of stars"
                    type="button"
                    (click)="setRating(star)"
                    (mouseenter)="hoverRating.set(star)"
                    (mouseleave)="hoverRating.set(0)"
                    class="transition-transform hover:scale-110 focus:outline-none"
                    style="background:none;border:none;cursor:pointer;padding:4px">
              <i [class]="'pi ' + ((hoverRating() || selectedRating()) >= star ? 'pi-star-fill' : 'pi-star')"
                 style="font-size:40px"
                 [style.color]="(hoverRating() || selectedRating()) >= star ? '#F59E0B' : '#CBD5E1'"></i>
            </button>
          </div>

          <div *ngIf="selectedRating() > 0" class="text-center mb-6">
            <span class="text-sm font-semibold" style="color:#6366F1">{{ ratingLabel() }}</span>
          </div>

          <!-- Comment -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Additional comments (optional)</label>
            <textarea pTextarea [(ngModel)]="comment" rows="3"
                      class="w-full"
                      placeholder="Tell us more about your experience..."></textarea>
          </div>

          <div *ngIf="error()" class="mb-4 px-4 py-3 rounded-xl text-sm"
               style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA">
            {{ error() }}
          </div>

          <button pButton type="button"
                  [disabled]="selectedRating() === 0 || submitting()"
                  (click)="submit()"
                  class="w-full !rounded-xl !font-semibold"
                  style="height:44px">
            <i class="pi pi-send mr-2"></i>
            {{ submitting() ? 'Submitting...' : 'Submit Rating' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CsatRatingComponent implements OnInit {
  ticketId = '';
  stars = [1, 2, 3, 4, 5];
  selectedRating = signal(0);
  hoverRating = signal(0);
  comment = '';
  submitting = signal(false);
  submitted = signal(false);
  alreadyRated = signal(false);
  error = signal('');

  constructor(private route: ActivatedRoute, private csatService: CsatService) {}

  ngOnInit() {
    this.ticketId = this.route.snapshot.paramMap.get('ticketId') || '';
    if (this.ticketId) {
      this.csatService.getRating(this.ticketId).subscribe({
        next: rating => { if (rating) this.alreadyRated.set(true); },
        error: () => {},
      });
    }
  }

  setRating(star: number) {
    this.selectedRating.set(star);
  }

  ratingLabel() {
    const labels: Record<number, string> = {
      1: 'Very Unsatisfied',
      2: 'Unsatisfied',
      3: 'Neutral',
      4: 'Satisfied',
      5: 'Very Satisfied',
    };
    return labels[this.selectedRating()] || '';
  }

  submit() {
    if (this.selectedRating() === 0) return;
    this.submitting.set(true);
    this.error.set('');
    this.csatService.submitRating(this.ticketId, this.selectedRating(), this.comment).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message || 'Failed to submit rating. Please try again.');
      },
    });
  }
}
