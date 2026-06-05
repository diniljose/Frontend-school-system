import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';
import { CommandPaletteService } from './core/services/command-palette.service';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { CommandPaletteComponent } from './shared/components/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, CommandPaletteComponent],
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <router-outlet />
    <app-toast-container />
    <app-command-palette />
  `,
})
export class AppComponent {
  private translate = inject(TranslateService);
  private theme = inject(ThemeService);
  private commandPalette = inject(CommandPaletteService);

  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.use(localStorage.getItem('lang') || 'en');
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.commandPalette.toggle();
    }
  }
}
