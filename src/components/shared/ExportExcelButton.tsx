import React from 'react';
import { FileDown, Download } from 'lucide-react';

export interface ExportExcelButtonProps {
  onClick: () => void;
  rowCount?: number;
  label?: string;
  variant?: 'primary' | 'secondary' | 'template';
  disabled?: boolean;
  className?: string;
}

export const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  onClick,
  rowCount,
  label = 'T?i Data Excel',
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  if (variant === 'template') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="T?i template Excel m?u"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>T?i Template</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Xu?t d? li?u ra file Excel"
    >
      <FileDown className="w-3.5 h-3.5 text-blue-600" />
      <span>
        {label}
        {rowCount !== undefined ? ` (${rowCount})` : ''}
      </span>
    </button>
  );
};
