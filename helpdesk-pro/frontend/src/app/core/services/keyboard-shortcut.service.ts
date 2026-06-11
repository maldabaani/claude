import { Injectable, OnDestroy } from '@angular/core';

export interface ShortcutDefinition {
  combo: string;
  description: string;
  group: string;
  callback: () => void;
}

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService implements OnDestroy {
  private shortcuts = new Map<string, ShortcutDefinition>();
  private pendingKey: string | null = null;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  private boundHandler: (event: KeyboardEvent) => void;

  constructor() {
    this.boundHandler = this.handleKeydown.bind(this);
    window.addEventListener('keydown', this.boundHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.boundHandler);
    if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
  }

  register(combo: string, description: string, group: string, callback: () => void): void {
    this.shortcuts.set(combo, { combo, description, group, callback });
  }

  unregister(combo: string): void {
    this.shortcuts.delete(combo);
  }

  getShortcuts(): Array<{ combo: string; description: string; group: string }> {
    return Array.from(this.shortcuts.values()).map(({ combo, description, group }) => ({
      combo,
      description,
      group,
    }));
  }

  private isInputFocused(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.isInputFocused()) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key;

    // Check two-key sequences first (e.g. "g t")
    if (this.pendingKey) {
      const combo = `${this.pendingKey} ${key}`;
      if (this.shortcuts.has(combo)) {
        event.preventDefault();
        this.clearPending();
        this.shortcuts.get(combo)!.callback();
        return;
      }
      this.clearPending();
    }

    // Check if this key starts a two-key sequence
    const hasTwoKeySequence = Array.from(this.shortcuts.keys()).some(c => c.startsWith(key + ' '));
    if (hasTwoKeySequence) {
      this.pendingKey = key;
      this.pendingTimeout = setTimeout(() => this.clearPending(), 500);
      return;
    }

    // Single key shortcuts
    if (this.shortcuts.has(key)) {
      event.preventDefault();
      this.shortcuts.get(key)!.callback();
    }
  }

  private clearPending(): void {
    this.pendingKey = null;
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }
}
