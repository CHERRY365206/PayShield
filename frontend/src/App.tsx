import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './layouts/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import PaymentPage from './pages/PaymentPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/pay" element={<PaymentPage />} />
              <Route path="/transactions" element={<TransactionHistoryPage />} />
              <Route path="/transactions/:id" element={<TransactionDetailPage />} />

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                <Route path="/admin/flagged" element={<AdminTransactionsPage flaggedOnly />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Default Redirection */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
