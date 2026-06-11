import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { KeyboardShortcutService } from '../../core/services/keyboard-shortcut.service';

interface GroupedShortcuts {
  group: string;
  shortcuts: Array<{ combo: string; description: string; group: string }>;
}

@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      header="Keyboard Shortcuts"
      [style]="{width: '560px', maxHeight: '80vh'}"
      [draggable]="false"
      [resizable]="false">

      <div class="space-y-5 pt-1 pb-2">
        <p class="text-sm text-slate-500">Press <kbd class="kbd-chip">?</kbd> at any time to open this dialog. Shortcuts are disabled when focus is inside an input field.</p>

        <div *ngFor="let grp of groupedShortcuts()" class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-gray-100 pb-1.5">
            {{ grp.group }}
          </h3>
          <div class="space-y-1.5">
            <div *ngFor="let sc of grp.shortcuts"
                 class="flex items-center justify-between py-1 px-1">
              <span class="text-sm text-gray-700">{{ sc.description }}</span>
              <div class="flex items-center gap-1 shrink-0 ml-4">
                <ng-container *ngFor="let part of sc.combo.split(' '); let last = last">
                  <kbd class="kbd-chip">{{ part }}</kbd>
                  <span *ngIf="!last" class="text-xs text-slate-400 font-medium">then</span>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .kbd-chip,
    .kbd-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 22px;
      padding: 0 6px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, monospace;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-bottom-width: 2px;
      color: #334155;
      line-height: 1;
      white-space: nowrap;
    }
  `],
})
export class KeyboardShortcutsHelpComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  constructor(private shortcutService: KeyboardShortcutService) {}

  groupedShortcuts(): GroupedShortcuts[] {
    const shortcuts = this.shortcutService.getShortcuts();
    const groupMap = new Map<string, GroupedShortcuts>();
    for (const sc of shortcuts) {
      if (!groupMap.has(sc.group)) {
        groupMap.set(sc.group, { group: sc.group, shortcuts: [] });
      }
      groupMap.get(sc.group)!.shortcuts.push(sc);
    }
    return Array.from(groupMap.values());
  }
}
