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
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      z-index: var(--z-command); display: flex; align-items: flex-start; justify-content: center;
      padding-top: 20vh; animation: fadeIn 0.15s ease-out;
    }
    .palette-container {
      background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-xl); box-shadow: var(--shadow-xl);
      width: 560px; max-width: 90vw; max-height: 60vh; overflow: hidden;
      animation: scaleIn 0.2s ease-out; display: flex; flex-direction: column;
    }
    .palette-header {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4); border-bottom: 1px solid var(--border-color);
    }
    .palette-icon { font-size: 18px; flex-shrink: 0; }
    .palette-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text-primary); font-size: var(--text-base);
    }
    .palette-input::placeholder { color: var(--text-muted); }
    kbd {
      font-size: var(--text-xs); background: var(--bg-muted); border: 1px solid var(--border-color);
      border-radius: 4px; padding: 2px 8px; color: var(--text-muted); cursor: pointer;
    }
    .palette-results { overflow-y: auto; padding: var(--space-2); }
    .result-group { margin-bottom: var(--space-1); }
    .group-label {
      font-size: var(--text-xs); color: var(--text-muted); font-weight: 600;
      text-transform: uppercase; padding: var(--space-2) var(--space-3); letter-spacing: 0.05em;
    }
    .result-item {
      display: flex; align-items: center; gap: var(--space-3); width: 100%;
      padding: var(--space-2) var(--space-3); border: none; background: none;
      border-radius: var(--radius-md); color: var(--text-primary); font-size: var(--text-sm);
      cursor: pointer; transition: background var(--transition-fast);
    }
    .result-item:hover, .result-item.active { background: var(--bg-surface-hover); }
    .item-icon { width: 24px; text-align: center; }
    .no-results { text-align: center; padding: var(--space-8); color: var(--text-muted); font-size: var(--text-sm); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
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
