import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = (type: 'customer' | 'admin') => {
    if (type === 'customer') {
      setEmail('customer@payshield.com');
      setPassword('Customer@123');
    } else {
      setEmail('admin@payshield.com');
      setPassword('Admin@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      login(data);
      navigate(data.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c183a] via-[#1a2f6a] to-[#12234e] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Shield className="h-8 w-8 text-[#1a2f6a]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PayShield</h1>
          <p className="text-gray-500 text-xs mt-1 font-medium">UPI Payment Authorization & Risk Platform</p>
        </div>

        {/* Demo Credentials Helper */}
        <div className="mb-5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
          <p className="font-semibold text-blue-950 mb-1.5 flex items-center gap-1">
            <span>⚡ Quick Demo Credentials</span>
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleFillDemo('customer')}
              className="flex-1 bg-white hover:bg-blue-100/60 text-blue-900 border border-blue-200 py-1.5 px-2.5 rounded-lg font-medium text-xs transition-colors text-center"
            >
              Fill Customer
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="flex-1 bg-white hover:bg-blue-100/60 text-blue-900 border border-blue-200 py-1.5 px-2.5 rounded-lg font-medium text-xs transition-colors text-center"
            >
              Fill Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2f6a] focus:border-transparent transition-all"
              placeholder="user@payshield.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2f6a] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a2f6a] hover:bg-[#253f88] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 shadow-md flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#1a2f6a] font-semibold hover:underline">
            Register Customer
          </Link>
        </p>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <span className="text-[11px] text-gray-400">
            Powered by Razorpay Standard Checkout in TEST MODE
          </span>
        </div>
      </div>
    </div>
  );
}
