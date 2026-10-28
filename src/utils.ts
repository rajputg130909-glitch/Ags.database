import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Expense, CompanySettings, AttendanceRecord } from './types';

export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleString('en-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    changes_requested: 'bg-orange-100 text-orange-800',
    issued: 'bg-blue-100 text-blue-800',
    partially_paid: 'bg-purple-100 text-purple-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    void: 'bg-gray-100 text-gray-500',
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-800',
    blocked: 'bg-red-100 text-red-800',
    submitted_review: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    planning: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-500',
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-orange-100 text-orange-800',
    half_day: 'bg-yellow-100 text-yellow-800',
    leave: 'bg-blue-100 text-blue-800',
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-indigo-100 text-indigo-800',
    proposal_sent: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function generateInvoicePDF(invoice: Invoice, client: any, settings: CompanySettings, isDraft: boolean = false): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with company info
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.name || 'AGS Webworks', 14, 25);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (settings.address) doc.text(settings.address, 14, 33);
  if (settings.phone) doc.text(`Phone: ${settings.phone}`, 14, 39);
  if (settings.email) doc.text(`Email: ${settings.email}`, 14, 45);
  if (settings.taxNumber) doc.text(`Tax #: ${settings.taxNumber}`, 14, 51);
  
  // Invoice title
  doc.setFontSize(24);
  doc.setTextColor(6, 182, 212);
  doc.text('INVOICE', pageWidth - 14, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 14, 35, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.issueDate)}`, pageWidth - 14, 42, { align: 'right' });
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - 14, 49, { align: 'right' });
  doc.text(`Currency: ${invoice.currency}`, pageWidth - 14, 56, { align: 'right' });
  
  // Bill To section
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Bill To:', 14, 70);
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(client?.name || '', 14, 78);
  doc.text(client?.contactPerson || '', 14, 84);
  if (client?.email) doc.text(client.email, 14, 90);
  if (client?.phone) doc.text(client.phone, 14, 96);
  if (client?.address) doc.text(client.address, 14, 102);
  
  // Line items table
  const tableData = invoice.items.map((item, idx) => [
    idx + 1,
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    item.discount > 0 ? `${item.discount}%` : '-',
    formatCurrency(item.amount, invoice.currency),
  ]);
  
  autoTable(doc, {
    startY: 115,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Discount', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  const totalsX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text('Subtotal:', totalsX, finalY + 15);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 14, finalY + 15, { align: 'right' });
  
  if (invoice.discountPercent > 0) {
    doc.text(`Discount (${invoice.discountPercent}%):`, totalsX, finalY + 22);
    doc.text(`-${formatCurrency(invoice.subtotal * invoice.discountPercent / 100, invoice.currency)}`, pageWidth - 14, finalY + 22, { align: 'right' });
  }
  
  doc.text(`Tax (${invoice.taxRate}%):`, totalsX, finalY + 29);
  doc.text(formatCurrency(invoice.taxAmount, invoice.currency), pageWidth - 14, finalY + 29, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, finalY + 40);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 14, finalY + 40, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Paid: ${formatCurrency(invoice.paidAmount, invoice.currency)}`, totalsX, finalY + 48);
  doc.text(`Balance: ${formatCurrency(invoice.total - invoice.paidAmount, invoice.currency)}`, totalsX, finalY + 55);
  
  // Notes and terms
  if (invoice.notes || invoice.terms) {
    const notesY = finalY + 70;
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    if (invoice.notes) {
      doc.text('Notes:', 14, notesY);
      doc.text(invoice.notes, 14, notesY + 6);
    }
    if (invoice.terms) {
      doc.text('Terms:', 14, notesY + 16);
      doc.text(invoice.terms, 14, notesY + 22);
    }
  }
  
  // Payment instructions
  if (settings.bankDetails) {
    const bankY = finalY + 95;
    doc.setFontSize(9);
    doc.text('Payment Details:', 14, bankY);
    doc.text(settings.bankDetails, 14, bankY + 6);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.getHeight() - 10);
  
  // DRAFT watermark
  if (isDraft) {
    doc.setFontSize(60);
    doc.setTextColor(255, 0, 0);
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.3 }));
    doc.text('DRAFT', pageWidth / 2, doc.internal.pageSize.getHeight() / 2, { align: 'center', angle: 45 });
    (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
  }
  
  return doc;
}

