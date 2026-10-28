export type Role = 'ceo' | 'accountant' | 'developer';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type InvoiceStatus = 'draft' | 'pending_approval' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'submitted_review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';
export type ExpenseCategory = 'hosting' | 'domains' | 'software' | 'marketing' | 'equipment' | 'travel' | 'miscellaneous';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'card' | 'other';
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxNumber?: string;
  leadSource?: string;
  marketingNotes?: string;
  leadStatus: LeadStatus;
  archived: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  service: string;
  scope: string;
  agreedAmount: number;
  startDate: string;
  deadline: string;
  priority: TaskPriority;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  brief: string;
  clientId: string;
  orderId?: string;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  assignedMembers: string[];
  proposedBudget: number;
  approvedBudget: number;
  milestones: Milestone[];
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  checklist: ChecklistItem[];
  timeLogs: TimeLog[];
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TimeLog {
  id: string;
  date: string;
  hours: number;
  description: string;
  loggedBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  orderId?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  notes?: string;
  terms?: string;
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
  payments: Payment[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
  notes?: string;
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  reference: string;
  date: string;
  category: ExpenseCategory;
  vendor: string;
  description: string;
  amount: number;
  tax: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  projectId?: string;
  orderId?: string;
  receiptFile?: string;
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
  status: AttendanceStatus;
  totalHours: number;
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'sick' | 'vacation' | 'personal' | 'other';
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'invoice' | 'expense' | 'payment' | 'order' | 'project' | 'task' | 'attendance' | 'leave' | 'correction';
  recordId: string;
  submittedBy: string;
  submittedAt: string;
  reason: string;
  proposedChanges?: any;
  currentValues?: any;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approval' | 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  bankDetails?: string;
  logo?: string;
  currency: string;
  timezone: string;
  taxRate: number;
  lateThresholdMinutes: number;
  workHoursStart: string;
  workHoursEnd: string;
  weekends: number[];
  holidays: string[];
}
