import React from 'react';
import { getRiskBadge } from '../utils/formatters';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface Props {
  decision: string;
  score?: number;
  className?: string;
}

export default function RiskBadge({ decision, score, className = '' }: Props) {
  const badge = getRiskBadge(decision);

  const renderIcon = () => {
    switch (decision) {
      case 'APPROVED':
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case 'REVIEW_REQUIRED':
        return <ShieldAlert className="h-3.5 w-3.5" />;
      case 'DECLINED':
        return <ShieldX className="h-3.5 w-3.5" />;
      default:
        return <ShieldAlert className="h-3.5 w-3.5" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge} ${className}`}>
      {renderIcon()}
      <span>{decision ? decision.replace(/_/g, ' ') : 'PENDING'}</span>
      {score !== undefined && score !== null && (
        <span className="font-mono text-[11px] opacity-80">({score})</span>
      )}
    </span>
  );
}

