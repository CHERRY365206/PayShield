export function formatCurrency(paise: number): string {
  if (isNaN(paise) || paise === null || paise === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return isoString;
  }
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    CAPTURED: 'text-green-700 bg-green-50 border border-green-200',
    VERIFIED: 'text-green-700 bg-green-50 border border-green-200',
    SUCCESS: 'text-green-700 bg-green-50 border border-green-200',
    FAILED: 'text-red-700 bg-red-50 border border-red-200',
    REJECTED: 'text-red-700 bg-red-50 border border-red-200',
    CANCELLED: 'text-gray-700 bg-gray-100 border border-gray-200',
    PENDING_REVIEW: 'text-amber-800 bg-amber-50 border border-amber-200',
    ORDER_CREATED: 'text-blue-700 bg-blue-50 border border-blue-200',
    CHECKOUT: 'text-blue-700 bg-blue-50 border border-blue-200',
    CREATED: 'text-gray-700 bg-gray-50 border border-gray-200',
    RISK_EVALUATION: 'text-purple-700 bg-purple-50 border border-purple-200',
    REFUNDED: 'text-indigo-700 bg-indigo-50 border border-indigo-200',
  };
  return map[status] || 'text-gray-700 bg-gray-50 border border-gray-200';
}

export function getRiskBadge(decision: string): string {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800 border border-green-200',
    REVIEW_REQUIRED: 'bg-amber-100 text-amber-800 border border-amber-200',
    DECLINED: 'bg-red-100 text-red-800 border border-red-200',
  };
  return map[decision] || 'bg-gray-100 text-gray-800 border border-gray-200';
}

