import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { NAV_GROUPS, NavGroup, MenuItem, THEME_PRESETS } from '../../core/constants';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  template: `
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ENTERPRISE SIDEBAR NAVIGATION -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <aside class="sidebar" [class.collapsed]="sidebarCollapsed()" [class.mobile-open]="mobileOpen()">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="logo-area" (click)="toggleSidebar()">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--color-primary)"/>
                  <stop offset="100%" style="stop-color:var(--color-accent)"/>
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="12" fill="url(#logoGrad)"/>
              <path d="M12 28V16l8-5 8 5v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 28v-6h6v6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          @if (!sidebarCollapsed()) {
            <div class="logo-text-area">
              <span class="logo-text">EduCore</span>
              <span class="logo-subtitle">Enterprise</span>
            </div>
          }
        </div>
        @if (!sidebarCollapsed()) {
          <button class="collapse-toggle" (click)="toggleSidebar()" title="Collapse sidebar">
            <span class="collapse-icon">◀</span>
          </button>
        }
      </div>

      <!-- Quick Search (Desktop) -->
      @if (!sidebarCollapsed()) {
        <div class="sidebar-search" (click)="commandPalette.open()">
          <span class="search-icon">🔍</span>
          <span class="search-text">Quick search...</span>
          <kbd>⌘K</kbd>
        </div>
      }

      <!-- Navigation Groups -->
      <nav class="sidebar-nav">
        @for (group of filteredGroups(); track group.id) {
          <div class="nav-group" [class.expanded]="isGroupExpanded(group.id)" [class.has-active]="hasActiveItem(group)">
            <!-- Group Header -->
            <button class="group-header" 
                    (click)="toggleGroup(group.id)"
                    [style.--group-accent]="group.accent"
                    [title]="sidebarCollapsed() ? group.label : ''">
              <span class="group-icon">{{ group.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="group-label">{{ group.label }}</span>
                <span class="group-count">{{ getVisibleItemCount(group) }}</span>
                <span class="group-chevron">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 5L6 7L8 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              }
            </button>
            
            <!-- Group Items (Collapsible) -->
            @if (!sidebarCollapsed() && isGroupExpanded(group.id)) {
              <div class="group-items" [style.--group-accent]="group.accent">
                @for (item of getVisibleItems(group); track item.route) {
                  <a class="nav-item" 
                     [routerLink]="item.route" 
                     routerLinkActive="active"
                     [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
                     (click)="onNavItemClick()"
                     [style.--item-accent]="item.accent || group.accent">
                    <span class="item-indicator"></span>
                    <span class="item-icon">{{ getIcon(item.icon) }}</span>
                    <span class="item-label">{{ item.translationKey | translate }}</span>
                    @if (item.badge) {
                      <span class="item-badge">{{ item.badge }}</span>
                    }
                  </a>
                }
              </div>
            }
            
            <!-- Collapsed Mode: Show items on hover -->
            @if (sidebarCollapsed()) {
              <div class="collapsed-tooltip">
                <div class="tooltip-header" [style.background]="group.gradient">
                  <span class="tooltip-icon">{{ group.icon }}</span>
                  <span class="tooltip-title">{{ group.label }}</span>
                </div>
                <div class="tooltip-items">
                  @for (item of getVisibleItems(group); track item.route) {
                    <a class="tooltip-item" 
                       [routerLink]="item.route"
                       routerLinkActive="active"
                       (click)="onNavItemClick()">
                      <span class="tooltip-item-icon">{{ getIcon(item.icon) }}</span>
                      <span>{{ item.translationKey | translate }}</span>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        }
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        @if (!sidebarCollapsed()) {
          <div class="user-card">
            <div class="user-avatar">{{ auth.userName().charAt(0) }}</div>
            <div class="user-info">
              <span class="user-name">{{ auth.userName() }}</span>
              <span class="user-role">{{ auth.userRole() | titlecase }}</span>
            </div>
            <button class="user-menu-btn" (click)="userMenuOpen.set(!userMenuOpen())">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>
        }
        
        <button class="logout-btn" (click)="auth.logout()" [title]="sidebarCollapsed() ? 'Sign Out' : ''">
          <span class="logout-icon">🚪</span>
          @if (!sidebarCollapsed()) {
            <span class="logout-text">Sign Out</span>
          }
        </button>
      </div>
      
      <!-- User Menu Dropdown -->
      @if (userMenuOpen() && !sidebarCollapsed()) {
        <div class="user-dropdown">
          <a class="dropdown-item" routerLink="/settings" (click)="userMenuOpen.set(false)">
            <span>⚙️</span> Settings
          </a>
          <a class="dropdown-item" routerLink="/notifications" (click)="userMenuOpen.set(false)">
            <span>🔔</span> Notifications
          </a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item logout" (click)="auth.logout()">
            <span>🚪</span> Sign Out
          </button>
        </div>
      }
    </aside>

    <!-- Mobile Overlay -->
    @if (mobileOpen()) {
      <div class="mobile-overlay" (click)="mobileOpen.set(false)"></div>
    }

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- MAIN CONTENT AREA -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="main-wrapper" [class.sidebar-collapsed]="sidebarCollapsed()">
      
      <!-- Top Header Bar -->
      <header class="header">
        <div class="header-left">
          <!-- Mobile Menu Toggle -->
          <button class="mobile-menu-btn" (click)="mobileOpen.set(true)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          
          <!-- Expand Sidebar (Desktop) -->
          @if (sidebarCollapsed()) {
            <button class="expand-sidebar-btn" (click)="toggleSidebar()">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          }
          
          <!-- Breadcrumb / Context -->
          <div class="header-context">
            @if (currentModule()) {
              <span class="context-icon" [style.background]="currentModule()!.gradient">
                {{ currentModule()!.icon }}
              </span>
              <span class="context-label">{{ currentModule()!.label }}</span>
              <span class="context-separator">/</span>
            }
            <span class="context-page">{{ currentPageLabel() }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <!-- Global Search -->
          <button class="search-btn" (click)="commandPalette.open()">
            <span>🔍</span>
            <span class="search-btn-text">Search</span>
            <kbd>⌘K</kbd>
          </button>
          
          <!-- Language -->
          <div class="header-dropdown" [class.open]="langOpen()">
            <button class="header-icon-btn" (click)="langOpen.set(!langOpen())">
              🌐
            </button>
            @if (langOpen()) {
              <div class="header-dropdown-menu">
                @for (lang of ['en','es','fr']; track lang) {
                  <button class="header-dropdown-item" 
                          [class.active]="currentLang() === lang"
                          (click)="switchLang(lang)">
                    {{ getLanguageName(lang) }}
                  </button>
                }
              </div>
            }
          </div>
          
          <!-- Theme Toggle -->
          <button class="header-icon-btn theme-btn" (click)="theme.toggleDark()">
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>
          
          <!-- Theme Presets -->
          <div class="header-dropdown" [class.open]="themeOpen()">
            <button class="header-icon-btn" (click)="themeOpen.set(!themeOpen())">
              🎨
            </button>
            @if (themeOpen()) {
              <div class="header-dropdown-menu">
                @for (p of theme.presets; track p.key) {
                  <button class="header-dropdown-item preset-item" 
                          (click)="theme.setPreset(p); themeOpen.set(false)">
                    <span class="preset-dot" [style.background]="p.primary"></span>
                    {{ p.name }}
                  </button>
                }
              </div>
            }
          </div>
          
          <!-- Notifications -->
          <button class="header-icon-btn notif-btn" routerLink="/notifications">
            🔔
            <span class="notif-badge">3</span>
          </button>
          
          <!-- User Avatar -->
          <button class="user-avatar-btn" (click)="headerUserOpen.set(!headerUserOpen())">
            <div class="avatar">{{ auth.userName().charAt(0) }}</div>
          </button>
          
          @if (headerUserOpen()) {
            <div class="header-user-menu">
              <div class="user-menu-header">
                <div class="avatar lg">{{ auth.userName().charAt(0) }}</div>
                <div class="user-menu-info">
                  <span class="user-menu-name">{{ auth.userName() }}</span>
                  <span class="user-menu-role">{{ auth.userRole() | titlecase }}</span>
                </div>
              </div>
              <div class="user-menu-divider"></div>
              <a class="user-menu-item" routerLink="/settings" (click)="headerUserOpen.set(false)">
                <span>⚙️</span> Settings
              </a>
              <button class="user-menu-item logout" (click)="auth.logout()">
                <span>🚪</span> Sign Out
              </button>
            </div>
          }
        </div>
      </header>

      <!-- Page Content -->
      <main class="main-content" id="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════════ */
    /* ENTERPRISE LAYOUT SYSTEM */
    /* ═══════════════════════════════════════════════════════════════ */
    :host {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      overflow-x: hidden;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* SIDEBAR */
    /* ═══════════════════════════════════════════════════════════════ */
    .sidebar {
      width: var(--sidebar-width, 280px);
      height: 100vh;
      height: 100dvh;
      position: fixed;
      top: 0;
      left: 0;
      background: var(--bg-sidebar, var(--bg-surface));
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: var(--z-sidebar);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                  transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    
    .sidebar.collapsed {
      width: var(--sidebar-collapsed-width, 72px);
    }

    /* ─── Sidebar Header ─── */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4);
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      min-height: 72px;
    }
    
    .logo-area {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
    }
    
    .logo-icon {
      flex-shrink: 0;
      transition: transform 0.3s ease;
    }
    
    .logo-area:hover .logo-icon {
      transform: scale(1.05);
    }
    
    .logo-text-area {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    
    .logo-text {
      font-size: var(--text-lg);
      font-weight: 700;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .logo-subtitle {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    
    .collapse-toggle {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
    }
    
    .collapse-toggle:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }

    /* ─── Sidebar Search ─── */
    .sidebar-search {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: var(--space-3) var(--space-3) var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--bg-muted);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .sidebar-search:hover {
      border-color: var(--color-primary);
      background: var(--bg-surface);
    }
    
    .sidebar-search .search-icon {
      font-size: 14px;
      opacity: 0.6;
    }
    
    .sidebar-search .search-text {
      flex: 1;
      font-size: var(--text-sm);
      color: var(--text-muted);
    }
    
    .sidebar-search kbd {
      font-size: 10px;
      padding: 2px 6px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    /* ─── Navigation Groups ─── */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--space-2) 0;
      -webkit-overflow-scrolling: touch;
    }
    
    .nav-group {
      margin-bottom: var(--space-1);
      position: relative;
    }
    
    .group-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      margin: 0 var(--space-2);
      width: calc(100% - var(--space-4));
      background: none;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }
    
    .group-header:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }
    
    .nav-group.expanded .group-header {
      color: var(--text-primary);
    }
    
    .nav-group.has-active .group-header {
      color: var(--group-accent, var(--color-primary));
    }
    
    .group-icon {
      font-size: 16px;
      flex-shrink: 0;
      width: 24px;
      text-align: center;
    }
    
    .group-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .group-count {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      background: var(--bg-muted);
      border-radius: var(--radius-full);
      color: var(--text-muted);
    }
    
    .nav-group.has-active .group-count {
      background: color-mix(in srgb, var(--group-accent) 15%, transparent);
      color: var(--group-accent);
    }
    
    .group-chevron {
      transition: transform 0.2s ease;
      opacity: 0.5;
    }
    
    .nav-group.expanded .group-chevron {
      transform: rotate(180deg);
      opacity: 1;
    }

    /* ─── Group Items ─── */
    .group-items {
      padding: var(--space-1) 0;
      animation: slideDown 0.2s ease;
    }
    
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      margin: 2px var(--space-3) 2px var(--space-6);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
      position: relative;
    }
    
    .nav-item:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
      transform: translateX(2px);
    }
    
    .nav-item.active {
      background: color-mix(in srgb, var(--item-accent, var(--color-primary)) 12%, transparent);
      color: var(--item-accent, var(--color-primary));
      font-weight: 600;
    }
    
    .item-indicator {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: var(--item-accent, var(--color-primary));
      border-radius: 0 var(--radius-full) var(--radius-full) 0;
      transition: height 0.2s ease;
    }
    
    .nav-item.active .item-indicator {
      height: 60%;
    }
    
    .item-icon {
      font-size: 14px;
      width: 20px;
      text-align: center;
      opacity: 0.8;
    }
    
    .nav-item.active .item-icon {
      opacity: 1;
    }
    
    .item-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .item-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      background: var(--color-danger);
      color: white;
      border-radius: var(--radius-full);
    }

    /* ─── Collapsed Mode Tooltip ─── */
    .collapsed-tooltip {
      position: absolute;
      left: 100%;
      top: 0;
      margin-left: var(--space-2);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      min-width: 200px;
      opacity: 0;
      visibility: hidden;
      transform: translateX(-8px);
      transition: all 0.2s ease;
      z-index: 100;
      overflow: hidden;
    }
    
    .sidebar.collapsed .nav-group:hover .collapsed-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(0);
    }
    
    .tooltip-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      color: white;
      font-weight: 600;
      font-size: var(--text-sm);
    }
    
    .tooltip-icon {
      font-size: 16px;
    }
    
    .tooltip-items {
      padding: var(--space-2);
    }
    
    .tooltip-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    
    .tooltip-item:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }
    
    .tooltip-item.active {
      background: rgba(59, 130, 246, 0.1);
      color: var(--color-primary);
      font-weight: 500;
    }
    
    .tooltip-item-icon {
      font-size: 12px;
      width: 18px;
      text-align: center;
    }

    /* ─── Sidebar Footer ─── */
    .sidebar-footer {
      padding: var(--space-3);
      border-top: 1px solid var(--border-color);
      flex-shrink: 0;
    }
    
    .user-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2);
      margin-bottom: var(--space-2);
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
    }
    
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: var(--text-sm);
      flex-shrink: 0;
    }
    
    .user-info {
      flex: 1;
      min-width: 0;
    }
    
    .user-name {
      display: block;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-role {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
    }
    
    .user-menu-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .user-menu-btn:hover {
      background: var(--bg-surface);
      color: var(--text-primary);
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2);
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
    
    .logout-icon {
      font-size: 16px;
    }

    /* ─── User Dropdown ─── */
    .user-dropdown {
      position: absolute;
      bottom: calc(100% + var(--space-2));
      left: var(--space-3);
      right: var(--space-3);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      padding: var(--space-2);
      animation: slideUp 0.2s ease;
      z-index: 50;
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: var(--text-sm);
      text-decoration: none;
      transition: all 0.15s ease;
      border: none;
      background: none;
      width: 100%;
      cursor: pointer;
    }
    
    .dropdown-item:hover {
      background: var(--bg-surface-hover);
    }
    
    .dropdown-item.logout:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-danger);
    }
    
    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: var(--space-2) 0;
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* MOBILE OVERLAY */
    /* ═══════════════════════════════════════════════════════════════ */
    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: calc(var(--z-sidebar) - 1);
      animation: fadeIn 0.2s ease;
      display: none;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* MAIN WRAPPER */
    /* ═══════════════════════════════════════════════════════════════ */
    .main-wrapper {
      flex: 1;
      margin-left: var(--sidebar-width, 280px);
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      width: calc(100% - var(--sidebar-width, 280px));
      max-width: 100%;
    }
    
    .main-wrapper.sidebar-collapsed {
      margin-left: var(--sidebar-collapsed-width, 72px);
      width: calc(100% - var(--sidebar-collapsed-width, 72px));
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* HEADER */
    /* ═══════════════════════════════════════════════════════════════ */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-height, 64px);
      padding: 0 var(--space-6);
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      flex-shrink: 0;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    
    .mobile-menu-btn {
      display: none;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-primary);
      cursor: pointer;
    }
    
    .expand-sidebar-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .expand-sidebar-btn:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }
    
    .header-context {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }
    
    .context-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      font-size: 14px;
      color: white;
    }
    
    .context-label {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .context-separator {
      color: var(--text-muted);
    }
    
    .context-page {
      color: var(--text-secondary);
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    
    .search-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--bg-muted);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .search-btn:hover {
      border-color: var(--color-primary);
    }
    
    .search-btn kbd {
      font-size: 10px;
      padding: 2px 6px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-family: var(--font-mono);
    }
    
    .header-icon-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: var(--radius-md);
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .header-icon-btn:hover {
      background: var(--bg-surface-hover);
    }
    
    .theme-btn {
      transition: transform 0.3s ease;
    }
    
    .theme-btn:hover {
      transform: rotate(180deg);
    }
    
    .notif-btn {
      position: relative;
    }
    
    .notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-danger);
      color: white;
      font-size: 10px;
      font-weight: 600;
      border-radius: 50%;
      border: 2px solid var(--bg-surface);
    }
    
    .user-avatar-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
    }
    
    .user-avatar-btn .avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: var(--text-sm);
      transition: transform 0.2s ease;
    }
    
    .user-avatar-btn:hover .avatar {
      transform: scale(1.05);
    }

    /* ─── Header Dropdowns ─── */
    .header-dropdown {
      position: relative;
    }
    
    .header-dropdown-menu {
      position: absolute;
      top: calc(100% + var(--space-2));
      right: 0;
      min-width: 150px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      padding: var(--space-2);
      animation: dropdownIn 0.2s ease;
      z-index: 50;
    }
    
    @keyframes dropdownIn {
      from { opacity: 0; transform: scale(0.95) translateY(-4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    
    .header-dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      background: none;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .header-dropdown-item:hover {
      background: var(--bg-surface-hover);
    }
    
    .header-dropdown-item.active {
      color: var(--color-primary);
      font-weight: 500;
    }
    
    .preset-item {
      gap: var(--space-2);
    }
    
    .preset-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ─── User Menu (Header) ─── */
    .header-user-menu {
      position: absolute;
      top: calc(100% + var(--space-2));
      right: var(--space-4);
      width: 240px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
      animation: dropdownIn 0.2s ease;
      z-index: 50;
      overflow: hidden;
    }
    
    .user-menu-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--bg-muted);
    }
    
    .user-menu-header .avatar.lg {
      width: 44px;
      height: 44px;
      font-size: var(--text-base);
    }
    
    .user-menu-info {
      flex: 1;
    }
    
    .user-menu-name {
      display: block;
      font-size: var(--text-sm);
      font-weight: 600;
    }
    
    .user-menu-role {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
    }
    
    .user-menu-divider {
      height: 1px;
      background: var(--border-color);
    }
    
    .user-menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      color: var(--text-primary);
      font-size: var(--text-sm);
      text-decoration: none;
      transition: background 0.15s ease;
      border: none;
      background: none;
      width: 100%;
      cursor: pointer;
    }
    
    .user-menu-item:hover {
      background: var(--bg-surface-hover);
    }
    
    .user-menu-item.logout:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-danger);
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* MAIN CONTENT */
    /* ═══════════════════════════════════════════════════════════════ */
    .main-content {
      flex: 1;
      padding: var(--space-6);
      max-width: 1600px;
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
      animation: fadeInContent 0.3s ease;
    }
    
    @keyframes fadeInContent {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* RESPONSIVE */
    /* ═══════════════════════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
        width: 300px;
      }
      
      .sidebar.mobile-open {
        transform: translateX(0);
        box-shadow: 8px 0 32px rgba(0,0,0,0.15);
      }
      
      .mobile-overlay {
        display: block;
      }
      
      .main-wrapper {
        margin-left: 0 !important;
        width: 100% !important;
      }
      
      .mobile-menu-btn {
        display: flex;
      }
      
      .expand-sidebar-btn,
      .collapse-toggle {
        display: none;
      }
      
      .search-btn-text {
        display: none;
      }
      
      .search-btn kbd {
        display: none;
      }
      
      .header {
        padding: 0 var(--space-4);
      }
      
      .header-context {
        display: none;
      }
      
      .main-content {
        padding: var(--space-4);
      }
    }

    @media (max-width: 640px) {
      .header {
        padding: 0 var(--space-3);
        height: 56px;
      }
      
      .header-icon-btn {
        width: 40px;
        height: 40px;
      }
      
      .search-btn {
        width: 40px;
        padding: var(--space-2);
        justify-content: center;
      }
      
      .search-btn span:not(:first-child),
      .search-btn kbd {
        display: none;
      }
      
      .header-user-menu {
        position: fixed;
        top: 56px;
        right: var(--space-3);
        width: calc(100% - var(--space-6));
        max-width: 300px;
      }
      
      .main-content {
        padding: var(--space-3);
      }
      
      .sidebar.mobile-open {
        width: min(300px, 85vw);
      }
    }
  `]
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  commandPalette = inject(CommandPaletteService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // UI State
  sidebarCollapsed = signal(false);
  mobileOpen = signal(false);
  userMenuOpen = signal(false);
  headerUserOpen = signal(false);
  langOpen = signal(false);
  themeOpen = signal(false);
  currentLang = signal(localStorage.getItem('lang') || 'en');
  
  // Group expansion state - stored in localStorage
  expandedGroups = signal<Set<string>>(this.loadExpandedGroups());

  // Filter groups based on user permissions
  filteredGroups = computed(() => {
    const role = this.auth.userRole();
    const permissions = this.auth.userPermissions();
    
    return NAV_GROUPS.filter(group => {
      // Check group-level permission (admin means platform_admin)
      if (group.permission === 'admin' && role !== 'platform_admin') {
        return false;
      }
      
      // Check if any item in group is visible
      const visibleItems = group.items.filter(item => this.auth.canViewMenuItem(item.permission));
      return visibleItems.length > 0;
    });
  });

  // Current module based on route
  currentModule = computed(() => {
    const url = this.router.url;
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (url.startsWith(item.route)) {
          return group;
        }
      }
    }
    return null;
  });

  // Current page label
  currentPageLabel = computed(() => {
    const url = this.router.url;
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (url.startsWith(item.route)) {
          return item.label;
        }
      }
    }
    return 'Dashboard';
  });

  constructor() {
    // Close dropdowns on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.langOpen.set(false);
      this.themeOpen.set(false);
      this.userMenuOpen.set(false);
      this.headerUserOpen.set(false);
      
      // Auto-expand group containing active route
      this.expandActiveGroup();
    });

    // Click outside to close dropdowns
    effect(() => {
      if (this.langOpen() || this.themeOpen() || this.headerUserOpen()) {
        const handler = () => {
          this.langOpen.set(false);
          this.themeOpen.set(false);
          this.headerUserOpen.set(false);
        };
        setTimeout(() => document.addEventListener('click', handler, { once: true }), 0);
      }
    });
  }

  // Load expanded groups from localStorage
  private loadExpandedGroups(): Set<string> {
    const saved = localStorage.getItem('expandedNavGroups');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set(['overview']); // Default
      }
    }
    return new Set(['overview']); // Default
  }

  // Save expanded groups to localStorage
  private saveExpandedGroups(): void {
    localStorage.setItem('expandedNavGroups', JSON.stringify([...this.expandedGroups()]));
  }

  // Toggle group expansion
  toggleGroup(groupId: string): void {
    const expanded = new Set(this.expandedGroups());
    if (expanded.has(groupId)) {
      expanded.delete(groupId);
    } else {
      expanded.add(groupId);
    }
    this.expandedGroups.set(expanded);
    this.saveExpandedGroups();
  }

  // Check if group is expanded
  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups().has(groupId);
  }

  // Auto-expand group containing active route
  private expandActiveGroup(): void {
    const url = this.router.url;
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (url.startsWith(item.route)) {
          if (!this.expandedGroups().has(group.id)) {
            const expanded = new Set(this.expandedGroups());
            expanded.add(group.id);
            this.expandedGroups.set(expanded);
            this.saveExpandedGroups();
          }
          return;
        }
      }
    }
  }

  // Check if group has active item
  hasActiveItem(group: NavGroup): boolean {
    const url = this.router.url;
    return group.items.some(item => url.startsWith(item.route));
  }

  // Get visible items for a group
  getVisibleItems(group: NavGroup): MenuItem[] {
    return group.items.filter(item => this.auth.canViewMenuItem(item.permission));
  }

  // Get visible item count
  getVisibleItemCount(group: NavGroup): number {
    return this.getVisibleItems(group).length;
  }

  // Toggle sidebar
  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  // Nav item click handler
  onNavItemClick(): void {
    this.mobileOpen.set(false);
  }

  // Switch language
  switchLang(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.currentLang.set(lang);
    this.langOpen.set(false);
  }

  // Get language name
  getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français'
    };
    return names[code] || code.toUpperCase();
  }

  // Icon mapping
  getIcon(iconName: string): string {
    const icons: Record<string, string> = {
      'grid': '📊', 'building': '🏫', 'users-cog': '👥', 'calendar-range': '📅',
      'layout-grid': '🏛️', 'book-open': '📖', 'graduation-cap': '🎓', 'briefcase': '💼',
      'heart-handshake': '🤝', 'clipboard-check': '✅', 'file-text': '📝', 'bar-chart-2': '📈',
      'credit-card': '💳', 'bus': '🚌', 'clock': '🕐', 'trending-up': '📈',
      'shuffle': '🔀', 'bell': '🔔', 'pie-chart': '🥧', 'package': '📦', 'settings': '⚙️',
      'user-check': '✓👤', 'shield': '🛡️', 'calendar': '📆', 'user-plus': '➕👤',
      'history': '📜',
    };
    return icons[iconName] || '📄';
  }
}
