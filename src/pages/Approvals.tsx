import React, { useState } from 'react';
import { useStore } from '../store';
import { formatDateTime, getStatusColor } from '../utils';
import { Check, X, MessageSquare, Filter, Clock } from 'lucide-react';

export default function Approvals() {
  const { approvals, users, currentUser, processApproval } = useStore();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const visibleApprovals = currentUser?.role === 'ceo'
    ? approvals
    : approvals.filter(a => a.submittedBy === currentUser?.id);

  const filteredApprovals = visibleApprovals.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const handleProcess = (id: string, status: 'approved' | 'rejected' | 'changes_requested') => {
    processApproval(id, status, comment);
    setReviewModal(null);
    setComment('');
  };

  const getSubmitterName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  const getReviewerName = (id?: string) => id ? users.find(u => u.id === id)?.name || 'Unknown' : '';

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Approvals</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {currentUser?.role === 'ceo' ? 'Review and process approval requests' : 'Track your submissions'}
          </p>
        </div>
        {currentUser?.role === 'ceo' && pendingCount > 0 && (
          <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{pendingCount} pending approval{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="changes_requested">Changes Requested</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm">
          <option value="all">All Types</option>
          <option value="invoice">Invoices</option>
          <option value="expense">Expenses</option>
          <option value="payment">Payments</option>
          <option value="order">Orders</option>
          <option value="project">Projects</option>
          <option value="task">Tasks</option>
          <option value="leave">Leave</option>
          <option value="attendance">Attendance</option>
        </select>
      </div>

      {/* Approval List */}
      <div className="space-y-3">
        {filteredApprovals.map(approval => (
          <div key={approval.id} className={`bg-white dark:bg-slate-800 rounded-xl border p-5 ${approval.status === 'pending' ? 'border-yellow-200 dark:border-yellow-800' : approval.status === 'approved' ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${approval.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' : approval.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <Clock className={`w-5 h-5 ${approval.status === 'pending' ? 'text-yellow-600' : approval.status === 'approved' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white capitalize">{approval.type}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>{approval.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{approval.reason}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Submitted by <span className="font-medium">{getSubmitterName(approval.submittedBy)}</span> on {formatDateTime(approval.submittedAt)}
                  </p>
                  {approval.reviewComment && (
                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500">Review by {getReviewerName(approval.reviewedBy)}: {approval.reviewComment}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {approval.status === 'pending' && currentUser?.role === 'ceo' && (
                <div className="flex gap-2">
                  <button onClick={() => { setReviewModal(approval.id); setComment(''); }} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700">
                    <MessageSquare className="w-3 h-3" /> Review
                  </button>
                </div>
              )}
            </div>

            {/* Proposed Changes Preview */}
            {approval.proposedChanges && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <p className="text-xs font-medium text-slate-500 mb-1">Proposed Changes:</p>
                <pre className="text-xs text-slate-600 dark:text-slate-300 overflow-x-auto">{JSON.stringify(approval.proposedChanges, null, 2).substring(0, 300)}...</pre>
              </div>
            )}
          </div>
        ))}
        {filteredApprovals.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500">No approval requests found</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Review Request</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comment / Reason</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Add your comments..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleProcess(reviewModal, 'approved')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handleProcess(reviewModal, 'changes_requested')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                  <MessageSquare className="w-4 h-4" /> Request Changes
                </button>
                <button onClick={() => handleProcess(reviewModal, 'rejected')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
              <button onClick={() => setReviewModal(null)} className="w-full px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
