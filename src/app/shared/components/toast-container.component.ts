import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="toastService.dismiss(toast.id)">
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✅ }
              @case ('error') { ❌ }
              @case ('warning') { ⚠️ }
              @case ('info') { ℹ️ }
            }
          </span>
          <div class="toast-body">
            <strong>{{ toast.title }}</strong>
            @if (toast.message) { <p>{{ toast.message }}</p> }
          </div>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: var(--space-4); right: var(--space-4); z-index: var(--z-toast);
      display: flex; flex-direction: column; gap: var(--space-3); max-width: 420px; width: 100%;
      pointer-events: none;
    }
    .toast {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4);
      background: var(--glass-bg-light, var(--bg-surface)); 
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border-light, var(--border-color));
      border-radius: var(--radius-xl); 
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.12),
        0 4px 8px rgba(0, 0, 0, 0.06);
      animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.2s ease;
    }
    .toast:hover {
      transform: translateX(-4px);
      box-shadow: 
        0 12px 32px rgba(0, 0, 0, 0.15),
        0 6px 12px rgba(0, 0, 0, 0.08);
    }
    @keyframes toastSlideIn { 
      from { opacity: 0; transform: translateX(100%); } 
      to { opacity: 1; transform: translateX(0); } 
    }
    .toast-success { 
      border-left: 4px solid var(--color-success); 
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent);
    }
    .toast-error { 
      border-left: 4px solid var(--color-danger); 
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), transparent);
    }
    .toast-warning { 
      border-left: 4px solid var(--color-warning); 
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent);
    }
    .toast-info { 
      border-left: 4px solid var(--color-info); 
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent);
    }
    .toast-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
    }
    .toast-success .toast-icon { background: rgba(16, 185, 129, 0.15); }
    .toast-error .toast-icon { background: rgba(239, 68, 68, 0.15); }
    .toast-warning .toast-icon { background: rgba(245, 158, 11, 0.15); }
    .toast-info .toast-icon { background: rgba(59, 130, 246, 0.15); }
    .toast-body { flex: 1; }
    .toast-body strong { 
      font-size: var(--text-sm); 
      display: block; 
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .toast-body p { 
      font-size: var(--text-xs); 
      color: var(--text-secondary); 
      margin-top: 4px; 
      line-height: 1.4;
    }
    .toast-close { 
      background: none; 
      border: none; 
      color: var(--text-muted); 
      font-size: 16px; 
      padding: 4px;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
      cursor: pointer;
      line-height: 1;
    }
    .toast-close:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }
    
    @media (max-width: 480px) {
      .toast-container {
        top: auto;
        bottom: var(--space-4);
        right: var(--space-3);
        left: var(--space-3);
        max-width: none;
      }
      .toast {
        border-radius: var(--radius-lg);
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
