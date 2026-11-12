import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Shield, FileText, ArrowUpRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { DashboardStats } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Loading admin telemetry..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-16 text-center text-gray-500 text-sm">
        Failed to fetch administrative metrics. Ensure your session has ROLE_ADMIN.
      </div>
    );
  }

  const riskPieData = [
    { name: 'Approved', value: stats.riskDistribution.approved, color: '#10b981' },
    { name: 'Review Req', value: stats.riskDistribution.reviewRequired, color: '#f59e0b' },
    { name: 'Declined', value: stats.riskDistribution.declined, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Success', count: stats.successfulTransactions, fill: '#10b981' },
    { name: 'Failed', count: stats.failedTransactions, fill: '#ef4444' },
    { name: 'In Review', count: stats.pendingTransactions, fill: '#f59e0b' },
    { name: 'Declined', count: stats.declinedTransactions, fill: '#dc2626' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#1a2f6a] text-white rounded-lg">
              <Shield className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Oversight & Transaction Monitoring</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Global payment telemetry, real-time fraud heuristics, and auditability log viewer.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/flagged"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Review Flagged ({stats.flaggedTransactions})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{stats.totalTransactions}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">All registered transactions</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-extrabold text-green-600">
            {stats.successRate.toFixed(1)}%
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">Verified signature capture</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Volume</span>
            <span className="text-xs font-bold text-teal-600">INR</span>
          </div>
          <p className="text-2xl font-extrabold text-teal-700">
            {formatCurrency(stats.totalVolumeInPaise)}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">Captured test currency</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Flagged High-Risk</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{stats.flaggedTransactions}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Requires manual audit</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Transaction Status Distribution</h2>
              <p className="text-xs text-gray-400">Total volume across terminal states</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Classification Pie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Risk Engine Classification</h2>
              <p className="text-xs text-gray-400">Approved vs Review Required vs Declined</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {riskPieData.length === 0 ? (
              <p className="text-xs text-gray-400">No classified transactions yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/transactions"
          className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">All Transactions Ledger</h3>
            <p className="text-xs text-gray-500 mt-1">
              Inspect complete transaction records across all users with Razorpay order mappings.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 mt-4 block">
            {stats.totalTransactions} Total Records &rarr;
          </span>
        </Link>

        <Link
          to="/admin/flagged"
          className="p-5 bg-white rounded-2xl border border-amber-200/80 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group flex flex-col justify-between bg-amber-50/20"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Flagged Risk Queue</h3>
            <p className="text-xs text-gray-500 mt-1">
              Transactions triggered by velocity anomalies, amount thresholds, or failure cascades.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-700 mt-4 block">
            {stats.flaggedTransactions} Requiring Review &rarr;
          </span>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <FileText className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Audit Logs</h3>
            <p className="text-xs text-gray-500 mt-1">
              Immutable security event logs tracking authorization decisions, verifications, and refunds.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-700 mt-4 block">
            View System Log Stream &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}

