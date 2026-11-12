import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ChevronLeft, ChevronRight, RefreshCw, Eye, AlertTriangle } from 'lucide-react';

interface Props {
  flaggedOnly?: boolean;
}

export default function AdminTransactionsPage({ flaggedOnly = false }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTransactions = (pageIdx = 0) => {
    setLoading(true);
    const apiCall = flaggedOnly
      ? adminService.getFlaggedTransactions(pageIdx, 15)
      : adminService.getAllTransactions(pageIdx, 15);

    apiCall
      .then((r) => {
        setTransactions(r.content || []);
        setTotalPages(r.totalPages || 0);
        setPage(pageIdx);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions(0);
  }, [flaggedOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            {flaggedOnly && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {flaggedOnly ? 'Flagged & High-Risk Transactions' : 'All Platform Transactions'}
            </h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {flaggedOnly
              ? 'Showing transactions classified under REVIEW_REQUIRED or DECLINED by the risk assessment engine.'
              : 'Global payment ledger across all customer accounts.'}
          </p>
        </div>
        <button
          onClick={() => fetchTransactions(page)}
          className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="md" text="Loading ledger..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-sm font-medium">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 uppercase font-semibold text-[11px] border-b border-gray-100 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Tx ID</th>
                  <th className="px-4 py-3.5">User Email</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Razorpay Order</th>
                  <th className="px-4 py-3.5">Risk Decision</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[11px] font-semibold text-slate-800">
                      {tx.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 font-medium">
                      {tx.userEmail}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900 text-sm">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-500 text-[11px]">
                      {tx.razorpayOrderId || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {tx.riskDecision ? (
                        <RiskBadge decision={tx.riskDecision} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-mono font-bold ${
                        (tx.riskScore || 0) >= 60
                          ? 'text-red-600'
                          : (tx.riskScore || 0) >= 30
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`}>
                        {tx.riskScore ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-[11px]">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/transactions/${tx.id}`}
                        className="inline-flex items-center gap-1 text-[#1a2f6a] hover:text-blue-900 font-semibold text-xs py-1 px-2.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={() => fetchTransactions(Math.max(0, page - 1))}
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
              onClick={() => fetchTransactions(Math.min(totalPages - 1, page + 1))}
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
