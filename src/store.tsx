import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  User, Client, Order, Project, Task, Invoice, Expense,
  AttendanceRecord, LeaveRequest, ApprovalRequest, Notification,
  AuditLog, CompanySettings, Payment, ApprovalStatus, InvoiceStatus,
  TaskStatus, Role
} from './types';

// Simple hash for demo (in production use bcrypt on server)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + str.length.toString(36);
}

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'AGS Webworks',
  address: '',
  phone: '',
  email: '',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  taxRate: 15,
  lateThresholdMinutes: 15,
  workHoursStart: '09:00',
  workHoursEnd: '17:00',
  weekends: [5, 6],
  holidays: [],
};

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Muhammad Sharjeel', email: 'ceo@agswebworks.com', role: 'ceo', passwordHash: simpleHash('CEO@ags2024!'), active: true, createdAt: new Date().toISOString() },
  { id: 'u2', name: 'Addan Avais', email: 'accountant@agswebworks.com', role: 'accountant', passwordHash: simpleHash('ACC@ags2024!'), active: true, createdAt: new Date().toISOString() },
  { id: 'u3', name: 'Ghufran', email: 'developer@agswebworks.com', role: 'developer', passwordHash: simpleHash('DEV@ags2024!'), active: true, createdAt: new Date().toISOString() },
];

const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Al-Rashid Trading Co.', contactPerson: 'Ahmed Al-Rashid', email: 'ahmed@alrashid.com', phone: '+966501234567', address: 'Riyadh, Saudi Arabia', leadSource: 'Referral', leadStatus: 'won', archived: false, createdAt: '2024-01-15', createdBy: 'u1' },
  { id: 'c2', name: 'TechVision Solutions', contactPerson: 'Sara Khan', email: 'sara@techvision.sa', phone: '+966507654321', address: 'Jeddah, Saudi Arabia', leadSource: 'Website', leadStatus: 'qualified', archived: false, createdAt: '2024-02-20', createdBy: 'u1' },
  { id: 'c3', name: 'Green Leaf Restaurant', contactPerson: 'Omar Hassan', email: 'omar@greenleaf.sa', phone: '+966509876543', address: 'Dammam, Saudi Arabia', leadSource: 'Cold Call', leadStatus: 'proposal_sent', archived: false, createdAt: '2024-03-10', createdBy: 'u1' },
];

