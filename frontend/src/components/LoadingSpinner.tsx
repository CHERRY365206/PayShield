import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ size = 'md', className = '', text }: Props) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }[size];

  return (
    <div className={`flex flex-col justify-center items-center gap-2 ${className}`}>
      <div className={`animate-spin rounded-full border-gray-200 border-t-[#1a2f6a] ${sizeClass}`} />
      {text && <p className="text-xs text-gray-500 font-medium">{text}</p>}
    </div>
  );
}
