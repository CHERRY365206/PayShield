import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = (pageIdx = 0) => {
    setLoading(true);
    adminService.getAuditLogs(pageIdx, 20)
      .then((r) => {
        setLogs(r.content || []);
        setTotalPages(r.totalPages || 0);
        setPage(pageIdx);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(0);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Audit Logs</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Immutable stream of all critical security, authorization, gateway signature and refund events.
          </p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="md" text="Loading audit log entries..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-sm font-medium">No audit events recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 uppercase font-semibold text-[11px] border-b border-gray-100 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Action Code</th>
                  <th className="px-4 py-3.5">Entity</th>
                  <th className="px-4 py-3.5">Entity ID</th>
                  <th className="px-4 py-3.5">Event Details</th>
                  <th className="px-4 py-3.5">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-gray-500 font-sans">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {log.entityType || 'SYSTEM'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-[10px]">
                      {log.entityId ? `${log.entityId.substring(0, 8)}...` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-800 font-sans max-w-sm truncate text-xs">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-[10px]">
                      {log.userId ? `${log.userId.substring(0, 8)}...` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between font-sans">
            <button
              onClick={() => fetchLogs(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-xs text-gray-600 font-medium">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => fetchLogs(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-white disabled:opacity-40 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

