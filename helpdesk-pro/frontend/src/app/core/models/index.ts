export type Role = 'CUSTOMER' | 'AGENT' | 'TEAM_LEAD' | 'ADMIN';
export type TicketStatus = 'NEW' | 'OPEN' | 'PENDING' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED' | 'SNOOZED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  departmentId?: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category?: string;
  departmentId?: string;
  assignedAgent?: User;
  createdBy?: User;
  slaPolicyId?: string;
  dueDate?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  slaBreached: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  manualDueDate?: string;
  snoozedUntil?: string;
  preSnoozeStatus?: string;
  parentTicketId?: string | null;
  parentTicketNumber?: string | null;
  parentTicketTitle?: string | null;
  splitFromId?: string | null;
  splitFromNumber?: string | null;
  closedByAi?: boolean;
}

export interface Comment {
  id: string;
  ticketId: string;
  author: User;
  body: string;
  internal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  ticketId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  inboundEmail?: string;
  teamLeadId?: string;
  active: boolean;
}

export interface SlaPolicy {
  id: string;
  name: string;
  responseTimeHours: number;
  resolutionTimeHours: number;
  priority: Priority;
  businessHoursOnly: boolean;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: 'EMAIL' | 'IN_APP';
  event: string;
  referenceId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  category?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DashboardStats {
  openTickets: number;
  pendingTickets: number;
  resolvedToday: number;
  slaBreached: number;
  newTickets: number;
  onHold: number;
}
