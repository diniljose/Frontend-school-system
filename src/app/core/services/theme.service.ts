import { Injectable, signal, effect } from '@angular/core';
import { THEME_PRESETS } from '../constants';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePreset {
  name: string;
  key: string;
  primary: string;
  accent: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.loadMode());
  readonly preset = signal<ThemePreset>(this.loadPreset());
  readonly isDark = signal<boolean>(false);
  readonly presets = THEME_PRESETS;
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.applyTheme();
    this.mediaQuery.addEventListener('change', () => {
      if (this.mode() === 'system') this.applyTheme();
    });
    effect(() => {
      const _ = this.mode();
      const __ = this.preset();
      this.applyTheme();
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem('themeMode', mode);
  }

  setPreset(preset: ThemePreset): void {
    this.preset.set(preset);
    localStorage.setItem('themePreset', preset.key);
  }

  toggleDark(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  private applyTheme(): void {
    const m = this.mode();
    const dark = m === 'dark' || (m === 'system' && this.mediaQuery.matches);
    this.isDark.set(dark);
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', this.preset().key);

    // Apply CSS variables for the preset
    const p = this.preset();
    root.style.setProperty('--color-primary', p.primary);
    root.style.setProperty('--color-accent', p.accent);
    // Generate HSL variants
    root.style.setProperty('--primary', p.primary);
    root.style.setProperty('--accent', p.accent);
  }

  private loadMode(): ThemeMode {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'dark';
  }

  private loadPreset(): ThemePreset {
    const key = localStorage.getItem('themePreset') || 'ocean';
    return THEME_PRESETS.find(p => p.key === key) || THEME_PRESETS[0];
  }
}
