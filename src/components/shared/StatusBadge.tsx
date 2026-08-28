import React from 'react';

export type StatusType =
  | 'Active'
  | 'Inactive'
  | 'Stop_Usage'
  | 'Phase_Out'
  | 'Testing'
  | 'Draft'
  | 'Confirmed'
  | 'Pending'
  | 'Urgent'
  | 'Critical'
  | 'Normal'
  | 'Warning'
  | 'Success';

export interface StatusBadgeProps {
  status: string;
  variant?: 'solid' | 'outline' | 'subtle';
  size?: 'xs' | 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Stop_Usage: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Phase_Out: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Testing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Inactive: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  Draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Urgent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  Normal: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'subtle',
  size = 'xs',
  onClick,
  className = '',
}) => {
  const color = STATUS_COLORS[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const sizeCls = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const cursorCls = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-bold font-mono rounded-full border ${color.bg} ${color.text} ${color.border} ${sizeCls} ${cursorCls} ${className}`}
    >
      {status}
    </span>
  );
};
