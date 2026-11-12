import React from 'react';
import { getStatusColor } from '../utils/formatters';

interface Props {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const color = getStatusColor(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}>
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
}
