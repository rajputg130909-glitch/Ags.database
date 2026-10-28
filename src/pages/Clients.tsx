import React, { useState } from 'react';
import { useStore } from '../store';
import { formatDate, getStatusColor } from '../utils';
import { Plus, Search, Filter, Edit2, Archive, Eye, X } from 'lucide-react';
import { Client, LeadStatus } from '../types';

export default function Clients() {
  const { clients, orders, invoices, addClient, updateClient, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => {
    if (c.archived && leadFilter !== 'archived') return false;
    if (leadFilter !== 'all' && leadFilter !== 'archived' && c.leadStatus !== leadFilter) return false;
    if (leadFilter === 'archived' && !c.archived) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.contactPerson.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
    }
    return true;
  });

  const getClientFinancials = (clientId: string) => {
    const clientOrders = orders.filter(o => o.clientId === clientId && o.approvalStatus === 'approved');
    const clientInvoices = invoices.filter(i => i.clientId === clientId && i.approvalStatus === 'approved');
    const totalBilled = clientInvoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = clientInvoices.reduce((s, i) => s + i.paidAmount, 0);
    return { orders: clientOrders.length, totalBilled, outstanding: totalBilled - totalPaid };
  };

  const [formData, setFormData] = useState({
    name: '', contactPerson: '', email: '', phone: '', address: '', taxNumber: '', leadSource: '', marketingNotes: '', leadStatus: 'new' as LeadStatus, archived: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient(formData);
    }
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', taxNumber: '', leadSource: '', marketingNotes: '', leadStatus: 'new', archived: false });
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, contactPerson: client.contactPerson, email: client.email, phone: client.phone, address: client.address, taxNumber: client.taxNumber || '', leadSource: client.leadSource || '', marketingNotes: client.marketingNotes || '', leadStatus: client.leadStatus, archived: client.archived });
    setShowForm(true);
  };

  const leadStages: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Clients</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your client database and marketing pipeline</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingClient(null); setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', taxNumber: '', leadSource: '', marketingNotes: '', leadStatus: 'new', archived: false }); }} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {leadStages.map(stage => {
          const count = clients.filter(c => c.leadStatus === stage && !c.archived).length;
          return (
            <button key={stage} onClick={() => setLeadFilter(stage)} className={`p-3 rounded-lg border text-center transition-colors ${leadFilter === stage ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-cyan-300'}`}>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{count}</p>
              <p className="text-xs text-slate-500 capitalize">{stage.replace('_', ' ')}</p>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none" />
        </div>
        <select value={leadFilter} onChange={e => setLeadFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
          <option value="all">All Status</option>
          {leadStages.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>)}
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Client Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Outstanding</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredClients.map(client => {
                const fin = getClientFinancials(client.id);
                return (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.address}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-800 dark:text-white">{client.contactPerson}</p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.leadStatus)}`}>{client.leadStatus.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{client.leadSource || '-'}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-800 dark:text-white">{fin.outstanding > 0 ? `SAR ${fin.outstanding.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingClient(client)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600"><Eye className="w-4 h-4 text-slate-500" /></button>
                        <button onClick={() => startEdit(client)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                        <button onClick={() => updateClient(client.id, { archived: !client.archived })} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600"><Archive className="w-4 h-4 text-slate-500" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No clients found</p>
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{editingClient ? 'Edit Client' : 'Add Client'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company/Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
                  <input required value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                  <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Number</label>
                  <input value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lead Source</label>
                  <select value={formData.leadSource} onChange={e => setFormData({...formData, leadSource: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select...</option>
                    <option value="Referral">Referral</option>
                    <option value="Website">Website</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lead Status</label>
                  <select value={formData.leadStatus} onChange={e => setFormData({...formData, leadStatus: e.target.value as LeadStatus})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    {leadStages.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Marketing Notes</label>
                  <textarea value={formData.marketingNotes} onChange={e => setFormData({...formData, marketingNotes: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">{editingClient ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{viewingClient.name}</h3>
              <button onClick={() => setViewingClient(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Contact Person</p><p className="text-sm font-medium text-slate-800 dark:text-white">{viewingClient.contactPerson}</p></div>
                <div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-slate-800 dark:text-white">{viewingClient.email}</p></div>
                <div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium text-slate-800 dark:text-white">{viewingClient.phone}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingClient.leadStatus)}`}>{viewingClient.leadStatus}</span></div>
              </div>
              {(() => { const fin = getClientFinancials(viewingClient.id); return (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-lg font-bold text-slate-800 dark:text-white">{fin.orders}</p><p className="text-xs text-slate-500">Orders</p></div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-lg font-bold text-slate-800 dark:text-white">SAR {fin.totalBilled.toFixed(0)}</p><p className="text-xs text-slate-500">Total Billed</p></div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-lg font-bold text-slate-800 dark:text-white">SAR {fin.outstanding.toFixed(0)}</p><p className="text-xs text-slate-500">Outstanding</p></div>
                </div>
              ); })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
