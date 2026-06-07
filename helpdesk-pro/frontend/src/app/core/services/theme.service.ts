import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'hd_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const dark = stored === 'dark';
    this.isDark.set(dark);
    this.applyTheme(dark);
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    this.applyTheme(next);
  }

  private applyTheme(dark: boolean) {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
