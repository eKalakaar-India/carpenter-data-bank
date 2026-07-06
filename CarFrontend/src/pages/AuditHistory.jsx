import React, { useEffect } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { 
  History, 
  FileSpreadsheet, 
  Activity, 
  CheckCircle2, 
  AlertOctagon,
  Clock,
  User,
  ShieldCheck
} from 'lucide-react';

export default function AuditHistory() {
  const { 
    importHistory, 
    activityLogs, 
    fetchImportHistory, 
    fetchActivityLogs,
    user
  } = useVaultStore();

  useEffect(() => {
    fetchImportHistory();
    if (user?.role === 'ADMIN') {
      fetchActivityLogs();
    }
  }, [fetchImportHistory, fetchActivityLogs, user]);

  return (
    <div className="space-y-8 pb-10 text-slate-800">
      
      {/* Title */}
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-wide text-slate-900">
          Vault Audit <span className="font-normal italic text-[var(--accent-primary)]">Trails</span>
        </h2>
        <p className="text-slate-550 text-xs mt-1 uppercase tracking-wider font-medium">
          Access secure historical transaction logs and administrative transaction streams
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Bulk Ingestion History Logs */}
        <div className="vault-card flex flex-col h-[600px]">
          <div className="flex items-center gap-2 border-b border-[#DDE3EA] pb-4 mb-4">
            <FileSpreadsheet className="text-[var(--accent-primary)]" size={16} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Bulk Spreadsheet Ingestion Stream</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {importHistory.map((item) => (
              <div key={item.id} className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-2xl space-y-3 hover:border-[var(--accent-primary)]/20 transition-colors shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-serif font-bold text-slate-850 break-all">{item.fileName}</span>
                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">{item.fileType} Spreadsheet</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Import stats */}
                <div className="grid grid-cols-3 gap-2 py-2 text-center bg-white border border-[#DDE3EA] rounded-xl text-[10px] font-semibold text-slate-500 shadow-sm">
                  <div>
                    <span className="block text-slate-800 font-bold">{item.successfullyImported}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">Success Rows</span>
                  </div>
                  <div>
                    <span className="block text-amber-600 font-bold">{item.duplicateRows}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">Duplicate Skips</span>
                  </div>
                  <div>
                    <span className="block text-red-650 font-bold">{item.failedRows}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">Malformed Skips</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-550 pt-2 border-t border-[#DDE3EA]">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock size={10} />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </span>
                  <span>Total Rows: {item.totalRows}</span>
                </div>
              </div>
            ))}
            {importHistory.length === 0 && (
              <div className="text-center py-20 text-slate-400 text-xs font-medium">No historical batch ingest logs cleared in archive database.</div>
            )}
          </div>
        </div>

        {/* Security / Action trails logs */}
        <div className="vault-card flex flex-col h-[600px]">
          <div className="flex items-center gap-2 border-b border-[#DDE3EA] pb-4 mb-4">
            <ShieldCheck className="text-[var(--accent-primary)]" size={16} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Administrative Operations Trail</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {user?.role === 'ADMIN' ? (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl hover:bg-white transition-colors shadow-sm animate-fadeIn">
                  <div className="p-2 rounded-lg bg-[#E8ECF2] text-[var(--accent-primary)] shadow-sm mt-0.5">
                    <Activity size={12} />
                  </div>
                  <div className="flex-1 min-w-0 text-xs text-slate-700">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{log.details}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-550 font-semibold">
                      <span className="flex items-center gap-0.5"><User size={8} /> {log.userName || 'System'}</span>
                      <span>•</span>
                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
                <AlertOctagon size={32} className="text-[var(--accent-primary)]" />
                <h4 className="font-serif text-slate-800 font-bold text-lg">Administrative Egress Required</h4>
                <p className="text-xs text-slate-550 max-w-xs leading-relaxed">
                  Decryption of administrative security streams requires operational clearing. Standard operator roles are limited to relationship management ledgers.
                </p>
              </div>
            )}
            {user?.role === 'ADMIN' && activityLogs.length === 0 && (
              <div className="text-center py-20 text-slate-400 text-xs font-medium">No actions recorded in active audit schema.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
