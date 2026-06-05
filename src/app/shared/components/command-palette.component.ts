import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandPaletteService, CommandItem } from '../../core/services/command-palette.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (service.isOpen()) {
      <div class="palette-overlay" (click)="service.close()">
        <div class="palette-container" (click)="$event.stopPropagation()">
          <div class="palette-header">
            <span class="palette-icon">🔍</span>
            <input #searchInput type="text" class="palette-input" placeholder="Type a command or search..."
              [(ngModel)]="query" (ngModelChange)="onSearch($event)" (keydown)="onKeyDown($event)" autofocus />
            <kbd (click)="service.close()">ESC</kbd>
          </div>
          <div class="palette-results">
            @for (group of groupedResults(); track group.category) {
              <div class="result-group">
                <div class="group-label">{{ group.category }}</div>
                @for (item of group.items; track item.id; let i = $index) {
                  <button class="result-item" [class.active]="selectedIndex() === getGlobalIndex(group, item)"
                    (click)="execute(item)" (mouseenter)="selectedIndex.set(getGlobalIndex(group, item))">
                    <span class="item-icon">{{ getEmoji(item.icon) }}</span>
                    <span class="item-label">{{ item.label }}</span>
                  </button>
                }
              </div>
            }
            @if (results().length === 0) {
              <div class="no-results">No results found</div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .palette-overlay {
      position: fixed; inset: 0; 
      background: rgba(0,0,0,0.5); 
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: var(--z-command); 
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 15vh; 
      animation: overlayFadeIn 0.2s ease-out;
    }
    @keyframes overlayFadeIn {
      from { opacity: 0; backdrop-filter: blur(0); }
      to { opacity: 1; backdrop-filter: blur(8px); }
    }
    .palette-container {
      background: var(--glass-bg-light, var(--bg-surface)); 
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border-light, var(--border-color));
      border-radius: var(--radius-2xl); 
      box-shadow: 
        0 24px 48px rgba(0, 0, 0, 0.2),
        0 12px 24px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.05);
      width: 600px; max-width: 90vw; max-height: 480px; overflow: hidden;
      animation: paletteSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
      display: flex; flex-direction: column;
    }
    @keyframes paletteSlideIn {
      from { opacity: 0; transform: scale(0.95) translateY(-20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .palette-header {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-5); 
      border-bottom: 1px solid var(--glass-border-medium, var(--border-color));
      background: rgba(0, 0, 0, 0.02);
    }
    .palette-icon { 
      font-size: 20px; 
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
    }
    .palette-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text-primary); font-size: var(--text-lg);
      font-weight: 500;
    }
    .palette-input::placeholder { color: var(--text-muted); }
    kbd {
      font-size: var(--text-xs); 
      background: var(--bg-muted); 
      border: 1px solid var(--border-color);
      border-radius: 6px; 
      padding: 4px 10px; 
      color: var(--text-muted); 
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    kbd:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }
    .palette-results { 
      overflow-y: auto; 
      padding: var(--space-3);
      max-height: 360px;
    }
    .result-group { 
      margin-bottom: var(--space-2); 
    }
    .result-group:last-child {
      margin-bottom: 0;
    }
    .group-label {
      font-size: var(--text-xs); 
      color: var(--text-muted); 
      font-weight: 600;
      text-transform: uppercase; 
      padding: var(--space-2) var(--space-3); 
      letter-spacing: 0.06em;
    }
    .result-item {
      display: flex; align-items: center; gap: var(--space-3); width: 100%;
      padding: var(--space-3) var(--space-4); 
      border: none; background: none;
      border-radius: var(--radius-lg); 
      color: var(--text-primary); 
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer; 
      transition: all 0.15s ease;
      position: relative;
    }
    .result-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: var(--color-primary);
      border-radius: 0 var(--radius-full) var(--radius-full) 0;
      transition: height 0.2s ease;
    }
    .result-item:hover, .result-item.active { 
      background: var(--bg-surface-hover);
      transform: translateX(4px);
    }
    .result-item.active::before {
      height: 50%;
    }
    .item-icon { 
      width: 32px; 
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted);
      border-radius: var(--radius-md);
      font-size: 1rem;
      transition: transform 0.2s ease;
    }
    .result-item:hover .item-icon,
    .result-item.active .item-icon {
      transform: scale(1.1);
    }
    .item-label {
      flex: 1;
      text-align: left;
    }
    .no-results { 
      text-align: center; 
      padding: var(--space-10); 
      color: var(--text-muted); 
      font-size: var(--text-sm);
    }
    .no-results::before {
      content: '🔍';
      display: block;
      font-size: 2rem;
      margin-bottom: var(--space-3);
      opacity: 0.5;
    }
    
    @media (max-width: 640px) {
      .palette-overlay {
        padding: var(--space-4);
        padding-top: var(--space-8);
        align-items: flex-start;
      }
      .palette-container {
        width: 100%;
        max-width: 100%;
        max-height: 80vh;
        border-radius: var(--radius-xl);
      }
      .palette-header {
        padding: var(--space-4);
      }
      .palette-input {
        font-size: var(--text-base);
      }
      .result-item {
        padding: var(--space-3);
      }
    }
  `]
})
export class CommandPaletteComponent {
  service = inject(CommandPaletteService);
  private theme = inject(ThemeService);

  query = '';
  results = signal<CommandItem[]>([]);
  selectedIndex = signal(0);

  groupedResults = computed(() => {
    const items = this.results();
    const groups: { category: string; items: CommandItem[] }[] = [];
    const map = new Map<string, CommandItem[]>();
    items.forEach(item => {
      const arr = map.get(item.category) || [];
      arr.push(item);
      map.set(item.category, arr);
    });
    map.forEach((items, category) => groups.push({ category, items }));
    return groups;
  });

  constructor() {
    this.results.set(this.service.getCommands());
  }

  onSearch(query: string): void {
    this.results.set(this.service.search(query));
    this.selectedIndex.set(0);
  }

  onKeyDown(e: KeyboardEvent): void {
    const total = this.results().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedIndex.update(i => (i + 1) % total); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedIndex.update(i => (i - 1 + total) % total); }
    else if (e.key === 'Enter') { e.preventDefault(); const item = this.results()[this.selectedIndex()]; if (item) this.execute(item); }
    else if (e.key === 'Escape') { this.service.close(); }
  }

  execute(item: CommandItem): void {
    if (item.id === 'action-theme') { this.theme.toggleDark(); }
    item.action();
    this.query = '';
    this.results.set(this.service.getCommands());
  }

  getGlobalIndex(group: { category: string; items: CommandItem[] }, item: CommandItem): number {
    return this.results().indexOf(item);
  }

  getEmoji(icon: string): string {
    const icons: Record<string, string> = {
      'grid': '📊', 'building': '🏫', 'users-cog': '👥', 'calendar-range': '📅',
      'layout-grid': '🏛️', 'book-open': '📖', 'graduation-cap': '🎓', 'briefcase': '💼',
      'heart-handshake': '🤝', 'clipboard-check': '✅', 'file-text': '📝', 'bar-chart-2': '📈',
      'credit-card': '💳', 'bus': '🚌', 'clock': '🕐', 'trending-up': '📈',
      'shuffle': '🔀', 'bell': '🔔', 'pie-chart': '🥧', 'package': '📦', 'settings': '⚙️',
      'log-out': '🚪', 'moon': '🌙', 'user': '👤',
    };
    return icons[icon] || '📄';
  }
}
