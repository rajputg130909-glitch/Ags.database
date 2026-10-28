import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useStore } from '../store';
import {
  LayoutDashboard, Users, FileText, Receipt, FolderOpen, CheckSquare,
  Clock, BarChart3, Shield, Settings, Bell, LogOut, Menu, X, ChevronDown,
  Building2
} from 'lucide-react';

export default function Layout() {
  const { currentUser, logout, notifications, settings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter(n => n.userId === currentUser?.id && !n.read).length;
  const userNotifs = notifications.filter(n => n.userId === currentUser?.id).slice(0, 5);

  const role = currentUser?.role || 'developer';

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['ceo', 'accountant', 'developer'] },
    { path: '/clients', icon: Users, label: 'Clients', roles: ['ceo', 'accountant'] },
    { path: '/orders', icon: FolderOpen, label: 'Orders', roles: ['ceo', 'accountant'] },
    { path: '/projects', icon: FolderOpen, label: 'Projects', roles: ['ceo', 'accountant', 'developer'] },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks', roles: ['ceo', 'accountant', 'developer'] },
    { path: '/invoices', icon: FileText, label: 'Invoices', roles: ['ceo', 'accountant'] },
    { path: '/expenses', icon: Receipt, label: 'Expenses', roles: ['ceo', 'accountant'] },
    { path: '/attendance', icon: Clock, label: 'Attendance', roles: ['ceo', 'accountant', 'developer'] },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ceo', 'accountant'] },
    { path: '/approvals', icon: Shield, label: 'Approvals', roles: ['ceo', 'accountant', 'developer'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['ceo'] },
  ].filter(item => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <Building2 className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-white font-bold text-lg">{settings.name}</h1>
            <p className="text-slate-400 text-xs">Business Manager</p>
          </div>
        </div>
        
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-slate-400 text-xs capitalize">{currentUser?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            
            <div className="flex items-center gap-3 ml-auto">
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                    <h3 className="px-4 py-2 text-sm font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700">Notifications</h3>
                    {userNotifs.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-500">No notifications</p>
                    ) : (
                      userNotifs.map(n => (
                        <div key={n.id} className={`px-4 py-2.5 border-b border-slate-50 dark:border-slate-700 ${!n.read ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''}`}>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                  {currentUser?.name?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{currentUser?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
