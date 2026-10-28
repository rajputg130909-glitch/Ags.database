import React, { useState } from 'react';
import { useStore } from '../store';
import { formatDate, getStatusColor, generateAttendancePDF, exportToCSV } from '../utils';
import { Plus, Download, Clock, X, LogIn, LogOut } from 'lucide-react';
import { AttendanceRecord } from '../types';

export default function Attendance() {
  const { attendance, users, currentUser, addAttendance, updateAttendance, settings } = useStore();
  const [showPunch, setShowPunch] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [userFilter, setUserFilter] = useState(currentUser?.role === 'developer' ? currentUser.id : 'all');

  const visibleAttendance = currentUser?.role === 'developer'
    ? attendance.filter(a => a.userId === currentUser.id)
    : attendance;

  const filteredAttendance = visibleAttendance.filter(a => {
    if (userFilter !== 'all' && a.userId !== userFilter) return false;
    if (dateFilter && !a.date.startsWith(dateFilter.substring(0, 7))) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const todayRecord = attendance.find(a => a.userId === currentUser?.id && a.date === new Date().toISOString().split('T')[0]);

  const [punchData, setPunchData] = useState({ checkIn: '', checkOut: '', breakStart: '', breakEnd: '', notes: '' });

  const handlePunch = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (!todayRecord) {
      const hours = 0;
      addAttendance({
        userId: currentUser!.id, date: new Date().toISOString().split('T')[0],
        checkIn: timeStr, status: 'present', totalHours: hours, approvalStatus: 'approved',
      } as any);
    } else if (!todayRecord.checkOut) {
      const checkInTime = todayRecord.checkIn ? parseInt(todayRecord.checkIn.split(':')[0]) * 60 + parseInt(todayRecord.checkIn.split(':')[1]) : 0;
      const checkOutTime = parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1]);
      const totalHours = Math.max(0, (checkOutTime - checkInTime) / 60);
      updateAttendance(todayRecord.id, { checkOut: timeStr, totalHours });
    }
    setShowPunch(false);
  };

  const downloadPDF = () => {
    const userName = currentUser?.name || 'Employee';
    const doc = generateAttendancePDF(filteredAttendance, userName, settings);
    doc.save(`attendance-${userName}.pdf`);
  };

  const exportCSVData = () => {
    const data = filteredAttendance.map(a => ({
      Date: a.date, 'Check In': a.checkIn || '', 'Check Out': a.checkOut || '',
      Status: a.status, 'Total Hours': a.totalHours.toFixed(1),
    }));
    exportToCSV(data, 'attendance');
  };

  const monthTotal = filteredAttendance.reduce((s, a) => s + a.totalHours, 0);
  const presentDays = filteredAttendance.filter(a => a.status === 'present' || a.status === 'late').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {currentUser?.role === 'developer' ? 'Your attendance records' : 'Team attendance management'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPDF} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 text-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportCSVData} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 text-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => setShowPunch(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
            <Clock className="w-4 h-4" /> {todayRecord?.checkIn ? 'Check Out' : 'Check In'}
          </button>
        </div>
      </div>

      {/* Today's Status */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-100 text-sm">Today - {new Date().toLocaleDateString('en-SA', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p className="text-2xl font-bold mt-1">
              {todayRecord ? `${todayRecord.checkIn || '--:--'} → ${todayRecord.checkOut || 'In Progress'}` : 'Not checked in'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{todayRecord ? todayRecord.totalHours.toFixed(1) : '0.0'}</p>
            <p className="text-cyan-100 text-sm">hours today</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500">Total Hours (Month)</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{monthTotal.toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500">Days Present</p>
          <p className="text-xl font-bold text-green-600">{presentDays}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500">Late Arrivals</p>
          <p className="text-xl font-bold text-orange-600">{filteredAttendance.filter(a => a.status === 'late').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm text-slate-500">Avg Hours/Day</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{presentDays > 0 ? (monthTotal / presentDays).toFixed(1) : '0.0'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="month" value={dateFilter.substring(0, 7)} onChange={e => setDateFilter(e.target.value + '-01')} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm" />
        {currentUser?.role !== 'developer' && (
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm">
            <option value="all">All Employees</option>
            {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                {currentUser?.role !== 'developer' && <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check Out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredAttendance.map(record => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">{formatDate(record.date)}</td>
                  {currentUser?.role !== 'developer' && <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{users.find(u => u.id === record.userId)?.name}</td>}
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.checkIn || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.checkOut || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>{record.status}</span></td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-800 dark:text-white">{record.totalHours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAttendance.length === 0 && <div className="text-center py-12 text-slate-500">No attendance records found</div>}
      </div>

      {/* Punch Modal */}
      {showPunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{todayRecord?.checkIn ? 'Check Out' : 'Check In'}</h3>
              <button onClick={() => setShowPunch(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-800 dark:text-white">{new Date().toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-SA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
                <input value={punchData.notes} onChange={e => setPunchData({...punchData, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none" placeholder="Any notes..." />
              </div>
              <button onClick={handlePunch} className={`w-full py-3 rounded-lg font-medium text-white ${todayRecord?.checkIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {todayRecord?.checkIn ? 'Check Out' : 'Check In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
