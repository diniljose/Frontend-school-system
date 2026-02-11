import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MENU_ITEMS, MenuItem } from '../constants';
import { AuthService } from './auth.service';

export interface CommandItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  action: () => void;
  keywords?: string[];
}

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private router = inject(Router);
  private auth = inject(AuthService);

  readonly isOpen = signal(false);

  open(): void { this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }
  toggle(): void { this.isOpen.update(v => !v); }

  getCommands(): CommandItem[] {
    const commands: CommandItem[] = [];
    const role = this.auth.userRole();

    // Navigation commands from menu
    MENU_ITEMS.forEach(item => {
      if (!role || !item.roles.includes(role)) return;
      commands.push({
        id: `nav-${item.route}`,
        label: `Go to ${item.label}`,
        icon: item.icon,
        category: 'Navigation',
        action: () => { this.router.navigate([item.route]); this.close(); },
        keywords: [item.label.toLowerCase(), 'go', 'navigate'],
      });
    });

    // Quick actions
    commands.push(
      { id: 'action-logout', label: 'Sign Out', icon: 'log-out', category: 'Account', action: () => { this.auth.logout(); this.close(); }, keywords: ['logout', 'sign out', 'exit'] },
      { id: 'action-theme', label: 'Toggle Dark Mode', icon: 'moon', category: 'Preferences', action: () => { this.close(); }, keywords: ['dark', 'light', 'theme', 'mode'] },
      { id: 'action-profile', label: 'My Profile', icon: 'user', category: 'Account', action: () => { this.router.navigate(['/settings/profile']); this.close(); }, keywords: ['profile', 'account'] },
    );

    return commands;
  }

  search(query: string): CommandItem[] {
    if (!query.trim()) return this.getCommands();
    const q = query.toLowerCase();
    return this.getCommands().filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.includes(q))
    );
  }
}
