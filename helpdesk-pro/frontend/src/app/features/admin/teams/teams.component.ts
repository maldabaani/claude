import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TeamService, Team } from '../../../core/services/team.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DialogModule, ToastModule, TagModule, TableModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Teams</h1>
          <p class="text-gray-500 text-sm mt-1">Manage agent groups for ticket assignment</p>
        </div>
        <p-button label="New Team" icon="pi pi-plus" (onClick)="openCreate()"/>
      </div>

      <p-table [value]="teams()" [loading]="loading()" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Members</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-team>
          <tr>
            <td>
              <span class="inline-flex items-center gap-2">
                <span class="w-3 h-3 rounded-full inline-block" [style.background]="team.color"></span>
                <strong>{{ team.name }}</strong>
              </span>
            </td>
            <td class="text-gray-500">{{ team.description || '—' }}</td>
            <td>
              <p-tag [value]="(team.members?.length || 0) + ' members'" severity="info"/>
            </td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-users" size="small" [text]="true" pTooltip="Manage members" (onClick)="openMembers(team)"/>
                <p-button icon="pi pi-pencil" size="small" [text]="true" (onClick)="openEdit(team)"/>
                <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger" (onClick)="deleteTeam(team.id)"/>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="4" class="text-center py-8 text-gray-400">No teams yet. Create one to get started.</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Create/Edit Dialog -->
    <p-dialog [(visible)]="showForm" [header]="editingId ? 'Edit Team' : 'New Team'" [modal]="true" [style]="{width:'480px'}">
      <div class="flex flex-col gap-4 pt-2">
        <div>
          <label class="block text-sm font-medium mb-1">Name *</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="e.g. Tier 1 Support"/>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <input pInputText [(ngModel)]="form.description" class="w-full" placeholder="Optional description"/>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Color</label>
          <div class="flex gap-2 flex-wrap">
            @for (c of colors; track c) {
              <button (click)="form.color=c" class="w-7 h-7 rounded-full border-2 transition-all"
                [style.background]="c" [class.border-gray-800]="form.color===c" [class.border-transparent]="form.color!==c"></button>
            }
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" (onClick)="showForm=false"/>
        <p-button [label]="editingId ? 'Update' : 'Create'" [loading]="saving()" (onClick)="saveTeam()"/>
      </ng-template>
    </p-dialog>

    <!-- Members Dialog -->
    <p-dialog [(visible)]="showMembers" [header]="'Members — ' + (selectedTeam?.name || '')" [modal]="true" [style]="{width:'520px'}">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex gap-2">
          <input pInputText [(ngModel)]="memberSearch" class="flex-1" placeholder="Search agents by name or email" (input)="searchAgents()"/>
        </div>
        @if (agentResults.length > 0) {
          <div class="border rounded-lg divide-y">
            @for (a of agentResults; track a.id) {
              <div class="flex items-center justify-between px-3 py-2">
                <span>{{ a.fullName }} <span class="text-gray-400 text-xs">{{ a.email }}</span></span>
                <p-button icon="pi pi-plus" size="small" [text]="true" (onClick)="addMember(a.id)"/>
              </div>
            }
          </div>
        }
        <div>
          <h4 class="font-medium text-sm mb-2">Current Members ({{ members.length }})</h4>
          @if (members.length === 0) {
            <p class="text-gray-400 text-sm">No members yet.</p>
          }
          @for (m of members; track m.id) {
            <div class="flex items-center justify-between py-1">
              <span>{{ m.fullName }}</span>
              <p-button icon="pi pi-times" size="small" [text]="true" severity="danger" (onClick)="removeMember(m.id)"/>
            </div>
          }
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Done" (onClick)="showMembers=false"/>
      </ng-template>
    </p-dialog>
  `
})
export class TeamsComponent implements OnInit {
  teams = signal<Team[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = false;
  showMembers = false;
  editingId: string | null = null;
  selectedTeam: Team | null = null;
  members: any[] = [];
  agentResults: any[] = [];
  memberSearch = '';

  form = { name: '', description: '', color: '#6366F1' };
  colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  constructor(private teamService: TeamService, private http: HttpClient, private msg: MessageService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.teamService.getTeams().subscribe({
      next: t => { this.teams.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() { this.editingId = null; this.form = { name: '', description: '', color: '#6366F1' }; this.showForm = true; }

  openEdit(t: Team) { this.editingId = t.id; this.form = { name: t.name, description: t.description || '', color: t.color }; this.showForm = true; }

  saveTeam() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    const call = this.editingId
      ? this.teamService.updateTeam(this.editingId, this.form)
      : this.teamService.createTeam(this.form);
    call.subscribe({
      next: () => { this.showForm = false; this.saving.set(false); this.load(); this.msg.add({ severity: 'success', summary: 'Saved' }); },
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Error saving team' }); }
    });
  }

  deleteTeam(id: string) {
    this.teamService.deleteTeam(id).subscribe({ next: () => this.load(), error: () => this.msg.add({ severity: 'error', summary: 'Delete failed' }) });
  }

  openMembers(t: Team) {
    this.selectedTeam = t;
    this.members = [];
    this.agentResults = [];
    this.memberSearch = '';
    this.showMembers = true;
    this.teamService.getMembers(t.id).subscribe(m => this.members = m);
  }

  searchAgents() {
    if (!this.memberSearch.trim()) { this.agentResults = []; return; }
    this.http.get<any>(`${environment.apiUrl}/users?role=AGENT&search=${encodeURIComponent(this.memberSearch)}`)
      .pipe(map((r: any) => r.data?.content || r.data || []))
      .subscribe(u => this.agentResults = u);
  }

  addMember(userId: string) {
    if (!this.selectedTeam) return;
    this.teamService.addMember(this.selectedTeam.id, userId).subscribe({
      next: () => { this.teamService.getMembers(this.selectedTeam!.id).subscribe(m => this.members = m); this.agentResults = []; this.memberSearch = ''; },
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to add member' })
    });
  }

  removeMember(userId: string) {
    if (!this.selectedTeam) return;
    this.teamService.removeMember(this.selectedTeam.id, userId).subscribe({
      next: () => this.members = this.members.filter(m => m.id !== userId),
      error: () => this.msg.add({ severity: 'error', summary: 'Failed to remove member' })
    });
  }
}
