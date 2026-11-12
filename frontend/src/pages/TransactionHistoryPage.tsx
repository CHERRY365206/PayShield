import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw, Eye } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadTransactions = (pageIdx = 0) => {
    setLoading(true);
    paymentService.getTransactions(pageIdx, 10)
      .then((r) => {
        setTransactions(r.content || []);
        setTotalPages(r.totalPages || 0);
        setPage(pageIdx);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions(0);
  }, []);

  const filtered = transactions.filter((t) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      t.id.toLowerCase().includes(term) ||
      (t.description || '').toLowerCase().includes(term) ||
      (t.razorpayPaymentId || '').toLowerCase().includes(term);

    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment History</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Complete transaction ledger with risk scores and verification statuses.
          </p>
        </div>
        <button
          onClick={() => loadTransactions(page)}
          className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2f6a] bg-white transition-all"
              placeholder="Search by Transaction ID, Description, or Payment ID..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2f6a] bg-white transition-all"
            >
              <option value="">All Statuses</option>
              <option value="CAPTURED">Captured</option>
              <option value="ORDER_CREATED">Order Created</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REJECTED">Declined / Rejected</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="md" text="Loading records..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-sm font-medium">No transactions found matching your criteria</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing your filters or creating a new payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-600 uppercase font-semibold text-[11px] border-b border-gray-100 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Tx ID</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Risk Score</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[11px] font-semibold text-slate-800">
                      {tx.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900 text-sm">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-[10px]">
                        {tx.paymentMethod || 'UPI'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {tx.riskDecision ? (
                        <RiskBadge decision={tx.riskDecision} score={tx.riskScore} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/transactions/${tx.id}`}
                        className="inline-flex items-center gap-1 text-[#1a2f6a] hover:text-blue-900 font-semibold text-xs py-1 px-2.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Details</span>
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
              onClick={() => loadTransactions(Math.max(0, page - 1))}
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
              onClick={() => loadTransactions(Math.min(totalPages - 1, page + 1))}
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
