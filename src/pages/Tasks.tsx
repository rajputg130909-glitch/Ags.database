import React, { useState } from 'react';
import { useStore } from '../store';
import { formatDate, getStatusColor } from '../utils';
import { Plus, X, LayoutGrid, List, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';

export default function Tasks() {
  const { tasks, projects, users, currentUser, addTask, updateTask } = useStore();
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const visibleTasks = currentUser?.role === 'developer'
    ? tasks.filter(t => t.assigneeId === currentUser.id)
    : tasks;

  const filteredTasks = visibleTasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
    return true;
  });

  const [formData, setFormData] = useState({
    title: '', description: '', projectId: '', assigneeId: currentUser?.id || '',
    priority: 'medium' as TaskPriority, dueDate: '', status: 'todo' as TaskStatus,
    checklist: [] as any[], timeLogs: [] as any[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({ ...formData, approvalStatus: currentUser?.role === 'ceo' ? 'approved' : 'pending' } as any);
    setShowForm(false);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { status: newStatus });
  };

  const handleComplete = (taskId: string) => {
    updateTask(taskId, { status: 'completed' });
  };

  const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'submitted_review', 'completed'];
  const statusLabels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', submitted_review: 'Review', completed: 'Completed' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {currentUser?.role === 'developer' ? 'Your assigned tasks' : 'Manage all tasks'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded text-sm ${view === 'kanban' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded text-sm ${view === 'list' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm">
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm">
          <option value="all">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
      </div>

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statuses.map(status => {
            const statusTasks = filteredTasks.filter(t => t.status === status);
            return (
              <div key={status} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{statusLabels[status]}</h3>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300">{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
                    return (
                      <div key={task.id} onClick={() => setViewTask(task)} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-sm transition-shadow">
                        <p className="text-sm font-medium text-slate-800 dark:text-white line-clamp-2">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{project?.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' : task.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{task.priority}</span>
                          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{formatDate(task.dueDate)}</span>
                        </div>
                        {task.status !== 'completed' && currentUser?.role !== 'developer' && (
                          <div className="mt-2 flex gap-1">
                            {statuses.filter(s => s !== task.status && s !== 'completed').slice(0, 2).map(s => (
                              <button key={s} onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, s); }} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300">→ {statusLabels[s]}</button>
                            ))}
                          </div>
                        )}
                        {task.status !== 'completed' && currentUser?.role === 'developer' && task.assigneeId === currentUser.id && (
                          <button onClick={(e) => { e.stopPropagation(); handleComplete(task.id); }} className="mt-2 w-full px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium">Submit for Completion</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assignee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTasks.map(task => (
                  <tr key={task.id} onClick={() => setViewTask(task)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">{task.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{projects.find(p => p.id === task.projectId)?.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{users.find(u => u.id === task.assigneeId)?.name}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' : task.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{task.priority}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(task.dueDate)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{statusLabels[task.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {viewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{viewTask.title}</h3>
              <button onClick={() => setViewTask(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Project</p><p className="text-sm font-medium text-slate-800 dark:text-white">{projects.find(p => p.id === viewTask.projectId)?.name}</p></div>
                <div><p className="text-xs text-slate-500">Assignee</p><p className="text-sm font-medium text-slate-800 dark:text-white">{users.find(u => u.id === viewTask.assigneeId)?.name}</p></div>
                <div><p className="text-xs text-slate-500">Due Date</p><p className="text-sm text-slate-800 dark:text-white">{formatDate(viewTask.dueDate)}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewTask.status)}`}>{statusLabels[viewTask.status]}</span></div>
              </div>
              <div><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700 dark:text-slate-300">{viewTask.description}</p></div>
              
              {/* Checklist */}
              {viewTask.checklist.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Checklist</h4>
                  <div className="space-y-1">
                    {viewTask.checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${item.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                          {item.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Logs */}
              {viewTask.timeLogs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Time Logs ({viewTask.timeLogs.reduce((s, t) => s + t.hours, 0)}h total)</h4>
                  <div className="space-y-1">
                    {viewTask.timeLogs.map(log => (
                      <div key={log.id} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-sm">
                        <span className="text-slate-600 dark:text-slate-300">{formatDate(log.date)} - {log.description}</span>
                        <span className="font-medium text-slate-800 dark:text-white">{log.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                {viewTask.status !== 'completed' && (
                  <>
                    {currentUser?.role === 'developer' && viewTask.assigneeId === currentUser.id && (
                      <button onClick={() => { handleComplete(viewTask.id); setViewTask(null); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Submit Completion</button>
                    )}
                    {currentUser?.role !== 'developer' && (
                      <select value={viewTask.status} onChange={e => { handleStatusChange(viewTask.id, e.target.value as TaskStatus); setViewTask(null); }} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
                        {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">New Task</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project *</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assignee *</label>
                  <select required value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date *</label>
                  <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
