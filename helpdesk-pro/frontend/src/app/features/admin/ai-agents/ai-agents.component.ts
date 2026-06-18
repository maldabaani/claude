import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AgentCapabilityOption, AgentDefinition, AgentDefinitionRequest, AgentDefinitionService } from '../../../core/services/agent-definition.service';

@Component({
  selector: 'app-ai-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">AI Agents</h1>
          <p class="text-slate-400 text-sm mt-0.5">Define autonomous agents that resolve narrow categories of tickets</p>
        </div>
        <button (click)="toggleForm()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style="background:linear-gradient(135deg,#7C3AED,#6D28D9)">
          <i class="pi pi-plus" style="font-size:14px"></i>
          New Agent
        </button>
      </div>

      <div *ngIf="showForm()" class="bg-white rounded-2xl border border-gray-100 p-6"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 class="font-bold text-gray-900 mb-4 text-sm">{{ editingId() ? 'Edit Agent' : 'New Agent' }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Agent Name</label>
            <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="e.g. Account Access Agent" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Trigger Category</label>
            <p-select [options]="categoryOptions()" [(ngModel)]="form.triggerCategory"
                      optionLabel="label" optionValue="value" class="w-full" placeholder="Select category" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
            <input pInputText [(ngModel)]="form.description" class="w-full" placeholder="What does this agent do?" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Keywords (comma separated)</label>
            <input pInputText [(ngModel)]="keywordsText" class="w-full" placeholder="password, reset, locked out" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Capability</label>
            <div class="flex gap-2">
              <p-select [options]="capabilityOptions()" [(ngModel)]="form.capability"
                        optionLabel="label" optionValue="value" class="flex-1" placeholder="Select capability" />
              <button (click)="showNewCapability.set(!showNewCapability())"
                      type="button"
                      class="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                <i class="pi pi-plus" style="font-size:11px"></i> New capability
              </button>
            </div>
            <p *ngIf="form.capability && !selectedCapabilityHasHandler()" class="text-xs text-amber-600 mt-1.5">
              <i class="pi pi-exclamation-triangle" style="font-size:10px"></i>
              No backend handler registered for this capability yet — a developer must add one before this agent can act.
            </p>

            <div *ngIf="showNewCapability()" class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input pInputText [(ngModel)]="newCapability.key" class="w-full" placeholder="Key, e.g. HARDWARE_REPLACEMENT" />
                <input pInputText [(ngModel)]="newCapability.label" class="w-full" placeholder="Label, e.g. Hardware Replacement" />
                <input pInputText [(ngModel)]="newCapability.description" class="w-full sm:col-span-2" placeholder="Description (optional)" />
              </div>
              <div class="flex gap-2 mt-3">
                <button (click)="addCapability()" type="button"
                        class="px-4 py-1.5 rounded-lg text-xs font-bold text-white" style="background:#7C3AED">
                  Add capability
                </button>
                <button (click)="showNewCapability.set(false)" type="button"
                        class="px-4 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-end gap-6 pb-1.5">
            <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.autoClose" />
              Auto-close ticket on resolution
            </label>
            <label class="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.active" />
              Active
            </label>
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="save()"
                  class="px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style="background:#7C3AED">
            {{ editingId() ? 'Save Changes' : 'Create Agent' }}
          </button>
          <button (click)="toggleForm()"
                  class="px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div *ngIf="loading()" class="p-8 text-center text-slate-400 text-sm">Loading...</div>
        <div *ngIf="!loading() && agents().length === 0" class="p-12 text-center">
          <i class="pi pi-android text-4xl text-slate-200 mb-3 block"></i>
          <p class="text-slate-400 text-sm">No AI agents defined</p>
        </div>
        <table *ngIf="!loading() && agents().length > 0" class="w-full">
          <thead>
            <tr style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Capability</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Auto-close</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let agent of agents()" style="border-bottom:1px solid #F8FAFC"
                class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5">
                <p class="text-sm font-semibold text-gray-800">{{ agent.name }}</p>
                <p *ngIf="agent.description" class="text-xs text-slate-400">{{ agent.description }}</p>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full" style="background:#EDE9FE;color:#6D28D9">
                  {{ agent.triggerCategory }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-sm text-gray-600">
                {{ capabilityLabel(agent.capability) }}
                <i *ngIf="!capabilityHasHandler(agent.capability)" class="pi pi-exclamation-triangle text-amber-500 ml-1"
                   style="font-size:11px" title="No backend handler registered"></i>
              </td>
              <td class="px-5 py-3.5 text-sm text-gray-600">{{ agent.autoClose ? 'Yes' : 'No' }}</td>
              <td class="px-5 py-3.5">
                <span *ngIf="agent.active" class="text-xs font-bold px-2.5 py-1 rounded-full" style="background:#DCFCE7;color:#15803D">Active</span>
                <span *ngIf="!agent.active" class="text-xs font-medium text-slate-400">Inactive</span>
              </td>
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                <button (click)="edit(agent)" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                  <i class="pi pi-pencil" style="font-size:14px"></i>
                </button>
                <button (click)="toggleActive(agent)" class="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                  <i class="pi pi-power-off" style="font-size:14px"></i>
                </button>
                <button (click)="deleteAgent(agent)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <i class="pi pi-trash" style="font-size:14px"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AiAgentsComponent implements OnInit {
  agents = signal<AgentDefinition[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  capabilities = signal<AgentCapabilityOption[]>([]);
  capabilityOptions = signal<{ label: string; value: string }[]>([]);
  categoryOptions = signal<{ label: string; value: string }[]>([]);
  showNewCapability = signal(false);
  newCapability = { key: '', label: '', description: '' };

  keywordsText = '';
  form: AgentDefinitionRequest = this.emptyForm();

  constructor(private service: AgentDefinitionService, private messageService: MessageService) {}

  ngOnInit() {
    this.load();
    this.loadCapabilities();
    this.service.getCategories().subscribe(categories => {
      this.categoryOptions.set(categories.map(c => ({ label: c, value: c })));
    });
  }

  loadCapabilities() {
    this.service.getCapabilities().subscribe(capabilities => {
      this.capabilities.set(capabilities);
      this.capabilityOptions.set(capabilities.map(c => ({ label: c.label, value: c.key })));
    });
  }

  selectedCapabilityHasHandler(): boolean {
    const cap = this.capabilities().find(c => c.key === this.form.capability);
    return cap ? cap.hasHandler : true;
  }

  capabilityLabel(key: string): string {
    return this.capabilities().find(c => c.key === key)?.label ?? key;
  }

  capabilityHasHandler(key: string): boolean {
    return this.capabilities().find(c => c.key === key)?.hasHandler ?? true;
  }

  addCapability() {
    if (!this.newCapability.key || !this.newCapability.label) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Key and label are required' });
      return;
    }
    this.service.createCapability(this.newCapability).subscribe({
      next: created => {
        this.loadCapabilities();
        this.form.capability = created.key;
        this.showNewCapability.set(false);
        this.newCapability = { key: '', label: '', description: '' };
        this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Capability added — register a backend handler to activate it' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add capability' }),
    });
  }

  load() {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: agents => { this.agents.set(agents); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  emptyForm(): AgentDefinitionRequest {
    return { name: '', description: '', triggerCategory: '', keywords: [], capability: '', autoClose: false, active: true };
  }

  toggleForm() {
    this.showForm.update(v => !v);
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.keywordsText = '';
  }

  edit(agent: AgentDefinition) {
    this.editingId.set(agent.id);
    this.form = {
      name: agent.name,
      description: agent.description,
      triggerCategory: agent.triggerCategory,
      keywords: agent.keywords,
      capability: agent.capability,
      autoClose: agent.autoClose,
      active: agent.active,
    };
    this.keywordsText = agent.keywords.join(', ');
    this.showForm.set(true);
  }

  save() {
    if (!this.form.name || !this.form.triggerCategory || !this.form.capability) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name, category, and capability are required' });
      return;
    }
    this.form.keywords = this.keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0);

    const id = this.editingId();
    const request = id ? this.service.update(id, this.form) : this.service.create(this.form);
    request.subscribe({
      next: agent => {
        if (id) {
          this.agents.update(list => list.map(a => a.id === agent.id ? agent : a));
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Agent updated' });
        } else {
          this.agents.update(list => [...list, agent]);
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Agent created' });
        }
        this.toggleForm();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save agent' }),
    });
  }

  toggleActive(agent: AgentDefinition) {
    this.service.toggle(agent.id).subscribe({
      next: updated => this.agents.update(list => list.map(a => a.id === updated.id ? updated : a)),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to toggle agent' }),
    });
  }

  deleteAgent(agent: AgentDefinition) {
    this.service.delete(agent.id).subscribe({
      next: () => {
        this.agents.update(list => list.filter(a => a.id !== agent.id));
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Agent deleted' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete agent' }),
    });
  }
}