export function generateExpenseVoucherPDF(expense: Expense, settings: CompanySettings): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.name || 'AGS Webworks', 14, 25);
  
  doc.setFontSize(16);
  doc.setTextColor(6, 182, 212);
  doc.text('EXPENSE VOUCHER', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  const fields = [
    ['Reference:', expense.reference],
    ['Date:', formatDate(expense.date)],
    ['Category:', expense.category.charAt(0).toUpperCase() + expense.category.slice(1)],
    ['Vendor:', expense.vendor],
    ['Description:', expense.description],
    ['Amount:', formatCurrency(expense.amount, settings.currency)],
    ['Tax:', formatCurrency(expense.tax, settings.currency)],
    ['Total:', formatCurrency(expense.amount + expense.tax, settings.currency)],
    ['Payment Method:', expense.paymentMethod.replace('_', ' ')],
    ['Payment Status:', expense.paymentStatus],
    ['Approval Status:', expense.approvalStatus],
  ];
  
  let y = 60;
  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 60, y);
    y += 8;
  });
  
  // Signature area
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y + 30, 90, y + 30);
  doc.line(pageWidth - 90, y + 30, pageWidth - 14, y + 30);
  doc.setFontSize(9);
  doc.text('Prepared By', 14, y + 36);
  doc.text('Approved By', pageWidth - 90, y + 36);
  
  return doc;
}

export function generateAttendancePDF(records: AttendanceRecord[], userName: string, settings: CompanySettings): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.name || 'AGS Webworks', 14, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text('ATTENDANCE REPORT', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Employee: ${userName}`, 14, 55);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 62);
  
  const tableData = records.map(r => [
    formatDate(r.date),
    r.checkIn || '-',
    r.checkOut || '-',
    r.status,
    r.totalHours.toFixed(1),
  ]);
  
  autoTable(doc, {
    startY: 72,
    head: [['Date', 'Check In', 'Check Out', 'Status', 'Hours']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9 },
  });
  
  const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0);
  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 14, finalY + 15);
  
  return doc;
}

export function generateExpenseReportPDF(expenses: Expense[], settings: CompanySettings, filters?: { startDate?: string; endDate?: string; category?: string }): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.name || 'AGS Webworks', 14, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text('EXPENSE REPORT', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 52);
  if (filters?.startDate) doc.text(`From: ${formatDate(filters.startDate)}`, 14, 58);
  if (filters?.endDate) doc.text(`To: ${formatDate(filters.endDate)}`, 80, 58);
  
  const tableData = expenses.map(e => [
    e.reference,
    formatDate(e.date),
    e.category,
    e.vendor,
    e.description.substring(0, 30),
    formatCurrency(e.amount, settings.currency),
    formatCurrency(e.tax, settings.currency),
    formatCurrency(e.amount + e.tax, settings.currency),
    e.approvalStatus,
  ]);
  
  autoTable(doc, {
    startY: 68,
    head: [['Ref', 'Date', 'Category', 'Vendor', 'Description', 'Amount', 'Tax', 'Total', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      4: { cellWidth: 35 },
    },
  });
  
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const totalTax = expenses.reduce((s, e) => s + e.tax, 0);
  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount: ${formatCurrency(totalAmount, settings.currency)}`, 14, finalY + 15);
  doc.text(`Total Tax: ${formatCurrency(totalTax, settings.currency)}`, 14, finalY + 22);
  doc.text(`Grand Total: ${formatCurrency(totalAmount + totalTax, settings.currency)}`, 14, finalY + 29);
  
  return doc;
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function calculateFinancials(state: any) {
  const approvedInvoices = state.invoices.filter((i: Invoice) => i.approvalStatus === 'approved' && i.status !== 'void');
  const approvedExpenses = state.expenses.filter((e: Expense) => e.approvalStatus === 'approved');
  const paidExpenses = approvedExpenses.filter((e: Expense) => e.paymentStatus === 'paid');
  
  const invoicedRevenue = approvedInvoices.reduce((sum: number, inv: Invoice) => sum + inv.subtotal, 0);
  const totalTaxCollected = approvedInvoices.reduce((sum: number, inv: Invoice) => sum + inv.taxAmount, 0);
  const cashCollected = approvedInvoices.reduce((sum: number, inv: Invoice) => sum + inv.paidAmount, 0);
  const outstandingReceivables = approvedInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.total - inv.paidAmount), 0);
  
  const totalExpenses = approvedExpenses.reduce((sum: number, e: Expense) => sum + e.amount + e.tax, 0);
  const cashExpenses = paidExpenses.reduce((sum: number, e: Expense) => sum + e.amount + e.tax, 0);
  
  // Operational profit = net invoiced revenue (excl tax) - approved expenses (excl tax)
  const netRevenueExclTax = invoicedRevenue; // Already excludes tax as it's the subtotal
  const expensesExclTax = approvedExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
  const operationalProfit = netRevenueExclTax - expensesExclTax;
  
  // Cash surplus = actual cash in - actual cash out
  const cashSurplus = cashCollected - cashExpenses;
  
  return {
    invoicedRevenue,
    totalTaxCollected,
    cashCollected,
    outstandingReceivables,
    totalExpenses,
    cashExpenses,
    operationalProfit,
    cashSurplus,
    expensesExclTax,
    approvedInvoicesCount: approvedInvoices.length,
    approvedExpensesCount: approvedExpenses.length,
  };
}
