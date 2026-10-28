import React, { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency, calculateFinancials } from '../utils';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle, PieChart as PieIcon } from 'lucide-react';

export default function Analytics() {
  const { invoices, expenses, clients, projects, tasks, settings } = useStore();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year');
  const financials = calculateFinancials({ invoices, expenses });

  // Monthly revenue data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStr = `2024-${String(month).padStart(2, '0')}`;
    const monthInvoices = invoices.filter(inv => inv.approvalStatus === 'approved' && inv.issueDate.startsWith(monthStr));
    const monthExpenses = expenses.filter(e => e.approvalStatus === 'approved' && e.date.startsWith(monthStr));
    return {
      month: new Date(2024, i).toLocaleString('en', { month: 'short' }),
      revenue: monthInvoices.reduce((s, inv) => s + inv.subtotal, 0),
      expenses: monthExpenses.reduce((s, e) => s + e.amount + e.tax, 0),
      profit: monthInvoices.reduce((s, inv) => s + inv.subtotal, 0) - monthExpenses.reduce((s, e) => s + e.amount, 0),
    };
  });

  // Revenue by client
  const clientRevenue = clients.map(c => {
    const clientInvoices = invoices.filter(inv => inv.clientId === c.id && inv.approvalStatus === 'approved');
    return { name: c.name.substring(0, 15), revenue: clientInvoices.reduce((s, inv) => s + inv.subtotal, 0) };
  }).filter(c => c.revenue > 0);

  // Expenses by category
  const categoryData = expenses.filter(e => e.approvalStatus === 'approved').reduce((acc, e) => {
    const existing = acc.find(a => a.name === e.category);
    if (existing) existing.value += e.amount + e.tax;
    else acc.push({ name: e.category, value: e.amount + e.tax });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Project profitability
  const projectData = projects.map(p => {
    const projectInvoices = invoices.filter(inv => inv.orderId && projects.find(pr => pr.orderId === inv.orderId)?.id === p.id && inv.approvalStatus === 'approved');
    const projectExpenses = expenses.filter(e => e.projectId === p.id && e.approvalStatus === 'approved');
    const revenue = projectInvoices.reduce((s, inv) => s + inv.subtotal, 0);
    const cost = projectExpenses.reduce((s, e) => s + e.amount + e.tax, 0);
    return { name: p.name.substring(0, 15), revenue, cost, profit: revenue - cost };
  });

  // Task status distribution
  const taskStatusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'blocked').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'submitted_review').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
  ];

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

  // Overdue invoices
  const overdueInvoices = invoices.filter(inv => inv.approvalStatus === 'approved' && inv.status !== 'paid' && inv.status !== 'void' && new Date(inv.dueDate) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Business performance and financial insights</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {(['month', 'quarter', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded text-sm ${period === p ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            <p className="text-sm text-slate-500">Invoiced Revenue</p>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(financials.invoicedRevenue, settings.currency)}</p>
          <p className="text-xs text-slate-400 mt-1">Excluding tax, approved invoices only</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <p className="text-sm text-slate-500">Cash Collected</p>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(financials.cashCollected, settings.currency)}</p>
          <p className="text-xs text-slate-400 mt-1">Approved payments received</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <p className="text-sm text-slate-500">Operational Profit</p>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(financials.operationalProfit, settings.currency)}</p>
          <p className="text-xs text-slate-400 mt-1">Revenue - Approved Expenses (excl. tax)</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <p className="text-sm text-slate-500">Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(financials.outstandingReceivables, settings.currency)}</p>
          <p className="text-xs text-slate-400 mt-1">{overdueInvoices.length} overdue invoices</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Monthly Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
              <Legend />
              <Bar dataKey="revenue" fill="#06b6d4" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f59e0b" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Monthly Profit Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
              <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Client */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Revenue by Client</h3>
          {clientRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={clientRevenue} cx="50%" cy="50%" outerRadius={80} dataKey="revenue" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {clientRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 py-12">No client revenue data</p>}
        </div>

        {/* Expenses by Category */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Expenses by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 py-12">No expense data</p>}
        </div>

        {/* Task Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Profitability */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Project Profitability</h3>
          {projectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value, settings.currency)} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="#ef4444" name="Cost" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 py-12">No project data</p>}
        </div>
      </div>

      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-5">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-3">Overdue Invoices</h3>
          <div className="space-y-2">
            {overdueInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{inv.invoiceNumber}</p>
                  <p className="text-xs text-slate-500">{clients.find(c => c.id === inv.clientId)?.name} • Due: {inv.dueDate}</p>
                </div>
                <p className="text-sm font-bold text-red-600">{formatCurrency(inv.total - inv.paidAmount, inv.currency)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Reporting Basis:</strong> All figures are based on approved records only. Revenue excludes tax. 
          Operational profit = approved invoiced revenue (excl. tax) minus approved expenses (excl. tax). 
          Cash surplus = approved cash inflows minus approved cash outflows (paid expenses only). 
          Pending or rejected records are excluded. These reports are for internal management use and do not constitute audited financial statements.
        </p>
      </div>
    </div>
  );
}