const INITIAL_ORDERS: Order[] = [
  { id: 'o1', orderNumber: 'ORD-2024-001', clientId: 'c1', service: 'E-commerce Website', scope: 'Full e-commerce platform with payment integration, inventory management, and admin dashboard', agreedAmount: 25000, startDate: '2024-02-01', deadline: '2024-05-30', priority: 'high', status: 'in_progress', approvalStatus: 'approved', createdBy: 'u1', createdAt: '2024-01-20' },
  { id: 'o2', orderNumber: 'ORD-2024-002', clientId: 'c2', service: 'Corporate Website Redesign', scope: 'Complete redesign of corporate website with modern UI, CMS integration', agreedAmount: 15000, startDate: '2024-03-01', deadline: '2024-06-15', priority: 'medium', status: 'in_progress', approvalStatus: 'approved', createdBy: 'u1', createdAt: '2024-02-25' },
  { id: 'o3', orderNumber: 'ORD-2024-003', clientId: 'c3', service: 'Restaurant Ordering System', scope: 'Online ordering system with menu management and delivery tracking', agreedAmount: 18000, startDate: '2024-04-01', deadline: '2024-07-30', priority: 'medium', status: 'pending', approvalStatus: 'approved', createdBy: 'u1', createdAt: '2024-03-15' },
];

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Al-Rashid E-commerce Platform', brief: 'Build a complete e-commerce solution with product catalog, shopping cart, payment gateway integration, order management, and admin panel.', clientId: 'c1', orderId: 'o1', status: 'active', startDate: '2024-02-01', deadline: '2024-05-30', assignedMembers: ['u3'], proposedBudget: 25000, approvedBudget: 25000, milestones: [{ id: 'm1', title: 'Design & Wireframes', deadline: '2024-02-28', completed: true }, { id: 'm2', title: 'Frontend Development', deadline: '2024-04-15', completed: true }, { id: 'm3', title: 'Backend & Integration', deadline: '2024-05-15', completed: false }, { id: 'm4', title: 'Testing & Launch', deadline: '2024-05-30', completed: false }], approvalStatus: 'approved', createdBy: 'u1', createdAt: '2024-02-01' },
  { id: 'p2', name: 'TechVision Website Redesign', brief: 'Modern corporate website with CMS, blog, portfolio sections, and contact forms.', clientId: 'c2', orderId: 'o2', status: 'active', startDate: '2024-03-01', deadline: '2024-06-15', assignedMembers: ['u3'], proposedBudget: 15000, approvedBudget: 15000, milestones: [{ id: 'm5', title: 'Design Approval', deadline: '2024-03-30', completed: true }, { id: 'm6', title: 'Development', deadline: '2024-05-30', completed: false }, { id: 'm7', title: 'Content & Launch', deadline: '2024-06-15', completed: false }], approvalStatus: 'approved', createdBy: 'u1', createdAt: '2024-03-01' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Implement Shopping Cart', description: 'Build the shopping cart component with add/remove items, quantity updates, and price calculations', projectId: 'p1', assigneeId: 'u3', priority: 'high', dueDate: '2024-04-10', status: 'completed', checklist: [{ id: 'cl1', text: 'Cart UI component', completed: true }, { id: 'cl2', text: 'Add/remove functionality', completed: true }, { id: 'cl3', text: 'Price calculations', completed: true }], timeLogs: [{ id: 'tl1', date: '2024-04-05', hours: 6, description: 'Cart UI and logic', loggedBy: 'u3' }, { id: 'tl2', date: '2024-04-08', hours: 4, description: 'Testing and fixes', loggedBy: 'u3' }], approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-04-01', completedAt: '2024-04-10' },
  { id: 't2', title: 'Payment Gateway Integration', description: 'Integrate Stripe/payment gateway for processing online payments', projectId: 'p1', assigneeId: 'u3', priority: 'urgent', dueDate: '2024-04-30', status: 'in_progress', checklist: [{ id: 'cl4', text: 'Research payment providers', completed: true }, { id: 'cl5', text: 'Implement payment flow', completed: false }, { id: 'cl6', text: 'Webhook handling', completed: false }], timeLogs: [{ id: 'tl3', date: '2024-04-15', hours: 5, description: 'Payment API integration', loggedBy: 'u3' }], approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-04-10' },
  { id: 't3', title: 'CMS Setup for TechVision', description: 'Set up headless CMS for content management', projectId: 'p2', assigneeId: 'u3', priority: 'medium', dueDate: '2024-05-15', status: 'todo', checklist: [{ id: 'cl7', text: 'Choose CMS platform', completed: false }, { id: 'cl8', text: 'Configure content types', completed: false }], timeLogs: [], approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-04-01' },
];

const INITIAL_INVOICES: Invoice[] = [
  { id: 'inv1', invoiceNumber: 'INV-2024-001', clientId: 'c1', orderId: 'o1', status: 'partially_paid', issueDate: '2024-02-15', dueDate: '2024-03-15', currency: 'SAR', items: [{ id: 'ii1', description: 'E-commerce Website Development', quantity: 1, unitPrice: 25000, discount: 0, amount: 25000 }], subtotal: 25000, discountPercent: 0, taxRate: 15, taxAmount: 3750, total: 28750, paidAmount: 14375, notes: 'Payment due within 30 days', terms: 'Late payments subject to 2% monthly charge', approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-02-15', payments: [{ id: 'pay1', invoiceId: 'inv1', amount: 14375, date: '2024-03-10', method: 'bank_transfer', reference: 'TRF-2024-001', approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-03-10' }] },
  { id: 'inv2', invoiceNumber: 'INV-2024-002', clientId: 'c2', orderId: 'o2', status: 'issued', issueDate: '2024-03-15', dueDate: '2024-04-15', currency: 'SAR', items: [{ id: 'ii2', description: 'Website Redesign - Phase 1', quantity: 1, unitPrice: 7500, discount: 0, amount: 7500 }], subtotal: 7500, discountPercent: 0, taxRate: 15, taxAmount: 1125, total: 8625, paidAmount: 0, approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-03-15', payments: [] },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', reference: 'EXP-2024-001', date: '2024-02-10', category: 'hosting', vendor: 'DigitalOcean', description: 'Monthly hosting for client projects', amount: 500, tax: 75, paymentMethod: 'bank_transfer', paymentStatus: 'paid', projectId: 'p1', approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-02-10' },
  { id: 'e2', reference: 'EXP-2024-002', date: '2024-03-05', category: 'software', vendor: 'Adobe', description: 'Creative Cloud subscription', amount: 250, tax: 37.5, paymentMethod: 'card', paymentStatus: 'paid', approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-03-05' },
  { id: 'e3', reference: 'EXP-2024-003', date: '2024-03-20', category: 'domains', vendor: 'Namecheap', description: 'Domain renewals', amount: 150, tax: 22.5, paymentMethod: 'card', paymentStatus: 'paid', approvalStatus: 'approved', createdBy: 'u2', createdAt: '2024-03-20' },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', userId: 'u3', date: '2024-04-15', checkIn: '08:55', checkOut: '17:05', status: 'present', totalHours: 8, approvalStatus: 'approved', createdAt: '2024-04-15' },
  { id: 'a2', userId: 'u3', date: '2024-04-16', checkIn: '09:10', checkOut: '17:30', status: 'late', totalHours: 8, approvalStatus: 'approved', createdAt: '2024-04-16' },
  { id: 'a3', userId: 'u3', date: '2024-04-17', checkIn: '08:50', checkOut: '17:00', status: 'present', totalHours: 8, approvalStatus: 'approved', createdAt: '2024-04-17' },
];

interface StoreState {
  users: User[];
  clients: Client[];
  orders: Order[];
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
  expenses: Expense[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  approvals: ApprovalRequest[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: CompanySettings;
  currentUser: User | null;
}

interface StoreContextType extends StoreState {
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (module: string, action?: string) => boolean;
  // Client operations
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  // Order operations
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'orderNumber'>) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  // Project operations
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  // Invoice operations
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber' | 'paidAmount'>) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  // Expense operations
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'reference'>) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  // Attendance operations
  addAttendance: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => void;
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'createdAt'>) => void;
  // Approval operations
  submitForApproval: (req: Omit<ApprovalRequest, 'id' | 'submittedAt' | 'status'>) => void;
  processApproval: (id: string, status: 'approved' | 'rejected' | 'changes_requested', comment: string) => void;
  // Settings
  updateSettings: (data: Partial<CompanySettings>) => void;
  // User management
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  // Notifications
  markNotificationRead: (id: string) => void;
  // Helpers
  getEntity: (type: string, id: string) => any;
  getNextInvoiceNumber: () => string;
  getNextOrderNumber: () => string;
  getNextExpenseRef: () => string;
}

