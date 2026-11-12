import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User, LayoutDashboard, CreditCard, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#1a2f6a] text-white shadow-md border-b border-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-1.5 bg-teal-500/20 rounded-lg border border-teal-400/30">
              <Shield className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">PayShield</span>
              <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-blue-800/80 text-blue-200 rounded font-semibold">Test Mode</span>
            </div>
          </Link>

          {user && (
            <div className="flex items-center space-x-4">
              {isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-blue-100 hover:text-white hover:bg-blue-800/50 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/transactions"
                    className="px-3 py-1.5 rounded-lg text-sm text-blue-100 hover:text-white hover:bg-blue-800/50 transition-colors"
                  >
                    All Transactions
                  </Link>
                  <Link
                    to="/admin/flagged"
                    className="px-3 py-1.5 rounded-lg text-sm text-amber-300 hover:text-white hover:bg-amber-900/40 transition-colors font-medium"
                  >
                    Flagged
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    className="px-3 py-1.5 rounded-lg text-sm text-blue-100 hover:text-white hover:bg-blue-800/50 transition-colors"
                  >
                    Audit Logs
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm text-blue-100 hover:text-white hover:bg-blue-800/50 transition-colors"
                  >
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/pay"
                    className="flex items-center space-x-1.5 bg-teal-500 hover:bg-teal-600 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Pay Now</span>
                  </Link>
                  <Link
                    to="/transactions"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm text-blue-100 hover:text-white hover:bg-blue-800/50 transition-colors"
                  >
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </Link>
                </>
              )}

              <div className="flex items-center space-x-3 pl-4 border-l border-blue-800/80">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-semibold text-teal-300">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium leading-none text-white">{user.fullName}</p>
                    <p className="text-[10px] text-blue-300 leading-tight mt-0.5">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-blue-200 hover:text-red-400 hover:bg-blue-800/50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
