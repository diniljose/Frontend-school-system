import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="pending-card animate-in">
      <div class="pending-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
      </div>

      <div class="pending-content">
        <h1>Registration Submitted!</h1>
        <p class="subtitle">Your school registration is pending approval</p>

        <div class="info-box">
          @if (schoolName()) {
            <div class="info-row">
              <span class="label">School:</span>
              <span class="value">{{ schoolName() }}</span>
            </div>
          }
          @if (email()) {
            <div class="info-row">
              <span class="label">Admin Email:</span>
              <span class="value">{{ email() }}</span>
            </div>
          }
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="status pending">Pending Approval</span>
          </div>
        </div>

        <div class="steps">
          <h3>What happens next?</h3>
          <ol>
            <li>
              <span class="step-icon done">✓</span>
              <span>Registration submitted</span>
            </li>
            <li>
              <span class="step-icon pending">2</span>
              <span>Platform administrator reviews your application</span>
            </li>
            <li>
              <span class="step-icon">3</span>
              <span>You receive an email when approved</span>
            </li>
            <li>
              <span class="step-icon">4</span>
              <span>Login and start managing your school</span>
            </li>
          </ol>
        </div>

        <div class="actions">
          <a routerLink="/auth/login" class="btn btn-outline">
            Back to Login
          </a>
        </div>

        <p class="support-text">
          Questions? Contact <a href="mailto:support@schoolplatform.com">support&#64;schoolplatform.com</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .pending-card {
      width: 100%;
      max-width: 520px;
      text-align: center;
    }

    .pending-icon {
      color: var(--primary, #6366f1);
      margin-bottom: var(--space-6);
    }

    .pending-icon svg {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }

    .pending-content h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      margin-bottom: var(--space-2);
      color: var(--text-primary);
    }

    .subtitle {
      color: var(--text-secondary);
      margin-bottom: var(--space-6);
    }

    .info-box {
      background: var(--bg-secondary, #f8fafc);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      text-align: left;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--border, #e2e8f0);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }

    .value {
      font-weight: 500;
    }

    .status {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .status.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .steps {
      text-align: left;
      margin-bottom: var(--space-6);
    }

    .steps h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      margin-bottom: var(--space-4);
    }

    .steps ol {
      list-style: none;
      padding: 0;
    }

    .steps li {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) 0;
      color: var(--text-secondary);
    }

    .step-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
      font-weight: 600;
      background: var(--bg-secondary, #f1f5f9);
      color: var(--text-secondary);
    }

    .step-icon.done {
      background: #22c55e;
      color: white;
    }

    .step-icon.pending {
      background: #f59e0b;
      color: white;
      animation: pulse 2s ease-in-out infinite;
    }

    .actions {
      margin-bottom: var(--space-4);
    }

    .btn-outline {
      display: inline-block;
      padding: var(--space-3) var(--space-6);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: var(--text-primary);
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-outline:hover {
      background: var(--bg-secondary);
    }

    .support-text {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .support-text a {
      color: var(--primary, #6366f1);
      font-weight: 500;
    }
  `]
})
export class PendingApprovalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  email = signal('');
  schoolName = signal('');

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email.set(params['email'] || '');
      this.schoolName.set(params['school'] || '');
    });
  }
}
