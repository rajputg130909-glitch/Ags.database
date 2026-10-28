import React, { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency, formatDate, getStatusColor, generateInvoicePDF } from '../utils';
import { Plus, Download, Eye, X, Trash2 } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types';

export default function Invoices() {
  const { invoices, clients, currentUser, addInvoice, updateInvoice, addPayment, settings, getNextInvoiceNumber } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, date: '', method: 'bank_transfer' as any, reference: '' });

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    return true;
  });

  const [formData, setFormData] = useState({
    clientId: '', orderId: '', issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', currency: 'SAR', items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, discount: 0, amount: 0 }] as InvoiceItem[],
    discountPercent: 0, taxRate: settings.taxRate, notes: '', terms: '',
  });

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...formData.items];
    (items[idx] as any)[field] = value;
    items[idx].amount = items[idx].quantity * items[idx].unitPrice * (1 - items[idx].discount / 100);
    setFormData({ ...formData, items });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, discount: 0, amount: 0 }] });
  };

  const removeItem = (idx: number) => {
    if (formData.items.length > 1) {
      setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
    }
  };

  const calcSubtotal = () => formData.items.reduce((s, i) => s + i.amount, 0);
  const calcTax = () => {
    const sub = calcSubtotal() * (1 - formData.discountPercent / 100);
    return sub * formData.taxRate / 100;
  };
  const calcTotal = () => calcSubtotal() * (1 - formData.discountPercent / 100) + calcTax();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = calcSubtotal();
    const taxAmount = calcTax();
    const total = calcTotal();
    addInvoice({
      clientId: formData.clientId, orderId: formData.orderId || undefined,
      status: 'draft' as InvoiceStatus, issueDate: formData.issueDate, dueDate: formData.dueDate,
      currency: formData.currency, items: formData.items, subtotal, discountPercent: formData.discountPercent,
      taxRate: formData.taxRate, taxAmount, total, notes: formData.notes, terms: formData.terms,
      approvalStatus: currentUser?.role === 'ceo' ? 'approved' : 'draft', payments: [],
    } as any);
    setShowForm(false);
  };

  const handlePayment = (invoiceId: string) => {
    addPayment({ invoiceId, amount: paymentData.amount, date: paymentData.date, method: paymentData.method, reference: paymentData.reference, approvalStatus: currentUser?.role === 'ceo' ? 'approved' : 'pending' } as any);
    setShowPaymentForm(null);
    setPaymentData({ amount: 0, date: '', method: 'bank_transfer', reference: '' });
  };

  const downloadPDF = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const isDraft = invoice.status === 'draft' || invoice.approvalStatus !== 'approved';
    const doc = generateInvoicePDF(invoice, client, settings, isDraft);
    doc.save(`${invoice.invoiceNumber}${isDraft ? '-DRAFT' : ''}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Create and manage customer invoices</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'draft', 'pending_approval', 'issued', 'partially_paid', 'paid', 'overdue', 'void'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-300'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{inv.invoiceNumber}</p>
                      {inv.approvalStatus === 'pending' && <span className="text-xs text-yellow-600">⏳ Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{client?.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-800 dark:text-white">{formatCurrency(inv.total, inv.currency)}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-300">{formatCurrency(inv.paidAmount, inv.currency)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingInvoice(inv)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600" title="View"><Eye className="w-4 h-4 text-slate-500" /></button>
                        {inv.approvalStatus === 'approved' && <button onClick={() => downloadPDF(inv)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600" title="Download PDF"><Download className="w-4 h-4 text-cyan-600" /></button>}
                        {(inv.status === 'issued' || inv.status === 'partially_paid') && inv.approvalStatus === 'approved' && <button onClick={() => { setShowPaymentForm(inv.id); setPaymentData({ amount: inv.total - inv.paidAmount, date: new Date().toISOString().split('T')[0], method: 'bank_transfer', reference: '' }); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-medium text-green-600">+ Pay</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && <div className="text-center py-12 text-slate-500">No invoices found</div>}
      </div>

      {/* Create Invoice Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">New Invoice</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client *</label>
                  <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select client...</option>
                    {clients.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Date</label>
                  <input type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date *</label>
                  <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Line Items</label>
                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="col-span-5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none" required />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="col-span-1 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none text-center" min="1" />
                      <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className="col-span-2 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none text-right" min="0" step="0.01" />
                      <input type="number" placeholder="Disc%" value={item.discount} onChange={e => updateItem(idx, 'discount', Number(e.target.value))} className="col-span-1 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none text-center" min="0" max="100" />
                      <p className="col-span-2 text-sm font-medium text-slate-800 dark:text-white text-right">{formatCurrency(item.amount, formData.currency)}</p>
                      <button type="button" onClick={() => removeItem(idx)} className="col-span-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium">+ Add Item</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount %</label>
                  <input type="number" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" min="0" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Rate %</label>
                  <input type="number" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none">
                    <option value="SAR">SAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">Subtotal:</span><span className="font-medium text-slate-800 dark:text-white">{formatCurrency(calcSubtotal(), formData.currency)}</span></div>
                {formData.discountPercent > 0 && <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">Discount ({formData.discountPercent}%):</span><span className="font-medium text-red-600">-{formatCurrency(calcSubtotal() * formData.discountPercent / 100, formData.currency)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">Tax ({formData.taxRate}%):</span><span className="font-medium text-slate-800 dark:text-white">{formatCurrency(calcTax(), formData.currency)}</span></div>
                <div className="flex justify-between text-base font-bold border-t border-slate-200 dark:border-slate-600 pt-2"><span className="text-slate-800 dark:text-white">Total:</span><span className="text-cyan-600">{formatCurrency(calcTotal(), formData.currency)}</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Terms & Conditions</label>
                <textarea value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                  {currentUser?.role === 'ceo' ? 'Create & Issue' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{viewingInvoice.invoiceNumber}</h3>
              <button onClick={() => setViewingInvoice(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><p className="text-xs text-slate-500">Client</p><p className="text-sm font-medium text-slate-800 dark:text-white">{clients.find(c => c.id === viewingInvoice.clientId)?.name}</p></div>
                <div><p className="text-xs text-slate-500">Issue Date</p><p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(viewingInvoice.issueDate)}</p></div>
                <div><p className="text-xs text-slate-500">Due Date</p><p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(viewingInvoice.dueDate)}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingInvoice.status)}`}>{viewingInvoice.status.replace('_', ' ')}</span></div>
              </div>
              
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {viewingInvoice.items.map(item => (
                    <tr key={item.id}><td className="px-3 py-2 text-slate-800 dark:text-white">{item.description}</td><td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{item.quantity}</td><td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{formatCurrency(item.unitPrice, viewingInvoice.currency)}</td><td className="px-3 py-2 text-right font-medium text-slate-800 dark:text-white">{formatCurrency(item.amount, viewingInvoice.currency)}</td></tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(viewingInvoice.subtotal, viewingInvoice.currency)}</span></div>
                <div className="flex justify-between text-sm"><span>Tax ({viewingInvoice.taxRate}%):</span><span>{formatCurrency(viewingInvoice.taxAmount, viewingInvoice.currency)}</span></div>
                <div className="flex justify-between font-bold"><span>Total:</span><span className="text-cyan-600">{formatCurrency(viewingInvoice.total, viewingInvoice.currency)}</span></div>
                <div className="flex justify-between text-sm"><span>Paid:</span><span className="text-green-600">{formatCurrency(viewingInvoice.paidAmount, viewingInvoice.currency)}</span></div>
                <div className="flex justify-between text-sm font-medium"><span>Balance:</span><span>{formatCurrency(viewingInvoice.total - viewingInvoice.paidAmount, viewingInvoice.currency)}</span></div>
              </div>

              {viewingInvoice.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Payments</h4>
                  {viewingInvoice.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mb-2">
                      <div><p className="text-sm text-slate-800 dark:text-white">{formatCurrency(p.amount, viewingInvoice.currency)}</p><p className="text-xs text-slate-500">{formatDate(p.date)} • {p.method} • {p.reference}</p></div>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(p.approvalStatus)}`}>{p.approvalStatus}</span>
                    </div>
                  ))}
                </div>
              )}

              {viewingInvoice.approvalStatus === 'approved' && (
                <button onClick={() => downloadPDF(viewingInvoice)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Record Payment</h3>
              <button onClick={() => setShowPaymentForm(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                <input type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input type="date" value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Method</label>
                <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reference</label>
                <input value={paymentData.reference} onChange={e => setPaymentData({...paymentData, reference: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowPaymentForm(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button onClick={() => handlePayment(showPaymentForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Record Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