const StoreContext = createContext<StoreContextType | null>(null);

function loadState(): StoreState {
  try {
    const saved = localStorage.getItem('ags_store');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getInitialState(), ...parsed };
    }
  } catch (e) { console.error('Failed to load state', e); }
  return getInitialState();
}

function getInitialState(): StoreState {
  return {
    users: INITIAL_USERS,
    clients: INITIAL_CLIENTS,
    orders: INITIAL_ORDERS,
    projects: INITIAL_PROJECTS,
    tasks: INITIAL_TASKS,
    invoices: INITIAL_INVOICES,
    expenses: INITIAL_EXPENSES,
    attendance: INITIAL_ATTENDANCE,
    leaveRequests: [],
    approvals: [],
    notifications: [],
    auditLogs: [],
    settings: DEFAULT_SETTINGS,
    currentUser: null,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState);

  useEffect(() => {
    const { currentUser, ...saveable } = state;
    localStorage.setItem('ags_store', JSON.stringify(saveable));
  }, [state]);

  // Persist current user separately
  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem('ags_current_user', JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem('ags_current_user');
    }
  }, [state.currentUser]);

  // Restore session
  useEffect(() => {
    const savedUser = localStorage.getItem('ags_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState(s => ({ ...s, currentUser: user }));
      } catch (e) {}
    }
  }, []);

  const addAuditLog = useCallback((action: string, entityType: string, entityId: string, details: string) => {
    setState(s => ({
      ...s,
      auditLogs: [{ id: uuidv4(), userId: s.currentUser?.id || 'system', action, entityType, entityId, details, timestamp: new Date().toISOString() }, ...s.auditLogs]
    }));
  }, []);

  const addNotification = useCallback((userId: string, title: string, message: string, type: 'approval' | 'info' | 'warning' | 'success' = 'info', link?: string) => {
    setState(s => ({
      ...s,
      notifications: [{ id: uuidv4(), userId, title, message, type, read: false, createdAt: new Date().toISOString(), link }, ...s.notifications]
    }));
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const user = state.users.find(u => u.email === email && u.active);
    if (user && user.passwordHash === simpleHash(password)) {
      setState(s => ({ ...s, currentUser: user }));
      addAuditLog('LOGIN', 'user', user.id, `User ${user.name} logged in`);
      return true;
    }
    return false;
  }, [state.users, addAuditLog]);

  const logout = useCallback(() => {
    if (state.currentUser) {
      addAuditLog('LOGOUT', 'user', state.currentUser.id, `User ${state.currentUser.name} logged out`);
    }
    setState(s => ({ ...s, currentUser: null }));
  }, [state.currentUser, addAuditLog]);

  const hasPermission = useCallback((module: string, action?: string): boolean => {
    if (!state.currentUser) return false;
    const role = state.currentUser.role;
    if (role === 'ceo') return true;
    
    const permissions: Record<Role, Record<string, string[]>> = {
      ceo: { '*': ['*'] },
      accountant: {
        'clients': ['view', 'create', 'edit'],
        'invoices': ['view', 'create', 'edit'],
        'expenses': ['view', 'create', 'edit'],
        'orders': ['view', 'create', 'edit'],
        'projects': ['view', 'create', 'edit'],
        'tasks': ['view', 'create', 'edit'],
        'payments': ['view', 'create'],
        'attendance': ['view_summary'],
        'analytics': ['view_finance'],
        'approvals': ['view_own'],
      },
      developer: {
        'tasks': ['view_own', 'edit_own'],
        'projects': ['view_assigned'],
        'orders': ['view_assigned'],
        'attendance': ['view_own', 'create_own'],
        'clients': ['view_limited'],
      },
    };
    
    const modulePerms = permissions[role]?.[module] || [];
    if (modulePerms.includes('*')) return true;
    if (!action) return modulePerms.length > 0;
    return modulePerms.includes(action) || modulePerms.includes('*');
  }, [state.currentUser]);

  const getEntity = useCallback((type: string, id: string) => {
    const map: Record<string, any[]> = {
      client: state.clients, order: state.orders, project: state.projects,
      task: state.tasks, invoice: state.invoices, expense: state.expenses,
      attendance: state.attendance, user: state.users,
    };
    return map[type]?.find((e: any) => e.id === id);
  }, [state]);

  const getNextInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = state.invoices.length + 1;
    return `INV-${year}-${String(count).padStart(3, '0')}`;
  }, [state.invoices]);

  const getNextOrderNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = state.orders.length + 1;
    return `ORD-${year}-${String(count).padStart(3, '0')}`;
  }, [state.orders]);

  const getNextExpenseRef = useCallback(() => {
    const year = new Date().getFullYear();
    const count = state.expenses.length + 1;
    return `EXP-${year}-${String(count).padStart(3, '0')}`;
  }, [state.expenses]);

  const addClient = useCallback((client: Omit<Client, 'id' | 'createdAt' | 'createdBy'>) => {
    const newClient: Client = { ...client, id: uuidv4(), createdAt: new Date().toISOString(), createdBy: state.currentUser!.id };
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, clients: [...s.clients, newClient] }));
      addAuditLog('CREATE', 'client', newClient.id, `Created client: ${newClient.name}`);
    } else {
      submitForApproval({ type: 'order', recordId: 'new_client', submittedBy: state.currentUser!.id, reason: 'New client', proposedChanges: newClient });
    }
  }, [state.currentUser]);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c) }));
      addAuditLog('UPDATE', 'client', id, `Updated client`);
    } else {
      const current = state.clients.find(c => c.id === id);
      submitForApproval({ type: 'order', recordId: id, submittedBy: state.currentUser!.id, reason: 'Update client', currentValues: current, proposedChanges: data });
    }
  }, [state.currentUser, state.clients]);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt' | 'orderNumber'>) => {
    const newOrder: Order = { ...order, id: uuidv4(), orderNumber: getNextOrderNumber(), createdAt: new Date().toISOString(), createdBy: state.currentUser!.id };
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, orders: [...s.orders, { ...newOrder, approvalStatus: 'approved' as ApprovalStatus }] }));
      addAuditLog('CREATE', 'order', newOrder.id, `Created order: ${newOrder.orderNumber}`);
    } else {
      setState(s => ({ ...s, orders: [...s.orders, { ...newOrder, approvalStatus: 'pending' as ApprovalStatus }] }));
      submitForApproval({ type: 'order', recordId: newOrder.id, submittedBy: state.currentUser!.id, reason: 'New order', proposedChanges: newOrder });
    }
  }, [state.currentUser, getNextOrderNumber, addAuditLog]);

  const updateOrder = useCallback((id: string, data: Partial<Order>) => {
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, ...data } : o) }));
      addAuditLog('UPDATE', 'order', id, `Updated order`);
    } else {
      const current = state.orders.find(o => o.id === id);
      setState(s => ({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, approvalStatus: 'pending' as ApprovalStatus } : o) }));
      submitForApproval({ type: 'order', recordId: id, submittedBy: state.currentUser!.id, reason: 'Update order', currentValues: current, proposedChanges: data });
    }
  }, [state.currentUser, state.orders, addAuditLog]);

  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = { ...project, id: uuidv4(), createdAt: new Date().toISOString(), createdBy: state.currentUser!.id };
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, projects: [...s.projects, { ...newProject, approvalStatus: 'approved' as ApprovalStatus }] }));
    } else {
      setState(s => ({ ...s, projects: [...s.projects, { ...newProject, approvalStatus: 'pending' as ApprovalStatus }] }));
      submitForApproval({ type: 'project', recordId: newProject.id, submittedBy: state.currentUser!.id, reason: 'New project', proposedChanges: newProject });
    }
  }, [state.currentUser]);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, projects: s.projects.map(p => p.id === id ? { ...p, ...data } : p) }));
    } else {
      setState(s => ({ ...s, projects: s.projects.map(p => p.id === id ? { ...p, ...data, approvalStatus: 'pending' as ApprovalStatus } : p) }));
    }
  }, [state.currentUser]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = { ...task, id: uuidv4(), createdAt: new Date().toISOString(), createdBy: state.currentUser!.id };
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, tasks: [...s.tasks, { ...newTask, approvalStatus: 'approved' as ApprovalStatus }] }));
    } else {
      setState(s => ({ ...s, tasks: [...s.tasks, { ...newTask, approvalStatus: 'pending' as ApprovalStatus }] }));
      submitForApproval({ type: 'task', recordId: newTask.id, submittedBy: state.currentUser!.id, reason: 'New task', proposedChanges: newTask });
    }
  }, [state.currentUser]);

  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const role = state.currentUser!.role;
    
    if (role === 'ceo') {
      setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) }));
    } else if (role === 'developer' && task.assigneeId === state.currentUser!.id) {
      // Developer can update own tasks but completion needs approval
      if (data.status === 'completed') {
        setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...data, approvalStatus: 'pending' as ApprovalStatus } : t) }));
        submitForApproval({ type: 'task', recordId: id, submittedBy: state.currentUser!.id, reason: 'Task completion', currentValues: task, proposedChanges: data });
      } else {
        setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) }));
      }
    } else if (role === 'accountant') {
      setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...data, approvalStatus: 'pending' as ApprovalStatus } : t) }));
      submitForApproval({ type: 'task', recordId: id, submittedBy: state.currentUser!.id, reason: 'Task update', currentValues: task, proposedChanges: data });
    }
  }, [state.currentUser, state.tasks]);

  const addInvoice = useCallback((invoice: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber' | 'paidAmount'>) => {
    const newInvoice: Invoice = { ...invoice, id: uuidv4(), invoiceNumber: getNextInvoiceNumber(), paidAmount: 0, createdAt: new Date().toISOString(), createdBy: state.currentUser!.id };
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, invoices: [...s.invoices, { ...newInvoice, approvalStatus: 'approved' as ApprovalStatus, status: 'issued' as InvoiceStatus }] }));
    } else {
      setState(s => ({ ...s, invoices: [...s.invoices, { ...newInvoice, approvalStatus: 'pending' as ApprovalStatus, status: 'pending_approval' as InvoiceStatus }] }));
      submitForApproval({ type: 'invoice', recordId: newInvoice.id, submittedBy: state.currentUser!.id, reason: 'New invoice', proposedChanges: newInvoice });
    }
  }, [state.currentUser, getNextInvoiceNumber]);

  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, invoices: s.invoices.map(i => i.id === id ? { ...i, ...data } : i) }));
    } else {
      setState(s => ({ ...s, invoices: s.invoices.map(i => i.id === id ? { ...i, ...data, approvalStatus: 'pending' as ApprovalStatus } : i) }));
    }
  }, [state.currentUser]);

  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = { ...payment, id: uuidv4(), createdAt: new Date().toISOString(), createdBy: state.currentUser!.id };
    if (state.currentUser!.role === 'ceo') {
      setState(s => {
        const invoice = s.invoices.find(i => i.id === payment.invoiceId);
        if (!invoice) return s;
        const newPaidAmount = invoice.paidAmount + payment.amount;
        const newStatus: InvoiceStatus = newPaidAmount >= invoice.total ? 'paid' : 'partially_paid';
        return {
          ...s,
          payments: [...(s as any).payments || [], { ...newPayment, approvalStatus: 'approved' }],
          invoices: s.invoices.map(i => i.id === payment.invoiceId ? { ...i, paidAmount: newPaidAmount, status: newStatus, payments: [...i.payments, { ...newPayment, approvalStatus: 'approved' }] } : i)
        };
      });
    } else {
      setState(s => ({
        ...s,
        invoices: s.invoices.map(i => i.id === payment.invoiceId ? { ...i, payments: [...i.payments, { ...newPayment, approvalStatus: 'pending' }] } : i)
      }));
      submitForApproval({ type: 'payment', recordId: newPayment.id, submittedBy: state.currentUser!.id, reason: 'Record payment', proposedChanges: newPayment });
    }
  }, [state.currentUser]);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt' | 'reference'>) => {
    const newExpense: Expense = { ...expense, id: uuidv4(), reference: getNextExpenseRef(), createdAt: new Date().toISOString(), createdBy: state.currentUser!.id };
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, expenses: [...s.expenses, { ...newExpense, approvalStatus: 'approved' as ApprovalStatus }] }));
    } else {
      setState(s => ({ ...s, expenses: [...s.expenses, { ...newExpense, approvalStatus: 'pending' as ApprovalStatus }] }));
      submitForApproval({ type: 'expense', recordId: newExpense.id, submittedBy: state.currentUser!.id, reason: 'New expense', proposedChanges: newExpense });
    }
  }, [state.currentUser, getNextExpenseRef]);

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, expenses: s.expenses.map(e => e.id === id ? { ...e, ...data } : e) }));
    } else {
      setState(s => ({ ...s, expenses: s.expenses.map(e => e.id === id ? { ...e, ...data, approvalStatus: 'pending' as ApprovalStatus } : e) }));
    }
  }, [state.currentUser]);

  const addAttendance = useCallback((record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const newRecord: AttendanceRecord = { ...record, id: uuidv4(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, attendance: [...s.attendance, newRecord] }));
  }, []);

  const updateAttendance = useCallback((id: string, data: Partial<AttendanceRecord>) => {
    if (state.currentUser!.role === 'ceo') {
      setState(s => ({ ...s, attendance: s.attendance.map(a => a.id === id ? { ...a, ...data } : a) }));
    } else {
      setState(s => ({ ...s, attendance: s.attendance.map(a => a.id === id ? { ...a, ...data, approvalStatus: 'pending' as ApprovalStatus } : a) }));
    }
  }, [state.currentUser]);

  const addLeaveRequest = useCallback((req: Omit<LeaveRequest, 'id' | 'createdAt'>) => {
    const newReq: LeaveRequest = { ...req, id: uuidv4(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, leaveRequests: [...s.leaveRequests, newReq] }));
    submitForApproval({ type: 'leave', recordId: newReq.id, submittedBy: state.currentUser!.id, reason: req.reason, proposedChanges: newReq });
  }, [state.currentUser]);

  const submitForApproval = useCallback((req: Omit<ApprovalRequest, 'id' | 'submittedAt' | 'status'>) => {
    const newReq: ApprovalRequest = { ...req, id: uuidv4(), submittedAt: new Date().toISOString(), status: 'pending' };
    setState(s => ({ ...s, approvals: [...s.approvals, newReq] }));
    // Notify CEO
    const ceo = state.users.find(u => u.role === 'ceo');
    if (ceo) {
      addNotification(ceo.id, 'New Approval Request', `${state.currentUser?.name} submitted a ${req.type} for approval`, 'approval');
    }
    addAuditLog('SUBMIT_APPROVAL', req.type, req.recordId, `Submitted for approval by ${state.currentUser?.name}`);
  }, [state.currentUser, state.users, addNotification, addAuditLog]);

  const processApproval = useCallback((id: string, status: 'approved' | 'rejected' | 'changes_requested', comment: string) => {
    setState(s => {
      const approval = s.approvals.find(a => a.id === id);
      if (!approval || approval.status !== 'pending') return s;
      
      let newState = { ...s, approvals: s.approvals.map(a => a.id === id ? { ...a, status, reviewedBy: s.currentUser!.id, reviewedAt: new Date().toISOString(), reviewComment: comment } : a) };
      
      if (status === 'approved') {
        // Apply the approved changes based on type
        switch (approval.type) {
          case 'invoice': {
            const inv = s.invoices.find(i => i.id === approval.recordId);
            if (inv) {
              newState.invoices = s.invoices.map(i => i.id === approval.recordId ? { ...i, approvalStatus: 'approved', status: 'issued' } : i);
            }
            break;
          }
          case 'expense': {
            newState.expenses = s.expenses.map(e => e.id === approval.recordId ? { ...e, approvalStatus: 'approved' } : e);
            break;
          }
          case 'payment': {
            const payment = approval.proposedChanges as Payment;
            if (payment) {
              const invoice = s.invoices.find(i => i.id === payment.invoiceId);
              if (invoice) {
                const newPaidAmount = invoice.paidAmount + payment.amount;
                const newStatus: InvoiceStatus = newPaidAmount >= invoice.total ? 'paid' : 'partially_paid';
                newState.invoices = s.invoices.map(i => i.id === payment.invoiceId ? { ...i, paidAmount: newPaidAmount, status: newStatus, payments: [...i.payments.filter(p => p.id !== payment.id), { ...payment, approvalStatus: 'approved' }] } : i);
              }
            }
            break;
          }
          case 'task': {
            newState.tasks = s.tasks.map(t => t.id === approval.recordId ? { ...t, ...approval.proposedChanges, approvalStatus: 'approved', completedAt: approval.proposedChanges?.status === 'completed' ? new Date().toISOString() : t.completedAt } : t);
            break;
          }
          case 'order': {
            if (approval.recordId === 'new_client' && approval.proposedChanges) {
              newState.clients = [...s.clients, { ...approval.proposedChanges, id: uuidv4(), createdAt: new Date().toISOString(), createdBy: approval.submittedBy }];
            } else {
              newState.orders = s.orders.map(o => o.id === approval.recordId ? { ...o, ...approval.proposedChanges, approvalStatus: 'approved' } : o);
            }
            break;
          }
          case 'project': {
            newState.projects = s.projects.map(p => p.id === approval.recordId ? { ...p, ...approval.proposedChanges, approvalStatus: 'approved' } : p);
            break;
          }
          case 'leave': {
            newState.leaveRequests = s.leaveRequests.map(l => l.id === approval.recordId ? { ...l, approvalStatus: 'approved' } : l);
            break;
          }
        }
      }
      
      // Notify submitter
      addNotification(approval.submittedBy, `Request ${status}`, `Your ${approval.type} request has been ${status}`, status === 'approved' ? 'success' : 'warning');
      addAuditLog('PROCESS_APPROVAL', approval.type, approval.recordId, `Approval ${status} by ${s.currentUser?.name}: ${comment}`);
      
      return newState;
    });
  }, [addNotification, addAuditLog]);

  const updateSettings = useCallback((data: Partial<CompanySettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...data } }));
    addAuditLog('UPDATE', 'settings', 'company', `Settings updated by ${state.currentUser?.name}`);
  }, [state.currentUser, addAuditLog]);

  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...user, id: uuidv4(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, users: [...s.users, newUser] }));
    addAuditLog('CREATE', 'user', newUser.id, `Created user: ${newUser.name}`);
  }, [addAuditLog]);

  const markNotificationRead = useCallback((id: string) => {
    setState(s => ({ ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  }, []);

  const value: StoreContextType = {
    ...state,
    login, logout, hasPermission,
    addClient, updateClient,
    addOrder, updateOrder,
    addProject, updateProject,
    addTask, updateTask,
    addInvoice, updateInvoice, addPayment,
    addExpense, updateExpense,
    addAttendance, updateAttendance, addLeaveRequest,
    submitForApproval, processApproval,
    updateSettings, addUser, markNotificationRead,
    getEntity, getNextInvoiceNumber, getNextOrderNumber, getNextExpenseRef,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
