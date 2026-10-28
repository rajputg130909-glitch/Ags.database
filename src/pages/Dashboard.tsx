import React from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { calculateFinancials, formatCurrency, formatDate, getStatusColor } from '../utils';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Users, FolderOpen,
  CheckSquare, Clock, AlertTriangle, ArrowRight, BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, invoices, expenses, tasks, projects, clients, orders, approvals, attendance, settings } = useStore();
  const navigate = useNavigate();
  const role = currentUser?.role || 'developer';
  const financials = calculateFinancials({ invoices, expenses });

  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
  const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id);
  const overdueTasks = myTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date());
  const todayAttendance = attendance.find(a => a.userId === currentUser?.id && a.date === new Date().toISOString().split('T')[0]);

  const StatCard = ({ icon: Icon, label, value, subtext, color, onClick }: any) => (
    <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {onClick && <ArrowRight className="w-4 h-4 text-slate-400" />}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
    </div>
  );

  if (role === 'developer') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome, {currentUser?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your work overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={CheckSquare} label="My Tasks" value={myTasks.length} color="bg-blue-500" onClick={() => navigate('/tasks')} />
          <StatCard icon={AlertTriangle} label="Overdue" value={overdueTasks.length} color="bg-red-500" />
          <StatCard icon={FolderOpen} label="Active Projects" value={projects.filter(p => p.assignedMembers.includes(currentUser?.id || '')).length} color="bg-purple-500" onClick={() => navigate('/projects')} />
          <StatCard icon={Clock} label="Today's Hours" value={todayAttendance ? todayAttendance.totalHours.toFixed(1) : '0.0'} color="bg-cyan-500" onClick={() => navigate('/attendance')} subtext={todayAttendance ? `Checked in: ${todayAttendance.checkIn}` : 'Not checked in'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">My Tasks</h3>
            <div className="space-y-3">
              {myTasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
              {myTasks.filter(t => t.status !== 'completed').length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No pending tasks</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {myTasks.filter(t => t.status === 'completed').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500">Completed {task.completedAt ? formatDate(task.completedAt) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {role === 'ceo' ? 'Company overview and approvals' : 'Financial and coordination overview'}
        </p>
      </div>

      {/* Financial Summary - CEO and Accountant */}
      {(role === 'ceo' || role === 'accountant') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Invoiced Revenue" value={formatCurrency(financials.invoicedRevenue, settings.currency)} subtext={`${financials.approvedInvoicesCount} approved invoices`} color="bg-emerald-500" onClick={() => navigate('/invoices')} />
          <StatCard icon={TrendingUp} label="Cash Collected" value={formatCurrency(financials.cashCollected, settings.currency)} color="bg-blue-500" />
          <StatCard icon={TrendingDown} label="Outstanding" value={formatCurrency(financials.outstandingReceivables, settings.currency)} color="bg-orange-500" />
          <StatCard icon={BarChart3} label="Operational Profit" value={formatCurrency(financials.operationalProfit, settings.currency)} subtext="Revenue - Approved Expenses (excl. tax)" color="bg-purple-500" onClick={() => navigate('/analytics')} />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(role === 'ceo' || role === 'accountant') && <StatCard icon={Users} label="Active Clients" value={clients.filter(c => !c.archived).length} color="bg-cyan-500" onClick={() => navigate('/clients')} />}
        <StatCard icon={FolderOpen} label="Active Projects" value={projects.filter(p => p.status === 'active').length} color="bg-indigo-500" onClick={() => navigate('/projects')} />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={tasks.filter(t => t.status !== 'completed').length} color="bg-amber-500" onClick={() => navigate('/tasks')} />
        {role === 'ceo' && <StatCard icon={AlertTriangle} label="Pending Approvals" value={pendingApprovals} color="bg-red-500" onClick={() => navigate('/approvals')} />}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        {role === 'ceo' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Pending Approvals</h3>
              <button onClick={() => navigate('/approvals')} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">View All</button>
            </div>
            <div className="space-y-3">
              {approvals.filter(a => a.status === 'pending').slice(0, 5).map(approval => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white capitalize">{approval.type}</p>
                    <p className="text-xs text-slate-500">by {approval.submittedBy === 'u2' ? 'Addan Avais' : 'Unknown'}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                </div>
              ))}
              {approvals.filter(a => a.status === 'pending').length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No pending approvals</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        {(role === 'ceo' || role === 'accountant') && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Invoices</h3>
              <button onClick={() => navigate('/invoices')} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">View All</button>
            </div>
            <div className="space-y-3">
              {invoices.slice(0, 5).map(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{client?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{formatCurrency(inv.total, inv.currency)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overdue Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Overdue Tasks</h3>
            <button onClick={() => navigate('/tasks')} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{task.title}</p>
                  <p className="text-xs text-red-500">Due: {formatDate(task.dueDate)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.priority)}`}>{task.priority}</span>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No overdue tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Expense Summary for Accountant */}
      {role === 'accountant' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Expense Summary (Approved)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(financials.totalExpenses, settings.currency)}</p>
              <p className="text-xs text-slate-500">Total Expenses</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(financials.cashExpenses, settings.currency)}</p>
              <p className="text-xs text-slate-500">Cash Outflows</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-lg font-bold text-slate-800 dark:text-white">{expenses.filter(e => e.approvalStatus === 'pending').length}</p>
              <p className="text-xs text-slate-500">Pending Approval</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(financials.cashSurplus, settings.currency)}</p>
              <p className="text-xs text-slate-500">Cash Surplus</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Financial figures shown are operational estimates based on approved records only. 
          Revenue figures exclude tax. Operational profit = approved invoiced revenue (excl. tax) minus approved expenses (excl. tax). 
          Cash surplus = approved cash inflows minus approved cash outflows. These reports are for internal management use and do not constitute audited financial statements.
        </p>
      </div>
    </div>
  );
}
