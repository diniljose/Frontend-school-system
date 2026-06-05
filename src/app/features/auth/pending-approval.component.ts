import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="premium-auth-card">
      <div class="auth-section">
        <div class="card-header">
          <div class="header-icon pending-icon">
            <svg class="clock-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <h1>Registration Submitted!</h1>
          <p class="subtitle">Your school registration is pending approval</p>
        </div>

        <div class="info-card">
          @if (schoolName()) {
            <div class="info-row">
              <div class="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>School</span>
              </div>
              <span class="info-value">{{ schoolName() }}</span>
            </div>
          }
          @if (email()) {
            <div class="info-row">
              <div class="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>Admin Email</span>
              </div>
              <span class="info-value">{{ email() }}</span>
            </div>
          }
          <div class="info-row">
            <div class="info-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Status</span>
            </div>
            <span class="status-badge pending">
              <span class="status-dot"></span>
              Pending Approval
            </span>
          </div>
        </div>

        <div class="timeline">
          <h3>What happens next?</h3>
          <div class="timeline-items">
            <div class="timeline-item completed">
              <div class="timeline-marker">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="timeline-content">
                <span class="timeline-title">Registration submitted</span>
                <span class="timeline-desc">Your application has been received</span>
              </div>
            </div>
            
            <div class="timeline-item active">
              <div class="timeline-marker">
                <span>2</span>
              </div>
              <div class="timeline-content">
                <span class="timeline-title">Under review</span>
                <span class="timeline-desc">Platform administrator reviews your application</span>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-marker">
                <span>3</span>
              </div>
              <div class="timeline-content">
                <span class="timeline-title">Email notification</span>
                <span class="timeline-desc">You'll receive an email when approved</span>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-marker">
                <span>4</span>
              </div>
              <div class="timeline-content">
                <span class="timeline-title">Start managing</span>
                <span class="timeline-desc">Login and start managing your school</span>
              </div>
            </div>
          </div>
        </div>

        <a routerLink="/auth/login" class="premium-secondary-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to Login</span>
        </a>

        <p class="support-text">
          Questions? Contact 
          <a href="mailto:support@schoolplatform.com">support&#64;schoolplatform.com</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .premium-auth-card {
      width: 100%;
      max-width: 520px;
      animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    
    @keyframes cardEntrance {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.96);
      }
      60% {
        transform: translateY(-4px) scale(1.01);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .auth-section {
      text-align: center;
    }

    .card-header {
      margin-bottom: 28px;
    }
    
    .header-icon {
      width: 88px;
      height: 88px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    
    .header-icon.pending-icon {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 179, 8, 0.08));
      color: #f59e0b;
      position: relative;
      
      .clock-svg {
        animation: pendingPulse 2s ease-in-out infinite;
      }
    }
    
    @keyframes pendingPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }
    
    .card-header h1 {
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 15px;
      color: var(--text-secondary);
    }

    .info-card {
      background: var(--bg-muted);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 20px;
      margin-bottom: 28px;
      text-align: left;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-color);
      
      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      &:first-child {
        padding-top: 0;
      }
    }
    
    .info-label {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-muted);
      font-size: 14px;
      
      svg {
        opacity: 0.6;
      }
    }
    
    .info-value {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 14px;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      
      &.pending {
        background: rgba(245, 158, 11, 0.12);
        color: #b45309;
      }
      
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f59e0b;
        animation: statusBlink 1.5s ease-in-out infinite;
      }
    }
    
    @keyframes statusBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .timeline {
      text-align: left;
      margin-bottom: 28px;
      
      h3 {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 20px;
        text-align: center;
      }
    }
    
    .timeline-items {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
      padding-left: 20px;
      
      &::before {
        content: '';
        position: absolute;
        left: 13px;
        top: 20px;
        bottom: 20px;
        width: 2px;
        background: var(--border-color);
      }
    }
    
    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 12px 0;
      position: relative;
      
      .timeline-marker {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        background: var(--bg-muted);
        color: var(--text-muted);
        border: 2px solid var(--border-color);
        flex-shrink: 0;
        position: relative;
        z-index: 1;
      }
      
      .timeline-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 3px;
      }
      
      .timeline-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .timeline-desc {
        font-size: 13px;
        color: var(--text-muted);
      }
      
      &.completed {
        .timeline-marker {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
        }
      }
      
      &.active {
        .timeline-marker {
          background: #f59e0b;
          border-color: #f59e0b;
          color: #fff;
          animation: markerPulse 2s ease-in-out infinite;
        }
        
        .timeline-title {
          color: #f59e0b;
        }
      }
    }
    
    @keyframes markerPulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
      }
    }

    .premium-secondary-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      height: 52px;
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      margin-bottom: 24px;
      
      &:hover {
        border-color: var(--color-primary);
        background: var(--bg-surface-hover);
        color: var(--color-primary);
        
        svg {
          transform: translateX(-4px);
        }
      }
      
      svg {
        transition: transform 0.3s;
      }
    }

    .support-text {
      font-size: 14px;
      color: var(--text-secondary);
      
      a {
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }

    @media (max-width: 640px) {
      .premium-auth-card { padding: 0; }
      .card-header h1 { font-size: 1.5rem; }
      .header-icon { width: 72px; height: 72px; }
      .info-row { flex-direction: column; align-items: flex-start; gap: 6px; }
      .timeline-items { padding-left: 16px; }
      .timeline-item { gap: 12px; }
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
