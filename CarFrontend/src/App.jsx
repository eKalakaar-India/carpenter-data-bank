import React, { useState, useEffect } from 'react';
import { useVaultStore } from './store/vaultStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Ingest from './pages/Ingest';
import ManualEntry from './pages/ManualEntry';
import AuditHistory from './pages/AuditHistory';
import { 
  LayoutDashboard, 
  Database, 
  FileUp, 
  FileText, 
  History, 
  LogOut, 
  User as UserIcon,
  Sparkles,
  Menu,
  X,
  Shield
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, user, logout } = useVaultStore();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', '#851C2C');
    root.style.setProperty('--accent-secondary', '#9E2636');
    root.style.setProperty('--accent-tertiary', '#C03E4F');
    root.style.setProperty('--accent-glow', 'rgba(133, 28, 44, 0.08)');
    root.style.setProperty('--accent-glow-strong', 'rgba(133, 28, 44, 0.15)');
  }, []);

  // Auto-redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} />;
      case 'records':
        return <Records />;
      case 'ingest':
        return <Ingest setCurrentTab={setCurrentTab} />;
      case 'manual':
        return <ManualEntry />;
      case 'history':
        return <AuditHistory />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Executive Intel', icon: LayoutDashboard },
    { id: 'records', label: 'Partnership Vault', icon: Database },
    { id: 'ingest', label: 'Smart Ingest', icon: FileUp },
    { id: 'manual', label: 'Manual Ledger', icon: FileText },
    { id: 'history', label: 'Audit Trails', icon: History }
  ];

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden text-slate-800 font-sans">
      
      {/* Sidebar */}
      <aside className={`sidebar-wood ${sidebarOpen ? 'w-64' : 'w-20'} duration-300 relative border-r border-[#DDE3EA] shrink-0`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-amber-50 p-1 rounded-full border border-red-500/10 shadow-md transition-colors z-30 flex items-center justify-center"
        >
          {sidebarOpen ? <X size={12} /> : <Menu size={12} />}
        </button>

        {/* Sidebar Header / Logo */}
        <div className="p-6 border-b border-[#DDE3EA] flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg border border-red-500/10">
            <Shield className="text-amber-100" size={20} />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent tracking-wide leading-none">
                Carp Vault
              </span>
              <span className="text-[8px] text-[var(--accent-primary)]/80 uppercase tracking-wider font-bold mt-1 leading-tight">
                Registry & Insurance Vault
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group ${
                  isActive 
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#F5F7FA]/60'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[var(--accent-primary)]' : 'text-slate-500 group-hover:text-[var(--accent-primary)] transition-colors'} />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#DDE3EA] bg-[#ECEFF4]/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-white border border-[#DDE3EA] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
              <UserIcon size={16} />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate">{user?.name}</span>
                <span className="text-[10px] text-slate-500 truncate">{user?.role} Access</span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-[#DDE3EA] hover:border-red-200 rounded-lg transition-all duration-300 shadow-sm"
          >
            <LogOut size={12} />
            {sidebarOpen && <span>Secure Egress</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Cinematic Backdrop Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[var(--accent-primary)]/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
        
        {/* Top Header */}
        <header className="h-16 border-b border-[#DDE3EA] px-8 flex items-center justify-between shrink-0 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-wider text-slate-500 uppercase font-sans">
              System Console / <span className="text-slate-900 font-serif lowercase italic text-base font-normal">
                {currentTab.replace(/^\w/, (c) => c.toUpperCase())}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#F5F7FA] border border-[#DDE3EA] rounded-full text-xs font-medium text-slate-700 shadow-sm">
              <Sparkles size={12} className="text-[var(--accent-primary)] animate-pulse" />
              <span className="live-glow pr-2">Node-01 Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content viewport */}
        <div className="flex-1 overflow-y-auto p-8 relative bg-[#F5F7FA]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
