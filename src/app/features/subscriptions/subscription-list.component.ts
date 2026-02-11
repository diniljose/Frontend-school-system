import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Subscription } from '../../core/models';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.subscriptions' | translate }}</h1><p>Manage school subscriptions and plans</p></div>
    </div>

    <div class="grid grid-3">
      @for (plan of plans; track plan.name) {
        <div class="plan-card card" [class.popular]="plan.popular">
          @if (plan.popular) { <div class="popular-badge">Most Popular</div> }
          <h3>{{ plan.name }}</h3>
          <div class="plan-price">
            <span class="price">\${{ plan.price }}</span>
            <span class="period">/month</span>
          </div>
          <ul class="plan-features">
            @for (f of plan.features; track f) { <li>✅ {{ f }}</li> }
          </ul>
          <button class="btn" [class]="plan.popular ? 'btn-primary' : 'btn-secondary'" style="width:100%">
            Choose Plan
          </button>
        </div>
      }
    </div>

    <div class="card" style="margin-top:var(--space-6)">
      <h3 style="margin-bottom:var(--space-4)">📋 Active Subscriptions</h3>
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead><tr><th>School</th><th>Plan</th><th>Start Date</th><th>Expiry</th><th>Status</th></tr></thead>
          <tbody>
            @for (s of subscriptions(); track s._id) {
              <tr>
                <td><strong>{{ s.school }}</strong></td>
                <td>{{ s.plan }}</td>
                <td>{{ s.startDate | date:'mediumDate' }}</td>
                <td>{{ s.endDate | date:'mediumDate' }}</td>
                <td><span class="badge" [class]="s.status === 'active' ? 'badge-success' : 'badge-warning'">{{ s.status }}</span></td>
              </tr>
            } @empty { <tr><td colspan="5" class="empty-state">No subscriptions</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .plan-card { text-align: center; border: 1px solid var(--border); position: relative; transition: var(--transition-fast); }
    .plan-card:hover { border-color: var(--primary); transform: translateY(-4px); }
    .plan-card.popular { border-color: var(--primary); border-width: 2px; }
    .popular-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: var(--primary); color: white; padding: 4px 16px; border-radius: 20px; font-size: var(--text-xs); font-weight: 600;
    }
    .plan-price { margin: var(--space-4) 0; }
    .price { font-size: var(--text-4xl); font-weight: 800; }
    .period { font-size: var(--text-sm); color: var(--text-secondary); }
    .plan-features { list-style: none; padding: 0; margin: var(--space-4) 0; text-align: left; }
    .plan-features li { padding: var(--space-2) 0; font-size: var(--text-sm); border-bottom: 1px solid var(--border); }
    .plan-features li:last-child { border-bottom: none; }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
  `]
})
export class SubscriptionListComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  subscriptions = signal<Subscription[]>([]);

  plans = [
    { name: 'Starter', price: 29, popular: false, features: ['Up to 100 students', '5 Teachers', 'Basic reports', 'Email support'] },
    { name: 'Professional', price: 79, popular: true, features: ['Up to 500 students', '25 Teachers', 'Advanced analytics', 'GPS Tracking', 'Priority support'] },
    { name: 'Enterprise', price: 199, popular: false, features: ['Unlimited students', 'Unlimited teachers', 'Custom branding', 'API access', '24/7 phone support', 'Multi-campus'] },
  ];

  ngOnInit(): void {
    this.api.get<any>('/subscriptions').subscribe({
      next: (res) => { this.subscriptions.set(res.data || res || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
