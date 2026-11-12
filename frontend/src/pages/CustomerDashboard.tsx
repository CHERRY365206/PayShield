import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, TrendingUp, CheckCircle, XCircle, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getTransactions(0, 20)
      .then((r) => setTransactions(r.content || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: transactions.length,
    success: transactions.filter((t) => ['CAPTURED', 'VERIFIED', 'SUCCESS'].includes(t.status)).length,
    failed: transactions.filter((t) => ['FAILED', 'REJECTED', 'CANCELLED'].includes(t.status)).length,
    pending: transactions.filter((t) => ['PENDING_REVIEW', 'ORDER_CREATED', 'CHECKOUT'].includes(t.status)).length,
    volume: transactions
      .filter((t) => ['CAPTURED', 'VERIFIED', 'SUCCESS'].includes(t.status))
      .reduce((s, t) => s + (t.amount || 0), 0),
  };

  // Build daily data for last 7 days chart
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const dayTransactions = transactions.filter((t) => {
      const txDate = new Date(t.createdAt);
      return txDate.toDateString() === d.toDateString();
    });
    const amountInRupees = dayTransactions
      .filter((t) => ['CAPTURED', 'VERIFIED', 'SUCCESS'].includes(t.status))
      .reduce((s, t) => s + t.amount / 100, 0);

    return {
      day: dayLabel,
      transactions: dayTransactions.length,
      volume: Math.round(amountInRupees),
    };
  });

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1a2f6a] to-[#254699] rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
            Verified Customer
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.fullName || 'Customer'}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Authorize UPI transactions, evaluate real-time fraud risks, and monitor your payment activity.
          </p>
        </div>
        <Link
          to="/pay"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
        >
          <CreditCard className="h-4 w-4" />
          <span>Initiate Payment</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total</span>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-[11px] text-gray-400 mt-1">Simulated payments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Success</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.success}</p>
          <p className="text-[11px] text-gray-400 mt-1">Verified & captured</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Failed</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          <p className="text-[11px] text-gray-400 mt-1">Rejected / declined</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-[11px] text-gray-400 mt-1">Pending action</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Volume</span>
            <TrendingUp className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-xl font-bold text-teal-700">{formatCurrency(stats.volume)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Captured total</p>
        </div>
      </div>

      {/* Main Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Payment Activity</h2>
              <p className="text-xs text-gray-400">Transactions over the last 7 days</p>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              7-Day Trend
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: any, name: string) => [val, name === 'transactions' ? 'Transactions' : 'Volume (₹)']}
                />
                <Bar dataKey="transactions" fill="#1a2f6a" radius={[4, 4, 0, 0]} name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Recent Transactions</h2>
              <Link to="/transactions" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">No transactions recorded yet.</p>
                <Link to="/pay" className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block">
                  Make your first payment &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-slate-50/80 transition-all flex items-center justify-between block"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(tx.amount)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={tx.status} />
                      {tx.riskDecision && (
                        <RiskBadge decision={tx.riskDecision} score={tx.riskScore} />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link
              to="/pay"
              className="text-xs font-semibold text-[#1a2f6a] hover:underline"
            >
              + Create New UPI Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
