import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, ShieldCheck, QrCode } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { CreateOrderResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from '../components/LoadingSpinner';
import RiskBadge from '../components/RiskBadge';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const LOCATIONS = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Pune',
  'Ahmedabad',
];

export default function PaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('500');
  const [description, setDescription] = useState('UPI Test Payment');
  const [location, setLocation] = useState('Mumbai');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState<CreateOrderResponse | null>(null);
  const [step, setStep] = useState<'form' | 'risk_result' | 'checkout' | 'done'>('form');

  // Simulated Modal State
  const [showSimModal, setShowSimModal] = useState(false);
  const [simUpiId, setSimUpiId] = useState('success@razorpay');

  // Idempotency key preserved across retry/double click
  const idempotencyKey = useRef(uuidv4());

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 1) {
        setError('Minimum transaction amount is ₹1.00');
        setLoading(false);
        return;
      }

      const amountInPaise = Math.round(parsedAmount * 100);

      const result = await paymentService.createOrder(
        amountInPaise,
        description,
        location || undefined,
        idempotencyKey.current
      );

      setOrderResult(result);
      setStep('risk_result');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payment order');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRazorpay = () => {
    if (!orderResult?.razorpayOrderId) {
      setError('Missing Razorpay checkout configuration');
      return;
    }

    // If using placeholder credentials, open the in-app interactive Razorpay UPI simulator
    if (!orderResult.razorpayKeyId || orderResult.razorpayKeyId.includes('placeholder')) {
      setShowSimModal(true);
      return;
    }

    // Otherwise load official Razorpay Standard Checkout SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      const options = {
        key: orderResult.razorpayKeyId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: 'PayShield UPI',
        description: description || 'Payment Authorization',
        order_id: orderResult.razorpayOrderId,
        handler: async (response: any) => {
          setLoading(true);
          try {
            await paymentService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setStep('done');
            setTimeout(() => {
              navigate(`/transactions/${orderResult.transactionId}`);
            }, 2000);
          } catch (verifyErr: any) {
            setError(verifyErr.response?.data?.message || 'Payment signature verification failed');
            setStep('risk_result');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.fullName || 'Test Customer',
          email: user?.email || 'customer@payshield.com',
          contact: '9999999999',
        },
        notes: {
          transactionId: orderResult.transactionId,
          simulatedLocation: location,
        },
        theme: {
          color: '#1a2f6a',
        },
        modal: {
          ondismiss: () => {
            setStep('risk_result');
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setError(`Payment failed at gateway: ${resp.error.description}`);
          setStep('risk_result');
        });
        rzp.open();
        setStep('checkout');
      } catch (err: any) {
        setError(`Failed to open Razorpay modal: ${err.message}`);
        setShowSimModal(true);
      }
    };

    script.onerror = () => {
      // If CDN is unavailable or blocked, open in-app simulator
      setShowSimModal(true);
    };

    document.body.appendChild(script);
  };

  const handleSimulatedPayment = async () => {
    if (!orderResult) return;
    setLoading(true);
    setError('');

    if (simUpiId === 'failure@razorpay') {
      setError('Payment simulation: Bank / UPI declined transaction (failure@razorpay)');
      setShowSimModal(false);
      setLoading(false);
      return;
    }

    try {
      const simulatedPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 12);
      await paymentService.verifyPayment(
        orderResult.razorpayOrderId!,
        simulatedPaymentId,
        'simulated_signature'
      );
      setShowSimModal(false);
      setStep('done');
      setTimeout(() => {
        navigate(`/transactions/${orderResult.transactionId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment verification failed');
      setShowSimModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    idempotencyKey.current = uuidv4();
    setOrderResult(null);
    setStep('form');
    setError('');
    setShowSimModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Initiate UPI Payment</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Transactions are evaluated by PayShield's rule-based risk assessment engine before entering Razorpay TEST checkout.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {step === 'form' && (
          <form onSubmit={handleCreateOrder} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-2.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a2f6a] transition-all"
                  placeholder="500.00"
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1.5">
                <span>Min: ₹1.00</span>
                <span>Elevated threshold: &gt; ₹5,000 | High risk: &gt; ₹20,000</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Payment Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2f6a] transition-all"
                placeholder="e.g. Utility Bill, Software Subscription"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Simulated Location (Geographic Risk Rule)
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2f6a] bg-white transition-all"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Changing location relative to recent activity simulates a geographic anomaly risk flag.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Quick Test Scenarios:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setAmount('500'); setLocation('Mumbai'); }}
                  className="p-2 border border-green-200 bg-green-50/60 hover:bg-green-100/70 rounded-lg text-left transition-colors"
                >
                  <p className="text-xs font-bold text-green-900">₹500 (Low Risk)</p>
                  <p className="text-[10px] text-green-700">Triggers APPROVED</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setAmount('8000'); setLocation('Mumbai'); }}
                  className="p-2 border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 rounded-lg text-left transition-colors"
                >
                  <p className="text-xs font-bold text-amber-900">₹8,000 (Elevated)</p>
                  <p className="text-[10px] text-amber-700">Elevated threshold</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setAmount('25000'); setLocation('Kolkata'); }}
                  className="p-2 border border-red-200 bg-red-50/60 hover:bg-red-100/70 rounded-lg text-left transition-colors"
                >
                  <p className="text-xs font-bold text-red-900">₹25,000 (High Risk)</p>
                  <p className="text-[10px] text-red-700">Triggers DECLINED</p>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-semibold">Idempotency & Fraud Engine Active</p>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Every order creation checks for duplicate requests and evaluates velocity, amount anomalies, failure rates, and geographic variance.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a2f6a] hover:bg-[#253f88] text-white font-semibold py-3 rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-teal-300" />
              )}
              <span>{loading ? 'Evaluating Risk & Creating Order...' : 'Evaluate Risk & Proceed'}</span>
            </button>
          </form>
        )}

        {/* Step: Risk Assessment Result */}
        {step === 'risk_result' && orderResult && (
          <div className="space-y-6">
            <div className="text-center py-2">
              {orderResult.riskDecision === 'APPROVED' ? (
                <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle className="h-9 w-9 text-green-600" />
                </div>
              ) : orderResult.riskDecision === 'REVIEW_REQUIRED' ? (
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <AlertTriangle className="h-9 w-9 text-amber-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <XCircle className="h-9 w-9 text-red-600" />
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                Risk Engine Decision: {orderResult.riskDecision}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Calculated Risk Score: {orderResult.riskScore} / 100
              </p>
            </div>

            {/* Assessment Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Transaction ID</span>
                <span className="font-mono text-gray-700">{orderResult.transactionId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Amount</span>
                <span className="font-bold text-gray-900 text-sm">₹{(orderResult.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Status</span>
                <span className="font-semibold text-gray-800">{orderResult.status}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Decision</span>
                <RiskBadge decision={orderResult.riskDecision} score={orderResult.riskScore} />
              </div>
            </div>

            {/* Risk Factors / Explanations */}
            {orderResult.riskExplanation && (
              <div className={`p-4 rounded-xl border text-xs ${
                orderResult.riskDecision === 'APPROVED'
                  ? 'bg-green-50/70 border-green-200 text-green-900'
                  : orderResult.riskDecision === 'REVIEW_REQUIRED'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  <span>Risk Evaluation Notes:</span>
                </p>
                <p className="leading-relaxed">{orderResult.riskExplanation}</p>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {error}
              </div>
            )}

            {/* Actions depending on Decision */}
            {orderResult.riskDecision === 'APPROVED' ? (
              <div className="space-y-4">
                <div className="bg-teal-50/80 border border-teal-200 p-4 rounded-xl text-xs text-teal-950 space-y-1">
                  <p className="font-bold">Ready for Razorpay Test Mode Checkout</p>
                  <p className="text-[11px] text-teal-900 leading-relaxed">
                    Select <strong>UPI</strong> in checkout and enter supported test IDs:
                  </p>
                  <ul className="list-disc list-inside mt-1 font-mono text-[11px]">
                    <li><strong className="text-green-700">success@razorpay</strong> for payment verification test</li>
                    <li><strong className="text-red-700">failure@razorpay</strong> for payment failure simulation</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleOpenRazorpay}
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Open Razorpay UPI Checkout</span>
                </button>
              </div>
            ) : orderResult.riskDecision === 'REVIEW_REQUIRED' ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 text-center space-y-2">
                <p className="font-bold">Transaction Queued for Administrative Review</p>
                <p className="text-[11px] text-amber-800">
                  Because this transaction flagged elevated risk thresholds, direct checkout has been halted. An administrator can review it in the Admin Dashboard.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-900 text-center space-y-2">
                <p className="font-bold">Transaction Declined by Risk Engine</p>
                <p className="text-[11px] text-red-800">
                  No gateway order was created due to high fraud/anomaly risk score.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
              <span>Initiate Another Transaction</span>
            </button>
          </div>
        )}

        {/* Step: Checkout in progress */}
        {step === 'checkout' && (
          <div className="py-12 text-center space-y-3">
            <LoadingSpinner size="lg" text="Razorpay Modal Active..." />
            <p className="text-xs text-gray-500">
              Please complete or close the Razorpay payment window.
            </p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="py-12 text-center space-y-3">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Payment Successfully Verified!</h2>
            <p className="text-xs text-gray-500">
              HMAC SHA-256 signature verified by backend. Redirecting to receipt...
            </p>
          </div>
        )}
      </div>

      {/* Simulated UPI Checkout Modal (Active in local test mode with placeholder keys) */}
      {showSimModal && orderResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-[#1a2f6a] rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Razorpay UPI Checkout (TEST MODE)</h3>
                  <p className="text-[10px] text-gray-400">Order: {orderResult.razorpayOrderId}</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-gray-900">
                ₹{(orderResult.amount / 100).toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Enter Test Virtual Payment Address (VPA / UPI ID)
              </label>
              <input
                type="text"
                value={simUpiId}
                onChange={(e) => setSimUpiId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a2f6a]"
                placeholder="vpa@razorpay"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSimUpiId('success@razorpay')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    simUpiId === 'success@razorpay'
                      ? 'bg-green-100 border-green-400 text-green-900'
                      : 'bg-green-50/50 border-green-200 text-green-800 hover:bg-green-100/50'
                  }`}
                >
                  ✓ success@razorpay
                </button>
                <button
                  type="button"
                  onClick={() => setSimUpiId('failure@razorpay')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    simUpiId === 'failure@razorpay'
                      ? 'bg-red-100 border-red-400 text-red-900'
                      : 'bg-red-50/50 border-red-200 text-red-800 hover:bg-red-100/50'
                  }`}
                >
                  ✗ failure@razorpay
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-gray-600 flex items-start gap-2">
              <QrCode className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>
                Simulates Razorpay test checkout authorization. The payment response is sent to the backend for server-side HMAC verification before capturing.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatedPayment}
                disabled={loading}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {loading ? <LoadingSpinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
                <span>Pay ₹{(orderResult.amount / 100).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
