import React, { useState } from 'react';
import { useStore } from '../store';
import { formatDate, getStatusColor, formatCurrency } from '../utils';
import { Plus, X, FolderOpen, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Project, Order } from '../types';

export default function Projects() {
  const { projects, orders, clients, tasks, currentUser, addProject, updateProject } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const visibleProjects = currentUser?.role === 'developer' 
    ? projects.filter(p => p.assignedMembers.includes(currentUser.id))
    : projects;

  const filteredProjects = visibleProjects.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const [formData, setFormData] = useState({
    name: '', brief: '', clientId: '', orderId: '', status: 'planning' as any,
    startDate: new Date().toISOString().split('T')[0], deadline: '', assignedMembers: [] as string[],
    proposedBudget: 0, approvedBudget: 0, milestones: [] as any[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({ ...formData, approvalStatus: currentUser?.role === 'ceo' ? 'approved' : 'pending' } as any);
    setShowForm(false);
  };

  const getProjectProgress = (project: Project) => {
    const total = project.milestones.length;
    const completed = project.milestones.filter(m => m.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getProjectTasks = (projectId: string) => tasks.filter(t => t.projectId === projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {currentUser?.role === 'developer' ? 'Your assigned projects' : 'Manage all projects'}
          </p>
        </div>
        {currentUser?.role !== 'developer' && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjects.map(project => {
          const client = clients.find(c => c.id === project.clientId);
          const progress = getProjectProgress(project);
          const projectTasks = getProjectTasks(project.id);
          const overdueTasks = projectTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date());
          const isOverdue = new Date(project.deadline) < new Date() && project.status !== 'completed';

          return (
            <div key={project.id} onClick={() => setViewProject(project)} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{project.name}</h3>
                  <p className="text-sm text-slate-500">{client?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>{project.status.replace('_', ' ')}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{project.brief}</p>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                  <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(project.deadline)}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {projectTasks.filter(t => t.status === 'completed').length}/{projectTasks.length} tasks</span>
                </div>
                {overdueTasks.length > 0 && <span className="text-red-500 font-medium">{overdueTasks.length} overdue</span>}
              </div>
            </div>
          );
        })}
      </div>
      {filteredProjects.length === 0 && <div className="text-center py-12 text-slate-500">No projects found</div>}

      {/* View Project Modal */}
      {viewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{viewProject.name}</h3>
              <button onClick={() => setViewProject(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><p className="text-xs text-slate-500">Client</p><p className="text-sm font-medium text-slate-800 dark:text-white">{clients.find(c => c.id === viewProject.clientId)?.name}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewProject.status)}`}>{viewProject.status}</span></div>
                <div><p className="text-xs text-slate-500">Start</p><p className="text-sm text-slate-800 dark:text-white">{formatDate(viewProject.startDate)}</p></div>
                <div><p className="text-xs text-slate-500">Deadline</p><p className="text-sm text-slate-800 dark:text-white">{formatDate(viewProject.deadline)}</p></div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Brief</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{viewProject.brief}</p>
              </div>

              {/* Milestones */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Milestones</h4>
                <div className="space-y-2">
                  {viewProject.milestones.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${m.completed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        {m.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800 dark:text-white">{m.title}</p>
                        <p className="text-xs text-slate-500">Due: {formatDate(m.deadline)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Tasks ({getProjectTasks(viewProject.id).length})</h4>
                <div className="space-y-2">
                  {getProjectTasks(viewProject.id).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div>
                        <p className="text-sm text-slate-800 dark:text-white">{task.title}</p>
                        <p className="text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget (only for CEO/Accountant) */}
              {(currentUser?.role === 'ceo' || currentUser?.role === 'accountant') && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(viewProject.proposedBudget, 'SAR')}</p>
                    <p className="text-xs text-slate-500">Proposed Budget</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-lg font-bold text-cyan-600">{formatCurrency(viewProject.approvedBudget, 'SAR')}</p>
                    <p className="text-xs text-slate-500">Approved Budget</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Project Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">New Project</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Brief *</label>
                <textarea required value={formData.brief} onChange={e => setFormData({...formData, brief: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client *</label>
                  <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select...</option>
                    {clients.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Order</label>
                  <select value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">None</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline *</label>
                  <input required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                  {currentUser?.role === 'ceo' ? 'Create Project' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
