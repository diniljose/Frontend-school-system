import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { MENU_ITEMS, MenuItem, THEME_PRESETS } from '../../core/constants';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  template: `
    <!-- Sidebar -->
    <aside class="sidebar no-print" [class.collapsed]="sidebarCollapsed()" [class.mobile-open]="mobileOpen()">
      <div class="sidebar-header">
        <div class="logo-area" (click)="toggleSidebar()">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="var(--color-primary)"/><path d="M12 28V16l8-5 8 5v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 28v-6h6v6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          @if (!sidebarCollapsed()) {
            <span class="logo-text">EduCore</span>
          }
        </div>
      </div>

      <nav class="sidebar-nav">
        @for (item of filteredMenu(); track item.route) {
          <a class="nav-item" [routerLink]="item.route" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
             [title]="item.label" (click)="mobileOpen.set(false)">
            <span class="nav-icon">{{ getIcon(item.icon) }}</span>
            @if (!sidebarCollapsed()) {
              <span class="nav-label">{{ item.translationKey | translate }}</span>
            }
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item" (click)="auth.logout()" title="Sign Out">
          <span class="nav-icon">🚪</span>
          @if (!sidebarCollapsed()) { <span class="nav-label">{{ 'nav.logout' | translate }}</span> }
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    @if (mobileOpen()) {
      <div class="mobile-overlay" (click)="mobileOpen.set(false)"></div>
    }

    <!-- Main Area -->
    <div class="main-wrapper" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Header -->
      <header class="header no-print">
        <div class="header-left">
          <button class="btn btn-ghost btn-icon mobile-menu-btn" (click)="mobileOpen.set(true)">☰</button>
          <button class="btn btn-ghost btn-icon desktop-collapse" (click)="toggleSidebar()">
            {{ sidebarCollapsed() ? '☰' : '◀' }}
          </button>
          <div class="search-trigger" (click)="commandPalette.open()">
            <span class="search-icon">🔍</span>
            <span class="search-placeholder">{{ 'common.search' | translate }}</span>
            <kbd>⌘K</kbd>
          </div>
        </div>
        <div class="header-right">
          <!-- Language Selector -->
          <div class="dropdown" [class.open]="langOpen()">
            <button class="btn btn-ghost btn-sm" (click)="langOpen.set(!langOpen())">
              🌐 {{ currentLang().toUpperCase() }}
            </button>
            @if (langOpen()) {
              <div class="dropdown-menu">
                @for (lang of ['en','es','fr']; track lang) {
                  <button class="dropdown-item" [class.active]="currentLang() === lang"
                    (click)="switchLang(lang)">{{ lang.toUpperCase() }}</button>
                }
              </div>
            }
          </div>

          <!-- Theme Toggle -->
          <button class="btn btn-ghost btn-icon" (click)="theme.toggleDark()" [title]="theme.isDark() ? 'Light Mode' : 'Dark Mode'">
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>

          <!-- Theme Preset -->
          <div class="dropdown" [class.open]="themeOpen()">
            <button class="btn btn-ghost btn-icon" (click)="themeOpen.set(!themeOpen())" title="Theme">🎨</button>
            @if (themeOpen()) {
              <div class="dropdown-menu preset-menu">
                @for (p of theme.presets; track p.key) {
                  <button class="dropdown-item preset-item" (click)="theme.setPreset(p); themeOpen.set(false)">
                    <span class="preset-dot" [style.background]="p.primary"></span>
                    {{ p.name }}
                  </button>
                }
              </div>
            }
          </div>

          <!-- Notifications -->
          <button class="btn btn-ghost btn-icon" routerLink="/notifications" title="Notifications">
            🔔<span class="notif-dot"></span>
          </button>

          <!-- User Menu -->
          <div class="dropdown" [class.open]="userMenuOpen()">
            <button class="user-avatar" (click)="userMenuOpen.set(!userMenuOpen())">
              <div class="avatar">{{ auth.userName().charAt(0) }}</div>
              @if (!sidebarCollapsed()) {
                <div class="user-info">
                  <span class="user-name">{{ auth.userName() }}</span>
                  <span class="user-role">{{ auth.userRole() }}</span>
                </div>
              }
            </button>
            @if (userMenuOpen()) {
              <div class="dropdown-menu">
                <button class="dropdown-item" routerLink="/settings" (click)="userMenuOpen.set(false)">⚙️ Settings</button>
                <button class="dropdown-item" (click)="auth.logout()">🚪 Sign Out</button>
              </div>
            }
          </div>
        </div>
      </header>

      <!-- Content -->
      <main id="main-content" class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; min-height: 100dvh; width: 100%; overflow-x: hidden; }

    .sidebar {
      width: var(--sidebar-width); height: 100vh; height: 100dvh; position: fixed; top: 0; left: 0;
      background: var(--bg-sidebar); border-right: 1px solid var(--border-color);
      display: flex; flex-direction: column; z-index: var(--z-sidebar);
      transition: width var(--transition-base), transform var(--transition-base);
      overflow: hidden;
    }
    .sidebar.collapsed { width: var(--sidebar-collapsed-width); }

    .sidebar-header {
      height: var(--header-height); display: flex; align-items: center; padding: 0 var(--space-4);
      border-bottom: 1px solid var(--border-color); flex-shrink: 0;
    }
    .logo-area { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; }
    .logo-text { font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); white-space: nowrap; }

    .sidebar-nav { flex: 1; overflow-y: auto; padding: var(--space-3); display: flex; flex-direction: column; gap: 2px; -webkit-overflow-scrolling: touch; }

    .nav-item {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      color: var(--text-secondary); font-size: var(--text-sm); font-weight: 500;
      transition: all var(--transition-fast); text-decoration: none; border: none;
      background: none; cursor: pointer; width: 100%; white-space: nowrap;
      min-height: 40px;
    }
    .nav-item:hover { background: var(--bg-surface-hover); color: var(--text-primary); }
    .nav-item.active { background: rgba(59,130,246,0.1); color: var(--color-primary); font-weight: 600; }

    .nav-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .sidebar-footer { padding: var(--space-3); border-top: 1px solid var(--border-color); flex-shrink: 0; }

    .main-wrapper {
      flex: 1; margin-left: var(--sidebar-width); transition: margin-left var(--transition-base);
      display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;
      width: calc(100% - var(--sidebar-width)); max-width: 100%;
    }
    .main-wrapper.sidebar-collapsed { margin-left: var(--sidebar-collapsed-width); width: calc(100% - var(--sidebar-collapsed-width)); }

    .header {
      height: var(--header-height); display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6); background: var(--bg-surface);
      border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: var(--z-header);
      flex-shrink: 0; gap: var(--space-2);
    }
    .header-left { display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 0; }
    .header-right { display: flex; align-items: center; gap: var(--space-1); flex-shrink: 0; }

    .search-trigger {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4); background: var(--bg-muted);
      border: 1px solid var(--border-color); border-radius: var(--radius-md);
      cursor: pointer; transition: all var(--transition-fast); min-width: 200px; max-width: 320px;
    }
    .search-trigger:hover { border-color: var(--color-primary); }
    .search-placeholder { color: var(--text-muted); font-size: var(--text-sm); flex: 1; }
    .search-icon { font-size: 14px; }
    kbd {
      font-size: var(--text-xs); background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: 4px; padding: 1px 6px; color: var(--text-muted); font-family: var(--font-sans);
    }

    .dropdown { position: relative; }
    .dropdown-menu {
      position: absolute; top: 100%; right: 0; margin-top: var(--space-2);
      background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
      min-width: 160px; padding: var(--space-1); z-index: 20;
      animation: scaleIn 0.15s ease-out;
    }
    .dropdown-item {
      display: flex; align-items: center; gap: var(--space-2); width: 100%;
      padding: var(--space-2) var(--space-3); border: none; background: none;
      border-radius: var(--radius-sm); color: var(--text-primary); font-size: var(--text-sm);
      cursor: pointer; transition: background var(--transition-fast);
    }
    .dropdown-item:hover { background: var(--bg-surface-hover); }
    .dropdown-item.active { color: var(--color-primary); font-weight: 600; }
    .preset-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }

    .user-avatar {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-1); border-radius: var(--radius-md);
      cursor: pointer; border: none; background: none; transition: background var(--transition-fast);
    }
    .user-avatar:hover { background: var(--bg-surface-hover); }
    .avatar {
      width: 36px; height: 36px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: var(--text-sm); flex-shrink: 0;
    }
    .user-info { text-align: left; }
    .user-name { display: block; font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); white-space: nowrap; }
    .user-role { display: block; font-size: var(--text-xs); color: var(--text-muted); text-transform: capitalize; }

    .notif-dot {
      width: 8px; height: 8px; background: var(--color-danger); border-radius: 50%;
      position: absolute; top: 8px; right: 8px;
    }

    .mobile-menu-btn { display: none; }
    .mobile-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: calc(var(--z-sidebar) - 1);
      display: none; backdrop-filter: blur(2px);
    }

    .main-content {
      flex: 1;
      padding: var(--space-6);
      max-width: 1600px;
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-y: auto;
    }

    /* ─── Tablet ─── */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
        width: var(--sidebar-width);
        box-shadow: none;
      }
      .sidebar.mobile-open {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(0,0,0,0.15);
      }
      .main-wrapper {
        margin-left: 0 !important;
        width: 100% !important;
      }
      .mobile-menu-btn { display: flex; }
      .desktop-collapse { display: none; }
      .mobile-overlay { display: block; }
      .search-trigger { min-width: auto; flex: 1; max-width: 240px; }
      .search-placeholder { display: none; }
      kbd { display: none; }
      .user-info { display: none; }
      .header {
        padding: 0 var(--space-4);
      }
      .main-content {
        padding: var(--space-4);
      }
    }

    /* ─── Mobile ─── */
    @media (max-width: 640px) {
      .header {
        padding: 0 var(--space-3);
        height: 56px;
      }
      .header-right {
        gap: 0;
      }
      .header-right .btn {
        width: 36px;
        height: 36px;
        padding: 0;
      }
      .search-trigger {
        min-width: 40px;
        max-width: 40px;
        padding: var(--space-2);
        border-radius: var(--radius-md);
        justify-content: center;
      }
      .search-trigger .search-placeholder,
      .search-trigger kbd {
        display: none;
      }
      .main-content {
        padding: var(--space-3);
      }
      .sidebar.mobile-open {
        width: min(280px, 85vw);
      }
      .nav-item {
        min-height: 44px;
        padding: var(--space-3);
      }
    }
  `]
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  commandPalette = inject(CommandPaletteService);
  private translate = inject(TranslateService);

  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);
  userMenuOpen = signal(false);
  langOpen = signal(false);
  themeOpen = signal(false);
  currentLang = signal(localStorage.getItem('lang') || 'en');

  // Dynamically filter menu based on user permissions
  filteredMenu = computed(() => {
    const permissions = this.auth.userPermissions();
    const role = this.auth.userRole();
    
    console.log('MENU: Filtering by permissions, role=' + role + ', permissions=' + permissions.length);
    
    const filtered = MENU_ITEMS.filter(item => this.auth.canViewMenuItem(item.permission));
    
    console.log('MENU: Showing ' + filtered.length + ' items: ' + filtered.map(f => f.label).join(', '));
    return filtered;
  });

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  switchLang(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.currentLang.set(lang);
    this.langOpen.set(false);
  }

  getIcon(iconName: string): string {
    const icons: Record<string, string> = {
      'grid': '📊', 'building': '🏫', 'users-cog': '👥', 'calendar-range': '📅',
      'layout-grid': '🏛️', 'book-open': '📖', 'graduation-cap': '🎓', 'briefcase': '💼',
      'heart-handshake': '🤝', 'clipboard-check': '✅', 'file-text': '📝', 'bar-chart-2': '📈',
      'credit-card': '💳', 'bus': '🚌', 'clock': '🕐', 'trending-up': '📈',
      'shuffle': '🔀', 'bell': '🔔', 'pie-chart': '🥧', 'package': '📦', 'settings': '⚙️',
      'user-check': '✓👤', 'shield': '🛡️', 'calendar': '📆', 'user-plus': '➕👤',
    };
    return icons[iconName] || '📄';
  }
}
