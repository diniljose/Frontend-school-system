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
      display: flex; flex-direction: column; gap: var(--space-2); max-width: 400px; width: 100%;
    }
    .toast {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
      animation: slideInRight 0.3s ease-out; cursor: pointer;
    }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .toast-success { border-left: 3px solid var(--color-success); }
    .toast-error { border-left: 3px solid var(--color-danger); }
    .toast-warning { border-left: 3px solid var(--color-warning); }
    .toast-info { border-left: 3px solid var(--color-info); }
    .toast-body { flex: 1; }
    .toast-body strong { font-size: var(--text-sm); display: block; }
    .toast-body p { font-size: var(--text-xs); color: var(--text-secondary); margin-top: 2px; }
    .toast-close { background: none; border: none; color: var(--text-muted); font-size: 14px; padding: 0; }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
