import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { THEME_PRESETS } from '../../core/constants';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>⚙️ {{ 'nav.settings' | translate }}</h1><p>Manage your account and preferences</p></div>
    </div>

    <div class="settings-layout">
      <div class="settings-nav">
        @for (tab of tabs; track tab.key) {
          <button class="settings-nav-item" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
            {{ tab.icon }} {{ tab.label }}
          </button>
        }
      </div>

      <div class="settings-content">
        @switch (activeTab()) {
          @case ('profile') {
            <div class="card animate-in">
              <h3>👤 Profile Settings</h3>
              <div class="profile-section">
                <div class="avatar-edit">
                  <div class="avatar-lg">{{ auth.userName().charAt(0) }}</div>
                  <button class="btn btn-secondary btn-sm">Change Avatar</button>
                </div>
                <div class="grid grid-2">
                  <div class="form-group"><label>First Name</label><input type="text" class="form-input" [(ngModel)]="profile.firstName" /></div>
                  <div class="form-group"><label>Last Name</label><input type="text" class="form-input" [(ngModel)]="profile.lastName" /></div>
                </div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" [(ngModel)]="profile.email" /></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" [(ngModel)]="profile.phone" /></div>
                <button class="btn btn-primary" (click)="saveProfile()">Save Changes</button>
              </div>
            </div>
          }
          @case ('security') {
            <div class="card animate-in">
              <h3>🔒 Security</h3>
              <form (ngSubmit)="changePassword()">
                <div class="form-group"><label>Current Password</label><input type="password" class="form-input" [(ngModel)]="passwords.current" name="current" required /></div>
                <div class="form-group"><label>New Password</label><input type="password" class="form-input" [(ngModel)]="passwords.newPassword" name="new" required minlength="8" /></div>
                <div class="form-group"><label>Confirm New Password</label><input type="password" class="form-input" [(ngModel)]="passwords.confirm" name="confirm" required /></div>
                <button type="submit" class="btn btn-primary" [disabled]="passwords.newPassword !== passwords.confirm">Update Password</button>
              </form>
            </div>
          }
          @case ('appearance') {
            <div class="card animate-in">
              <h3>🎨 Appearance</h3>
              <div class="setting-item">
                <div><h4>Theme Mode</h4><p>Choose your preferred appearance</p></div>
                <div class="theme-toggle-group">
                  <button class="theme-btn" [class.active]="themeService.mode() === 'light'" (click)="themeService.setMode('light')">☀️ Light</button>
                  <button class="theme-btn" [class.active]="themeService.mode() === 'dark'" (click)="themeService.setMode('dark')">🌙 Dark</button>
                  <button class="theme-btn" [class.active]="themeService.mode() === 'system'" (click)="themeService.setMode('system')">💻 System</button>
                </div>
              </div>
              <div class="setting-item">
                <div><h4>Color Preset</h4><p>Choose your accent color</p></div>
                <div class="preset-grid">
                  @for (p of presets; track p.key) {
                    <button class="preset-btn" [class.active]="themeService.preset().key === p.key"
                      [style.background]="p.primary" (click)="themeService.setPreset(p)" [title]="p.name">
                    </button>
                  }
                </div>
              </div>
            </div>
          }
          @case ('notifications') {
            <div class="card animate-in">
              <h3>🔔 Notification Preferences</h3>
              <div class="setting-item">
                <div><h4>Email Notifications</h4><p>Receive updates via email</p></div>
                <label class="toggle"><input type="checkbox" [(ngModel)]="notifPrefs.email" /><span class="toggle-slider"></span></label>
              </div>
              <div class="setting-item">
                <div><h4>Push Notifications</h4><p>Browser push notifications</p></div>
                <label class="toggle"><input type="checkbox" [(ngModel)]="notifPrefs.push" /><span class="toggle-slider"></span></label>
              </div>
              <div class="setting-item">
                <div><h4>SMS Notifications</h4><p>Receive text messages</p></div>
                <label class="toggle"><input type="checkbox" [(ngModel)]="notifPrefs.sms" /><span class="toggle-slider"></span></label>
              </div>
              <button class="btn btn-primary" (click)="saveNotifPrefs()">Save Preferences</button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .settings-layout { display: grid; grid-template-columns: 240px 1fr; gap: var(--space-6); }
    @media (max-width: 768px) { .settings-layout { grid-template-columns: 1fr; } }
    .settings-nav { display: flex; flex-direction: column; gap: var(--space-1); }
    .settings-nav-item {
      padding: var(--space-3) var(--space-4); text-align: left; border-radius: var(--radius-md);
      background: none; border: none; cursor: pointer; font-size: var(--text-sm); font-weight: 500;
      color: var(--text-secondary); transition: var(--transition-fast);
    }
    .settings-nav-item:hover { background: var(--surface-hover); color: var(--text-primary); }
    .settings-nav-item.active { background: var(--surface-hover); color: var(--primary); font-weight: 600; }
    .settings-content h3 { margin-bottom: var(--space-6); }
    .profile-section { display: flex; flex-direction: column; gap: var(--space-4); }
    .avatar-edit { display: flex; align-items: center; gap: var(--space-4); }
    .avatar-lg {
      width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: var(--primary); color: white; font-size: var(--text-2xl); font-weight: 700;
    }
    .setting-item {
      display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) 0;
      border-bottom: 1px solid var(--border);
    }
    .setting-item:last-of-type { border-bottom: none; }
    .setting-item h4 { font-size: var(--text-sm); margin-bottom: 2px; }
    .setting-item p { font-size: var(--text-xs); color: var(--text-tertiary); }
    .theme-toggle-group { display: flex; gap: var(--space-1); }
    .theme-btn {
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: var(--text-sm); transition: var(--transition-fast);
    }
    .theme-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .preset-grid { display: flex; gap: var(--space-2); }
    .preset-btn {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer;
      transition: var(--transition-fast);
    }
    .preset-btn.active { border-color: var(--text-primary); box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--primary); }
    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background: var(--border); border-radius: 12px; transition: 0.3s;
    }
    .toggle-slider:before {
      content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px;
      background: white; border-radius: 50%; transition: 0.3s;
    }
    .toggle input:checked + .toggle-slider { background: var(--primary); }
    .toggle input:checked + .toggle-slider:before { transform: translateX(20px); }
  `]
})
export class SettingsComponent {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  activeTab = signal('profile');
  presets = THEME_PRESETS;

  tabs = [
    { key: 'profile', icon: '👤', label: 'Profile' },
    { key: 'security', icon: '🔒', label: 'Security' },
    { key: 'appearance', icon: '🎨', label: 'Appearance' },
    { key: 'notifications', icon: '🔔', label: 'Notifications' },
  ];

  profile: any = {};
  passwords = { current: '', newPassword: '', confirm: '' };
  notifPrefs = { email: true, push: true, sms: false };

  saveProfile(): void {
    this.api.patch('/users/profile', this.profile).subscribe({
      next: () => this.toast.success('Profile updated'),
      error: () => this.toast.error('Failed to update profile'),
    });
  }

  changePassword(): void {
    if (this.passwords.newPassword !== this.passwords.confirm) return;
    this.auth.changePassword(this.passwords.current, this.passwords.newPassword).subscribe({
      next: () => { this.toast.success('Password changed'); this.passwords = { current: '', newPassword: '', confirm: '' }; },
      error: () => this.toast.error('Failed to change password'),
    });
  }

  saveNotifPrefs(): void {
    this.toast.success('Notification preferences saved');
  }
}
