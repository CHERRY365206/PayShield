import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Shield, AlertTriangle, CheckCircle, RotateCcw, Clock } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer requested refund');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchTransaction = useCallback(() => {
    if (!id) return;
    setLoading(true);
    paymentService.getTransaction(id)
      .then((data) => {
        setTx(data);
        if (data && data.amount) {
          setRefundAmount((data.amount / 100).toFixed(2));
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load transaction details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tx) return;
    setRefunding(true);
    setError('');
    setRefundSuccess('');

    try {
      const amountPaise = Math.round(parseFloat(refundAmount) * 100);
      if (isNaN(amountPaise) || amountPaise <= 0 || amountPaise > tx.amount) {
        setError('Invalid refund amount');
        setRefunding(false);
        return;
      }

      const res = await paymentService.refund(tx.id, amountPaise, refundReason);
      setRefundSuccess(
        `Refund successful! ${res.isSimulated ? '(Simulated in TEST MODE)' : ''} ID: ${res.razorpayRefundId}`
      );
      setShowRefundModal(false);
      fetchTransaction();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Fetching transaction details..." />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-gray-500 font-medium">Transaction not found or unauthorized.</p>
        <button
          onClick={() => navigate('/transactions')}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          &larr; Return to Transactions
        </button>
      </div>
    );
  }

  const isEligibleForRefund =
    ['CAPTURED', 'VERIFIED'].includes(tx.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to List</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransaction}
            className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-500 hover:text-gray-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {isEligibleForRefund && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Initiate Refund</span>
            </button>
          )}
        </div>
      </div>

      {refundSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
          <span>{refundSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Transaction Overview</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {formatCurrency(tx.amount)}
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {tx.id}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={tx.status} className="px-3 py-1 text-xs" />
            <span className="text-[11px] text-gray-400">Created {formatDate(tx.createdAt)}</span>
          </div>
        </div>

        {/* Payment Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="font-semibold text-gray-700 uppercase tracking-wider text-[10px] block">
              Payment Metadata
            </span>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Method:</span>
              <span className="font-medium text-gray-800">{tx.paymentMethod || 'UPI'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Currency:</span>
              <span className="font-medium text-gray-800">{tx.currency}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">User Email:</span>
              <span className="font-medium text-gray-800">{tx.userEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Description:</span>
              <span className="font-medium text-gray-800">{tx.description || '—'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="font-semibold text-gray-700 uppercase tracking-wider text-[10px] block">
              Razorpay Gateway Identifiers
            </span>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Razorpay Order ID:</span>
              <span className="font-mono text-gray-800 text-[11px]">{tx.razorpayOrderId || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Razorpay Payment ID:</span>
              <span className="font-mono text-gray-800 text-[11px]">{tx.razorpayPaymentId || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Simulated Location:</span>
              <span className="font-medium text-gray-800">{tx.simulatedLocation || 'None provided'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Last Updated:</span>
              <span className="font-medium text-gray-800">{formatDate(tx.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment Box */}
        <div className="border border-gray-100 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1a2f6a]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Risk Assessment Engine Report
              </h2>
            </div>
            {tx.riskDecision && (
              <RiskBadge decision={tx.riskDecision} score={tx.riskScore} />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-gray-400 text-[10px] uppercase font-semibold">Risk Decision</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{tx.riskDecision || 'NOT_EVALUATED'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-gray-400 text-[10px] uppercase font-semibold">Total Risk Score</span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{tx.riskScore ?? '—'} / 100</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
              <span className="text-gray-400 text-[10px] uppercase font-semibold">Authorization Mode</span>
              <p className="text-sm font-bold text-teal-700 mt-0.5">Automated Gate</p>
            </div>
          </div>

          {tx.riskExplanation && (
            <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-gray-600 block">Identified Factors:</span>
              <p className="text-gray-700 leading-relaxed">{tx.riskExplanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Request Payment Refund</h3>
            <p className="text-xs text-gray-500 mb-4">
              Refunds are verified against captured amount. Supports simulated fallbacks in Razorpay test mode.
            </p>

            <form onSubmit={handleRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Refund Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={tx.amount / 100}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Max refundable: {formatCurrency(tx.amount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {refunding ? <LoadingSpinner size="sm" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  <span>{refunding ? 'Processing...' : 'Confirm Refund'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

